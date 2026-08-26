import { describe, it, expect } from 'vitest';
import { STANDARD_THEMES, DARK_THEME_COLOR_SCHEME } from '../ThemeContracts';
import { STANDARD_DESIGN_TOKENS } from '../DesignTokens';
import { STANDARD_STUDIO_ICONS, getIconDescriptor } from '../IconRegistry';

describe('ThemeSystem (Sprint S2, ETAP 2)', () => {
  it('provides dark and light theme contracts', () => {
    expect(STANDARD_THEMES).toHaveLength(2);
    expect(DARK_THEME_COLOR_SCHEME.primary).toBe('#3b82f6');
  });

  it('provides studio design tokens', () => {
    expect(STANDARD_DESIGN_TOKENS.spacingMd).toBe('16px');
    expect(STANDARD_DESIGN_TOKENS.fontFamilySans).toContain('Inter');
  });

  it('provides icon registry descriptors', () => {
    expect(STANDARD_STUDIO_ICONS.length).toBeGreaterThan(4);
    const playIcon = getIconDescriptor('icon-play');
    expect(playIcon?.name).toBe('Play Animation');
  });
});
