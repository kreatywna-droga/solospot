/**
 * ConstraintResolver.ts — Sprint S29 Resolves a Node Against a Parent Rect
 *
 * Computes the effective LayoutRect of a single node from:
 *   constraints + intrinsicSize + parentRect
 *
 * Deterministic precedence:
 *   1. size by SizingMode (fixed/fill/fit/stretch + pinned fill)
 *   2. aspect ratio (only when both axes are 'fixed'; explicit sizes win on conflict)
 *   3. min/max clamp
 *   4. position pins: X: left(+right) → centerX → right → parent start;
 *                     Y: top(+bottom) → centerY → bottom → parent start
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { LayoutRect, LayoutSize } from './LayoutModel';
import type { LayoutConstraints } from './ConstraintModel';
import { parsePercentageLength, numericLength } from './ConstraintModel';
import { resolveSizedLength, normalizeNumber } from './LayoutSizing';

export interface ResolveConstraintRectParams {
  readonly constraints: LayoutConstraints;
  readonly intrinsic: LayoutSize;
  readonly parentRect: LayoutRect;
}

export function resolveConstraintRect(params: ResolveConstraintRectParams): LayoutRect {
  const { constraints: c, intrinsic, parentRect } = params;

  // -- Size resolution (per axis, respecting pins) --------------------------
  let width: number;
  let height: number;

  if (c.sizing.width === 'fill' || c.sizing.width === 'stretch') {
    width = resolveSizedLength({
      mode: 'fill',
      intrinsic: intrinsic.width,
      parentLength: parentRect.width,
      pinnedLeft: c.left ?? 0,
      pinnedRight: c.right ?? 0,
      min: c.minWidth,
      max: c.maxWidth,
    });
  } else if (c.sizing.width === 'fit') {
    width = resolveSizedLength({
      mode: 'fit',
      intrinsic: intrinsic.width,
      parentLength: parentRect.width,
      min: c.minWidth,
      max: c.maxWidth,
    });
  } else {
    width = resolveSizedLength({
      mode: 'fixed',
      explicit: c.width,
      intrinsic: intrinsic.width,
      parentLength: parentRect.width,
      min: c.minWidth,
      max: c.maxWidth,
    });
  }

  if (c.sizing.height === 'fill' || c.sizing.height === 'stretch') {
    height = resolveSizedLength({
      mode: 'fill',
      intrinsic: intrinsic.height,
      parentLength: parentRect.height,
      pinnedLeft: c.top ?? 0,
      pinnedRight: c.bottom ?? 0,
      min: c.minHeight,
      max: c.maxHeight,
    });
  } else if (c.sizing.height === 'fit') {
    height = resolveSizedLength({
      mode: 'fit',
      intrinsic: intrinsic.height,
      parentLength: parentRect.height,
      min: c.minHeight,
      max: c.maxHeight,
    });
  } else {
    height = resolveSizedLength({
      mode: 'fixed',
      explicit: c.height,
      intrinsic: intrinsic.height,
      parentLength: parentRect.height,
      min: c.minHeight,
      max: c.maxHeight,
    });
  }

  // -- Aspect ratio (only when both axes are fixed) -------------------------
  if (
    c.aspectRatio !== undefined &&
    c.aspectRatio > 0 &&
    c.sizing.width === 'fixed' &&
    c.sizing.height === 'fixed'
  ) {
    const hasExplicitWidth =
      numericLength(c.width) !== undefined || parsePercentageLength(c.width) !== undefined;
    const hasExplicitHeight =
      numericLength(c.height) !== undefined || parsePercentageLength(c.height) !== undefined;

    if (hasExplicitWidth && !hasExplicitHeight) {
      height = normalizeNumber(width / c.aspectRatio);
    } else if (hasExplicitHeight && !hasExplicitWidth) {
      width = normalizeNumber(height * c.aspectRatio);
    }
    // Both explicit: explicit sizes win, aspect ratio ignored (documented rule).
  }

  // -- Final clamp (covers aspect-adjusted lengths) ------------------------
  const finalWidth = clampTo(width, c.minWidth, c.maxWidth);
  const finalHeight = clampTo(height, c.minHeight, c.maxHeight);

  // -- Positioning (deterministic pin precedence) --------------------------
  let x: number;
  if (c.left !== undefined) {
    x = parentRect.x + c.left;
  } else if (c.centerX === true) {
    x = parentRect.x + (parentRect.width - finalWidth) / 2;
  } else if (c.right !== undefined) {
    x = parentRect.x + parentRect.width - finalWidth - c.right;
  } else {
    x = parentRect.x;
  }

  let y: number;
  if (c.top !== undefined) {
    y = parentRect.y + c.top;
  } else if (c.centerY === true) {
    y = parentRect.y + (parentRect.height - finalHeight) / 2;
  } else if (c.bottom !== undefined) {
    y = parentRect.y + parentRect.height - finalHeight - c.bottom;
  } else {
    y = parentRect.y;
  }

  return {
    x: normalizeNumber(x),
    y: normalizeNumber(y),
    width: finalWidth,
    height: finalHeight,
  };
}

function clampTo(value: number, min?: number, max?: number): number {
  let result = Math.max(0, value);
  if (min !== undefined && result < min) {
    result = min;
  }
  if (max !== undefined && result > max) {
    result = max;
  }
  return normalizeNumber(result);
}