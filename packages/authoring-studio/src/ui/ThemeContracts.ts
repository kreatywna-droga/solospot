/**
 * ThemeContracts.ts — Sprint S2 Theme System Contracts
 *
 * Theme contracts and color schemes (Dark, Light, System).
 *
 * NO DOM, NO React, NO Browser API.
 */

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ColorScheme {
  readonly primary: string;
  readonly secondary: string;
  readonly background: string;
  readonly surface: string;
  readonly border: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly accent: string;
  readonly error: string;
}

export interface ThemeDescriptor {
  readonly id: string;
  readonly mode: ThemeMode;
  readonly name: string;
  readonly colors: ColorScheme;
}

export const DARK_THEME_COLOR_SCHEME: ColorScheme = {
  primary: '#3b82f6',
  secondary: '#64748b',
  background: '#0f172a',
  surface: '#1e293b',
  border: '#334155',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  accent: '#8b5cf6',
  error: '#ef4444',
};

export const LIGHT_THEME_COLOR_SCHEME: ColorScheme = {
  primary: '#2563eb',
  secondary: '#475569',
  background: '#ffffff',
  surface: '#f8fafc',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  accent: '#7c3aed',
  error: '#dc2626',
};

export const STANDARD_THEMES: ReadonlyArray<ThemeDescriptor> = [
  { id: 'theme-dark', mode: 'dark', name: 'Dark Slate', colors: DARK_THEME_COLOR_SCHEME },
  { id: 'theme-light', mode: 'light', name: 'Light Slate', colors: LIGHT_THEME_COLOR_SCHEME },
];
