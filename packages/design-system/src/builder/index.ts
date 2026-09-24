/**
 * Builder Integration — StylePack → Builder theme/node style resolution
 *
 * Pure data mapping. Does NOT mutate BuilderDocument directly.
 * UI dispatch and HacpBridge both consume resolveStylePackApplication output
 * so ONE design system feeds Builder and HACP (no duplicate catalogs).
 */

import type { StyleApplicationResult, StyleApplicationOptions } from '../types';

export interface ResolvedStylePackApplication {
  stylePackId: string;
  stylePackName: string;
  theme: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    font?: string;
    borderRadius?: string;
  };
  tokens: {
    colors?: Record<string, string>;
    typography?: Record<string, string>;
    radius?: Record<string, string>;
    spacing?: Record<string, string>;
  };
  sectionStyles: Record<string, string>;
  applied: string[];
  skipped: string[];
  warnings: string[];
  compatibility: { score: number; incompatible: string[]; warnings: string[] };
}

export interface BuilderIntegration {
  applyStylePack(stylePackId: string, documentId: string, options?: Record<string, unknown>): StyleApplicationResult;
  switchStylePack(oldPackId: string, newPackId: string, documentId: string): StyleApplicationResult;
  previewStylePack(stylePackId: string): unknown;
  getAppliedStyles(documentId: string): string[];
}

type CatalogLookup = (id: string) => any | undefined;

export interface ResolveDeps {
  stylePacks: any[];
  colorPalettes: any[];
  typographySystems: any[];
  radiusStyles: any[];
  shadowStyles: any[];
  backgroundStyles: any[];
  spacingStyles: any[];
  buttonSystems?: any[];
  cardSystems?: any[];
  compatibility?: { generateReport(itemId: string): { score: number; incompatible: string[]; warnings: { message: string }[] } };
}

function findById(list: any[], id?: string): any | undefined {
  if (!id) return undefined;
  return list.find((x) => x?.id === id);
}

