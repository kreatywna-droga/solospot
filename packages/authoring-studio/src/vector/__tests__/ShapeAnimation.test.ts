import { describe, it, expect } from 'vitest';
import { VectorAnimationEngine } from '../VectorAnimationEngine';
import { createRectangleNode, createPolygonNode } from '../VectorDomainModel';

describe('ETAP 4 — ShapeAnimation', () => {
  it('applies keyframe updates to vector properties', () => {
    const rect = createRectangleNode('r1', 0, 0, 100, 100);
    const animated = VectorAnimationEngine.applyAnimatedProperties(rect, {
      x: 150,
      y: 200,
      width: 300,
      fillColor: '#FF00FF',
      strokeWidth: 8,
      cornerRadius: 16,
    });

    expect(animated.transform.x).toBe(150);
    expect(animated.transform.y).toBe(200);
    expect(animated.transform.width).toBe(300);
    expect(animated.fill?.color).toBe('#FF00FF');
    expect(animated.stroke?.width).toBe(8);
    expect((animated as any).cornerRadius).toBe(16);
  });

  it('interpolates property values linearly', () => {
    const val = VectorAnimationEngine.interpolateProperty(10, 50, 0.5);
    expect(val).toBe(30);
  });

  it('animates polygon sides and starRatio', () => {
    const poly = createPolygonNode('p1', 3, 0, 0, 100, 100);
    const animated = VectorAnimationEngine.applyAnimatedProperties(poly, {
      polygonSides: 5,
      starRatio: 0.4,
    });

    expect((animated as any).sides).toBe(5);
    expect((animated as any).starRatio).toBe(0.4);
  });
});
