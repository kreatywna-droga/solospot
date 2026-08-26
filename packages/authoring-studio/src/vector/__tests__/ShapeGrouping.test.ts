import { describe, it, expect } from 'vitest';
import { VectorEditingEngine } from '../VectorEditingEngine';
import { createRectangleNode } from '../VectorDomainModel';

describe('ETAP 2 — ShapeGrouping', () => {
  it('groups multiple shapes into a ShapeGroupNode', () => {
    const r1 = createRectangleNode('r1', 10, 10, 50, 50);
    const r2 = createRectangleNode('r2', 100, 100, 50, 50);

    const group = VectorEditingEngine.groupShapes('g1', [r1, r2]);
    expect(group.id).toBe('g1');
    expect(group.type).toBe('group');
    expect(group.transform.x).toBe(10);
    expect(group.transform.y).toBe(10);
    expect(group.transform.width).toBe(140);
    expect(group.transform.height).toBe(140);
    expect(group.children).toHaveLength(2);
  });

  it('ungroups a ShapeGroupNode into child shapes with relative transform restoration', () => {
    const r1 = createRectangleNode('r1', 10, 10, 50, 50);
    const group = VectorEditingEngine.groupShapes('g1', [r1]);
    const children = VectorEditingEngine.ungroupShape(group);

    expect(children).toHaveLength(1);
    expect(children[0].transform.x).toBe(20);
    expect(children[0].transform.y).toBe(20);
  });

  it('reorders layer stack (bringToFront, sendToBack)', () => {
    const r1 = createRectangleNode('r1', 0, 0, 10, 10);
    const r2 = createRectangleNode('r2', 0, 0, 10, 10);
    const r3 = createRectangleNode('r3', 0, 0, 10, 10);

    const reorderedFront = VectorEditingEngine.reorderShapes([r1, r2, r3], 'r1', 'bringToFront');
    expect(reorderedFront[2].id).toBe('r1');

    const reorderedBack = VectorEditingEngine.reorderShapes([r1, r2, r3], 'r3', 'sendToBack');
    expect(reorderedBack[0].id).toBe('r3');
  });
});
