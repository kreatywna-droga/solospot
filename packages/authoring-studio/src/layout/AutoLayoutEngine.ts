/**
 * AutoLayoutEngine.ts — Sprint S29 Auto Layout Flow Engine
 *
 * Places child nodes inside a container rect according to a LayoutStyle:
 *   direction, gap, padding, alignItems (cross), justifyContent/distribution (main),
 *   child sizing (fixed/fill/fit/stretch), and wrapping.
 *
 * Deterministic: identical inputs ⇒ identical outputs. Zero randomness.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { LayoutRect, LayoutSize, LayoutStyle } from './LayoutModel';
import { insetRect } from './LayoutModel';
import type { LayoutConstraints } from './ConstraintModel';
import { resolveConstraintRect } from './ConstraintResolver';
import { resolveSizedLength, normalizeNumber } from './LayoutSizing';

export interface ChildLayoutInput {
  readonly nodeId: string;
  readonly intrinsic: LayoutSize;
  readonly constraints: LayoutConstraints;
}

export interface ResolvedChildRect {
  readonly nodeId: string;
  readonly rect: LayoutRect;
}

export interface LayoutChildrenParams {
  readonly containerRect: LayoutRect;
  readonly style: LayoutStyle;
  readonly children: ReadonlyArray<ChildLayoutInput>;
}

/**
 * Lays out the children of a container and returns a rect per child (input order).
 *
 * `mode: 'free'` — every child resolved directly by ConstraintResolver (pins/center).
 * `mode: 'auto'` — flow algorithm (sizing pool, gap, alignment, distribution, wrap).
 */
