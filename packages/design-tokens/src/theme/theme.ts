import { colors, ColorShades } from '../colors/colors';
import { spacing } from '../spacing/spacing';
import { typography } from '../typography/typography';
import { layout } from '../layout/layout';

export interface ThemeColors {
  primary: ColorShades;
  secondary: ColorShades;
  neutral: ColorShades;
  success: ColorShades;
  warning: ColorShades;
  error: ColorShades;
  info: ColorShades;
  [key: string]: any;
}

export interface ThemeDefinition {
  name: string;
  colors: ThemeColors;
  spacing: typeof spacing;
  typography: typeof typography;
  layout: typeof layout;
}

export const lightTheme: ThemeDefinition = {
  name: 'light',
  colors,
  spacing,
  typography,
  layout,
};

export const darkTheme: ThemeDefinition = {
  name: 'dark',
  colors: {
    ...colors,
    neutral: {
      50: '#0f172a',
      100: '#1e293b',
      200: '#334155',
      300: '#475569',
      400: '#64748b',
      500: '#94a3b8',
      600: '#cbd5e1',
      700: '#e2e8f0',
      800: '#f1f5f9',
      900: '#f8fafc',
    },
  },
  spacing,
  typography,
  layout,
};

export function createTheme(overrides?: Partial<ThemeDefinition>): ThemeDefinition {
  return {
    name: overrides?.name || 'custom',
    colors: { ...lightTheme.colors, ...overrides?.colors },
    spacing: { ...lightTheme.spacing, ...overrides?.spacing },
    typography: { ...lightTheme.typography, ...overrides?.typography },
    layout: { ...lightTheme.layout, ...overrides?.layout },
  };
}

export function extendTheme(baseTheme: ThemeDefinition, overrides: Partial<ThemeDefinition>): ThemeDefinition {
  return {
    ...baseTheme,
    name: overrides.name || `${baseTheme.name}-extended`,
    colors: { ...baseTheme.colors, ...overrides.colors },
    spacing: { ...baseTheme.spacing, ...overrides.spacing },
    typography: { ...baseTheme.typography, ...overrides.typography },
    layout: { ...baseTheme.layout, ...overrides.layout },
  };
}
