/**
 * AnimationInterpolation.ts — PM31 Backward Compatibility Facade
 *
 * @deprecated Use `AnimationInterpolator`, `AnimationColorInterpolator`,
 * `AnimationTransformInterpolator`, or `AnimationUnitParser` directly.
 *
 * This facade delegates 100% of calls to the modular interpolators.
 * Zero duplicate logic exists in this wrapper.
 */

import { AnimationInterpolator } from './AnimationInterpolator';
import { AnimationUnitParser, ParsedUnit } from './AnimationUnitParser';
import { AnimationColorInterpolator, RGBAColor } from './AnimationColorInterpolator';

export type { ParsedUnit, RGBAColor };

/**
 * @deprecated Wrapper delegating to AnimationInterpolator.
 */
export class AnimationInterpolation {
  public static interpolateNumber(start: number, end: number, ratio: number): number {
    return AnimationInterpolator.interpolateNumber(start, end, ratio);
  }

  public static interpolateUnit(startStr: string, endStr: string, ratio: number): string {
    return AnimationInterpolator.interpolateUnit(startStr, endStr, ratio);
  }

  public static interpolateColor(startColor: string, endColor: string, ratio: number): string {
    return AnimationInterpolator.interpolateColor(startColor, endColor, ratio);
  }

  public static parseUnit(str: string): ParsedUnit | null {
    return AnimationUnitParser.parse(str);
  }

  public static parseColor(str: string): RGBAColor | null {
    return AnimationColorInterpolator.parseColor(str);
  }
}
