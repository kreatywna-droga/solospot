/**
 * CompositionEngines.ts — Visual Composition (5), Design Consistency (6),
 * Compatibility (8), Component Composition (24), Anti-Generic (25).
 */

import type {
  CompositionAnalysis, DesignIssue, DesignConstitution, ConsistencyReport,
  ConsistencyIssue, DesignDirection, DesignIssueSeverity,
} from './types';
import { emitObservability } from './Observability';

// ── Visual Composition Engine (section 5) ───────────────────────────

export interface CompositionInput {
  sectionCount: number;
  headingSizes: number[];
  hasHero: boolean;
  heroImage: boolean;
  ctaCount: number;
  imageCount: number;
  textBlockCount: number;
  gridSections: number;
  centeredSections: number;
  averagePaddingPx: number;
  fontSizes: number[];
}

export function analyzeComposition(input: CompositionInput): CompositionAnalysis {
  emitObservability('decision', 'composition', `Analyzing composition sections=${input.sectionCount}`);

  const issues: DesignIssue[] = [];
  const recommendations: string[] = [];

  // Hierarchy
  const maxHeading = Math.max(0, ...input.headingSizes);
  const hierarchy: CompositionAnalysis['hierarchy'] =
    maxHeading >= 40 ? 'strong' : maxHeading >= 28 ? 'adequate' : 'weak';
  if (hierarchy === 'weak') {
    issues.push(mkIssue('HIGH', 'hierarchy', 'page', `Max heading ${maxHeading}px too small for focal hierarchy`, 'Increase hero/section heading scale', 'auto', 'heading size ≥ 40px', 'set_node_styles', { nodeId: 'hero', styles: { fontSize: '48px' } }));
    recommendations.push('Utwórz wyraźną skalę nagłówków (H1 ≥ 40px)');
  }

  // Focal point
  const focalPoint: CompositionAnalysis['focalPoint'] =
    input.hasHero && (input.heroImage || maxHeading >= 40) ? 'clear'
      : input.hasHero ? 'ambiguous' : 'missing';
  if (focalPoint !== 'clear') {
    issues.push(mkIssue(focalPoint === 'missing' ? 'BLOCKING' : 'MEDIUM', 'composition', 'hero', `Focal point ${focalPoint}`, 'Add hero with strong headline + visual', 'suggest', 'hero present with dominant headline/image', 'insert_section', {}));
    recommendations.push('Hero musi mieć jeden dominujący element (typografia lub obraz)');
  }

  // CTA
  if (input.ctaCount === 0) {
    issues.push(mkIssue('BLOCKING', 'ux', 'page', 'No CTA found', 'Add primary CTA in hero + footer', 'auto', '≥1 CTA', 'insert_section', {}));
    recommendations.push('Brak CTA — dodaj wezwanie do działania');
  } else if (input.ctaCount > 6) {
    issues.push(mkIssue('LOW', 'ux', 'page', `${input.ctaCount} CTAs — decision fatigue risk`, 'Reduce to primary + one secondary per viewport', 'suggest', '≤4 distinct CTAs', 'update_node_props', {}));
  }

  // Whitespace / density
  const density: CompositionAnalysis['density'] =
    input.averagePaddingPx >= 64 ? 'balanced'
      : input.averagePaddingPx >= 40 ? 'dense'
        : input.textBlockCount > 8 ? 'overcrowded' : 'sparse';
  if (density === 'overcrowded' || density === 'sparse') {
    issues.push(mkIssue(density === 'overcrowded' ? 'MEDIUM' : 'LOW', 'visual-density', 'page', `Density=${density} (avg padding ${input.averagePaddingPx}px)`, density === 'overcrowded' ? 'Increase section padding to 64–96px' : 'Reduce empty padding, add content rhythm', 'auto', 'padding 64–96px, density balanced', 'set_node_styles', {}));
    recommendations.push(density === 'overcrowded' ? 'Zwiększ odstępy między sekcjami' : 'Zmniejsz puste przestrzenie lub dodaj treść');
  }

  // Alignment / centered abuse
  const centeredRatio = input.sectionCount > 0 ? input.centeredSections / input.sectionCount : 0;
  const alignment: CompositionAnalysis['alignment'] = centeredRatio > 0.7 ? 'inconsistent' : centeredRatio > 0.5 ? 'mostly' : 'consistent';
  if (alignment === 'inconsistent') {
    issues.push(mkIssue('LOW', 'alignment', 'page', `${Math.round(centeredRatio * 100)}% sections centered`, 'Vary alignment — left-align content-heavy sections', 'suggest', 'centered ratio ≤ 50%', 'set_node_styles', {}));
    recommendations.push('Nadmierne centrowanie — urozmaicaj wyrównanie');
  }

  // Rhythm via padding variance
  const rhythm: CompositionAnalysis['rhythm'] = input.sectionCount >= 3 ? 'regular' : 'varied';

  const balance: CompositionAnalysis['balance'] =
    input.imageCount === 0 && input.textBlockCount > 4 ? 'unbalanced'
      : input.imageCount > input.textBlockCount * 2 ? 'slight-skew' : 'balanced';
  if (balance === 'unbalanced') {
    issues.push(mkIssue('MEDIUM', 'composition', 'page', 'Text-heavy, image-starved layout', 'Introduce supporting imagery or visual breaks', 'suggest', 'images accompany major text zones', 'insert_node', {}));
    recommendations.push('Dodaj obrazy/visual breaks do stref tekstowych');
  }

  const visualWeight: CompositionAnalysis['visualWeight'] =
    input.heroImage && input.sectionCount > 5 ? 'top-heavy' : 'even';

  return {
    hierarchy, balance, alignment, visualWeight,
    whitespace: density === 'balanced' ? 'adequate' : density === 'sparse' ? 'generous' : density === 'overcrowded' ? 'tight' : 'adequate',
    density, focalPoint, rhythm,
    issues, recommendations,
  };
}

