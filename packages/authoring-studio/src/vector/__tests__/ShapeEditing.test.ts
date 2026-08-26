import { describe, it, expect } from 'vitest';
import { VectorEditingEngine } from '../VectorEditingEngine';
import { createRectangleNode } from '../VectorDomainModel';

describe('ETAP 2 — ShapeEditing', () => {
  it('creates shapes via VectorEditingEngine', () => {
    const shape = VectorEditingEngine.createShape('s1', 'rectangle', 20, 30, 80, 60);
    expect(shape.id).toBe('s1');
    expect(shape.type).toBe('rectangle');
    expect(shape.transform.x).toBe(20);
    expect(shape.transform.y).toBe(30);
  });

  it('duplicates shape with offset', () => {
    const rect = createRectangleNode('r1', 100, 100, 50, 50);
    const dup = VectorEditingEngine.duplicateShape(rect, 30, 30);
    expect(dup.id).not.toBe(rect.id);
    expect(dup.transform.x).toBe(130);
    expect(dup.transform.y).toBe(130);
  });

  it('resizes and rotates shape', () => {
    const rect = createRectangleNode('r1', 0, 0, 100, 100);
    const resized = VectorEditingEngine.resizeShape(rect, 200, 150);
    expect(resized.transform.width).toBe(200);
    expect(resized.transform.height).toBe(150);

    const rotated = VectorEditingEngine.rotateShape(resized, 45);
    expect(rotated.transform.rotationDeg).toBe(45);
  });

  it('moves shape by delta', () => {
    const rect = createRectangleNode('r1', 10, 10, 50, 50);
    const moved = VectorEditingEngine.moveShape(rect, 25, -5);
    expect(moved.transform.x).toBe(35);
    expect(moved.transform.y).toBe(5);
  });

  it('updates fill, stroke, and corner radius', () => {
    const rect = createRectangleNode('r1', 0, 0, 100, 100);
    const filled = VectorEditingEngine.updateFill(rect, { color: '#00FF00' });
    expect(filled.fill?.color).toBe('#00FF00');

    const stroked = VectorEditingEngine.updateStroke(filled, { width: 5 });
    expect(stroked.stroke?.width).toBe(5);

    const rounded = VectorEditingEngine.updateCornerRadius(stroked, 12);
    expect((rounded as any).cornerRadius).toBe(12);
  });
});
