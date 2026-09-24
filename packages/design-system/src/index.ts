/**
 * SoloSpot Design System & Style Library v1.0
 *
 * Complete design system with:
 * - 200+ Fonts
 * - 100+ Font Pairings
 * - 30+ Typography Systems
 * - 100+ Color Palettes
 * - 30+ Design Themes
 * - 14 Button Systems
 * - 20+ Card Systems
 * - 20+ Border Radius Systems
 * - 20+ Shadow Systems
 * - 20+ Background Systems
 * - 20+ Spacing Systems
 * - 20+ Section Styles
 * - 15+ Hero Styles
 * - 15+ Image Treatments
 * - 15+ Icon Systems
 * - 15+ Visual Effects
 * - 50+ Style Packs
 * - 60+ Industry Presets
 * - 100+ Design Combinations
 * - Compatibility Engine
 * - Style Search
 * - HACP Tools
 * - Builder Integration
 * - Preview System
 * - UI Components
 * - Versioning System
 */

// ============================================================
// CORE TYPES
// ============================================================

export type {
  BaseCatalogItem,
  Previewable,
  PreviewData,
  PreviewText,
  PreviewButton,
  PreviewCard,
  PreviewBackground,
  PreviewColorCombo,
  CompatibilityRule,
  CompatibilityCondition,
  CompatibilityReport,
  CompatibilityWarning,
  SearchFilters,
  SearchResult,
  SearchFacets,
  FacetCount,
  UsageGuidance,
  RecommendationContext,
  VersionedDependency,
  VersionedItem,
  VersionChange,
  HACPSearchTool,
  HACPApplyTool,
  HACPCapabilityCorridor,
  HACPConstraint,
  StyleApplication,
  StyleApplicationOptions,
  StyleApplicationResult,
  StyleConflict,
  IndustryType,
  MoodType,
  StyleCategory,
} from './types';

// ============================================================
// FONT LIBRARY
// ============================================================

export type { FontItemExtended, FontSubcategory, FontCharacter, FontReadability, FontLicense } from './fonts/fontLibrary';
export { fullFontCatalog } from './fonts/fontLibrary';

// ============================================================
// FONT PAIRING LIBRARY
// ============================================================

export type { FontPairing, PairingStyle } from './font-pairings/fontPairings';
export { fullFontPairings } from './font-pairings/fontPairings';

// ============================================================
// TYPOGRAPHY SYSTEMS
// ============================================================

export type { TypographySystem, TypographyStyle, TypographyScale } from './typography/typographySystems';
export { typographySystems } from './typography/typographySystems';

// ============================================================
// COLOR PALETTE LIBRARY
// ============================================================

export type { ColorPalette, PaletteStyle } from './colors/colorPalettes';
export { fullColorPalettes } from './colors/colorPalettes';

// ============================================================
// DESIGN THEMES
// ============================================================

export type { DesignTheme, ThemeCategory, ButtonStyle as ThemeButtonStyle, CardStyle as ThemeCardStyle } from './themes/designThemes';
export { fullDesignThemes } from './themes/designThemes';

// ============================================================
// BUTTON SYSTEMS
// ============================================================

export type { ButtonStyle as ButtonSystem, ButtonVariant, ButtonStyleName } from './buttons/buttonSystems';
export { buttonSystems } from './buttons/buttonSystems';

// ============================================================
// CARD SYSTEMS
// ============================================================

export type { CardSystem, CardStyleName } from './cards/cardSystems';
export { cardSystems } from './cards/cardSystems';

// ============================================================
// BORDER RADIUS SYSTEMS
// ============================================================

export type { RadiusStyle } from './radius';
export { radiusStyles, getRadiusStyle, getRadiusValues } from './radius';

// ============================================================
// SHADOW SYSTEMS
// ============================================================

export type { ShadowStyle } from './shadows';
export { shadowStyles, getShadowStyle, getShadowValues } from './shadows';

// ============================================================
// BACKGROUND SYSTEMS
// ============================================================

export type { BackgroundStyle } from './backgrounds';
export { backgroundStyles, getBackgroundStyle, getBackgroundValues } from './backgrounds';

// ============================================================
// SPACING SYSTEMS
// ============================================================

export type { SpacingStyle } from './spacing';
export { spacingStyles, getSpacingStyle, getSpacingValues } from './spacing';

// ============================================================
// SECTION STYLES
// ============================================================

export type { SectionStyle } from './sections';
export { sectionStyles, getSectionStyle, getSectionValues } from './sections';

// ============================================================
// HERO STYLES
// ============================================================

export type { HeroStyle } from './hero';
export { heroStyles, getHeroStyle, getHeroValues } from './hero';

// ============================================================
// IMAGE TREATMENTS
// ============================================================