// ── Design Consistency Engine (section 6) ───────────────────────────

export function buildConstitution(direction: DesignDirection, ds: {
  primaryColor: string; secondaryColor: string; backgroundColor: string; textColor: string;
  headingFont: string; bodyFont: string; borderRadius: string;
}): DesignConstitution {
  return {
    typography: {
      headingFont: ds.headingFont,
      bodyFont: ds.bodyFont,
      scale: direction.density === 'rich' ? 'extended' : direction.density === 'lean' ? 'compact' : 'standard',
    },
    colors: {
      primary: ds.primaryColor,
      secondary: ds.secondaryColor,
      background: ds.backgroundColor,
      text: ds.textColor,
      cta: ds.primaryColor,
    },
    spacing: {
      sectionPadding: direction.density === 'lean' ? '96px' : direction.density === 'rich' ? '64px' : '80px',
      gap: '24px',
      rhythm: '8px-grid',
    },
    radius: {
      button: ds.borderRadius,
      card: ds.borderRadius,
      section: '0px',
    },
    shadows: {
      elevation: direction.shadowDirection.includes('none') ? 'none' : 'soft',
      style: direction.shadowDirection,
    },
    buttons: {
      style: direction.visualStyle === 'luxury' || direction.visualStyle === 'elegant' ? 'refined' : 'standard',
      height: '48px',
    },
    cards: {
      style: direction.visualStyle === 'minimal' ? 'bordered' : 'elevated',
      elevation: direction.shadowDirection.includes('none') ? 'none' : 'soft',
    },
    forms: { style: 'outlined', radius: ds.borderRadius },
    imagery: { style: direction.imageDirection, treatment: direction.visualStyle },
    icons: { style: direction.iconDirection, weight: 'regular' },
    backgrounds: { style: direction.visualStyle === 'futuristic' ? 'dark' : direction.visualStyle === 'warm' ? 'textured-soft' : 'clean' },
    sections: { layout: 'stacked', maxWidth: '1200px' },
  };
}

