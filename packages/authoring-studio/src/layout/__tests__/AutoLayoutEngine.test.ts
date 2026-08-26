/**
 * AutoLayoutEngine.test.ts — Sprint S29
 *
 * Flow engine: horizontal/vertical stacking, gap, padding, alignment,
 * distribution, fill pool, stretch sizing and wrapping.
 */

import { describe, it, expect } from 'vitest';
import { layoutChildren, type ChildLayoutInput } from '../AutoLayoutEngine';
import { createLayoutStyle } from '../LayoutModel';
import { createLayoutConstraints } from '../ConstraintModel';

const rect = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });

function child(
  nodeId: string,
  partial: Parameters<typeof createLayoutConstraints>[0],
  intrinsic = { width: 0, height: 0 }
): ChildLayoutInput {
  return { nodeId, intrinsic, constraints: createLayoutConstraints(partial) };
}

describe('AutoLayoutEngine', () => {
  it('stacks children horizontally with a gap', () => {
    const result = layoutChildren({
      containerRect: rect(0, 0, 500, 200),
      style: createLayoutStyle({ direction: 'horizontal', gap: 10 }),
      children: [
        child('a', { width: 100, height: 40 }),
        child('b', { width: 100, height: 40 }),
        child('c', { width: 100, height: 40 }),
      ],
    });
    expect(result.map((r) => r.rect)).toEqual([
      rect(0, 0, 100, 40),
      rect(110, 0, 100, 40),
      rect(220, 0, 100, 40),
    ]);
  });

  it('stacks children vertically with a gap', () => {
    const result = layoutChildren({
      containerRect: rect(0, 0, 200, 500),
      style: createLayoutStyle({ direction: 'vertical', gap: 10 }),
      children: [
        child('a', { width: 100, height: 100 }),
        child('b', { width: 100, height: 100 }),
        child('c', { width: 100, height: 100 }),
      ],
    });
    expect(result.map((r) => r.rect)).toEqual([
      rect(0, 0, 100, 100),
      rect(0, 110, 100, 100),
      rect(0, 220, 100, 100),
    ]);
  });

  it('respects uniform container padding', () => {
    const result = layoutChildren({
      containerRect: rect(0, 0, 400, 300),
      style: createLayoutStyle({ direction: 'vertical', padding: 20 }),
      children: [child('a', { width: 100, height: 50 })],
    });
    expect(result[0].rect).toEqual(rect(20, 20, 100, 50));
  });

  it('aligns children to the cross-axis end', () => {
    const result = layoutChildren({
      containerRect: rect(0, 0, 500, 200),
      style: createLayoutStyle({ direction: 'horizontal', gap: 10, alignItems: 'end' }),
      children: [
        child('a', { width: 100, height: 20 }),
        child('b', { width: 100, height: 40 }),
        child('c', { width: 100, height: 20 }),
      ],
    });
    expect(result.map((r) => r.rect)).toEqual([
      rect(0, 20, 100, 20),
      rect(110, 0, 100, 40),
      rect(220, 20, 100, 20),
    ]);
  });

  it('centers a line with justifyContent center', () => {
    const result = layoutChildren({
      containerRect: rect(0, 0, 500, 200),
      style: createLayoutStyle({ direction: 'horizontal', gap: 10, justifyContent: 'center' }),
      children: [
        child('a', { width: 100, height: 40 }),
        child('b', { width: 100, height: 40 }),
        child('c', { width: 100, height: 40 }),
      ],
    });
    expect(result.map((r) => r.rect.x)).toEqual([90, 200, 310]);
  });

  it('distributes space with space-between', () => {
    const result = layoutChildren({
      containerRect: rect(0, 0, 500, 200),
      style: createLayoutStyle({ direction: 'horizontal', gap: 10, justifyContent: 'space-between' }),
      children: [
        child('a', { width: 100, height: 40 }),
        child('b', { width: 100, height: 40 }),
        child('c', { width: 100, height: 40 }),
      ],
    });
    expect(result.map((r) => r.rect.x)).toEqual([0, 200, 400]);
  });

  it('allocates remaining space to fill children', () => {
    const result = layoutChildren({
      containerRect: rect(0, 0, 300, 200),
      style: createLayoutStyle({ direction: 'horizontal' }),
      children: [
        child('a', { width: 100, height: 40 }),
        child('b', { sizing: { width: 'fill', height: 'fixed' }, height: 40 }),
        child('c', { width: 80, height: 40 }),
      ],
    });
    expect(result.map((r) => r.rect)).toEqual([
      rect(0, 0, 100, 40),
      rect(100, 0, 120, 40),
      rect(220, 0, 80, 40),
    ]);
  });

  it('stretches a child cross size to the container extent', () => {
    const result = layoutChildren({
      containerRect: rect(0, 0, 600, 300),
      style: createLayoutStyle({ direction: 'horizontal' }),
      children: [child('a', { width: 100, sizing: { width: 'fixed', height: 'stretch' } })],
    });
    expect(result[0].rect).toEqual(rect(0, 0, 100, 300));
  });

  it('wraps children onto new rows when they overflow the main axis', () => {
    const result = layoutChildren({
      containerRect: rect(0, 0, 150, 300),
      style: createLayoutStyle({ direction: 'horizontal', gap: 5, wrap: true }),
      children: [
        child('a', { width: 80, height: 40 }),
        child('b', { width: 80, height: 40 }),
        child('c', { width: 80, height: 40 }),
      ],
    });
    expect(result.map((r) => r.rect)).toEqual([
      rect(0, 0, 80, 40),
      rect(0, 45, 80, 40),
      rect(0, 90, 80, 40),
    ]);
  });

  it('free mode resolves children purely by constraints', () => {
    const result = layoutChildren({
      containerRect: rect(0, 0, 400, 300),
      style: createLayoutStyle({ mode: 'free' }),
      children: [child('a', { left: 20, top: 10, width: 50, height: 30 })],
    });
    expect(result[0].rect).toEqual(rect(20, 10, 50, 30));
  });

  it('is deterministic for identical inputs', () => {
    const params = {
      containerRect: rect(0, 0, 500, 200),
      style: createLayoutStyle({ direction: 'horizontal', gap: 10, justifyContent: 'space-between' }),
      children: [
        child('a', { width: 120, height: 30 }),
        child('b', { width: 90, height: 60 }),
      ],
    };
    const first = layoutChildren(params);
    const second = layoutChildren(params);
    expect(first).toEqual(second);
  });
});