import { describe, it, expect } from 'vitest';
import {
  DEFAULT_GRADIENT,
  buildLinearGradient,
  parseLinearGradient,
  parseLinearGradientOrDefault,
  isGradientCss,
  isLinearGradientCss,
} from '../gradient';

describe('gradient helpers', () => {
  it('builds a valid linear-gradient CSS string from DEFAULT_GRADIENT', () => {
    const css = buildLinearGradient(DEFAULT_GRADIENT);
    expect(css).toMatch(/^linear-gradient\(/);
    expect(css).toContain('135deg');
    expect(css).toContain('#D9A86C 0%');
    expect(css).toContain('#18181B 100%');
    expect(isLinearGradientCss(css)).toBe(true);
  });

  it('sorts stops by position and clamps angle to 0–360', () => {
    const css = buildLinearGradient({
      type: 'linear-gradient',
      angle: 500,
      stops: [
        { color: '#ff0000', position: 80 },
        { color: '#00ff00', position: 10 },
      ],
    });
    expect(css).toContain('360deg');
    expect(css.indexOf('#00ff00')).toBeLessThan(css.indexOf('#ff0000'));
  });

  it('pads a single stop into a two-stop gradient', () => {
    const css = buildLinearGradient({
      type: 'linear-gradient',
      angle: 90,
      stops: [{ color: '#123456', position: 50 }],
    });
    expect(css).toContain('#123456 50%');
    expect(css).toContain('#123456 100%');
  });

  it('round-trips build → parse', () => {
    const original = {
      type: 'linear-gradient' as const,
      angle: 45,
      stops: [
        { color: '#aa0000', position: 0 },
        { color: '#00aa00', position: 40 },
        { color: '#0000aa', position: 100 },
      ],
    };
    const parsed = parseLinearGradient(buildLinearGradient(original));
    expect(parsed).not.toBeNull();
    expect(parsed!.angle).toBe(45);
    expect(parsed!.stops).toHaveLength(3);
    expect(parsed!.stops[1].position).toBe(40);
    expect(parsed!.stops[1].color.toLowerCase()).toBe('#00aa00');
  });

  it('parses direction keyword form', () => {
    const parsed = parseLinearGradient('linear-gradient(to right, #000 0%, #fff 100%)');
    expect(parsed).not.toBeNull();
    expect(parsed!.angle).toBe(90);
    expect(parsed!.stops).toHaveLength(2);
  });

  it('rejects non-gradient values', () => {
    expect(parseLinearGradient('url("a.jpg")')).toBeNull();
    expect(parseLinearGradient('none')).toBeNull();
    expect(parseLinearGradient('')).toBeNull();
    expect(parseLinearGradient(null)).toBeNull();
    expect(isGradientCss('url("a.jpg")')).toBe(false);
    expect(isLinearGradientCss('radial-gradient(#000, #fff)')).toBe(false);
    expect(isGradientCss('radial-gradient(#000, #fff)')).toBe(true);
  });

  it('falls back to a deep-copied DEFAULT_GRADIENT', () => {
    const fallback = parseLinearGradientOrDefault('not-a-gradient');
    expect(fallback.angle).toBe(DEFAULT_GRADIENT.angle);
    expect(fallback.stops).toEqual(DEFAULT_GRADIENT.stops);
    fallback.stops[0].color = '#ffffff';
    expect(DEFAULT_GRADIENT.stops[0].color).toBe('#D9A86C');
  });
});
