/**
 * DependencyGraphViewer.ts — Sprint S1 Dependency Graph Viewer Model (ETAP 1)
 *
 * Dependency graph visualization models for module and asset dependencies in DevTools.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface GraphNode {
  readonly id: string;
  readonly label: string;
  readonly group: string;
}

export interface GraphEdge {
  readonly sourceId: string;
  readonly targetId: string;
  readonly relation: string;
}

export interface DependencyGraphView {
  readonly nodes: ReadonlyArray<GraphNode>;
  readonly edges: ReadonlyArray<GraphEdge>;
}

export function buildStudioDependencyGraphView(): DependencyGraphView {
  const nodes: GraphNode[] = [
    { id: 'builder-core', label: 'Builder Core Engine', group: 'core' },
    { id: 'inspector', label: 'Inspector 2.0', group: 'studio' },
    { id: 'timeline', label: 'Timeline Editor', group: 'studio' },
    { id: 'preview', label: 'Preview Runtime', group: 'studio' },
    { id: 'production', label: 'Production Pipeline', group: 'studio' },
    { id: 'assets', label: 'Asset Management', group: 'studio' },
    { id: 'plugins', label: 'Plugin SDK', group: 'studio' },
    { id: 'cloud', label: 'Cloud Collaboration', group: 'studio' },
    { id: 'automation', label: 'Automation & AI', group: 'studio' },
    { id: 'enterprise', label: 'Enterprise Services', group: 'studio' },
    { id: 'integration', label: 'Studio Integration', group: 'studio' },
    { id: 'beta', label: 'Beta Readiness', group: 'studio' },
    { id: 'devtools', label: 'Developer Tools', group: 'tooling' },
  ];

  const edges: GraphEdge[] = [
    { sourceId: 'integration', targetId: 'timeline', relation: 'coordinates' },
    { sourceId: 'integration', targetId: 'inspector', relation: 'coordinates' },
    { sourceId: 'integration', targetId: 'preview', relation: 'coordinates' },
    { sourceId: 'integration', targetId: 'assets', relation: 'coordinates' },
    { sourceId: 'integration', targetId: 'production', relation: 'coordinates' },
    { sourceId: 'integration', targetId: 'cloud', relation: 'coordinates' },
    { sourceId: 'integration', targetId: 'automation', relation: 'coordinates' },
    { sourceId: 'integration', targetId: 'enterprise', relation: 'coordinates' },
    { sourceId: 'devtools', targetId: 'integration', relation: 'inspects' },
  ];

  return { nodes, edges };
}
