import { describe, it, expect } from 'vitest';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';
import {
  createRectangleNode,
  createEllipseNode,
  createPolygonNode,
  createLineNode,
  createPathNode,
  createShapeGroupNode,
} from '../VectorDomainModel';
import {
  createVectorWorkspaceState,
  rotateSelectedNodes,
  moveSelectedNodes,
  resizeSelectedNodes,
  undoVectorAction,
  redoVectorAction,
} from '../VectorWorkspaceController';
import { VectorSvgExporter } from '../VectorSvgExporter';

function getTransformCommand(cmds: any[]) {
  return cmds.find((c) => c.type === 'SET_TRANSFORM') as any;
}

function getDrawCommand(cmds: any[]) {
  return cmds.find((c) => typeof c.type === 'string' && c.type.startsWith('DRAW_')) as any;
}

function approx(value: number, expected: number, eps = 0.001): boolean {
  return Math.abs(value - expected) < eps;
}

describe('G1-36: VectorRenderingBridge Transform & Stroke Fidelity', () => {
  describe('Feature Tests (>= 15)', () => {
    it('1. identity transform produces [1,0,0,1,x,y]', () => {
      const rect = createRectangleNode('r1', 10, 20, 100, 50);
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const t = getTransformCommand(cmds).transform;
      expect(t[0]).toBe(1);
      expect(t[1]).toBe(0);
      expect(t[2]).toBe(0);
      expect(t[3]).toBe(1);
      expect(t[4]).toBe(10);
      expect(t[5]).toBe(20);
    });

    it('2. rotation 45° produces cos/sin components in affine matrix', () => {
      const rect = { ...createRectangleNode('r1', 0, 0, 100, 100), transform: { ...createRectangleNode('r1', 0, 0, 100, 100).transform, rotationDeg: 45 } };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const t = getTransformCommand(cmds).transform;
      const cos45 = Math.cos(Math.PI / 4);
      const sin45 = Math.sin(Math.PI / 4);
      expect(approx(t[0], cos45)).toBe(true);
      expect(approx(t[1], sin45)).toBe(true);
      expect(approx(t[2], -sin45)).toBe(true);
      expect(approx(t[3], cos45)).toBe(true);
    });

    it('3. rotation 90° about center maps local origin correctly', () => {
      const rect = { ...createRectangleNode('r1', 0, 0, 100, 100), transform: { ...createRectangleNode('r1', 0, 0, 100, 100).transform, rotationDeg: 90 } };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const t = getTransformCommand(cmds).transform;
      // rotate(90, 50, 50): (0,0) -> (100, 0) in local space
      expect(approx(t[0], 0)).toBe(true);
      expect(approx(t[1], 1)).toBe(true);
      expect(approx(t[2], -1)).toBe(true);
      expect(approx(t[3], 0)).toBe(true);
      expect(approx(t[4], 100)).toBe(true);
      expect(approx(t[5], 0)).toBe(true);
    });

    it('4. scale 2x preserves translation and doubles scale components', () => {
      const rect = { ...createRectangleNode('r1', 10, 20, 100, 50), transform: { ...createRectangleNode('r1', 10, 20, 100, 50).transform, scaleX: 2, scaleY: 2 } };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const t = getTransformCommand(cmds).transform;
      expect(t[0]).toBe(2);
      expect(t[3]).toBe(2);
      expect(t[4]).toBe(10);
      expect(t[5]).toBe(20);
    });

    it('5. combined rotate+scale produces correct affine composition', () => {
      const rect = { ...createRectangleNode('r1', 0, 0, 100, 100), transform: { ...createRectangleNode('r1', 0, 0, 100, 100).transform, rotationDeg: 90, scaleX: 2, scaleY: 2 } };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const t = getTransformCommand(cmds).transform;
      expect(approx(t[1], 2)).toBe(true);
      expect(approx(t[2], -2)).toBe(true);
      expect(approx(t[4], 100)).toBe(true);
    });

    it('6. skewX produces tan component in c', () => {
      const rect = { ...createRectangleNode('r1', 0, 0, 100, 100), transform: { ...createRectangleNode('r1', 0, 0, 100, 100).transform, skewX: 30 } };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const t = getTransformCommand(cmds).transform;
      expect(approx(t[2], Math.tan(Math.PI / 6))).toBe(true);
    });

    it('7. skewY produces tan component in b', () => {
      const rect = { ...createRectangleNode('r1', 0, 0, 100, 100), transform: { ...createRectangleNode('r1', 0, 0, 100, 100).transform, skewY: 30 } };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const t = getTransformCommand(cmds).transform;
      expect(approx(t[1], Math.tan(Math.PI / 6))).toBe(true);
    });

    it('8. stroke dashArray is carried into DRAW_RECT command', () => {
      const rect = { ...createRectangleNode('r1'), stroke: { color: '#111', width: 2, dashArray: [4, 2] } };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const draw = getDrawCommand(cmds);
      expect(draw.strokeDashArray).toEqual([4, 2]);
    });

    it('9. stroke dashOffset, lineJoin, miterLimit carried', () => {
      const rect = {
        ...createRectangleNode('r1'),
        stroke: { color: '#111', width: 2, dashArray: [4, 2], dashOffset: 1, lineJoin: 'round' as const, miterLimit: 4 },
      };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const draw = getDrawCommand(cmds);
      expect(draw.strokeDashOffset).toBe(1);
      expect(draw.strokeLineJoin).toBe('round');
      expect(draw.strokeMiterLimit).toBe(4);
    });

    it('10. stroke opacity < 1 carried', () => {
      const rect = { ...createRectangleNode('r1'), stroke: { color: '#111', width: 2, opacity: 0.5 } };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const draw = getDrawCommand(cmds);
      expect(draw.strokeOpacity).toBe(0.5);
    });

    it('11. linear gradient fill produces fillGradient DTO', () => {
      const rect = {
        ...createRectangleNode('r1'),
        fill: {
          type: 'linear-gradient' as const,
          gradientStops: [{ offset: 0, color: 'red' }, { offset: 1, color: 'blue' }],
          gradientAngleDeg: 90,
        },
      };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const draw = getDrawCommand(cmds);
      expect(draw.fillGradient).toBeDefined();
      expect(draw.fillGradient.type).toBe('linear-gradient');
      expect(draw.fillGradient.stops).toHaveLength(2);
      expect(draw.fillGradient.angleDeg).toBe(90);
    });

    it('12. radial gradient fill produces radial fillGradient DTO', () => {
      const rect = {
        ...createRectangleNode('r1'),
        fill: { type: 'radial-gradient' as const, gradientStops: [{ offset: 0, color: '#fff' }, { offset: 1, color: '#000' }] },
      };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const draw = getDrawCommand(cmds);
      expect(draw.fillGradient.type).toBe('radial-gradient');
    });

    it('13. fill opacity < 1 carried', () => {
      const rect = { ...createRectangleNode('r1'), fill: { type: 'solid' as const, color: '#fff', opacity: 0.4 } };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const draw = getDrawCommand(cmds);
      expect(draw.fillOpacity).toBe(0.4);
    });

    it('14. node opacity emits SET_OPACITY command', () => {
      const rect = { ...createRectangleNode('r1'), opacity: 0.5 };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      expect(cmds.some((c: any) => c.type === 'SET_OPACITY' && c.opacity === 0.5)).toBe(true);
    });

    it('15. line node carries lineCap from stroke', () => {
      const line = { ...createLineNode('l1'), stroke: { color: '#111', width: 2, lineCap: 'square' as const } };
      const cmds = VectorRenderingBridge.buildRenderCommands(line);
      const draw = getDrawCommand(cmds);
      expect(draw.lineCap).toBe('square');
    });

    it('16. group children keep absolute transforms (no double-translate)', () => {
      const child = createRectangleNode('c1', 10, 20, 100, 50);
      const group = createShapeGroupNode('g1', [child], 10, 20, 200, 200);
      const cmds = VectorRenderingBridge.buildRenderCommands(group);
      const childTransform = cmds.filter((c) => c.type === 'SET_TRANSFORM').map((c: any) => c.transform);
      // child emits its own transform translate(10,20), not translate(20,40)
      const t = childTransform[childTransform.length - 1];
      expect(t[4]).toBe(10);
      expect(t[5]).toBe(20);
    });
  });

  describe('E2E Workflows (>= 7)', () => {
    it('1. create -> rotate -> render -> SVG export produce matching rotation semantics', () => {
      let state = createVectorWorkspaceState([createRectangleNode('r1', 10, 10, 100, 100)], ['r1']);
      state = rotateSelectedNodes(state, 45);
      const node = state.snapshot.nodes[0];
      const cmds = VectorRenderingBridge.buildRenderCommands(node);
      const t = getTransformCommand(cmds).transform;
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot, 800, 600);
      expect(svg).toContain('rotate(45 50 50)');
      expect(approx(t[1], Math.sin(Math.PI / 4))).toBe(true);
    });

    it('2. move -> render preserves new translation', () => {
      let state = createVectorWorkspaceState([createRectangleNode('r1', 10, 20, 100, 50)], ['r1']);
      state = moveSelectedNodes(state, 30, 40);
      const cmds = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[0]);
      const t = getTransformCommand(cmds).transform;
      expect(t[4]).toBe(40);
      expect(t[5]).toBe(60);
    });

    it('3. resize -> render reflects new dimensions (handle drag)', () => {
      let state = createVectorWorkspaceState([createRectangleNode('r1', 10, 20, 100, 50)], ['r1']);
      state = resizeSelectedNodes(state, 'se', 50, 25);
      const node = state.snapshot.nodes[0];
      const cmds = VectorRenderingBridge.buildRenderCommands(node);
      const draw = getDrawCommand(cmds);
      expect(draw.bounds.width).toBe(150);
      expect(draw.bounds.height).toBe(75);
    });

    it('4. undo -> redo -> render stable across history', () => {
      let state = createVectorWorkspaceState([createRectangleNode('r1', 10, 10, 100, 100)], ['r1']);
      state = rotateSelectedNodes(state, 90);
      const rotatedCmds = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[0]);
      state = undoVectorAction(state);
      const undoCmds = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[0]);
      expect(getTransformCommand(undoCmds).transform[1]).toBe(0);
      state = redoVectorAction(state);
      const redoCmds = VectorRenderingBridge.buildRenderCommands(state.snapshot.nodes[0]);
      expect(approx(getTransformCommand(redoCmds).transform[1], 1)).toBe(true);
    });

    it('5. combined rotate+scale+skew: canvas matrix matches SVG transform semantics (export parity)', () => {
      let state = createVectorWorkspaceState([createRectangleNode('r1', 0, 0, 100, 100)], ['r1']);
      state = rotateSelectedNodes(state, 90);
      const rotated = state.snapshot.nodes[0];
      const cmds = VectorRenderingBridge.buildRenderCommands(rotated);
      const t = getTransformCommand(cmds).transform;
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot, 800, 600);
      expect(svg).toContain('rotate(90 50 50)');
      expect(approx(t[1], 1)).toBe(true);
      expect(approx(t[2], -1)).toBe(true);
      expect(approx(t[4], 100)).toBe(true);
    });

    it('6. styled scene pipeline: stroke/opacity/dash fidelity flows to both canvas DTOs and SVG export', () => {
      const rect = {
        ...createRectangleNode('r1'),
        fill: { type: 'solid' as const, color: '#112233', opacity: 0.8 },
        stroke: { color: '#0000ff', width: 3, dashArray: [8, 4], dashOffset: 2, lineJoin: 'round' as const, opacity: 0.5 },
      };
      const line = { ...createLineNode('l1', 0, 0, 100, 100), stroke: { color: '#ff0000', width: 2, lineCap: 'square' as const, opacity: 0.6 } };
      const state = createVectorWorkspaceState([rect, line], []);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot, 800, 600);
      expect(svg).toContain('fill-opacity="0.8"');
      expect(svg).toContain('stroke-dasharray="8,4"');
      expect(svg).toContain('stroke-dashoffset="2"');
      expect(svg).toContain('stroke-linejoin="round"');
      expect(svg).toContain('stroke-opacity="0.5"');
      expect(svg).toContain('stroke-linecap="square"');
      const rectCmds = VectorRenderingBridge.buildRenderCommands(rect);
      const rectDraw = getDrawCommand(rectCmds);
      expect(rectDraw.fillStyle).toBe('#112233');
      expect(rectDraw.fillOpacity).toBe(0.8);
      expect(rectDraw.strokeOpacity).toBe(0.5);
      expect(rectDraw.strokeDashArray).toEqual([8, 4]);
      expect(rectDraw.strokeDashOffset).toBe(2);
      expect(rectDraw.strokeLineJoin).toBe('round');
      const lineCmds = VectorRenderingBridge.buildRenderCommands(line);
      const lineDraw = getDrawCommand(lineCmds);
      expect(lineDraw.lineCap).toBe('square');
      expect(lineDraw.strokeOpacity).toBe(0.6);
    });

    it('7. mixed scene: gradient rect + dashed line + rotated polygon render as commands', () => {
      const rect = {
        ...createRectangleNode('r1'),
        fill: { type: 'radial-gradient' as const, gradientStops: [{ offset: 0, color: '#fff' }, { offset: 1, color: '#000' }] },
      };
      const line = { ...createLineNode('l1', 0, 0, 100, 100), stroke: { color: '#333', width: 2, dashArray: [6, 3] } };
      const poly = { ...createPolygonNode('p1', 5, 0, 0, 100, 100), transform: { ...createPolygonNode('p1', 5, 0, 0, 100, 100).transform, rotationDeg: 15 } };
      const snapshot = { nodes: [rect, line, poly], selectedIds: [] };
      const svg = VectorSvgExporter.exportToSvgString(snapshot, 800, 600);
      for (const node of snapshot.nodes) {
        const cmds = VectorRenderingBridge.buildRenderCommands(node);
        expect(cmds.length).toBeGreaterThan(0);
      }
      expect(svg).toContain('<defs>');
    });
  });

  describe('Adversarial Scenarios (>= 15)', () => {
    it('1. null node -> empty commands (no throw)', () => {
      expect(VectorRenderingBridge.buildRenderCommands(null as any)).toEqual([]);
    });

    it('2. missing transform -> empty commands (no throw)', () => {
      expect(VectorRenderingBridge.buildRenderCommands({ id: 'x', type: 'rectangle', visible: true } as any)).toEqual([]);
    });

    it('3. invisible node -> empty commands', () => {
      const rect = { ...createRectangleNode('r1'), visible: false };
      expect(VectorRenderingBridge.buildRenderCommands(rect)).toEqual([]);
    });

    it('4. zero opacity node -> empty commands', () => {
      const rect = { ...createRectangleNode('r1'), opacity: 0 };
      expect(VectorRenderingBridge.buildRenderCommands(rect)).toEqual([]);
    });

    it('5. NaN rotation deg -> 0 (no NaN matrix)', () => {
      const rect = { ...createRectangleNode('r1', 0, 0, 100, 100), transform: { ...createRectangleNode('r1', 0, 0, 100, 100).transform, rotationDeg: NaN } };
      const t = getTransformCommand(VectorRenderingBridge.buildRenderCommands(rect)).transform;
      expect(t.every((v: number) => Number.isFinite(v))).toBe(true);
    });

    it('6. Infinity scale -> clamped (no Infinity matrix)', () => {
      const rect = { ...createRectangleNode('r1', 0, 0, 100, 100), transform: { ...createRectangleNode('r1', 0, 0, 100, 100).transform, scaleX: Infinity } };
      const t = getTransformCommand(VectorRenderingBridge.buildRenderCommands(rect)).transform;
      expect(t.every((v: number) => Number.isFinite(v))).toBe(true);
    });

    it('7. zero dimensions -> identity-ish transform, valid draw bounds', () => {
      const rect = { ...createRectangleNode('r1', 0, 0, 0, 0), transform: { ...createRectangleNode('r1', 0, 0, 0, 0).transform, width: 0, height: 0 } };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const draw = getDrawCommand(cmds);
      expect(draw.bounds.width).toBe(0);
      expect(draw.bounds.height).toBe(0);
    });

    it('8. missing fill -> no fillStyle, no crash', () => {
      const rect = { ...createRectangleNode('r1'), fill: undefined };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const draw = getDrawCommand(cmds);
      expect(draw.fillStyle).toBeUndefined();
    });

    it('9. fill type "none" -> fillStyle undefined', () => {
      const rect = { ...createRectangleNode('r1'), fill: { type: 'none' as const } };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const draw = getDrawCommand(cmds);
      expect(draw.fillStyle).toBeUndefined();
    });

    it('10. gradient with missing stops -> no fillGradient, falls back to color', () => {
      const rect = {
        ...createRectangleNode('r1'),
        fill: { type: 'linear-gradient' as const, color: '#ff0000', gradientStops: [] },
      };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const draw = getDrawCommand(cmds);
      expect(draw.fillGradient).toBeUndefined();
      expect(draw.fillStyle).toBe('#ff0000');
    });

    it('11. gradient stops with NaN/empty entries filtered', () => {
      const rect = {
        ...createRectangleNode('r1'),
        fill: { type: 'linear-gradient' as const, gradientStops: [{ offset: 0, color: 'red' }, { offset: NaN, color: 'x' } as any, null as any] },
      };
      const cmds = VectorRenderingBridge.buildRenderCommands(rect);
      const draw = getDrawCommand(cmds);
      expect(draw.fillGradient.stops).toHaveLength(1);
    });

    it('12. missing stroke -> strokeStyle undefined', () => {
      const rect = { ...createRectangleNode('r1'), stroke: undefined };
      const draw = getDrawCommand(VectorRenderingBridge.buildRenderCommands(rect));
      expect(draw.strokeStyle).toBeUndefined();
    });

    it('13. zero stroke width -> strokeStyle undefined', () => {
      const rect = { ...createRectangleNode('r1'), stroke: { color: '#111', width: 0 } };
      const draw = getDrawCommand(VectorRenderingBridge.buildRenderCommands(rect));
      expect(draw.strokeStyle).toBeUndefined();
    });

    it('14. dashArray with NaN entries filtered', () => {
      const rect = { ...createRectangleNode('r1'), stroke: { color: '#111', width: 2, dashArray: [4, NaN, 2] as any } };
      const draw = getDrawCommand(VectorRenderingBridge.buildRenderCommands(rect));
      expect(draw.strokeDashArray).toEqual([4, 2]);
    });

    it('15. empty group -> SAVE/RESTORE only', () => {
      const group = createShapeGroupNode('g1', [], 0, 0, 100, 100);
      const cmds = VectorRenderingBridge.buildRenderCommands(group);
      expect(cmds[0].type).toBe('SAVE');
      expect(cmds[cmds.length - 1].type).toBe('RESTORE');
    });

    it('16. path with empty d -> valid DRAW_PATH', () => {
      const path = { ...createPathNode('p1', ''), d: '' };
      const cmds = VectorRenderingBridge.buildRenderCommands(path);
      const draw = getDrawCommand(cmds);
      expect(draw.d).toBe('');
    });
  });

  describe('Failure Injection (>= 3)', () => {
    it('1. Injection: corrupted node (missing transform) does not crash bridge and yields zero commands', () => {
      const corrupted: any = { id: 'c1', type: 'rectangle', visible: true, opacity: 1, transform: null };
      expect(() => VectorRenderingBridge.buildRenderCommands(corrupted)).not.toThrow();
      expect(VectorRenderingBridge.buildRenderCommands(corrupted)).toEqual([]);
    });

    it('2. Injection: bridge never mutates the input node (zero residual state)', () => {
      const before = createRectangleNode('r1', 10, 20, 100, 50);
      const beforeJson = JSON.stringify(before);
      VectorRenderingBridge.buildRenderCommands(before);
      expect(JSON.stringify(before)).toBe(beforeJson);
    });

    it('3. Injection: rotation matrix boundary (270°) maps local origin correctly', () => {
      const rect = { ...createRectangleNode('r1', 0, 0, 100, 100), transform: { ...createRectangleNode('r1', 0, 0, 100, 100).transform, rotationDeg: 270 } };
      const t = getTransformCommand(VectorRenderingBridge.buildRenderCommands(rect)).transform;
      // rotate(270, 50, 50): (0,0) -> (0,100)
      expect(approx(t[1], -1)).toBe(true);
      expect(approx(t[2], 1)).toBe(true);
      expect(approx(t[5], 100)).toBe(true);
    });
  });
});