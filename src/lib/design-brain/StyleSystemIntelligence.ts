/**
 * StyleSystemIntelligence.ts — RETRIEVAL → DECISION → APPLICATION → VERIFICATION
 *
 * Wires the previously orphaned packages/design-system catalogs into the
 * Design Brain WITHOUT importing HacpBridge or mutating BuilderDocument.
 * Application produces planned HACP tool payloads only; execution stays
 * with SiteGenerationOrchestrator / HacpBridge (DECISION-042–045).
 */

import type {
  DesignDirection, DesignIssue, DecisionTrace, DesignConstitution,
} from './types';
import { mkIssue } from './CompositionEngines';
import { emitObservability } from './Observability';

import {
  fullFontPairings,
  typographySystems,
  fullColorPalettes,
  fullStylePacks,
  industryPresets,
  compatibilityEngine,
  type FontPairing,
  type ColorPalette,
  type StylePack,
} from '../../../packages/design-system/src/index';
import type { IndustryPreset as DsIndustryPreset } from '../../../packages/design-system/src/industries/index';

// ── Types ──────────────────────────────────────────────────────────

export interface StyleRetrievalQuery {
  industry: string;
  direction: DesignDirection;
  moodKeywords?: string[];
}

export interface StyleRetrievalResult {
  pairings: FontPairing[];
  palettes: ColorPalette[];
  stylePacks: StylePack[];
  industryPreset: DsIndustryPreset | null;
  log: string[];
}

export interface StyleDecision {
  pairing: FontPairing | null;
  palette: ColorPalette | null;
  stylePack: StylePack | null;
  typographySystemId: string | null;
  reasons: string[];
  traces: DecisionTrace[];
  conflicts: Array<{ source: string; target: string; reason: string }>;
}

export interface StyleApplicationPlan {
  /** Planned HACP tool calls — NOT executed here. */
  plannedTools: Array<{ tool: string; args: Record<string, unknown> }>;
  constitutionPatch: Pick<DesignConstitution, 'typography' | 'colors' | 'buttons' | 'cards' | 'radius'>;
  issues: DesignIssue[];
  traces: DecisionTrace[];
}

export interface StyleVerification {
  appliedHeadingFont: string;
  appliedBodyFont: string;
  appliedPrimary: string;
  mismatches: DesignIssue[];
  pass: boolean;
}

