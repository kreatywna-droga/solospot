import { describe, it, expect } from 'vitest';
import { VectorBooleanEngine } from '../VectorBooleanEngine';
import { createRectangleNode, createPathNode } from '../VectorDomainModel';

describe('VectorBooleanEngine (Sprint S18 / G1-22)', () => {
  const rectA = createRectangleNode('rect_a', 0, 0, 100, 100, 0, {}, { width: 0 });
  const rectB = createRectangleNode('rect_b', 50, 50, 100, 100, 0, {}, { width: 0 });

  it('performs union of two vector nodes', () => {
    const result = VectorBooleanEngine.union(rectA, rectB);
    expect(result.type).toBe('path');
    expect(result.id).toContain('boolean_union_');
    expect(result.transform.x).toBe(0);
    expect(result.transform.y).toBe(0);
    expect(result.transform.width).toBe(150);
    expect(result.transform.height).toBe(150);
    
    // Check path concatenation
    expect(result.d).toContain('M 0 0 L 100 0');
    expect(result.d).toContain('M 50 50 L 150 50');
  });

  it('performs naive subtract of two vector nodes', () => {
    const result = VectorBooleanEngine.subtract(rectA, rectB);
    expect(result.type).toBe('path');
    expect(result.id).toContain('boolean_sub_');
    expect(result.transform.x).toBe(0);
    expect(result.transform.y).toBe(0);
    expect(result.transform.width).toBe(100);
    expect(result.transform.height).toBe(100);
  });

  it('performs intersection of two vector nodes', () => {
    const result = VectorBooleanEngine.intersect(rectA, rectB);
    expect(result.type).toBe('path');
    expect(result.id).toContain('boolean_int_');
    
    // Intersection bounding box
    expect(result.transform.x).toBe(50);
    expect(result.transform.y).toBe(50);
    expect(result.transform.width).toBe(50);
    expect(result.transform.height).toBe(50);
  });

  it('handles disjoint intersection', () => {
    const rectC = createRectangleNode('rect_c', 200, 200, 100, 100);
    const result = VectorBooleanEngine.intersect(rectA, rectC);
    
    expect(result.transform.width).toBe(0);
    expect(result.transform.height).toBe(0);
    expect(result.d).toBe('');
  });

  it('performs exclude on two vector nodes', () => {
    const result = VectorBooleanEngine.exclude(rectA, rectB);
    expect(result.type).toBe('path');
    expect(result.id).toContain('boolean_xor_');
    
    // Bounds encompass both
    expect(result.transform.x).toBe(0);
    expect(result.transform.y).toBe(0);
    expect(result.transform.width).toBe(150);
    expect(result.transform.height).toBe(150);
  });

  it('converts vector node to path string appropriately', () => {
    const pathNode = createPathNode('p_1', 'M 10 10 L 20 20 Z', 10, 10, 10, 10);
    const pathStr = VectorBooleanEngine.convertNodeToPathString(pathNode);
    expect(pathStr).toBe('M 10 10 L 20 20 Z');
  });

  it('safely routes performOperation dispatch', () => {
    const resUnion = VectorBooleanEngine.performOperation('union', rectA, rectB);
    expect(resUnion.id).toContain('boolean_union_');
    
    const resExclude = VectorBooleanEngine.performOperation('exclude', rectA, rectB);
    expect(resExclude.id).toContain('boolean_xor_');
  });
});
