/**
 * Design Intelligence Rules — principles, decisions, verification (PHASE 31)
 * + anti-pattern detection (PHASE 32). Warnings, never hard blocks.
 */

export interface DesignPrinciple {
  id: string;
  principle: string;
  decision: string;
  example: string;
  execution: string;
  verification: string;
}

export const DESIGN_PRINCIPLES: DesignPrinciple[] = [
  {
    id: 'dip-001',
    principle: 'Luxury designs require visual breathing room.',
    decision: 'Use generous spacing (spacing-luxury / spacing-expansive).',
    example: 'Luxury Editorial style pack applies spacing-luxury.',
    execution: 'Apply spacing system "spacing-luxury".',
    verification: 'Check section rhythm and density (>= lg padding between sections).',
  },
  {
    id: 'dip-002',
    principle: 'Two typefaces are enough; three roles max.',
    decision: 'Heading + body fonts from one pairing; accent only for labels.',
    example: 'Playfair Display (headings) + Montserrat (body).',
    execution: 'Apply a Font Pairing, not random per-node fonts.',
    verification: 'Distinct fontFamily values across document <= 3.',
  },
  {
    id: 'dip-003',
    principle: 'CTA must be the highest-contrast action on the page.',
    decision: 'CTA color passes 4.5:1 against its background.',
    example: 'CTA #B45309 on #FFFBEB = 5.2:1.',
    execution: 'Palette tokens.cta vs tokens.background checked by contrast engine.',
    verification: 'evaluateContrast(cta, background).passBody === true.',
  },
  {
    id: 'dip-004',
    principle: 'Hierarchy is size + weight + space, not color alone.',
    decision: 'Monotonic decreasing scale with >= 20% steps.',
    example: 'H1 48 → H2 36 → body 16.',
    execution: 'Apply a Typography System for consistent scale.',
    verification: 'Scale levels decrease monotonically.',
  },
  {
    id: 'dip-005',
    principle: 'Industry mood drives palette temperature.',
    decision: 'Pick palette mood tags matching the industry preset mood.',
    example: 'Dental + modern → cool/clean palette (medical-clean).',
    execution: 'Resolve industry → recommended palettes.',
    verification: 'Overlap(industry.mood, palette.mood) >= 1.',
  },
  {
    id: 'dip-006',
    principle: 'Dark surfaces need lifted text values.',
    decision: 'On dark backgrounds use text >= #E5E5E5 luminance path.',
    example: 'Dark Tech: bg #0A0A0F, text #F5F5F5.',
    execution: 'Palette contrast metadata computed at build time.',
    verification: 'textOnBackground passes WCAG AA.',
  },
  {
    id: 'dip-007',
    principle: 'Buttons inherit the page radius and shadow language.',
    decision: 'Button radius matches radius tokens; avoid mixing sharp + pill.',
    example: 'radius-rounded pack → buttons-rounded.',
    execution: 'Compatibility engine warns on sharp radius + rounded buttons.',
    verification: 'compatibilityEngine.check(radiusId, buttonId) != warned.',
  },
  {
    id: 'dip-008',
    principle: 'One style application = one atomic change.',
    decision: 'Apply a combination/pack as a single UPDATE_THEME command.',
    example: 'Design Combination apply → 1 history entry.',
    execution: 'resolveDesignApplication → dispatch once.',
    verification: 'History length +1 after apply.',
  },
  {
    id: 'dip-009',
    principle: 'Patterns and images sit behind surfaces, not behind text.',
    decision: 'Text on pattern/image requires an opaque surface layer.',
    example: 'background-pattern + surface card for copy.',
    execution: 'Texture contrast dimension warns on raw text-over-pattern.',
    verification: 'No direct text node over pattern background without surface.',
  },
  {
    id: 'dip-010',
    principle: 'Motion supports meaning; it never decorates by default.',
    decision: 'Effects limited to hover/focus micro-interactions unless story-driven.',
    example: 'effect-none for corporate; effect-glow for dark tech hero.',
    execution: 'Style packs pin effectId intentionally.',
    verification: 'Page has <= 2 repeating effects.',
  },
];

export interface AntiPattern {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
}

export const ANTI_PATTERNS: AntiPattern[] = [
  { id: 'ap-001', name: 'too-many-fonts', description: 'More than 3 distinct font families on one page.', severity: 'warning' },
  { id: 'ap-002', name: 'poor-contrast', description: 'Body text below WCAG AA 4.5:1 against its background.', severity: 'error' },
  { id: 'ap-003', name: 'random-colors', description: 'Colors used outside any palette/token role system.', severity: 'warning' },
  { id: 'ap-004', name: 'inconsistent-spacing', description: 'Mixed spacing scales within sibling sections.', severity: 'warning' },
  { id: 'ap-005', name: 'conflicting-styles', description: 'Luxury typography with brutalist components (compatibility warning).', severity: 'warning' },
  { id: 'ap-006', name: 'excessive-shadows', description: 'Stacked/multiple heavy shadows on nested elements.', severity: 'info' },
  { id: 'ap-007', name: 'excessive-radius', description: 'Large radius on dense data components (tables/dashboards).', severity: 'info' },
  { id: 'ap-008', name: 'poor-hierarchy', description: 'Heading sizes not decreasing or overlapping with body.', severity: 'warning' },
  { id: 'ap-009', name: 'weak-cta-contrast', description: 'CTA fails 4.5:1 against its surrounding surface.', severity: 'error' },
  { id: 'ap-010', name: 'visual-overload', description: 'Too many competing accents/effects in one viewport.', severity: 'warning' },
];

export interface AntiPatternFinding {
  antiPattern: AntiPattern;
  message: string;
}

/**
 * Evaluate a resolved application (theme/tokens) or palette against anti-patterns.
 * Non-blocking: returns warnings for the UI/HACP to surface.
 */
export function checkAntiPatterns(input: {
  fonts?: string[];
  tokens?: {
    colors?: Record<string, string>;
    typography?: Record<string, string>;
    spacing?: Record<string, string>;
    radius?: Record<string, string>;
  };
  compatibilityWarnings?: string[];
  paletteWarnings?: string[];
  effectCount?: number;
}): AntiPatternFinding[] {
  const findings: AntiPatternFinding[] = [];
  const find = (id: string) => ANTI_PATTERNS.find((a) => a.id === id)!;

  const fonts = input.fonts ?? [];
  if (fonts.length > 3) {
    findings.push({ antiPattern: find('ap-001'), message: `${fonts.length} font families detected (> 3): ${fonts.join(', ')}` });
  }

  for (const w of input.paletteWarnings ?? []) {
    if (w.includes('CONTRAST WARNING')) {
      findings.push({ antiPattern: find('ap-002'), message: w });
      findings.push({ antiPattern: find('ap-009'), message: w });
    }
  }

  if ((input.compatibilityWarnings ?? []).length > 0) {
    for (const w of input.compatibilityWarnings ?? []) {
      findings.push({ antiPattern: find('ap-005'), message: w });
    }
  }

  const spacingKeys = Object.keys(input.tokens?.spacing ?? {});
  if (spacingKeys.length > 0 && (input.tokens?.spacing ? Object.values(input.tokens.spacing).some((v) => !v) : false)) {
    findings.push({ antiPattern: find('ap-004'), message: 'Spacing scale has empty steps — inconsistent spacing risk.' });
  }

  if ((input.effectCount ?? 0) > 2) {
    findings.push({ antiPattern: find('ap-010'), message: `${input.effectCount} effects active in one viewport.` });
  }

  return findings;
}

export default { DESIGN_PRINCIPLES, ANTI_PATTERNS, checkAntiPatterns };
