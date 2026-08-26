/**
 * ConstraintModel.ts — Sprint S29 Layout Constraints DTO & Defaults
 *
 * Constraints are DATA describing how a node should resolve against its parent —
 * they never execute layout themselves. Stored immutably under `node.props.layoutConstraints`.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { SizingMode } from './LayoutModel';

export interface LayoutSizing {
  readonly width: SizingMode;
  readonly height: SizingMode;
}

export interface LayoutConstraints {
  readonly left?: number;
  readonly right?: number;
  readonly top?: number;
  readonly bottom?: number;
  readonly centerX?: boolean;
  readonly centerY?: boolean;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly minHeight?: number;
  readonly maxHeight?: number;
  readonly aspectRatio?: number;
  readonly sizing: LayoutSizing;
}

export const DEFAULT_LAYOUT_SIZING: LayoutSizing = {
  width: 'fixed',
  height: 'fixed',
};

export const DEFAULT_LAYOUT_CONSTRAINTS: LayoutConstraints = {
  sizing: DEFAULT_LAYOUT_SIZING,
};

/**
 * Immutably merges a partial constraints object over defaults.
 */
export function createLayoutConstraints(
  partial?: Partial<Omit<LayoutConstraints, 'sizing'>> & {
    sizing?: Partial<LayoutSizing>;
  }
): LayoutConstraints {
  const base = partial ?? {};
  return {
    ...DEFAULT_LAYOUT_CONSTRAINTS,
    ...base,
    sizing: {
      ...DEFAULT_LAYOUT_SIZING,
      ...(base.sizing ?? {}),
    },
  };
}

/**
 * Recognizes percentage length strings like '50%'. Returns false for numeric lengths.
 */
export function parsePercentageLength(value: number | string | undefined): number | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/%$/.test(trimmed)) {
      const numeric = Number.parseFloat(trimmed);
      return Number.isFinite(numeric) ? numeric : undefined;
    }
    return undefined;
  }
  return undefined;
}

/**
 * Returns the stored numeric length if provided (non-percentage), else undefined.
 */
export function numericLength(value: number | string | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return undefined;
}

/**
 * Clamps a computed length between optional min/max bounds, normalizing negatives to 0.
 */
export function clampLength(
  value: number,
  min?: number,
  max?: number
): number {
  const safe = Math.max(0, value);
  if (min !== undefined && safe < min) {
    return min;
  }
  if (max !== undefined && safe > max) {
    return max;
  }
  return safe;
}