export function checkConsistency(
  constitution: DesignConstitution,
  observed: Partial<{
    headingFont: string; bodyFont: string; radiusValues: string[];
    fontSizes: number[]; shadowStyles: string[]; buttonHeights: string[];
    sectionPaddings: string[];
  }>,
): ConsistencyReport {
  emitObservability('verification', 'consistency', 'Checking Design Constitution compliance');
  const issues: ConsistencyIssue[] = [];

  if (observed.headingFont && observed.headingFont !== constitution.typography.headingFont) {
    issues.push({ element: 'headingFont', expected: constitution.typography.headingFont, actual: observed.headingFont, severity: 'HIGH', repairHint: `set fontFamily=${constitution.typography.headingFont} on headings` });
  }
  if (observed.bodyFont && observed.bodyFont !== constitution.typography.bodyFont) {
    issues.push({ element: 'bodyFont', expected: constitution.typography.bodyFont, actual: observed.bodyFont, severity: 'MEDIUM', repairHint: `apply ${constitution.typography.bodyFont} to body text` });
  }

  const expectedRadius = constitution.radius.card;
  if (observed.radiusValues?.length) {
    const outliers = observed.radiusValues.filter((r) => normalizeRadius(r) !== normalizeRadius(expectedRadius) && normalizeRadius(r) !== '0');
    // Allow one "accent" radius but flag wild variance
    const unique = new Set(outliers.map(normalizeRadius));
    if (unique.size > 2) {
      issues.push({ element: 'borderRadius', expected: expectedRadius, actual: [...unique].join(', '), severity: 'MEDIUM', repairHint: 'Normalize radius to Constitution value (or 0 for sections)' });
    }
  }

  if (observed.fontSizes?.length) {
    const headingSizes = observed.fontSizes.filter((s) => s >= 24);
    const uniqueH = new Set(headingSizes);
    if (uniqueH.size > 5) {
      issues.push({ element: 'headingScale', expected: '≤5 heading sizes', actual: `${uniqueH.size} sizes`, severity: 'MEDIUM', repairHint: 'Collapse to H1–H4 scale' });
    }
  }

  const blocking = issues.some((i) => i.severity === 'BLOCKING');
  const high = issues.some((i) => i.severity === 'HIGH');
  return {
    constitution,
    issues,
    overall: blocking ? 'BLOCKED' : issues.length > 0 || high ? 'REPAIR_REQUIRED' : 'PASS',
  };
}

function normalizeRadius(r: string): string {
  const m = r.match(/^(\d+(?:\.\d+)?)px$/);
  return m ? `${parseFloat(m[1])}px` : r;
}

// ── Design Compatibility Engine (section 8) ─────────────────────────

export type CompatibilityRelation = 'compatible' | 'neutral' | 'conflicting' | 'discouraged';

export interface CompatibilityCheck {
  sourceCategory: string;
  sourceId: string;
  targetCategory: string;
  targetId: string;
  relation: CompatibilityRelation;
  reason: string;
}

const COMPAT_RULES: Array<Omit<CompatibilityCheck, 'relation'> & { relation: CompatibilityRelation }> = [
  { sourceCategory: 'typography', sourceId: 'luxury-editorial', targetCategory: 'palette', targetId: 'neon-gradient', relation: 'conflicting', reason: 'Luxury editorial clashes with neon gradient aesthetics' },
  { sourceCategory: 'typography', sourceId: 'luxury-editorial', targetCategory: 'icons', targetId: 'cartoon', relation: 'conflicting', reason: 'Cartoon icons undermine editorial authority' },
  { sourceCategory: 'typography', sourceId: 'minimal-sans', targetCategory: 'palette', targetId: 'monochrome', relation: 'compatible', reason: 'Minimal sans thrives on monochrome restraint' },
  { sourceCategory: 'typography', sourceId: 'editorial-serif', targetCategory: 'palette', targetId: 'warm-earth', relation: 'compatible', reason: 'Serif + earth tones = classic editorial warmth' },
  { sourceCategory: 'button', sourceId: 'neon', targetCategory: 'background', targetId: 'dark', relation: 'compatible', reason: 'Neon requires dark ground for contrast' },
  { sourceCategory: 'button', sourceId: 'neon', targetCategory: 'typography', targetId: 'luxury-editorial', relation: 'conflicting', reason: 'Neon buttons break luxury editorial tone' },
  { sourceCategory: 'button', sourceId: 'pill', targetCategory: 'radius', targetId: 'sharp', relation: 'discouraged', reason: 'Pill buttons with sharp cards feel inconsistent' },
  { sourceCategory: 'card', sourceId: 'glass', targetCategory: 'background', targetId: 'busy-photo', relation: 'discouraged', reason: 'Glass cards need calm ground to stay legible' },
  { sourceCategory: 'shadow', sourceId: 'heavy', targetCategory: 'style', targetId: 'minimal', relation: 'conflicting', reason: 'Heavy shadows contradict minimal direction' },
  { sourceCategory: 'image', sourceId: 'cartoon-illustration', targetCategory: 'industry', targetId: 'law', relation: 'conflicting', reason: 'Cartoon imagery damages legal professionalism' },
  { sourceCategory: 'image', sourceId: 'cartoon-illustration', targetCategory: 'industry', targetId: 'finance', relation: 'conflicting', reason: 'Cartoon imagery damages financial trust' },
  { sourceCategory: 'style-pack', sourceId: 'brutalist', targetCategory: 'industry', targetId: 'hotel', relation: 'discouraged', reason: 'Brutalist pack rarely fits luxury hospitality' },
  { sourceCategory: 'gradient', sourceId: 'excessive-multi', targetCategory: 'density', targetId: 'rich', relation: 'discouraged', reason: 'Multi-gradient + dense content = visual noise' },
];

