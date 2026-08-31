import { describe, it, expect } from 'vitest';
import { VectorSvgExporter } from '../VectorSvgExporter';
import {
  createRectangleNode,
  createEllipseNode,
  createPolygonNode,
  createLineNode,
  createPathNode,
  createShapeGroupNode,
} from '../VectorDomainModel';
import { createVectorWorkspaceState } from '../VectorWorkspaceController';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';

describe('G1-35: Vector Svg Exporter', () => {
  describe('Feature Tests (>= 15)', () => {
    it('1. Exports empty document to valid SVG shell', () => {
      const state = createVectorWorkspaceState([]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('</svg>');
    });

    it('2. Exports simple rectangle with base attributes', () => {
      const rect = createRectangleNode('r1', 10, 20, 100, 50, 0, { color: '#ff0000' });
      const state = createVectorWorkspaceState([rect]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<rect');
      expect(svg).toContain('id="r1"');
      expect(svg).toContain('fill="#ff0000"');
      expect(svg).toContain('width="100"');
      expect(svg).toContain('height="50"');
    });

    it('3. Exports rectangle with corner radius', () => {
      const rect = createRectangleNode('r2', 0, 0, 100, 100, 15);
      const state = createVectorWorkspaceState([rect]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('rx="15"');
      expect(svg).toContain('ry="15"');
    });

    it('4. Exports ellipse with correct cx, cy, rx, ry', () => {
      const ellipse = createEllipseNode('e1', 0, 0, 200, 100);
      const state = createVectorWorkspaceState([ellipse]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<ellipse');
      expect(svg).toContain('cx="100"');
      expect(svg).toContain('cy="50"');
      expect(svg).toContain('rx="100"');
      expect(svg).toContain('ry="50"');
    });

    it('5. Exports line with calculated x1,y1,x2,y2', () => {
      const line = createLineNode('l1', 10, 10, 50, 50);
      const state = createVectorWorkspaceState([line]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<line');
      expect(svg).toContain('x1="0"');
      expect(svg).toContain('y1="0"');
      expect(svg).toContain('x2="40"');
      expect(svg).toContain('y2="40"');
    });

    it('6. Exports polygon with point coordinates', () => {
      const poly = createPolygonNode('p1', 3, 0, 0, 100, 100);
      const state = createVectorWorkspaceState([poly]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<polygon');
      expect(svg).toContain('points="');
    });

    it('7. Exports path with d attribute', () => {
      const path = createPathNode('pa1', 'M 0 0 L 100 100');
      const state = createVectorWorkspaceState([path]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<path');
      expect(svg).toContain('d="M 0 0 L 100 100"');
    });

    it('8. Exports group with nested children', () => {
      const r1 = createRectangleNode('r1');
      const group = createShapeGroupNode('g1', [r1]);
      const state = createVectorWorkspaceState([group]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<g id="g1"');
      expect(svg).toContain('</g>');
      expect(svg).toContain('<rect id="r1"');
    });

    it('9. Exports stroke attributes correctly', () => {
      const rect = createRectangleNode('r1');
      const strokedRect = { ...rect, stroke: { color: '#00ff00', width: 5, lineCap: 'round', opacity: 0.5 } as any };
      const state = createVectorWorkspaceState([strokedRect]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('stroke="#00ff00"');
      expect(svg).toContain('stroke-width="5"');
      expect(svg).toContain('stroke-opacity="0.5"');
      expect(svg).toContain('stroke-linecap="round"');
    });

    it('10. Exports stroke dash array and offset', () => {
      const rect = createRectangleNode('r1');
      const strokedRect = { ...rect, stroke: { color: '#000', width: 1, dashArray: [5, 5], dashOffset: 10 } as any };
      const state = createVectorWorkspaceState([strokedRect]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('stroke-dasharray="5,5"');
      expect(svg).toContain('stroke-dashoffset="10"');
    });

    it('11. Exports node opacity', () => {
      const rect = createRectangleNode('r1');
      const state = createVectorWorkspaceState([{ ...rect, opacity: 0.7 }]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('opacity="0.7"');
    });

    it('12. Ignores invisible nodes', () => {
      const rect = createRectangleNode('r1');
      const state = createVectorWorkspaceState([{ ...rect, visible: false }]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).not.toContain('<rect');
    });

    it('13. Exports transforms (translate)', () => {
      const rect = createRectangleNode('r1', 50, 100);
      const state = createVectorWorkspaceState([rect]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('translate(50, 100)');
    });

    it('14. Exports transforms (rotate and scale)', () => {
      const rect = createRectangleNode('r1');
      const transformedRect = {
        ...rect,
        transform: { ...rect.transform, rotationDeg: 45, scaleX: 2, scaleY: 2 }
      };
      const state = createVectorWorkspaceState([transformedRect]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('rotate(45');
      expect(svg).toContain('scale(2, 2)');
    });

    it('15. Extracts and references linear gradients', () => {
      const rect = createRectangleNode('r1');
      const gradRect = {
        ...rect,
        fill: {
          type: 'linear-gradient',
          gradientStops: [{ offset: 0, color: 'red' }, { offset: 1, color: 'blue' }]
        }
      } as any;
      const state = createVectorWorkspaceState([gradRect]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<defs>');
      expect(svg).toContain('<linearGradient id="r1_fill"');
      expect(svg).toContain('stop-color="red"');
      expect(svg).toContain('url(#r1_fill)');
    });
  });

  describe('Adversarial Scenarios (>= 12)', () => {
    it('1. Handles empty transform gracefully', () => {
      const rect = createRectangleNode('r1');
      const advRect = { ...rect, transform: { x: 0, y: 0, width: 0, height: 0, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } };
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [advRect], selectedIds: [], constraintEdges: [] });
      expect(svg).toContain('width="0" height="0"');
    });

    it('2. Handles missing fill gracefully', () => {
      const rect = createRectangleNode('r1');
      const advRect = { ...rect, fill: undefined };
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [advRect], selectedIds: [], constraintEdges: [] });
      expect(svg).toContain('fill="none"');
    });

    it('3. Handles extreme coordinates', () => {
      const rect = createRectangleNode('r1', 99999999, -99999999, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [rect], selectedIds: [], constraintEdges: [] });
      expect(svg).toContain('translate(99999999, -99999999)');
    });

    it('4. Handles negative dimensions (force absolute)', () => {
      const rect = createRectangleNode('r1', 0, 0, -100, -50);
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [rect], selectedIds: [], constraintEdges: [] });
      expect(svg).toContain('width="-100"'); // SVG renderer will ignore or error, but exporter shouldn't crash
    });

    it('5. Handles deeply nested groups', () => {
      const g3 = createShapeGroupNode('g3', [createRectangleNode('r1')]);
      const g2 = createShapeGroupNode('g2', [g3]);
      const g1 = createShapeGroupNode('g1', [g2]);
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [g1], selectedIds: [], constraintEdges: [] });
      expect(svg).toContain('<g id="g1"');
      expect(svg).toContain('<g id="g2"');
      expect(svg).toContain('<g id="g3"');
      expect(svg).toContain('<rect');
    });

    it('6. Avoids duplicate gradient defs for same id', () => {
      const r1 = { ...createRectangleNode('r1'), fill: { type: 'linear-gradient' } as any };
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [r1, r1], selectedIds: [], constraintEdges: [] });
      expect(svg.match(/<linearGradient/g)?.length).toBe(1);
    });

    it('7. Handles gradient stops missing offset/color', () => {
      const r1 = { ...createRectangleNode('r1'), fill: { type: 'radial-gradient', gradientStops: [{}] } as any };
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [r1], selectedIds: [], constraintEdges: [] });
      expect(svg).toContain('<radialGradient');
    });

    it('8. Handles missing stroke', () => {
      const r1 = { ...createRectangleNode('r1'), stroke: undefined };
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [r1], selectedIds: [], constraintEdges: [] });
      expect(svg).not.toContain('stroke=');
    });

    it('9. Handles zero stroke width', () => {
      const r1 = { ...createRectangleNode('r1'), stroke: { color: 'red', width: 0 } as any };
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [r1], selectedIds: [], constraintEdges: [] });
      expect(svg).not.toContain('stroke-width="0"');
    });

    it('10. Handles group with invisible children', () => {
      const r1 = { ...createRectangleNode('r1'), visible: false };
      const g1 = createShapeGroupNode('g1', [r1]);
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [g1], selectedIds: [], constraintEdges: [] });
      expect(svg).not.toContain('<rect');
      expect(svg).toContain('<g');
    });

    it('11. Handles invalid shape types gracefully (returns empty)', () => {
      const adv = { id: 'x', type: 'unknown', visible: true, transform: {} } as any;
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [adv], selectedIds: [], constraintEdges: [] });
      expect(svg).not.toContain('unknown');
    });

    it('12. Handles empty path data', () => {
      const p1 = createPathNode('p1', '');
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [p1], selectedIds: [], constraintEdges: [] });
      expect(svg).toContain('d=""');
    });
  });

  describe('E2E Workflows (>= 5)', () => {
    it('1. Create document -> add shapes -> export', () => {
      const state = createVectorWorkspaceState([
        createRectangleNode('r1'),
        createEllipseNode('e1'),
        createLineNode('l1')
      ]);
      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<rect');
      expect(svg).toContain('<ellipse');
      expect(svg).toContain('<line');
    });

    it('2. Selection modification does not affect export output', () => {
      const state1 = createVectorWorkspaceState([createRectangleNode('r1')], []);
      const state2 = createVectorWorkspaceState([createRectangleNode('r1')], ['r1']);
      const svg1 = VectorSvgExporter.exportToSvgString(state1.snapshot);
      const svg2 = VectorSvgExporter.exportToSvgString(state2.snapshot);
      expect(svg1).toEqual(svg2);
    });

    it('3. Visibility toggle correctly hides shapes from export', () => {
      let state = createVectorWorkspaceState([createRectangleNode('r1')]);
      expect(VectorSvgExporter.exportToSvgString(state.snapshot)).toContain('<rect');
      
      const hiddenRect = { ...state.snapshot.nodes[0], visible: false };
      state = createVectorWorkspaceState([hiddenRect]);
      expect(VectorSvgExporter.exportToSvgString(state.snapshot)).not.toContain('<rect');
    });

    it('4. Grouping nodes exports properly as nested SVG', () => {
      const r1 = createRectangleNode('r1');
      const r2 = createRectangleNode('r2');
      const g1 = createShapeGroupNode('g1', [r1, r2]);
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [g1], selectedIds: [], constraintEdges: [] });
      expect(svg).toContain('<g');
      expect(svg).toContain('id="r1"');
      expect(svg).toContain('id="r2"');
    });