let traceSeq = 0;
function mkTrace(why: string, what: string, how: string, source: DecisionTrace['source'], extra?: Partial<DecisionTrace>): DecisionTrace {
  return {
    decisionId: `ssi-${++traceSeq}-${Date.now().toString(36)}`,
    why, what, where: 'StyleSystemIntelligence', how,
    verify: 'fonts/colors match decision; compatibility engine reports no incompatible pair',
    source,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

// ── 1. RETRIEVAL (bounded) ─────────────────────────────────────────

export function retrieveStyleCandidates(query: StyleRetrievalQuery): StyleRetrievalResult {
  emitObservability('retrieval', 'style-system', `Retrieve industry=${query.industry} style=${query.direction.visualStyle}`);
  const log: string[] = [];
  const industry = query.industry.toLowerCase();
  const style = query.direction.visualStyle.toLowerCase();
  const mood = [
    ...query.direction.mood.toLowerCase().split(/\s+/),
    ...(query.moodKeywords || []).map((m) => m.toLowerCase()),
  ];

  const industryPreset =
    industryPresets.find((p) => p.industry.toLowerCase() === industry)
    || industryPresets.find((p) => industry.includes(p.industry.toLowerCase()) || p.industry.toLowerCase().includes(industry.replace('-', '')))
    || null;
  if (industryPreset) log.push(`preset:${industryPreset.id}`);

  const pairings = fullFontPairings
    .filter((p) => {
      const hay = `${p.style} ${p.character} ${(p.bestIndustries || []).join(' ')} ${(p.tags || []).join(' ')}`.toLowerCase();
      return (industryPreset && (p.bestIndustries || []).some((b) => industry.includes(b.toLowerCase()) || b.toLowerCase().includes(industry)))
        || hay.includes(style)
        || mood.some((m) => m.length > 3 && hay.includes(m));
    })
    .slice(0, 8);
  log.push(`pairings:${pairings.length}`);

  const palettes = fullColorPalettes
    .filter((p) => {
      const hay = `${p.style} ${(p.recommendedIndustries || []).join(' ')} ${(p.mood || []).join(' ')} ${(p.tags || []).join(' ')}`.toLowerCase();
      return (industryPreset?.recommendedColors || []).includes(p.primary)
        || (p.recommendedIndustries || []).some((r) => industry.includes(r.toLowerCase()) || r.toLowerCase().includes(industry))
        || hay.includes(style)
        || mood.some((m) => m.length > 3 && (p.mood || []).some((pm) => pm.toLowerCase().includes(m)));
    })
    .slice(0, 8);
  log.push(`palettes:${palettes.length}`);

  const stylePacks = fullStylePacks
    .filter((sp: StylePack) => {
      const hay = `${sp.industry} ${sp.style} ${sp.mood.join(' ')} ${sp.tags.join(' ')}`.toLowerCase();
      return hay.includes(industry) || industry.includes(sp.industry.toLowerCase())
        || hay.includes(style)
        || mood.some((m) => m.length > 3 && sp.mood.some((sm: string) => sm.toLowerCase().includes(m)));
    })
    .slice(0, 6);
  log.push(`packs:${stylePacks.length}`);

  return { pairings, palettes, stylePacks, industryPreset, log };
}

// ── 2. DECISION ────────────────────────────────────────────────────

export function decideStyle(
  candidates: StyleRetrievalResult,
  direction: DesignDirection,
): StyleDecision {
  emitObservability('decision', 'style-system', `Decide from ${candidates.pairings.length}/${candidates.palettes.length}/${candidates.stylePacks.length}`);
  const reasons: string[] = [];
  const traces: DecisionTrace[] = [];
  const conflicts: StyleDecision['conflicts'] = [];

  // Pairing: prefer industry preset typography recommendation match, else style tag
  let pairing: FontPairing | null = null;
  if (candidates.pairings.length) {
    const recommendedFonts = (candidates.industryPreset?.recommendedTypography || []).map((f) => f.toLowerCase());
    pairing = candidates.pairings.find((p) =>
      recommendedFonts.includes(p.displayFont.name.toLowerCase())
      || recommendedFonts.includes(p.bodyFont.name.toLowerCase())
    ) || candidates.pairings[0];
    reasons.push(`pairing=${pairing.id} (${pairing.style})`);
    traces.push(mkTrace(
      `Direction ${direction.visualStyle} + industry preset typography`,
      `fontPairing=${pairing.id}`,
      'match preset fonts / pairing style tags',
      candidates.industryPreset ? 'design-system' : 'heuristic',
      { rule: pairing.style },
    ));
  } else {
    reasons.push('pairing=none (empty retrieval — honest fallback later)');
  }

  // Palette: prefer WCAG AA+ with industry recommendation
  let palette: ColorPalette | null = null;
  if (candidates.palettes.length) {
    const ranked = [...candidates.palettes].sort((a, b) => {
      const wcag = (p: ColorPalette) => (p.contrastMetadata.wcagLevel === 'AAA' ? 3 : p.contrastMetadata.wcagLevel === 'AA' ? 2 : p.contrastMetadata.wcagLevel === 'A' ? 1 : 0);
      return wcag(b) - wcag(a) || b.contrastMetadata.score - a.contrastMetadata.score;
    });
    palette = ranked[0];
    reasons.push(`palette=${palette.id} wcag=${palette.contrastMetadata.wcagLevel}`);
    traces.push(mkTrace(
      'Contrast + industry fit outrank decorative preference',
      `palette=${palette.id}`,
      'rank by WCAG then industry recommendation',
      'design-system',
      { rule: palette.contrastMetadata.wcagLevel },
    ));
    if (palette.contrastMetadata.wcagLevel === 'Fail') {
      conflicts.push({ source: palette.id, target: 'wcag', reason: 'Selected palette marked Fail — override required' });
    }
  }

  // Style pack
  let stylePack: StylePack | null = null;
  if (candidates.stylePacks.length) {
    const anti = (candidates.industryPreset?.antiPatterns || []).map((a) => a.toLowerCase());
    const safe = candidates.stylePacks.filter((sp) =>
      !anti.some((a) => `${sp.style} ${sp.mood.join(' ')}`.toLowerCase().includes(a)),
    );
    stylePack = safe[0] || candidates.stylePacks[0];
    if (safe.length === 0 && candidates.stylePacks[0]) {
      conflicts.push({ source: stylePack.id, target: candidates.industryPreset?.industry || 'industry', reason: 'All packs weakly match industry anti-patterns — using best effort' });
    }
    reasons.push(`stylePack=${stylePack.id}`);
    traces.push(mkTrace(
      'Pack must not violate industry anti-patterns',
      `stylePack=${stylePack.id}`,
      'filter packs against industryPreset.antiPatterns',
      'design-system',
      { rule: stylePack.style },
    ));
  }

  const styleHint = direction.visualStyle;
  let typographySystemId: string | null = null;
  if (pairing) {
    const byStyle = typographySystems.find((t) => t.style === pairing.style);
    const byName = typographySystems.find((t) => t.name?.toLowerCase?.() === pairing.style.toLowerCase());
    const bySlug = typographySystems.find((t) => t.id.includes(styleHint.replace(/\s+/g, '-')));
    typographySystemId = (byStyle || byName || bySlug || typographySystems[0])?.id ?? null;
  }

  // Compatibility across chosen items
  const picks: Array<{ category: string; id: string }> = [];
  if (pairing) picks.push({ category: 'typography', id: pairing.id });
  if (palette) picks.push({ category: 'color-palette', id: palette.id });
  if (stylePack) picks.push({ category: 'style-pack', id: stylePack.id });
  if (stylePack) {
    picks.push({ category: 'button', id: stylePack.buttonSystemId });
    picks.push({ category: 'radius', id: stylePack.radiusId });
  }

  for (const p of picks) {
    const report = compatibilityEngine.generateReport(p.id);
    for (const inc of report.incompatible) {
      if (picks.some((x) => x.id === inc)) {
        conflicts.push({ source: p.id, target: inc, reason: `compatibility engine: incompatible` });
      }
    }
    for (const w of report.warnings) {
      if (w.relatedItemId && picks.some((x) => x.id === w.relatedItemId)) {
        conflicts.push({ source: p.id, target: w.relatedItemId, reason: w.message });
      }
    }
  }

  if (conflicts.length) {
    traces.push(mkTrace(
      'Compatibility conflicts detected among selected style items',
      conflicts.map((c) => `${c.source}↔${c.target}`).join(', '),
      'packages/design-system compatibilityEngine.generateReport',
      'design-system',
      { rule: 'compatibility' },
    ));
  }

  return { pairing, palette, stylePack, typographySystemId, reasons, traces, conflicts };
}

// ── 3. APPLICATION (planned tools only) ────────────────────────────

export function planStyleApplication(
  decision: StyleDecision,
  direction: DesignDirection,
): StyleApplicationPlan {
  emitObservability('tool', 'style-system', 'Planning HACP style application tools');
  const issues: DesignIssue[] = [];
  const plannedTools: StyleApplicationPlan['plannedTools'] = [];
  const traces = [...decision.traces];

  const headingFont = decision.pairing?.displayFont.name || 'Inter';
  const bodyFont = decision.pairing?.bodyFont.name || headingFont;

  if (!decision.pairing) {
    issues.push(mkIssue('MEDIUM', 'typography', 'theme', 'No font pairing retrieved', 'Fallback to constitution defaults; log honest empty retrieval', 'suggest', 'heading/body fonts set', 'update_theme', {}));
  }
  if (!decision.palette) {
    issues.push(mkIssue('MEDIUM', 'color', 'theme', 'No palette retrieved', 'Use direction color guidance + defaults', 'suggest', 'primary/background/text set', 'update_theme', {}));
  }
  if (decision.conflicts.length) {
    for (const c of decision.conflicts) {
      issues.push(mkIssue('HIGH', 'compatibility', `${c.source}`, `Conflict with ${c.target}: ${c.reason}`, 'Replace conflicting item or accept with documented risk', 'suggest', 'compatibility report clean', 'update_theme', {}));
    }
  }

  const primary = decision.palette?.primary || '#0F172A';
  const secondary = decision.palette?.secondary || '#1E293B';
  const background = decision.palette?.background || '#FFFFFF';
  const text = decision.palette?.text || '#0F172A';
  const cta = decision.palette?.cta || primary;
  const radius = decision.stylePack?.radiusId.includes('sharp') ? '4px'
    : decision.stylePack?.radiusId.includes('brutalist') ? '0px'
      : direction.visualStyle === 'luxury' || direction.visualStyle === 'minimal' ? '6px' : '12px';

  plannedTools.push({
    tool: 'update_theme',
    args: {
      headingFont,
      bodyFont,
      primaryColor: primary,
      secondaryColor: secondary,
      backgroundColor: background,
      textColor: text,
      borderRadius: radius,
    },
  });
  traces.push(mkTrace(
    'Apply decided fonts/palette via HACP theme tool',
    `update_theme fonts=${headingFont}/${bodyFont}`,
    'orchestrator → HacpBridge.executeToolCall (not direct mutation)',
    'design-system',
    { rule: decision.stylePack?.id || 'fallback-theme' },
  ));

  if (decision.stylePack) {
    plannedTools.push({
      tool: 'set_node_styles',
      args: { nodeId: 'root', styles: { '--btn-radius': radius, '--card-radius': radius } },
    });
  }

  return {
    plannedTools,
    constitutionPatch: {
      typography: { headingFont, bodyFont, scale: direction.density === 'rich' ? 'extended' : direction.density === 'lean' ? 'compact' : 'standard' },
      colors: { primary, secondary, background, text, cta },
      buttons: { style: decision.stylePack?.buttonSystemId || 'standard', height: '48px' },
      cards: { style: decision.stylePack?.cardSystemId || 'standard', elevation: direction.shadowDirection.includes('none') ? 'none' : 'soft' },
      radius: { button: radius, card: radius, section: '0px' },
    },
    issues,
    traces,
  };
}

// ── 4. VERIFICATION ────────────────────────────────────────────────

export function verifyStyleApplication(
  decision: StyleDecision,
  observed: { headingFont: string; bodyFont: string; primaryColor: string },
): StyleVerification {
  emitObservability('verification', 'style-system', 'Verifying applied style vs decision');
  const expectedHeading = decision.pairing?.displayFont.name || observed.headingFont;
  const expectedBody = decision.pairing?.bodyFont.name || observed.bodyFont;
  const expectedPrimary = decision.palette?.primary || observed.primaryColor;

  const mismatches: DesignIssue[] = [];
  if (observed.headingFont !== expectedHeading) {
    mismatches.push(mkIssue('HIGH', 'typography', 'theme', `headingFont observed=${observed.headingFont} expected=${expectedHeading}`, 'Re-apply update_theme with decided heading font', 'auto', 'headingFont matches decision', 'update_theme', {}));
  }
  if (observed.bodyFont !== expectedBody) {
    mismatches.push(mkIssue('MEDIUM', 'typography', 'theme', `bodyFont observed=${observed.bodyFont} expected=${expectedBody}`, 'Re-apply update_theme with decided body font', 'auto', 'bodyFont matches decision', 'update_theme', {}));
  }
  if (normalizeHex(observed.primaryColor) !== normalizeHex(expectedPrimary)) {
    mismatches.push(mkIssue('HIGH', 'color', 'theme', `primary observed=${observed.primaryColor} expected=${expectedPrimary}`, 'Re-apply decided palette primary', 'auto', 'primary matches decision', 'update_theme', {}));
  }

  return {
    appliedHeadingFont: observed.headingFont,
    appliedBodyFont: observed.bodyFont,
    appliedPrimary: observed.primaryColor,
    mismatches,
    pass: mismatches.length === 0,
  };
}

function normalizeHex(c: string): string {
  return c.trim().toLowerCase();
}

/** Full pipeline helper for orchestrator/tests. */
export function runStylePipeline(
  query: StyleRetrievalQuery,
): { retrieval: StyleRetrievalResult; decision: StyleDecision; application: StyleApplicationPlan } {
  const retrieval = retrieveStyleCandidates(query);
  const decision = decideStyle(retrieval, query.direction);
  const application = planStyleApplication(decision, query.direction);
  return { retrieval, decision, application };
}

export const STYLE_SYSTEM_CATALOG_SIZES = {
  pairings: fullFontPairings.length,
  palettes: fullColorPalettes.length,
  stylePacks: fullStylePacks.length,
  typographySystems: typographySystems.length,
  industryPresets: industryPresets.length,
  compatibilityRules: compatibilityEngine.rules.length,
};