export function checkCompatibility(
  sourceCategory: string, sourceId: string,
  targetCategory: string, targetId: string,
): CompatibilityCheck {
  const exact = COMPAT_RULES.find(
    (r) => r.sourceCategory === sourceCategory && r.sourceId === sourceId
      && r.targetCategory === targetCategory && r.targetId === targetId,
  );
  if (exact) return { ...exact };

  const forward = COMPAT_RULES.find((r) => r.sourceId === sourceId && r.targetId === targetId);
  if (forward) return { sourceCategory, sourceId, targetCategory, targetId, relation: forward.relation, reason: forward.reason };

  const reverse = COMPAT_RULES.find((r) => r.sourceId === targetId && r.targetId === sourceId);
  if (reverse) return { sourceCategory, sourceId, targetCategory, targetId, relation: reverse.relation, reason: reverse.reason };

  return { sourceCategory, sourceId, targetCategory, targetId, relation: 'neutral', reason: 'No explicit rule — default neutral' };
}

export function checkCompatibilityBatch(
  picks: Array<{ category: string; id: string }>,
): { checks: CompatibilityCheck[]; hasConflict: boolean; hasDiscouraged: boolean } {
  const checks: CompatibilityCheck[] = [];
  for (let i = 0; i < picks.length; i++) {
    for (let j = i + 1; j < picks.length; j++) {
      checks.push(checkCompatibility(picks[i].category, picks[i].id, picks[j].category, picks[j].id));
    }
  }
  return {
    checks,
    hasConflict: checks.some((c) => c.relation === 'conflicting'),
    hasDiscouraged: checks.some((c) => c.relation === 'discouraged'),
  };
}

// ── Anti-Generic Design Engine (section 25) ─────────────────────────

export interface AntiGenericInput {
  gradientCount: number;
  glassmorphismCount: number;
  roundedCardCount: number;
  totalCardCount: number;
  badgeCount: number;
  decorativeIconCount: number;
  centeredSectionCount: number;
  totalSections: number;
  shadowStyles: string[];
  fontFamilies: string[];
  hasGenericHeroCopy: boolean;
}