export type { ImageTreatmentStyle } from './images';
export { imageTreatmentStyles, getImageTreatmentStyle, getImageTreatmentValues } from './images';

// ============================================================
// ICON SYSTEMS
// ============================================================

export type { IconStyle } from './icons';
export { iconStyles, getIconStyle, getIconValues } from './icons';

// ============================================================
// VISUAL EFFECTS
// ============================================================

export type { EffectStyle } from './effects';
export { effectStyles, getEffectStyle, getEffectValues } from './effects';

// ============================================================
// STYLE PACKS
// ============================================================

export type { StylePack } from './style-packs';
export { stylePacks, fullStylePacks, getStylePack, getStylePacksByIndustry, getStylePacksByMood, searchStylePacks } from './style-packs';

// ============================================================
// INDUSTRY STYLE PRESETS
// ============================================================

export type { IndustryPreset } from './industries';
export { industryPresets, getIndustryPreset, getIndustryPresetsByIndustry, searchIndustryPresets } from './industries';

// ============================================================
// DESIGN COMBINATIONS
// ============================================================

export type { DesignCombination } from './combinations';
export { designCombinations, fullDesignCombinations, getCombination, getCombinationsByIndustry, getCombinationsByMood, searchCombinations, getTopCombinations } from './combinations';

// ============================================================
// COMPATIBILITY ENGINE
// ============================================================

export type { CompatibilityEngine as CompatibilityEngineInterface, PairwiseCompatibilityRule } from './compatibility';
export { compatibilityEngine, defaultCompatibilityRules, createCompatibilityEngine } from './compatibility';

// ============================================================
// STYLE SEARCH
// ============================================================

export type { StyleSearch as StyleSearchInterface } from './search';
export { createStyleSearch, buildFacets } from './search';

// ============================================================
// HACP TOOLS
// ============================================================

export type { HACPTool } from './hacp';
export { HACP_TOOLS, HACP_CONSTRAINTS, HACP_CAPABILITY_CORRIDOR, getHACPTool, getHACPSearchTools, getHACPApplyTools } from './hacp';

// ============================================================
// BUILDER INTEGRATION
// ============================================================

export type { BuilderIntegration as BuilderIntegrationInterface } from './builder';
export { createBuilderIntegration, applyStyleToBuilderDocument } from './builder';

// ============================================================
// PREVIEW SYSTEM
// ============================================================

export type { PreviewConfig, StylePreview } from './preview';
export { generatePreview, generateFullPreview } from './preview';

// ============================================================
// UI COMPONENTS
// ============================================================

export type { DesignSystemUIProps, StyleCardProps, SearchBarProps, FilterPanelProps, PreviewPanelProps } from './ui';
export { StyleCard, SearchBar, FilterPanel, PreviewPanel } from './ui';

// ============================================================
// VERSIONING SYSTEM
// ============================================================

export type { VersionEntry, VersionManager as VersionManagerInterface } from './versioning';
export { versionManager, createVersionManager, getVersionInfo } from './versioning';

// ============================================================
// MAIN DESIGN SYSTEM OBJECT
// ============================================================

import { fullFontCatalog } from './fonts/fontLibrary';
import { fullFontPairings } from './font-pairings/fontPairings';
import { typographySystems } from './typography/typographySystems';
import { fullColorPalettes } from './colors/colorPalettes';
import { fullDesignThemes } from './themes/designThemes';
import { buttonSystems } from './buttons/buttonSystems';
import { cardSystems } from './cards/cardSystems';
import { fullStylePacks } from './style-packs';
import { industryPresets } from './industries';
import { fullDesignCombinations } from './combinations';
import { compatibilityEngine } from './compatibility';
import { createStyleSearch } from './search';
import { createBuilderIntegration } from './builder';
import { HACP_TOOLS } from './hacp';

export const DesignSystem = {
  // Catalogs
  fonts: fullFontCatalog,
  fontPairings: fullFontPairings,
  typographySystems,
  colorPalettes: fullColorPalettes,
  designThemes: fullDesignThemes,
  buttonSystems,
  cardSystems,
  stylePacks: fullStylePacks,
  industryPresets,
  designCombinations: fullDesignCombinations,

  // Engines
  compatibility: compatibilityEngine,
  search: createStyleSearch(
    fullFontCatalog,
    fullFontPairings,
    fullColorPalettes,
    typographySystems,
    buttonSystems,
    cardSystems,
    fullDesignThemes,
    fullStylePacks
  ),
  builder: createBuilderIntegration(fullStylePacks, fullDesignThemes),

  // HACP Tools
  hacpTools: HACP_TOOLS,

  // Version
  version: '1.0.0',
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default DesignSystem;
