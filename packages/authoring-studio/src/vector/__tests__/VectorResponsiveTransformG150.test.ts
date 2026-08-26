import { VectorWorkflowOrchestrator } from '../VectorWorkflowOrchestrator';
import { createVectorWorkspaceState, VectorWorkspaceState } from '../VectorWorkspaceController';
import { ShapeGroupNode, VectorNode } from '../VectorDomainModel';

describe('VectorResponsiveTransform (G1-50)', () => {
  let state: VectorWorkspaceState;

  beforeEach(() => {
    const child1: VectorNode = {
      id: 'child1',
      type: 'rectangle',
      transform: { x: 10, y: 10, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      constraints: { horizontal: 'MIN', vertical: 'STRETCH' },
      visible: true,
    };

    const child2: VectorNode = {
      id: 'child2',
      type: 'rectangle',
      transform: { x: 140, y: 10, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      constraints: { horizontal: 'MAX', vertical: 'MAX' },
      visible: true,
    };

    const group: ShapeGroupNode = {
      id: 'group1',
      type: 'group',
      transform: { x: 0, y: 0, width: 200, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      children: [child1, child2],
      visible: true,
      locked: false,
    };

    state = createVectorWorkspaceState([group], ['group1']);
  });

  it('should transactionally scale a group and correctly apply constraints to children', () => {
    // When the group is scaled to 2x width and 2x height
    // Old Group Bounds: 0, 0, 200, 100
    // New Group Bounds: 0, 0, 400, 200
    const res = VectorWorkflowOrchestrator.executeCrossSubsystemResponsiveTransformTransaction(state, {
      type: 'SCALE_NODES',
      targetIds: ['group1'],
      scaleX: 2.0,
      scaleY: 2.0,
      origin: { x: 0, y: 0 }
    });

    expect(res.success).toBe(true);

    const group = res.state.snapshot.nodes.find(n => n.id === 'group1') as ShapeGroupNode;
    expect(group).toBeDefined();
    
    // Group bounds should scale
    expect(group.transform.width).toBe(400);
    expect(group.transform.height).toBe(200);

    // Child 1 (MIN, STRETCH)
    // Horizontal MIN: maintains left distance of 10. Width stays 50. x = 0 + 10 = 10
    // Vertical STRETCH: maintains top 10, bottom 100 - (10+50) = 40.
    // New height: 200 - 10 - 40 = 150. y = 10.
    const c1 = group.children[0];
    expect(c1.transform.x).toBe(10);
    expect(c1.transform.width).toBe(50);
    expect(c1.transform.y).toBe(10);
    expect(c1.transform.height).toBe(150);

    // Child 2 (MAX, MAX)
    // Horizontal MAX: maintains right distance of 200 - (140+50) = 10.
    // New X: 400 - 10 - 50 = 340. Width stays 50.
    // Vertical MAX: maintains bottom distance of 100 - (10+50) = 40.
    // New Y: 200 - 40 - 50 = 110. Height stays 50.
    const c2 = group.children[1];
    expect(c2.transform.x).toBe(340);
    expect(c2.transform.width).toBe(50);
    expect(c2.transform.y).toBe(110);
    expect(c2.transform.height).toBe(50);
  });

  it('should maintain SSOT invariants, history stack, and deterministic execution', () => {
    const res = VectorWorkflowOrchestrator.executeCrossSubsystemResponsiveTransformTransaction(state, {
      type: 'SCALE_NODES',
      targetIds: ['group1'],
      scaleX: 1.5,
      scaleY: 1.5,
      origin: { x: 0, y: 0 }
    });

    // Validates that SSOT was not mutated in place
    expect(res.state.snapshot).not.toBe(state.snapshot);
    // Validates history stack pushed exactly 1 transaction
    expect(res.state.historyStack.canUndo()).toBe(true);
    // The previous state is preserved in history
    const prev = res.state.historyStack.undo();
    expect(prev.snapshot).toEqual(state.snapshot);
  });
});
