/**
 * FluidSizingEngine.ts — Sprint S28 Adaptive Fluid Sizing & Typography Engine
 *
 * Provides linear interpolation for fluid dimensions & typography across viewport width ranges.
 * Generates CSS clamp(min, preferred, max) strings and frame-accurate pixel calculations.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

export interface FluidSizeConfig {
  readonly minSizePx: number;
  readonly maxSizePx: number;
  readonly minViewportPx: number;
  readonly maxViewportPx: number;
}

export interface FluidSizeCalculationResult {
  readonly calculatedSizePx: number;
  readonly isClampedMin: boolean;
  readonly isClampedMax: boolean;
  readonly cssClampString: string;
}

/**
 * Computes exact pixel size for a given viewport width using linear fluid interpolation,
 * clamped between minSizePx and maxSizePx.
 */
export function computeFluidSize(
  config: FluidSizeConfig,
  currentViewportWidthPx: number
): FluidSizeCalculationResult {
  const { minSizePx, maxSizePx, minViewportPx, maxViewportPx } = config;

  if (minViewportPx >= maxViewportPx) {
    throw new Error('minViewportPx must be strictly less than maxViewportPx.');
  }

  // 1. Calculate linear interpolation slope (vw factor)
  const slope = (maxSizePx - minSizePx) / (maxViewportPx - minViewportPx);
  const yAxisIntersectionPx = minSizePx - slope * minViewportPx;

  // 2. Evaluate size at current viewport
  const rawSize = currentViewportWidthPx * slope + yAxisIntersectionPx;
  const clampedSize = Math.max(minSizePx, Math.min(maxSizePx, rawSize));

  const isClampedMin = rawSize <= minSizePx;
  const isClampedMax = rawSize >= maxSizePx;

  // 3. Format CSS clamp() string: clamp(MINpx, VALvw + VALpx, MAXpx)
  const vwValue = (slope * 100).toFixed(4);
  const remValue = (yAxisIntersectionPx / 16).toFixed(4);
  const minRem = (minSizePx / 16).toFixed(4);
  const maxRem = (maxSizePx / 16).toFixed(4);

  const cssClampString = `clamp(${minRem}rem, ${vwValue}vw + ${remValue}rem, ${maxRem}rem)`;

  return {
    calculatedSizePx: Math.round(clampedSize * 100) / 100,
    isClampedMin,
    isClampedMax,
    cssClampString,
  };
}

/**
 * Computes fluid typography config defaults from base desktop font size.
 */
export function createFluidTypographyDefaults(
  desktopFontSizePx: number,
  mobileScaleFactor: number = 0.75
): FluidSizeConfig {
  const minSizePx = Math.max(12, Math.round(desktopFontSizePx * mobileScaleFactor));
  return {
    minSizePx,
    maxSizePx: desktopFontSizePx,
    minViewportPx: 375, // mobile
    maxViewportPx: 1440, // desktop
  };
}
