/**
 * AnimationEasing.ts — PM30 Easing Compat Facade
 *
 * Provides the PM30 public easing function surface consumed by
 * AnimationEasing.test.ts. Pure math — no DOM, no side effects.
 */

export type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/** Identity easing. */
export function easeLinear(t: number): number {
  return clamp01(t);
}

/** Quadratic ease-in (accelerates). */
export function easeIn(t: number): number {
  const c = clamp01(t);
  return c * c;
}

/** Quadratic ease-out (decelerates). */
export function easeOut(t: number): number {
  const c = clamp01(t);
  return c * (2 - c);
}

/** Symmetric ease-in-out around 0.5. */
export function easeInOut(t: number): number {
  const c = clamp01(t);
  return c < 0.5 ? 2 * c * c : -1 + (4 - 2 * c) * c;
}

/**
 * Resolve an easing name to its function. Unknown names fall back to linear.
 */
export function resolveEasing(name: string): (t: number) => number {
  switch (name) {
    case 'ease-in':
      return easeIn;
    case 'ease-out':
      return easeOut;
    case 'ease-in-out':
      return easeInOut;
    case 'linear':
    default:
      return easeLinear;
  }
}
