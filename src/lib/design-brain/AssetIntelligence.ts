/**
 * AssetIntelligence.ts — Image Art Direction (13) + Asset Intelligence (14)
 */

import type { ArtDirectionPlan, ImageRequirement, DesignDirection, SectionRole, DesignIssue } from './types';
import { mkIssue } from './CompositionEngines';
import { emitObservability } from './Observability';

interface AssetSectionInput {
  role: SectionRole;
  label: string;
  hasImage: boolean;
  imageQuery?: string;
}

export function planArtDirection(
  sections: AssetSectionInput[],
  direction: DesignDirection,
  industry: string,
  mediaNeeds: string[],
): ArtDirectionPlan {
  emitObservability('decision', 'art-direction', `Planning art direction for ${sections.length} sections`);
  const requirements: ImageRequirement[] = [];
  const issues: DesignIssue[] = [];

  for (const s of sections) {
    if (!shouldHaveImage(s.role) && !s.hasImage) continue;
    if (!shouldHaveImage(s.role) && s.hasImage) {
      issues.push(mkIssue('LOW', 'imagery', s.role, 'Image on section that typically doesn\'t need one', 'Remove or justify decorative image', 'suggest', 'image serves a role', 'remove_node', {}));
      continue;
    }

    const req = buildRequirement(s, direction, industry, mediaNeeds);
    requirements.push(req);

    if (s.hasImage && !s.imageQuery) {
      issues.push(mkIssue('MEDIUM', 'imagery', s.role, 'Image slot without search subject', `Set query from art direction: "${req.searchQuery}"`, 'auto', 'every image has query + role', 'update_node_props', {}));
    }
  }

  return { requirements, issues };
}

function shouldHaveImage(role: SectionRole): boolean {
  return ['hero', 'about', 'gallery', 'team', 'portfolio', 'products', 'services'].includes(role);
}

function buildRequirement(
  s: AssetSectionInput,
  direction: DesignDirection,
  industry: string,
  mediaNeeds: string[],
): ImageRequirement {
  const base = {
    id: `img-${s.role}`,
    sectionRole: s.role,
    crop: 'center' as string,
    placement: 'section-background-or-inline' as string,
    visualTone: direction.mood,
    colorRelationship: direction.colorDirection,
    backgroundRelationship: 'harmonize with section background; avoid busy ground under text',
    searchQuery: s.imageQuery || defaultQuery(s.role, industry, direction),
  };

  switch (s.role) {
    case 'hero':
      return {
        ...base,
        imageType: 'hero',
        subject: mediaNeeds[0] || `${industry} hero`,
        composition: 'rule-of-thirds, clear focal point, negative space for headline',
        focalPoint: 'off-center to leave headline safe area',
        aspectRatio: '16:9 desktop / 4:5 mobile crop',
        crop: 'desktop full-bleed; mobile tighten to subject',
        placement: 'background with overlay OR split layout',
      };
    case 'about':
      return {
        ...base,
        imageType: 'feature',
        subject: mediaNeeds[1] || 'team or workspace',
        composition: 'authentic mid-shot, eye contact if people',
        focalPoint: 'faces or primary object',
        aspectRatio: '4:3 or 1:1',
        placement: 'inline beside text (desktop), above text (mobile)',
      };
    case 'gallery':
    case 'portfolio':
      return {
        ...base,
        imageType: 'gallery',
        subject: mediaNeeds[2] || `${industry} work`,
        composition: 'consistent set lighting and grade',
        focalPoint: 'per-image subject',
        aspectRatio: 'mixed 4:3 / 1:1 with uniform treatment',
        placement: 'grid',
      };
    case 'team':
      return {
        ...base,
        imageType: 'team',
        subject: 'team members',
        composition: 'consistent portrait style or candid set',
        focalPoint: 'face',
        aspectRatio: '1:1 portraits',
        placement: 'card grid',
      };
    case 'products':
      return {
        ...base,
        imageType: 'product',
        subject: mediaNeeds[0] || 'product hero shots',
        composition: 'consistent background, centered or 3/4 view',
        focalPoint: 'product',
        aspectRatio: '1:1 catalog standard',
        placement: 'product card grid',
      };
    default:
      return {
        ...base,
        imageType: 'feature',
        subject: `${s.label} supporting visual`,
        composition: 'supporting, never competing with headline',
        focalPoint: 'secondary',
        aspectRatio: '4:3',
        placement: 'inline',
      };
  }
}