it('5. Layer reordering correctly affects SVG rendering order', () => {
      const r1 = createRectangleNode('r1');
      const r2 = createRectangleNode('r2');
      const state1 = createVectorWorkspaceState([r1, r2]);
      const state2 = createVectorWorkspaceState([r2, r1]); // reordered

      const svg1 = VectorSvgExporter.exportToSvgString(state1.snapshot);
      const svg2 = VectorSvgExporter.exportToSvgString(state2.snapshot);

      const pos1_r1 = svg1.indexOf('id="r1"');
      const pos1_r2 = svg1.indexOf('id="r2"');
      expect(pos1_r1).toBeLessThan(pos1_r2);

      const pos2_r2 = svg2.indexOf('id="r2"');
      const pos2_r1 = svg2.indexOf('id="r1"');
      expect(pos2_r2).toBeLessThan(pos2_r1);
    });

    it('6. Serialize -> restore -> export roundtrip preserves export fidelity', () => {
      const state = createVectorWorkspaceState([
        createRectangleNode('r1', 0, 0, 100, 50, 0, { color: '#ff0000' }),
        createEllipseNode('e1', 0, 0, 200, 100),
        createLineNode('l1', 10, 10, 50, 50),
      ]);
      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);
      expect(restored.success).toBe(true);
      const svg1 = VectorSvgExporter.exportToSvgString(state.snapshot);
      const svg2 = VectorSvgExporter.exportToSvgString(restored.snapshot!);
      expect(svg2).toContain('<rect');
      expect(svg2).toContain('<ellipse');
      expect(svg2).toContain('<line');
      expect(svg2).toContain('id="r1"');
      expect(svg2).toContain('id="e1"');
      expect(svg2).toContain('id="l1"');
      expect(svg2).toEqual(svg1);
    });

    it('7. Persist a gradient document, restore, and export gradient reference intact', () => {
      const rect = createRectangleNode('r1');
      const gradRect = {
        ...rect,
        fill: {
          type: 'linear-gradient',
          gradientStops: [{ offset: 0, color: 'red' }, { offset: 1, color: 'blue' }]
        }
      } as any;
      const json = VectorDocumentSerializer.serializeVectorDocument({ nodes: [gradRect], selectedIds: [], constraintEdges: [] });
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);
      expect(restored.success).toBe(true);
      const svg = VectorSvgExporter.exportToSvgString(restored.snapshot!);
      expect(svg).toContain('<linearGradient');
      expect(svg).toContain('url(#r1_fill)');
      expect(svg).toContain('stop-color="red"');
    });

    it('8. Group export does not double-apply group transform onto absolute children', () => {
      const child = createRectangleNode('r1', 10, 20, 50, 50);
      const group = createShapeGroupNode('g1', [child], 10, 20, 50, 50);
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [group], selectedIds: [], constraintEdges: [] });
      expect(svg).toContain('<g id="g1"');
      const rectPos = svg.indexOf('<rect');
      const gPos = svg.indexOf('<g');
      expect(gPos).toBeLessThan(rectPos);
      expect(svg).not.toContain('translate(20, 40)'); // must NOT compound group + child translation
      expect(svg).toContain('translate(10, 20)');
    });
  });

