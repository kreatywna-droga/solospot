/**
 * FluidSizingEngine.test.ts — Sprint S28
 *
 * Unit tests for fluid typography and adaptive dimensions calculations,
 * clamping bounds, and CSS clamp() string formatting.
 */

import { describe, it, expect } from 'vitest';
import {
  computeFluidSize,
  createFluidTypographyDefaults,
  type FluidSizeConfig,
} from '../FluidSizingEngine';

describe('FluidSizingEngine', () => {
  const config: FluidSizeConfig = {
    minSizePx: 16,
    maxSizePx: 32,
    minViewportPx: 375,
    maxViewportPx: 1440,
  };

  it('calculates min clamped size at min viewport or below', () => {
    const resultAtMin = computeFluidSize(config, 375);
    expect(resultAtMin.calculatedSizePx).toBe(16);
    expect(resultAtMin.isClampedMin).toBe(true);
    expect(resultAtMin.isClampedMax).toBe(false);

    const resultBelowMin = computeFluidSize(config, 300);
    expect(resultBelowMin.calculatedSizePx).toBe(16);
    expect(resultBelowMin.isClampedMin).toBe(true);
  });

  it('calculates max clamped size at max viewport or above', () => {
    const resultAtMax = computeFluidSize(config, 1440);
    expect(resultAtMax.calculatedSizePx).toBe(32);
    expect(resultAtMax.isClampedMax).toBe(true);

    const resultAboveMax = computeFluidSize(config, 1920);
    expect(resultAboveMax.calculatedSizePx).toBe(32);
    expect(resultAboveMax.isClampedMax).toBe(true);
  });

  it('interpolates fluid size linearly between min and max viewports', () => {
    const midViewport = (375 + 1440) / 2; // 907.5px
    const resultMid = computeFluidSize(config, midViewport);

    expect(resultMid.calculatedSizePx).toBe(24);
    expect(resultMid.isClampedMin).toBe(false);
    expect(resultMid.isClampedMax).toBe(false);
  });

  it('generates valid CSS clamp() expression string', () => {
    const result = computeFluidSize(config, 800);
    expect(result.cssClampString).toContain('clamp(');
    expect(result.cssClampString).toContain('vw +');
    expect(result.cssClampString).toContain('rem');
  });

  it('creates fluid typography default bounds from base font size', () => {
    const defaults = createFluidTypographyDefaults(48, 0.5);
    expect(defaults.maxSizePx).toBe(48);
    expect(defaults.minSizePx).toBe(24);
    expect(defaults.minViewportPx).toBe(375);
    expect(defaults.maxViewportPx).toBe(1440);
  });
});
