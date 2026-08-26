import { describe, expect, it } from 'vitest';
import {
  createBlurEffect,
  createColorAdjustmentEffect,
  createDropShadowEffect,
  createGlowEffect,
  createInnerShadowEffect,
  createOpacityEffect,
} from '../EffectModel';

describe('EffectModel Descriptors', () => {
  it('should create BlurEffect with defaults', () => {
    const fx = createBlurEffect({ id: 'fx1' });
    expect(fx.id).toBe('fx1');
    expect(fx.type).toBe('blur');
    expect(fx.enabled).toBe(true);
    expect(fx.radius).toBe(5);
  });

  it('should create DropShadowEffect with custom values', () => {
    const fx = createDropShadowEffect({
      id: 'fx2',
      blur: 15,
      offsetX: 5,
      offsetY: 10,
      color: '#FF0000',
      opacity: 0.5,
    });
    expect(fx.id).toBe('fx2');
    expect(fx.type).toBe('drop-shadow');
    expect(fx.blur).toBe(15);
    expect(fx.offsetX).toBe(5);
    expect(fx.offsetY).toBe(10);
    expect(fx.color).toBe('#FF0000');
    expect(fx.opacity).toBe(0.5);
  });

  it('should create InnerShadowEffect', () => {
    const fx = createInnerShadowEffect({ id: 'fx3', blur: 6 });
    expect(fx.id).toBe('fx3');
    expect(fx.type).toBe('inner-shadow');
    expect(fx.blur).toBe(6);
  });

  it('should create GlowEffect', () => {
    const fx = createGlowEffect({ id: 'fx4', color: '#00FF00', intensity: 0.9 });
    expect(fx.id).toBe('fx4');
    expect(fx.type).toBe('glow');
    expect(fx.color).toBe('#00FF00');
    expect(fx.intensity).toBe(0.9);
  });

  it('should create ColorAdjustmentEffect', () => {
    const fx = createColorAdjustmentEffect({
      id: 'fx5',
      brightness: 20,
      contrast: -10,
      saturation: 30,
      hue: 45,
    });
    expect(fx.id).toBe('fx5');
    expect(fx.type).toBe('color-adjustment');
    expect(fx.brightness).toBe(20);
    expect(fx.contrast).toBe(-10);
    expect(fx.saturation).toBe(30);
    expect(fx.hue).toBe(45);
  });

  it('should create OpacityEffect', () => {
    const fx = createOpacityEffect({ id: 'fx6', opacity: 0.75 });
    expect(fx.id).toBe('fx6');
    expect(fx.type).toBe('opacity');
    expect(fx.opacity).toBe(0.75);
  });
});
