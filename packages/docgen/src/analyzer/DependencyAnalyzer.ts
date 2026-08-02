export interface CircularDependencyCycle {
  cycle: string[];
}

export interface DependencyAnalysisReport {
  totalModules: number;
  totalDependencies: number;
  circularDependencies: CircularDependencyCycle[];
  graph: Record<string, string[]>;
}

export class DependencyAnalyzer {
  public static extractImports(sourceCode: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(sourceCode)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  }

  public static detectCircularDependencies(graph: Map<string, string[]>): CircularDependencyCycle[] {
    const cycles: CircularDependencyCycle[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]) => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push({ cycle: [...path.slice(cycleStart), neighbor] });
          }
        }
      }

      recursionStack.delete(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  public static generateReport(graphMap: Map<string, string[]>): DependencyAnalysisReport {
    const circular = DependencyAnalyzer.detectCircularDependencies(graphMap);
    let totalDeps = 0;
    const graphObj: Record<string, string[]> = {};

    for (const [key, deps] of graphMap.entries()) {
      graphObj[key] = deps;
      totalDeps += deps.length;
    }

    return {
      totalModules: graphMap.size,
      totalDependencies: totalDeps,
      circularDependencies: circular,
      graph: graphObj,
    };
  }
}
