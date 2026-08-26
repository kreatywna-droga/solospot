/**
 * AnimationTransformInterpolator.ts — PM31 Transform Function Interpolator
 *
 * Interpolates 2D/3D transform values (translate, scale, rotate).
 */

import { AnimationUnitParser } from './AnimationUnitParser';

export interface TransformFunction {
  name: string;
  value: string;
}

export interface TransformList {
  functions: TransformFunction[];
}

export class AnimationTransformInterpolator {
  public static interpolateTranslate(startStr: string, endStr: string, ratio: number): string {
    const p1 = AnimationUnitParser.parse(startStr);
    const p2 = AnimationUnitParser.parse(endStr);

    if (!p1 || !p2 || p1.unit !== p2.unit) {
      return ratio >= 0.5 ? endStr : startStr;
    }

    const val = p1.value + (p2.value - p1.value) * ratio;
    return AnimationUnitParser.format(val, p1.unit);
  }

  public static parseTransformFunction(str: string): TransformFunction | null {
    if (typeof str !== 'string') return null;
    const trimmed = str.trim();
    const match = trimmed.match(/^(translateX|translateY|translateZ|rotate|rotateX|rotateY|rotateZ|scale|scaleX|scaleY|scaleZ)\(([^()]+)\)$/);
    if (!match) return null;
    const name = match[1];
    const value = match[2].trim();
    if (!value) return null;
    return { name, value };
  }

  public static parseTransformList(str: string): TransformList | null {
    if (typeof str !== 'string') return null;
    const trimmed = str.trim();
    if (!trimmed) return null;
    const rawFuncs = trimmed.match(/([a-zA-Z0-9]+)\([^()]+\)/g);
    if (!rawFuncs) return null;
    const functions: TransformFunction[] = [];
    for (const rf of rawFuncs) {
      const parsed = this.parseTransformFunction(rf);
      if (!parsed) return null;
      functions.push(parsed);
    }
    return { functions };
  }

  public static interpolateTransform(startStr: string, endStr: string, ratio: number): string {
    const list1 = this.parseTransformList(startStr);
    const list2 = this.parseTransformList(endStr);
    if (!list1 || !list2 || list1.functions.length !== list2.functions.length) {
      return ratio >= 0.5 ? endStr : startStr;
    }
    const resultFuncs: string[] = [];
    for (let i = 0; i < list1.functions.length; i++) {
      const f1 = list1.functions[i];
      const f2 = list2.functions[i];
      if (f1.name !== f2.name) {
        return ratio >= 0.5 ? endStr : startStr;
      }
      if (f1.name.startsWith('scale')) {
        const v1 = parseFloat(f1.value);
        const v2 = parseFloat(f2.value);
        if (isNaN(v1) || isNaN(v2)) return ratio >= 0.5 ? endStr : startStr;
        const val = v1 + (v2 - v1) * ratio;
        resultFuncs.push(`${f1.name}(${val})`);
      } else {
        const p1 = AnimationUnitParser.parse(f1.value);
        const p2 = AnimationUnitParser.parse(f2.value);
        if (!p1 || !p2 || p1.unit !== p2.unit) {
          return ratio >= 0.5 ? endStr : startStr;
        }
        const val = p1.value + (p2.value - p1.value) * ratio;
        const formatted = AnimationUnitParser.format(val, p1.unit);
        resultFuncs.push(`${f1.name}(${formatted})`);
      }
    }
    return resultFuncs.join(' ');
  }
}

export function parseTransformFunction(str: string): TransformFunction | null {
  return AnimationTransformInterpolator.parseTransformFunction(str);
}

export function parseTransformList(str: string): TransformList | null {
  return AnimationTransformInterpolator.parseTransformList(str);
}

export function interpolateTransform(startStr: string, endStr: string, ratio: number): string {
  return AnimationTransformInterpolator.interpolateTransform(startStr, endStr, ratio);
}
