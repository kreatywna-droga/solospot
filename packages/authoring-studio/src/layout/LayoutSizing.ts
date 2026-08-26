/**
 * LayoutSizing.ts — Sprint S29 Sizing Mode Resolution
 *
 * Resolves a single-axis length for a node according to its SizingMode:
 *   fixed   — explicit px or % (against parent length), else intrinsic
 *   fill    — parent length (optionally pinned: parent minus left/right anchors)
 *   fit     — intrinsic length
 *   stretch — parent length (cross-axis semantics)
 *
 * Deterministic: identical inputs ⇒ identical outputs. Values normalized to 4 decimals.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { SizingMode } from './LayoutModel';
import { numericLength, parsePercentageLength, clampLength } from './ConstraintModel';

/** Rounds a number to 4 decimal places for deterministic, stable output. */
export function normalizeNumber(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export interface ResolveSizedLengthParams {
  readonly mode: SizingMode;
  /** Explicit px number or percentage string like '50%'. */
  readonly explicit?: number | string;
  /** Intrinsic (measured/content) length along this axis. */
  readonly intrinsic: number;
  /** Parent content-box length along this axis. */
  readonly parentLength: number;
  /** Optional pins subtracted from the parent length for fill/stretch. */
  readonly pinnedLeft?: number;
  readonly pinnedRight?: number;
  readonly min?: number;
  readonly max?: number;
}

/**
 * Resolves the effective length along a single axis applying the SizingMode rule
 * then the min/max clamp. Never returns a negative length.
 */
export function resolveSizedLength(params: ResolveSizedLengthParams): number {
  const { mode, explicit, intrinsic, parentLength } = params;

  let length: number;

  if (mode === 'fill' || mode === 'stretch') {
    const pinnedLeft = params.pinnedLeft ?? 0;
    const pinnedRight = params.pinnedRight ?? 0;
    length = parentLength - pinnedLeft - pinnedRight;
  } else if (mode === 'fit') {
    length = intrinsic;
  } else {
    // mode === 'fixed'
    const percentage = parsePercentageLength(explicit);
    const numeric = numericLength(explicit);
    if (percentage !== undefined) {
      length = (parentLength * percentage) / 100;
    } else if (numeric !== undefined) {
      length = numeric;
    } else {
      length = intrinsic;
    }
  }

  return normalizeNumber(clampLength(length, params.min, params.max));
}