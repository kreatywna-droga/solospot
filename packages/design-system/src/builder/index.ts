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
  | 'font-pairing'
  | 'button'
  | 'card'
  | 'background'
  | 'hero'
  | 'section'
  | 'image'
  | 'icon'
  | 'effect'
  | 'shadow'
  | 'radius'
  | 'spacing'
  | 'industry-preset'
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

  if (req.kind === 'font-pairing') {
    const pairing = findIn(designSystem.fontPairings, req.id);
    if (!pairing) return fail(req.id, [], `Para fontów "${req.id}" nie istnieje.`);
    const headingFont = pairing.headingFont || pairing.primaryFont || (pairing as any).fontFamily || '';
    const bodyFont = pairing.bodyFont || pairing.secondaryFont || (pairing as any).secondaryFontFamily || headingFont;
    if (!headingFont && !bodyFont) return fail(pairing.name || req.id, [], 'Para fontów nie ma zdefiniowanych fontów.');
    const theme: Record<string, string | undefined> = {};
    if (headingFont || bodyFont) theme.font = headingFont || bodyFont;
    const tokens = {
      typography: {
        headingFont: headingFont || '',
        bodyFont: bodyFont || headingFont || '',
        h1Size: '',
        h2Size: '',
        bodySize: '',
      },
    };
    return {
      ok: true,
      kind: req.kind,
      id: pairing.id,
      name: pairing.name || req.id,
      theme,
      tokens,
      applied: ['typography'],
      skipped: [],
      warnings: [],
      message: `Zastosowano parę fontów **${pairing.name || req.id}**.`,
    };
  }

  if (req.kind === 'button') {
    const buttonStyle = findIn(designSystem.buttonSystems, req.id);
    if (!buttonStyle) return fail(req.id, [], `Styl przycisku "${req.id}" nie istnieje.`);
    const variants = (buttonStyle as any).variants || {};
    const primary = variants.primary || variants.Primary || {};
    const theme: Record<string, string | undefined> = {};
    const tokens: Record<string, any> = {};
    if (primary.radius) {
      theme.borderRadius = primary.radius;
      tokens.radius = { ...(tokens.radius || {}), button: primary.radius };
    }
    if (primary.font || (buttonStyle as any).fontFamily) {
      theme.font = primary.font || (buttonStyle as any).fontFamily;
      tokens.typography = {
        ...(tokens.typography || {}),
        headingFont: theme.font,
        bodyFont: theme.font,
        h1Size: '',
        h2Size: '',
        bodySize: '',
      };
    }
    if (primary.padding) {
      tokens.spacing = {
        ...(tokens.spacing || {}),
        buttonPadding: primary.padding,
      };
    }
    if (primary.border) {
      tokens.border = { ...(tokens.border || {}), button: primary.border };
    }
    if (primary.shadow) {
      tokens.shadows = {
        ...(tokens.shadows || {}),
        button: primary.shadow,
      };
    }
    return {
      ok: true,
      kind: req.kind,
      id: buttonStyle.id,
      name: buttonStyle.name || req.id,
      theme,
      tokens,
      applied: Object.keys(theme).length > 0 ? ['theme'] : [],
      skipped: [],
      warnings: [],
      message: `Zastosowano styl przycisku **${buttonStyle.name || req.id}**.`,
    };
  }

  if (req.kind === 'card') {
    const cardStyle = findIn(designSystem.cardSystems, req.id);
    if (!cardStyle) return fail(req.id, [], `Styl karty "${req.id}" nie istnieje.`);
    const theme: Record<string, string | undefined> = {};
    const tokens: Record<string, any> = {};
    if (cardStyle.radius) {
      theme.borderRadius = cardStyle.radius;
      tokens.radius = { ...(tokens.radius || {}), card: cardStyle.radius };
    }
    if (cardStyle.shadow) {
      tokens.shadows = { ...(tokens.shadows || {}), card: cardStyle.shadow };
    }
    if (cardStyle.padding) {
      tokens.spacing = { ...(tokens.spacing || {}), cardPadding: cardStyle.padding };
    }
    if (cardStyle.background) {
      theme.backgroundColor = cardStyle.background;
    }
    if (cardStyle.border) {
      tokens.border = { ...(tokens.border || {}), card: cardStyle.border };
    }
    return {
      ok: true,
      kind: req.kind,
      id: cardStyle.id,
      name: cardStyle.name || req.id,
      theme,
      tokens,
      applied: Object.keys(theme).length > 0 ? ['theme'] : [],
      skipped: [],
      warnings: [],
      message: `Zastosowano styl karty **${cardStyle.name || req.id}**.`,
    };
  }

  if (req.kind === 'background') {
    const background = findIn(designSystem.backgroundStyles, req.id);
    if (!background) return fail(req.id, [], `Tło "${req.id}" nie istnieje.`);
    const theme: Record<string, string | undefined> = {};
    const tokens: Record<string, any> = {};
    if (background.values?.primary) {
      theme.backgroundColor = background.values.primary;
    }
    if (background.values?.secondary) {
      theme.backgroundSecondary = background.values.secondary;
    }
    if (background.values?.gradient) {
      theme.backgroundImage = background.values.gradient;
    }
    if (background.values?.pattern) {
      theme.backgroundPattern = background.values.pattern;
    }
    if (background.values?.patternColor) {
      theme.backgroundPatternColor = background.values.patternColor;
    }
    if (background.values?.image) {
      theme.backgroundImage = background.values.image;
    }
    if (background.values?.overlay) {
      theme.backgroundOverlay = background.values.overlay;
    }
    return {
      ok: true,
      kind: req.kind,
      id: background.id,
      name: background.name || req.id,
      theme,
      tokens,
      applied: Object.keys(theme).length > 0 ? ['background'] : [],
      skipped: [],
      warnings: [],
      message: `Zastosowano tło **${background.name || req.id}**.`,
    };
  }

  if (req.kind === 'hero') {
    const heroStyle = findIn(designSystem.heroStyles, req.id);
    if (!heroStyle) return fail(req.id, [], `Styl hero "${req.id}" nie istnieje.`);
    const theme: Record<string, string | undefined> = {};
    const tokens: Record<string, any> = {};
    if (heroStyle.values?.minHeight) {
      theme.minHeight = heroStyle.values.minHeight;
    }
    if (heroStyle.values?.paddingTop) {
      theme.paddingTop = heroStyle.values.paddingTop;
    }
    if (heroStyle.values?.paddingBottom) {
      theme.paddingBottom = heroStyle.values.paddingBottom;
    }
    if (heroStyle.values?.backgroundType) {
      theme.backgroundType = heroStyle.values.backgroundType;
    }
    if (heroStyle.values?.contentMaxWidth) {
      theme.contentMaxWidth = heroStyle.values.contentMaxWidth;
    }
    if (heroStyle.values?.headingSize) {
      tokens.typography = {
        ...(tokens.typography || {}),
        h1Size: heroStyle.values.headingSize,
      };
    }
    if (heroStyle.values?.subheadingSize) {
      tokens.typography = {
        ...(tokens.typography || {}),
        h2Size: heroStyle.values.subheadingSize,
      };
    }
    return {
      ok: true,
      kind: req.kind,
      id: heroStyle.id,
      name: heroStyle.name || req.id,
      theme,
      tokens,
      applied: Object.keys(theme).length > 0 ? ['hero'] : [],
      skipped: [],
      warnings: [],
      message: `Zastosowano styl hero **${heroStyle.name || req.id}**.`,
    };
  }

  if (req.kind === 'section') {
    const sectionStyle = findIn(designSystem.sectionStyles, req.id);
    if (!sectionStyle) return fail(req.id, [], `Styl sekcji "${req.id}" nie istnieje.`);
    const theme: Record<string, string | undefined> = {};
    const tokens: Record<string, any> = {};
    if (sectionStyle.values?.paddingTop) {
      tokens.spacing = { ...(tokens.spacing || {}), sectionPaddingTop: sectionStyle.values.paddingTop };
    }
    if (sectionStyle.values?.paddingBottom) {
      tokens.spacing = { ...(tokens.spacing || {}), sectionPaddingBottom: sectionStyle.values.paddingBottom };
    }
    if (sectionStyle.values?.paddingLeft) {
      tokens.spacing = { ...(tokens.spacing || {}), sectionPaddingLeft: sectionStyle.values.paddingLeft };
    }
    if (sectionStyle.values?.paddingRight) {
      tokens.spacing = { ...(tokens.spacing || {}), sectionPaddingRight: sectionStyle.values.paddingRight };
    }
    if (sectionStyle.values?.marginTop) {
      tokens.spacing = { ...(tokens.spacing || {}), sectionMarginTop: sectionStyle.values.marginTop };
    }
    if (sectionStyle.values?.marginBottom) {
      tokens.spacing = { ...(tokens.spacing || {}), sectionMarginBottom: sectionStyle.values.marginBottom };
    }
    if (sectionStyle.values?.maxWidth) {
      theme.maxWidth = sectionStyle.values.maxWidth;
    }
    if (sectionStyle.values?.layout) {
      theme.sectionLayout = sectionStyle.values.layout;
    }
    return {
      ok: true,
      kind: req.kind,
      id: sectionStyle.id,
      name: sectionStyle.name || req.id,
      theme,
      tokens,
      applied: Object.keys(theme).length > 0 ? ['section'] : [],
      skipped: [],
      warnings: [],
      message: `Zastosowano styl sekcji **${sectionStyle.name || req.id}**.`,
    };
  }

  if (req.kind === 'image') {
    const imageStyle = findIn(designSystem.imageTreatmentStyles, req.id);
    if (!imageStyle) return fail(req.id, [], `Traktowanie obrazu "${req.id}" nie istnieje.`);
    const tokens: Record<string, any> = {};
    const values = (imageStyle as any).values || {};
    if (values.borderRadius) {
      tokens.image = { ...(tokens.image || {}), borderRadius: values.borderRadius };
    }
    if (values.objectFit) {
      tokens.image = { ...(tokens.image || {}), objectFit: values.objectFit };
    }
    if (values.objectPosition) {
      tokens.image = { ...(tokens.image || {}), objectPosition: values.objectPosition };
    }
    if (values.overlay && values.overlay !== 'none') {
      tokens.image = { ...(tokens.image || {}), overlay: values.overlay };
    }
    if (values.filter && values.filter !== 'none') {
      tokens.image = { ...(tokens.image || {}), filter: values.filter };
    }
    if (values.shadow && values.shadow !== 'none') {
      tokens.image = { ...(tokens.image || {}), shadow: values.shadow };
    }
    if (values.aspectRatio) {
      tokens.image = { ...(tokens.image || {}), aspectRatio: values.aspectRatio };
    }
    return {
      ok: true,
      kind: req.kind,
      id: imageStyle.id,
      name: imageStyle.name || req.id,
      theme: {},
      tokens,
      applied: Object.keys(tokens).length > 0 ? ['image'] : [],
      skipped: [],
      warnings: [],
      message: `Zastosowano traktowanie obrazu **${imageStyle.name || req.id}**.`,
    };
  }

  if (req.kind === 'icon') {
    const iconStyle = findIn(designSystem.iconStyles, req.id);
    if (!iconStyle) return fail(req.id, [], `Styl ikony "${req.id}" nie istnieje.`);
    const tokens: Record<string, any> = {};
    const values = (iconStyle as any).values || {};
    if (values.size) {
      tokens.icon = { ...(tokens.icon || {}), size: values.size };
    }
    if (values.color) {
      tokens.icon = { ...(tokens.icon || {}), color: values.color };
    }
    if (values.strokeWidth) {
      tokens.icon = { ...(tokens.icon || {}), strokeWidth: values.strokeWidth };
    }
    if (values.fill && values.fill !== 'none') {
      tokens.icon = { ...(tokens.icon || {}), fill: values.fill };
    }
    return {
      ok: true,
      kind: req.kind,
      id: iconStyle.id,
      name: iconStyle.name || req.id,
      theme: {},
      tokens,
      applied: Object.keys(tokens).length > 0 ? ['icon'] : [],
      skipped: [],
      warnings: [],
      message: `Zastosowano styl ikony **${iconStyle.name || req.id}**.`,
    };
  }

  if (req.kind === 'effect') {
    const effectStyle = findIn(designSystem.effectStyles, req.id);
    if (!effectStyle) return fail(req.id, [], `Efekt "${req.id}" nie istnieje.`);
    const tokens: Record<string, any> = {};
    const values = (effectStyle as any).values || {};
    if (values.type && values.type !== 'none') {
      tokens.effects = { ...(tokens.effects || {}), type: values.type };
    }
    if (values.duration && values.duration !== '0ms') {
      tokens.effects = { ...(tokens.effects || {}), duration: values.duration };
    }
    if (values.easing && values.easing !== 'linear') {
      tokens.effects = { ...(tokens.effects || {}), easing: values.easing };
    }
    if (values.trigger && values.trigger !== 'none') {
      tokens.effects = { ...(tokens.effects || {}), trigger: values.trigger };
    }
    return {
      ok: true,
      kind: req.kind,
      id: effectStyle.id,
      name: effectStyle.name || req.id,
      theme: {},
      tokens,
      applied: Object.keys(tokens).length > 0 ? ['effects'] : [],
      skipped: [],
      warnings: [],
      message: `Zastosowano efekt **${effectStyle.name || req.id}**.`,
    };
  }

  if (req.kind === 'shadow') {
    const shadowStyle = findIn(designSystem.shadowStyles, req.id);
    if (!shadowStyle) return fail(req.id, [], `Cień "${req.id}" nie istnieje.`);
    const tokens: Record<string, any> = {};
    const values = (shadowStyle as any).values || {};
    const shadowValue = values.md || values.sm || values.lg || values.xl || values.inner || '';
    if (shadowValue) {
      tokens.shadows = { ...(tokens.shadows || {}), default: shadowValue };
    }
    return {
      ok: true,
      kind: req.kind,
      id: shadowStyle.id,
      name: shadowStyle.name || req.id,
      theme: {},
      tokens,
      applied: Object.keys(tokens).length > 0 ? ['shadows'] : [],
      skipped: [],
      warnings: [],
      message: `Zastosowano cień **${shadowStyle.name || req.id}**.`,
    };
  }

  if (req.kind === 'radius') {
    const radiusStyle = findIn(designSystem.radiusStyles, req.id);
    if (!radiusStyle) return fail(req.id, [], `Promień "${req.id}" nie istnieje.`);
    const theme: Record<string, string | undefined> = {};
    const tokens: Record<string, any> = {};
    const values = (radiusStyle as any).values || {};
    if (values.sm) theme.borderRadius = values.sm;
    if (values.md && !values.sm) theme.borderRadius = values.md;
    if (values.lg && !values.sm && !values.md) theme.borderRadius = values.lg;
    if (values.xl && !values.sm && !values.md && !values.lg) theme.borderRadius = values.xl;
    if (values.full && !values.sm && !values.md && !values.lg && !values.xl) theme.borderRadius = values.full;
    if (theme.borderRadius) {
      tokens.radius = { ...(tokens.radius || {}), default: theme.borderRadius };
    }
    return {
      ok: true,
      kind: req.kind,
      id: radiusStyle.id,
      name: radiusStyle.name || req.id,
      theme,
      tokens,
      applied: Object.keys(theme).length > 0 ? ['radius'] : [],
      skipped: [],
      warnings: [],
      message: `Zastosowano promień **${radiusStyle.name || req.id}**.`,
    };
  }

  if (req.kind === 'spacing') {
    const spacingStyle = findIn(designSystem.spacingStyles, req.id);
    if (!spacingStyle) return fail(req.id, [], `Odstępy "${req.id}" nie istnieją.`);
    const tokens: Record<string, any> = {};
    if ((spacingStyle as any).scale) {
      tokens.spacing = (spacingStyle as any).scale;
    } else if ((spacingStyle as any).values) {
      tokens.spacing = (spacingStyle as any).values;
    }
    return {
      ok: true,
      kind: req.kind,
      id: spacingStyle.id,
      name: spacingStyle.name || req.id,
      theme: {},
      tokens,
      applied: Object.keys(tokens).length > 0 ? ['spacing'] : [],
      skipped: [],
      warnings: [],
      message: `Zastosowano odstępy **${spacingStyle.name || req.id}**.`,
    };
  }

  if (req.kind === 'industry-preset') {
    const preset = findIn(designSystem.industryPresets, req.id);
    if (!preset) return fail(req.id, [], `Preset branżowy "${req.id}" nie istnieje.`);
    const theme: Record<string, string | undefined> = {};
    const tokens: Record<string, any> = {};
    const colors = (preset as any).recommendedColors || [];
    if (colors[0]) theme.primaryColor = colors[0];
    if (colors[1]) theme.secondaryColor = colors[1];
    if (colors[2]) theme.accentColor = colors[2];
    if (colors[3]) theme.backgroundColor = colors[3];
    const typography = (preset as any).recommendedTypography || [];
    if (typography[0]) theme.font = typography[0];
    if (Object.keys(theme).length === 0) {
      return fail(preset.industry || req.id, [], 'Preset nie rozwiązał właściwości motywu.');
    }
    return {
      ok: true,
      kind: req.kind,
      id: preset.id,
      name: preset.industry || preset.id,
      theme,
      tokens,
      applied: Object.keys(theme).length > 0 ? ['industry-preset'] : [],
      skipped: [],
      warnings: [],
      message: `Zastosowano preset branżowy **${preset.industry || preset.id}**.`,
    };
  }

  return fail(req.id, [], `Nieznany typ aplikacji: ${String(req.kind)}`);
}

export function designApplicationToCommandPayload(
  result: DesignApplicationResult
): { type: 'UPDATE_THEME'; theme: Record<string, unknown> } | null {
  if (!result.ok) return null;
  const theme = { ...result.theme } as Record<string, unknown>;
  if (Object.keys(theme).length === 0 && Object.keys(result.tokens).length === 0) return null;
  return {
    type: 'UPDATE_THEME',
    theme: {
      ...theme,
      tokens: result.tokens,
      appliedStylePackId: result.kind === 'style-pack' ? result.id : undefined,
    },
  };
}

export default createBuilderIntegration([], []);
