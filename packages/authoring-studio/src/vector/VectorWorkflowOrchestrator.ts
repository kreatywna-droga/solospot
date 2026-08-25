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
import { LayerReorderAction, AlignmentType, VectorEditingEngine } from './VectorEditingEngine';
import { VectorViewportState } from './VectorViewportController';
import { VectorSnappingEngine, SnappingOptions } from './VectorSnappingEngine';
import { VectorEditorInteractionStateMachine } from './VectorEditorInteractionStateMachine';
import { VectorTransactionRecoveryEngine, CheckpointLevel } from './VectorTransactionRecoveryEngine';
import { VectorBooleanTopologyEngine } from './VectorBooleanTopologyEngine';
import { VectorCompoundTopologyMaskEngine } from './VectorCompoundTopologyMaskEngine';
import { VectorCrossSubsystemTransaction, CrossSubsystemOperation, CrossSubsystemTransactionResult } from './VectorCrossSubsystemTransaction';
import { VectorDeterministicWorkflowEngine, WorkflowExecutionResult } from './VectorDeterministicWorkflowEngine';
import { VectorWorkflowDefinition, WorkflowExecutionStep } from './VectorWorkflowDefinition';
import { VectorConstraintGraphEngine } from './VectorConstraintGraphEngine';
import { VectorConstraintSolverEngine, SolverOptions } from './VectorConstraintSolverEngine';
import { VectorConstraintConflictResolutionEngine, ConflictResolutionStrategy } from './VectorConstraintConflictResolutionEngine';
import { VectorConstraintTransactionPlannerEngine, PlannedOperation, VectorConstraintTransactionPlan } from './VectorConstraintTransactionPlannerEngine';
import { BoundingBox } from './VectorConstraintLayoutEngine';

export interface KeyboardEventModifiers {
  readonly ctrlOrCmd?: boolean;
  readonly shift?: boolean;
  readonly alt?: boolean;
}

export class VectorWorkflowOrchestrator {
  private static stateMachine = new VectorEditorInteractionStateMachine();
  private static recoveryEngine = new VectorTransactionRecoveryEngine();

  public static getStateMachine(): VectorEditorInteractionStateMachine {
    return VectorWorkflowOrchestrator.stateMachine;
  }