export function resolveStylePackApplication(
  stylePackId: string,
  deps: ResolveDeps,
  options: StyleApplicationOptions | Record<string, unknown> = {}
): ResolvedStylePackApplication | null {
  const pack = findById(deps.stylePacks, stylePackId);
  if (!pack) return null;

  const applyTo = (options as StyleApplicationOptions).applyTo as string[] | undefined;
  const wants = (key: string) => !applyTo || applyTo.includes(key);

  const palette = findById(deps.colorPalettes, pack.colorPaletteId);
  const typography = findById(deps.typographySystems, pack.typographyId);
  const radius = findById(deps.radiusStyles, pack.radiusId);
  const shadow = findById(deps.shadowStyles, pack.shadowId);
  const background = findById(deps.backgroundStyles, pack.backgroundId);
  const spacing = findById(deps.spacingStyles, pack.spacingId);

  const applied: string[] = [];
  const skipped: string[] = [];
  const warnings: string[] = [];

  const theme: ResolvedStylePackApplication['theme'] = {};
  const tokens: ResolvedStylePackApplication['tokens'] = {};
  const sectionStyles: Record<string, string> = {};

  if (palette && wants('colors')) {
    theme.primaryColor = palette.primary;
    theme.secondaryColor = palette.secondary;
    theme.backgroundColor = palette.background;
    tokens.colors = {
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      background: palette.background,
      surface: palette.surface,
      text: palette.text,
      muted: palette.muted,
      border: palette.border,
      cta: palette.cta,
    };
    sectionStyles.backgroundColor = palette.background;
    sectionStyles.color = palette.text;
    applied.push('colors');
  } else if (!palette) {
    skipped.push('colors');
    warnings.push(`Color palette ${pack.colorPaletteId} not found`);
  } else {
    skipped.push('colors');
  }

  if (typography && wants('typography')) {
    const headingFont =
      typography.fontFamily ||
      typography.scale?.h1?.fontFamily ||
      typography.headingFont ||
      undefined;
    const bodyFont =
      typography.scale?.body?.fontFamily ||
      typography.bodyFont ||
      headingFont;
    theme.font = headingFont || bodyFont || undefined;
    tokens.typography = {
      headingFont: headingFont || '',
      bodyFont: bodyFont || headingFont || '',
      h1Size: typography.scale?.h1?.fontSize || '',
      h2Size: typography.scale?.h2?.fontSize || '',
      bodySize: typography.scale?.body?.fontSize || '',
    };
    if (theme.font) {
      sectionStyles.fontFamily = bodyFont || theme.font;
    }
    applied.push('typography');
  } else if (!typography) {
    skipped.push('typography');
    warnings.push(`Typography ${pack.typographyId} not found`);
  } else {
    skipped.push('typography');
  }

  if (radius && wants('radius')) {
    theme.borderRadius = radius.values?.md || radius.values?.lg || undefined;
    tokens.radius = { ...radius.values };
    sectionStyles.borderRadius = radius.values?.lg || radius.values?.md || undefined;
    applied.push('radius');
  } else {
    skipped.push('radius');
  }

  if (shadow && wants('shadows')) {
    sectionStyles.boxShadow = shadow.values?.md || shadow.preview || undefined;
    applied.push('shadows');
  } else {
    skipped.push('shadows');
  }

  if (background && wants('background')) {
    if (background.values?.primary && !theme.backgroundColor) {
      theme.backgroundColor = background.values.primary;
    }
    if (background.values?.gradient) {
      sectionStyles.backgroundImage = background.values.gradient;
    }
    applied.push('background');
  } else {
    skipped.push('background');
  }

  if (spacing && wants('spacing')) {
    tokens.spacing = {
      sm: spacing.values?.sm || '',
      md: spacing.values?.md || '',
      lg: spacing.values?.lg || '',
      xl: spacing.values?.xl || '',
    };
    applied.push('spacing');
  } else {
    skipped.push('spacing');
  }

  if (pack.buttonSystemId && wants('buttons')) applied.push('buttons');
  else if (!pack.buttonSystemId) skipped.push('buttons');
  else skipped.push('buttons');

  if (pack.cardSystemId && wants('cards')) applied.push('cards');
  else skipped.push('cards');

  if (pack.sectionStyleId && wants('sections')) applied.push('sections');
  if (pack.heroStyleId && wants('hero')) applied.push('hero');
  if (pack.imageTreatmentId && wants('images')) applied.push('images');
  if (pack.iconStyleId && wants('icons')) applied.push('icons');
  if (pack.effectId && wants('effects')) applied.push('effects');

  const compat = deps.compatibility?.generateReport(pack.id) ?? {
    score: 100,
    incompatible: [],
    warnings: [],
  };

  // Clean undefined keys from theme
  const cleanTheme: ResolvedStylePackApplication['theme'] = {};
  for (const [k, v] of Object.entries(theme)) {
    if (v !== undefined && v !== null && v !== '') {
      (cleanTheme as any)[k] = v;
    }
  }

  return {
    stylePackId: pack.id,
    stylePackName: pack.name,
    theme: cleanTheme,
    tokens,
    sectionStyles,
    applied,
    skipped,
    warnings,
    compatibility: {
      score: compat.score,
      incompatible: compat.incompatible ?? [],
      warnings: (compat.warnings ?? []).map((w) => w.message ?? String(w)),
    },
  };
}

export function createBuilderIntegration(
  stylePacks: any[],
  designThemes: any[],
  deps?: Partial<ResolveDeps>
): BuilderIntegration {
  const fullDeps: ResolveDeps = {
    stylePacks,
    colorPalettes: deps?.colorPalettes ?? [],
    typographySystems: deps?.typographySystems ?? [],
    radiusStyles: deps?.radiusStyles ?? [],
    shadowStyles: deps?.shadowStyles ?? [],
    backgroundStyles: deps?.backgroundStyles ?? [],
    spacingStyles: deps?.spacingStyles ?? [],
    buttonSystems: deps?.buttonSystems,
    cardSystems: deps?.cardSystems,
    compatibility: deps?.compatibility,
  };

  return {
    applyStylePack(stylePackId: string, documentId: string, options: Record<string, unknown> = {}): StyleApplicationResult {
      const resolved = resolveStylePackApplication(stylePackId, fullDeps, options);
      if (!resolved) {
        return {
          success: false,
          applied: [],
          skipped: [],
          conflicts: [],
          warnings: [`Style pack ${stylePackId} not found`],
        };
      }
      if (options.previewOnly) {
        return {
          success: true,
          applied: [],
          skipped: resolved.applied,
          conflicts: [],
          warnings: [...resolved.warnings, 'Preview only - no changes applied'],
        };
      }
      return {
        success: true,
        applied: resolved.applied,
        skipped: resolved.skipped,
        conflicts: [],
        warnings: resolved.warnings,
      };
    },
    switchStylePack(oldPackId: string, newPackId: string, documentId: string): StyleApplicationResult {
      const result = this.applyStylePack(newPackId, documentId);
      return {
        ...result,
        success: true,
        warnings: [...result.warnings, `Switched from ${oldPackId} to ${newPackId}`],
      };
    },
    previewStylePack(stylePackId: string): unknown {
      const pack = fullDeps.stylePacks.find((p: any) => p.id === stylePackId);
      return pack ? pack.preview : null;
    },
    getAppliedStyles(documentId: string): string[] {
      return [];
    },
  };
}

