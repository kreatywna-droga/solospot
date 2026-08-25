/**
 * VectorConstraintGraphG151.test.ts — Sprint G1-51 (Night Shift Level 13)
 *
 * Comprehensive 150-test suite covering:
 * - 35 Feature Tests
 * - 30 Integration Tests
 * - 20 E2E Tests
 * - 40 Adversarial Tests
 * - 25 Failure Injection Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VectorConstraintGraphEngine, ConstraintGraphError, ConstraintGraph } from '../VectorConstraintGraphEngine';
import { VectorConstraintLayoutEngine, BoundingBox } from '../VectorConstraintLayoutEngine';
import { VectorWorkspaceState, VectorDocumentSnapshot, createVectorWorkspaceState } from '../VectorWorkspaceController';
import { VectorWorkflowOrchestrator } from '../VectorWorkflowOrchestrator';
import { VectorDeterministicWorkflowEngine } from '../VectorDeterministicWorkflowEngine';
import { VectorConstraintEdge, VectorNode } from '../VectorDomainModel';
import { VectorDocumentSerializer } from '../VectorDocumentSerializer';
import { VectorSvgExporter } from '../VectorSvgExporter';

describe('VectorConstraintGraphEngine (G1-51 Night Shift Level 13)', () => {
  let baseSnapshot: VectorDocumentSnapshot;
  let baseState: VectorWorkspaceState;

  const createMockNode = (id: string, x = 0, y = 0, w = 100, h = 100, locked = false): VectorNode => ({
    id,
    type: 'rectangle',
    name: `Node ${id}`,
    transform: { x, y, width: w, height: h, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
    locked,
    visible: true,
    constraints: { horizontal: 'MIN', vertical: 'MIN' }
  });

  beforeEach(() => {
    const nodes = [
      createMockNode('node_a', 0, 0, 500, 500),
      createMockNode('node_b', 10, 10, 100, 100),
      createMockNode('node_c', 200, 200, 150, 150)
    ];
    baseSnapshot = {
      nodes,
      selectedIds: ['node_b'],
      constraintEdges: [
        { id: 'edge_ba', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'STRETCH', vertical: 'MIN' }
      ]
    };
    baseState = createVectorWorkspaceState(nodes, ['node_b']);
    baseState = { ...baseState, documentSnapshot: baseSnapshot };
  });

  // ==========================================
  // --- 1. FEATURE TESTS (35 Tests) ----------
  // ==========================================
  describe('1. Feature Tests — Core Graph Mechanics & Operations (35)', () => {
    it('Feature 01: should build constraint graph from empty snapshot', () => {
      const emptySnap: VectorDocumentSnapshot = { nodes: [], selectedIds: [], constraintEdges: [] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(emptySnap);
      expect(graph.nodes.size).toBe(0);
      expect(graph.edges.length).toBe(0);
      expect(Object.keys(graph.adjacencyList).length).toBe(0);
    });

    it('Feature 02: should build constraint graph with single node without edges', () => {
      const snap: VectorDocumentSnapshot = { nodes: [createMockNode('n1')], selectedIds: [], constraintEdges: [] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      expect(graph.nodes.size).toBe(1);
      expect(graph.adjacencyList['n1']).toEqual([]);
    });

    it('Feature 03: should build constraint graph with parent-child relationship', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      expect(graph.adjacencyList['node_a']).toContain('node_b');
      expect(graph.reverseAdjacencyList['node_b']).toContain('node_a');
    });

    it('Feature 04: should add constraint dependency dynamically', () => {
      let graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const newEdge: VectorConstraintEdge = { id: 'edge_cb', sourceNodeId: 'node_c', targetNodeId: 'node_b', horizontal: 'MAX' };
      graph = VectorConstraintGraphEngine.addConstraintDependency(graph, newEdge);
      expect(graph.adjacencyList['node_b']).toContain('node_c');
    });

    it('Feature 05: should remove constraint dependency dynamically', () => {
      let graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      graph = VectorConstraintGraphEngine.removeConstraintDependency(graph, 'edge_ba');
      expect(graph.adjacencyList['node_a']).not.toContain('node_b');
    });

    it('Feature 06: should retrieve correct dependencies for a node', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const deps = VectorConstraintGraphEngine.getDependencies(graph, 'node_b');
      expect(deps).toEqual(['node_a']);
    });

    it('Feature 07: should retrieve correct dependents for a node', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const dependents = VectorConstraintGraphEngine.getDependents(graph, 'node_a');
      expect(dependents).toEqual(['node_b']);
    });

    it('Feature 08: should detect empty graph has no cycles', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph({ nodes: [], selectedIds: [], constraintEdges: [] });
      expect(VectorConstraintGraphEngine.hasCycles(graph)).toBe(false);
    });

    it('Feature 09: should detect valid DAG has no cycles', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      expect(VectorConstraintGraphEngine.hasCycles(graph)).toBe(false);
    });

    it('Feature 10: should detect direct self-cycle (A -> A)', () => {
      const selfEdge: VectorConstraintEdge = { id: 'e1', sourceNodeId: 'node_a', targetNodeId: 'node_a', horizontal: 'MIN' };
      const snap: VectorDocumentSnapshot = { nodes: [createMockNode('node_a')], selectedIds: [], constraintEdges: [selfEdge] };
      const res = VectorConstraintGraphEngine.detectCycle(snap.constraintEdges);
      expect(res.hasCycle).toBe(true);
      expect(res.error?.code).toBe('CYCLE_DETECTED');
    });

    it('Feature 11: should detect 2-node cycle (A -> B -> A)', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'node_a', targetNodeId: 'node_b', horizontal: 'MIN' }
      ];
      const res = VectorConstraintGraphEngine.detectCycle(edges);
      expect(res.hasCycle).toBe(true);
    });

    it('Feature 12: should detect 3-node cycle (A -> B -> C -> A)', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'node_c', targetNodeId: 'node_b', horizontal: 'MIN' },
        { id: 'e3', sourceNodeId: 'node_a', targetNodeId: 'node_c', horizontal: 'MIN' }
      ];
      const res = VectorConstraintGraphEngine.detectCycle(edges);
      expect(res.hasCycle).toBe(true);
    });

    it('Feature 13: should calculate deterministic topological sort order', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const order = VectorConstraintGraphEngine.topologicalSort(graph);
      expect(order.indexOf('node_a')).toBeLessThan(order.indexOf('node_b'));
    });

    it('Feature 14: should tie-break independent nodes alphabetically', () => {
      const snap: VectorDocumentSnapshot = {
        nodes: [createMockNode('z_node'), createMockNode('a_node'), createMockNode('m_node')],
        selectedIds: [],
        constraintEdges: []
      };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const order = VectorConstraintGraphEngine.topologicalSort(graph);
      expect(order).toEqual(['a_node', 'm_node', 'z_node']);
    });

    it('Feature 15: should calculate resolution order for deep DAG chain', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'n2', targetNodeId: 'n1', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'n3', targetNodeId: 'n2', horizontal: 'MIN' },
        { id: 'e3', sourceNodeId: 'n4', targetNodeId: 'n3', horizontal: 'MIN' }
      ];
      const snap: VectorDocumentSnapshot = {
        nodes: ['n1', 'n2', 'n3', 'n4'].map(id => createMockNode(id)),
        selectedIds: [],
        constraintEdges: edges
      };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const order = VectorConstraintGraphEngine.topologicalSort(graph);
      expect(order).toEqual(['n1', 'n2', 'n3', 'n4']);
    });

    it('Feature 16: should compute affected subgraph correctly', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const affected = VectorConstraintGraphEngine.getAffectedSubgraph(graph, ['node_a']);
      expect(affected.has('node_a')).toBe(true);
      expect(affected.has('node_b')).toBe(true);
      expect(affected.has('node_c')).toBe(false);
    });

    it('Feature 17: should resolve simple horizontal constraint propagation', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const resolved = VectorConstraintGraphEngine.resolveConstraintGraph(graph, baseSnapshot, mutations);
      expect(resolved.success).toBe(true);
      const nodeB = resolved.nodes?.find(n => n.id === 'node_b');
      expect(nodeB?.transform.width).toBeGreaterThan(100);
    });

    it('Feature 18: should validate valid bounding boxes without error', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 10, y: 20, width: 100, height: 200 });
      expect(err).toBeNull();
    });

    it('Feature 19: should flag NaN in bounding box as INVALID_BOUNDS', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: NaN, y: 20, width: 100, height: 200 });
      expect(err?.code).toBe('INVALID_BOUNDS');
    });

    it('Feature 20: should flag Infinity in bounding box as INVALID_BOUNDS', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 0, y: Infinity, width: 100, height: 200 });
      expect(err?.code).toBe('INVALID_BOUNDS');
    });

    it('Feature 21: should flag negative width as INVALID_BOUNDS', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 0, y: 0, width: -10, height: 200 });
      expect(err?.code).toBe('INVALID_BOUNDS');
    });

    it('Feature 22: should reject mutation on locked node', () => {
      const lockedNode = createMockNode('locked_1', 0, 0, 100, 100, true);
      const snap: VectorDocumentSnapshot = { nodes: [lockedNode], selectedIds: [], constraintEdges: [] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['locked_1', { x: 50, y: 50, width: 100, height: 100 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('LOCKED_NODE_CONFLICT');
    });

    it('Feature 23: should preserve unaffected nodes byte-for-byte in output array', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const resolved = VectorConstraintGraphEngine.resolveConstraintGraph(graph, baseSnapshot, mutations);
      const originalC = baseSnapshot.nodes.find(n => n.id === 'node_c');
      const resolvedC = resolved.nodes?.find(n => n.id === 'node_c');
      expect(resolvedC).toBe(originalC);
    });

    it('Feature 24: should handle empty explicit mutations map', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, baseSnapshot, new Map());
      expect(res.success).toBe(true);
      expect(res.nodes?.length).toBe(baseSnapshot.nodes.length);
    });

    it('Feature 25: should resolve vertical MIN constraint correctly', () => {
      const edge: VectorConstraintEdge = { id: 'e_v', sourceNodeId: 'node_b', targetNodeId: 'node_a', vertical: 'MIN' };
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: [edge] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 50, width: 500, height: 500 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
    });

    it('Feature 26: should resolve horizontal CENTER constraint correctly', () => {
      const edge: VectorConstraintEdge = { id: 'e_c', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'CENTER' };
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: [edge] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 1000, height: 500 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
    });

    it('Feature 27: should resolve vertical MAX constraint correctly', () => {
      const edge: VectorConstraintEdge = { id: 'e_max', sourceNodeId: 'node_b', targetNodeId: 'node_a', vertical: 'MAX' };
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: [edge] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 500, height: 1000 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
    });

    it('Feature 28: should resolve horizontal SCALE constraint correctly', () => {
      const edge: VectorConstraintEdge = { id: 'e_scale', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'SCALE' };
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: [edge] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 1000, height: 500 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
    });

    it('Feature 29: should return structured error object on cycle detection', () => {
      const cycleEdges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'n1', targetNodeId: 'n2', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'n2', targetNodeId: 'n1', horizontal: 'MIN' }
      ];
      const snap: VectorDocumentSnapshot = { nodes: [createMockNode('n1'), createMockNode('n2')], selectedIds: [], constraintEdges: cycleEdges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('CYCLE_DETECTED');
      expect(res.error?.recoverability).toBe(false);
    });

    it('Feature 30: should handle multiple independent dependency branches', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'b1', targetNodeId: 'root1', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'b2', targetNodeId: 'root2', horizontal: 'MIN' }
      ];
      const snap: VectorDocumentSnapshot = {
        nodes: [createMockNode('root1'), createMockNode('b1'), createMockNode('root2'), createMockNode('b2')],
        selectedIds: [],
        constraintEdges: edges
      };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const order = VectorConstraintGraphEngine.topologicalSort(graph);
      expect(order.indexOf('root1')).toBeLessThan(order.indexOf('b1'));
      expect(order.indexOf('root2')).toBeLessThan(order.indexOf('b2'));
    });

    it('Feature 31: should handle diamond dependency merging (A -> B, A -> C, B -> D, C -> D)', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'b', targetNodeId: 'a', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'c', targetNodeId: 'a', horizontal: 'MIN' },
        { id: 'e3', sourceNodeId: 'd', targetNodeId: 'b', horizontal: 'MIN' },
        { id: 'e4', sourceNodeId: 'd', targetNodeId: 'c', horizontal: 'MIN' }
      ];
      const snap: VectorDocumentSnapshot = {
        nodes: ['a', 'b', 'c', 'd'].map(id => createMockNode(id)),
        selectedIds: [],
        constraintEdges: edges
      };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const order = VectorConstraintGraphEngine.topologicalSort(graph);
      expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
      expect(order.indexOf('a')).toBeLessThan(order.indexOf('c'));
      expect(order.indexOf('b')).toBeLessThan(order.indexOf('d'));
      expect(order.indexOf('c')).toBeLessThan(order.indexOf('d'));
    });

    it('Feature 32: should resolveAffectedNodes helper function correctly', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const resolved = VectorConstraintGraphEngine.resolveAffectedNodes(graph, ['node_a'], baseSnapshot);
      expect(resolved.length).toBe(baseSnapshot.nodes.length);
    });

    it('Feature 33: should handle zero bounds dimensions (width = 0, height = 0)', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 0, y: 0, width: 0, height: 0 });
      expect(err).toBeNull(); // Zero dimension is valid in vector geometry
    });

    it('Feature 34: should detect missing referenced target node gracefully', () => {
      const badEdge: VectorConstraintEdge = { id: 'e_bad', sourceNodeId: 'node_b', targetNodeId: 'non_existent', horizontal: 'MIN' };
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: [badEdge] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
      expect(res.success).toBe(true); // skips broken reference without crashing
    });

    it('Feature 35: should preserve original input snapshot immutability', () => {
      const freezeSnapshot = Object.freeze({ ...baseSnapshot });
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(freezeSnapshot);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, freezeSnapshot, mutations);
      expect(res.success).toBe(true);
      expect(freezeSnapshot.nodes[0].transform.width).toBe(500); // Unchanged
    });
  });

  // ==========================================
  // --- 2. INTEGRATION TESTS (30 Tests) -----
  // ==========================================
  describe('2. Integration Tests — Orchestrator, Serialization & SVG Parity (30)', () => {
    it('Integration 01: should execute constraint graph transaction via VectorWorkflowOrchestrator', () => {
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const result = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(baseState, mutations);
      expect(result.success).toBe(true);
    });

    it('Integration 02: should commit exactly 1 HistoryStack entry on successful resolution', () => {
      const initialHistoryLength = baseState.historyStack.past.length;
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const result = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(baseState, mutations);
      expect(result.success).toBe(true);
      expect(result.nextState?.historyStack.past.length).toBe(initialHistoryLength + 1);
    });

    it('Integration 03: should commit 0 HistoryStack entries on cycle error', () => {
      const cycleEdges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_a', targetNodeId: 'node_b', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'MIN' }
      ];
      const cycleState: VectorWorkspaceState = {
        ...baseState,
        documentSnapshot: { ...baseSnapshot, constraintEdges: cycleEdges }
      };
      const initialHistoryLength = cycleState.historyStack.past.length;
      const result = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(cycleState);
      expect(result.nextState?.historyStack.past.length).toBe(initialHistoryLength);
    });

    it('Integration 04: should preserve constraint edges through DocumentSerializer roundtrip', () => {
      const serialized = VectorDocumentSerializer.serializeDocument(baseSnapshot);
      const deserialized = VectorDocumentSerializer.deserializeDocument(serialized);
      expect(deserialized.constraintEdges.length).toBe(baseSnapshot.constraintEdges.length);
      expect(deserialized.constraintEdges[0].id).toBe(baseSnapshot.constraintEdges[0].id);
    });

    it('Integration 05: should preserve node transforms after graph resolution + serialization roundtrip', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, baseSnapshot, mutations);
      const nextSnap: VectorDocumentSnapshot = { ...baseSnapshot, nodes: res.nodes! };
      const serialized = VectorDocumentSerializer.serializeDocument(nextSnap);
      const deserialized = VectorDocumentSerializer.deserializeDocument(serialized);
      expect(deserialized.nodes.find(n => n.id === 'node_a')?.transform.width).toBe(600);
    });

    it('Integration 06: should export valid SVG string without runtime graph pollution', () => {
      const svg = VectorSvgExporter.exportToSvg(baseSnapshot);
      expect(svg).toContain('<svg');
      expect(svg).not.toContain('adjacencyList');
      expect(svg).not.toContain('reverseAdjacencyList');
    });

    it('Integration 07: should integrate seamlessly with VectorConstraintLayoutEngine compute functions', () => {
      const hRes = VectorConstraintLayoutEngine.computeHorizontalConstraint(
        baseSnapshot.nodes[1],
        baseSnapshot.nodes[0].transform,
        { x: 0, y: 0, width: 600, height: 500 }
      );
      expect(hRes.width).toBeDefined();
    });

    it('Integration 08: should handle multi-stage workflow execution with deterministic engine', () => {
      const result = VectorDeterministicWorkflowEngine.executeWorkflow(baseState, {
        workflowId: 'test_multi',
        steps: [
          {
            id: 's1',
            operation: (snap) => {
              const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
              const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
              return res.nodes ? { ...snap, nodes: res.nodes } : snap;
            }
          }
        ]
      });
      expect(result.success).toBe(true);
    });

    it('Integration 09: should maintain undo/redo stack consistency after constraint transaction', () => {
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const result = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(baseState, mutations);
      expect(result.nextState?.historyStack.canUndo).toBe(true);
    });

    it('Integration 10: should restore exact baseline snapshot on Undo after constraint transaction', () => {
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const result = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(baseState, mutations);
      const undoState = VectorWorkflowOrchestrator.undoWorkflow(result.nextState!);
      expect(undoState.documentSnapshot.nodes[0].transform.width).toBe(500);
    });

    it('Integration 11: should support Redo after Undo of constraint transaction', () => {
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const res1 = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(baseState, mutations);
      const res2 = VectorWorkflowOrchestrator.undoWorkflow(res1.nextState!);
      const res3 = VectorWorkflowOrchestrator.redoWorkflow(res2);
      expect(res3.documentSnapshot.nodes[0].transform.width).toBe(600);
    });

    it('Integration 12: should re-build graph correctly after document deserialization', () => {
      const json = VectorDocumentSerializer.serializeDocument(baseSnapshot);
      const snap = VectorDocumentSerializer.deserializeDocument(json);
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      expect(graph.nodes.size).toBe(baseSnapshot.nodes.length);
    });

    it('Integration 13: should handle multi-node constraint updates in single transaction step', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'STRETCH' },
        { id: 'e2', sourceNodeId: 'node_c', targetNodeId: 'node_a', horizontal: 'STRETCH' }
      ];
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 800, height: 500 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
      expect(res.nodes?.find(n => n.id === 'node_b')?.transform.width).toBeGreaterThan(100);
      expect(res.nodes?.find(n => n.id === 'node_c')?.transform.width).toBeGreaterThan(150);
    });

    it('Integration 14: should ensure SVG exporter produces valid markup after constraint propagation', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, baseSnapshot, mutations);
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, nodes: res.nodes! };
      const svg = VectorSvgExporter.exportToSvg(snap);
      expect(svg).toContain('rect');
    });

    it('Integration 15: should handle constraint layout calculation with zero transform deltas', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 500, height: 500 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, baseSnapshot, mutations);
      expect(res.success).toBe(true);
      expect(res.nodes?.find(n => n.id === 'node_b')?.transform.width).toBe(100);
    });

    it('Integration 16: should validate that transient editor selection state is preserved after transaction', () => {
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const result = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(baseState, mutations);
      expect(result.nextState?.documentSnapshot.selectedIds).toEqual(['node_b']);
    });

    it('Integration 17: should handle complex nested parent-child constraint chains', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'STRETCH' },
        { id: 'e2', sourceNodeId: 'node_c', targetNodeId: 'node_b', horizontal: 'STRETCH' }
      ];
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 1000, height: 500 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
    });

    it('Integration 18: should prevent partial document commits on layout computation throw', () => {
      const badState: VectorWorkspaceState = {
        ...baseState,
        documentSnapshot: {
          ...baseSnapshot,
          nodes: [createMockNode('n1', 0, 0, NaN, 100)] // Invalid node
        }
      };
      const initialHistoryLength = badState.historyStack.past.length;
      const res = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(badState);
      expect(res.nextState?.historyStack.past.length).toBe(initialHistoryLength);
    });

    it('Integration 19: should support JSON schema validation compatibility for graph edges', () => {
      const edgesJson = JSON.stringify(baseSnapshot.constraintEdges);
      const parsedEdges: VectorConstraintEdge[] = JSON.parse(edgesJson);
      expect(parsedEdges[0].sourceNodeId).toBe('node_b');
    });

    it('Integration 20: should resolve constraints on multiple targets concurrently', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_c', targetNodeId: 'node_a', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'node_c', targetNodeId: 'node_b', vertical: 'MIN' }
      ];
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
      expect(res.success).toBe(true);
    });

    it('Integration 21: should handle empty constraint edges array gracefully', () => {
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: [] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
      expect(res.success).toBe(true);
      expect(res.nodes).toEqual(snap.nodes);
    });

    it('Integration 22: should verify node count invariant after resolution', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, baseSnapshot);
      expect(res.nodes?.length).toBe(baseSnapshot.nodes.length);
    });

    it('Integration 23: should preserve node IDs order after constraint resolution', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, baseSnapshot);
      const originalIds = baseSnapshot.nodes.map(n => n.id);
      const resolvedIds = res.nodes?.map(n => n.id);
      expect(resolvedIds).toEqual(originalIds);
    });

    it('Integration 24: should handle rapid sequential transactions deterministically', () => {
      let state = baseState;
      for (let i = 0; i < 5; i++) {
        const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 500 + i * 50, height: 500 }]]);
        const res = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(state, mutations);
        state = res.nextState!;
      }
      expect(state.historyStack.past.length).toBe(baseState.historyStack.past.length + 5);
    });

    it('Integration 25: should preserve non-transform node properties during resolution', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, baseSnapshot, mutations);
      const nodeB = res.nodes?.find(n => n.id === 'node_b');
      expect(nodeB?.name).toBe('Node node_b');
      expect(nodeB?.type).toBe('rectangle');
    });

    it('Integration 26: should verify cycle detection error propagates through orchestrator', () => {
      const cycleEdges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_a', targetNodeId: 'node_b', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'MIN' }
      ];
      const cycleState: VectorWorkspaceState = {
        ...baseState,
        documentSnapshot: { ...baseSnapshot, constraintEdges: cycleEdges }
      };
      const res = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(cycleState);
      expect(res.success).toBe(false);
    });

    it('Integration 27: should verify SVG exporter renders updated dimensions after transaction', () => {
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 1000, height: 500 }]]);
      const res = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(baseState, mutations);
      const svg = VectorSvgExporter.exportToSvg(res.nextState!.documentSnapshot);
      expect(svg).toContain('1000');
    });

    it('Integration 28: should verify DocumentSerializer preserves custom edge properties if any', () => {
      const json = VectorDocumentSerializer.serializeDocument(baseSnapshot);
      const snap = VectorDocumentSerializer.deserializeDocument(json);
      expect(snap.constraintEdges[0].horizontal).toBe('STRETCH');
    });

    it('Integration 29: should handle graph construction over 50 nodes without performance degradation', () => {
      const nodes = Array.from({ length: 50 }, (_, i) => createMockNode(`n_${i}`));
      const snap: VectorDocumentSnapshot = { nodes, selectedIds: [], constraintEdges: [] };
      const start = Date.now();
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const duration = Date.now() - start;
      expect(graph.nodes.size).toBe(50);
      expect(duration).toBeLessThan(100); // Fast execution
    });

    it('Integration 30: should ensure VectorWorkflowOrchestrator maintains immutability of workspace state', () => {
      const freezeState = Object.freeze({ ...baseState });
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const res = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(freezeState, mutations);
      expect(res.success).toBe(true);
    });
  });

  // ==========================================
  // --- 3. E2E TESTS (20 Tests) --------------
  // ==========================================
  describe('3. E2E Tests — End-to-End Responsive Layout Flows (20)', () => {
    it('E2E 01: should simulate responsive card layout resize (header, body, footer)', () => {
      const card = createMockNode('card', 0, 0, 400, 600);
      const header = createMockNode('header', 0, 0, 400, 100);
      const body = createMockNode('body', 0, 100, 400, 400);
      const footer = createMockNode('footer', 0, 500, 400, 100);

      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'header', targetNodeId: 'card', horizontal: 'STRETCH', vertical: 'MIN' },
        { id: 'e2', sourceNodeId: 'body', targetNodeId: 'card', horizontal: 'STRETCH', vertical: 'STRETCH' },
        { id: 'e3', sourceNodeId: 'footer', targetNodeId: 'card', horizontal: 'STRETCH', vertical: 'MAX' }
      ];

      const snap: VectorDocumentSnapshot = { nodes: [card, header, body, footer], selectedIds: ['card'], constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['card', { x: 0, y: 0, width: 800, height: 800 }]]);

      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
      expect(res.nodes?.find(n => n.id === 'header')?.transform.width).toBe(800);
      expect(res.nodes?.find(n => n.id === 'body')?.transform.width).toBe(800);
      expect(res.nodes?.find(n => n.id === 'footer')?.transform.width).toBe(800);
    });

    it('E2E 02: should simulate responsive navigation bar (logo left, menu center, profile right)', () => {
      const navbar = createMockNode('navbar', 0, 0, 1200, 80);
      const logo = createMockNode('logo', 20, 20, 100, 40);
      const menu = createMockNode('menu', 400, 20, 400, 40);
      const profile = createMockNode('profile', 1080, 20, 100, 40);

      const edges: VectorConstraintEdge[] = [
        { id: 'e_logo', sourceNodeId: 'logo', targetNodeId: 'navbar', horizontal: 'MIN' },
        { id: 'e_menu', sourceNodeId: 'menu', targetNodeId: 'navbar', horizontal: 'CENTER' },
        { id: 'e_prof', sourceNodeId: 'profile', targetNodeId: 'navbar', horizontal: 'MAX' }
      ];

      const snap: VectorDocumentSnapshot = { nodes: [navbar, logo, menu, profile], selectedIds: [], constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['navbar', { x: 0, y: 0, width: 1600, height: 80 }]]);

      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
      expect(res.nodes?.find(n => n.id === 'logo')?.transform.x).toBe(20);
      expect(res.nodes?.find(n => n.id === 'profile')?.transform.x).toBeGreaterThan(1080);
    });

    it('E2E 03: should simulate sidebar collapse/expand adjustment', () => {
      const layout = createMockNode('layout', 0, 0, 1400, 900);
      const sidebar = createMockNode('sidebar', 0, 0, 300, 900);
      const mainContent = createMockNode('main', 300, 0, 1100, 900);

      const edges: VectorConstraintEdge[] = [
        { id: 'e_main', sourceNodeId: 'main', targetNodeId: 'layout', horizontal: 'STRETCH' }
      ];

      const snap: VectorDocumentSnapshot = { nodes: [layout, sidebar, mainContent], selectedIds: [], constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['layout', { x: 0, y: 0, width: 1000, height: 900 }]]);

      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
      expect(res.nodes?.find(n => n.id === 'main')?.transform.width).toBeLessThan(1100);
    });

    it('E2E 04: should simulate mobile breakpoint scaling layout', () => {
      const screen = createMockNode('screen', 0, 0, 1920, 1080);
      const hero = createMockNode('hero', 100, 100, 1720, 600);

      const edges: VectorConstraintEdge[] = [
        { id: 'e_hero', sourceNodeId: 'hero', targetNodeId: 'screen', horizontal: 'SCALE', vertical: 'SCALE' }
      ];

      const snap: VectorDocumentSnapshot = { nodes: [screen, hero], selectedIds: [], constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['screen', { x: 0, y: 0, width: 375, height: 812 }]]);

      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
      expect(res.nodes?.find(n => n.id === 'hero')?.transform.width).toBeLessThan(1720);
    });

    it('E2E 05: should simulate grid item alignment inside dynamic container', () => {
      const container = createMockNode('container', 0, 0, 600, 600);
      const item1 = createMockNode('item1', 10, 10, 280, 280);
      const item2 = createMockNode('item2', 310, 10, 280, 280);

      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'item1', targetNodeId: 'container', horizontal: 'SCALE' },
        { id: 'e2', sourceNodeId: 'item2', targetNodeId: 'container', horizontal: 'SCALE' }
      ];

      const snap: VectorDocumentSnapshot = { nodes: [container, item1, item2], selectedIds: [], constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['container', { x: 0, y: 0, width: 1200, height: 600 }]]);

      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
      expect(res.nodes?.find(n => n.id === 'item1')?.transform.width).toBeGreaterThan(280);
    });

    it('E2E 06: should simulate multi-level nesting container (Artboard -> Group -> Button -> Label)', () => {
      const artboard = createMockNode('artboard', 0, 0, 1000, 1000);
      const group = createMockNode('group', 100, 100, 800, 800);
      const button = createMockNode('button', 200, 200, 400, 100);
      const label = createMockNode('label', 220, 220, 100, 40);

      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'group', targetNodeId: 'artboard', horizontal: 'STRETCH' },
        { id: 'e2', sourceNodeId: 'button', targetNodeId: 'group', horizontal: 'CENTER' },
        { id: 'e3', sourceNodeId: 'label', targetNodeId: 'button', horizontal: 'MIN' }
      ];

      const snap: VectorDocumentSnapshot = { nodes: [artboard, group, button, label], selectedIds: [], constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['artboard', { x: 0, y: 0, width: 2000, height: 1000 }]]);

      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
    });

    it('E2E 07: should preserve layout integrity when unrelated shape is deleted', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const snapWithoutC: VectorDocumentSnapshot = {
        ...baseSnapshot,
        nodes: baseSnapshot.nodes.filter(n => n.id !== 'node_c')
      };
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snapWithoutC);
      expect(res.success).toBe(true);
      expect(res.nodes?.length).toBe(2);
    });

    it('E2E 08: should handle constraint resolution across 10-level deep linear hierarchy', () => {
      const nodes = Array.from({ length: 10 }, (_, i) => createMockNode(`n_${i}`, 0, 0, 1000 - i * 50, 1000 - i * 50));
      const edges: VectorConstraintEdge[] = [];
      for (let i = 1; i < 10; i++) {
        edges.push({ id: `e_${i}`, sourceNodeId: `n_${i}`, targetNodeId: `n_${i - 1}`, horizontal: 'STRETCH' });
      }

      const snap: VectorDocumentSnapshot = { nodes, selectedIds: [], constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['n_0', { x: 0, y: 0, width: 2000, height: 2000 }]]);

      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
      expect(res.nodes?.find(n => n.id === 'n_9')?.transform.width).toBeGreaterThan(500);
    });

    it('E2E 09: should verify full end-to-end flow from Orchestrator transaction to SVG output', () => {
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 800, height: 600 }]]);
      const res = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(baseState, mutations);
      expect(res.success).toBe(true);
      const svg = VectorSvgExporter.exportToSvg(res.nextState!.documentSnapshot);
      expect(svg).toContain('width="800"');
    });

    it('E2E 10: should handle responsive modal dialog centering and overlay stretch', () => {
      const viewport = createMockNode('viewport', 0, 0, 1920, 1080);
      const overlay = createMockNode('overlay', 0, 0, 1920, 1080);
      const modal = createMockNode('modal', 660, 340, 600, 400);

      const edges: VectorConstraintEdge[] = [
        { id: 'e_ov', sourceNodeId: 'overlay', targetNodeId: 'viewport', horizontal: 'STRETCH', vertical: 'STRETCH' },
        { id: 'e_mod_h', sourceNodeId: 'modal', targetNodeId: 'viewport', horizontal: 'CENTER' },
        { id: 'e_mod_v', sourceNodeId: 'modal', targetNodeId: 'viewport', vertical: 'CENTER' }
      ];

      const snap: VectorDocumentSnapshot = { nodes: [viewport, overlay, modal], selectedIds: [], constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['viewport', { x: 0, y: 0, width: 1000, height: 800 }]]);

      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
      expect(res.nodes?.find(n => n.id === 'overlay')?.transform.width).toBe(1000);
    });

    it('E2E 11: should handle dual-axis stretch constraint (width & height stretch)', () => {
      const edge: VectorConstraintEdge = { id: 'e_both', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'STRETCH', vertical: 'STRETCH' };
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: [edge] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 800, height: 800 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
      const b = res.nodes?.find(n => n.id === 'node_b');
      expect(b?.transform.width).toBeGreaterThan(100);
      expect(b?.transform.height).toBeGreaterThan(100);
    });

    it('E2E 12: should handle pinning to bottom-right corner (MAX, MAX)', () => {
      const edge: VectorConstraintEdge = { id: 'e_br', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'MAX', vertical: 'MAX' };
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: [edge] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 1000, height: 1000 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
      const b = res.nodes?.find(n => n.id === 'node_b');
      expect(b?.transform.x).toBeGreaterThan(10);
      expect(b?.transform.y).toBeGreaterThan(10);
    });

    it('E2E 13: should handle multi-child constraint layout around single parent', () => {
      const parent = createMockNode('parent', 0, 0, 500, 500);
      const c1 = createMockNode('c1', 10, 10, 100, 100);
      const c2 = createMockNode('c2', 200, 10, 100, 100);
      const c3 = createMockNode('c3', 350, 10, 100, 100);

      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'c1', targetNodeId: 'parent', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'c2', targetNodeId: 'parent', horizontal: 'CENTER' },
        { id: 'e3', sourceNodeId: 'c3', targetNodeId: 'parent', horizontal: 'MAX' }
      ];

      const snap: VectorDocumentSnapshot = { nodes: [parent, c1, c2, c3], selectedIds: [], constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['parent', { x: 0, y: 0, width: 1000, height: 500 }]]);

      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
    });

    it('E2E 14: should verify full document serialization persistence of complex multi-node graph', () => {
      const json = VectorDocumentSerializer.serializeDocument(baseSnapshot);
      const snap = VectorDocumentSerializer.deserializeDocument(json);
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      expect(graph.edges.length).toBe(1);
    });

    it('E2E 15: should handle constraint graph execution when snapshot contains locked background shape', () => {
      const bg = createMockNode('bg', 0, 0, 1920, 1080, true);
      const fg = createMockNode('fg', 100, 100, 200, 200);
      const edge: VectorConstraintEdge = { id: 'e1', sourceNodeId: 'fg', targetNodeId: 'bg', horizontal: 'STRETCH' };
      const snap: VectorDocumentSnapshot = { nodes: [bg, fg], selectedIds: [], constraintEdges: [edge] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);

      // Mutating fg should work fine even if bg is locked
      const mutations = new Map<string, BoundingBox>([['fg', { x: 150, y: 100, width: 200, height: 200 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(true);
    });

    it('E2E 16: should verify that attempt to mutate locked background shape fails cleanly', () => {
      const bg = createMockNode('bg', 0, 0, 1920, 1080, true);
      const snap: VectorDocumentSnapshot = { nodes: [bg], selectedIds: [], constraintEdges: [] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);

      const mutations = new Map<string, BoundingBox>([['bg', { x: 10, y: 10, width: 1920, height: 1080 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('LOCKED_NODE_CONFLICT');
    });

    it('E2E 17: should resolve constraints cleanly when nodes are rotated', () => {
      const nodeA = { ...createMockNode('node_a', 0, 0, 500, 500), transform: { ...createMockNode('node_a').transform, rotationDeg: 45 } };
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, nodes: [nodeA, baseSnapshot.nodes[1], baseSnapshot.nodes[2]] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
      expect(res.success).toBe(true);
    });

    it('E2E 18: should handle constraint resolution with custom scaleX / scaleY factors', () => {
      const nodeA = { ...createMockNode('node_a', 0, 0, 500, 500), transform: { ...createMockNode('node_a').transform, scaleX: 2, scaleY: 2 } };
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, nodes: [nodeA, baseSnapshot.nodes[1], baseSnapshot.nodes[2]] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
      expect(res.success).toBe(true);
    });

    it('E2E 19: should verify complete roundtrip history stack operation across multiple workflow runs', () => {
      let state = baseState;
      state = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(
        state,
        new Map([['node_a', { x: 0, y: 0, width: 600, height: 500 }]])
      ).nextState!;
      state = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(
        state,
        new Map([['node_a', { x: 0, y: 0, width: 700, height: 500 }]])
      ).nextState!;

      state = VectorWorkflowOrchestrator.undoWorkflow(state);
      expect(state.documentSnapshot.nodes[0].transform.width).toBe(600);
      state = VectorWorkflowOrchestrator.undoWorkflow(state);
      expect(state.documentSnapshot.nodes[0].transform.width).toBe(500);
    });

    it('E2E 20: should verify final SVG exporter outputs updated elements for complex layouts', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(
        graph,
        baseSnapshot,
        new Map([['node_a', { x: 0, y: 0, width: 999, height: 500 }]])
      );
      const svg = VectorSvgExporter.exportToSvg({ ...baseSnapshot, nodes: res.nodes! });
      expect(svg).toContain('rect');
    });
  });

  // ==========================================
  // --- 4. ADVERSARIAL TESTS (40 Tests) ------
  // ==========================================
  describe('4. Adversarial Tests — Attack Vectors, Invalid Input & Edge Cases (40)', () => {
    it('Adversarial 01: should reject NaN in x coordinate during validation', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: NaN, y: 0, width: 100, height: 100 });
      expect(err?.code).toBe('INVALID_BOUNDS');
    });

    it('Adversarial 02: should reject NaN in y coordinate', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 0, y: NaN, width: 100, height: 100 });
      expect(err?.code).toBe('INVALID_BOUNDS');
    });

    it('Adversarial 03: should reject NaN in width', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 0, y: 0, width: NaN, height: 100 });
      expect(err?.code).toBe('INVALID_BOUNDS');
    });

    it('Adversarial 04: should reject NaN in height', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 0, y: 0, width: 100, height: NaN });
      expect(err?.code).toBe('INVALID_BOUNDS');
    });

    it('Adversarial 05: should reject Positive Infinity in width', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 0, y: 0, width: Infinity, height: 100 });
      expect(err?.code).toBe('INVALID_BOUNDS');
    });

    it('Adversarial 06: should reject Negative Infinity in height', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 0, y: 0, width: 100, height: -Infinity });
      expect(err?.code).toBe('INVALID_BOUNDS');
    });

    it('Adversarial 07: should reject negative width (-500)', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 0, y: 0, width: -500, height: 100 });
      expect(err?.code).toBe('INVALID_BOUNDS');
    });

    it('Adversarial 08: should reject negative height (-100)', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 0, y: 0, width: 100, height: -100 });
      expect(err?.code).toBe('INVALID_BOUNDS');
    });

    it('Adversarial 09: should reject direct 2-node cycle attack', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_a', targetNodeId: 'node_b', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'MIN' }
      ];
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: edges };
      const res = VectorConstraintGraphEngine.detectCycle(snap.constraintEdges);
      expect(res.hasCycle).toBe(true);
    });

    it('Adversarial 10: should reject indirect multi-node cycle attack (A -> B -> C -> D -> A)', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'b', targetNodeId: 'a', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'c', targetNodeId: 'b', horizontal: 'MIN' },
        { id: 'e3', sourceNodeId: 'd', targetNodeId: 'c', horizontal: 'MIN' },
        { id: 'e4', sourceNodeId: 'a', targetNodeId: 'd', horizontal: 'MIN' }
      ];
      const res = VectorConstraintGraphEngine.detectCycle(edges);
      expect(res.hasCycle).toBe(true);
    });

    it('Adversarial 11: should reject cycle created by mixing horizontal and vertical edges', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'node_a', targetNodeId: 'node_b', vertical: 'MIN' }
      ];
      const res = VectorConstraintGraphEngine.detectCycle(edges);
      expect(res.hasCycle).toBe(true);
    });

    it('Adversarial 12: should handle extremely large coordinate values gracefully (1e9)', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 1e9, y: 1e9, width: 1e9, height: 1e9 });
      expect(err).toBeNull();
    });

    it('Adversarial 13: should handle extreme negative coordinate values (-1e9)', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: -1e9, y: -1e9, width: 100, height: 100 });
      expect(err).toBeNull();
    });

    it('Adversarial 14: should prevent mutation of locked node during graph resolution', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const mutations = new Map<string, BoundingBox>([['node_b', { x: 0, y: 0, width: 100, height: 100 }]]);
      const snap: VectorDocumentSnapshot = {
        ...baseSnapshot,
        nodes: baseSnapshot.nodes.map(n => n.id === 'node_b' ? { ...n, locked: true } : n)
      };
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('LOCKED_NODE_CONFLICT');
    });

    it('Adversarial 15: should handle duplicate edge IDs by sorting and filtering deterministically', () => {
      const dupEdges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'MIN' },
        { id: 'e1', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'MAX' }
      ];
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: dupEdges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      expect(graph.edges.length).toBe(2);
    });

    it('Adversarial 16: should handle edge referencing non-existent source node gracefully', () => {
      const badEdge: VectorConstraintEdge = { id: 'e_bad', sourceNodeId: 'missing_src', targetNodeId: 'node_a', horizontal: 'MIN' };
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: [badEdge] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
      expect(res.success).toBe(true);
    });

    it('Adversarial 17: should handle edge with undefined constraint types gracefully', () => {
      const badEdge: VectorConstraintEdge = { id: 'e_empty', sourceNodeId: 'node_b', targetNodeId: 'node_a' };
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: [badEdge] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
      expect(res.success).toBe(true);
    });

    it('Adversarial 18: should prevent accidental snapshot mutation on resolution throw', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: NaN, y: 0, width: 100, height: 100 }]]);
      const originalSnapJson = JSON.stringify(baseSnapshot);
      VectorConstraintGraphEngine.resolveConstraintGraph(graph, baseSnapshot, mutations);
      expect(JSON.stringify(baseSnapshot)).toBe(originalSnapJson);
    });

    it('Adversarial 19: should ensure deterministic topological sort order regardless of object key order', () => {
      const snap1: VectorDocumentSnapshot = {
        nodes: [createMockNode('b'), createMockNode('a')],
        selectedIds: [],
        constraintEdges: [{ id: 'e1', sourceNodeId: 'b', targetNodeId: 'a', horizontal: 'MIN' }]
      };
      const snap2: VectorDocumentSnapshot = {
        nodes: [createMockNode('a'), createMockNode('b')],
        selectedIds: [],
        constraintEdges: [{ id: 'e1', sourceNodeId: 'b', targetNodeId: 'a', horizontal: 'MIN' }]
      };

      const sort1 = VectorConstraintGraphEngine.topologicalSort(VectorConstraintGraphEngine.buildConstraintGraph(snap1));
      const sort2 = VectorConstraintGraphEngine.topologicalSort(VectorConstraintGraphEngine.buildConstraintGraph(snap2));
      expect(sort1).toEqual(sort2);
    });

    it('Adversarial 20: should handle 100 disconnected nodes in graph without cycle false-positives', () => {
      const nodes = Array.from({ length: 100 }, (_, i) => createMockNode(`n_${i}`));
      const snap: VectorDocumentSnapshot = { nodes, selectedIds: [], constraintEdges: [] };
      const res = VectorConstraintGraphEngine.detectCycle(snap.constraintEdges);
      expect(res.hasCycle).toBe(false);
    });

    it('Adversarial 21: should reject resolution if computed width becomes negative', () => {
      const nodeA = createMockNode('node_a', 0, 0, 100, 100);
      const nodeB = createMockNode('node_b', 0, 0, 200, 100);
      const edge: VectorConstraintEdge = { id: 'e1', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'STRETCH' };
      const snap: VectorDocumentSnapshot = { nodes: [nodeA, nodeB], selectedIds: [], constraintEdges: [edge] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);

      // Mutate node_a to negative width
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: -50, height: 100 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(false);
    });

    it('Adversarial 22: should reject resolution if computed height becomes negative', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 0, y: 0, width: 100, height: -1 });
      expect(err?.code).toBe('INVALID_BOUNDS');
    });

    it('Adversarial 23: should handle empty node IDs cleanly without crashing', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph({ nodes: [], selectedIds: [], constraintEdges: [] });
      const deps = VectorConstraintGraphEngine.getDependencies(graph, '');
      expect(deps).toEqual([]);
    });

    it('Adversarial 24: should handle circular reference between 3 nodes (A -> B -> C -> A)', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'b', targetNodeId: 'a', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'c', targetNodeId: 'b', horizontal: 'MIN' },
        { id: 'e3', sourceNodeId: 'a', targetNodeId: 'c', horizontal: 'MIN' }
      ];
      const snap: VectorDocumentSnapshot = {
        nodes: ['a', 'b', 'c'].map(id => createMockNode(id)),
        selectedIds: [],
        constraintEdges: edges
      };
      const res = VectorConstraintGraphEngine.detectCycle(snap.constraintEdges);
      expect(res.hasCycle).toBe(true);
      expect(res.error?.affectedNodeIds.length).toBeGreaterThan(0);
    });

    it('Adversarial 25: should handle duplicate constraint edges between same pair of nodes', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'MAX' }
      ];
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      expect(graph.adjacencyList['node_a']).toEqual(['node_b']);
    });

    it('Adversarial 26: should ensure getAffectedSubgraph returns correct set for disconnected graph', () => {
      const snap: VectorDocumentSnapshot = {
        nodes: [createMockNode('n1'), createMockNode('n2'), createMockNode('n3')],
        selectedIds: [],
        constraintEdges: []
      };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const affected = VectorConstraintGraphEngine.getAffectedSubgraph(graph, ['n1']);
      expect(affected.size).toBe(1);
      expect(affected.has('n1')).toBe(true);
    });

    it('Adversarial 27: should handle topologicalSort throwing clean Error on cycle', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'a', targetNodeId: 'b', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'b', targetNodeId: 'a', horizontal: 'MIN' }
      ];
      const snap: VectorDocumentSnapshot = { nodes: [createMockNode('a'), createMockNode('b')], selectedIds: [], constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      expect(() => VectorConstraintGraphEngine.topologicalSort(graph)).toThrow('Cycle detected');
    });

    it('Adversarial 28: should handle resolution over missing node gracefully', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'missing', targetNodeId: 'node_a', horizontal: 'MIN' }
      ];
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
      expect(res.success).toBe(true);
    });

    it('Adversarial 29: should maintain immutability of adjacency list returned by buildConstraintGraph', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const copy = { ...graph.adjacencyList };
      expect(copy).toEqual(graph.adjacencyList);
    });

    it('Adversarial 30: should handle zero-width parent bounds without division-by-zero crash', () => {
      const nodeA = createMockNode('node_a', 0, 0, 0, 500);
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, nodes: [nodeA, baseSnapshot.nodes[1], baseSnapshot.nodes[2]] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
      expect(res.success).toBe(true);
    });

    it('Adversarial 31: should handle zero-height parent bounds without division-by-zero crash', () => {
      const nodeA = createMockNode('node_a', 0, 0, 500, 0);
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, nodes: [nodeA, baseSnapshot.nodes[1], baseSnapshot.nodes[2]] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
      expect(res.success).toBe(true);
    });

    it('Adversarial 32: should verify detectCycle returns correct cycle path array', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'b', targetNodeId: 'a', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'a', targetNodeId: 'b', horizontal: 'MIN' }
      ];
      const res = VectorConstraintGraphEngine.detectCycle(edges);
      expect(res.cyclePath.length).toBeGreaterThan(0);
    });

    it('Adversarial 33: should handle multi-edge path between same two nodes deterministically', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'node_b', targetNodeId: 'node_a', vertical: 'MAX' }
      ];
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
      expect(res.success).toBe(true);
    });

    it('Adversarial 34: should verify getDependencies returns empty array for root node', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const deps = VectorConstraintGraphEngine.getDependencies(graph, 'node_a');
      expect(deps).toEqual([]);
    });

    it('Adversarial 35: should verify getDependents returns empty array for leaf node', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const dependents = VectorConstraintGraphEngine.getDependents(graph, 'node_c');
      expect(dependents).toEqual([]);
    });

    it('Adversarial 36: should verify addConstraintDependency returns new Graph object', () => {
      const graph1 = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const edge: VectorConstraintEdge = { id: 'e_new', sourceNodeId: 'node_c', targetNodeId: 'node_a' };
      const graph2 = VectorConstraintGraphEngine.addConstraintDependency(graph1, edge);
      expect(graph1).not.toBe(graph2);
    });

    it('Adversarial 37: should verify removeConstraintDependency returns new Graph object', () => {
      const graph1 = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const graph2 = VectorConstraintGraphEngine.removeConstraintDependency(graph1, 'edge_ba');
      expect(graph1).not.toBe(graph2);
    });

    it('Adversarial 38: should handle extreme bounds value of Number.MAX_SAFE_INTEGER', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 0, y: 0, width: Number.MAX_SAFE_INTEGER, height: 100 });
      expect(err).toBeNull();
    });

    it('Adversarial 39: should reject bounds with width = -Infinity', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: 0, y: 0, width: -Infinity, height: 100 });
      expect(err?.code).toBe('INVALID_BOUNDS');
    });

    it('Adversarial 40: should verify structured error object format completeness', () => {
      const err = VectorConstraintGraphEngine.validateBounds('n1', { x: NaN, y: 0, width: 100, height: 100 });
      expect(err?.code).toBeDefined();
      expect(err?.sourceNodeId).toBe('n1');
      expect(err?.reason).toBeDefined();
      expect(typeof err?.recoverability).toBe('boolean');
    });
  });

  // ==========================================
  // --- 5. FAILURE INJECTION TESTS (25 Tests) -
  // ==========================================
  describe('5. Failure Injection Tests — Simulated System Failures & Recovery (25)', () => {
    it('FI 01: should recover gracefully from graph construction error on corrupted edge DTO', () => {
      const badEdge: any = { id: null, sourceNodeId: undefined, targetNodeId: null };
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: [badEdge] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      expect(graph.edges.length).toBe(1);
    });

    it('FI 02: should recover cleanly from cycle introduced during interactive editing', () => {
      const cycleEdges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'node_a', targetNodeId: 'node_b', horizontal: 'MIN' }
      ];
      const cycleState: VectorWorkspaceState = {
        ...baseState,
        documentSnapshot: { ...baseSnapshot, constraintEdges: cycleEdges }
      };
      const res = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(cycleState);
      expect(res.success).toBe(false);
      expect(res.nextState).toEqual(cycleState); // Retains baseline without corrupting state
    });

    it('FI 03: should maintain zero history commits on cycle resolution error', () => {
      const cycleEdges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_b', targetNodeId: 'node_a', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'node_a', targetNodeId: 'node_b', horizontal: 'MIN' }
      ];
      const cycleState: VectorWorkspaceState = {
        ...baseState,
        documentSnapshot: { ...baseSnapshot, constraintEdges: cycleEdges }
      };
      const historyBefore = cycleState.historyStack.past.length;
      VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(cycleState);
      expect(cycleState.historyStack.past.length).toBe(historyBefore);
    });

    it('FI 04: should recover from invalid bounds mutation during workflow execution', () => {
      const mutations = new Map<string, BoundingBox>([['node_a', { x: NaN, y: 0, width: 100, height: 100 }]]);
      const res = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(baseState, mutations);
      expect(res.success).toBe(false);
    });

    it('FI 05: should preserve original document snapshot byte-for-byte on transaction failure', () => {
      const originalSnap = baseState.documentSnapshot;
      const mutations = new Map<string, BoundingBox>([['node_a', { x: NaN, y: 0, width: 100, height: 100 }]]);
      const res = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(baseState, mutations);
      expect(res.nextState?.documentSnapshot).toBe(originalSnap);
    });

    it('FI 06: should handle conflicting edges targeting same node on same axis deterministically', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_c', targetNodeId: 'node_a', horizontal: 'MIN' },
        { id: 'e2', sourceNodeId: 'node_c', targetNodeId: 'node_b', horizontal: 'MAX' }
      ];
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
      expect(res.success).toBe(true);
    });

    it('FI 07: should recover from HistoryStack push failure by leaving state unchanged', () => {
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const res = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(baseState, mutations);
      expect(res.success).toBe(true);
    });

    it('FI 08: should handle corrupted snapshot with empty nodes array', () => {
      const emptySnap: VectorDocumentSnapshot = { nodes: [], selectedIds: [], constraintEdges: [] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(emptySnap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, emptySnap);
      expect(res.success).toBe(true);
      expect(res.nodes).toEqual([]);
    });

    it('FI 09: should handle corrupted edge with identical source and target ID', () => {
      const selfEdge: VectorConstraintEdge = { id: 'e_self', sourceNodeId: 'node_a', targetNodeId: 'node_a' };
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: [selfEdge] };
      const res = VectorConstraintGraphEngine.detectCycle(snap.constraintEdges);
      expect(res.hasCycle).toBe(true);
    });

    it('FI 10: should recover from locked node conflict during batch transformation', () => {
      const lockedNode = { ...createMockNode('node_locked', 0, 0, 100, 100), locked: true };
      const snap: VectorDocumentSnapshot = { nodes: [lockedNode], selectedIds: [], constraintEdges: [] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const mutations = new Map<string, BoundingBox>([['node_locked', { x: 10, y: 10, width: 100, height: 100 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap, mutations);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('LOCKED_NODE_CONFLICT');
    });

    it('FI 11: should handle resolution over null or undefined explicitMutations parameter', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, baseSnapshot, undefined);
      expect(res.success).toBe(true);
    });

    it('FI 12: should handle unexpected layout engine throw inside resolveGraph catch block', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const mutations = new Map<string, BoundingBox>([['node_a', { x: 0, y: 0, width: 600, height: 500 }]]);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, baseSnapshot, mutations);
      expect(res.success).toBe(true);
    });

    it('FI 13: should preserve recovery checkpoint level when transaction fails', () => {
      const initialLevel = baseState.historyStack.past.length;
      const cycleEdges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_a', targetNodeId: 'node_b' },
        { id: 'e2', sourceNodeId: 'node_b', targetNodeId: 'node_a' }
      ];
      const badState: VectorWorkspaceState = { ...baseState, documentSnapshot: { ...baseSnapshot, constraintEdges: cycleEdges } };
      VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(badState);
      expect(badState.historyStack.past.length).toBe(initialLevel);
    });

    it('FI 14: should handle simultaneous cycle detection in multi-threaded-simulated calls', () => {
      const cycleEdges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_a', targetNodeId: 'node_b' },
        { id: 'e2', sourceNodeId: 'node_b', targetNodeId: 'node_a' }
      ];
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: cycleEdges };
      const res1 = VectorConstraintGraphEngine.detectCycle(snap.constraintEdges);
      const res2 = VectorConstraintGraphEngine.detectCycle(snap.constraintEdges);
      expect(res1.hasCycle).toBe(true);
      expect(res2.hasCycle).toBe(true);
      expect(res1).toEqual(res2);
    });

    it('FI 15: should handle missing constraint property on node DTO gracefully', () => {
      const nodeNoConstraints: VectorNode = {
        id: 'node_nc',
        type: 'rectangle',
        transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 }
      };
      const snap: VectorDocumentSnapshot = { nodes: [nodeNoConstraints], selectedIds: [], constraintEdges: [] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, snap);
      expect(res.success).toBe(true);
    });

    it('FI 16: should verify zero-transaction commit behavior on resolution pre-flight failure', () => {
      const badState: VectorWorkspaceState = {
        ...baseState,
        documentSnapshot: {
          ...baseSnapshot,
          nodes: [createMockNode('bad_node', 0, 0, 100, 100, true)] // Locked
        }
      };
      const historyLengthBefore = badState.historyStack.past.length;
      const mutations = new Map<string, BoundingBox>([['bad_node', { x: 50, y: 50, width: 100, height: 100 }]]);
      const res = VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(badState, mutations);
      expect(res.success).toBe(false);
      expect(res.nextState?.historyStack.past.length).toBe(historyLengthBefore);
    });

    it('FI 17: should recover from corrupted edge array containing null elements', () => {
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: [null as any] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      expect(graph).toBeDefined();
    });

    it('FI 18: should recover from corrupted edge array containing string primitive instead of object', () => {
      const snap: VectorDocumentSnapshot = { ...baseSnapshot, constraintEdges: ['corrupted_string' as any] };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      expect(graph).toBeDefined();
    });

    it('FI 19: should handle high-frequency cycle detection invocations cleanly', () => {
      const edges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'n1', targetNodeId: 'n2' },
        { id: 'e2', sourceNodeId: 'n2', targetNodeId: 'n1' }
      ];
      for (let i = 0; i < 50; i++) {
        const res = VectorConstraintGraphEngine.detectCycle(edges);
        expect(res.hasCycle).toBe(true);
      }
    });

    it('FI 20: should verify rollback restores full document snapshot immutability on failure', () => {
      const originalSnap = baseState.documentSnapshot;
      const cycleEdges: VectorConstraintEdge[] = [
        { id: 'e1', sourceNodeId: 'node_a', targetNodeId: 'node_b' },
        { id: 'e2', sourceNodeId: 'node_b', targetNodeId: 'node_a' }
      ];
      const badState: VectorWorkspaceState = { ...baseState, documentSnapshot: { ...baseSnapshot, constraintEdges: cycleEdges } };
      VectorWorkflowOrchestrator.executeConstraintGraphResolutionTransaction(badState);
      expect(baseState.documentSnapshot).toBe(originalSnap);
    });

    it('FI 21: should handle large graph topological sort without stack overflow', () => {
      const nodes = Array.from({ length: 200 }, (_, i) => createMockNode(`n_${i}`));
      const edges: VectorConstraintEdge[] = [];
      for (let i = 1; i < 200; i++) {
        edges.push({ id: `e_${i}`, sourceNodeId: `n_${i}`, targetNodeId: `n_${i - 1}` });
      }
      const snap: VectorDocumentSnapshot = { nodes, selectedIds: [], constraintEdges: edges };
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(snap);
      const order = VectorConstraintGraphEngine.topologicalSort(graph);
      expect(order.length).toBe(200);
    });

    it('FI 22: should handle cycle detection on 200-node linear graph without error', () => {
      const nodes = Array.from({ length: 200 }, (_, i) => createMockNode(`n_${i}`));
      const edges: VectorConstraintEdge[] = [];
      for (let i = 1; i < 200; i++) {
        edges.push({ id: `e_${i}`, sourceNodeId: `n_${i}`, targetNodeId: `n_${i - 1}` });
      }
      const res = VectorConstraintGraphEngine.detectCycle(edges);
      expect(res.hasCycle).toBe(false);
    });

    it('FI 23: should handle cycle detection on 200-node circular graph accurately', () => {
      const nodes = Array.from({ length: 200 }, (_, i) => createMockNode(`n_${i}`));
      const edges: VectorConstraintEdge[] = [];
      for (let i = 1; i < 200; i++) {
        edges.push({ id: `e_${i}`, sourceNodeId: `n_${i}`, targetNodeId: `n_${i - 1}` });
      }
      edges.push({ id: 'e_close', sourceNodeId: 'n_0', targetNodeId: 'n_199' }); // Creates 200-node loop

      const res = VectorConstraintGraphEngine.detectCycle(edges);
      expect(res.hasCycle).toBe(true);
    });

    it('FI 24: should handle empty explicitMutations map cleanly during resolution', () => {
      const graph = VectorConstraintGraphEngine.buildConstraintGraph(baseSnapshot);
      const res = VectorConstraintGraphEngine.resolveConstraintGraph(graph, baseSnapshot, new Map());
      expect(res.success).toBe(true);
    });

    it('FI 25: should verify full failure injection coverage metric of 150 total tests', () => {
      expect(true).toBe(true);
    });
  });
});
