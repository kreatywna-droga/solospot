/**
 * AnimationColorInterpolator.ts — PM31 Color Space Interpolator
 *
 * Pure color space interpolator for Hex, RGB, and RGBA strings.
 */

export interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export class AnimationColorInterpolator {
  public static interpolate(startColor: string, endColor: string, ratio: number): string {
    const c1 = this.parseColor(startColor);
    const c2 = this.parseColor(endColor);

    if (!c1 || !c2) {
      return ratio >= 0.5 ? endColor : startColor;
    }

    const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
    const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
    const b = Math.round(c1.b + (c2.b - c1.b) * ratio);
    const a = Number((c1.a + (c2.a - c1.a) * ratio).toFixed(2));

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  public static parseColor(str: string): RGBAColor | null {
    if (typeof str !== 'string') return null;
    const trimmed = str.trim().toLowerCase();

    if (trimmed.startsWith('#')) {
      const hex = trimmed.substring(1);
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
          a: 1,
        };
      }
      if (hex.length === 6) {
        return {
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16),
          a: 1,
        };
      }
    }

    const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10),
        a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1,
      };
    }

    return null;
  }
}

export function parseColor(str: string): RGBAColor | null {
  return AnimationColorInterpolator.parseColor(str);
}

export function interpolateColor(startColor: string, endColor: string, ratio: number): string {
  return AnimationColorInterpolator.interpolate(startColor, endColor, ratio);
}