export function applyStyleToBuilderDocument(
  stylePackId: string,
  documentId: string,
  builderIntegration: BuilderIntegration,
  options?: StyleApplicationOptions
): StyleApplicationResult {
  const result = builderIntegration.applyStylePack(
    stylePackId,
    documentId,
    options as Record<string, unknown> | undefined
  );

  if (options?.previewOnly) {
    return {
      ...result,
      success: true,
      warnings: [...result.warnings, 'Preview only - no changes applied'],
    };
  }

  return result;
}

export type DesignApplicationKind =
  | 'style-pack'
  | 'color-palette'
  | 'typography'
  | 'font'
  | 'design-combination';

export interface DesignApplicationRequest {
  kind: DesignApplicationKind;
  id: string;
  options?: Record<string, unknown>;
}

export interface DesignApplicationResult {
  ok: boolean;
  kind: DesignApplicationKind;
  id: string;
  name: string;
  theme: Record<string, string | undefined>;
  tokens: ResolvedStylePackApplication['tokens'];
  applied: string[];
  skipped: string[];
  warnings: string[];
  message: string;
}

const DEPS_FROM = (designSystem: any): ResolveDeps => ({
  stylePacks: designSystem.stylePacks,
  colorPalettes: designSystem.colorPalettes,
  typographySystems: designSystem.typographySystems,
  radiusStyles: designSystem.radiusStyles,
  shadowStyles: designSystem.shadowStyles,
  backgroundStyles: designSystem.backgroundStyles,
  spacingStyles: designSystem.spacingStyles,
  compatibility: designSystem.compatibility,
});

function findIn(list: any[], id: string): any | undefined {
  return list?.find((x) => x?.id === id);
}

