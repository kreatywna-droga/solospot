import { describe, it, expect } from 'vitest';
import { VectorEditingEngine } from '../VectorEditingEngine';
import { createRectangleNode } from '../VectorDomainModel';

describe('ETAP 2/3 — ShapeTransform', () => {
  it('aligns multiple shapes to left, center, right, top, middle, bottom', () => {
    const r1 = createRectangleNode('r1', 10, 10, 50, 50);
    const r2 = createRectangleNode('r2', 100, 100, 50, 50);

    const alignedLeft = VectorEditingEngine.alignShapes([r1, r2], 'left');
    expect(alignedLeft[0].transform.x).toBe(10);
    expect(alignedLeft[1].transform.x).toBe(10);

    const alignedRight = VectorEditingEngine.alignShapes([r1, r2], 'right');
    expect(alignedRight[0].transform.x).toBe(100);
    expect(alignedRight[1].transform.x).toBe(100);
  });

  it('distributes 3 shapes horizontally', () => {
    const r1 = createRectangleNode('r1', 0, 0, 20, 20);
    const r2 = createRectangleNode('r2', 10, 0, 20, 20);
    const r3 = createRectangleNode('r3', 100, 0, 20, 20);

    const distributed = VectorEditingEngine.distributeShapes([r1, r2, r3], 'horizontal');
    expect(distributed[0].transform.x).toBe(0);
    expect(distributed[1].transform.x).toBe(50);
    expect(distributed[2].transform.x).toBe(100);
  });
});
