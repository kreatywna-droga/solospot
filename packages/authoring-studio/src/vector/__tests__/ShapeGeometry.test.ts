import { describe, it, expect } from 'vitest';
import { VectorGeometry } from '../VectorGeometry';
import { createRectangleNode, createEllipseNode, createPolygonNode } from '../VectorDomainModel';

describe('ETAP 3 — ShapeGeometry', () => {
  it('computes bounding box with stroke width expansion', () => {
    const rect = createRectangleNode('r1', 10, 10, 100, 100, 0, undefined, { width: 10 });
    const bounds = VectorGeometry.computeBoundingBox(rect);
    expect(bounds.x).toBe(5);
    expect(bounds.y).toBe(5);
    expect(bounds.width).toBe(110);
    expect(bounds.height).toBe(110);
  });

  it('generates regular polygon vertices correctly', () => {
    const vertices = VectorGeometry.polygonGeometry(4, 50, { x: 50, y: 50 });
    expect(vertices).toHaveLength(4);
    expect(vertices[0].x).toBeCloseTo(50);
    expect(vertices[0].y).toBeCloseTo(0);
  });

  it('parses SVG path string into command DTOs', () => {
    const cmds = VectorGeometry.parsePathGeometry('M 10 20 L 30 40 Z');
    expect(cmds).toHaveLength(3);
    expect(cmds[0].type).toBe('M');
    expect(cmds[0].args).toEqual([10, 20]);
    expect(cmds[1].type).toBe('L');
    expect(cmds[1].args).toEqual([30, 40]);
    expect(cmds[2].type).toBe('Z');
  });

  it('computes path length', () => {
    const len = VectorGeometry.computePathLength('M 0 0 L 100 0 L 100 100 Z');
    expect(len).toBeGreaterThan(200);
  });

  it('tests point-in-shape for rectangle and ellipse', () => {
    const rect = createRectangleNode('r1', 0, 0, 100, 100);
    expect(VectorGeometry.pointInShape({ x: 50, y: 50 }, rect)).toBe(true);
    expect(VectorGeometry.pointInShape({ x: 150, y: 50 }, rect)).toBe(false);

    const ellipse = createEllipseNode('e1', 0, 0, 100, 100);
    expect(VectorGeometry.pointInShape({ x: 50, y: 50 }, ellipse)).toBe(true);
    expect(VectorGeometry.pointInShape({ x: 1, y: 1 }, ellipse)).toBe(false);
  });

  it('checks bounding box intersection between shapes', () => {
    const r1 = createRectangleNode('r1', 0, 0, 100, 100);
    const r2 = createRectangleNode('r2', 50, 50, 100, 100);
    const r3 = createRectangleNode('r3', 200, 200, 100, 100);

    expect(VectorGeometry.checkShapeIntersection(r1, r2)).toBe(true);
    expect(VectorGeometry.checkShapeIntersection(r1, r3)).toBe(false);
  });

  it('applies aspect ratio locking constraints', () => {
    const constrained = VectorGeometry.applyShapeConstraints(150, 80, true);
    expect(constrained.width).toBe(150);
    expect(constrained.height).toBe(150);
  });
});
