/**
 * Unit value helpers — parse/format "16px", "50%", "1.5" (unitless) strings.
 * Pure functions — no DOM, no React.
 */

export interface ParsedUnitValue {
  number: number;
  unit: string;
  hasNumber: boolean;
}

/**
 * Parse a CSS length-ish string into number + unit.
 * `defaultUnit` is used when the string has no unit or is empty.
 * Legacy corrupted-unit fix: for unitless ratios (defaultUnit === ''), a
 * trailing "px" on values < 5 is treated as a corrupted legacy unit.
 */
export function parseUnitValue(
  value: string | undefined | null,
  defaultUnit = 'px',
): ParsedUnitValue {
  const raw = value === undefined || value === null ? '' : String(value);
  if (!raw) return { number: NaN, unit: defaultUnit, hasNumber: false };
  const match = raw.match(/^([+-]?(?:\d*\.)?\d+)([a-zA-Z%]*)$/);
  if (match) {
    let number = parseFloat(match[1]);
    let unit = match[2] !== undefined ? match[2] : defaultUnit;
    if (defaultUnit === '' && unit === 'px' && !Number.isNaN(number) && number < 5) {
      unit = '';
    }
    return { number, unit, hasNumber: !Number.isNaN(number) };
  }
  const fallback = parseFloat(raw.replace(/[^0-9.-]/g, ''));
  return { number: fallback, unit: defaultUnit, hasNumber: !Number.isNaN(fallback) };
}

/** Format number + unit back to a CSS string ("", "12", "12px"). */
export function formatUnitValue(number: number | string, unit: string): string {
  const numStr = typeof number === 'string' ? number : String(Math.round(number * 100) / 100);
  if (!numStr) return '';
  return unit !== undefined && unit !== null ? `${numStr}${unit}` : numStr;
}
