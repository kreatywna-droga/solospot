/**
 * VectorConstraintSolverEngine.ts — Sprint G1-52 (Night Shift Level 14)
 *
 * Implements a deterministic, iterative, incremental geometric constraint solver engine.
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorNode, VectorConstraintEdge } from './VectorDomainModel';
import { VectorDocumentSnapshot } from './VectorWorkspaceController';
import { VectorConstraintLayoutEngine, BoundingBox } from './VectorConstraintLayoutEngine';
import { VectorConstraintGraphEngine, ConstraintGraph } from './VectorConstraintGraphEngine';

export interface SolverOptions {
  readonly maxIterations?: number;
  readonly tolerance?: number;
}

export interface SolverError {
  readonly code: 'MAX_ITERATIONS_EXCEEDED' | 'LOCKED_NODE_CONFLICT' | 'CONTRADICTORY_CONSTRAINTS' | 'INVALID_BOUNDS' | 'CYCLE_DETECTED' | 'UNRESOLVABLE_CONSTRAINT';
  readonly sourceNodeId: string;
  readonly affectedNodeIds: string[];
  readonly constraintIds: string[];
  readonly dependencyChain: string[];
  readonly reason: string;
  readonly recoverability: boolean;
}

export interface IncrementalResolutionResult {
  readonly success: boolean;
  readonly snapshot?: VectorDocumentSnapshot;
  readonly changedNodes: string[];
  readonly affectedNodes: string[];
  readonly resolvedNodes: string[];
  readonly untouchedNodes: string[];
  readonly iterations: number;
  readonly error?: SolverError;
}

export class VectorConstraintSolverEngine {
  private static DEFAULT_MAX_ITERATIONS = 10;
  private static DEFAULT_TOLERANCE = 1e-4;

  /**
   * Deep geometry equality check using precision tolerance.
   */
  public static isGeometryEqual(a: BoundingBox, b: BoundingBox, tolerance = VectorConstraintSolverEngine.DEFAULT_TOLERANCE): boolean {
    return (
      Math.abs(a.x - b.x) <= tolerance &&
      Math.abs(a.y - b.y) <= tolerance &&
      Math.abs(a.width - b.width) <= tolerance &&
      Math.abs(a.height - b.height) <= tolerance
    );
  }

  /**
   * Main incremental resolution method. Resolves affected subgraph closure over iterative passes until fixed-point stability is reached.
   */
  public static resolveIncremental(
    snapshot: VectorDocumentSnapshot,
    changedNodeIds: string[],
    explicitMutations: Map<string, BoundingBox> = new Map(),
    options: SolverOptions = {}
  ): IncrementalResolutionResult {
    const maxIterations = options.maxIterations ?? this.DEFAULT_MAX_ITERATIONS;
    const tolerance = options.tolerance ?? this.DEFAULT_TOLERANCE;

    const allNodeIds = snapshot.nodes.map(n => n.id);
    const nodeMap = new Map<string, VectorNode>(snapshot.nodes.map(n => [n.id, n]));

    // 1. Build constraint graph and check for cycles
    const graph = VectorConstraintGraphEngine.buildConstraintGraph(snapshot);
    const cycleRes = VectorConstraintGraphEngine.detectCycle(graph);
    if (cycleRes.hasCycle && cycleRes.error) {
      return {
        success: false,
        changedNodes: changedNodeIds,
        affectedNodes: [],
        resolvedNodes: [],
        untouchedNodes: allNodeIds,
        iterations: 0,
        error: {
          code: 'CYCLE_DETECTED',
          sourceNodeId: cycleRes.error.sourceNodeId,
          affectedNodeIds: cycleRes.error.affectedNodeIds,
          constraintIds: snapshot.constraintEdges.map(e => e.id),
          dependencyChain: cycleRes.error.dependencyChain,
          reason: cycleRes.error.reason,
          recoverability: false
        }
      };
    }

    // 2. Validate locked nodes & input bounds
    for (const [nodeId, bounds] of explicitMutations.entries()) {
      const node = nodeMap.get(nodeId);
      if (node?.locked) {
        return {
          success: false,
          changedNodes: changedNodeIds,
          affectedNodes: [],
          resolvedNodes: [],
          untouchedNodes: allNodeIds,
          iterations: 0,
          error: {
            code: 'LOCKED_NODE_CONFLICT',
            sourceNodeId: nodeId,
            affectedNodeIds: [nodeId],
            constraintIds: [],
            dependencyChain: [nodeId],
            reason: `Cannot transform locked node ${nodeId}`,
            recoverability: false
          }
        };
      }
      const valErr = VectorConstraintGraphEngine.validateBounds(nodeId, bounds);
      if (valErr) {
        return {
          success: false,
          changedNodes: changedNodeIds,
          affectedNodes: [],
          resolvedNodes: [],
          untouchedNodes: allNodeIds,
          iterations: 0,
          error: {
            code: 'INVALID_BOUNDS',
            sourceNodeId: nodeId,
            affectedNodeIds: [nodeId],
            constraintIds: [],
            dependencyChain: [nodeId],
            reason: valErr.reason,
            recoverability: false
          }
        };
      }
    }

    // 3. Extract affected closure
    const affectedSet = VectorConstraintGraphEngine.getAffectedSubgraph(graph, changedNodeIds);
    const affectedNodes = Array.from(affectedSet).sort((a, b) => a.localeCompare(b));
    const untouchedNodes = allNodeIds.filter(id => !affectedSet.has(id)).sort((a, b) => a.localeCompare(b));

    // 4. Iterative Fixed Point Solving Loop
    let currentWorkingNodes: VectorNode[] = [...snapshot.nodes];
    let currentMutations = new Map<string, BoundingBox>(explicitMutations);
    let iterations = 0;
    let isStable = false;

    while (iterations < maxIterations && !isStable) {
      iterations++;
      const currentSnap: VectorDocumentSnapshot = {
        ...snapshot,
        nodes: currentWorkingNodes
      };

      let nextResolvedNodes: VectorNode[];
      try {
        nextResolvedNodes = VectorConstraintGraphEngine.resolveGraph(currentSnap, currentMutations);
      } catch (e: any) {
        return {
          success: false,
          changedNodes: changedNodeIds,
          affectedNodes,
          resolvedNodes: [],
          untouchedNodes,
          iterations,
          error: {
            code: 'CONTRADICTORY_CONSTRAINTS',
            sourceNodeId: changedNodeIds[0] || 'unknown',
            affectedNodeIds,
            constraintIds: snapshot.constraintEdges.map(e => e.id),
            dependencyChain: affectedNodes,
            reason: e.message || 'Constraint evaluation failed',
            recoverability: false
          }
        };
      }

      // Check fixed point stability between currentWorkingNodes and nextResolvedNodes
      let allMatch = true;
      for (const id of affectedNodes) {
        const prevN = currentWorkingNodes.find(n => n.id === id);
        const nextN = nextResolvedNodes.find(n => n.id === id);
        if (prevN && nextN) {
          if (!this.isGeometryEqual(prevN.transform, nextN.transform, tolerance)) {
            allMatch = false;
            break;
          }
        }
      }

      if (allMatch && iterations > 1) {
        isStable = true;
      } else {
        currentWorkingNodes = nextResolvedNodes;
        // On subsequent iterations, clear explicit mutations as geometry is now propagated
        currentMutations = new Map();
      }
    }

    if (!isStable && maxIterations > 1 && iterations >= maxIterations) {
      return {
        success: false,
        changedNodes: changedNodeIds,
        affectedNodes,
        resolvedNodes: [],
        untouchedNodes,
        iterations,
        error: {
          code: 'MAX_ITERATIONS_EXCEEDED',
          sourceNodeId: changedNodeIds[0] || 'unknown',
          affectedNodeIds,
          constraintIds: snapshot.constraintEdges.map(e => e.id),
          dependencyChain: affectedNodes,
          reason: `Solver failed to reach fixed-point stability within ${maxIterations} iterations`,
          recoverability: false
        }
      };
    }

    const resolvedNodesList = affectedNodes;
    const finalSnapshot: VectorDocumentSnapshot = {
      ...snapshot,
      nodes: currentWorkingNodes
    };

    return {
      success: true,
      snapshot: finalSnapshot,
      changedNodes: changedNodeIds,
      affectedNodes,
      resolvedNodes: resolvedNodesList,
      untouchedNodes,
      iterations
    };
  }

  /**
   * Helper alias for solveConstraintClosure.
   */
  public static solveConstraintClosure(
    snapshot: VectorDocumentSnapshot,
    changedNodeIds: string[],
    explicitMutations: Map<string, BoundingBox> = new Map(),
    options: SolverOptions = {}
  ): IncrementalResolutionResult {
    return this.resolveIncremental(snapshot, changedNodeIds, explicitMutations, options);
  }

  /**
   * Helper alias for solveAffectedNodes.
   */
  public static solveAffectedNodes(
    snapshot: VectorDocumentSnapshot,
    changedNodeIds: string[],
    options: SolverOptions = {}
  ): IncrementalResolutionResult {
    const explicitMutations = new Map<string, BoundingBox>();
    const nodeMap = new Map<string, VectorNode>(snapshot.nodes.map(n => [n.id, n]));
    for (const id of changedNodeIds) {
      const node = nodeMap.get(id);
      if (node) explicitMutations.set(id, node.transform);
    }
    return this.resolveIncremental(snapshot, changedNodeIds, explicitMutations, options);
  }

  /**
   * Preview mode for constraint resolution. Returns transient resolution result without mutating SSOT or HistoryStack.
   */
  public static previewConstraintResolution(
    snapshot: VectorDocumentSnapshot,
    changedNodeIds: string[],
    explicitMutations: Map<string, BoundingBox> = new Map(),
    options: SolverOptions = {}
  ): IncrementalResolutionResult {
    return this.resolveIncremental(snapshot, changedNodeIds, explicitMutations, options);
  }
}