export function layoutChildren(params: LayoutChildrenParams): ResolvedChildRect[] {
  const { containerRect, style, children } = params;
  if (children.length === 0) {
    return [];
  }

  if (style.mode === 'free') {
    const contentBox = insetRect(containerRect, {
      top: style.paddingTop,
      right: style.paddingRight,
      bottom: style.paddingBottom,
      left: style.paddingLeft,
    });
    return children.map((child) => ({
      nodeId: child.nodeId,
      rect: resolveConstraintRect({
        constraints: child.constraints,
        intrinsic: child.intrinsic,
        parentRect: contentBox,
      }),
    }));
  }

  const isHorizontal = style.direction === 'horizontal';
  const contentBox = insetRect(containerRect, {
    top: style.paddingTop,
    right: style.paddingRight,
    bottom: style.paddingBottom,
    left: style.paddingLeft,
  });

  const main = isHorizontal ? axisWidth : axisHeight;
  const cross = isHorizontal ? axisHeight : axisWidth;
  const mainOrigin = isHorizontal ? axisX : axisY;
  const crossOrigin = isHorizontal ? axisY : axisX;

  const childCount = children.length;
  const gapTotal = Math.max(0, childCount - 1) * style.gap;

  // -- Phase A: resolve main & cross lengths per child ----------------------
  const mainLen: number[] = new Array(childCount).fill(0);
  const crossLen: number[] = new Array(childCount).fill(0);
  const isSpan: boolean[] = new Array(childCount).fill(false);
  const isFill: boolean[] = new Array(childCount).fill(false);

  let fillCount = 0;
  let nonFillMainSum = 0;

  for (let i = 0; i < childCount; i++) {
    const child = children[i];
    const mainMode = isHorizontal ? child.constraints.sizing.width : child.constraints.sizing.height;
    const crossMode = isHorizontal ? child.constraints.sizing.height : child.constraints.sizing.width;
    const mainExplicit = isHorizontal ? child.constraints.width : child.constraints.height;
    const crossExplicit = isHorizontal ? child.constraints.height : child.constraints.width;
    const mainMin = isHorizontal ? child.constraints.minWidth : child.constraints.minHeight;
    const mainMax = isHorizontal ? child.constraints.maxWidth : child.constraints.maxHeight;
    const crossMin = isHorizontal ? child.constraints.minHeight : child.constraints.minWidth;
    const crossMax = isHorizontal ? child.constraints.maxHeight : child.constraints.maxWidth;
    const intrinsicMain = isHorizontal ? child.intrinsic.width : child.intrinsic.height;
    const intrinsicCross = isHorizontal ? child.intrinsic.height : child.intrinsic.width;

    if (mainMode === 'fill') {
      isFill[i] = true;
      fillCount += 1;
    } else if (mainMode === 'stretch') {
      // Main-axis stretch behaves as fit (documented contract).
      mainLen[i] = resolveSizedLength({
        mode: 'fit',
        intrinsic: intrinsicMain,
        parentLength: main(contentBox),
        min: mainMin,
        max: mainMax,
      });
      nonFillMainSum += mainLen[i];
    } else {
      mainLen[i] = resolveSizedLength({
        mode: mainMode,
        explicit: mainExplicit,
        intrinsic: intrinsicMain,
        parentLength: main(contentBox),
        min: mainMin,
        max: mainMax,
      });
      nonFillMainSum += mainLen[i];
    }

    if (crossMode === 'stretch' || crossMode === 'fill') {
      isSpan[i] = true;
    } else {
      crossLen[i] = resolveSizedLength({
        mode: crossMode,
        explicit: crossExplicit,
        intrinsic: intrinsicCross,
        parentLength: cross(contentBox),
        min: crossMin,
        max: crossMax,
      });
    }
  }

  // -- Fill pool on the main axis -------------------------------------------
  if (fillCount > 0) {
    const remaining = main(contentBox) - nonFillMainSum - gapTotal;
    const share = Math.max(0, remaining) / fillCount;
    for (let i = 0; i < childCount; i++) {
      if (!isFill[i]) {
        continue;
      }
      const child = children[i];
      const minV = isHorizontal ? child.constraints.minWidth : child.constraints.minHeight;
      const maxV = isHorizontal ? child.constraints.maxWidth : child.constraints.maxHeight;
      mainLen[i] = resolveSizedLength({
        mode: 'fixed',
        explicit: share,
        intrinsic: 0,
        parentLength: main(contentBox),
        min: minV,
        max: maxV,
      });
    }
  }

  // -- Phase B: build rows (wrap-aware) --------------------------------------
  const rows: number[][] = [];
  let currentRow: number[] = [];
  let cursorMain = 0; // relative offset from content main start
  const gapMain = style.gap;

  for (let i = 0; i < childCount; i++) {
    const fits = cursorMain + mainLen[i] <= main(contentBox) + 0.0001;
    if (style.wrap && !fits && currentRow.length > 0) {
      rows.push(currentRow);
      currentRow = [];
      cursorMain = 0;
    }
    currentRow.push(i);
    cursorMain += mainLen[i] + gapMain;
  }
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  // -- Phase C: per-row cross size & stretch children ------------------------
  const rowHeight: number[] = new Array(rows.length).fill(cross(contentBox));
  for (let r = 0; r < rows.length; r++) {
    let maxCross = 0;
    let hasSpan = false;
    for (const i of rows[r]) {
      if (isSpan[i]) {
        hasSpan = true;
      } else {
        maxCross = Math.max(maxCross, crossLen[i]);
      }
    }
    if (hasSpan && maxCross === 0) {
      rowHeight[r] = style.wrap ? 0 : cross(contentBox);
    } else if (hasSpan) {
      rowHeight[r] = maxCross;
    } else {
      rowHeight[r] = maxCross;
    }
  }

  // -- Phase D: positions (distribution on the main axis, alignment on cross) --
  const results: ResolvedChildRect[] = new Array(childCount);
  let rowMainStartCumulative = 0;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const n = row.length;
    const rowMainSpan =
      row.reduce((acc, i) => acc + mainLen[i], 0) + Math.max(0, n - 1) * gapMain;
    const free = Math.max(0, main(contentBox) - rowMainSpan);

    let offset0 = 0;
    let gapEff = gapMain;
    switch (style.justifyContent) {
      case 'center':
        offset0 = free / 2;
        break;
      case 'end':
        offset0 = free;
        break;
      case 'space-between':
        gapEff = n > 1 ? gapMain + free / (n - 1) : gapMain;
        break;
      case 'space-around':
        offset0 = n > 0 ? free / (2 * n) : 0;
        gapEff = n > 0 ? gapMain + free / n : gapMain;
        break;
      case 'space-evenly':
        offset0 = free / (n + 1);
        gapEff = gapMain + free / (n + 1);
        break;
      case 'start':
      default:
        offset0 = 0;
        gapEff = gapMain;
        break;
    }

    let cursorFrom = mainOrigin(contentBox) + offset0;
    for (const i of row) {
      const crossEffective = isSpan[i] ? rowHeight[r] : crossLen[i];
      let crossOffset = 0;
      if (style.alignItems === 'center') {
        crossOffset = (rowHeight[r] - crossEffective) / 2;
      } else if (style.alignItems === 'end') {
        crossOffset = rowHeight[r] - crossEffective;
      }
      // 'start' | 'stretch' → offset 0

      const crossStartCoord = crossOrigin(contentBox) + rowMainStartCumulative + crossOffset;

      const rect =
        isHorizontal
          ? {
              x: cursorFrom,
              y: crossStartCoord,
              width: mainLen[i],
              height: crossEffective,
            }
          : {
              x: crossStartCoord,
              y: cursorFrom,
              width: crossEffective,
              height: mainLen[i],
            };

      results[i] = {
        nodeId: children[i].nodeId,
        rect: {
          x: normalizeNumber(rect.x),
          y: normalizeNumber(rect.y),
          width: normalizeNumber(rect.width),
          height: normalizeNumber(rect.height),
        },
      };
      cursorFrom += mainLen[i] + gapEff;
    }

    rowMainStartCumulative += rowHeight[r] + gapMain;
  }

  return results;
}

// -- Axis coordinate helpers ------------------------------------------------
//
// main axis = flow direction: X (width) for horizontal, Y (height) for vertical.
// cross axis = perpendicular: Y (height) for horizontal, X (width) for vertical.

const axisWidth = (rect: LayoutRect): number => rect.width;
const axisHeight = (rect: LayoutRect): number => rect.height;
const axisX = (rect: LayoutRect): number => rect.x;
const axisY = (rect: LayoutRect): number => rect.y;