function defaultQuery(role: SectionRole, industry: string, direction: DesignDirection): string {
  const tone = direction.visualStyle;
  switch (role) {
    case 'hero': return `${industry} ${tone} professional`;
    case 'about': return `${industry} team workplace`;
    case 'gallery': return `${industry} gallery`;
    default: return `${industry} ${role}`;
  }
}

// ── Asset role matching (section 14) ────────────────────────────────

export interface AssetCandidate {
  id: string;
  source: 'my-assets' | 'solospot-library' | 'shutterstock' | 'pexels' | 'pixabay';
  url: string;
  tags: string[];
  dominantColors?: string[];
  orientation?: 'landscape' | 'portrait' | 'square';
}

export interface AssetMatchReport {
  selected: AssetCandidate | null;
  score: number;
  reasons: string[];
  rejected: Array<{ id: string; reason: string }>;
}

export function matchAssetToDirection(
  candidates: AssetCandidate[],
  req: ImageRequirement,
  direction: DesignDirection,
): AssetMatchReport {
  const reasons: string[] = [];
  const rejected: Array<{ id: string; reason: string }> = [];
  let best: AssetCandidate | null = null;
  let bestScore = 0;

  const wantedOrient = req.aspectRatio.startsWith('16:9') || req.aspectRatio.startsWith('4:3')
    ? 'landscape' : req.aspectRatio.startsWith('4:5') ? 'portrait' : 'square';

  for (const c of candidates) {
    let score = 0;
    const tagText = c.tags.join(' ').toLowerCase();
    for (const word of req.searchQuery.toLowerCase().split(/\s+/)) {
      if (word.length > 3 && tagText.includes(word)) score += 2;
    }
    if (c.orientation === wantedOrient) { score += 3; reasons.push(`${c.id}: orientation ${c.orientation} matches ${req.aspectRatio}`); }
    else if (c.orientation) { score -= 1; }

    // Palette harmony soft check
    if (c.dominantColors?.length) {
      const harmony = paletteHarmony(c.dominantColors, direction.colorDirection);
      score += harmony;
      if (harmony < 0) rejected.push({ id: c.id, reason: 'dominant colors fight DesignDirection palette' });
    }

    if (score > bestScore) { bestScore = score; best = c; }
  }

  if (best) reasons.push(`Selected ${best.id} from ${best.source} (score=${bestScore})`);
  else reasons.push('No viable candidate — honest empty (no random pick)');

  return { selected: bestScore > 0 ? best : null, score: bestScore, reasons, rejected };
}

function paletteHarmony(colors: string[], directionHint: string): number {
  const warm = directionHint.toLowerCase().includes('warm') || directionHint.toLowerCase().includes('earth');
  const dark = directionHint.toLowerCase().includes('dark');
  let score = 0;
  for (const hex of colors.slice(0, 3)) {
    const parsed = parseHex(hex);
    if (!parsed) continue;
    const { r, g, b } = parsed;
    const isWarm = r > g && r > b;
    const brightness = (r + g + b) / 3;
    if (warm && isWarm) score += 1;
    if (warm && !isWarm) score -= 1;
    if (dark && brightness > 180) score -= 1;
    if (!dark && brightness < 60) score -= 1;
  }
  return score;
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace('#', '');
  if (m.length !== 6) return null;
  return { r: parseInt(m.slice(0, 2), 16), g: parseInt(m.slice(2, 4), 16), b: parseInt(m.slice(4, 6), 16) };
}
