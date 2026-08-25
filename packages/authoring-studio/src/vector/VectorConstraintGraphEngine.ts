/**
 * VectorConstraintGraphEngine.ts — Sprint G1-51 (Night Shift Level 13)
 *
 * Implements a deterministic constraint dependency graph engine.
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorConstraintEdge, VectorNode } from './VectorDomainModel';
import { VectorDocumentSnapshot } from './VectorWorkspaceController';
import { VectorConstraintLayoutEngine, BoundingBox } from './VectorConstraintLayoutEngine';

export interface GraphAdjacencyList {
  [nodeId: string]: string[]; // targetNodeId -> list of dependent sourceNodeIds
}

export interface ConstraintGraphError {
  readonly code: 'CYCLE_DETECTED' | 'INVALID_BOUNDS' | 'MISSING_NODE' | 'LOCKED_NODE_CONFLICT' | 'CONTRADICTORY_CONSTRAINTS' | 'MALFORMED_CONSTRAINT' | 'UNSUPPORTED_RELATION';
  readonly sourceNodeId: string;
  readonly affectedNodeIds: string[];
  readonly dependencyChain: string[];
  readonly reason: string;
  readonly recoverability: boolean;
}

export interface ConstraintGraph {
  readonly nodes: Map<string, VectorNode>;
  readonly edges: ReadonlyArray<VectorConstraintEdge>;
  readonly adjacencyList: GraphAdjacencyList;        // targetNodeId -> dependent sourceNodeIds
  readonly reverseAdjacencyList: GraphAdjacencyList; // sourceNodeId -> targetNodeIds it depends on
}

export class VectorConstraintGraphEngine {
  /**
   * Constructs a full ConstraintGraph representation from a VectorDocumentSnapshot.
   */
  public static buildConstraintGraph(snapshot: VectorDocumentSnapshot): ConstraintGraph {
    const nodeMap = new Map<string, VectorNode>(snapshot.nodes.map(n => [n.id, n]));
    const edges = [...snapshot.constraintEdges].sort((a, b) => a.id.localeCompare(b.id));

    const adjacencyList: GraphAdjacencyList = {};
    const reverseAdjacencyList: GraphAdjacencyList = {};

    // Initialize entries for all nodes in the snapshot
    for (const node of snapshot.nodes) {
      adjacencyList[node.id] = [];
      reverseAdjacencyList[node.id] = [];
    }

    for (const edge of edges) {
      if (!edge.sourceNodeId || !edge.targetNodeId) continue;

      if (!adjacencyList[edge.targetNodeId]) {
        adjacencyList[edge.targetNodeId] = [];
      }
      if (!adjacencyList[edge.targetNodeId].includes(edge.sourceNodeId)) {
        adjacencyList[edge.targetNodeId].push(edge.sourceNodeId);
      }

      if (!reverseAdjacencyList[edge.sourceNodeId]) {
        reverseAdjacencyList[edge.sourceNodeId] = [];
      }
      if (!reverseAdjacencyList[edge.sourceNodeId].includes(edge.targetNodeId)) {
        reverseAdjacencyList[edge.sourceNodeId].push(edge.targetNodeId);
      }
    }

    // Sort adjacencies for strict determinism
    for (const key of Object.keys(adjacencyList)) {
      adjacencyList[key].sort((a, b) => a.localeCompare(b));
    }
    for (const key of Object.keys(reverseAdjacencyList)) {
      reverseAdjacencyList[key].sort((a, b) => a.localeCompare(b));
    }

    return {
      nodes: nodeMap,
      edges,
      adjacencyList,
      reverseAdjacencyList
    };
  }

  /**
   * Constructs an adjacency list from constraint edges (Target -> [Dependents]).
   */
  public static buildDependencyGraph(edges: ReadonlyArray<VectorConstraintEdge>): GraphAdjacencyList {
    const graph: GraphAdjacencyList = {};

    const sortedEdges = [...edges].sort((a, b) => a.id.localeCompare(b.id));
    for (const edge of sortedEdges) {
      if (!graph[edge.targetNodeId]) {
        graph[edge.targetNodeId] = [];
      }
      if (!graph[edge.targetNodeId].includes(edge.sourceNodeId)) {
        graph[edge.targetNodeId].push(edge.sourceNodeId);
      }
      
      if (!graph[edge.sourceNodeId]) {
        graph[edge.sourceNodeId] = [];
      }
    }

    for (const key of Object.keys(graph)) {
      graph[key].sort((a, b) => a.localeCompare(b));
    }

    return graph;
  }

  /**
   * Adds an edge to a ConstraintGraph dynamically.
   */
  public static addConstraintDependency(graph: ConstraintGraph, edge: VectorConstraintEdge): ConstraintGraph {
    const newEdges = [...graph.edges.filter(e => e.id !== edge.id), edge];
    const dummySnapshot: VectorDocumentSnapshot = {
      nodes: Array.from(graph.nodes.values()),
      selectedIds: [],
      constraintEdges: newEdges
    };
    return this.buildConstraintGraph(dummySnapshot);
  }

  /**
   * Removes an edge from a ConstraintGraph dynamically.
   */
  public static removeConstraintDependency(graph: ConstraintGraph, edgeId: string): ConstraintGraph {
    const newEdges = graph.edges.filter(e => e.id !== edgeId);
    const dummySnapshot: VectorDocumentSnapshot = {
      nodes: Array.from(graph.nodes.values()),
      selectedIds: [],
      constraintEdges: newEdges
    };
    return this.buildConstraintGraph(dummySnapshot);
  }

  /**
   * Returns list of node IDs that a given node depends on.
   */
  public static getDependencies(graph: ConstraintGraph | GraphAdjacencyList, nodeId: string): string[] {
    if ('reverseAdjacencyList' in graph) {
      return graph.reverseAdjacencyList[nodeId] ? [...graph.reverseAdjacencyList[nodeId]] : [];
    }
    // Infer from GraphAdjacencyList (which maps Target -> [Dependents])
    const deps: string[] = [];
    for (const [targetId, sources] of Object.entries(graph)) {
      if (sources.includes(nodeId)) {
        deps.push(targetId);
      }
    }
    return deps.sort((a, b) => a.localeCompare(b));
  }

  /**
   * Returns list of node IDs that depend on a given node.
   */
  public static getDependents(graph: ConstraintGraph | GraphAdjacencyList, nodeId: string): string[] {
    const adj = 'adjacencyList' in graph ? graph.adjacencyList : graph;
    return adj[nodeId] ? [...adj[nodeId]] : [];
  }

  /**
   * Detects if the graph contains any cyclic dependencies.
   */
  public static hasCycles(graph: ConstraintGraph | GraphAdjacencyList): boolean {
    return this.detectCycle(graph).hasCycle;
  }

  /**
   * Full cycle detection returning diagnostic details on failure.
   */
  public static detectCycle(graph: ConstraintGraph | GraphAdjacencyList): {
    hasCycle: boolean;
    cyclePath: string[];
    error?: ConstraintGraphError;
  } {
    const adj = 'adjacencyList' in graph ? graph.adjacencyList : graph;
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const stack: string[] = [];
    let cyclePath: string[] = [];

    const keys = Object.keys(adj).sort((a, b) => a.localeCompare(b));

    const dfs = (nodeId: string): boolean => {
      if (visiting.has(nodeId)) {
        const cycleStartIndex = stack.indexOf(nodeId);
        if (cycleStartIndex >= 0) {
          cyclePath = stack.slice(cycleStartIndex).concat(nodeId);
        } else {
          cyclePath = [nodeId, nodeId];
        }
        return true;
      }
      if (visited.has(nodeId)) return false;

      visiting.add(nodeId);
      stack.push(nodeId);

      const dependents = (adj[nodeId] || []).slice().sort((a, b) => a.localeCompare(b));
      for (const dep of dependents) {
        if (dfs(dep)) {
          return true;
        }
      }

      stack.pop();
      visiting.delete(nodeId);
      visited.add(nodeId);
      return false;
    };

    for (const nodeId of keys) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId)) {
          const sourceNode = cyclePath[0] || nodeId;
          return {
            hasCycle: true,
            cyclePath,
            error: {
              code: 'CYCLE_DETECTED',
              sourceNodeId: sourceNode,
              affectedNodeIds: [...cyclePath],
              dependencyChain: cyclePath,
              reason: `Cyclic constraint dependency detected: ${cyclePath.join(' -> ')}`,
              recoverability: false
            }
          };
        }
      }
    }

    return { hasCycle: false, cyclePath: [] };
  }

  /**
   * Returns a deterministic topologically sorted array of node IDs.
   */
  public static topologicalSort(graph: ConstraintGraph | GraphAdjacencyList): string[] {
    return this.calculateResolutionOrder(graph);
  }

  /**
   * Calculates deterministic resolution order with stable tie-breaking.
   */
  public static calculateResolutionOrder(graph: ConstraintGraph | GraphAdjacencyList): string[] {
    const adj = 'adjacencyList' in graph ? graph.adjacencyList : graph;
    const cycleRes = this.detectCycle(adj);
    if (cycleRes.hasCycle) {
      throw new Error(`VectorConstraintGraphEngine: Cycle detected during topological sort: ${cycleRes.cyclePath.join(' -> ')}`);
    }

    const inDegree: { [nodeId: string]: number } = {};
    const nodes = Object.keys(adj).sort((a, b) => a.localeCompare(b));

    for (const node of nodes) {
      if (inDegree[node] === undefined) inDegree[node] = 0;
      for (const target of adj[node]) {
        if (inDegree[target] === undefined) inDegree[target] = 0;
        inDegree[target]++;
      }
    }

    const zeroInDegree = Object.keys(inDegree).filter(n => inDegree[n] === 0).sort((a, b) => a.localeCompare(b));
    const result: string[] = [];

    while (zeroInDegree.length > 0) {
      zeroInDegree.sort((a, b) => a.localeCompare(b));
      const current = zeroInDegree.shift()!;
      result.push(current);

      const dependents = (adj[current] || []).slice().sort((a, b) => a.localeCompare(b));
      for (const dep of dependents) {
        inDegree[dep]--;
        if (inDegree[dep] === 0) {
          zeroInDegree.push(dep);
        }
      }
    }

    if (result.length !== Object.keys(inDegree).length) {
      throw new Error('VectorConstraintGraphEngine: Cycle detected during resolution order calculation.');
    }

    return result;
  }

  /**
   * Returns a Set of all node IDs reachable from the initial set of mutated nodes.
   */
  public static getAffectedSubgraph(graph: ConstraintGraph | GraphAdjacencyList, initialNodes: string[]): Set<string> {
    const adj = 'adjacencyList' in graph ? graph.adjacencyList : graph;
    const affected = new Set<string>();
    const queue = [...initialNodes].sort((a, b) => a.localeCompare(b));

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!affected.has(current)) {
        affected.add(current);
        const dependents = (adj[current] || []).slice().sort((a, b) => a.localeCompare(b));
        for (const dep of dependents) {
          queue.push(dep);
        }
      }
    }

    return affected;
  }

  /**
   * Validates bounding box data for NaN, Infinity, negative/zero dimensions when prohibited.
   */
  public static validateBounds(nodeId: string, bounds: BoundingBox): ConstraintGraphError | null {
    if (
      isNaN(bounds.x) || isNaN(bounds.y) || isNaN(bounds.width) || isNaN(bounds.height) ||
      !isFinite(bounds.x) || !isFinite(bounds.y) || !isFinite(bounds.width) || !isFinite(bounds.height)
    ) {
      return {
        code: 'INVALID_BOUNDS',
        sourceNodeId: nodeId,
        affectedNodeIds: [nodeId],
        dependencyChain: [nodeId],
        reason: `Invalid bounding box values (NaN or Infinity) for node ${nodeId}`,
        recoverability: false
      };
    }
    if (bounds.width < 0 || bounds.height < 0) {
      return {
        code: 'INVALID_BOUNDS',
        sourceNodeId: nodeId,
        affectedNodeIds: [nodeId],
        dependencyChain: [nodeId],
        reason: `Negative dimension bounds (width: ${bounds.width}, height: ${bounds.height}) for node ${nodeId}`,
        recoverability: false
      };
    }
    return null;
  }

  /**
   * Resolves affected nodes in a snapshot given a set of changed node IDs.
   */
  public static resolveAffectedNodes(
    graph: ConstraintGraph,
    changedNodeIds: string[],
    snapshot: VectorDocumentSnapshot
  ): VectorNode[] {
    const explicitMutations = new Map<string, BoundingBox>();
    const nodeMap = new Map<string, VectorNode>(snapshot.nodes.map(n => [n.id, n]));

    for (const id of changedNodeIds) {
      const n = nodeMap.get(id);
      if (n) {
        explicitMutations.set(id, n.transform);
      }
    }

    return this.resolveGraph(snapshot, explicitMutations);
  }

  /**
   * Full constraint graph resolution returning success status or structured error.
   */
  public static resolveConstraintGraph(
    graph: ConstraintGraph,
    snapshot: VectorDocumentSnapshot,
    explicitMutations: Map<string, BoundingBox> = new Map()
  ): { success: boolean; nodes?: VectorNode[]; error?: ConstraintGraphError } {
    // 1. Cycle Check
    const cycleRes = this.detectCycle(graph);
    if (cycleRes.hasCycle && cycleRes.error) {
      return { success: false, error: cycleRes.error };
    }

    // 2. Validate explicit mutations
    for (const [nodeId, bounds] of explicitMutations.entries()) {
      const err = this.validateBounds(nodeId, bounds);
      if (err) return { success: false, error: err };

      const node = graph.nodes.get(nodeId) || snapshot.nodes.find(n => n.id === nodeId);
      if (node?.locked) {
        return {
          success: false,
          error: {
            code: 'LOCKED_NODE_CONFLICT',
            sourceNodeId: nodeId,
            affectedNodeIds: [nodeId],
            dependencyChain: [nodeId],
            reason: `Cannot apply mutation to locked node ${nodeId}`,
            recoverability: false
          }
        };
      }
    }

    try {
      const resolvedNodes = this.resolveGraph(snapshot, explicitMutations);
      return { success: true, nodes: resolvedNodes };
    } catch (e: any) {
      return {
        success: false,
        error: {
          code: 'CONTRADICTORY_CONSTRAINTS',
          sourceNodeId: Array.from(explicitMutations.keys())[0] || 'unknown',
          affectedNodeIds: Array.from(explicitMutations.keys()),
          dependencyChain: [],
          reason: e.message || 'Constraint resolution failure',
          recoverability: false
        }
      };
    }
  }

  /**
   * Resolves the constraint graph given a set of explicit mutations.
   */
  public static resolveGraph(
    snapshot: VectorDocumentSnapshot,
    explicitMutations: Map<string, BoundingBox>
  ): VectorNode[] {
    const constraintGraph = this.buildConstraintGraph(snapshot);
    const cycleRes = this.detectCycle(constraintGraph);
    if (cycleRes.hasCycle) {
      throw new Error(`VectorConstraintGraphEngine: Cannot resolve graph with cycles (${cycleRes.cyclePath.join(' -> ')}).`);
    }

    const affectedNodes = this.getAffectedSubgraph(constraintGraph, Array.from(explicitMutations.keys()));
    const execOrder = this.calculateResolutionOrder(constraintGraph).filter(id => affectedNodes.has(id));

    const nodeMap = new Map<string, VectorNode>(snapshot.nodes.map(n => [n.id, n]));
    const computedBounds = new Map<string, BoundingBox>(explicitMutations);

    // Group edges by source Node ID and sort deterministically
    const edgesBySource = new Map<string, { h?: VectorConstraintEdge; v?: VectorConstraintEdge }>();
    const sortedEdges = [...snapshot.constraintEdges].sort((a, b) => a.targetNodeId.localeCompare(b.targetNodeId));

    for (const edge of sortedEdges) {
      if (!edgesBySource.has(edge.sourceNodeId)) {
        edgesBySource.set(edge.sourceNodeId, {});
      }
      const entry = edgesBySource.get(edge.sourceNodeId)!;

      if (edge.horizontal && !entry.h) {
        entry.h = edge;
      }
      if (edge.vertical && !entry.v) {
        entry.v = edge;
      }
    }

    const nextNodes: VectorNode[] = [...snapshot.nodes];

    for (const nodeId of execOrder) {
      const node = nodeMap.get(nodeId);
      if (!node) {
        throw new Error(`VectorConstraintGraphEngine: Referenced node ${nodeId} missing from snapshot.`);
      }
      if (node.locked && explicitMutations.has(nodeId)) {
        throw new Error(`VectorConstraintGraphEngine: Cannot mutate locked node ${nodeId}.`);
      }

      const edgeEntry = edgesBySource.get(nodeId);
      if (!edgeEntry && !computedBounds.has(nodeId)) {
        computedBounds.set(nodeId, node.transform);
        continue;
      }

      let newX = computedBounds.has(nodeId) ? computedBounds.get(nodeId)!.x : node.transform.x;
      let newY = computedBounds.has(nodeId) ? computedBounds.get(nodeId)!.y : node.transform.y;
      let newW = computedBounds.has(nodeId) ? computedBounds.get(nodeId)!.width : node.transform.width;
      let newH = computedBounds.has(nodeId) ? computedBounds.get(nodeId)!.height : node.transform.height;

      const activeEdges = [edgeEntry?.h, edgeEntry?.v].filter(Boolean) as VectorConstraintEdge[];

      for (const edge of activeEdges) {
        const targetNode = nodeMap.get(edge.targetNodeId);
        if (!targetNode) continue;

        const oldTargetBounds = targetNode.transform;
        const newTargetBounds = computedBounds.get(edge.targetNodeId) || oldTargetBounds;

        if (edge.horizontal) {
          const tempNode: VectorNode = { ...node, constraints: { ...node.constraints, horizontal: edge.horizontal, vertical: 'MIN' } };
          const hRes = VectorConstraintLayoutEngine.computeHorizontalConstraint(tempNode, oldTargetBounds, newTargetBounds);
          newX = hRes.x;
          newW = hRes.width;
        }

        if (edge.vertical) {
          const tempNode: VectorNode = { ...node, constraints: { ...node.constraints, horizontal: 'MIN', vertical: edge.vertical } };
          const vRes = VectorConstraintLayoutEngine.computeVerticalConstraint(tempNode, oldTargetBounds, newTargetBounds);
          newY = vRes.y;
          newH = vRes.height;
        }
      }

      const valErr = this.validateBounds(nodeId, { x: newX, y: newY, width: newW, height: newH });
      if (valErr) {
        throw new Error(`VectorConstraintGraphEngine: ${valErr.reason}`);
      }

      const finalBounds = { x: newX, y: newY, width: newW, height: newH };
      computedBounds.set(nodeId, finalBounds);

      if (newX !== node.transform.x || newY !== node.transform.y || newW !== node.transform.width || newH !== node.transform.height) {
        const nodeIndex = nextNodes.findIndex(n => n.id === nodeId);
        if (nodeIndex >= 0) {
          nextNodes[nodeIndex] = {
            ...node,
            transform: {
              ...node.transform,
              x: newX,
              y: newY,
              width: newW,
              height: newH
            }
          };
        }
      }
    }

    return nextNodes;
  }
}
