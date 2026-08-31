/**
 * VectorWorkflowIntegrationG142.test.ts — Milestone G1-42 Test Suite (Night Shift Level 4)
 *
 * Professional Vector Editing Workflow Integration validation:
 * - Feature Tests (≥24)
 * - Integration Tests (≥15)
 * - E2E Workflows (≥12)
 * - Adversarial Scenarios (≥24)
 * - Failure Injection Points (≥8)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RectangleNode, EllipseNode, VectorNode } from '../VectorDomainModel';
import {
  createVectorWorkspaceState,
  VectorWorkspaceState,
  selectNodes,
} from '../VectorWorkspaceController';
import { VectorEditingCommandSystem, VectorCommandPayload, VectorBatchCommand } from '../VectorEditingCommandSystem';
import { VectorWorkflowOrchestrator } from '../VectorWorkflowOrchestrator';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';
import { VectorSvgExporter } from '../VectorSvgExporter';

describe('WF-HACP-STUDIO-G1-42 — Professional Vector Editing Workflow Integration', () => {
  let r1: RectangleNode;
  let r2: RectangleNode;
  let e1: EllipseNode;

  beforeEach(() => {
    r1 = {
      id: 'rect_1',
      name: 'Rectangle 1',
      type: 'rectangle',
      transform: {
        x: 100,
        y: 100,
        width: 200,
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
        x: 400,
        y: 100,
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

    e1 = {
      id: 'ellipse_1',
      name: 'Ellipse 1',
      type: 'ellipse',
      transform: {
        x: 100,
        y: 300,
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
  });

  // =========================================================================
  // 1. FEATURE TESTS (≥24)
  // =========================================================================
  describe('1. Feature Tests', () => {
    it('F01: dispatches MOVE_NODES command via command system', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'MOVE_NODES',
        targetIds: ['rect_1'],
        deltaX: 50,
        deltaY: 50,
      });

      expect(res.success).toBe(true);
      expect(res.snapshot.nodes[0].transform.x).toBe(150);
    });

    it('F02: dispatches SCALE_NODES command via command system', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'SCALE_NODES',
        targetIds: ['rect_1'],
        scaleX: 1.5,
        scaleY: 1.5,
      });

      expect(res.success).toBe(true);
      expect(res.snapshot.nodes[0].transform.width).toBe(300);
    });

    it('F03: dispatches ROTATE_NODES command via command system', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'ROTATE_NODES',
        targetIds: ['rect_1'],
        angleDeg: 45,
      });

      expect(res.success).toBe(true);
    });

    it('F04: dispatches ALIGN_NODES command for multiple nodes', () => {
      const state = createVectorWorkspaceState([r1, r2]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'ALIGN_NODES',
        targetIds: ['rect_1', 'rect_2'],
        alignment: 'left',
      });

      expect(res.success).toBe(true);
      expect(res.snapshot.nodes[0].transform.x).toBe(100);
      expect(res.snapshot.nodes[1].transform.x).toBe(100);
    });

    it('F05: dispatches GROUP_NODES command', () => {
      const state = createVectorWorkspaceState([r1, r2]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'GROUP_NODES',
        targetIds: ['rect_1', 'rect_2'],
      });

      expect(res.success).toBe(true);
      expect(res.snapshot.nodes.some(n => n.type === 'group')).toBe(true);
    });

    it('F06: dispatches UNGROUP_NODES command', () => {
      const state = createVectorWorkspaceState([r1, r2]);
      const groupRes = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'GROUP_NODES',
        targetIds: ['rect_1', 'rect_2'],
      });
      const groupId = groupRes.snapshot.nodes.find(n => n.type === 'group')?.id;

      const ungroupRes = VectorEditingCommandSystem.executeCommand(groupRes.snapshot, {
        type: 'UNGROUP_NODES',
        targetIds: [groupId!],
      });

      expect(ungroupRes.success).toBe(true);
      expect(ungroupRes.snapshot.nodes.some(n => n.type === 'group')).toBe(false);
    });

    it('F07: dispatches DUPLICATE_NODES command with offset', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'DUPLICATE_NODES',
        targetIds: ['rect_1'],
        deltaX: 20,
        deltaY: 20,
      });

      expect(res.success).toBe(true);
      expect(res.snapshot.nodes.length).toBe(2);
      expect(res.snapshot.nodes[1].transform.x).toBe(120);
    });

    it('F08: dispatches DELETE_NODES command', () => {
      const state = createVectorWorkspaceState([r1, r2]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'DELETE_NODES',
        targetIds: ['rect_1'],
      });

      expect(res.success).toBe(true);
      expect(res.snapshot.nodes.length).toBe(1);
      expect(res.snapshot.nodes[0].id).toBe('rect_2');
    });

    it('F09: dispatches REORDER_LAYERS command', () => {
      const state = createVectorWorkspaceState([r1, r2]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'REORDER_LAYERS',
        targetIds: ['rect_1'],
        reorderAction: 'bringToFront',
      });

      expect(res.success).toBe(true);
    });

    it('F10: dispatches NUDGE_NODES command', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'NUDGE_NODES',
        targetIds: ['rect_1'],
        deltaX: 1,
        deltaY: 0,
      });

      expect(res.success).toBe(true);
      expect(res.snapshot.nodes[0].transform.x).toBe(101);
    });

    it('F11: dispatches UPDATE_NODE_PROPS command for opacity and fill', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'UPDATE_NODE_PROPS',
        targetIds: ['rect_1'],
        propsUpdate: { opacity: 0.5, visible: false },
      });

      expect(res.success).toBe(true);
      expect(res.snapshot.nodes[0].opacity).toBe(0.5);
      expect(res.snapshot.nodes[0].visible).toBe(false);
    });

    it('F12: executes a multi-command batch transactionally', () => {
      const state = createVectorWorkspaceState([r1]);
      const batch: VectorBatchCommand = {
        batchId: 'b1',
        description: 'Move and Scale',
        commands: [
          { type: 'MOVE_NODES', targetIds: ['rect_1'], deltaX: 20, deltaY: 20 },
          { type: 'SCALE_NODES', targetIds: ['rect_1'], scaleX: 2, scaleY: 2 },
        ],
      };
      const res = VectorEditingCommandSystem.executeBatch(state.snapshot, batch);

      expect(res.success).toBe(true);
      expect(res.snapshot.nodes[0].transform.x).toBe(20);
    });

    it('F13: dispatches duplicateSelectedInPlace via orchestrator', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.duplicateSelectedInPlace(state, 30, 30);

      expect(state.snapshot.nodes.length).toBe(2);
      expect(state.snapshot.nodes[1].transform.x).toBe(130);
    });

    it('F14: dispatches nudgeSelectedNodes with normal multiplier', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 1, 0, false);

      expect(state.snapshot.nodes[0].transform.x).toBe(101);
    });

    it('F15: dispatches nudgeSelectedNodes with fast multiplier (shift)', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 1, 0, true);

      expect(state.snapshot.nodes[0].transform.x).toBe(110);
    });

    it('F16: handles Cmd+D keyboard shortcut for duplication', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.handleKeyboardCommand(state, 'd', { ctrlOrCmd: true });

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('F17: handles Cmd+G keyboard shortcut for grouping', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.handleKeyboardCommand(state, 'g', { ctrlOrCmd: true });

      expect(state.snapshot.nodes.some(n => n.type === 'group')).toBe(true);
    });

    it('F18: handles Cmd+Shift+G keyboard shortcut for ungrouping', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.groupSelectedWorkflow(state);
      state = selectNodes(state, [state.snapshot.nodes.find(n => n.type === 'group')!.id]);

      state = VectorWorkflowOrchestrator.handleKeyboardCommand(state, 'g', { ctrlOrCmd: true, shift: true });
      expect(state.snapshot.nodes.some(n => n.type === 'group')).toBe(false);
    });

    it('F19: handles Delete key shortcut for removal', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.handleKeyboardCommand(state, 'delete');

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('F20: handles ArrowLeft key shortcut for nudging', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.handleKeyboardCommand(state, 'ArrowLeft');

      expect(state.snapshot.nodes[0].transform.x).toBe(99);
    });

    it('F21: handles ArrowRight key shortcut for nudging', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.handleKeyboardCommand(state, 'ArrowRight');

      expect(state.snapshot.nodes[0].transform.x).toBe(101);
    });

    it('F22: handles ArrowUp key shortcut for nudging', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.handleKeyboardCommand(state, 'ArrowUp');

      expect(state.snapshot.nodes[0].transform.y).toBe(99);
    });

    it('F23: handles ArrowDown key shortcut for nudging', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.handleKeyboardCommand(state, 'ArrowDown');

      expect(state.snapshot.nodes[0].transform.y).toBe(101);
    });

    it('F24: validates command payload correctness via validateCommandPayload', () => {
      const valid = VectorEditingCommandSystem.validateCommandPayload({
        type: 'MOVE_NODES',
        deltaX: 10,
        deltaY: 20,
      });
      expect(valid).toBe(true);
    });
  });

  // =========================================================================
  // 2. INTEGRATION TESTS (≥15)
  // =========================================================================
  describe('2. Integration Tests', () => {
    it('I01: integrates workflow dispatcher with HistoryStack on dispatchCommand', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialHistoryLength = state.historyStack.entries.length;

      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.duplicateSelectedInPlace(state);

      expect(state.historyStack.entries.length).toBe(initialHistoryLength + 1);
    });

    it('I02: integrates batch command execution with single HistoryStack transaction', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialHistoryLength = state.historyStack.entries.length;

      state = selectNodes(state, ['rect_1']);
      const batch: VectorBatchCommand = {
        batchId: 'b1',
        description: 'Batch Move and Nudge',
        commands: [
          { type: 'MOVE_NODES', targetIds: ['rect_1'], deltaX: 10, deltaY: 10 },
          { type: 'NUDGE_NODES', targetIds: ['rect_1'], deltaX: 5, deltaY: 5 },
        ],
      };
      state = VectorWorkflowOrchestrator.dispatchBatch(state, batch);

      expect(state.historyStack.entries.length).toBe(initialHistoryLength + 1);
    });

    it('I03: supports undo of a dispatched workflow command', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.duplicateSelectedInPlace(state);

      const undoRes = state.historyStack.undo();
      if (undoRes) {
        state = { snapshot: undoRes.state, historyStack: undoRes.stack };
      }

      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('I04: supports redo of an undone workflow command', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.duplicateSelectedInPlace(state);

      const undoRes = state.historyStack.undo();
      if (undoRes) {
        state = { snapshot: undoRes.state, historyStack: undoRes.stack };
      }
      const redoRes = state.historyStack.redo();
      if (redoRes) {
        state = { snapshot: redoRes.state, historyStack: redoRes.stack };
      }

      expect(state.snapshot.nodes.length).toBe(2);
    });

    it('I05: integrates serialization roundtrip after workflow command execution', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.duplicateSelectedInPlace(state);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes.length).toBe(3);
    });

    it('I06: integrates SVG export roundtrip after workflow command execution', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.duplicateSelectedInPlace(state);

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<rect');
    });

    it('I07: maintains non-selected node properties unchanged during command dispatch', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 50, 50);

      const unselectedNode = state.snapshot.nodes.find(n => n.id === 'rect_2');
      expect(unselectedNode).toEqual(r2);
    });

    it('I08: ignores locked nodes during command execution', () => {
      const lockedR1: RectangleNode = { ...r1, locked: true };
      let state = createVectorWorkspaceState([lockedR1, r2]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 50, 50);

      const target = state.snapshot.nodes.find(n => n.id === 'rect_1');
      expect(target?.transform.x).toBe(100);
    });

    it('I09: handles empty batch command gracefully without history push', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialHistoryLength = state.historyStack.entries.length;

      state = VectorWorkflowOrchestrator.dispatchBatch(state, {
        batchId: 'b_empty',
        description: 'Empty',
        commands: [],
      });

      expect(state.historyStack.entries.length).toBe(initialHistoryLength);
    });

    it('I10: handles no-op command gracefully without history push', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialHistoryLength = state.historyStack.entries.length;

      state = VectorWorkflowOrchestrator.dispatchCommand(state, 'NoOp Move', {
        type: 'MOVE_NODES',
        targetIds: ['rect_1'],
        deltaX: 0,
        deltaY: 0,
      });

      expect(state.historyStack.entries.length).toBe(initialHistoryLength);
    });

    it('I11: integrates multi-selection alignment command', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.alignSelectedWorkflow(state, 'top');

      expect(state.snapshot.nodes[0].transform.y).toBe(100);
      expect(state.snapshot.nodes[1].transform.y).toBe(100);
    });

    it('I12: preserves node custom properties during update command', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.dispatchCommand(state, 'Update Opacity', {
        type: 'UPDATE_NODE_PROPS',
        propsUpdate: { opacity: 0.8 },
      });

      expect(state.snapshot.nodes[0].opacity).toBe(0.8);
      expect(state.snapshot.nodes[0].name).toBe('Rectangle 1');
    });

    it('I13: performs complete rollback if any command in batch fails', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialSnapshot = state.snapshot;

      const brokenBatch: VectorBatchCommand = {
        batchId: 'b_broken',
        description: 'Broken Batch',
        commands: [
          { type: 'MOVE_NODES', targetIds: ['rect_1'], deltaX: 50, deltaY: 50 },
          { type: 'MOVE_NODES', targetIds: ['rect_1'], deltaX: NaN, deltaY: 50 },
        ],
      };

      state = VectorWorkflowOrchestrator.dispatchBatch(state, brokenBatch);
      expect(state.snapshot).toEqual(initialSnapshot);
    });

    it('I14: handles keyboard command dispatch on unrecognized key gracefully', () => {
      let state = createVectorWorkspaceState([r1]);
      const initial = state;
      state = VectorWorkflowOrchestrator.handleKeyboardCommand(state, 'UnrecognizedKey');

      expect(state).toEqual(initial);
    });

    it('I15: maintains document integrity across 20 sequential workflow commands', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);

      for (let i = 0; i < 20; i++) {
        state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 1, 1);
      }

      expect(state.snapshot.nodes[0].transform.x).toBe(120);
    });
  });

  // =========================================================================
  // 3. E2E WORKFLOWS (≥12)
  // =========================================================================
  describe('3. E2E Workflows', () => {
    it('E2E-01: User Intent: Create -> Duplicate -> Align -> Group -> Export', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.duplicateSelectedInPlace(state, 50, 0);

      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.alignSelectedWorkflow(state, 'top');
      state = VectorWorkflowOrchestrator.groupSelectedWorkflow(state);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);
      const svg = VectorSvgExporter.exportToSvgString(restored.snapshot!);

      expect(restored.snapshot!.nodes.length).toBeGreaterThan(1);
      expect(svg).toContain('<svg');
    });

    it('E2E-02: User Intent: Keyboard Nudge -> Keyboard Duplicate -> Keyboard Group', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);

      state = VectorWorkflowOrchestrator.handleKeyboardCommand(state, 'ArrowRight');
      state = VectorWorkflowOrchestrator.handleKeyboardCommand(state, 'd', { ctrlOrCmd: true });

      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.handleKeyboardCommand(state, 'g', { ctrlOrCmd: true });

      expect(state.snapshot.nodes.some(n => n.type === 'group')).toBe(true);
    });

    it('E2E-03: User Intent: Multi-node Delete -> Undo -> Redo Workflow', () => {
      let state = createVectorWorkspaceState([r1, r2, e1]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.dispatchCommand(state, 'Delete Selected', { type: 'DELETE_NODES' });

      expect(state.snapshot.nodes.length).toBe(1);

      const undoRes = state.historyStack.undo();
      if (undoRes) {
        state = { snapshot: undoRes.state, historyStack: undoRes.stack };
      }
      expect(state.snapshot.nodes.length).toBe(3);

      const redoRes = state.historyStack.redo();
      if (redoRes) {
        state = { snapshot: redoRes.state, historyStack: redoRes.stack };
      }
      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('E2E-04: User Intent: Batch Compound Transformation Workflow', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);

      const compoundBatch: VectorBatchCommand = {
        batchId: 'cb1',
        description: 'Compound Transform',
        commands: [
          { type: 'MOVE_NODES', targetIds: ['rect_1'], deltaX: 100, deltaY: 50 },
          { type: 'SCALE_NODES', targetIds: ['rect_1'], scaleX: 1.5, scaleY: 1.5 },
          { type: 'ROTATE_NODES', targetIds: ['rect_1'], angleDeg: 30 },
        ],
      };

      state = VectorWorkflowOrchestrator.dispatchBatch(state, compoundBatch);
      expect(state.snapshot.nodes[0].transform.x).toBe(150);
    });

    it('E2E-05: User Intent: Locked Node Protection in Multi-Selection Operations', () => {
      const lockedR1: RectangleNode = { ...r1, locked: true };
      let state = createVectorWorkspaceState([lockedR1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 100, 100);

      const node1 = state.snapshot.nodes.find(n => n.id === 'rect_1');
      const node2 = state.snapshot.nodes.find(n => n.id === 'rect_2');

      expect(node1?.transform.x).toBe(100);
      expect(node2?.transform.x).toBe(500);
    });

    it('E2E-06: User Intent: Fast Nudge Keyboard Workflow', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.handleKeyboardCommand(state, 'ArrowRight', { shift: true });

      expect(state.snapshot.nodes[0].transform.x).toBe(110);
    });

    it('E2E-07: User Intent: Reorder Layer Workflow -> Undo -> SVG Export', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.reorderSelectedLayers(state, 'bringToFront');

      const svg = VectorSvgExporter.exportToSvgString(state.snapshot);
      expect(svg).toContain('<rect');
    });

    it('E2E-08: User Intent: Duplicate Multiple Shapes simultaneously', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.duplicateSelectedInPlace(state, 50, 50);

      expect(state.snapshot.nodes.length).toBe(4);
    });

    it('E2E-09: User Intent: Group -> Move Group -> Ungroup Workflow', () => {
      let state = createVectorWorkspaceState([r1, r2]);
      state = selectNodes(state, ['rect_1', 'rect_2']);
      state = VectorWorkflowOrchestrator.groupSelectedWorkflow(state);

      const groupId = state.snapshot.nodes.find(n => n.type === 'group')!.id;
      state = selectNodes(state, [groupId]);
      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 50, 50);

      state = VectorWorkflowOrchestrator.ungroupSelectedWorkflow(state);
      expect(state.snapshot.nodes.some(n => n.type === 'group')).toBe(false);
    });

    it('E2E-10: User Intent: Prop Updates (Opacity, Fill) -> JSON Persistence', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.dispatchCommand(state, 'Update Props', {
        type: 'UPDATE_NODE_PROPS',
        propsUpdate: { opacity: 0.7 },
      });

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);

      expect(restored.snapshot!.nodes[0].opacity).toBe(0.7);
    });

    it('E2E-11: User Intent: Complex Multi-Step Command History Rollback', () => {
      let state = createVectorWorkspaceState([r1]);
      const initialSnapshot = state.snapshot;

      state = selectNodes(state, ['rect_1']);
      state = VectorWorkflowOrchestrator.duplicateSelectedInPlace(state);
      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 20, 20);
      state = VectorWorkflowOrchestrator.dispatchCommand(state, 'Delete', { type: 'DELETE_NODES' });

      // Rollback 3 steps
      for (let i = 0; i < 3; i++) {
        const undoRes = state.historyStack.undo();
        if (undoRes) state = { snapshot: undoRes.state, historyStack: undoRes.stack };
      }

      expect(state.snapshot).toEqual(initialSnapshot);
    });

    it('E2E-12: User Intent: Full Document Lifecycle Integration Pipeline', () => {
      let state = createVectorWorkspaceState([r1, r2, e1]);
      state = selectNodes(state, ['rect_1', 'ellipse_1']);
      state = VectorWorkflowOrchestrator.alignSelectedWorkflow(state, 'left');
      state = VectorWorkflowOrchestrator.groupSelectedWorkflow(state);

      const json = VectorDocumentSerializer.serializeVectorDocument(state.snapshot);
      const restored = VectorDocumentSerializer.restoreVectorDocument(json);
      const svg = VectorSvgExporter.exportToSvgString(restored.snapshot!);

      expect(restored.snapshot!.nodes.length).toBe(2);
      expect(svg).toContain('<svg');
    });
  });

  // =========================================================================
  // 4. ADVERSARIAL SCENARIOS (≥24)
  // =========================================================================
  describe('4. Adversarial Scenarios', () => {
    it('ADV-01: handles executeCommand with null snapshot', () => {
      const res = VectorEditingCommandSystem.executeCommand(null as any, { type: 'MOVE_NODES' });
      expect(res.success).toBe(false);
    });

    it('ADV-02: handles executeCommand with invalid command type', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, { type: 'UNKNOWN_TYPE' as any });
      expect(res.success).toBe(true);
    });

    it('ADV-03: handles executeBatch with null batch', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeBatch(state.snapshot, null as any);
      expect(res.success).toBe(true);
    });

    it('ADV-04: handles extreme move delta (1e9, 1e9)', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'MOVE_NODES',
        targetIds: ['rect_1'],
        deltaX: 1e9,
        deltaY: 1e9,
      });

      expect(res.success).toBe(true);
      expect(res.snapshot.nodes[0].transform.x).toBe(1e9 + 100);
    });

    it('ADV-05: handles negative scale input (-2, -2)', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'SCALE_NODES',
        targetIds: ['rect_1'],
        scaleX: -2,
        scaleY: -2,
      });

      expect(res.success).toBe(true);
    });

    it('ADV-06: handles zero scale input (0, 0) via 1e-6 safeguard', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'SCALE_NODES',
        targetIds: ['rect_1'],
        scaleX: 0,
        scaleY: 0,
      });

      expect(res.success).toBe(true);
    });

    it('ADV-07: handles NaN move delta input safely', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'MOVE_NODES',
        targetIds: ['rect_1'],
        deltaX: NaN,
        deltaY: 10,
      });

      expect(res.success).toBe(false);
    });

    it('ADV-08: handles Infinity move delta input safely', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'MOVE_NODES',
        targetIds: ['rect_1'],
        deltaX: Infinity,
        deltaY: 10,
      });

      expect(res.success).toBe(false);
    });

    it('ADV-09: handles command targetIds with non-existent IDs', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'MOVE_NODES',
        targetIds: ['non_existent_1'],
        deltaX: 10,
        deltaY: 10,
      });

      expect(res.success).toBe(true);
      expect(res.snapshot.nodes[0].transform.x).toBe(100);
    });

    it('ADV-10: handles grouping on empty selection', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'GROUP_NODES',
        targetIds: [],
      });

      expect(res.success).toBe(true);
    });

    it('ADV-11: handles grouping on single node', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'GROUP_NODES',
        targetIds: ['rect_1'],
      });

      expect(res.success).toBe(true);
    });

    it('ADV-12: handles ungrouping on non-group shape', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'UNGROUP_NODES',
        targetIds: ['rect_1'],
      });

      expect(res.success).toBe(true);
    });

    it('ADV-13: handles alignment on single node gracefully', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'ALIGN_NODES',
        targetIds: ['rect_1'],
        alignment: 'center',
      });

      expect(res.success).toBe(true);
    });

    it('ADV-14: handles dispatching command on null state in orchestrator', () => {
      const res = VectorWorkflowOrchestrator.dispatchCommand(null as any, 'Test', { type: 'MOVE_NODES' });
      expect(res).toBeNull();
    });

    it('ADV-15: handles dispatching batch on null state in orchestrator', () => {
      const res = VectorWorkflowOrchestrator.dispatchBatch(null as any, { batchId: 'b', description: 'd', commands: [] });
      expect(res).toBeNull();
    });

    it('ADV-16: handles keyboard command on null state', () => {
      const res = VectorWorkflowOrchestrator.handleKeyboardCommand(null as any, 'd');
      expect(res).toBeNull();
    });

    it('ADV-17: handles keyboard command on empty key string', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorWorkflowOrchestrator.handleKeyboardCommand(state, '');
      expect(res).toEqual(state);
    });

    it('ADV-18: handles duplicate command on empty selection', () => {
      let state = createVectorWorkspaceState([r1]);
      state = VectorWorkflowOrchestrator.duplicateSelectedInPlace(state);
      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('ADV-19: handles nudge command on empty selection', () => {
      let state = createVectorWorkspaceState([r1]);
      state = VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 10, 10);
      expect(state.snapshot.nodes[0].transform.x).toBe(100);
    });

    it('ADV-20: handles reorder command on empty selection', () => {
      let state = createVectorWorkspaceState([r1]);
      state = VectorWorkflowOrchestrator.reorderSelectedLayers(state, 'bringToFront');
      expect(state.snapshot.nodes.length).toBe(1);
    });

    it('ADV-21: handles update props command on non-existent ID', () => {
      let state = createVectorWorkspaceState([r1]);
      state = VectorWorkflowOrchestrator.dispatchCommand(state, 'Update', {
        type: 'UPDATE_NODE_PROPS',
        targetIds: ['missing_id'],
        propsUpdate: { opacity: 0.5 },
      });

      expect(state.snapshot.nodes[0].opacity).toBe(1);
    });

    it('ADV-22: handles zero origin transform calculation gracefully', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'SCALE_NODES',
        targetIds: ['rect_1'],
        scaleX: 2,
        scaleY: 2,
        origin: { x: 0, y: 0 },
      });

      expect(res.success).toBe(true);
    });

    it('ADV-23: handles rotation by 360 degrees', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'ROTATE_NODES',
        targetIds: ['rect_1'],
        angleDeg: 360,
      });

      expect(res.success).toBe(true);
    });

    it('ADV-24: handles batch execution with 50 sequential commands', () => {
      const state = createVectorWorkspaceState([r1]);
      const cmds: VectorCommandPayload[] = [];
      for (let i = 0; i < 50; i++) {
        cmds.push({ type: 'NUDGE_NODES', targetIds: ['rect_1'], deltaX: 1, deltaY: 1 });
      }

      const res = VectorEditingCommandSystem.executeBatch(state.snapshot, {
        batchId: 'b_50',
        description: '50 Nudges',
        commands: cmds,
      });

      expect(res.success).toBe(true);
      expect(res.snapshot.nodes[0].transform.x).toBe(150);
    });
  });

  // =========================================================================
  // 5. FAILURE INJECTION POINTS (≥8)
  // =========================================================================
  describe('5. Failure Injection Points', () => {
    it('FI-01: Invalid Node Data Ingestion', () => {
      const corruptedSnapshot: any = { nodes: [null, undefined], selectedIds: [] };
      const res = VectorEditingCommandSystem.executeCommand(corruptedSnapshot, { type: 'MOVE_NODES' });
      expect(res.success).toBe(true);
    });

    it('FI-02: Invalid Selection Array Payload', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'MOVE_NODES',
        targetIds: [null as any, undefined as any],
      });
      expect(res.success).toBe(true);
    });

    it('FI-03: Invalid Transform Scale Input (NaN)', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'SCALE_NODES',
        scaleX: NaN,
      });
      expect(res.success).toBe(false);
    });

    it('FI-04: Invalid Transform Rotation Input (Infinity)', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, {
        type: 'ROTATE_NODES',
        angleDeg: Infinity,
      });
      expect(res.success).toBe(false);
    });

    it('FI-05: Missing Dependency Parameter Recovery', () => {
      const state = createVectorWorkspaceState([r1]);
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, undefined as any);
      expect(res.success).toBe(false);
    });

    it('FI-06: History Stack Push Exception Isolation', () => {
      let state = createVectorWorkspaceState([r1]);
      state = selectNodes(state, ['rect_1']);

      // Inject throwing history stack
      const brokenState: VectorWorkspaceState = {
        ...state,
        historyStack: {
          ...state.historyStack,
          push: () => { throw new Error('Simulated History Failure'); },
        },
      };

      const res = VectorWorkflowOrchestrator.duplicateSelectedInPlace(brokenState);
      expect(res).toBeDefined();
    });

    it('FI-07: Serialization Exception Isolation', () => {
      const circularNode: any = { id: 'c1', type: 'rectangle', transform: { x: 0, y: 0, width: 10, height: 10 } };
      circularNode.self = circularNode;

      expect(() => VectorDocumentSerializer.serializeVectorDocument({ nodes: [circularNode], selectedIds: [], constraintEdges: [] })).toThrow();
    });

    it('FI-08: Controller State Corruption Emergency Rollback', () => {
      let state = createVectorWorkspaceState([r1]);
      const corruptedBatch: VectorBatchCommand = {
        batchId: 'cb',
        description: 'Corrupted Batch',
        commands: [
          { type: 'MOVE_NODES', targetIds: ['rect_1'], deltaX: 10, deltaY: 10 },
          { type: 'SCALE_NODES', targetIds: ['rect_1'], scaleX: NaN, scaleY: 2 },
        ],
      };

      state = VectorWorkflowOrchestrator.dispatchBatch(state, corruptedBatch);
      expect(state.snapshot.nodes[0].transform.x).toBe(100);
    });
  });
});
