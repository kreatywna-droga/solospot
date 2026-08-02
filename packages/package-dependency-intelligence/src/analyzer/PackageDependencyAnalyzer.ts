import { PackageNode, PackageDependency, DependencyGraph, DependencyCycle } from '../model/PkgDepModel';

export class PackageDependencyAnalyzer {
  public static buildGraph(packages: PackageNode[]): DependencyGraph {
    const nodes = new Map<string, PackageNode>();
    const dependencies: PackageDependency[] = [];

    for (const pkg of packages) {
      nodes.set(pkg.name, pkg);
      for (const dep of pkg.dependencies) {
        dependencies.push({ sourcePackage: pkg.name, targetPackage: dep, type: 'prod' });
      }
      for (const devDep of pkg.devDependencies) {
        dependencies.push({ sourcePackage: pkg.name, targetPackage: devDep, type: 'dev' });
      }
    }

    return { nodes, dependencies };
  }

  public static detectCycles(graph: DependencyGraph): DependencyCycle[] {
    const cycles: DependencyCycle[] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string, path: string[]) => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const outgoing = graph.dependencies
        .filter(d => d.sourcePackage === node)
        .map(d => d.targetPackage);

      for (const target of outgoing) {
        if (!visited.has(target)) {
          dfs(target, [...path]);
        } else if (recStack.has(target)) {
          cycles.push({ cyclePath: [...path, target] });
        }
      }

      recStack.delete(node);
    };

    for (const key of graph.nodes.keys()) {
      if (!visited.has(key)) {
        dfs(key, []);
      }
    }

    return cycles;
  }

  public static detectOrphans(graph: DependencyGraph): string[] {
    const targetedPackages = new Set<string>();
    for (const dep of graph.dependencies) {
      targetedPackages.add(dep.targetPackage);
    }

    const orphans: string[] = [];
    for (const pkgName of graph.nodes.keys()) {
      // If no other package depends on it and it's not root app
      if (!targetedPackages.has(pkgName) && pkgName !== 'web-factor-studio') {
        orphans.push(pkgName);
      }
    }
    return orphans;
  }

  public static detectHighCoupling(graph: DependencyGraph, maxAllowedDependencies: number = 5): string[] {
    const highCoupled: string[] = [];
    for (const [name, node] of graph.nodes.entries()) {
      if (node.dependencies.length > maxAllowedDependencies) {
        highCoupled.push(name);
      }
    }
    return highCoupled;
  }
}
