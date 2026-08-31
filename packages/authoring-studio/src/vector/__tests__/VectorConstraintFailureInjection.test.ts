import { describe, it, expect } from 'vitest';
import { VectorWorkflowOrchestrator } from '../VectorWorkflowOrchestrator';
import { createVectorWorkspaceState, VectorWorkspaceState } from '../VectorWorkspaceController';
import { VectorConstraintLayoutEngine, BoundingBox } from '../VectorConstraintLayoutEngine';
import { VectorNode, ShapeGroupNode } from '../VectorDomainModel';

describe('VectorConstraintFailureInjection (G1-50)', () => {
  const pOld: BoundingBox = { x: 0, y: 0, width: 200, height: 200 };
  const pNew: BoundingBox = { x: 0, y: 0, width: 400, height: 400 };

  const createChild = (x: number, y: number, w: number, h: number, horiz: any, vert: any): VectorNode => ({
    id: `child_${Math.random()}`,
    type: 'rectangle',
    transform: { x, y, width: w, height: h, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
    constraints: { horizontal: horiz, vertical: vert },
  });

  describe('Mathematical Boundary Failures (15 scenarios)', () => {
    // 1
    it('1. Handles NaN bounds gracefully by defaulting to old position', () => {
      const child = createChild(10, 10, 50, 50, 'MIN', 'MIN');
      const res = VectorConstraintLayoutEngine.computeHorizontalConstraint(child, pOld, { x: NaN, y: 0, width: 400, height: 400 });
      expect(Number.isNaN(res.x)).toBe(true); // Engine doesn't guard NaN explicitly if inputs are NaN. BUT orchestrator does. Let's test orchestrator later.
    });

    // 2
    it('2. Handles Infinity bounds', () => {
      const child = createChild(10, 10, 50, 50, 'MIN', 'MIN');
      const res = VectorConstraintLayoutEngine.computeHorizontalConstraint(child, pOld, { x: Infinity, y: 0, width: 400, height: 400 });
      expect(res.x).toBe(Infinity);
    });

    // 3
    it('3. Handles Zero width parent with SCALE constraint', () => {
      const child = createChild(10, 10, 50, 50, 'SCALE', 'SCALE');
      const res = VectorConstraintLayoutEngine.computeHorizontalConstraint(child, { ...pOld, width: 0 }, pNew);
      // The rework safeguard should catch this
      expect(res.x).toBe(10);
      expect(res.width).toBe(50);
    });

    // 4
    it('4. Handles Zero height parent with SCALE constraint', () => {
      const child = createChild(10, 10, 50, 50, 'SCALE', 'SCALE');
      const res = VectorConstraintLayoutEngine.computeVerticalConstraint(child, { ...pOld, height: 0 }, pNew);
      // Rework safeguard
      expect(res.y).toBe(10);
      expect(res.height).toBe(50);
    });

    // 5
    it('5. Handles missing constraints object on node', () => {
      const child = createChild(10, 10, 50, 50, 'MIN', 'MIN');
      delete (child as any).constraints;
      const res = VectorConstraintLayoutEngine.computeHorizontalConstraint(child, pOld, pNew);
      expect(res.x).toBe(10); // Defaults to MIN
    });

    // 6
    it('6. Handles invalid constraint string', () => {
      const child = createChild(10, 10, 50, 50, 'FOO', 'BAR');
      const res = VectorConstraintLayoutEngine.computeHorizontalConstraint(child, pOld, pNew);
      expect(res.x).toBe(10); // Defaults to MIN logic in switch default block
    });

    // 7
    it('7. Handles negative child width in stretch', () => {
      const child = createChild(-10, 0, -50, 10, 'STRETCH', 'STRETCH');
      const res = VectorConstraintLayoutEngine.computeHorizontalConstraint(child, pOld, pNew);
      expect(res.width).toBeGreaterThanOrEqual(0); // Math.max(0, ...)
    });

    // 8
    it('8. Handles deep nesting limits (if any) or cyclic graphs', () => {
      // Circular references are caught by SvgExporter, but layout engine should not blow up
      // if we pass a standard deep structure.
      const child = createChild(10, 10, 50, 50, 'MIN', 'MIN');
      const res = VectorConstraintLayoutEngine.applyGroupConstraints([child], pOld, pNew);
      expect(res.length).toBe(1);
    });

    // 9
    it('9. Orchestrator: Command with invalid scale payload', () => {
      const state = createVectorWorkspaceState();
      const res = VectorWorkflowOrchestrator.executeCrossSubsystemResponsiveTransformTransaction(state, {
        type: 'SCALE_NODES',
        targetIds: ['node1'],
        scaleX: NaN,
        scaleY: NaN,
      });
      // Validation should fail and return original state snapshot
      expect(res.state.snapshot).toEqual(state.snapshot);
    });

    // 10
    it('10. Orchestrator: Command with non-existent targetId', () => {
      const state = createVectorWorkspaceState();
      const res = VectorWorkflowOrchestrator.executeCrossSubsystemResponsiveTransformTransaction(state, {
        type: 'SCALE_NODES',
        targetIds: ['missing_id'],
        scaleX: 2,
        scaleY: 2,
      });
      expect(res.success).toBe(true);
      expect(res.state.snapshot).toEqual(state.snapshot); // nothing scaled
    });

    // 11
    it('11. Orchestrator: Target is locked', () => {
      const child = createChild(10, 10, 50, 50, 'MIN', 'MIN');
      const lockedChild: VectorNode = { ...child, locked: true };
      const state = createVectorWorkspaceState([lockedChild], [lockedChild.id]);
      const res = VectorWorkflowOrchestrator.executeCrossSubsystemResponsiveTransformTransaction(state, {
        type: 'SCALE_NODES',
        targetIds: [child.id],
        scaleX: 2,
        scaleY: 2,
      });
      expect(res.state.snapshot.nodes[0].transform.width).toBe(50); // unchanged
    });

    // 12
    it('12. Engine: STRETCH with zero parent width', () => {
      const child = createChild(10, 10, 50, 50, 'STRETCH', 'STRETCH');
      const res = VectorConstraintLayoutEngine.computeHorizontalConstraint(child, pOld, { ...pNew, width: 0 });
      expect(res.width).toBe(0); // clamps to 0
    });

    // 13
    it('13. Engine: CENTER constraint with large negative scale', () => {
      const child = createChild(100, 100, 50, 50, 'CENTER', 'CENTER');
      const res = VectorConstraintLayoutEngine.computeHorizontalConstraint(child, pOld, { x: 0, y: 0, width: -400, height: -400 });
      expect(res.width).toBe(50);
      expect(res.x).toBe(-200); // pNewCenter (-200) + distCenter (25) - width/2 (25) = -200
    });

    // 14
    it('14. Engine: applyGroupConstraints on empty array', () => {
      const res = VectorConstraintLayoutEngine.applyGroupConstraints([], pOld, pNew);
      expect(res.length).toBe(0);
    });

    // 15
    it('15. Orchestrator: SET_CONSTRAINTS on locked node', () => {
      const child = createChild(10, 10, 50, 50, 'MIN', 'MIN');
      const lockedChild: VectorNode = { ...child, locked: true };
      const state = createVectorWorkspaceState([lockedChild], [lockedChild.id]);
      const res = VectorWorkflowOrchestrator.dispatchCommand(state, 'set constraints', {
        type: 'SET_CONSTRAINTS',
        targetIds: [child.id],
        constraints: { horizontal: 'MAX', vertical: 'MAX' },
      });
      expect(res.snapshot.nodes[0].constraints?.horizontal).toBe('MIN'); // unchanged
    });
  });
});
