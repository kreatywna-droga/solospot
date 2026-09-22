/**
 * Linear Gradient model — canonical serialize/parse helpers.
 *
 * Data model (canonical):
 *   { type: 'linear-gradient', angle: number, stops: [{ color, position }] }
 *
 * Persistence: gradients are stored as a valid CSS string in
 * `NodeStyles.backgroundImage` (e.g. `linear-gradient(135deg, #000 0%, #fff 100%)`),
 * which already flows through SET_NODE_STYLES → Canvas via resolveBackgroundImageCss.
 */

export interface GradientStop {
  color: string;
  /** Position in percent 0–100 */
  position: number;
}

export interface LinearGradientValue {
  type: 'linear-gradient';
  /** Angle in degrees 0–360 */
  angle: number;
  stops: GradientStop[];
}

export const DEFAULT_GRADIENT: LinearGradientValue = {
  type: 'linear-gradient',
  angle: 135,
  stops: [
    { color: '#D9A86C', position: 0 },
    { color: '#18181B', position: 100 },
  ],
};

const COLOR_TOKEN = String.raw`(?:#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-zA-Z]+)`;

/** True when a CSS string is any gradient function (not a url()/plain value). */
export function isGradientCss(css: string | undefined | null): boolean {
  if (!css) return false;
  const v = css.trim();
  return (
    v.startsWith('linear-gradient') ||
    v.startsWith('radial-gradient') ||
    v.startsWith('conic-gradient') ||
    v.startsWith('repeating-linear-gradient') ||
    v.startsWith('repeating-radial-gradient') ||
    v.startsWith('repeating-conic-gradient')
  );
}

/** True when the CSS string is specifically a linear-gradient. */
export function isLinearGradientCss(css: string | undefined | null): boolean {
  if (!css) return false;
  const v = css.trim();
  return v.startsWith('linear-gradient') || v.startsWith('repeating-linear-gradient');
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Build a valid CSS linear-gradient() string from the canonical model. */
export function buildLinearGradient(value: LinearGradientValue): string {
  const angle = Math.round(clamp(value.angle, 0, 360));
  const stops = [...value.stops]
    .map((s) => ({ color: s.color.trim() || '#000000', position: clamp(Math.round(s.position * 100) / 100, 0, 100) }))
    .sort((a, b) => a.position - b.position);
  if (stops.length < 2) {
    const padded: GradientStop[] = stops.length === 1
      ? [stops[0], { ...stops[0], position: 100 }]
      : [
          { color: '#000000', position: 0 },
          { color: '#ffffff', position: 100 },
        ];
    return `linear-gradient(${angle}deg, ${padded.map((s) => `${s.color} ${s.position}%`).join(', ')})`;
  }
  return `linear-gradient(${angle}deg, ${stops.map((s) => `${s.color} ${s.position}%`).join(', ')})`;
}

/**
 * Parse a linear-gradient() CSS string into the canonical model.
 * Returns null when the input is not a linear gradient (url, radial, empty…).
 */
export function parseLinearGradient(css: string | undefined | null): LinearGradientValue | null {
  if (!css || !isLinearGradientCss(css)) return null;
  const inner = css.replace(/^\s*repeating-linear-gradient\s*\(/, '').replace(/^\s*linear-gradient\s*\(/, '');
  const body = inner.replace(/\)\s*$/, '');
  const parts = splitTopLevel(body, ',');
  if (parts.length < 2) return null;

  let angle = DEFAULT_GRADIENT.angle;
  let stopStart = 0;
  const first = parts[0].trim();
  const angleMatch = first.match(/^(-?\d+(?:\.\d+)?)(deg|grad|rad|turn)$/);
  if (angleMatch) {
    angle = cssAngleToDegrees(parseFloat(angleMatch[1]), angleMatch[2]);
    stopStart = 1;
  } else if (!new RegExp(`^${COLOR_TOKEN}`).test(first)) {
    // First token is neither an angle nor a color — unsupported syntax
    return null;
  } else if (!/(-?\d+(?:\.\d+)?)(%|px|em|rem|vw|vh)?\s*$/.test(first)) {
    // Color-only first segment (implicit 0%) — treat as first stop
    stopStart = 0;
  }

  // Direction keyword form: linear-gradient(to right, …)
  if (first.startsWith('to ')) {
    angle = directionToDegrees(first);
    stopStart = 1;
  }

  const stops: GradientStop[] = [];
  for (let i = Math.max(stopStart, stopStart === 1 && angleMatch ? 1 : stopStart); i < parts.length; i++) {
    const seg = parts[i].trim();
    if (!seg) continue;
    const posMatch = seg.match(/(-?\d+(?:\.\d+)?)%\s*$/);
    const colorMatch = seg.match(new RegExp(COLOR_TOKEN));
    if (!colorMatch) continue;
    const position = posMatch ? clamp(parseFloat(posMatch[1]), 0, 100) : (stops.length === 0 ? 0 : 100);
    stops.push({ color: colorMatch[0], position });
  }

  if (stops.length < 2) return null;
  return { type: 'linear-gradient', angle, stops };
}

/** Parse or fall back to the default gradient. */
export function parseLinearGradientOrDefault(css: string | undefined | null): LinearGradientValue {
  return parseLinearGradient(css) ?? { ...DEFAULT_GRADIENT, stops: DEFAULT_GRADIENT.stops.map((s) => ({ ...s })) };
}

export function cssAngleToDegrees(value: number, unit: string): number {
  switch (unit) {
    case 'rad':
      return Math.round((value * 180) / Math.PI);
    case 'grad':
      return Math.round((value * 360) / 400);
    case 'turn':
      return Math.round(value * 360);
    case 'deg':
    default:
      return Math.round(value);
  }
}

function directionToDegrees(direction: string): number {
  const map: Record<string, number> = {
    'to top': 0,
    'to right': 90,
    'to bottom': 180,
    'to left': 270,
    'to top right': 45,
    'to right top': 45,
    'to bottom right': 135,
    'to right bottom': 135,
    'to bottom left': 225,
    'to left bottom': 225,
    'to top left': 315,
    'to left top': 315,
  };
  return map[direction] ?? 180;
}

/** Split on a separator that is not nested inside parentheses. */
function splitTopLevel(input: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of input) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === sep && depth === 0) {
      out.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}