export function resolveDesignApplication(
  req: DesignApplicationRequest,
  designSystem: any
): DesignApplicationResult {
  const options = req.options || {};
  const fail = (name: string, warnings: string[] = [], message: string): DesignApplicationResult => ({
    ok: false,
    kind: req.kind,
    id: req.id,
    name,
    theme: {},
    tokens: {},
    applied: [],
    skipped: [],
    warnings,
    message,
  });

  if (req.kind === 'style-pack') {
    const resolved = resolveStylePackApplication(req.id, DEPS_FROM(designSystem), options);
    if (!resolved) return fail(req.id, [], `Style Pack "${req.id}" nie istnieje.`);
    if (Object.keys(resolved.theme).length === 0) {
      return fail(resolved.stylePackName, resolved.warnings, 'Style Pack nie rozwiązał pól motywu.');
    }
    return {
      ok: true,
      kind: req.kind,
      id: resolved.stylePackId,
      name: resolved.stylePackName,
      theme: resolved.theme as Record<string, string | undefined>,
      tokens: resolved.tokens,
      applied: resolved.applied,
      skipped: resolved.skipped,
      warnings: resolved.warnings,
      message: `Zastosowano Style Pack **${resolved.stylePackName}** (${resolved.applied.join(', ')}).`,
    };
  }

  if (req.kind === 'color-palette') {
    const palette = findIn(designSystem.colorPalettes, req.id);
    if (!palette) return fail(req.id, [], `Paleta "${req.id}" nie istnieje.`);
    const theme = {
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      backgroundColor: palette.background,
    };
    const tokens = {
      colors: {
        primary: palette.primary,
        secondary: palette.secondary,
        accent: palette.accent,
        background: palette.background,
        surface: palette.surface,
        text: palette.text,
        muted: palette.muted,
        border: palette.border,
        cta: palette.cta,
      },
    };
    return {
      ok: true,
      kind: req.kind,
      id: palette.id,
      name: palette.name,
      theme,
      tokens,
      applied: ['colors'],
      skipped: [],
      warnings: [],
      message: `Zastosowano paletę **${palette.name}**.`,
    };
  }

  if (req.kind === 'typography') {
    const typo = findIn(designSystem.typographySystems, req.id);
    if (!typo) return fail(req.id, [], `Typografia "${req.id}" nie istnieje.`);
    const headingFont =
      typo.fontFamily || typo.scale?.h1?.fontFamily || typo.headingFont || undefined;
    const bodyFont = typo.scale?.body?.fontFamily || typo.bodyFont || headingFont;
    const theme: Record<string, string | undefined> = {};
    if (headingFont || bodyFont) theme.font = headingFont || bodyFont;
    const tokens = {
      typography: {
        headingFont: headingFont || '',
        bodyFont: bodyFont || headingFont || '',
        h1Size: typo.scale?.h1?.fontSize || '',
        h2Size: typo.scale?.h2?.fontSize || '',
        bodySize: typo.scale?.body?.fontSize || '',
      },
    };
    if (Object.keys(theme).length === 0) {
      return fail(typo.name || req.id, [], 'Typografia nie rozwiązała fontów motywu.');
    }
    return {
      ok: true,
      kind: req.kind,
      id: typo.id,
      name: typo.name || typo.id,
      theme,
      tokens,
      applied: ['typography'],
      skipped: [],
      warnings: [],
      message: `Zastosowano typografię **${typo.name || typo.id}**.`,
    };
  }

  if (req.kind === 'font') {
    const font = findIn(designSystem.fonts, req.id) || findIn(designSystem.fonts, req.id);
    if (!font) return fail(req.id, [], `Font "${req.id}" nie istnieje.`);
    const fontFamily = (font as any).fontFamily || font.name;
    if (!fontFamily) return fail(font.name || req.id, [], 'Font nie ma nazwy rodzinnej.');
    return {
      ok: true,
      kind: req.kind,
      id: font.id,
      name: font.name,
      theme: { font: fontFamily },
      tokens: { typography: { headingFont: fontFamily, bodyFont: fontFamily, h1Size: '', h2Size: '', bodySize: '' } },
      applied: ['typography'],
      skipped: [],
      warnings: [],
      message: `Zastosowano font **${font.name}**.`,
    };
  }

  if (req.kind === 'design-combination') {
    const combo = findIn(designSystem.designCombinations, req.id);
    if (!combo) return fail(req.id, [], `Kombinacja "${req.id}" nie istnieje.`);
    // Resolve via style pack fields when present; otherwise palette + font.
    const palette = findIn(designSystem.colorPalettes, combo.colorPaletteId);
    const font = findIn(designSystem.fonts, combo.fontId);
    const theme: Record<string, string | undefined> = {};
    const tokens: ResolvedStylePackApplication['tokens'] = {};
    if (palette) {
      theme.primaryColor = palette.primary;
      theme.secondaryColor = palette.secondary;
      theme.backgroundColor = palette.background;
      tokens.colors = {
        primary: palette.primary,
        secondary: palette.secondary,
        accent: palette.accent,
        background: palette.background,
        surface: palette.surface,
        text: palette.text,
        muted: palette.muted,
        border: palette.border,
        cta: palette.cta,
      };
    }
    if (font) {
      const fontFamily = (font as any).fontFamily || font.name;
      if (fontFamily) theme.font = fontFamily;
    }
    if (Object.keys(theme).length === 0) {
      return fail(combo.name || req.id, [], 'Kombinacja nie rozwiązała motywu.');
    }
    return {
      ok: true,
      kind: req.kind,
      id: combo.id,
      name: combo.name,
      theme,
      tokens,
      applied: [...(palette ? ['colors'] : []), ...(font ? ['typography'] : [])],
      skipped: [],
      warnings: [],
      message: `Zastosowano kombinację **${combo.name}**.`,
    };
  }

  return fail(req.id, [], `Nieznany typ aplikacji: ${String(req.kind)}`);
}

export function designApplicationToCommandPayload(
  result: DesignApplicationResult
): { type: 'UPDATE_THEME'; theme: Record<string, unknown> } | null {
  if (!result.ok || Object.keys(result.theme).length === 0) return null;
  return {
    type: 'UPDATE_THEME',
    theme: {
      ...result.theme,
      tokens: result.tokens,
      appliedStylePackId: result.kind === 'style-pack' ? result.id : undefined,
    },
  };
}

export default createBuilderIntegration([], []);
