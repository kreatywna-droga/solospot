import { describe, it, expect } from 'vitest';
import { VectorEditingEngine } from '../VectorEditingEngine';
import { VectorGeometry } from '../VectorGeometry';
import { VectorAnimationEngine } from '../VectorAnimationEngine';
import { VectorBooleanEngine } from '../VectorBooleanEngine';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';
import { createHistoryStack } from '../../../../builder-core/src/HistoryStack';
import { VectorNode } from '../VectorDomainModel';

describe('ETAP 7 — VectorIntegration End-to-End Workflow', () => {
  it('executes full workflow: Create -> Style -> Geometry -> Transform -> Group -> Animate -> Render -> Undo/Redo', () => {
    let documentNodes: VectorNode[] = [];
    let history = createHistoryStack<VectorNode[]>(20);
    history = history.push(documentNodes, 'Empty Canvas');

    // 1. Create Rectangle & Polygon
    const r1 = VectorEditingEngine.createShape('r1', 'rectangle', 10, 10, 100, 100, { cornerRadius: 8 });
    const p1 = VectorEditingEngine.createShape('p1', 'polygon', 150, 10, 100, 100, { sides: 5 });
    documentNodes = [r1, p1];
    history = history.push(documentNodes, 'Create Rectangle & Polygon');
    expect(documentNodes).toHaveLength(2);

    // 2. Style shapes
    const styledR1 = VectorEditingEngine.updateFill(r1, { color: '#EF4444' });
    const styledP1 = VectorEditingEngine.updateStroke(p1, { color: '#10B981', width: 4 });
    documentNodes = [styledR1, styledP1];
    history = history.push(documentNodes, 'Apply Fill & Stroke');

    // 3. Geometry calculations
    const bR1 = VectorGeometry.computeBoundingBox(styledR1);
    expect(bR1.width).toBe(102); // 100 width + 2 stroke
    expect(VectorGeometry.checkShapeIntersection(styledR1, styledP1)).toBe(false);

    // 4. Align & Group shapes
    const aligned = VectorEditingEngine.alignShapes(documentNodes, 'top');
    const group = VectorEditingEngine.groupShapes('g1', aligned);
    documentNodes = [group];
    history = history.push(documentNodes, 'Group Shapes');
    expect(documentNodes[0].type).toBe('group');

    // 5. Animate shape properties
    const animatedR1 = VectorAnimationEngine.applyAnimatedProperties(styledR1, {
      x: 50,
      fillOpacity: 0.8,
    });
    expect(animatedR1.transform.x).toBe(50);
    expect(animatedR1.fill?.opacity).toBe(0.8);

    // 6. Boolean Operations (G1-23 Integration)
    // Extract nodes from group, perform subtract, and push to history
    const ungrouped = VectorEditingEngine.ungroupShape(group);
    documentNodes = ungrouped;
    history = history.push(documentNodes, 'Ungroup Shapes');
    
    // Perform subtract: r1 - p1
    const subNode = VectorBooleanEngine.subtract(ungrouped[0], ungrouped[1]);
    documentNodes = [subNode];
    history = history.push(documentNodes, 'Boolean Subtract');
    
    expect(documentNodes).toHaveLength(1);
    expect(documentNodes[0].type).toBe('path');
    expect(documentNodes[0].id).toContain('boolean_sub_');

    // 7. Build Render Commands via VectorRenderingBridge
    const renderCommands = VectorRenderingBridge.buildRenderCommands(subNode);
    expect(renderCommands.length).toBeGreaterThan(0);
    expect(renderCommands[0].type).toBe('SAVE');

    // 8. Undo/Redo cycle
    const undo1 = history.undo(); // Undoes Boolean Subtract
    expect(undo1).not.toBeNull();
    if (undo1) {
      documentNodes = undo1.state;
    }
    expect(documentNodes).toHaveLength(2); // Restored to ungrouped shapes
  });
});