export function detectAntiGeneric(input: AntiGenericInput): DesignIssue[] {
  const issues: DesignIssue[] = [];

  if (input.gradientCount >= 3) {
    issues.push(mkIssue('MEDIUM', 'anti-generic', 'page', `${input.gradientCount} gradients — generative stereotype`, 'Keep one gradient as signature; replace others with solid/photo', 'suggest', '≤1 gradient hero treatment', 'set_node_styles', {}));
  }
  if (input.glassmorphismCount >= 2) {
    issues.push(mkIssue('MEDIUM', 'anti-generic', 'page', 'Random glassmorphism', 'Use glass only where layering has function', 'suggest', 'glass only on overlay/modal', 'set_node_styles', {}));
  }
  if (input.totalCardCount >= 4 && input.roundedCardCount === input.totalCardCount) {
    issues.push(mkIssue('LOW', 'anti-generic', 'page', 'All cards identical rounded clones', 'Vary card roles or reduce card count', 'suggest', 'cards have intentional variation', 'insert_section', {}));
  }
  if (input.badgeCount > 4) {
    issues.push(mkIssue('LOW', 'anti-generic', 'page', `${input.badgeCount} badges — clutter`, 'Keep badges only for meaningful status/proof', 'auto', 'badges ≤3', 'update_node_props', {}));
  }
  if (input.decorativeIconCount > 8) {
    issues.push(mkIssue('LOW', 'anti-generic', 'page', 'Meaningless decorative icons', 'Remove icons without functional role', 'auto', 'every icon has a label/function', 'remove_node', {}));
  }
  if (input.totalSections >= 5 && input.centeredSectionCount / input.totalSections > 0.8) {
    issues.push(mkIssue('LOW', 'anti-generic', 'page', '>80% centered layouts — template feel', 'Left-align content sections', 'suggest', 'centered ratio ≤ 50%', 'set_node_styles', {}));
  }
  if (new Set(input.shadowStyles).size > 3) {
    issues.push(mkIssue('MEDIUM', 'component-consistency', 'page', 'Random shadow styles', 'Normalize to Constitution elevation', 'auto', '≤2 shadow styles', 'set_node_styles', {}));
  }
  if (input.fontFamilies.length > 2) {
    issues.push(mkIssue('HIGH', 'typography', 'page', `${input.fontFamilies.length} font families (max 2)`, `Keep ${input.fontFamilies.slice(0, 2).join(' + ')}`, 'auto', '≤2 families', 'update_theme', {}));
  }
  if (input.hasGenericHeroCopy) {
    issues.push(mkIssue('MEDIUM', 'content', 'hero', 'Generic hero copy (placeholder tone)', 'Write specific value-prop headline from industry+goal', 'suggest', 'headline mentions concrete outcome', 'update_node_props', {}));
  }

  return issues;
}

// ── Component Composition Intelligence (section 24) ─────────────────

export function recommendComponentCount(
  sectionRole: string,
  itemCandidates: number,
  hierarchy: 'simple' | 'moderate' | 'complex',
  hasSinglePrimaryCTA: boolean,
): { count: number; why: string } {
  let count: number;
  if (sectionRole === 'features' || sectionRole === 'services') {
    count = hierarchy === 'simple' ? 3 : hierarchy === 'moderate' ? 4 : 6;
  } else if (sectionRole === 'testimonials') {
    count = itemCandidates >= 3 ? 3 : itemCandidates;
  } else if (sectionRole === 'pricing') {
    count = 3; // good/better/best
  } else {
    count = Math.min(itemCandidates, 4);
  }
  count = Math.max(1, Math.min(count, Math.max(1, itemCandidates)));

  const why = hierarchy === 'simple' && count === 3
    ? `${count} items are sufficient: simple hierarchy with ${hasSinglePrimaryCTA ? 'one primary CTA' : 'clear action path'}`
    : `${count} items matched to ${hierarchy} hierarchy (${itemCandidates} candidates available)`;
  return { count, why };
}

// ── Helpers ─────────────────────────────────────────────────────────

let issueSeq = 0;
export function mkIssue(
  severity: DesignIssueSeverity,
  category: DesignIssue['category'],
  target: string,
  evidence: string,
  recommendedRepair: string,
  repairCapability: DesignIssue['repairCapability'],
  verificationMethod: string,
  fixTool?: string,
  fixArgs?: Record<string, unknown>,
): DesignIssue {
  return {
    issueId: `di-${++issueSeq}-${Date.now().toString(36)}`,
    severity, category, target, evidence, recommendedRepair,
    repairCapability, verificationMethod, fixTool, fixArgs,
  };
}

export function sortIssues(issues: DesignIssue[]): DesignIssue[] {
  const order: Record<DesignIssueSeverity, number> = { BLOCKING: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return [...issues].sort((a, b) => order[a.severity] - order[b.severity] || a.issueId.localeCompare(b.issueId));
}
