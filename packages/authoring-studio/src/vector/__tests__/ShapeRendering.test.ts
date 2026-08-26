import { describe, it, expect } from 'vitest';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';
import { createRectangleNode, createEllipseNode, createPolygonNode, createLineNode, createPathNode } from '../VectorDomainModel';

describe('ETAP 5 — ShapeRendering', () => {
  it('compiles RectangleNode into SAVE, SET_TRANSFORM, DRAW_RECT, RESTORE commands', () => {
    const rect = createRectangleNode('r1', 10, 20, 100, 50, 4);
    const cmds = VectorRenderingBridge.buildRenderCommands(rect);

    expect(cmds).toHaveLength(4);
    expect(cmds[0].type).toBe('SAVE');
    expect(cmds[1].type).toBe('SET_TRANSFORM');
    expect(cmds[2].type).toBe('DRAW_RECT');
    expect((cmds[2] as any).cornerRadius).toBe(4);
    expect(cmds[3].type).toBe('RESTORE');
  });

  it('compiles EllipseNode into DRAW_ELLIPSE command', () => {
    const ellipse = createEllipseNode('e1', 0, 0, 100, 100);
    const cmds = VectorRenderingBridge.buildRenderCommands(ellipse);
    expect(cmds[2].type).toBe('DRAW_ELLIPSE');
  });

  it('compiles PolygonNode into DRAW_POLYGON command with vertex points', () => {
    const poly = createPolygonNode('p1', 3, 0, 0, 100, 100);
    const cmds = VectorRenderingBridge.buildRenderCommands(poly);
    expect(cmds[2].type).toBe('DRAW_POLYGON');
    expect((cmds[2] as any).points).toHaveLength(3);
  });

  it('compiles LineNode into DRAW_LINE command', () => {
    const line = createLineNode('l1', 0, 0, 100, 100);
    const cmds = VectorRenderingBridge.buildRenderCommands(line);
    expect(cmds[2].type).toBe('DRAW_LINE');
  });

  it('compiles PathNode into DRAW_PATH command', () => {
    const path = createPathNode('p1', 'M 0 0 L 50 50 Z', 0, 0, 50, 50);
    const cmds = VectorRenderingBridge.buildRenderCommands(path);
    expect(cmds[2].type).toBe('DRAW_PATH');
  });
});
