/**
 * Contrast Intelligence — WCAG math + 5 contrast dimensions.
 *
 * Real computation (no stored/fake scores): palettes derive their
 * contrastMetadata through evaluatePaletteContrast at module load.
 */

export type WcagLevel = 'AAA' | 'AA' | 'A' | 'Fail';

export interface ContrastResult {
  ratio: number;
  level: WcagLevel;
  passBody: boolean;    // >= 4.5 normal text (AA)
  passLarge: boolean;   // >= 3.0 large text (AA)
  passAAA: boolean;     // >= 7.0 normal text (AAA)
}

export type ContrastDimension =
  | 'color'
  | 'size'
  | 'value'
  | 'temperature'
  | 'texture';

export interface ContrastDimensionInfo {
  type: ContrastDimension;
  principle: string;
  decision: string;
  example: string;
  verification: string;
}

/** PHASE 12 — the five contrast dimensions with decision guidance. */
export const CONTRAST_DIMENSIONS: ContrastDimensionInfo[] = [
  {
    type: 'color',
    principle: 'Readable text needs sufficient hue contrast against its background.',
    decision: 'Keep body text at >= 4.5:1 and large/display text at >= 3:1 (WCAG AA).',
    example: 'Ink #1A1A2E on Warm White #FFF7ED = 15.8:1 (AAA).',
    verification: 'evaluateContrast(text, background).passBody === true',
  },
  {
    type: 'size',
    principle: 'Size differences create hierarchy even when colors are close.',
    decision: 'Maintain >= 25% size difference between adjacent hierarchy levels (H1 > H2 > body).',
    example: 'H1 48px / H2 32px / Body 16px.',
    verification: 'Typography scale levels decrease monotonically',
  },
  {
    type: 'value',
    principle: 'Light-vs-dark value separation carries readability more than hue.',
    decision: 'Separate surface and text by clear value (luminance) steps, not just saturation.',
    example: 'Surface #FFFFFF vs text #404040 (value gap > 0.4).',
    verification: '|luminance(fg) - luminance(bg)| >= 0.4 for body text',
  },
  {
    type: 'temperature',
    principle: 'Warm and cool temperatures should be intentional, not accidental.',
    decision: 'Mix temperatures only for accents; keep dominant palette one temperature.',
    example: 'Warm terracotta palette + one cool teal CTA accent.',
    verification: 'Palette mood tags include warm OR cool, accents counted separately',
  },
  {
    type: 'texture',
    principle: 'Texture/pattern backgrounds reduce effective text contrast.',
    decision: 'Place text on an overlay/surface above textured backgrounds.',
    example: 'Pattern background + 90% opacity surface card behind copy.',
    verification: 'Pattern backgrounds require surface/text token pair',
  },
];

/** Parse #RGB / #RRGGBB (optional alpha) to 0..1 RGB triple. */
function parseHex(hex: string): [number, number, number] {
  let h = (hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return [1, 1, 1];
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

/** WCAG relative luminance. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio (1..21). */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** Full WCAG evaluation for a foreground/background pair. */
export function evaluateContrast(foreground: string, background: string): ContrastResult {
  const ratio = contrastRatio(foreground, background);
  const passBody = ratio >= 4.5;
  const passLarge = ratio >= 3.0;
  const passAAA = ratio >= 7.0;
  const level: WcagLevel = passAAA ? 'AAA' : passBody ? 'AA' : passLarge ? 'A' : 'Fail';
  return { ratio, level, passBody, passLarge, passAAA };
}

export interface PaletteContrastMetadata {
  primaryOnBackground: string;
  textOnBackground: string;
  ctaOnPrimary: string;
  score: number;
  wcagLevel: WcagLevel;
  warnings: string[];
}

/**
 * Compute honest contrast metadata for a palette-like record
 * ({primary, background, text, cta, surface, muted}).
 */
export function evaluatePaletteContrast(palette: {
  primary: string;
  background: string;
  text: string;
  cta: string;
  surface?: string;
  muted?: string;
}): PaletteContrastMetadata {
  const warnings: string[] = [];
  const primary = evaluateContrast(palette.primary, palette.background);
  const text = evaluateContrast(palette.text, palette.background);
  const ctaOnPrimary = evaluateContrast(palette.cta, palette.primary);

  const checks = [primary, text, ctaOnPrimary];
  if (palette.surface) checks.push(evaluateContrast(palette.text, palette.surface));
  if (palette.muted) checks.push(evaluateContrast(palette.muted, palette.background));

  if (!text.passBody) warnings.push(`CONTRAST WARNING: text on background is ${text.ratio}:1 (< 4.5:1 WCAG AA)`);
  if (!primary.passLarge) warnings.push(`CONTRAST WARNING: primary on background is ${primary.ratio}:1 (< 3:1)`);
  if (!ctaOnPrimary.passBody) warnings.push(`CONTRAST WARNING: CTA label on primary is ${ctaOnPrimary.ratio}:1 (< 4.5:1)`);

  const avg = checks.reduce((s, c) => s + Math.min(c.ratio, 21), 0) / checks.length;
  const score = Math.max(0, Math.min(100, Math.round((avg / 21) * 100)));
  const worst = checks.reduce((w, c) => (c.ratio < w.ratio ? c : w), checks[0]);

  return {
    primaryOnBackground: primary.passBody ? 'Pass' : `Fail (${primary.ratio}:1)`,
    textOnBackground: text.passBody ? 'Pass' : `Fail (${text.ratio}:1)`,
    ctaOnPrimary: ctaOnPrimary.passBody ? 'Pass' : `Fail (${ctaOnPrimary.ratio}:1)`,
    score,
    wcagLevel: worst.level,
    warnings,
  };
}

/** Value contrast (luminance gap) — PHASE 12 value dimension. */
export function valueContrast(a: string, b: string): number {
  return Math.round(Math.abs(relativeLuminance(a) - relativeLuminance(b)) * 100) / 100;
}

export interface ColorCombinationContrast {
  ratio: number;
  level: WcagLevel;
  pass: boolean;
  warnings: string[];
}

/** Evaluate a ready-made color combination (background + foreground [+ accent]). */
export function evaluateColorCombination(combo: {
  background: string;
  foreground: string;
  accent?: string;
}): ColorCombinationContrast {
  const r = evaluateContrast(combo.foreground, combo.background);
  const warnings = [...(r.passBody ? [] : [
    `CONTRAST WARNING: ${r.ratio}:1 is below WCAG AA 4.5:1`,
  ])];
  if (combo.accent) {
    const a = evaluateContrast(combo.accent, combo.background);
    if (!a.passLarge) warnings.push(`CONTRAST WARNING: accent on background is ${a.ratio}:1 (< 3:1)`);
  }
  return { ratio: r.ratio, level: r.level, pass: r.passBody, warnings };
}

export default {
  CONTRAST_DIMENSIONS,
  relativeLuminance,
  contrastRatio,
  evaluateContrast,
  evaluatePaletteContrast,
  evaluateColorCombination,
  valueContrast,
};
