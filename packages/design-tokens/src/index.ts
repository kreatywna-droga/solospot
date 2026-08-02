// Colors API
export {
  colors,
  primaryColors,
  secondaryColors,
  neutralColors,
  successColors,
  warningColors,
  errorColors,
  infoColors,
} from './colors/colors';
export type { ColorShades } from './colors/colors';

// Spacing API
export { spacing, spacingNamed, spacingNumeric } from './spacing/spacing';

// Typography API
export {
  typography,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
} from './typography/typography';

// Layout API
export {
  layout,
  breakpoints,
  containerWidths,
  zIndex,
  borderRadius,
  shadows,
} from './layout/layout';

// Theme API
export {
  lightTheme,
  darkTheme,
  createTheme,
  extendTheme,
} from './theme/theme';
export type { ThemeDefinition, ThemeColors } from './theme/theme';
