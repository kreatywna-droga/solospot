import { describe, it, expect } from 'vitest';
import {
  createRectangleNode,
  createEllipseNode,
  createPolygonNode,
  createLineNode,
  createPathNode,
  createShapeGroupNode,
} from '../VectorDomainModel';

describe('ETAP 1 — ShapeDomainModel', () => {
  it('creates RectangleNode with default parameters', () => {
    const rect = createRectangleNode('rect_1', 10, 20, 100, 50, 8);
    expect(rect.id).toBe('rect_1');
    expect(rect.type).toBe('rectangle');
    expect(rect.transform.x).toBe(10);
    expect(rect.transform.y).toBe(20);
    expect(rect.transform.width).toBe(100);
    expect(rect.transform.height).toBe(50);
    expect(rect.cornerRadius).toBe(8);
    expect(rect.fill?.color).toBe('#3B82F6');
    expect(rect.stroke?.width).toBe(2);
  });

  it('creates EllipseNode with custom fill & stroke', () => {
    const ellipse = createEllipseNode('ellipse_1', 50, 50, 80, 80, { color: '#FF0000' }, { width: 4 });
    expect(ellipse.id).toBe('ellipse_1');
    expect(ellipse.type).toBe('ellipse');
    expect(ellipse.fill?.color).toBe('#FF0000');
    expect(ellipse.stroke?.width).toBe(4);
  });

  it('creates PolygonNode with sides and star ratio', () => {
    const poly = createPolygonNode('poly_1', 5, 0, 0, 100, 100, 0.5);
    expect(poly.type).toBe('polygon');
    expect(poly.sides).toBe(5);
    expect(poly.starRatio).toBe(0.5);
  });

  it('creates LineNode with endpoints', () => {
    const line = createLineNode('line_1', 0, 0, 200, 150);
    expect(line.type).toBe('line');
    expect(line.x1).toBe(0);
    expect(line.y1).toBe(0);
    expect(line.x2).toBe(200);
    expect(line.y2).toBe(150);
  });

  it('creates PathNode with SVG path string', () => {
    const path = createPathNode('path_1', 'M 0 0 L 10 10 Z', 0, 0, 10, 10);
    expect(path.type).toBe('path');
    expect(path.d).toBe('M 0 0 L 10 10 Z');
  });

  it('creates ShapeGroupNode containing children', () => {
    const r1 = createRectangleNode('r1', 0, 0, 50, 50);
    const r2 = createRectangleNode('r2', 50, 50, 50, 50);
    const group = createShapeGroupNode('g1', [r1, r2], 0, 0, 100, 100);
    expect(group.type).toBe('group');
    expect(group.children).toHaveLength(2);
  });
});
