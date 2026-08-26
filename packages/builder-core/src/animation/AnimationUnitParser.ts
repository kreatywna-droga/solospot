/**
 * AnimationUnitParser.ts — PM31 Unit Parsing Module
 *
 * Pure unit string parser for dimensions (px, rem, %, deg, unitless).
 * Zero DOM dependencies.
 */

export interface ParsedUnit {
  value: number;
  unit: string;
}

const SUPPORTED_UNITS = new Set(['px', 'rem', '%', 'deg', '']);

export class AnimationUnitParser {
  public static parse(str: string): ParsedUnit | null {
    return this.parseUnit(str);
  }

  public static parseUnit(str: string): ParsedUnit | null {
    if (typeof str !== 'string') return null;
    const trimmed = str.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*([a-z%]*)$/i);
    if (!match) return null;
    const unit = match[2] || '';
    if (!SUPPORTED_UNITS.has(unit)) return null;
    return {
      value: parseFloat(match[1]),
      unit,
    };
  }

  public static areUnitsCompatible(u1: ParsedUnit | null, u2: ParsedUnit | null): boolean {
    if (!u1 || !u2) return false;
    return u1.unit === u2.unit;
  }

  public static isSupportedUnit(str: string): boolean {
    return this.parseUnit(str) !== null;
  }

  public static format(value: number, unit: string): string {
    return `${Number(value.toFixed(3))}${unit}`;
  }
}

export function parseUnit(str: string): ParsedUnit | null {
  return AnimationUnitParser.parseUnit(str);
}

export function areUnitsCompatible(u1: ParsedUnit | null, u2: ParsedUnit | null): boolean {
  return AnimationUnitParser.areUnitsCompatible(u1, u2);
}

export function isSupportedUnit(str: string): boolean {
  return AnimationUnitParser.isSupportedUnit(str);
}
