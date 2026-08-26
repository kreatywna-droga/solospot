/**
 * AnimationInterpolator.ts — PM31 Primary Interpolator Dispatcher
 *
 * Central interpolator dispatcher delegating to specialized interpolators.
 */

import { AnimationUnitParser, ParsedUnit } from './AnimationUnitParser';
import { AnimationColorInterpolator, RGBAColor } from './AnimationColorInterpolator';
import { AnimationTransformInterpolator } from './AnimationTransformInterpolator';

export class AnimationInterpolator {
  public static interpolateNumber(start: number, end: number, ratio: number): number {
    return start + (end - start) * ratio;
  }

  public static interpolateUnit(startStr: string, endStr: string, ratio: number): string {
    const p1 = AnimationUnitParser.parse(startStr);
    const p2 = AnimationUnitParser.parse(endStr);
    if (!p1 || !p2 || p1.unit !== p2.unit) {
      return ratio >= 0.5 ? endStr : startStr;
    }
    const val = this.interpolateNumber(p1.value, p2.value, ratio);
    return AnimationUnitParser.format(val, p1.unit);
  }

  public static interpolateColor(startColor: string, endColor: string, ratio: number): string {
    return AnimationColorInterpolator.interpolate(startColor, endColor, ratio);
  }

  public static interpolateTransform(startStr: string, endStr: string, ratio: number): string {
    return AnimationTransformInterpolator.interpolateTransform(startStr, endStr, ratio);
  }
}

export function interpolateNumber(start: number, end: number, ratio: number): number {
  return AnimationInterpolator.interpolateNumber(start, end, ratio);
}

export function interpolateUnit(startStr: string, endStr: string, ratio: number): string {
  return AnimationInterpolator.interpolateUnit(startStr, endStr, ratio);
}

export function interpolateProperty(type: string, startVal: any, endVal: any, ratio: number): any {
  if (type === 'number' || type === 'opacity') {
    return interpolateNumber(Number(startVal), Number(endVal), ratio);
  }
  if (type === 'color') {
    return AnimationColorInterpolator.interpolate(String(startVal), String(endVal), ratio);
  }
  if (type === 'transform') {
    return AnimationTransformInterpolator.interpolateTransform(String(startVal), String(endVal), ratio);
  }
  if (typeof startVal === 'string' && typeof endVal === 'string') {
    return interpolateUnit(startVal, endVal, ratio);
  }
  return ratio >= 0.5 ? endVal : startVal;
}

