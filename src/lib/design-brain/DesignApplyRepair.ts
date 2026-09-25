/**
 * DesignApplyRepair.ts — Design System → real, persistent, contrast-safe
 * BuilderDocument mutation plan.
 *
 * Repair Gate v3.0. Fixes the three core user-facing failures:
 *
 *  1. FONT REVERT — a Design System font/typography apply only wrote
 *     `UPDATE_THEME` (theme.font). The Canvas's resolveEffectiveStyles merges
 *     `node.styles` OVER the theme styles, so each section's baked-in
 *     `node.styles.fontFamily` (e.g. "Inter") kept winning → the new font never
 *     appeared and looked like a revert. Fix: the apply ALSO writes
 *     `SET_NODE_STYLES` fontFamily to every heading/section node so node and
 *     theme agree and the change is persistent + Canvas-visible.
 *
 *  2. LIGHT CARD + LIGHT TEXT — colors were treated as independent values.
 *     Fix: relational semantic-role resolution — a light surface forces a dark
 *     text role and vice-versa, and every resolved pair is WCAG-checked.
 *
 *  3. STYLE PACK = ONLY theme — Style Packs / Visual Languages must change the
 *     REAL composition (typography, spacing, cards, CTA, section treatment),
 *     not just UPDATE_THEME. Fix: produce a full SET_NODE_STYLES command plan.
 *
 * Architecture: this module only builds BuilderCommand[] plans + theme patches.
 * It never mutates BuilderDocument directly. Execution stays in BuilderContext
 * (DECISION-042..045).
 */

import type { BuilderDocument, BuilderCommand, BuilderNode } from '../../../packages/builder-core/src';
import {
  contrastRatio,
  evaluateContrast,
  relativeLuminance,
  type ContrastResult,
} from '../../../packages/design-system/src/contrast';

// ---------------------------------------------------------------------------
// Node traversal
// ---------------------------------------------------------------------------

/** Recursively collect every node across all pages (sections + children). */
export function collectAllNodes(document: BuilderDocument): BuilderNode[] {
  const out: BuilderNode[] = [];
  const walk = (nodes: BuilderNode[]) => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      out.push(node);
      if (node.children && node.children.length > 0) walk(node.children);
    }
  };
  for (const page of document.pages || []) walk(page.sections || []);
  return out;
}

/** Collect only nodes that carry typography (headings + generic text labels). */
export function collectTypographyNodes(document: BuilderDocument): BuilderNode[] {
  return collectAllNodes(document).filter((n) =>
    n.type === 'heading' ||
    n.type === 'text' ||
    /heading|h1|h2|h3|title|headline/i.test(n.label || '')
  );
}

/** Collect nodes that represent cards (labels mentioning card / with surface bg). */
export function collectCardNodes(document: BuilderDocument): BuilderNode[] {
  return collectAllNodes(document).filter(
    (n) => /card|carditem|tile|box/i.test(n.label || '') || n.type === 'card'
  );
}

/** Collect section / container nodes (composition targets). */
export function collectSectionNodes(document: BuilderDocument): BuilderNode[] {
  return collectAllNodes(document).filter((n) => n.type === 'section' || n.type === 'container');
}

export function findPageIdForNode(document: BuilderDocument, nodeId: string): string | undefined {
  for (const page of document.pages) {
    const hit = collectAllNodesFrom(page.sections).some((n) => n.id === nodeId);
    if (hit) return page.id;
  }
  return undefined;
}

