import { describe, it, expect } from 'vitest';
import { DesignSystem } from './index';
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
import { radiusStyles } from './radius';
import { shadowStyles } from './shadows';
import { backgroundStyles } from './backgrounds';
import { spacingStyles } from './spacing';
import { sectionStyles } from './sections';
import { heroStyles } from './hero';
import { imageTreatmentStyles } from './images';
import { iconStyles } from './icons';
import { effectStyles } from './effects';

describe('Design System', () => {
  it('should have a font catalog', () => {
    expect(fullFontCatalog.length).toBeGreaterThanOrEqual(100);
  });

  it('should have font pairings', () => {
    expect(fullFontPairings.length).toBeGreaterThanOrEqual(20);
  });

  it('should have typography systems', () => {
    expect(typographySystems.length).toBeGreaterThanOrEqual(30);
  });

  it('should have color palettes', () => {
    expect(fullColorPalettes.length).toBeGreaterThanOrEqual(70);
  });

  it('should have design themes', () => {
    expect(fullDesignThemes.length).toBeGreaterThanOrEqual(15);
  });

  it('should have button systems', () => {
    expect(buttonSystems.length).toBeGreaterThanOrEqual(13);
  });

  it('should have card systems', () => {
    expect(cardSystems.length).toBeGreaterThanOrEqual(20);
  });

  it('should have radius styles', () => {
    expect(radiusStyles.length).toBeGreaterThanOrEqual(20);
  });

  it('should have shadow styles', () => {
    expect(shadowStyles.length).toBeGreaterThanOrEqual(19);
  });

  it('should have background styles', () => {
    expect(backgroundStyles.length).toBeGreaterThanOrEqual(20);
  });

  it('should have spacing styles', () => {
    expect(spacingStyles.length).toBeGreaterThanOrEqual(20);
  });

  it('should have section styles', () => {
    expect(sectionStyles.length).toBeGreaterThanOrEqual(20);
  });

  it('should have hero styles', () => {
    expect(heroStyles.length).toBeGreaterThanOrEqual(15);
  });

  it('should have image treatments', () => {
    expect(imageTreatmentStyles.length).toBeGreaterThanOrEqual(15);
  });

  it('should have icon styles', () => {
    expect(iconStyles.length).toBeGreaterThanOrEqual(15);
  });

  it('should have effect styles', () => {
    expect(effectStyles.length).toBeGreaterThanOrEqual(15);
  });

  it('should have style packs', () => {
    expect(fullStylePacks.length).toBeGreaterThanOrEqual(10);
  });

  it('should have industry presets', () => {
    expect(industryPresets.length).toBeGreaterThanOrEqual(20);
  });

  it('should have design combinations', () => {
    expect(fullDesignCombinations.length).toBeGreaterThanOrEqual(100);
  });

  it('should have a working compatibility engine', () => {
    expect(compatibilityEngine.rules.length).toBeGreaterThan(0);
  });

  it('should have a working DesignSystem object', () => {
    expect(DesignSystem.version).toBe('1.0.0');
    expect(DesignSystem.fonts).toBeDefined();
    expect(DesignSystem.fontPairings).toBeDefined();
    expect(DesignSystem.typographySystems).toBeDefined();
    expect(DesignSystem.colorPalettes).toBeDefined();
    expect(DesignSystem.designThemes).toBeDefined();
    expect(DesignSystem.buttonSystems).toBeDefined();
    expect(DesignSystem.cardSystems).toBeDefined();
    expect(DesignSystem.stylePacks).toBeDefined();
    expect(DesignSystem.industryPresets).toBeDefined();
    expect(DesignSystem.designCombinations).toBeDefined();
    expect(DesignSystem.compatibility).toBeDefined();
    expect(DesignSystem.search).toBeDefined();
    expect(DesignSystem.builder).toBeDefined();
    expect(DesignSystem.hacpTools).toBeDefined();
  });

  it('should have HACP tools', () => {
    expect(DesignSystem.hacpTools.length).toBeGreaterThan(0);
  });

  it('should have all module exports', () => {
    expect(fullFontCatalog).toBeDefined();
    expect(fullFontPairings).toBeDefined();
    expect(typographySystems).toBeDefined();
    expect(fullColorPalettes).toBeDefined();
    expect(fullDesignThemes).toBeDefined();
    expect(buttonSystems).toBeDefined();
    expect(cardSystems).toBeDefined();
    expect(fullStylePacks).toBeDefined();
    expect(industryPresets).toBeDefined();
    expect(fullDesignCombinations).toBeDefined();
    expect(radiusStyles).toBeDefined();
    expect(shadowStyles).toBeDefined();
    expect(backgroundStyles).toBeDefined();
    expect(spacingStyles).toBeDefined();
    expect(sectionStyles).toBeDefined();
    expect(heroStyles).toBeDefined();
    expect(imageTreatmentStyles).toBeDefined();
    expect(iconStyles).toBeDefined();
    expect(effectStyles).toBeDefined();
  });
});
