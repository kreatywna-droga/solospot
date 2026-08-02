import { KnowledgeGraph, KnowledgeNode } from '../model/KnowledgeModel';

export class KnowledgeQueryEngine {
  constructor(private graph: KnowledgeGraph) {}

  public findDependencies(nodeId: string): KnowledgeNode[] {
    const depIds = this.graph.edges
      .filter(e => e.sourceId === nodeId)
      .map(e => e.targetId);
    
    return depIds
      .map(id => this.graph.nodes.get(id))
      .filter((n): n is KnowledgeNode => n !== undefined);
  }

  public findReferences(nodeId: string): KnowledgeNode[] {
    const refIds = this.graph.edges
      .filter(e => e.targetId === nodeId)
      .map(e => e.sourceId);

    return refIds
      .map(id => this.graph.nodes.get(id))
      .filter((n): n is KnowledgeNode => n !== undefined);
  }

  public findOrphanNodes(): KnowledgeNode[] {
    const connectedNodes = new Set<string>();
    for (const e of this.graph.edges) {
      connectedNodes.add(e.sourceId);
      connectedNodes.add(e.targetId);
    }

    const orphans: KnowledgeNode[] = [];
    for (const [id, node] of this.graph.nodes.entries()) {
      if (!connectedNodes.has(id)) {
        orphans.push(node);
      }
    }
    return orphans;
  }

  public findPath(startId: string, endId: string): string[] | null {
    if (startId === endId) return [startId];
    const visited = new Set<string>([startId]);
    const queue: { current: string; path: string[] }[] = [{ current: startId, path: [startId] }];

    while (queue.length > 0) {
      const { current, path } = queue.shift()!;
      const outgoing = this.graph.edges.filter(e => e.sourceId === current);

      for (const edge of outgoing) {
        const next = edge.targetId;
        if (next === endId) {
          return [...path, endId];
        }
        if (!visited.has(next)) {
          visited.add(next);
          queue.push({ current: next, path: [...path, next] });
        }
      }
    }

    return null; // no path found
  }
}
