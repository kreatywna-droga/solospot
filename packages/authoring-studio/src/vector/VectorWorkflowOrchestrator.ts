/**
 * VectorWorkflowOrchestrator.ts — Sprint G1-42 Workflow Orchestrator (Night Shift Level 4)
 *
 * Unified Workflow & Keyboard-Driven Command Dispatcher for Authoring Studio.
 * Integrates Selection, Command System, Viewport Mapping, Snapping, Serialization, and History Stack.
 *
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot, isEqualSnapshots } from './VectorWorkspaceController';
import { VectorEditingCommandSystem, VectorCommandPayload, VectorBatchCommand } from './VectorEditingCommandSystem';
import { LayerReorderAction, AlignmentType } from './VectorEditingEngine';
import { VectorViewportState } from './VectorViewportController';
import { SnappingOptions } from './VectorSnappingEngine';

export interface KeyboardEventModifiers {
  readonly ctrlOrCmd?: boolean;
  readonly shift?: boolean;
  readonly alt?: boolean;
}

export class VectorWorkflowOrchestrator {
  /**
   * Dispatches a single command, updates document SSOT, and pushes 1 transaction to HistoryStack.
   */
  public static dispatchCommand(
    state: VectorWorkspaceState,
    description: string,
    command: VectorCommandPayload
  ): VectorWorkspaceState {
    if (!state || !state.snapshot) return state;

    try {
      const res = VectorEditingCommandSystem.executeCommand(state.snapshot, command);
      if (!res.success || isEqualSnapshots(state.snapshot, res.snapshot)) {
        return state;
      }

      const nextHistoryStack = state.historyStack.push(res.snapshot, description);
      return {
        snapshot: res.snapshot,
        historyStack: nextHistoryStack,
        activeGuideLines: undefined,
        activeTransformSession: undefined,
      };
    } catch (_err) {
      return state;
    }
  }

  /**
   * Dispatches a batch command transactionally.
   */
  public static dispatchBatch(
    state: VectorWorkspaceState,
    batch: VectorBatchCommand
  ): VectorWorkspaceState {
    if (!state || !state.snapshot) return state;

    try {
      const res = VectorEditingCommandSystem.executeBatch(state.snapshot, batch);
      if (!res.success || isEqualSnapshots(state.snapshot, res.snapshot)) {
        return state;
      }

      const nextHistoryStack = state.historyStack.push(res.snapshot, batch.description);
      return {
        snapshot: res.snapshot,
        historyStack: nextHistoryStack,
        activeGuideLines: undefined,
        activeTransformSession: undefined,
      };
    } catch (_err) {
      return state;
    }
  }

  /**
   * Duplicate selected nodes in place with offset.
   */
  public static duplicateSelectedInPlace(
    state: VectorWorkspaceState,
    offsetX: number = 20,
    offsetY: number = 20
  ): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, 'Duplicate Selected', {
      type: 'DUPLICATE_NODES',
      deltaX: offsetX,
      deltaY: offsetY,
    });
  }

  /**
   * Nudges selected nodes by (dx, dy).
   */
  public static nudgeSelectedNodes(
    state: VectorWorkspaceState,
    dx: number,
    dy: number,
    isFastNudge: boolean = false
  ): VectorWorkspaceState {
    const multiplier = isFastNudge ? 10 : 1;
    const finalDx = dx * multiplier;
    const finalDy = dy * multiplier;

    return VectorWorkflowOrchestrator.dispatchCommand(
      state,
      `Nudge Nodes (${finalDx}, ${finalDy})`,
      {
        type: 'NUDGE_NODES',
        deltaX: finalDx,
        deltaY: finalDy,
      }
    );
  }

  /**
   * Groups selected nodes into a ShapeGroupNode workflow.
   */
  public static groupSelectedWorkflow(state: VectorWorkspaceState): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, 'Group Shapes', {
      type: 'GROUP_NODES',
    });
  }

  /**
   * Ungroups a selected ShapeGroupNode workflow.
   */
  public static ungroupSelectedWorkflow(state: VectorWorkspaceState): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, 'Ungroup Shapes', {
      type: 'UNGROUP_NODES',
    });
  }

  /**
   * Reorders layers of selected shape.
   */
  public static reorderSelectedLayers(
    state: VectorWorkspaceState,
    action: LayerReorderAction
  ): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, `Reorder Layer (${action})`, {
      type: 'REORDER_LAYERS',
      reorderAction: action,
    });
  }

  /**
   * Aligns selected shapes.
   */
  public static alignSelectedWorkflow(
    state: VectorWorkspaceState,
    alignment: AlignmentType
  ): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, `Align Shapes (${alignment})`, {
      type: 'ALIGN_NODES',
      alignment,
    });
  }

  /**
   * Keyboard shortcut command dispatcher.
   */
  public static handleKeyboardCommand(
    state: VectorWorkspaceState,
    key: string,
    modifiers: KeyboardEventModifiers = {}
  ): VectorWorkspaceState {
    if (!state || !key) return state;

    const lowerKey = key.toLowerCase();
    const { ctrlOrCmd, shift, alt } = modifiers;

    if (ctrlOrCmd && lowerKey === 'd') {
      return VectorWorkflowOrchestrator.duplicateSelectedInPlace(state);
    }

    if (ctrlOrCmd && lowerKey === 'g') {
      return shift
        ? VectorWorkflowOrchestrator.ungroupSelectedWorkflow(state)
        : VectorWorkflowOrchestrator.groupSelectedWorkflow(state);
    }

    if (lowerKey === 'delete' || lowerKey === 'backspace') {
      return VectorWorkflowOrchestrator.dispatchCommand(state, 'Delete Selected', {
        type: 'DELETE_NODES',
      });
    }

    if (lowerKey === 'arrowleft') {
      return VectorWorkflowOrchestrator.nudgeSelectedNodes(state, -1, 0, shift);
    }

    if (lowerKey === 'arrowright') {
      return VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 1, 0, shift);
    }

    if (lowerKey === 'arrowup') {
      return VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 0, -1, shift);
    }

    if (lowerKey === 'arrowdown') {
      return VectorWorkflowOrchestrator.nudgeSelectedNodes(state, 0, 1, shift);
    }

    return state;
  }
}
