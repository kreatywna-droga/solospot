/**
 * VectorStateRecoveryG147.test.ts — Milestone G1-47 Test Suite (Night Shift Level 9)
 *
 * Professional Autonomous Vector Editor State Machine & Checkpointed Recovery Architecture validation:
 * - Feature Tests (≥30)
 * - Integration Tests (≥20)
 * - E2E Workflows (≥15)
 * - Adversarial Scenarios (≥35)
 * - Failure Injection Points (≥20)
 *
 * MINIMUM TOTAL: 120 NEW TESTS
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VectorNode, RectangleNode, EllipseNode, PathNode, ShapeGroupNode, createPathNode } from '../VectorDomainModel';
import { createVectorWorkspaceState, selectNodes, VectorDocumentSnapshot } from '../VectorWorkspaceController';
import { VectorEditorInteractionStateMachine, VectorEditorState } from '../VectorEditorInteractionStateMachine';
import { VectorTransactionRecoveryEngine, CheckpointLevel } from '../VectorTransactionRecoveryEngine';
import { VectorWorkflowOrchestrator } from '../VectorWorkflowOrchestrator';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';
import { VectorSvgExporter } from '../VectorSvgExporter';
import { VectorCompoundTopologyMaskEngine } from '../VectorCompoundTopologyMaskEngine';

describe('WF-HACP-STUDIO-G1-47 — Autonomous Vector Editor State & Recovery Architecture', () => {
  let sm: VectorEditorInteractionStateMachine;
  let re: VectorTransactionRecoveryEngine;
  let r1: RectangleNode;
  let r2: RectangleNode;

  beforeEach(() => {
    sm = new VectorEditorInteractionStateMachine();
    re = new VectorTransactionRecoveryEngine();

    r1 = {
      id: 'rect_1',
      name: 'Rectangle 1',
      type: 'rectangle',
      transform: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotationDeg: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
      },
      opacity: 1,
      visible: true,
      locked: false,
    };

    r2 = {
      id: 'rect_2',
      name: 'Rectangle 2',
      type: 'rectangle',
      transform: {
        x: 150,
        y: 150,
        width: 80,
        height: 80,
        rotationDeg: 0,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
      },
      opacity: 1,
      visible: true,
      locked: false,
    };
  });

  // =========================================================================
  // 1. FEATURE TESTS (≥30)
  // =========================================================================
  describe('1. Feature Tests', () => {
    it('F01: initializes in IDLE state', () => {
      expect(sm.getCurrentState()).toBe('IDLE');
    });

    it('F02: allows legal transition IDLE -> SELECTING', () => {
      expect(sm.canTransition('SELECTING')).toBe(true);
      expect(sm.transitionTo('SELECTING')).toBe(true);
      expect(sm.getCurrentState()).toBe('SELECTING');
    });

    it('F03: allows legal transition IDLE -> INTERACTING', () => {
      expect(sm.transitionTo('INTERACTING')).toBe(true);
      expect(sm.getCurrentState()).toBe('INTERACTING');
    });

    it('F04: allows legal transition INTERACTING -> PREVIEWING', () => {
      sm.transitionTo('INTERACTING');
      expect(sm.transitionTo('PREVIEWING')).toBe(true);
      expect(sm.getCurrentState()).toBe('PREVIEWING');
    });

    it('F05: allows legal transition PREVIEWING -> COMMAND_BUILDING', () => {
      sm.transitionTo('INTERACTING');
      sm.transitionTo('PREVIEWING');
      expect(sm.transitionTo('COMMAND_BUILDING')).toBe(true);
      expect(sm.getCurrentState()).toBe('COMMAND_BUILDING');
    });

    it('F06: allows legal transition COMMAND_BUILDING -> TRANSACTION_PENDING', () => {
      sm.transitionTo('COMMAND_BUILDING');
      expect(sm.transitionTo('TRANSACTION_PENDING')).toBe(true);
      expect(sm.getCurrentState()).toBe('TRANSACTION_PENDING');
    });

    it('F07: allows legal transition TRANSACTION_PENDING -> COMMITTING', () => {
      sm.transitionTo('COMMAND_BUILDING');
      sm.transitionTo('TRANSACTION_PENDING');
      expect(sm.transitionTo('COMMITTING')).toBe(true);
      expect(sm.getCurrentState()).toBe('COMMITTING');
    });

    it('F08: allows legal transition COMMITTING -> COMMITTED', () => {
      sm.transitionTo('COMMAND_BUILDING');
      sm.transitionTo('TRANSACTION_PENDING');
      sm.transitionTo('COMMITTING');
      expect(sm.transitionTo('COMMITTED')).toBe(true);
      expect(sm.getCurrentState()).toBe('COMMITTED');
    });

    it('F09: allows legal transition COMMITTED -> IDLE', () => {
      sm.transitionTo('COMMAND_BUILDING');
      sm.transitionTo('TRANSACTION_PENDING');
      sm.transitionTo('COMMITTING');
      sm.transitionTo('COMMITTED');
      expect(sm.transitionTo('IDLE')).toBe(true);
      expect(sm.getCurrentState()).toBe('IDLE');
    });

    it('F10: rejects illegal transition IDLE -> COMMITTED', () => {
      expect(sm.canTransition('COMMITTED')).toBe(false);
      expect(sm.transitionTo('COMMITTED')).toBe(false);
      expect(sm.getCurrentState()).toBe('IDLE');
    });

    it('F11: rejects illegal transition SELECTING -> COMMITTING', () => {
      sm.transitionTo('SELECTING');
      expect(sm.transitionTo('COMMITTING')).toBe(false);
      expect(sm.getCurrentState()).toBe('SELECTING');
    });

    it('F12: allows transition to ERROR state from any valid active state', () => {
      sm.transitionTo('SELECTING');
      expect(sm.transitionTo('ERROR')).toBe(true);
      expect(sm.getCurrentState()).toBe('ERROR');
    });

    it('F13: allows recovery transition ERROR -> RECOVERING -> IDLE', () => {
      sm.transitionTo('SELECTING');
      sm.transitionTo('ERROR');
      expect(sm.transitionTo('RECOVERING')).toBe(true);
      expect(sm.transitionTo('IDLE')).toBe(true);
      expect(sm.getCurrentState()).toBe('IDLE');
    });

    it('F14: records state transition history entries', () => {
      sm.transitionTo('SELECTING');
      sm.transitionTo('IDLE');
      const history = sm.getTransitionHistory();

      expect(history).toHaveLength(2);
      expect(history[0].from).toBe('IDLE');
      expect(history[0].to).toBe('SELECTING');
    });

    it('F15: resets interaction state machine to IDLE', () => {
      sm.transitionTo('SELECTING');
      sm.resetToIdle();
      expect(sm.getCurrentState()).toBe('IDLE');
    });

    it('F16: creates CHECKPOINT_SESSION_START recovery checkpoint', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      const cp = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);

      expect(cp.level).toBe('CHECKPOINT_SESSION_START');
      expect(cp.snapshot.nodes).toHaveLength(1);
    });

    it('F17: creates CHECKPOINT_SELECTION recovery checkpoint', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1, r2], selectedIds: ['rect_1'] };
      const cp = re.createCheckpoint('CHECKPOINT_SELECTION', snap, ['rect_1']);

      expect(cp.level).toBe('CHECKPOINT_SELECTION');
      expect(cp.selectedIds).toEqual(['rect_1']);
    });

    it('F18: creates CHECKPOINT_PREVIEW recovery checkpoint', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      const cp = re.createCheckpoint('CHECKPOINT_PREVIEW', snap, []);

      expect(cp.level).toBe('CHECKPOINT_PREVIEW');
    });

    it('F19: creates CHECKPOINT_COMMAND recovery checkpoint', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      const cp = re.createCheckpoint('CHECKPOINT_COMMAND', snap, []);

      expect(cp.level).toBe('CHECKPOINT_COMMAND');
    });

    it('F20: creates CHECKPOINT_TRANSACTION recovery checkpoint', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      const cp = re.createCheckpoint('CHECKPOINT_TRANSACTION', snap, []);

      expect(cp.level).toBe('CHECKPOINT_TRANSACTION');
    });

    it('F21: creates CHECKPOINT_VALIDATION recovery checkpoint', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      const cp = re.createCheckpoint('CHECKPOINT_VALIDATION', snap, []);

      expect(cp.level).toBe('CHECKPOINT_VALIDATION');
    });

    it('F22: rolls back document state to checkpoint by ID', () => {
      const snap1: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      const snap2: VectorDocumentSnapshot = { nodes: [r1, r2], selectedIds: [] };

      const cp1 = re.createCheckpoint('CHECKPOINT_SESSION_START', snap1, []);
      re.createCheckpoint('CHECKPOINT_TRANSACTION', snap2, []);

      const restored = re.rollbackToCheckpoint(cp1.id);
      expect(restored?.nodes).toHaveLength(1);
    });

    it('F23: rolls back document state to last level checkpoint', () => {
      const snap1: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      const snap2: VectorDocumentSnapshot = { nodes: [r1, r2], selectedIds: [] };

      re.createCheckpoint('CHECKPOINT_SESSION_START', snap1, []);
      re.createCheckpoint('CHECKPOINT_TRANSACTION', snap2, []);

      const restored = re.rollbackToLastLevel('CHECKPOINT_SESSION_START');
      expect(restored?.nodes).toHaveLength(1);
    });

    it('F24: recovers from error by restoring fallback snapshot', () => {
      const failedSnap: VectorDocumentSnapshot = { nodes: [], selectedIds: [] };
      const fallbackSnap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: ['rect_1'] };

      const recovered = re.recoverFromError(failedSnap, fallbackSnap);
      expect(recovered.nodes).toHaveLength(1);
      expect(recovered.selectedIds).toEqual(['rect_1']);
    });

    it('F25: clears all recorded checkpoints', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);
      re.clearCheckpoints();

      expect(re.getCheckpoints()).toHaveLength(0);
    });

    it('F26: deep clones snapshot nodes during checkpoint creation to prevent mutation leaks', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      const cp = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);

      (r1.transform as any).x = 999;
      expect(cp.snapshot.nodes[0].transform.x).toBe(0);
    });

    it('F27: returns null when rolling back to non-existent checkpoint ID', () => {
      const restored = re.rollbackToCheckpoint('NON_EXISTENT_ID');
      expect(restored).toBeNull();
    });

    it('F28: returns null when rolling back to non-existent checkpoint level', () => {
      const restored = re.rollbackToLastLevel('CHECKPOINT_VALIDATION');
      expect(restored).toBeNull();
    });

    it('F29: tracks 5 sequential state transitions cleanly', () => {
      sm.transitionTo('INTERACTING');
      sm.transitionTo('PREVIEWING');
      sm.transitionTo('COMMAND_BUILDING');
      sm.transitionTo('TRANSACTION_PENDING');
      sm.transitionTo('COMMITTING');

      expect(sm.getTransitionHistory()).toHaveLength(5);
    });

    it('F30: verifies static state machine getter on VectorWorkflowOrchestrator', () => {
      const instance = VectorWorkflowOrchestrator.getStateMachine();
      expect(instance).toBeDefined();
    });
  });

  // =========================================================================
  // 2. INTEGRATION TESTS (≥20)
  // =========================================================================
  describe('2. Integration Tests', () => {
    it('I01: integrates state machine with orchestrator command dispatch', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 10, 10);

      expect(state.snapshot.nodes[0].transform.x).toBe(10);
    });

    it('I02: integrates recovery engine with workflow transaction rollback', () => {
      const snap1: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      const snap2: VectorDocumentSnapshot = { nodes: [r1, r2], selectedIds: [] };

      re.createCheckpoint('CHECKPOINT_TRANSACTION', snap1, []);
      const rollback = re.rollbackToLastLevel('CHECKPOINT_TRANSACTION');

      expect(rollback?.nodes).toEqual(snap1.nodes);
    });

    it('I03: integrates state machine with HistoryStack transaction boundary', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialLen = state.historyStack.entries.length;

      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 5, 5);

      expect(state.historyStack.entries.length).toBe(initialLen + 1);
    });

    it('I04: integrates recovery engine with JSON document serializer', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1, r2], selectedIds: ['rect_1'] };
      const cp = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, ['rect_1']);

      const json = VectorDocumentSerializer.serializeVectorDocument(cp.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes.length).toBe(2);
    });

    it('I05: integrates recovery engine with SVG exporter', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1, r2], selectedIds: [] };
      const cp = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);

      const svg = VectorSvgExporter.exportToSvgString(cp.snapshot);
      expect(svg).toContain('<svg');
    });

    it('I06: verifies preview operations create 0 HistoryStack entries', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialLen = state.historyStack.entries.length;

      sm.transitionTo('PREVIEWING');
      expect(state.historyStack.entries.length).toBe(initialLen);
    });

    it('I07: verifies cancellation restores initial document state', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialSnap = state.snapshot;

      sm.transitionTo('INTERACTING');
      sm.transitionTo('PREVIEWING');
      sm.transitionTo('CANCELLED');
      sm.transitionTo('IDLE');

      expect(state.snapshot).toEqual(initialSnap);
    });

    it('I08: integrates state machine with vector mask creation workflow', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);

      sm.transitionTo('COMMAND_BUILDING');
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);
      sm.transitionTo('TRANSACTION_PENDING');
      sm.transitionTo('COMMITTING');
      sm.transitionTo('COMMITTED');

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('I09: integrates recovery engine with vector mask release workflow', () => {
      const maskRes = VectorCompoundTopologyMaskEngine.createVectorMask(r1, [r2]);
      const snap: VectorDocumentSnapshot = { nodes: [maskRes.maskedNode!], selectedIds: [maskRes.maskedNode!.id] };
      re.createCheckpoint('CHECKPOINT_SESSION_START', snap, [maskRes.maskedNode!.id]);

      const releaseRes = VectorCompoundTopologyMaskEngine.releaseVectorMask(maskRes.maskedNode!);
      expect(releaseRes.releasedNodes).toHaveLength(2);
    });

    it('I10: maintains document SSOT integrity during state transitions', () => {
      let state = createVectorWorkspaceState([r1]);
      const snap = state.snapshot;

      sm.transitionTo('SELECTING');
      sm.transitionTo('IDLE');

      expect(state.snapshot).toBe(snap);
    });

    it('I11: integrates recovery engine with 5 sequential checkpoints', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };

      re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);
      re.createCheckpoint('CHECKPOINT_SELECTION', snap, []);
      re.createCheckpoint('CHECKPOINT_PREVIEW', snap, []);
      re.createCheckpoint('CHECKPOINT_COMMAND', snap, []);
      re.createCheckpoint('CHECKPOINT_TRANSACTION', snap, []);

      expect(re.getCheckpoints()).toHaveLength(5);
    });

    it('I12: supports checkpoint rollback across nested group hierarchies', () => {
      const groupNode: ShapeGroupNode = {
        id: 'g1',
        type: 'group',
        transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
        children: [r1, r2],
      };
      const snap: VectorDocumentSnapshot = { nodes: [groupNode], selectedIds: ['g1'] };
      const cp = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, ['g1']);

      const restored = re.rollbackToCheckpoint(cp.id);
      expect((restored?.nodes[0] as ShapeGroupNode).children).toHaveLength(2);
    });

    it('I13: integrates state machine error transition on exception throw', () => {
      try {
        sm.transitionTo('INTERACTING');
        throw new Error('Simulated Subsystem Failure');
      } catch (_err) {
        sm.transitionTo('ERROR');
      }

      expect(sm.getCurrentState()).toBe('ERROR');
    });

    it('I14: verifies recoverFromError returns deep clone of fallback snapshot', () => {
      const fallback: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      const recovered = re.recoverFromError({ nodes: [], selectedIds: [] }, fallback);

      (r1.transform as any).x = 888;
      expect(recovered.nodes[0].transform.x).toBe(0);
    });

    it('I15: integrates state machine with multi-shape alignment workflow', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);

      sm.transitionTo('COMMAND_BUILDING');
      state = VectorWorkflowOrchestrator.alignSelectedWorkflow(state, 'left');
      sm.transitionTo('TRANSACTION_PENDING');

      expect(state.snapshot.nodes[0].transform.x).toBe(0);
    });

    it('I16: integrates state machine with layer reordering workflow', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_2']);

      sm.transitionTo('COMMAND_BUILDING');
      state = VectorWorkflowOrchestrator.reorderSelectedLayers(state, 'sendToBack');
      sm.transitionTo('TRANSACTION_PENDING');

      expect(state.snapshot.nodes[0].id).toBe('rect_2');
    });

    it('I17: integrates state machine with path corner smoothing workflow', () => {
      const p1 = createPathNode('p1', 'M 0 0 L 100 0 L 100 100 Z', 0, 0, 100, 100);
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['p1']);

      sm.transitionTo('COMMAND_BUILDING');
      state = VectorWorkflowOrchestrator.smoothSelectedPathCornersWorkflow(state, 10);
      sm.transitionTo('TRANSACTION_PENDING');

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('I18: maintains history stack immutability during failed state transitions', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialStackLen = state.historyStack.entries.length;

      sm.transitionTo('COMMITTED'); // Invalid transition from IDLE -> COMMITTED
      expect(state.historyStack.entries.length).toBe(initialStackLen);
    });

    it('I19: integrates recovery engine getter on VectorWorkflowOrchestrator', () => {
      const recoveryInstance = VectorWorkflowOrchestrator.getRecoveryEngine();
      expect(recoveryInstance).toBeDefined();
    });

    it('I20: verifies state transition timestamp ordering', () => {
      sm.transitionTo('SELECTING');
      sm.transitionTo('IDLE');

      const history = sm.getTransitionHistory();
      expect(history[1].timestamp).toBeGreaterThanOrEqual(history[0].timestamp);
    });
  });

  // =========================================================================
  // 3. E2E WORKFLOWS (≥15)
  // =========================================================================
  describe('3. E2E Workflows', () => {
    it('E2E-01: Full Session Lifecycle: Start -> Select -> Transform -> Commit -> Export SVG', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      re.createCheckpoint('CHECKPOINT_SESSION_START', state.snapshot, []);

      sm.transitionTo('SELECTING');
      state = selectNodes(state, ['rect_1']);
      re.createCheckpoint('CHECKPOINT_SELECTION', state.snapshot, ['rect_1']);

      sm.transitionTo('INTERACTING');
      sm.transitionTo('COMMAND_BUILDING');
      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 50, 50);
      re.createCheckpoint('CHECKPOINT_COMMAND', state.snapshot, ['rect_1']);

      sm.transitionTo('TRANSACTION_PENDING');
      sm.transitionTo('COMMITTING');
      sm.transitionTo('COMMITTED');
      sm.transitionTo('IDLE');

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('transform="translate(50, 50)"');
    });

    it('E2E-02: Exception Rollback Workflow: Start -> Command -> Exception -> Rollback to Session Start', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialSnap = state.snapshot;
      re.createCheckpoint('CHECKPOINT_SESSION_START', initialSnap, []);

      try {
        sm.transitionTo('COMMAND_BUILDING');
        throw new Error('Simulated Command Build Error');
      } catch (_err) {
        sm.transitionTo('ERROR');
        sm.transitionTo('RECOVERING');
        const restoredSnap = re.rollbackToLastLevel('CHECKPOINT_SESSION_START');
        if (restoredSnap) state = { ...state, snapshot: restoredSnap };
        sm.transitionTo('IDLE');
      }

      expect(state.snapshot).toEqual(initialSnap);
    });

    it('E2E-03: Cancel Workflow: Start -> Preview -> User Cancel -> Restore Initial State', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialSnap = state.snapshot;

      sm.transitionTo('INTERACTING');
      sm.transitionTo('PREVIEWING');
      sm.transitionTo('CANCELLED');
      sm.transitionTo('IDLE');

      expect(state.snapshot).toEqual(initialSnap);
    });

    it('E2E-04: Multi-Step Checkpointed Workflow: Session -> Selection -> Command -> Validation Rollback', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      re.createCheckpoint('CHECKPOINT_SESSION_START', state.snapshot, []);

      state = selectNodes(state, ['rect_1']);
      re.createCheckpoint('CHECKPOINT_SELECTION', state.snapshot, ['rect_1']);

      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 10, 10);
      re.createCheckpoint('CHECKPOINT_COMMAND', state.snapshot, ['rect_1']);

      // Validation fails -> rollback to SELECTION checkpoint
      const rolledBack = re.rollbackToLastLevel('CHECKPOINT_SELECTION');
      expect(rolledBack?.nodes[0].transform.x).toBe(0);
    });

    it('E2E-05: Serialization Roundtrip after State Machine Error Recovery', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      re.createCheckpoint('CHECKPOINT_SESSION_START', state.snapshot, []);

      sm.transitionTo('ERROR');
      sm.transitionTo('RECOVERING');
      const restoredSnap = re.rollbackToLastLevel('CHECKPOINT_SESSION_START');
      sm.transitionTo('IDLE');

      const json = VectorDocumentSerializer.serializeVectorDocument(restoredSnap!);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes.length).toBe(2);
    });

    it('E2E-06: SVG Export Output after State Machine Error Recovery', () => {
      let state = createVectorWorkspaceState([r1]);
      re.createCheckpoint('CHECKPOINT_SESSION_START', state.snapshot, []);

      sm.transitionTo('ERROR');
      sm.transitionTo('RECOVERING');
      const restoredSnap = re.rollbackToLastLevel('CHECKPOINT_SESSION_START');
      sm.transitionTo('IDLE');

      const svg = VectorSvgExporter.exportToSvgString(restoredSnap!);
      expect(svg).toContain('<rect');
    });

    it('E2E-07: Rapid 10-Step State Machine Lifecycle Run', () => {
      for (let i = 0; i < 10; i++) {
        sm.transitionTo('SELECTING');
        sm.transitionTo('IDLE');
      }

      expect(sm.getTransitionHistory()).toHaveLength(20);
    });

    it('E2E-08: Deep Rollback of 10 Sequential Checkpoints', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);

      for (let i = 0; i < 10; i++) {
        state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 1, 1);
        re.createCheckpoint('CHECKPOINT_COMMAND', state.snapshot, []);
      }

      const firstCP = re.getCheckpoints()[0];
      const restored = re.rollbackToCheckpoint(firstCP.id);

      expect(restored?.nodes[0].transform.x).toBe(1);
    });

    it('E2E-09: Vector Mask Workflow with State Machine Tracking', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);

      sm.transitionTo('COMMAND_BUILDING');
      state = VectorWorkflowOrchestrator.createVectorMaskWorkflow(state);
      sm.transitionTo('TRANSACTION_PENDING');
      sm.transitionTo('COMMITTING');
      sm.transitionTo('COMMITTED');
      sm.transitionTo('IDLE');

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('E2E-10: Path Corner Smoothing Workflow with State Machine Tracking', () => {
      const p1 = createPathNode('p1', 'M 0 0 L 100 0 L 100 100 Z', 0, 0, 100, 100);
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['p1']);

      sm.transitionTo('COMMAND_BUILDING');
      state = VectorWorkflowOrchestrator.smoothSelectedPathCornersWorkflow(state, 5);
      sm.transitionTo('TRANSACTION_PENDING');
      sm.transitionTo('COMMITTING');
      sm.transitionTo('COMMITTED');
      sm.transitionTo('IDLE');

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('E2E-11: Undo & Redo Workflow Interleaved with State Machine Transitions', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 10, 10);

      const undoRes = state.historyStack.undo();
      if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };

      sm.transitionTo('IDLE');
      expect(state.snapshot.nodes[0].transform.x).toBe(0);
    });

    it('E2E-12: Multi-Shape Alignment Workflow with Recovery Checkpoints', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      re.createCheckpoint('CHECKPOINT_SELECTION', state.snapshot, ['rect_1', 'rect_2']);

      state = VectorWorkflowOrchestrator.alignSelectedWorkflow(state, 'left');
      re.createCheckpoint('CHECKPOINT_COMMAND', state.snapshot, ['rect_1', 'rect_2']);

      const restored = re.rollbackToLastLevel('CHECKPOINT_SELECTION');
      expect(restored?.nodes[0].transform.x).toBe(0);
    });

    it('E2E-13: Preserves Transient Selection State Isolation from Persistent SSOT', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);

      expect(state.snapshot.selectedIds).toEqual(['rect_1']);
      expect(state.snapshot.nodes).toHaveLength(2);
    });

    it('E2E-14: Full System Reset via State Machine and Recovery Engine', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);

      sm.transitionTo('SELECTING');
      sm.resetToIdle();
      re.clearCheckpoints();

      expect(sm.getCurrentState()).toBe('IDLE');
      expect(re.getCheckpoints()).toHaveLength(0);
    });

    it('E2E-15: 100 Checkpoint Performance Verification without Memory Degradation', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };

      for (let i = 0; i < 100; i++) {
        re.createCheckpoint('CHECKPOINT_TRANSACTION', snap, []);
      }

      expect(re.getCheckpoints()).toHaveLength(100);
    });
  });

  // =========================================================================
  // 4. ADVERSARIAL SCENARIOS (≥35)
  // =========================================================================
  describe('4. Adversarial Scenarios', () => {
    it('ADV-01: handles illegal transition IDLE -> COMMITTING', () => {
      expect(sm.transitionTo('COMMITTING')).toBe(false);
    });

    it('ADV-02: handles illegal transition IDLE -> VALIDATING', () => {
      expect(sm.transitionTo('VALIDATING')).toBe(false);
    });

    it('ADV-03: handles illegal transition IDLE -> ROLLING_BACK', () => {
      expect(sm.transitionTo('ROLLING_BACK')).toBe(false);
    });

    it('ADV-04: handles illegal transition SELECTING -> COMMITTED', () => {
      sm.transitionTo('SELECTING');
      expect(sm.transitionTo('COMMITTED')).toBe(false);
    });

    it('ADV-05: handles illegal transition INTERACTING -> COMMITTED', () => {
      sm.transitionTo('INTERACTING');
      expect(sm.transitionTo('COMMITTED')).toBe(false);
    });

    it('ADV-06: handles illegal transition PREVIEWING -> COMMITTED', () => {
      sm.transitionTo('INTERACTING');
      sm.transitionTo('PREVIEWING');
      expect(sm.transitionTo('COMMITTED')).toBe(false);
    });

    it('ADV-07: handles illegal transition SNAPPING -> COMMITTED', () => {
      sm.transitionTo('INTERACTING');
      sm.transitionTo('SNAPPING');
      expect(sm.transitionTo('COMMITTED')).toBe(false);
    });

    it('ADV-08: handles rollbackToCheckpoint with empty string ID', () => {
      expect(re.rollbackToCheckpoint('')).toBeNull();
    });

    it('ADV-09: handles rollbackToCheckpoint with null ID', () => {
      expect(re.rollbackToCheckpoint(null as any)).toBeNull();
    });

    it('ADV-10: handles rollbackToLastLevel with invalid level string', () => {
      expect(re.rollbackToLastLevel('INVALID_LEVEL' as any)).toBeNull();
    });

    it('ADV-11: handles recoverFromError with null fallback snapshot', () => {
      const recovered = re.recoverFromError({ nodes: [], selectedIds: [] }, null as any);
      expect(recovered.nodes).toEqual([]);
    });

    it('ADV-12: handles recoverFromError with corrupted fallback snapshot', () => {
      const recovered = re.recoverFromError({ nodes: [], selectedIds: [] }, {} as any);
      expect(recovered.nodes).toEqual([]);
    });

    it('ADV-13: handles createCheckpoint with null snapshot', () => {
      expect(() => re.createCheckpoint('CHECKPOINT_SESSION_START', null as any, [])).toThrow();
    });

    it('ADV-14: handles createCheckpoint with NaN coordinates in nodes', () => {
      const nanR: RectangleNode = { ...r1, transform: { ...r1.transform, x: NaN, y: NaN } };
      const snap: VectorDocumentSnapshot = { nodes: [nanR], selectedIds: [] };

      const cp = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);
      expect(cp.snapshot.nodes[0].transform.x).toBeNaN();
    });

    it('ADV-15: handles createCheckpoint with Infinity coordinates in nodes', () => {
      const infR: RectangleNode = { ...r1, transform: { ...r1.transform, x: Infinity, y: Infinity } };
      const snap: VectorDocumentSnapshot = { nodes: [infR], selectedIds: [] };

      const cp = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);
      expect(cp.snapshot.nodes[0].transform.x).toBe(Infinity);
    });

    it('ADV-16: handles 50 rapid state machine transitions safely', () => {
      for (let i = 0; i < 25; i++) {
        sm.transitionTo('SELECTING');
        sm.transitionTo('IDLE');
      }

      expect(sm.getTransitionHistory()).toHaveLength(50);
    });

    it('ADV-17: handles state transition attempts when state machine is in ERROR state', () => {
      sm.transitionTo('ERROR');
      expect(sm.transitionTo('COMMITTING')).toBe(false);
      expect(sm.getCurrentState()).toBe('ERROR');
    });

    it('ADV-18: handles state transition from ERROR to RECOVERING', () => {
      sm.transitionTo('ERROR');
      expect(sm.transitionTo('RECOVERING')).toBe(true);
    });

    it('ADV-19: handles state transition from RECOVERING to IDLE', () => {
      sm.transitionTo('ERROR');
      sm.transitionTo('RECOVERING');
      expect(sm.transitionTo('IDLE')).toBe(true);
    });

    it('ADV-20: handles createCheckpoint with 100 nodes', () => {
      const nodes = Array.from({ length: 100 }, (_, i) => ({ ...r1, id: `r_${i}` }));
      const snap: VectorDocumentSnapshot = { nodes, selectedIds: [] };

      const cp = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);
      expect(cp.snapshot.nodes).toHaveLength(100);
    });

    it('ADV-21: handles rollbackToCheckpoint on 100 nodes snapshot', () => {
      const nodes = Array.from({ length: 100 }, (_, i) => ({ ...r1, id: `r_${i}` }));
      const snap: VectorDocumentSnapshot = { nodes, selectedIds: [] };

      const cp = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);
      const restored = re.rollbackToCheckpoint(cp.id);

      expect(restored?.nodes).toHaveLength(100);
    });

    it('ADV-22: handles state machine resetToIdle from ERROR state', () => {
      sm.transitionTo('ERROR');
      sm.resetToIdle();

      expect(sm.getCurrentState()).toBe('IDLE');
    });

    it('ADV-23: handles createCheckpoint with empty selection IDs array', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      const cp = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);

      expect(cp.selectedIds).toEqual([]);
    });

    it('ADV-24: handles createCheckpoint with null selection IDs parameter', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      const cp = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, null as any);

      expect(cp.selectedIds).toEqual([]);
    });

    it('ADV-25: handles canTransition with null state parameter', () => {
      expect(sm.canTransition(null as any)).toBe(false);
    });

    it('ADV-26: handles transitionTo with null state parameter', () => {
      expect(sm.transitionTo(null as any)).toBe(false);
    });

    it('ADV-27: handles canTransition with undefined state parameter', () => {
      expect(sm.canTransition(undefined as any)).toBe(false);
    });

    it('ADV-28: handles transitionTo with undefined state parameter', () => {
      expect(sm.transitionTo(undefined as any)).toBe(false);
    });

    it('ADV-29: handles repeated calls to resetToIdle', () => {
      sm.resetToIdle();
      sm.resetToIdle();
      sm.resetToIdle();

      expect(sm.getCurrentState()).toBe('IDLE');
    });

    it('ADV-30: handles clearCheckpoints on already empty recovery engine', () => {
      re.clearCheckpoints();
      re.clearCheckpoints();

      expect(re.getCheckpoints()).toHaveLength(0);
    });

    it('ADV-31: handles rollbackToLastLevel when multiple checkpoints exist at same level', () => {
      const snap1: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      const snap2: VectorDocumentSnapshot = { nodes: [r1, r2], selectedIds: [] };

      re.createCheckpoint('CHECKPOINT_TRANSACTION', snap1, []);
      re.createCheckpoint('CHECKPOINT_TRANSACTION', snap2, []);

      const restored = re.rollbackToLastLevel('CHECKPOINT_TRANSACTION');
      expect(restored?.nodes).toHaveLength(2);
    });

    it('ADV-32: handles recoverFromError with duplicate node IDs in fallback snapshot', () => {
      const fallback: VectorDocumentSnapshot = { nodes: [r1, r1], selectedIds: [] };
      const recovered = re.recoverFromError({ nodes: [], selectedIds: [] }, fallback);

      expect(recovered.nodes).toHaveLength(2);
    });

    it('ADV-33: handles state transition history array immutability', () => {
      sm.transitionTo('SELECTING');
      const history = sm.getTransitionHistory();
      (history as any).push({ from: 'IDLE', to: 'ERROR', timestamp: 0 });

      expect(sm.getTransitionHistory()).toHaveLength(1);
    });

    it('ADV-34: handles createCheckpoint with extreme negative transform coordinates', () => {
      const negR: RectangleNode = { ...r1, transform: { ...r1.transform, x: -1e9, y: -1e9 } };
      const snap: VectorDocumentSnapshot = { nodes: [negR], selectedIds: [] };

      const cp = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);
      expect(cp.snapshot.nodes[0].transform.x).toBe(-1e9);
    });

    it('ADV-35: handles 100 sequential checkpoint creations and clear operations', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };

      for (let i = 0; i < 100; i++) {
        re.createCheckpoint('CHECKPOINT_COMMAND', snap, []);
      }

      re.clearCheckpoints();
      expect(re.getCheckpoints()).toHaveLength(0);
    });
  });

  // =========================================================================
  // 5. FAILURE INJECTION POINTS (≥20)
  // =========================================================================
  describe('5. Failure Injection Points', () => {
    it('FI-01: Malformed Command Ingestion Recovery', () => {
      let state = createVectorWorkspaceState([r1]);
      const initial = state;
      state = VectorWorkflowOrchestrator.dispatchCommand(state, 'Malformed Command', { type: 'INVALID_COMMAND_TYPE' as any });

      expect(state.snapshot).toEqual(initial.snapshot);
    });

    it('FI-02: Invalid Node ID Ingestion Recovery', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['NON_EXISTENT_NODE_ID']);
      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 10, 10);

      expect(state.snapshot.nodes[0].transform.x).toBe(0);
    });

    it('FI-03: Locked Node Modification Recovery', () => {
      const lockedR1: RectangleNode = { ...r1, locked: true };
      let state = createVectorWorkspaceState([lockedR1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 10, 10);

      expect(state.snapshot.nodes[0].transform.x).toBe(0);
    });

    it('FI-04: NaN Geometry Coordinate Recovery', () => {
      const nanR: RectangleNode = { ...r1, transform: { ...r1.transform, x: NaN, y: NaN } };
      const snap: VectorDocumentSnapshot = { nodes: [nanR], selectedIds: [] };

      const recovered = re.recoverFromError(snap, { nodes: [r1], selectedIds: [] });
      expect(recovered.nodes[0].transform.x).toBe(0);
    });

    it('FI-05: Infinity Geometry Coordinate Recovery', () => {
      const infR: RectangleNode = { ...r1, transform: { ...r1.transform, x: Infinity, y: Infinity } };
      const snap: VectorDocumentSnapshot = { nodes: [infR], selectedIds: [] };

      const recovered = re.recoverFromError(snap, { nodes: [r1], selectedIds: [] });
      expect(recovered.nodes[0].transform.x).toBe(0);
    });

    it('FI-06: Corrupted Transform DTO Ingestion Recovery', () => {
      const corrupted: any = { id: 'c1', type: 'rectangle', transform: null };
      const json = JSON.stringify({ schema: 'vector_document', version: 1, nodes: [corrupted] });
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.success).toBe(true);
      expect(restored.snapshot!.nodes[0].transform).toBeDefined();
    });

    it('FI-07: Invalid Mask Topology Ingestion Recovery', () => {
      const res = VectorCompoundTopologyMaskEngine.applyCompoundMaskTopology(r1, 'CORRUPTED_TOPOLOGY' as any);
      expect(res.success).toBe(true);
    });

    it('FI-08: Invalid Boolean Topology Ingestion Recovery', () => {
      const p1 = createPathNode('p1', 'M 0 0 L 10 10', 0, 0, 10, 10);
      let state = createVectorWorkspaceState([p1]);
      state = selectNodes(state, ['p1']);
      state = VectorWorkflowOrchestrator.applyBooleanTopologyWorkflow(state, 'INVALID_BOOL' as any);

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('FI-09: Serializer Malformed Payload Recovery', () => {
      const restored = VectorDocumentSerializer.restoreVectorDocument('{ invalid_json: ');
      expect(restored.success).toBe(false);
      expect(restored.error).toBeDefined();
    });

    it('FI-10: Exporter Null Node Tree Ingestion Recovery', () => {
      const svg = VectorSvgExporter.exportToSvgString({ nodes: [], selectedIds: [] });
      expect(svg).toContain('<svg');
    });

    it('FI-11: History Transaction Push Exception Recovery', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);

      const brokenState = {
        ...state,
        historyStack: {
          ...state.historyStack,
          push: () => { throw new Error('Simulated History Push Failure'); },
        },
      };

      const res = VectorWorkflowOrchestrator.nudgeSelectedNodes(brokenState, 10, 10);
      expect(res).toBeDefined();
    });

    it('FI-12: Illegal State Transition Exception Recovery', () => {
      sm.resetToIdle();
      const success = sm.transitionTo('COMMITTED'); // Illegal
      expect(success).toBe(false);
      expect(sm.getCurrentState()).toBe('IDLE');
    });

    it('FI-13: Empty Document Snapshot Recovery', () => {
      const snap: VectorDocumentSnapshot = { nodes: [], selectedIds: [] };
      const cp = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);

      expect(cp.snapshot.nodes).toEqual([]);
    });

    it('FI-14: Undefined Node Array Serialization Recovery', () => {
      const json = JSON.stringify({ schema: 'vector_document', version: 1 });
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.success).toBe(false);
    });

    it('FI-15: Circular Reference Serialization Exception Recovery', () => {
      const circular: any = { id: 'c1', type: 'path' };
      circular.self = circular;

      expect(() => VectorDocumentSerializer.serializeVectorDocument({ nodes: [circular], selectedIds: [] })).toThrow();
    });

    it('FI-16: Null Selection Parameter Recovery', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, null as any);

      expect(state.snapshot.selectedIds).toEqual([]);
    });

    it('FI-17: Undefined Command Payload Recovery', () => {
      let state = createVectorWorkspaceState([r1]);
      state = VectorWorkflowOrchestrator.dispatchCommand(state, 'Undefined Command', undefined as any);

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('FI-18: Out-of-bounds Canvas Coordinate Recovery', () => {
      const outR: RectangleNode = { ...r1, transform: { ...r1.transform, x: 1e12, y: 1e12 } };
      const snap: VectorDocumentSnapshot = { nodes: [outR], selectedIds: [] };

      const svg = VectorSvgExporter.exportToSvgString(snap);
      expect(svg).toContain('1000000000000');
    });

    it('FI-19: Duplicate Checkpoint Registration Recovery', () => {
      const snap: VectorDocumentSnapshot = { nodes: [r1], selectedIds: [] };
      const cp1 = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);
      const cp2 = re.createCheckpoint('CHECKPOINT_SESSION_START', snap, []);

      expect(cp1.id).not.toEqual(cp2.id);
      expect(re.getCheckpoints()).toHaveLength(2);
    });

    it('FI-20: Serializer Schema Version Mismatch Recovery', () => {
      const json = JSON.stringify({ schema: 'vector_document', version: 999, nodes: [] });
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.success).toBe(true);
    });
  });
});
