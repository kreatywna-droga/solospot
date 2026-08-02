import { describe, it, expect } from 'vitest';
import {
  colors,
  primaryColors,
  spacing,
  typography,
  layout,
  lightTheme,
  darkTheme,
  createTheme,
  extendTheme,
} from './index';

describe('Design Tokens Integrity', () => {
  it('should contain all required 50-900 color shade keys', () => {
    const requiredShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    for (const shade of requiredShades) {
      expect(primaryColors[shade as keyof typeof primaryColors]).toBeDefined();
      expect(typeof primaryColors[shade as keyof typeof primaryColors]).toBe('string');
    }
  });

  it('should contain valid color palettes for primary, secondary, neutral, success, warning, error, info', () => {
    const paletteKeys = ['primary', 'secondary', 'neutral', 'success', 'warning', 'error', 'info'];
    for (const key of paletteKeys) {
      expect(colors[key as keyof typeof colors]).toBeDefined();
    }
  });

  it('should contain unique keys and valid spacing values', () => {
    expect(spacing.md).toBe('16px');
    expect(spacing.lg).toBe('24px');
    expect(spacing[4]).toBe('16px');
  });

  it('should contain valid typography scales', () => {
    expect(typography.families.sans).toContain('Inter');
    expect(typography.sizes.base).toBe('1rem');
    expect(typography.weights.bold).toBe(700);
  });

  it('should contain valid layout tokens', () => {
    expect(layout.breakpoints.desktop).toBe('1280px');
    expect(layout.zIndex.modal).toBe(400);
    expect(layout.borderRadius.lg).toBe('8px');
    expect(layout.shadows.md).toContain('rgba');
  });

  it('should support Theme API (createTheme & extendTheme)', () => {
    expect(lightTheme.name).toBe('light');
    expect(darkTheme.name).toBe('dark');

    const customTheme = createTheme({ name: 'brand-theme' });
    expect(customTheme.name).toBe('brand-theme');

    const extended = extendTheme(lightTheme, { name: 'custom-extended' });
    expect(extended.name).toBe('custom-extended');
  });
});