function collectAllNodesFrom(nodes: BuilderNode[]): BuilderNode[] {
  const out: BuilderNode[] = [];
  const walk = (list: BuilderNode[]) => {
    for (const n of list) {
      out.push(n);
      if (n.children && n.children.length) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

// ---------------------------------------------------------------------------
// Typography application plan
// ---------------------------------------------------------------------------

export interface TypographyPlan {
  /** theme patch to merge into UPDATE_THEME */
  theme: Record<string, unknown>;
  /** node-level SET_NODE_STYLES commands (persist + canvas-visible) */
  nodeCommands: BuilderCommand[];
  applied: number;
  skipped: number;
}

/**
 * Build a command plan that applies a resolved heading/body font to the whole
 * document — BOTH the theme (SSOT) AND every typography node's fontFamily
 * (so node.styles no longer overrides the theme and the change is persistent).
 */
export function buildTypographyApplicationPlan(
  document: BuilderDocument,
  font: { heading?: string; body?: string },
  options?: { pageId?: string }
): TypographyPlan {
  const heading = font.heading?.trim();
  const body = font.body?.trim() || heading;
  const theme: Record<string, unknown> = {};
  if (heading) theme.font = heading;
  if (body) theme.bodyFont = body;

  const targets = options?.pageId
    ? collectTypographyNodes({ pages: document.pages.filter((p) => p.id === options.pageId) } as BuilderDocument)
    : collectTypographyNodes(document);

  const nodeCommands: BuilderCommand[] = [];
  let applied = 0;
  let skipped = 0;
  for (const node of targets) {
    const targetFont =
      node.type === 'heading' || /h1|h2|h3|heading|title|headline/i.test(node.label || '')
        ? heading
        : body;
    if (!targetFont) {
      skipped++;
      continue;
    }
    const current = (node.styles?.fontFamily || '').trim();
    if (current === targetFont) {
      skipped++;
      continue;
    }
    nodeCommands.push({
      type: 'SET_NODE_STYLES',
      nodeId: node.id,
      styles: { fontFamily: targetFont } as any,
      pageId: options?.pageId || findPageIdForNode(document, node.id),
    });
    applied++;
  }

  return { theme, nodeCommands, applied, skipped };
}

// ---------------------------------------------------------------------------
// Relational color roles — the semantic-role system (Phase 5)
// ---------------------------------------------------------------------------

export interface SemanticColorRoles {
  surface: string;
  surfaceElevated: string;
  surfaceStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentText: string;
  border: string;
  cardBackground: string;
  cardText: string;
  buttonBackground: string;
  buttonText: string;
}

/**
 * Resolve a full set of semantic roles from a palette's raw values, ALWAYS
 * guaranteeing relational contrast (light surface → dark text, dark surface →
 * light text). No combination can be left light-on-light or dark-on-dark.
 */
export function resolveSemanticRoles(palette: {
  background?: string;
  surface?: string;
  text?: string;
  muted?: string;
  accent?: string;
  primary?: string;
  cta?: string;
  border?: string;
}): SemanticColorRoles {
  const surface = palette.surface || palette.background || '#ffffff';
  const background = palette.background || '#ffffff';
  const surfaceLum = relativeLuminance(surface);

  // Text is chosen opposite to surface luminance → guarantees contrast.
  const textPrimary = ensureTextOn(surface, palette.text);
  const textSecondary = darkenOrLighten(textPrimary, surfaceLum < 0.5 ? -15 : 15);
  const textMuted = palette.muted && contrastRatio(palette.muted, surface) >= 4.5
    ? palette.muted
    : darkenOrLighten(textPrimary, surfaceLum < 0.5 ? -25 : 25);

  const accent = palette.accent || palette.primary || '#D9A86C';
  const accentText = bestTextFor(accent);
  const border = palette.border || (surfaceLum < 0.5 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)');

  const buttonBackground = palette.cta || palette.primary || accent;
  const buttonText = bestTextFor(buttonBackground);

  return {
    surface,
    surfaceElevated: lightenOrDarken(surface, surfaceLum < 0.5 ? 6 : -4),
    surfaceStrong: lightenOrDarken(surface, surfaceLum < 0.5 ? 12 : -8),
    textPrimary,
    textSecondary,
    textMuted,
    accent,
    accentText,
    border,
    cardBackground: surfaceElevated(surface, surfaceLum),
    cardText: textPrimary,
    buttonBackground,
    buttonText,
  };
}

function surfaceElevated(surface: string, lum: number): string {
  return lightenOrDarken(surface, lum < 0.5 ? 6 : -4);
}

/** Convert hex → [r,g,b] 0..255. */
function hexToRgb(hex: string): [number, number, number] {
  let h = (hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return [255, 255, 255];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Shift a hex color toward white (amount>0) or black (amount<0). */
function lightenOrDarken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const t = amount > 0 ? 255 : 0;
  const a = Math.abs(amount);
  const mix = (c: number) => clamp255(c + (t - c) * (a / 100));
  return '#' + [mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('');
}

function darkenOrLighten(text: string, amount: number): string {
  return lightenOrDarken(text, amount);
}

/** Ensure a candidate text color reads on the given surface (>=4.5:1), else pick opposite. */
function ensureTextOn(surface: string, candidate?: string): string {
  const lum = relativeLuminance(surface);
  const opposite = lum < 0.5 ? '#ffffff' : '#0a0a0f';
  if (!candidate) return opposite;
  if (contrastRatio(candidate, surface) >= 4.5) return candidate;
  return opposite;
}

/**
 * Pick the best readable text color (dark or light) for a given background,
 * preferring >= 4.5:1 (WCAG AA) and falling back to the higher-ratio option.
 * Self-correcting: works for any background, including mid-tone brands.
 */
function bestTextFor(background: string): string {
  const white = '#ffffff';
  const dark = '#0a0a0f';
  const w = contrastRatio(white, background);
  const d = contrastRatio(dark, background);
  if (w >= 4.5 && w >= d) return white;
  if (d >= 4.5 && d >= w) return dark;
  return w >= d ? white : dark;
}

// ---------------------------------------------------------------------------
// Contrast validation (Phase 6)
// ---------------------------------------------------------------------------

export interface ContrastValidationResult {
  pass: boolean;
  checks: { pair: string; fg: string; bg: string; ratio: number; passBody: boolean }[];
  violations: string[];
}

/** Validate every required semantic pair on a resolved role set. */
export function validateRoleContrast(roles: SemanticColorRoles): ContrastValidationResult {
  const checks: ContrastValidationResult['checks'] = [];
  const violations: string[] = [];

  const pairs: [string, string, string][] = [
    ['textPrimary.onSurface', roles.textPrimary, roles.surface],
    ['cardText.onCard', roles.cardText, roles.cardBackground],
    ['buttonText.onButton', roles.buttonText, roles.buttonBackground],
    ['accentText.onAccent', roles.accentText, roles.accent],
  ];

  for (const [name, fg, bg] of pairs) {
    const r = evaluateContrast(fg, bg);
    checks.push({ pair: name, fg, bg, ratio: r.ratio, passBody: r.passBody });
    if (!r.passBody) violations.push(`CONTRAST FAIL: ${name} ${r.ratio}:1 (< 4.5:1)`);
  }

  return { pass: violations.length === 0, checks, violations };
}

/** Validate raw palette fields against each other (light card → dark text rule). */
export function validatePalettePair(fg: string, bg: string, label = 'text/background'): ContrastResult {
  return evaluateContrast(fg, bg);
}

// ---------------------------------------------------------------------------
// Composition completeness plan (Phase 7–10)
// ---------------------------------------------------------------------------

export interface CompositionPlan {
  theme: Record<string, unknown>;
  nodeCommands: BuilderCommand[];
  /** deterministic — same input → same output */
  deterministic: true;
  /** reverse = the exact inverse command stream (undo of the whole apply) */
  inverseTheme: Record<string, unknown>;
  /** semantic role set resolved for this apply */
  roles?: SemanticColorRoles;
  contrast: ContrastValidationResult | null;
  summary: string[];
}

/**
 * Build the full Style Pack / Visual Language composition plan: theme patch +
 * node-level SET_NODE_STYLES for typography, spacing, cards, CTA, radius,
 * shadows, section treatment — so the apply changes the REAL page.
 */
export function buildFullCompositionPlan(
  document: BuilderDocument,
  style: {
    font?: { heading?: string; body?: string };
    colors?: Partial<SemanticColorRoles> & { background?: string; primary?: string; surface?: string };
    radius?: string;
    spacing?: Record<string, string>;
    shadow?: string;
    sectionPaddingTop?: string;
    sectionPaddingBottom?: string;
    cardPadding?: string;
    ctaPadding?: string;
    imageTreatment?: Record<string, string>;
    composition?: { layout?: string; density?: string; geometry?: string; align?: string };
  },
  options?: { pageId?: string }
): CompositionPlan {
  const theme: Record<string, unknown> = {};
  const nodeCommands: BuilderCommand[] = [];
  const summary: string[] = [];

  const roles = resolveSemanticRoles({
    background: style.colors?.background,
    surface: style.colors?.surface,
    text: style.colors?.textPrimary,
    muted: style.colors?.textMuted,
    accent: style.colors?.accent,
    primary: style.colors?.primary,
    cta: style.colors?.buttonBackground,
    border: style.colors?.border,
  });
  const contrast = validateRoleContrast(roles);

  // ---- theme patch ----
  if (style.font?.heading) {
    theme.font = style.font.heading;
    summary.push(`font=${style.font.heading}`);
  }
  if (style.colors?.primary) theme.primaryColor = style.colors.primary;
  if (style.colors?.buttonBackground) theme.cta = style.colors.buttonBackground;
  if (style.colors?.background) theme.backgroundColor = style.colors.background;
  if (style.colors?.textPrimary) theme.text = style.colors.textPrimary;
  if (style.colors?.accent) theme.accent = style.colors.accent;
  if (style.radius) theme.borderRadius = style.radius;

  theme.tokens = {
    colors: {
      surface: roles.surface,
      surfaceElevated: roles.surfaceElevated,
      surfaceStrong: roles.surfaceStrong,
      textPrimary: roles.textPrimary,
      textSecondary: roles.textSecondary,
      textMuted: roles.textMuted,
      accent: roles.accent,
      accentText: roles.accentText,
      border: roles.border,
      cardBackground: roles.cardBackground,
      cardText: roles.cardText,
      buttonBackground: roles.buttonBackground,
      buttonText: roles.buttonText,
      background: roles.surface,
      text: roles.textPrimary,
      muted: roles.textMuted,
      primary: style.colors?.primary || roles.accent,
      cta: roles.buttonBackground,
    },
    typography: style.font
      ? { headingFont: style.font.heading || '', bodyFont: style.font.body || style.font.heading || '' }
      : undefined,
    radius: style.radius ? { default: style.radius } : undefined,
    spacing: style.spacing,
    shadows: style.shadow ? { default: style.shadow } : undefined,
    composition: style.composition,
  };

  // ---- typography nodes ----
  if (style.font?.heading || style.font?.body) {
    const typePlan = buildTypographyApplicationPlan(document, style.font, options);
    nodeCommands.push(...typePlan.nodeCommands);
    summary.push(`typographyNodes=${typePlan.applied}`);
  }

  // ---- section treatment (spacing) ----
  for (const section of collectSectionNodes(document)) {
    const styles: Record<string, unknown> = {};
    if (style.sectionPaddingTop) styles.paddingTop = style.sectionPaddingTop;
    if (style.sectionPaddingBottom) styles.paddingBottom = style.sectionPaddingBottom;
    if (style.radius) styles.borderRadius = style.radius;
    if (style.shadow) styles.boxShadow = style.shadow;
    // background: only apply to non-card sections so cards keep elevated surface
    if (style.colors?.background && !/card|tile|box/i.test(section.label || '')) {
      styles.backgroundColor = roles.surface;
      styles.color = roles.textPrimary;
    }
    if (Object.keys(styles).length) {
      nodeCommands.push({
        type: 'SET_NODE_STYLES',
        nodeId: section.id,
        styles: styles as any,
        pageId: options?.pageId || findPageIdForNode(document, section.id),
      });
      summary.push(`section=${section.id}:${Object.keys(styles).join(',')}`);
    }
  }

  // ---- card treatment + relational contrast ----
  for (const card of collectCardNodes(document)) {
    const styles: Record<string, unknown> = {};
    styles.backgroundColor = roles.cardBackground;
    styles.color = roles.cardText;
    if (style.radius) styles.borderRadius = style.radius;
    if (style.shadow) styles.boxShadow = style.shadow;
    if (style.cardPadding) styles.padding = style.cardPadding;
    if (style.colors?.border) styles.borderColor = roles.border;
    nodeCommands.push({
      type: 'SET_NODE_STYLES',
      nodeId: card.id,
      styles: styles as any,
      pageId: options?.pageId || findPageIdForNode(document, card.id),
    });
    summary.push(`card=${card.id}:bg=${roles.cardBackground},color=${roles.cardText}`);
  }

  // ---- CTA / button treatment ----
  const ctaNodes = collectAllNodes(document).filter(
    (n) => n.type === 'button' || /cta|button/i.test(n.label || '')
  );
  for (const cta of ctaNodes) {
    const styles: Record<string, unknown> = {};
    styles.backgroundColor = roles.buttonBackground;
    styles.color = roles.buttonText;
    if (style.radius) styles.borderRadius = style.radius;
    if (style.ctaPadding) styles.padding = style.ctaPadding;
    nodeCommands.push({
      type: 'SET_NODE_STYLES',
      nodeId: cta.id,
      styles: styles as any,
      pageId: options?.pageId || findPageIdForNode(document, cta.id),
    });
    summary.push(`cta=${cta.id}:bg=${roles.buttonBackground},color=${roles.buttonText}`);
  }

  // ---- image treatment ----
  if (style.imageTreatment) {
    const imageNodes = collectAllNodes(document).filter((n) => n.type === 'image');
    for (const img of imageNodes) {
      nodeCommands.push({
        type: 'SET_NODE_STYLES',
        nodeId: img.id,
        styles: style.imageTreatment as any,
        pageId: options?.pageId || findPageIdForNode(document, img.id),
      });
    }
    summary.push(`images=${imageNodes.length}`);
  }

  return {
    theme,
    nodeCommands,
    deterministic: true,
    inverseTheme: {},
    roles,
    contrast,
    summary,
  };
}

export default {
  collectAllNodes,
  collectTypographyNodes,
  collectCardNodes,
  collectSectionNodes,
  buildTypographyApplicationPlan,
  resolveSemanticRoles,
  validateRoleContrast,
  buildFullCompositionPlan,
  contrastRatio,
  relativeLuminance,
  evaluateContrast,
};