describe('Failure Injection (>= 3)', () => {
    it('1. Injection: Export engine preserves original snapshot entirely (zero residual mutation)', () => {
      const state = createVectorWorkspaceState([createRectangleNode('r1')]);
      const snapshotClone = JSON.parse(JSON.stringify(state.snapshot)); // snapshot is pure data
      VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(state.snapshot).toEqual(snapshotClone); // ZERO residual state mutation
      expect(state.snapshot.selectedIds).toEqual([]);
    });

    it('2. Injection: Corrupted snapshot node (missing transform) does not crash exporter', () => {
      const corruptedState = { nodes: [{ visible: true, type: 'rectangle' }] } as any; // missing transform
      let svg: string = '';
      expect(() => {
        svg = VectorSvgExporter.exportToSvgString(corruptedState);
      }).not.toThrowError(); // Robustness: must not crash
      expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('</svg>');
    });

    it('3. Injection: Cyclical group dependency is detected and throws a controlled error', () => {
      const g1 = createShapeGroupNode('g1', []);
      const g2 = createShapeGroupNode('g2', [g1]);
      (g1.children as any).push(g2); // Force cycle

      expect(() => {
        VectorSvgExporter.exportToSvgString({ nodes: [g1], selectedIds: [], constraintEdges: [] });
      }).toThrowError(/circular group reference/i);
    });
  });
});
