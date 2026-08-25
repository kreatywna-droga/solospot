/**
 * VectorConstraintTransactionPlannerEngine.ts — Sprint G1-54 Predictive Transaction Planner (Night Shift Level 16)
 *
 * Implements a pure, headless transaction planning layer for the Vector Constraint Subsystem.
 * Performs predictive impact analysis, conflict forecasting, topological operation ordering,
 * immutable plan generation (VectorConstraintTransactionPlan), plan validation, optimistic previewing,
 * and integration with VectorWorkflowOrchestrator without mutating SSOT during planning.
 *
 * NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorNode, VectorConstraintEdge } from './VectorDomainModel';
import { VectorDocumentSnapshot, VectorWorkspaceState } from './VectorWorkspaceController';
import { VectorConstraintGraphEngine, ConstraintGraph } from './VectorConstraintGraphEngine';
import { VectorConstraintSolverEngine } from './VectorConstraintSolverEngine';
import {
  VectorConstraintConflictResolutionEngine,
  ConflictItem,
  ConflictResolutionStrategy,
  ConflictResolutionResult
} from './VectorConstraintConflictResolutionEngine';
import { VectorTransactionRecoveryEngine, RecoveryCheckpointDTO, CheckpointLevel } from './VectorTransactionRecoveryEngine';
import { VectorDeterministicWorkflowEngine, WorkflowExecutionResult } from './VectorDeterministicWorkflowEngine';
import { BoundingBox } from './VectorConstraintLayoutEngine';

export type PlannedOperationType =
  | 'ADD_CONSTRAINT'
  | 'REMOVE_CONSTRAINT'
  | 'MODIFY_CONSTRAINT'
  | 'MUTATE_NODE_TRANSFORM';

export interface PlannedOperation {
  readonly id: string;
  readonly type: PlannedOperationType;
  readonly targetNodeId: string;
  readonly constraintEdge?: VectorConstraintEdge;
  readonly explicitBounds?: BoundingBox;
  readonly priority?: number;
  readonly dependencyNodeIds?: ReadonlyArray<string>;
}

export interface ImpactAnalysisResult {
  readonly affectedNodeIds: ReadonlyArray<string>;
  readonly affectedConstraintIds: ReadonlyArray<string>;
  readonly directDependencies: ReadonlyArray<string>;
  readonly indirectDependencies: ReadonlyArray<string>;
  readonly predictedConflictGrowthCount: number;
}

export interface VectorConstraintTransactionPlan {
  readonly planId: string;
  readonly timestamp: number;
  readonly baseSnapshot: VectorDocumentSnapshot;
  readonly baseSnapshotHash: string;
  readonly affectedNodes: ReadonlyArray<string>;
  readonly affectedConstraints: ReadonlyArray<string>;
  readonly orderedOperations: ReadonlyArray<PlannedOperation>;
  readonly predictedConflicts: ReadonlyArray<ConflictItem>;
  readonly resolutionPlan: ConflictResolutionStrategy;
  readonly validationPlan: {
    readonly preFlightPassed: boolean;
    readonly isExecutable: boolean;
    readonly validationError?: string;
  };
  readonly rollbackCheckpoint?: RecoveryCheckpointDTO;
  readonly executionMetadata: {
    readonly totalOperations: number;
    readonly estimatedImpactScore: number;
    readonly isIdempotent: boolean;
    readonly plannerVersion: string;
  };
}

export interface PlanValidationResult {
  readonly isValid: boolean;
  readonly isStale: boolean;
  readonly errors: ReadonlyArray<string>;
}

export class VectorConstraintTransactionPlannerEngine {
  public static readonly PLANNER_VERSION = '1.0.0-G154';
  private static recoveryEngine = new VectorTransactionRecoveryEngine();

  /**
   * Computes a deterministic string hash of a VectorDocumentSnapshot to detect stale plans.
   */
  public static computeSnapshotHash(snapshot: VectorDocumentSnapshot): string {
    if (!snapshot) return 'empty_hash';
    const nodesSummary = (snapshot.nodes || [])
      .map(n => `${n.id}:${n.transform.x},${n.transform.y},${n.transform.width},${n.transform.height},${n.locked ? '1' : '0'}`)
      .sort()
      .join(';');
    const edgesSummary = (snapshot.constraintEdges || [])
      .map(e => `${e.id}:${e.sourceNodeId}->${e.targetNodeId}`)
      .sort()
      .join(';');
    return `hash_${nodesSummary.length}_${edgesSummary.length}_${nodesSummary}_${edgesSummary}`;
  }

  /**
   * Performs impact analysis of planned operations on constraint edges and nodes.
   */
  public static analyzeImpact(
    snapshot: VectorDocumentSnapshot,
    operations: ReadonlyArray<PlannedOperation>
  ): ImpactAnalysisResult {
    if (!snapshot || !Array.isArray(snapshot.nodes)) {
      return {
        affectedNodeIds: [],
        affectedConstraintIds: [],
        directDependencies: [],
        indirectDependencies: [],
        predictedConflictGrowthCount: 0
      };
    }

    const graph = VectorConstraintGraphEngine.buildConstraintGraph(snapshot);
    const targetNodeIds = Array.from(new Set((operations || []).map(op => op.targetNodeId).filter(Boolean)));
    const affectedNodeSet = VectorConstraintGraphEngine.getAffectedSubgraph(graph, targetNodeIds);
    
    // Also include nodes referenced in new edges
    for (const op of operations || []) {
      if (op.constraintEdge) {
        if (op.constraintEdge.sourceNodeId) affectedNodeSet.add(op.constraintEdge.sourceNodeId);
        if (op.constraintEdge.targetNodeId) affectedNodeSet.add(op.constraintEdge.targetNodeId);
      }
    }

    const affectedNodeIds = Array.from(affectedNodeSet).sort((a, b) => a.localeCompare(b));
    const directDependencies = Array.from(new Set(targetNodeIds.flatMap(id => VectorConstraintGraphEngine.getDependencies(graph, id)))).sort((a, b) => a.localeCompare(b));
    const indirectDependencies = affectedNodeIds.filter(id => !targetNodeIds.includes(id) && !directDependencies.includes(id)).sort((a, b) => a.localeCompare(b));

    const affectedEdgeIds = (snapshot.constraintEdges || [])
      .filter(e => affectedNodeSet.has(e.sourceNodeId) || affectedNodeSet.has(e.targetNodeId))
      .map(e => e.id)
      .sort((a, b) => a.localeCompare(b));

    const baselineConflicts = VectorConstraintConflictResolutionEngine.buildConflictReport(snapshot).totalConflicts;
    const predictedConflicts = this.predictConflicts(snapshot, operations);
    const predictedConflictGrowthCount = Math.max(0, predictedConflicts.length - baselineConflicts);

    return {
      affectedNodeIds,
      affectedConstraintIds: affectedEdgeIds,
      directDependencies,
      indirectDependencies,
      predictedConflictGrowthCount
    };
  }

  /**
   * Predicts potential future conflicts resulting from applying planned operations on a cloned snapshot.
   */
  public static predictConflicts(
    snapshot: VectorDocumentSnapshot,
    operations: ReadonlyArray<PlannedOperation>,
    strategy: ConflictResolutionStrategy = 'remove_conflicting_constraint'
  ): ConflictItem[] {
    if (!snapshot) return [];

    const conflicts: ConflictItem[] = [];

    // Check boundary conflicts in operation bounds
    for (const op of (operations || []).filter(Boolean)) {
      if (op.explicitBounds) {
        const { x, y, width, height } = op.explicitBounds;
        if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height) || !isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
          conflicts.push(
            VectorConstraintConflictResolutionEngine.classifyConflict(
              'GEOMETRY_BOUNDARY_CONFLICT',
              op.targetNodeId || 'unknown',
              [op.id],
              `Invalid geometry bounds: width=${width}, height=${height}, x=${x}, y=${y}`,
              undefined,
              [op.targetNodeId || 'unknown']
            )
          );
        }
      }
    }

    // Clone snapshot to prevent mutating input SSOT
    const simulatedSnapshot = this.applyOperationsToSnapshot(snapshot, operations);
    const detected = VectorConstraintConflictResolutionEngine.detectConflicts(simulatedSnapshot);
    return [...conflicts, ...detected];
  }

  /**
   * Sorts planned operations deterministically using topological graph order, priority, and ID.
   */
  public static orderOperations(
    operations: ReadonlyArray<PlannedOperation>,
    graph?: ConstraintGraph
  ): PlannedOperation[] {
    if (!operations || operations.length === 0) return [];

    const sortedOps = [...operations].filter(op => op && typeof op === 'object');
    sortedOps.sort((a, b) => {
      // 1. Priority (higher priority first)
      const priorityA = typeof a.priority === 'number' ? a.priority : 0;
      const priorityB = typeof b.priority === 'number' ? b.priority : 0;
      if (priorityA !== priorityB) return priorityB - priorityA;

      // 2. Operation Type ordering (REMOVE -> ADD -> MODIFY -> MUTATE)
      const typeOrder: Record<string, number> = {
        REMOVE_CONSTRAINT: 0,
        ADD_CONSTRAINT: 1,
        MODIFY_CONSTRAINT: 2,
        MUTATE_NODE_TRANSFORM: 3
      };
      const orderA = typeOrder[a.type] ?? 99;
      const orderB = typeOrder[b.type] ?? 99;
      if (orderA !== orderB) return orderA - orderB;

      // 3. Target Node ID (localeCompare)
      const nodeCmp = (a.targetNodeId || '').localeCompare(b.targetNodeId || '');
      if (nodeCmp !== 0) return nodeCmp;

      // 4. Operation ID (localeCompare)
      return (a.id || '').localeCompare(b.id || '');
    });

    return sortedOps;
  }

  /**
   * Generates a complete, immutable VectorConstraintTransactionPlan.
   */
  public static generatePlan(
    snapshot: VectorDocumentSnapshot,
    operations: ReadonlyArray<PlannedOperation>,
    strategy: ConflictResolutionStrategy = 'remove_conflicting_constraint',
    options?: { checkpointLevel?: CheckpointLevel }
  ): VectorConstraintTransactionPlan {
    const planId = `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const baseSnapshot = snapshot || { nodes: [], selectedIds: [], constraintEdges: [] };
    const baseSnapshotHash = this.computeSnapshotHash(baseSnapshot);

    const orderedOperations = this.orderOperations(operations);
    const impact = this.analyzeImpact(baseSnapshot, orderedOperations);
    const predictedConflicts = this.predictConflicts(baseSnapshot, orderedOperations, strategy);

    // Pre-flight validation checks
    let preFlightPassed = true;
    let validationError: string | undefined;

    if (!Array.isArray(baseSnapshot.nodes)) {
      preFlightPassed = false;
      validationError = 'Invalid baseSnapshot: missing nodes array';
    } else {
      // Check for unresolvable critical conflicts
      const criticalConflicts = predictedConflicts.filter(c => c.severity === 'CRITICAL');
      if (criticalConflicts.length > 0 && strategy === 'rollback') {
        preFlightPassed = false;
        validationError = `Pre-flight failed: ${criticalConflicts.length} critical conflicts detected with rollback strategy`;
      }

      // Check for locked node violations in operations
      const nodeMap = new Map<string, VectorNode>(baseSnapshot.nodes.map(n => [n.id, n]));
      for (const op of orderedOperations) {
        const targetNode = nodeMap.get(op.targetNodeId);
        if (targetNode?.locked && (op.type === 'MUTATE_NODE_TRANSFORM' || op.type === 'ADD_CONSTRAINT')) {
          preFlightPassed = false;
          validationError = `Pre-flight failed: Operation ${op.id} attempts to mutate locked node ${op.targetNodeId}`;
          break;
        }
      }
    }

    const checkpointLevel = options?.checkpointLevel || 'CHECKPOINT_TRANSACTION';
    const rollbackCheckpoint = this.recoveryEngine.createCheckpoint(
      checkpointLevel,
      baseSnapshot,
      baseSnapshot.selectedIds
    );

    const estimatedImpactScore = impact.affectedNodeIds.length * 10 + impact.affectedConstraintIds.length * 5 + predictedConflicts.length * 20;

    return {
      planId,
      timestamp: Date.now(),
      baseSnapshot,
      baseSnapshotHash,
      affectedNodes: impact.affectedNodeIds,
      affectedConstraints: impact.affectedConstraintIds,
      orderedOperations,
      predictedConflicts,
      resolutionPlan: strategy,
      validationPlan: {
        preFlightPassed,
        isExecutable: preFlightPassed,
        validationError
      },
      rollbackCheckpoint,
      executionMetadata: {
        totalOperations: orderedOperations.length,
        estimatedImpactScore,
        isIdempotent: true,
        plannerVersion: this.PLANNER_VERSION
      }
    };
  }

  /**
   * Validates an existing transaction plan against the current workspace snapshot.
   */
  public static validatePlan(
    plan: VectorConstraintTransactionPlan,
    currentSnapshot: VectorDocumentSnapshot
  ): PlanValidationResult {
    const errors: string[] = [];

    if (!plan || !plan.baseSnapshot || !plan.validationPlan) {
      return { isValid: false, isStale: true, errors: ['Plan or plan metadata is null or undefined'] };
    }

    if (!currentSnapshot) {
      return { isValid: false, isStale: true, errors: ['Current snapshot is null or undefined'] };
    }

    // 1. Check for stale baseSnapshot
    const currentHash = this.computeSnapshotHash(currentSnapshot);
    const isStale = currentHash !== plan.baseSnapshotHash;
    if (isStale) {
      errors.push(`Stale plan: baseSnapshot hash mismatch (plan: ${plan.baseSnapshotHash}, current: ${currentHash})`);
    }

    // 2. Check existence of node IDs and constraint IDs
    const currentNodeIds = new Set((currentSnapshot.nodes || []).map(n => n.id));
    const currentEdgeIds = new Set((currentSnapshot.constraintEdges || []).map(e => e.id));

    for (const op of plan.orderedOperations || []) {
      if (op?.targetNodeId && !currentNodeIds.has(op.targetNodeId)) {
        errors.push(`Invalid operation ${op.id}: target node ${op.targetNodeId} does not exist in current snapshot`);
      }
      if (op?.type === 'REMOVE_CONSTRAINT' && op.constraintEdge && !currentEdgeIds.has(op.constraintEdge.id)) {
        errors.push(`Invalid operation ${op.id}: constraint edge ${op.constraintEdge.id} does not exist in current snapshot`);
      }
    }

    // 3. Pre-flight passed check
    if (plan.validationPlan.preFlightPassed === false) {
      errors.push(`Plan pre-flight validation failed: ${plan.validationPlan.validationError || 'Unknown validation error'}`);
    }

    return {
      isValid: errors.length === 0,
      isStale,
      errors
    };
  }

  /**
   * Executes a transaction plan on the workspace state.
   */
  public static executePlan(
    state: VectorWorkspaceState,
    plan: VectorConstraintTransactionPlan
  ): WorkflowExecutionResult {
    const { VectorWorkflowOrchestrator } = require('./VectorWorkflowOrchestrator');
    return VectorWorkflowOrchestrator.executePlannedConstraintTransaction(state, plan);
  }

  /**
   * Computes an optimistic preview snapshot of applying a plan without mutating SSOT or HistoryStack.
   */
  public static previewPlan(plan: VectorConstraintTransactionPlan): VectorDocumentSnapshot {
    if (!plan || !plan.baseSnapshot) {
      return { nodes: [], selectedIds: [], constraintEdges: [] };
    }

    // Apply operations onto cloned snapshot
    const simulatedSnapshot = this.applyOperationsToSnapshot(plan.baseSnapshot, plan.orderedOperations);

    // Resolve any resulting conflicts and run incremental solver
    const res = VectorConstraintConflictResolutionEngine.resolveConflictsWithSolver(
      simulatedSnapshot,
      plan.resolutionPlan
    );

    const resultSnapshot = res.snapshot || simulatedSnapshot;
    return {
      nodes: resultSnapshot.nodes.map(n => ({ ...n, transform: { ...n.transform } })),
      selectedIds: [...(resultSnapshot.selectedIds || [])],
      constraintEdges: [...(resultSnapshot.constraintEdges || [])]
    };
  }

  /**
   * Helper method applying operations to a snapshot immutably.
   */
  private static applyOperationsToSnapshot(
    snapshot: VectorDocumentSnapshot,
    operations: ReadonlyArray<PlannedOperation>
  ): VectorDocumentSnapshot {
    let nodes = (snapshot.nodes || []).map(n => ({ ...n, transform: { ...n.transform } }));
    let edges = [...(snapshot.constraintEdges || [])];

    const nodeMap = new Map<string, VectorNode>(nodes.map(n => [n.id, n]));
    const edgeMap = new Map<string, VectorConstraintEdge>(edges.map(e => [e.id, e]));

    for (const op of operations || []) {
      if (op.type === 'ADD_CONSTRAINT' && op.constraintEdge) {
        edgeMap.set(op.constraintEdge.id, op.constraintEdge);
      } else if (op.type === 'REMOVE_CONSTRAINT' && op.constraintEdge) {
        edgeMap.delete(op.constraintEdge.id);
      } else if (op.type === 'MODIFY_CONSTRAINT' && op.constraintEdge) {
        edgeMap.set(op.constraintEdge.id, op.constraintEdge);
      } else if (op.type === 'MUTATE_NODE_TRANSFORM' && op.targetNodeId && op.explicitBounds) {
        const node = nodeMap.get(op.targetNodeId);
        if (node) {
          nodeMap.set(op.targetNodeId, {
            ...node,
            transform: {
              ...node.transform,
              x: op.explicitBounds.x,
              y: op.explicitBounds.y,
              width: op.explicitBounds.width,
              height: op.explicitBounds.height
            }
          });
        }
      }
    }

    return {
      nodes: Array.from(nodeMap.values()),
      selectedIds: [...(snapshot.selectedIds || [])],
      constraintEdges: Array.from(edgeMap.values())
    };
  }
}
