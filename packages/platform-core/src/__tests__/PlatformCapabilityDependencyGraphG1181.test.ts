/**
 * G1-181: Platform Capability Dependency Graph — Test Suite
 *
 * Covers graph construction, circular dependency detection, topological
 * ordering, domain bucketing, isolated capability detection, and edge cases.
 *
 * Minimum 50 tests as specified.
 */

import { describe, it, expect } from 'vitest';
import {
  PlatformCapabilityDependencyGraph,
  DomainCategory,
  CapabilityDependencyNode,
} from '../PlatformCapabilityDependencyGraph';

describe('PlatformCapabilityDependencyGraph', () => {
  // ──────────────────────────────────────────────────────────────
  // Graph construction correctness (tests 1-12)
  // ──────────────────────────────────────────────────────────────

  it('1: buildGraph creates a graph with all 76 packages', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    expect(graph.getAllPackages()).toHaveLength(76);
  });

  it('2: buildGraph includes platform-core', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    expect(graph.getAllPackages()).toContain('platform-core');
  });

  it('3: buildGraph includes commerce-engine', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    expect(graph.getAllPackages()).toContain('commerce-engine');
  });

  it('4: getNode returns correct node for ui-core', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const node = graph.getNode('ui-core');
    expect(node).toBeDefined();
    expect(node!.packageName).toBe('ui-core');
    expect(node!.domainCategory).toBe('content');
  });

  it('5: getNode returns correct domain for platform-core', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const node = graph.getNode('platform-core');
    expect(node!.domainCategory).toBe('platform');
  });

  it('6: getNode returns correct domain for security', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const node = graph.getNode('security');
    expect(node!.domainCategory).toBe('security');
  });

  it('7: getNode returns correct domain for ai-layer', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const node = graph.getNode('ai-layer');
    expect(node!.domainCategory).toBe('ai');
  });

  it('8: getNode returns undefined for unknown package', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    expect(graph.getNode('nonexistent-package')).toBeUndefined();
  });

  it('9: buildGraph detects ui-core -> design-tokens workspace dependency', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const deps = graph.getDependencies('ui-core');
    expect(deps).toContain('design-tokens');
  });

  it('10: buildGraph detects docgen -> design-tokens import dependency', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const deps = graph.getDependencies('docgen');
    expect(deps).toContain('design-tokens');
  });

  it('11: buildGraph populates dependedBy for design-tokens', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const dependents = graph.getDependents('design-tokens');
    expect(dependents).toContain('ui-core');
    expect(dependents).toContain('docgen');
  });

  it('12: fromData creates graph from explicit data', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'a', domainCategory: 'platform', dependsOn: ['b'] },
      { packageName: 'b', domainCategory: 'security', dependsOn: [] },
    ]);
    expect(graph.getAllPackages()).toHaveLength(2);
    expect(graph.getDependencies('a')).toEqual(['b']);
    expect(graph.getDependents('b')).toEqual(['a']);
  });

  // ──────────────────────────────────────────────────────────────
  // Circular dependency detection (tests 13-22)
  // ──────────────────────────────────────────────────────────────

  it('13: no circular dependencies in the real monorepo graph', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    expect(graph.getCircularDependencies()).toHaveLength(0);
  });

  it('14: detects a direct two-node cycle', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'x', domainCategory: 'platform', dependsOn: ['y'] },
      { packageName: 'y', domainCategory: 'platform', dependsOn: ['x'] },
    ]);
    const cycles = graph.getCircularDependencies();
    expect(cycles.length).toBeGreaterThanOrEqual(1);
  });

  it('15: detects a three-node cycle', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'a', domainCategory: 'ai', dependsOn: ['b'] },
      { packageName: 'b', domainCategory: 'ai', dependsOn: ['c'] },
      { packageName: 'c', domainCategory: 'ai', dependsOn: ['a'] },
    ]);
    const cycles = graph.getCircularDependencies();
    expect(cycles.length).toBeGreaterThanOrEqual(1);
  });

  it('16: no cycles in acyclic graph', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'a', domainCategory: 'platform', dependsOn: ['b'] },
      { packageName: 'b', domainCategory: 'platform', dependsOn: ['c'] },
      { packageName: 'c', domainCategory: 'platform', dependsOn: [] },
    ]);
    expect(graph.getCircularDependencies()).toHaveLength(0);
  });

  it('17: no cycles in empty graph', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([]);
    expect(graph.getCircularDependencies()).toHaveLength(0);
  });

  it('18: no cycles in single-node graph', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'solo', domainCategory: 'other', dependsOn: [] },
    ]);
    expect(graph.getCircularDependencies()).toHaveLength(0);
  });

  it('19: no cycles for self-referencing node detected as cycle', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'self', domainCategory: 'other', dependsOn: ['self'] },
    ]);
    const cycles = graph.getCircularDependencies();
    expect(cycles.length).toBeGreaterThanOrEqual(1);
  });

  it('20: multiple independent cycles are all detected', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'a1', domainCategory: 'ai', dependsOn: ['b1'] },
      { packageName: 'b1', domainCategory: 'ai', dependsOn: ['a1'] },
      { packageName: 'a2', domainCategory: 'ai', dependsOn: ['b2'] },
      { packageName: 'b2', domainCategory: 'ai', dependsOn: ['a2'] },
    ]);
    const cycles = graph.getCircularDependencies();
    expect(cycles.length).toBeGreaterThanOrEqual(2);
  });

  it('21: cycle path includes all involved nodes', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'p', domainCategory: 'platform', dependsOn: ['q'] },
      { packageName: 'q', domainCategory: 'platform', dependsOn: ['r'] },
      { packageName: 'r', domainCategory: 'platform', dependsOn: ['p'] },
    ]);
    const cycles = graph.getCircularDependencies();
    expect(cycles.length).toBeGreaterThanOrEqual(1);
    const cycle = cycles[0];
    expect(cycle).toContain('p');
    expect(cycle).toContain('q');
    expect(cycle).toContain('r');
  });

  it('22: diamond dependency has no cycles', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'top', domainCategory: 'platform', dependsOn: ['left', 'right'] },
      { packageName: 'left', domainCategory: 'platform', dependsOn: ['bottom'] },
      { packageName: 'right', domainCategory: 'platform', dependsOn: ['bottom'] },
      { packageName: 'bottom', domainCategory: 'platform', dependsOn: [] },
    ]);
    expect(graph.getCircularDependencies()).toHaveLength(0);
  });

  // ──────────────────────────────────────────────────────────────
  // Topological ordering validation (tests 23-32)
  // ──────────────────────────────────────────────────────────────

  it('23: topological order includes all packages', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const order = graph.getTopologicalOrder();
    expect(order).toHaveLength(76);
  });

  it('24: topological order has no duplicates', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const order = graph.getTopologicalOrder();
    expect(new Set(order).size).toBe(order.length);
  });

  it('25: in topological order, design-tokens comes before ui-core', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const order = graph.getTopologicalOrder();
    const dtIndex = order.indexOf('design-tokens');
    const uiIndex = order.indexOf('ui-core');
    expect(dtIndex).toBeLessThan(uiIndex);
  });

  it('26: topological order for acyclic small graph is correct', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'a', domainCategory: 'platform', dependsOn: ['b'] },
      { packageName: 'b', domainCategory: 'platform', dependsOn: ['c'] },
      { packageName: 'c', domainCategory: 'platform', dependsOn: [] },
    ]);
    const order = graph.getTopologicalOrder();
    expect(order.indexOf('c')).toBeLessThan(order.indexOf('b'));
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('a'));
  });

  it('27: topological order for empty graph is empty', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([]);
    expect(graph.getTopologicalOrder()).toEqual([]);
  });

  it('28: topological order for single node is that node', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'only', domainCategory: 'other', dependsOn: [] },
    ]);
    expect(graph.getTopologicalOrder()).toEqual(['only']);
  });

  it('29: topological order throws on circular dependencies', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'x', domainCategory: 'platform', dependsOn: ['y'] },
      { packageName: 'y', domainCategory: 'platform', dependsOn: ['x'] },
    ]);
    expect(() => graph.getTopologicalOrder()).toThrow(
      'Cannot produce topological order',
    );
  });

  it('30: disconnected nodes are all included in topological order', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'a', domainCategory: 'ai', dependsOn: [] },
      { packageName: 'b', domainCategory: 'ai', dependsOn: [] },
      { packageName: 'c', domainCategory: 'ai', dependsOn: [] },
    ]);
    const order = graph.getTopologicalOrder();
    expect(order).toHaveLength(3);
    expect(order.sort()).toEqual(['a', 'b', 'c']);
  });

  it('31: parallel branches are both respected in topological order', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'root', domainCategory: 'platform', dependsOn: ['l1', 'r1'] },
      { packageName: 'l1', domainCategory: 'platform', dependsOn: ['leaf'] },
      { packageName: 'r1', domainCategory: 'platform', dependsOn: ['leaf'] },
      { packageName: 'leaf', domainCategory: 'platform', dependsOn: [] },
    ]);
    const order = graph.getTopologicalOrder();
    expect(order.indexOf('leaf')).toBeLessThan(order.indexOf('l1'));
    expect(order.indexOf('leaf')).toBeLessThan(order.indexOf('r1'));
    expect(order.indexOf('l1')).toBeLessThan(order.indexOf('root'));
    expect(order.indexOf('r1')).toBeLessThan(order.indexOf('root'));
  });

  it('32: topological order places packages with deps after their dependencies', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const order = graph.getTopologicalOrder();
    const dtIndex = order.indexOf('design-tokens');
    const docgenIndex = order.indexOf('docgen');
    expect(dtIndex).toBeLessThan(docgenIndex);
  });

  // ──────────────────────────────────────────────────────────────
  // Domain bucketing (tests 33-42)
  // ──────────────────────────────────────────────────────────────

  it('33: getDomainBuckets returns all domain categories', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const buckets = graph.getDomainBuckets();
    const expectedCategories: DomainCategory[] = [
      'commerce', 'platform', 'tenant', 'security', 'observability',
      'content', 'testing', 'build', 'ui', 'ai', 'devtools', 'other',
    ];
    for (const cat of expectedCategories) {
      expect(buckets).toHaveProperty(cat);
    }
  });

  it('34: commerce bucket contains commerce-engine', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const buckets = graph.getDomainBuckets();
    expect(buckets.commerce).toContain('commerce-engine');
  });

  it('35: platform bucket contains platform-core and runtime-core', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const buckets = graph.getDomainBuckets();
    expect(buckets.platform).toContain('platform-core');
    expect(buckets.platform).toContain('runtime-core');
  });

  it('36: security bucket contains security, security-intelligence, platform-security-intelligence', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const buckets = graph.getDomainBuckets();
    expect(buckets.security).toContain('security');
    expect(buckets.security).toContain('security-intelligence');
    expect(buckets.security).toContain('platform-security-intelligence');
  });

  it('37: ai bucket has many packages', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const buckets = graph.getDomainBuckets();
    expect(buckets.ai.length).toBeGreaterThanOrEqual(10);
  });

  it('38: tenant bucket contains only tenant-admin', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const buckets = graph.getDomainBuckets();
    expect(buckets.tenant).toEqual(['tenant-admin']);
  });

  it('39: all 76 packages are assigned to exactly one domain bucket', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const buckets = graph.getDomainBuckets();
    const totalInBuckets = Object.values(buckets).reduce(
      (sum, arr) => sum + arr.length,
      0,
    );
    expect(totalInBuckets).toBe(76);
  });

  it('40: each domain bucket is sorted alphabetically', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const buckets = graph.getDomainBuckets();
    for (const [cat, pkgs] of Object.entries(buckets)) {
      const sorted = [...pkgs].sort();
      expect(pkgs).toEqual(sorted);
    }
  });

  it('41: fromData respects domain classification', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'x', domainCategory: 'commerce', dependsOn: [] },
      { packageName: 'y', domainCategory: 'security', dependsOn: [] },
    ]);
    const buckets = graph.getDomainBuckets();
    expect(buckets.commerce).toEqual(['x']);
    expect(buckets.security).toEqual(['y']);
  });

  it('42: observability bucket includes runtime-observability, performance-intelligence, reliability', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const buckets = graph.getDomainBuckets();
    expect(buckets.observability).toContain('runtime-observability');
    expect(buckets.observability).toContain('performance-intelligence');
    expect(buckets.observability).toContain('reliability');
  });

  // ──────────────────────────────────────────────────────────────
  // Isolated capability detection (tests 43-48)
  // ──────────────────────────────────────────────────────────────

  it('43: isolated packages have no dependsOn and no dependedBy', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const isolated = graph.getIsolatedCapabilities();
    for (const pkg of isolated) {
      const node = graph.getNode(pkg)!;
      expect(node.dependsOn).toHaveLength(0);
      expect(node.dependedBy).toHaveLength(0);
    }
  });

  it('44: platform-core is isolated (no workspace deps, no dependents)', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const isolated = graph.getIsolatedCapabilities();
    expect(isolated).toContain('platform-core');
  });

  it('45: ui-core is NOT isolated (depends on design-tokens)', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const isolated = graph.getIsolatedCapabilities();
    expect(isolated).not.toContain('ui-core');
  });

  it('46: design-tokens is NOT isolated (depended on by ui-core and docgen)', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const isolated = graph.getIsolatedCapabilities();
    expect(isolated).not.toContain('design-tokens');
  });

  it('47: isolated list is sorted alphabetically', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const isolated = graph.getIsolatedCapabilities();
    const sorted = [...isolated].sort();
    expect(isolated).toEqual(sorted);
  });

  it('48: fromData with single node with no deps returns it as isolated', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'lonely', domainCategory: 'other', dependsOn: [] },
    ]);
    expect(graph.getIsolatedCapabilities()).toEqual(['lonely']);
  });

  // ──────────────────────────────────────────────────────────────
  // Edge cases (tests 49-55)
  // ──────────────────────────────────────────────────────────────

  it('49: empty graph has zero packages', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([]);
    expect(graph.getAllPackages()).toHaveLength(0);
  });

  it('50: empty graph topological order is empty', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([]);
    expect(graph.getTopologicalOrder()).toEqual([]);
  });

  it('51: empty graph export has zero nodes and edges', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([]);
    const json = graph.exportGraphAsJson();
    expect(json.nodes).toHaveLength(0);
    expect(json.edges).toHaveLength(0);
    expect(json.metadata.totalPackages).toBe(0);
    expect(json.metadata.totalEdges).toBe(0);
  });

  it('52: getDependencies returns empty array for unknown package', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    expect(graph.getDependencies('nonexistent')).toEqual([]);
  });

  it('53: getDependents returns empty array for unknown package', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    expect(graph.getDependents('nonexistent')).toEqual([]);
  });

  it('54: single node with self-dependency is detected as circular', () => {
    const graph = PlatformCapabilityDependencyGraph.fromData([
      { packageName: 'loop', domainCategory: 'other', dependsOn: ['loop'] },
    ]);
    const cycles = graph.getCircularDependencies();
    expect(cycles.length).toBeGreaterThanOrEqual(1);
  });

  it('55: exportGraphAsJson includes metadata', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const json = graph.exportGraphAsJson();
    expect(json.metadata).toBeDefined();
    expect(json.metadata.totalPackages).toBe(76);
    expect(typeof json.metadata.totalEdges).toBe('number');
    expect(Array.isArray(json.metadata.circularDependencies)).toBe(true);
    expect(typeof json.metadata.domainBuckets).toBe('object');
  });

  // ──────────────────────────────────────────────────────────────
  // Additional structural validation (tests 56-60)
  // ──────────────────────────────────────────────────────────────

  it('56: getNode for all packages returns valid domain category', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const validDomains: DomainCategory[] = [
      'commerce', 'platform', 'tenant', 'security', 'observability',
      'content', 'testing', 'build', 'ui', 'ai', 'devtools', 'other',
    ];
    for (const pkg of graph.getAllPackages()) {
      const node = graph.getNode(pkg)!;
      expect(validDomains).toContain(node.domainCategory);
    }
  });

  it('57: dependsOn arrays never contain the package itself (except self-ref test)', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    for (const pkg of graph.getAllPackages()) {
      const deps = graph.getDependencies(pkg);
      expect(deps).not.toContain(pkg);
    }
  });

  it('58: dependedBy for a package matches reverse of dependsOn', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const designTokensDependents = graph.getDependents('design-tokens');
    for (const pkg of designTokensDependents) {
      const deps = graph.getDependencies(pkg);
      expect(deps).toContain('design-tokens');
    }
  });

  it('59: exportGraphAsJson edges match dependsOn data', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const json = graph.exportGraphAsJson();
    const edgesByFrom = new Map<string, string[]>();
    for (const edge of json.edges) {
      const existing = edgesByFrom.get(edge.from) ?? [];
      existing.push(edge.to);
      edgesByFrom.set(edge.from, existing);
    }
    for (const pkg of graph.getAllPackages()) {
      const deps = graph.getDependencies(pkg);
      const edgeDeps = edgesByFrom.get(pkg) ?? [];
      expect(edgeDeps.sort()).toEqual(deps.sort());
    }
  });

  it('60: isolated capabilities in real graph are majority of packages', () => {
    const graph = PlatformCapabilityDependencyGraph.buildGraph();
    const isolated = graph.getIsolatedCapabilities();
    expect(isolated.length).toBeGreaterThan(70);
  });
});
