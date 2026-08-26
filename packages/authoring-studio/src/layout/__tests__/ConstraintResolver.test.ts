/**
 * ConstraintResolver.test.ts — Sprint S29
 *
 * Resolves single-node effective rects: fixed, fill, center, pins, min/max,
 * aspect ratio and deterministic conflict precedence.
 */

import { describe, it, expect } from 'vitest';
import { resolveConstraintRect } from '../ConstraintResolver';
import { createLayoutConstraints } from '../ConstraintModel';
import type { LayoutRect } from '../LayoutModel';

const PARENT: LayoutRect = { x: 0, y: 0, width: 1000, height: 800 };

function resolve(partial: Parameters<typeof createLayoutConstraints>[0], intrinsic = { width: 0, height: 0 }) {
  return resolveConstraintRect({
    constraints: createLayoutConstraints(partial),
    intrinsic,
    parentRect: PARENT,
  });
}

describe('ConstraintResolver', () => {
  it('resolves a fixed sized node at the parent origin', () => {
    const rect = resolve({ width: 300, height: 120 });
    expect(rect).toEqual({ x: 0, y: 0, width: 300, height: 120 });
  });

  it('resolves fill as parent minus pinned edges', () => {
    const rect = resolve({
      left: 50,
      right: 50,
      sizing: { width: 'fill', height: 'fixed' },
      height: 50,
    });
    expect(rect.width).toBe(900);
    expect(rect.x).toBe(50);
  });

  it('centers a node horizontally and vertically', () => {
    const rect = resolve({ width: 300, height: 200, centerX: true, centerY: true });
    expect(rect.x).toBe((1000 - 300) / 2);
    expect(rect.y).toBe((800 - 200) / 2);
  });

  it('anchors a node to the right edge when right pin is set', () => {
    const rect = resolve({ width: 200, height: 40, right: 0 });
    expect(rect.x).toBe(1000 - 200);
  });

  it('gives left pin precedence over centerX (deterministic conflict)', () => {
    const rect = resolve({ width: 200, height: 40, left: 25, centerX: true });
    expect(rect.x).toBe(25);
  });

  it('clamps computed dimensions to min/max', () => {
    const squeezed = resolve({ width: 50, minWidth: 90 });
    expect(squeezed.width).toBe(90);

    const huge = resolve({ width: 5000, maxWidth: 2000 });
    expect(huge.width).toBe(2000);
  });

  it('derives height from aspect ratio when only width is explicit', () => {
    const rect = resolve({ width: 320, aspectRatio: 4 / 3 });
    expect(rect.height).toBe(240);
    expect(rect.width).toBe(320);
  });

  it('derives width from aspect ratio when only height is explicit', () => {
    const rect = resolve({ height: 90, aspectRatio: 4 / 3 });
    expect(rect.width).toBe(120);
  });

  it('ignores aspect ratio when both dimensions are explicit (explicit wins)', () => {
    const rect = resolve({ width: 200, height: 200, aspectRatio: 2 });
    expect(rect).toEqual({ x: 0, y: 0, width: 200, height: 200 });
  });

  it('falls back to intrinsic size when no explicit length is provided', () => {
    const rect = resolve({}, { width: 64, height: 48 });
    expect(rect).toEqual({ x: 0, y: 0, width: 64, height: 48 });
  });

  it('supports percentage lengths against the parent', () => {
    const rect = resolve({ width: '50%', height: '25%' });
    expect(rect.width).toBe(500);
    expect(rect.height).toBe(200);
  });

  it('is deterministic for identical inputs', () => {
    const a = resolve({ width: 120, centerX: true, minWidth: 100 });
    const b = resolve({ width: 120, centerX: true, minWidth: 100 });
    expect(a).toEqual(b);
  });
});