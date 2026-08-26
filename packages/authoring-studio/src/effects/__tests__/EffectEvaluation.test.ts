import { describe, expect, it } from 'vitest';
import {
  createBlurEffect,
  createColorAdjustmentEffect,
  createDropShadowEffect,
  createGlowEffect,
  createInnerShadowEffect,
  createOpacityEffect,
  evaluateCSSFilter,
  evaluateShadow,
} from '../EffectModel';

describe('Effect Evaluation Helpers', () => {
  it('should compile CSS filter string for active blur, color adjustment, and opacity effects', () => {
    const effects = [
      createBlurEffect({ id: 'f1', radius: 10 }),
      createColorAdjustmentEffect({ id: 'f2', brightness: 20, contrast: -10, saturation: 30, hue: 45 }),
      createOpacityEffect({ id: 'f3', opacity: 0.8 }),
    ];

    const filterString = evaluateCSSFilter(effects);
    expect(filterString).toBe('blur(10px) brightness(120%) contrast(90%) saturate(130%) hue-rotate(45deg) opacity(0.8)');
  });

  it('should return "none" if all filter effects are disabled', () => {
    const effects = [
      createBlurEffect({ id: 'f1', radius: 10, enabled: false }),
      createColorAdjustmentEffect({ id: 'f2', brightness: 20, enabled: false }),
    ];

    const filterString = evaluateCSSFilter(effects);
    expect(filterString).toBe('none');
  });

  it('should evaluate DropShadowEffect into shadow DTO', () => {
    const effects = [
      createDropShadowEffect({ id: 'f1', blur: 12, offsetX: 4, offsetY: 8, color: '#1E293B' }),
    ];

    const shadow = evaluateShadow(effects);
    expect(shadow).toEqual({
      color: '#1E293B',
      blur: 12,
      offsetX: 4,
      offsetY: 8,
      inner: false,
    });
  });

  it('should evaluate InnerShadowEffect into inner shadow DTO', () => {
    const effects = [
      createInnerShadowEffect({ id: 'f1', blur: 6, offsetX: 2, offsetY: 2, color: '#000000' }),
    ];

    const shadow = evaluateShadow(effects);
    expect(shadow).toEqual({
      color: '#000000',
      blur: 6,
      offsetX: 2,
      offsetY: 2,
      inner: true,
    });
  });

  it('should evaluate GlowEffect into glow DTO', () => {
    const effects = [
      createGlowEffect({ id: 'f1', radius: 20, color: '#3B82F6', inner: false }),
    ];

    const shadow = evaluateShadow(effects);
    expect(shadow).toEqual({
      color: '#3B82F6',
      blur: 20,
      offsetX: 0,
      offsetY: 0,
      inner: false,
    });
  });
});
