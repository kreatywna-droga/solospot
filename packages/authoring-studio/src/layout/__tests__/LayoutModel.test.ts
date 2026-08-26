/**
 * LayoutModel.test.ts — Sprint S29
 *
 * DTO defaults, factories and structural immutability of LayoutModel types.
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LAYOUT_STYLE,
  createLayoutStyle,
  createLayoutRect,
  createLayoutSize,
  insetRect,
  PAGE_DEFAULT_HEIGHT,
} from '../LayoutModel';

describe('LayoutModel', () => {
  it('exposes deterministic default layout style', () => {
    expect(DEFAULT_LAYOUT_STYLE.mode).toBe('auto');
    expect(DEFAULT_LAYOUT_STYLE.direction).toBe('vertical');
    expect(DEFAULT_LAYOUT_STYLE.gap).toBe(0);
    expect(DEFAULT_LAYOUT_STYLE.alignItems).toBe('start');
    expect(DEFAULT_LAYOUT_STYLE.justifyContent).toBe('start');
    expect(DEFAULT_LAYOUT_STYLE.wrap).toBe(false);
  });

  it('creates a layout style with uniform padding', () => {
    const style = createLayoutStyle({ padding: 20 });
    expect(style.paddingTop).toBe(20);
    expect(style.paddingRight).toBe(20);
    expect(style.paddingBottom).toBe(20);
    expect(style.paddingLeft).toBe(20);
  });

  it('lets per-side padding override the uniform default', () => {
    const style = createLayoutStyle({ padding: 12, paddingLeft: 32 });
    expect(style.paddingLeft).toBe(32);
    expect(style.paddingTop).toBe(12);
  });

  it('produces stable rect/size factories', () => {
    const rect = createLayoutRect({ x: 1, y: 2, width: 3, height: 4 });
    expect(rect).toEqual({ x: 1, y: 2, width: 3, height: 4 });

    const size = createLayoutSize({ width: 10, height: 20 });
    expect(size).toEqual({ width: 10, height: 20 });
    expect(createLayoutSize()).toEqual({ width: 0, height: 0 });
  });

  it('immutably insets a rect', () => {
    const rect = createLayoutRect({ x: 0, y: 0, width: 200, height: 100 });
    const inset = insetRect(rect, { top: 10, right: 20, bottom: 15, left: 5 });
    expect(inset).toEqual({ x: 5, y: 10, width: 175, height: 75 });
    // original untouched (immutability)
    expect(rect).toEqual({ x: 0, y: 0, width: 200, height: 100 });
  });

  it('does not produce negative inset dimensions', () => {
    const inset = insetRect(createLayoutRect({ x: 0, y: 0, width: 10, height: 10 }), {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    });
    expect(inset.width).toBe(0);
    expect(inset.height).toBe(0);
  });

  it('declares the deterministic page default height', () => {
    expect(PAGE_DEFAULT_HEIGHT).toBe(900);
  });
});