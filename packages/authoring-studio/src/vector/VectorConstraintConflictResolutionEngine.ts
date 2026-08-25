/**
 * VectorConstraintConflictResolutionEngine.ts — Sprint G1-53 (Night Shift Level 15)
 *
 * Implements a deterministic conflict detection, classification, prioritization, and resolution engine.
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorNode, VectorConstraintEdge } from './VectorDomainModel';
import { VectorDocumentSnapshot } from './VectorWorkspaceController';
import { VectorConstraintGraphEngine } from './VectorConstraintGraphEngine';
import { VectorConstraintSolverEngine } from './VectorConstraintSolverEngine';

export type ConflictType =
  | 'DIRECT_CONFLICT'
  | 'CYCLE_CONFLICT'
  | 'OVER_CONSTRAINED'
  | 'UNSATISFIABLE'
  | 'INVALID_REFERENCE'
  | 'LOCKED_NODE_CONFLICT'
  | 'GEOMETRY_BOUNDARY_CONFLICT';

export type ConflictSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ConflictResolutionStrategy =
  | 'preserve_locked'
  | 'preserve_priority'
  | 'preserve_existing'
  | 'remove_conflicting_constraint'
  | 'rollback';

export interface ConflictItem {
  readonly id: string;
  readonly type: ConflictType;
  readonly severity: ConflictSeverity;
  readonly sourceNodeId: string;
  readonly targetNodeId?: string;
  readonly conflictingEdgeIds: string[];
  readonly affectedNodeIds: string[];
  readonly reason: string;
  readonly recommendedStrategy: ConflictResolutionStrategy;
}

export interface ConflictReport {
  readonly hasConflicts: boolean;
  readonly totalConflicts: number;
  readonly conflicts: ConflictItem[];
  readonly criticalCount: number;
}

export interface ConflictResolutionResult {
  readonly success: boolean;
  readonly snapshot?: VectorDocumentSnapshot;
  readonly resolvedConflicts: ConflictItem[];
  readonly unresolvedConflicts: ConflictItem[];
  readonly removedEdgeIds: string[];
  readonly strategyUsed: ConflictResolutionStrategy;
  readonly error?: string;
}

export class VectorConstraintConflictResolutionEngine {
  /**
   * Classifies a detected conflict into a structured ConflictItem DTO.
   */
  public static classifyConflict(
    type: ConflictType,
    sourceNodeId: string,
    conflictingEdgeIds: string[],
    reason: string,
    targetNodeId?: string,
    affectedNodeIds: string[] = [sourceNodeId]
  ): ConflictItem {
    let severity: ConflictSeverity = 'MEDIUM';
    let recommendedStrategy: ConflictResolutionStrategy = 'remove_conflicting_constraint';

    switch (type) {
      case 'LOCKED_NODE_CONFLICT':
        severity = 'CRITICAL';
        recommendedStrategy = 'preserve_locked';
        break;
      case 'CYCLE_CONFLICT':
        severity = 'CRITICAL';
        recommendedStrategy = 'remove_conflicting_constraint';
        break;
      case 'INVALID_REFERENCE':
        severity = 'HIGH';
        recommendedStrategy = 'remove_conflicting_constraint';
        break;
      case 'DIRECT_CONFLICT':
      case 'OVER_CONSTRAINED':
        severity = 'HIGH';
        recommendedStrategy = 'preserve_priority';
        break;
      case 'UNSATISFIABLE':
      case 'GEOMETRY_BOUNDARY_CONFLICT':
        severity = 'MEDIUM';
        recommendedStrategy = 'preserve_existing';
        break;
    }

    return {
      id: `conflict_${type}_${sourceNodeId}_${conflictingEdgeIds.join('_')}`,
      type,
      severity,
      sourceNodeId,
      targetNodeId,
      conflictingEdgeIds,
      affectedNodeIds,
      reason,
      recommendedStrategy
    };
  }

  /**
   * Analyzes snapshot and detects all constraint conflicts deterministically.
   */
  public static detectConflicts(snapshot: VectorDocumentSnapshot): ConflictItem[] {
    const conflicts: ConflictItem[] = [];
    if (!snapshot) return conflicts;

    const nodes = Array.isArray(snapshot.nodes) ? snapshot.nodes : [];
    const constraintEdges = Array.isArray(snapshot.constraintEdges) ? snapshot.constraintEdges : [];
    const nodeMap = new Map<string, VectorNode>(nodes.filter(n => n && n.id).map(n => [n.id, n]));
    const sortedEdges = [...constraintEdges].filter(e => e && typeof e === 'object').sort((a, b) => (a.id || '').localeCompare(b.id || ''));

    // 1. Detect Cycle Conflicts
    const graph = VectorConstraintGraphEngine.buildConstraintGraph({
      nodes,
      selectedIds: snapshot.selectedIds || [],
      constraintEdges: sortedEdges
    });
    const cycleRes = VectorConstraintGraphEngine.detectCycle(graph);
    if (cycleRes.hasCycle && cycleRes.error) {
      const cycleEdgeIds = sortedEdges
        .filter(e => cycleRes.error!.affectedNodeIds.includes(e.sourceNodeId) || cycleRes.error!.affectedNodeIds.includes(e.targetNodeId))
        .map(e => e.id);
      conflicts.push(
        this.classifyConflict(
          'CYCLE_CONFLICT',
          cycleRes.error.sourceNodeId,
          cycleEdgeIds,
          cycleRes.error.reason,
          undefined,
          cycleRes.error.affectedNodeIds
        )
      );
    }

    // 2. Detect Invalid Reference Conflicts
    for (const edge of sortedEdges) {
      if (!edge.sourceNodeId || !nodeMap.has(edge.sourceNodeId)) {
        conflicts.push(
          this.classifyConflict(
            'INVALID_REFERENCE',
            edge.sourceNodeId || 'unknown',
            [edge.id],
            `Constraint edge ${edge.id} references missing source node ${edge.sourceNodeId}`,
            edge.targetNodeId,
            [edge.sourceNodeId || 'unknown']
          )
        );
      }
      if (!edge.targetNodeId || !nodeMap.has(edge.targetNodeId)) {
        conflicts.push(
          this.classifyConflict(
            'INVALID_REFERENCE',
            edge.sourceNodeId || 'unknown',
            [edge.id],
            `Constraint edge ${edge.id} references missing target node ${edge.targetNodeId}`,
            edge.targetNodeId,
            [edge.sourceNodeId || 'unknown']
          )
        );
      }
    }

    // 3. Detect Locked Node Conflicts
    for (const edge of sortedEdges) {
      const srcNode = nodeMap.get(edge.sourceNodeId);
      if (srcNode?.locked) {
        conflicts.push(
          this.classifyConflict(
            'LOCKED_NODE_CONFLICT',
            edge.sourceNodeId,
            [edge.id],
            `Locked node ${edge.sourceNodeId} cannot have active dependent constraint edge ${edge.id}`,
            edge.targetNodeId,
            [edge.sourceNodeId]
          )
        );
      }
    }

    // 4. Detect Direct Conflicts & Over-Constrained Nodes (multiple edges for same axis on same node)
    const edgesBySourceAndAxis = new Map<string, { h: VectorConstraintEdge[]; v: VectorConstraintEdge[] }>();
    for (const edge of sortedEdges) {
      if (!edgesBySourceAndAxis.has(edge.sourceNodeId)) {
        edgesBySourceAndAxis.set(edge.sourceNodeId, { h: [], v: [] });
      }
      const entry = edgesBySourceAndAxis.get(edge.sourceNodeId)!;
      if (edge.horizontal) entry.h.push(edge);
      if (edge.vertical) entry.v.push(edge);
    }

    for (const [nodeId, axes] of edgesBySourceAndAxis.entries()) {
      if (axes.h.length > 1) {
        conflicts.push(
          this.classifyConflict(
            'DIRECT_CONFLICT',
            nodeId,
            axes.h.map(e => e.id),
            `Node ${nodeId} has ${axes.h.length} conflicting horizontal constraint edges`,
            axes.h[0].targetNodeId,
            [nodeId]
          )
        );
      }
      if (axes.v.length > 1) {
        conflicts.push(
          this.classifyConflict(
            'DIRECT_CONFLICT',
            nodeId,
            axes.v.map(e => e.id),
            `Node ${nodeId} has ${axes.v.length} conflicting vertical constraint edges`,
            axes.v[0].targetNodeId,
            [nodeId]
          )
        );
      }
    }

    // 5. Detect Geometry Boundary Conflicts (NaN, Infinity, negative dimensions)
    for (const node of nodes) {
      if (node && node.transform) {
        const valErr = VectorConstraintGraphEngine.validateBounds(node.id, node.transform);
        if (valErr) {
          conflicts.push(
            this.classifyConflict(
              'GEOMETRY_BOUNDARY_CONFLICT',
              node.id,
              [],
              valErr.reason,
              undefined,
              [node.id]
            )
          );
        }
      }
    }

    return conflicts.sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Generates a complete ConflictReport for a snapshot.
   */
  public static buildConflictReport(snapshot: VectorDocumentSnapshot): ConflictReport {
    const conflicts = this.detectConflicts(snapshot);
    const criticalCount = conflicts.filter(c => c.severity === 'CRITICAL').length;
    return {
      hasConflicts: conflicts.length > 0,
      totalConflicts: conflicts.length,
      conflicts,
      criticalCount
    };
  }

  /**
   * Resolves conflicts deterministically using the specified resolution strategy.
   */
  public static resolveConflicts(
    snapshot: VectorDocumentSnapshot,
    strategy: ConflictResolutionStrategy = 'remove_conflicting_constraint'
  ): ConflictResolutionResult {
    const strat = strategy || 'remove_conflicting_constraint';
    const report = this.buildConflictReport(snapshot);

    if (!report.hasConflicts) {
      return {
        success: true,
        snapshot: snapshot || { nodes: [], selectedIds: [], constraintEdges: [] },
        resolvedConflicts: [],
        unresolvedConflicts: [],
        removedEdgeIds: [],
        strategyUsed: strat
      };
    }

    if (strat === 'rollback') {
      return {
        success: false,
        snapshot: snapshot || { nodes: [], selectedIds: [], constraintEdges: [] },
        resolvedConflicts: [],
        unresolvedConflicts: report.conflicts,
        removedEdgeIds: [],
        strategyUsed: 'rollback',
        error: 'Conflict resolution aborted due to rollback strategy'
      };
    }

    const removedEdgeIds = new Set<string>();
    const resolved: ConflictItem[] = [];
    const unresolved: ConflictItem[] = [];

    for (const conflict of report.conflicts) {
      if (strat === 'preserve_locked' && conflict.type === 'LOCKED_NODE_CONFLICT') {
        conflict.conflictingEdgeIds.forEach(id => removedEdgeIds.add(id));
        resolved.push(conflict);
      } else if (strat === 'preserve_priority' || strat === 'preserve_existing') {
        if (conflict.conflictingEdgeIds.length > 1) {
          const sorted = [...conflict.conflictingEdgeIds].sort((a, b) => a.localeCompare(b));
          sorted.slice(1).forEach(id => removedEdgeIds.add(id));
          resolved.push(conflict);
        } else {
          conflict.conflictingEdgeIds.forEach(id => removedEdgeIds.add(id));
          resolved.push(conflict);
        }
      } else if (strat === 'remove_conflicting_constraint') {
        conflict.conflictingEdgeIds.forEach(id => removedEdgeIds.add(id));
        resolved.push(conflict);
      } else {
        unresolved.push(conflict);
      }
    }

    const edges = Array.isArray(snapshot?.constraintEdges) ? snapshot.constraintEdges : [];
    const nextEdges = edges.filter(e => e && !removedEdgeIds.has(e.id));
    const nextSnapshot: VectorDocumentSnapshot = {
      ...(snapshot || { nodes: [], selectedIds: [] }),
      constraintEdges: nextEdges
    };

    return {
      success: unresolved.length === 0,
      snapshot: nextSnapshot,
      resolvedConflicts: resolved,
      unresolvedConflicts: unresolved,
      removedEdgeIds: Array.from(removedEdgeIds).sort((a, b) => a.localeCompare(b)),
      strategyUsed: strat
    };
  }

  /**
   * Resolves conflicts and validates solution using VectorConstraintSolverEngine.
   */
  public static resolveConflictsWithSolver(
    snapshot: VectorDocumentSnapshot,
    strategy: ConflictResolutionStrategy = 'remove_conflicting_constraint'
  ): ConflictResolutionResult {
    const res = this.resolveConflicts(snapshot, strategy);
    if (!res.success || !res.snapshot) return res;
    if (res.removedEdgeIds.length === 0) return res;

    const changedNodeIds = Array.from(new Set(res.resolvedConflicts.flatMap(c => c.affectedNodeIds)));
    if (changedNodeIds.length === 0) return res;

    const solveRes = VectorConstraintSolverEngine.resolveIncremental(res.snapshot, changedNodeIds);
    if (!solveRes.success) {
      return {
        ...res,
        success: false,
        error: solveRes.error?.reason || 'Solver resolution failed after conflict cleanup'
      };
    }

    return {
      ...res,
      snapshot: {
        ...(solveRes.snapshot || res.snapshot),
        constraintEdges: res.snapshot.constraintEdges || []
      }
    };
  }
}
