import { PackageManifest } from '../manifest/PackageManifestModel';

export interface GraphNode {
  id: string;
  manifest: PackageManifest;
  dependencies: string[];
}

export interface GraphReport {
  totalNodes: number;
  hasCycles: boolean;
  cycles: string[][];
  loadOrder: string[];
}

export class PackageDependencyGraph {
  private nodes: Map<string, GraphNode> = new Map();

  public buildGraph(manifests: PackageManifest[]): void {
    this.nodes.clear();
    for (const m of manifests) {
      const deps = m.dependencies ? m.dependencies.map(d => d.name) : [];
      this.nodes.set(m.id, {
        id: m.id,
        manifest: m,
        dependencies: deps,
      });
    }
  }

  public detectCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const node = this.nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (!visited.has(depId)) {
            dfs(depId, [...path]);
          } else if (recursionStack.has(depId)) {
            const idx = path.indexOf(depId);
            if (idx !== -1) {
              cycles.push([...path.slice(idx), depId]);
            }
          }
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const id of this.nodes.keys()) {
      if (!visited.has(id)) {
        dfs(id, []);
      }
    }

    return cycles;
  }

  public topologicalSort(): string[] {
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    for (const id of this.nodes.keys()) {
      inDegree.set(id, 0);
      adj.set(id, []);
    }

    for (const [id, node] of this.nodes.entries()) {
      for (const depId of node.dependencies) {
        if (this.nodes.has(depId)) {
          adj.get(depId)!.push(id);
          inDegree.set(id, (inDegree.get(id) || 0) + 1);
        }
      }
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(id);
    }

    const loadOrder: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      loadOrder.push(u);

      const neighbors = adj.get(u) || [];
      for (const v of neighbors) {
        inDegree.set(v, inDegree.get(v)! - 1);
        if (inDegree.get(v) === 0) {
          queue.push(v);
        }
      }
    }

    return loadOrder;
  }

  public generateReport(): GraphReport {
    const cycles = this.detectCycles();
    const loadOrder = this.topologicalSort();
    return {
      totalNodes: this.nodes.size,
      hasCycles: cycles.length > 0,
      cycles,
      loadOrder,
    };
  }
}