  public static getRecoveryEngine(): VectorTransactionRecoveryEngine {
    return VectorWorkflowOrchestrator.recoveryEngine;
  }
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
   * Applies Boolean Topology operation (union, difference, intersection, exclusion).
   */
  public static applyBooleanTopologyWorkflow(
    state: VectorWorkspaceState,
    topologyType: any
  ): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, `Boolean Topology (${topologyType})`, {
      type: 'BOOLEAN_TOPOLOGY',
      topologyType,
    });
  }

  /**
   * Smooths path corners for selected path shape.
   */
  public static smoothSelectedPathCornersWorkflow(
    state: VectorWorkspaceState,
    radiusPx: number = 10
  ): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, `Smooth Path Corners (${radiusPx}px)`, {
      type: 'SMOOTH_PATH_CORNERS',
      cornerRadiusPx: radiusPx,
    });
  }

  /**
   * Reverses winding direction of selected path shape.
   */
  public static reverseSelectedPathWorkflow(state: VectorWorkspaceState): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, 'Reverse Path Winding', {
      type: 'REVERSE_PATH',
    });
  }

  /**
   * Combines selected paths into a single Compound Path.
   */
  public static makeCompoundPathWorkflow(
    state: VectorWorkspaceState,
    windingRule: any = 'evenodd'
  ): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, `Make Compound Path (${windingRule})`, {
      type: 'MAKE_COMPOUND_PATH',
      windingRule,
    });
  }

  /**
   * Releases selected Compound Path back into individual paths.
   */
  public static releaseCompoundPathWorkflow(state: VectorWorkspaceState): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, 'Release Compound Path', {
      type: 'RELEASE_COMPOUND_PATH',
    });
  }

  /**
   * Updates fill rule / winding rule on selected path.
   */
  public static setWindingRuleWorkflow(
    state: VectorWorkspaceState,
    windingRule: any
  ): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, `Set Winding Rule (${windingRule})`, {
      type: 'SET_WINDING_RULE',
      windingRule,
    });
  }

  /**
   * Inserts a new node on a path segment.
   */
  public static insertNodeOnSegmentWorkflow(
    state: VectorWorkspaceState,
    segmentIndex: number = 0,
    tParam: number = 0.5
  ): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, `Insert Node on Segment ${segmentIndex}`, {
      type: 'INSERT_PATH_NODE',
      segmentIndex,
      tParam,
    });
  }

  /**
   * Deletes an anchor point from selected path.
   */
  public static deleteAnchorPointWorkflow(
    state: VectorWorkspaceState,
    anchorId: string
  ): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, `Delete Anchor Point (${anchorId})`, {
      type: 'DELETE_PATH_NODE',
      anchorId,
    });
  }

  /**
   * Splits selected path at specified anchor point.
   */
  public static splitPathAtAnchorWorkflow(
    state: VectorWorkspaceState,
    anchorId: string
  ): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, `Split Path at Anchor (${anchorId})`, {
      type: 'SPLIT_PATH_AT_ANCHOR',
      anchorId,
    });
  }

  /**
   * Joins 2 selected path segments end-to-end.
   */
  public static joinPathSegmentsWorkflow(state: VectorWorkspaceState): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, 'Join Path Segments', {
      type: 'JOIN_PATH_SEGMENTS',
    });
  }

  /**
   * Creates a vector clipping mask from selected shapes.
   */
  public static createVectorMaskWorkflow(state: VectorWorkspaceState): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, 'Create Vector Mask', {
      type: 'CREATE_VECTOR_MASK',
    });
  }

  /**
   * Releases a vector mask group back to individual shapes.
   */
  public static releaseVectorMaskWorkflow(state: VectorWorkspaceState): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, 'Release Vector Mask', {
      type: 'RELEASE_VECTOR_MASK',
    });
  }

  /**
   * Sets mask CSG topology operation.
   */
  public static setMaskTopologyWorkflow(
    state: VectorWorkspaceState,
    topologyType: any = 'union'
  ): VectorWorkspaceState {
    return VectorWorkflowOrchestrator.dispatchCommand(state, `Set Mask Topology (${topologyType})`, {
      type: 'SET_MASK_TOPOLOGY',
      topologyType,
    });
  }

  /**
   * Executes a cross-subsystem transform-with-snapping transaction.
   * Coordinates VectorTransformInteractionEngine + VectorSnappingEngine + HistoryStack
   * under a single atomic boundary: BEGIN → PREPARE → EXECUTE (transform + snap) → VALIDATE → COMMIT.
   * On failure: rollback to baseline snapshot, zero HistoryStack entries.
   */
  public static executeCrossSubsystemTransformSnapTransaction(
    state: VectorWorkspaceState,
    deltaX: number,
    deltaY: number
  ): WorkflowExecutionResult {
    const workflow: VectorWorkflowDefinition = {
      workflowId: `wf_transform_snap_${Date.now()}`,
      description: 'Transform with Snapping',
      steps: [
        {
          id: 'step_1_transform',
          operation: (snapshot: VectorDocumentSnapshot) => {
            const cmdRes = VectorEditingCommandSystem.executeCommand(
              snapshot,
              { type: 'NUDGE_NODES', deltaX, deltaY }
            );
            if (!cmdRes.success || !cmdRes.snapshot) return snapshot;
            return cmdRes.snapshot;
          }
        },
        {
          id: 'step_2_snap',
          operation: (snapshot: VectorDocumentSnapshot) => {
            const { selectedIds } = snapshot;
            if (!selectedIds || selectedIds.length === 0) return snapshot;
            const selectedNodes = snapshot.nodes.filter(
              (n: any) => selectedIds.includes(n.id) && !n.locked
            );
            if (selectedNodes.length === 0) return snapshot;
            const targetNodes = snapshot.nodes.filter(
              (n: any) => !selectedIds.includes(n.id)
            );
            const bounds = VectorEditingEngine.computeSelectionBounds(selectedNodes);
            if (!bounds) return snapshot;

            const snapResult = VectorSnappingEngine.computeSnapDelta(
              bounds,
              targetNodes,
              {}
            );
            const finalDx = snapResult.snappedDeltaX;
            const finalDy = snapResult.snappedDeltaY;
            if (finalDx === 0 && finalDy === 0) return snapshot;
            const movedNodes = selectedNodes.map((n: any) =>
              VectorEditingEngine.moveShape(n, finalDx, finalDy)
            );
            const movedMap = new Map(movedNodes.map((n: any) => [n.id, n]));
            const nextNodes = snapshot.nodes.map((n: any) =>
              movedMap.has(n.id) ? movedMap.get(n.id)! : n
            );
            return { nodes: [...nextNodes], selectedIds: selectedIds, constraintEdges: snapshot.constraintEdges || [] };
          }
        }
      ]
    };

    return VectorDeterministicWorkflowEngine.executeWorkflow(state, workflow);
  }

  /**
   * (Sprint G1-48 / HACP) Executes a multi-subsystem Path Boolean followed by Compound Mask topology operation.
   */
  public static executeCrossSubsystemPathBooleanMaskTransaction(
    state: VectorWorkspaceState,
    topologyType: any,
    maskShapeId: string,
    targetShapeIds: ReadonlyArray<string>
  ): WorkflowExecutionResult {
    const workflow: VectorWorkflowDefinition = {
      workflowId: `wf_path_bool_mask_${Date.now()}`,
      description: 'Path Boolean + Mask',
      steps: [
        {
          id: 'step_1_boolean',
          operation: (snapshot: VectorDocumentSnapshot) => {
            const targetSet = new Set([maskShapeId, ...targetShapeIds]);
            const activeNodes = snapshot.nodes.filter(
              (n: any) => targetSet.has(n.id) && !n.locked
            );
            if (activeNodes.length < 2) return snapshot;
            const topoRes = VectorBooleanTopologyEngine.executeBooleanTopology(
              activeNodes,
              topologyType
            );
            if (!topoRes.success || !topoRes.resultNode) return snapshot;
            const removedSet = new Set(topoRes.affectedSourceIds);
            const remainingNodes = snapshot.nodes.filter((n: any) => !removedSet.has(n.id));
            const nextNodes = [...remainingNodes, topoRes.resultNode];
            return { nodes: nextNodes, selectedIds: [topoRes.resultNode.id], constraintEdges: snapshot.constraintEdges || [] };
          }
        },
        {
          id: 'step_2_mask',
          operation: (snapshot: VectorDocumentSnapshot) => {
            const resultNode = snapshot.nodes.find(
              (n: any) => n.id === (snapshot.selectedIds[0] || '')
            );
            if (!resultNode) return snapshot;
            const targetSet = new Set([resultNode.id]);
            const activeNodes = snapshot.nodes.filter(
              (n: any) => targetSet.has(n.id) && !n.locked
            );
            if (activeNodes.length === 0) return snapshot;
            const maskRes = VectorCompoundTopologyMaskEngine.applyCompoundMaskTopology(
              activeNodes[0],
              'union'
            );
            if (!maskRes.success) return snapshot;
            const removedSet = new Set(maskRes.affectedSourceIds || []);
            const remainingNodes = snapshot.nodes.filter((n: any) => !removedSet.has(n.id));
            const nextNodes = [...remainingNodes, maskRes.maskedNode!];
            return { nodes: nextNodes, selectedIds: [maskRes.maskedNode!.id], constraintEdges: snapshot.constraintEdges || [] };
          }
        }
      ]
    };

    return VectorDeterministicWorkflowEngine.executeWorkflow(state, workflow);
  }

  /**
   * Defines and executes a deterministic workflow for responsive transformations.
   * This guarantees that constraints are applied in a single transactional step.
   */
  public static executeCrossSubsystemResponsiveTransformTransaction(
    state: VectorWorkspaceState,
    commandPayload: VectorCommandPayload
  ): WorkflowExecutionResult {
    const workflow: VectorWorkflowDefinition = {
      workflowId: `responsive_transform_${Date.now()}`,
      description: 'Cross-Subsystem Responsive Transform Transaction',
      steps: [
        {
          id: 'step_1_transform_and_constrain',
          operation: (snapshot: VectorDocumentSnapshot) => {
            const res = VectorEditingCommandSystem.executeCommand(snapshot, commandPayload);
            return res.success ? res.snapshot : snapshot;
          }
        }
      ]
    };
    return VectorDeterministicWorkflowEngine.executeWorkflow(state, workflow);
  }

  /**
   * Executes a high-level deterministic constraint graph resolution transaction.
   * Creates graph, detects cycles, resolves affected nodes, validates output snapshot,
   * and commits exactly 1 transaction on success or 0 transactions on failure/error.
   */
  public static executeConstraintGraphResolutionTransaction(
    state: VectorWorkspaceState,
    explicitMutations: Map<string, BoundingBox> = new Map()
  ): WorkflowExecutionResult {
    const workflow: VectorWorkflowDefinition = {
      workflowId: `constraint_graph_resolution_${Date.now()}`,
      description: 'Cross-Subsystem Constraint Graph Resolution Transaction',
      steps: [
        {
          id: 'step_1_resolve_constraint_graph',
          operation: (snapshot: VectorDocumentSnapshot) => {
            const graph = VectorConstraintGraphEngine.buildConstraintGraph(snapshot);
            const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snapshot, explicitMutations);
            if (!res.success || !res.nodes) {
              return snapshot; // Pre-flight failure, rollback to original snapshot
            }
            return {
              ...snapshot,
              nodes: res.nodes
            };
          }
        }
      ]
    };
    return VectorDeterministicWorkflowEngine.executeWorkflow(state, workflow);
  }

  /**
   * Executes a high-level constraint solver transaction.
   * Runs iterative fixed-point solver, validates stability, and commits 1 history entry on success or 0 entries on error/failure.
   */
  public static executeConstraintSolveTransaction(
    state: VectorWorkspaceState,
    changedNodeIds: string[],
    explicitMutations: Map<string, BoundingBox> = new Map(),
    options: SolverOptions = {}
  ): WorkflowExecutionResult {
    const workflow: VectorWorkflowDefinition = {
      workflowId: `constraint_solve_${Date.now()}`,
      description: 'Cross-Subsystem Constraint Solver Transaction',
      steps: [
        {
          id: 'step_1_solve_constraints',
          operation: (snapshot: VectorDocumentSnapshot) => {
            const res = VectorConstraintSolverEngine.resolveIncremental(snapshot, changedNodeIds, explicitMutations, options);
            if (!res.success || !res.snapshot) {
              return snapshot; // Failure or instability, rollback to baseline snapshot
            }
            return res.snapshot;
          }
        }
      ]
    };
    return VectorDeterministicWorkflowEngine.executeWorkflow(state, workflow);
  }

  /**
   * Undoes the last transaction in the history stack.
   */
  public static undoWorkflow(state: VectorWorkspaceState): VectorWorkspaceState {
    if (!state || !state.historyStack) return state;
    const res = state.historyStack.undo();
    if (!res) return state;
    return {
      ...state,
      snapshot: res.state,
      historyStack: res.stack
    };
  }

  /**
   * Redoes the last undone transaction in the history stack.
   */
  public static redoWorkflow(state: VectorWorkspaceState): VectorWorkspaceState {
    if (!state || !state.historyStack) return state;
    const res = state.historyStack.redo();
    if (!res) return state;
    return {
      ...state,
      snapshot: res.state,
      historyStack: res.stack
    };
  }

  /**
   * Helper function defining 8-step conflict resolution workflow:
   * ANALYZE → DETECT → CLASSIFY → PRIORITIZE → RESOLVE → SOLVE → VALIDATE → COMMIT
   */
  public static resolveConstraintConflictsWorkflow(
    strategy: ConflictResolutionStrategy = 'remove_conflicting_constraint'
  ): VectorWorkflowDefinition {
    return {
      workflowId: `conflict_resolution_${Date.now()}`,
      description: '8-Step Vector Constraint Conflict Resolution Workflow',
      steps: [
        {
          id: 'step_1_analyze_and_detect',
          operation: (snapshot: VectorDocumentSnapshot) => {
            const report = VectorConstraintConflictResolutionEngine.buildConflictReport(snapshot);
            if (!report.hasConflicts) return snapshot;
            return snapshot;
          }
        },
        {
          id: 'step_2_resolve_and_solve',
          operation: (snapshot: VectorDocumentSnapshot) => {
            const res = VectorConstraintConflictResolutionEngine.resolveConflictsWithSolver(snapshot, strategy);
            if (!res.success || !res.snapshot) {
              return new Error(res.error || 'Constraint conflict resolution failed');
            }
            return res.snapshot;
          }
        }
      ]
    };
  }

  /**
   * Executes a high-level constraint conflict resolution transaction.
   * Commits 1 history entry on successful resolution or 0 history entries on failure/rollback.
   */
  public static executeConstraintConflictResolutionTransaction(
    state: VectorWorkspaceState,
    strategy: ConflictResolutionStrategy = 'remove_conflicting_constraint'
  ): WorkflowExecutionResult {
    const workflow = this.resolveConstraintConflictsWorkflow(strategy);
    return VectorDeterministicWorkflowEngine.executeWorkflow(state, workflow);
  }

  /**
   * Plans a vector constraint transaction predictively without mutating SSOT or HistoryStack.
   */
  public static planConstraintTransaction(
    state: VectorWorkspaceState,
    operations: ReadonlyArray<PlannedOperation>,
    strategy: ConflictResolutionStrategy = 'remove_conflicting_constraint'
  ): VectorConstraintTransactionPlan {
    const snapshot = state?.snapshot || { nodes: [], selectedIds: [], constraintEdges: [] };
    return VectorConstraintTransactionPlannerEngine.generatePlan(snapshot, operations, strategy);
  }

  /**
   * Generates an optimistic preview of a transaction plan without committing or mutating workspace state.
   */
  public static previewConstraintTransaction(
    state: VectorWorkspaceState,
    plan: VectorConstraintTransactionPlan
  ): VectorDocumentSnapshot {
    if (!plan) return state?.snapshot || { nodes: [], selectedIds: [], constraintEdges: [] };
    return VectorConstraintTransactionPlannerEngine.previewPlan(plan);
  }

  /**
   * Executes a planned constraint transaction through deterministic workflow engine.
   * Commits exactly 1 history stack transaction on success, or 0 on failure/rollback.
   */
  public static executePlannedConstraintTransaction(
    state: VectorWorkspaceState,
    plan: VectorConstraintTransactionPlan
  ): WorkflowExecutionResult {
    if (!state || !plan) {
      return {
        success: false,
        state: state || { snapshot: { nodes: [], selectedIds: [], constraintEdges: [] }, historyStack: {} as any },
        error: 'Invalid state or transaction plan'
      };
    }

    const validation = VectorConstraintTransactionPlannerEngine.validatePlan(plan, state.snapshot);
    if (!validation.isValid) {
      return {
        success: false,
        state,
        error: `Plan validation failed: ${validation.errors.join('; ')}`
      };
    }

    const workflow: VectorWorkflowDefinition = {
      workflowId: `planned_tx_${plan.planId}`,
      description: `Planned Vector Constraint Transaction (${plan.orderedOperations.length} ops)`,
      steps: [
        {
          id: 'step_1_validate_preflight',
          operation: (snapshot: VectorDocumentSnapshot) => {
            if (!plan.validationPlan.preFlightPassed) {
              return new Error(plan.validationPlan.validationError || 'Pre-flight validation failed');
            }
            return snapshot;
          }
        },
        {
          id: 'step_2_apply_and_solve_plan',
          operation: (snapshot: VectorDocumentSnapshot) => {
            const previewSnapshot = VectorConstraintTransactionPlannerEngine.previewPlan(plan);
            if (!previewSnapshot || !Array.isArray(previewSnapshot.nodes)) {
              return new Error('Execution step failed to generate valid preview snapshot');
            }
            return previewSnapshot;
          }
        }
      ]
    };

    return VectorDeterministicWorkflowEngine.executeWorkflow(state, workflow);
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
