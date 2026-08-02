import type {
  DependencyCategory,
  DependencyEdge,
  DependencyIssue,
  DependencyIssueType,
  DependencyNode,
  DependencySeverity,
} from '../model/DependencyModel';

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------
const THRESHOLD_MAX_TRANSITIVE_DEPTH = 6;  // max depth of dependency graph
const THRESHOLD_MAX_DEGREE           = 15; // max outgoing dependencies per package

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

function issue(
  prefix: string,
  issueType: DependencyIssueType,
  category: DependencyCategory,
  severity: DependencySeverity,
  targetPath: string,
  message: string,
  opts: {
    cyclePath?: string[];
    versionDetails?: string;
    recommendation?: string;
  } = {}
): DependencyIssue {
  return {
    id: makeId(prefix),
    issueType,
    category,
    severity,
    targetPath,
    message,
    ...opts,
  };
}

// ---------------------------------------------------------------------------
// DependencyAnalyzer — static, read-only dependency graph analyzer
// ---------------------------------------------------------------------------
export class DependencyAnalyzer {

  // ─── Parsing Helpers ──────────────────────────────────────────────────────

  public static parseGraph(
    rawNodes: Array<{
      id: string;
      version?: string;
      isWorkspacePackage?: boolean;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      usedImports?: string[];
    }>
  ): DependencyNode[] {
    return rawNodes.map((n) => ({
      id: n.id,
      version: n.version ?? '0.1.0',
      isWorkspacePackage: n.isWorkspacePackage ?? true,
      dependencies: n.dependencies ?? {},
      devDependencies: n.devDependencies ?? {},
      peerDependencies: n.peerDependencies ?? {},
      usedImports: n.usedImports ?? [],
    }));
  }

  // ─── Top-level Dispatch ──────────────────────────────────────────────────

  public static analyzeAll(nodes: DependencyNode[]): DependencyIssue[] {
    return [
      ...DependencyAnalyzer.detectCycles(nodes),
      ...DependencyAnalyzer.detectUnusedDependencies(nodes),
      ...DependencyAnalyzer.detectOrphanedPackages(nodes),
      ...DependencyAnalyzer.detectDuplicateDeclarations(nodes),
      ...DependencyAnalyzer.detectVersionInconsistencies(nodes),
      ...DependencyAnalyzer.detectExcessiveTransitiveDepth(nodes),
      ...DependencyAnalyzer.detectGraphComplexity(nodes),
    ];
  }

  // ─── Circular Dependency Detection ───────────────────────────────────────

  /**
   * DFS-based cycle detection on the directed workspace dependency graph.
   */
  public static detectCycles(nodes: DependencyNode[]): DependencyIssue[] {
    const issues: DependencyIssue[] = [];
    const workspaceNodeIds = new Set(nodes.filter((n) => n.isWorkspacePackage).map((n) => n.id));

    // Build adjacency list (only workspace packages)
    const adjMap = new Map<string, string[]>();
    for (const node of nodes) {
      if (!node.isWorkspacePackage) continue;
      const neighbors: string[] = [];

      const allDeps = { ...node.dependencies, ...node.devDependencies };
      for (const depName of Object.keys(allDeps)) {
        if (workspaceNodeIds.has(depName)) {
          neighbors.push(depName);
        }
      }
      adjMap.set(node.id, neighbors);
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];
    const reportedCycles = new Set<string>();

    function dfs(curr: string) {
      visited.add(curr);
      recStack.add(curr);
      path.push(curr);

      const neighbors = adjMap.get(curr) ?? [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recStack.has(neighbor)) {
          // Cycle found! Extract cycle path
          const cycleStartIndex = path.indexOf(neighbor);
          const cyclePath = [...path.slice(cycleStartIndex), neighbor];
          const cycleKey = cyclePath.sort().join('->');

          if (!reportedCycles.has(cycleKey)) {
            reportedCycles.add(cycleKey);
            issues.push(
              issue(
                'dep_cyc',
                'dependency_cycle',
                'circular_dependency',
                'critical',
                curr,
                `Circular dependency detected: ${cyclePath.join(' -> ')}.`,
                {
                  cyclePath,
                  recommendation: `Break the cycle by extracting shared interfaces into a lower-level package or introducing dependency inversion.`,
                }
              )
            );
          }
        }
      }

      recStack.delete(curr);
      path.pop();
    }

    for (const node of nodes) {
      if (node.isWorkspacePackage && !visited.has(node.id)) {
        dfs(node.id);
      }
    }

    return issues;
  }

  // ─── Unused Dependency Detection ─────────────────────────────────────────

  /**
   * Flag dependencies declared in package.json that are never imported in code.
   */
  public static detectUnusedDependencies(nodes: DependencyNode[]): DependencyIssue[] {
    const issues: DependencyIssue[] = [];

    for (const node of nodes) {
      if (!node.isWorkspacePackage || !node.usedImports) continue;

      const usedSet = new Set(node.usedImports);
      const declaredDeps = Object.keys(node.dependencies);

      for (const dep of declaredDeps) {
        // Skip types packages or build tools that might not have explicit import statements
        if (dep.startsWith('@types/') || dep === 'typescript' || dep === 'vitest') continue;

        if (!usedSet.has(dep)) {
          issues.push(
            issue(
              'dep_unused',
              'unused_declared_dependency',
              'unused_dependency',
              'warning',
              node.id,
              `Package '${node.id}' declares dependency '${dep}' in package.json but never imports it in code.`,
              {
                recommendation: `Remove unused dependency '${dep}' from '${node.id}/package.json'.`,
              }
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Orphaned Package Detection ──────────────────────────────────────────

  /**
   * Flag workspace packages that are not depended upon by any other workspace package
   * (excluding main app entrypoints).
   */
  public static detectOrphanedPackages(nodes: DependencyNode[]): DependencyIssue[] {
    const issues: DependencyIssue[] = [];
    const workspaceNodes = nodes.filter((n) => n.isWorkspacePackage);
    const dependeeSet = new Set<string>();

    for (const node of workspaceNodes) {
      const allDeps = { ...node.dependencies, ...node.devDependencies };
      for (const dep of Object.keys(allDeps)) {
        dependeeSet.add(dep);
      }
    }

    for (const node of workspaceNodes) {
      // Exclude main app / root entrypoint packages
      if (node.id === 'web-factor' || node.id.endsWith('app') || node.id.includes('root')) continue;

      if (!dependeeSet.has(node.id)) {
        issues.push(
          issue(
            'dep_orph',
            'orphaned_workspace_package',
            'orphaned_package',
            'warning',
            node.id,
            `Workspace package '${node.id}' is orphaned — no other workspace package depends on it.`,
            {
              recommendation: `Add '${node.id}' to dependant package manifests or evaluate whether it should be archived.`,
            }
          )
        );
      }
    }

    return issues;
  }

  // ─── Duplicate Declaration Detection ─────────────────────────────────────

  /**
   * Flag packages listed in both dependencies and devDependencies of the same package.
   */
  public static detectDuplicateDeclarations(nodes: DependencyNode[]): DependencyIssue[] {
    const issues: DependencyIssue[] = [];

    for (const node of nodes) {
      if (!node.devDependencies) continue;

      const prodDeps = new Set(Object.keys(node.dependencies));
      for (const devDep of Object.keys(node.devDependencies)) {
        if (prodDeps.has(devDep)) {
          issues.push(
            issue(
              'dep_dup',
              'duplicate_dependency_declaration',
              'duplicate_dependency',
              'error',
              node.id,
              `Dependency '${devDep}' is duplicated in both 'dependencies' and 'devDependencies' of '${node.id}'.`,
              {
                recommendation: `Remove '${devDep}' from 'devDependencies' in '${node.id}/package.json'.`,
              }
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Version Inconsistency Detection ─────────────────────────────────────

  /**
   * Flag third-party dependencies declared with conflicting semver ranges across workspace packages.
   */
  public static detectVersionInconsistencies(nodes: DependencyNode[]): DependencyIssue[] {
    const issues: DependencyIssue[] = [];
    const depVersionsMap = new Map<string, Map<string, string[]>>(); // depName -> (versionStr -> [packageIds])

    for (const node of nodes) {
      if (!node.isWorkspacePackage) continue;
      const allDeps = { ...node.dependencies, ...node.devDependencies };

      for (const [depName, semver] of Object.entries(allDeps)) {
        // Skip workspace package references
        if (depName.startsWith('@web-factor/')) continue;

        let versionMap = depVersionsMap.get(depName);
        if (!versionMap) {
          versionMap = new Map<string, string[]>();
          depVersionsMap.set(depName, versionMap);
        }

        const pkgs = versionMap.get(semver) ?? [];
        pkgs.push(node.id);
        versionMap.set(semver, pkgs);
      }
    }

    for (const [depName, versionMap] of depVersionsMap) {
      if (versionMap.size > 1) {
        const details = Array.from(versionMap.entries())
          .map(([ver, pkgs]) => `${ver} (${pkgs.join(', ')})`)
          .join(' vs ');

        issues.push(
          issue(
            'dep_ver',
            'version_mismatch',
            'version_inconsistency',
            'warning',
            depName,
            `Dependency '${depName}' has mismatched version requirements across workspace packages: ${details}.`,
            {
              versionDetails: details,
              recommendation: `Align '${depName}' to a single standard version range across all workspace packages.`,
            }
          )
        );
      }
    }

    return issues;
  }

  // ─── Transitive Depth Detection ───────────────────────────────────────────

  public static detectExcessiveTransitiveDepth(nodes: DependencyNode[]): DependencyIssue[] {
    const issues: DependencyIssue[] = [];
    const maxDepth = DependencyAnalyzer.calculateMaxGraphDepth(nodes);

    if (maxDepth > THRESHOLD_MAX_TRANSITIVE_DEPTH) {
      issues.push(
        issue(
          'dep_depth',
          'excessive_transitive_depth',
          'transitive_depth',
          'warning',
          'workspace',
          `The monorepo dependency graph has a maximum transitive depth of ${maxDepth} (threshold: ${THRESHOLD_MAX_TRANSITIVE_DEPTH}).`,
          {
            recommendation: `Flatten the dependency graph by reducing intermediate package wrappers.`,
          }
        )
      );
    }

    return issues;
  }

  // ─── Graph Complexity Detection ───────────────────────────────────────────

  public static detectGraphComplexity(nodes: DependencyNode[]): DependencyIssue[] {
    const issues: DependencyIssue[] = [];

    for (const node of nodes) {
      if (!node.isWorkspacePackage) continue;
      const outgoingCount = Object.keys(node.dependencies).length;

      if (outgoingCount > THRESHOLD_MAX_DEGREE) {
        issues.push(
          issue(
            'dep_cplx',
            'high_graph_complexity',
            'graph_complexity',
            'warning',
            node.id,
            `Package '${node.id}' has ${outgoingCount} direct dependencies (threshold: ${THRESHOLD_MAX_DEGREE}).`,
            {
              recommendation: `Decompose '${node.id}' to reduce its dependency footprint.`,
            }
          )
        );
      }
    }

    return issues;
  }

  // ─── Graph Calculations ───────────────────────────────────────────────────

  public static buildEdges(nodes: DependencyNode[]): DependencyEdge[] {
    const edges: DependencyEdge[] = [];

    for (const node of nodes) {
      for (const [target, semverRange] of Object.entries(node.dependencies)) {
        edges.push({ source: node.id, target, relationType: 'direct', semverRange });
      }
      if (node.devDependencies) {
        for (const [target, semverRange] of Object.entries(node.devDependencies)) {
          edges.push({ source: node.id, target, relationType: 'dev', semverRange });
        }
      }
    }

    return edges;
  }

  public static calculateMaxGraphDepth(nodes: DependencyNode[]): number {
    const adjMap = new Map<string, string[]>();
    for (const node of nodes) {
      adjMap.set(node.id, Object.keys(node.dependencies));
    }

    let maxDepth = 0;
    const memo = new Map<string, number>();

    function getDepth(curr: string, visited: Set<string>): number {
      if (visited.has(curr)) return 0; // cycle fallback
      if (memo.has(curr)) return memo.get(curr)!;

      visited.add(curr);
      const neighbors = adjMap.get(curr) ?? [];
      let depth = 0;
      for (const n of neighbors) {
        depth = Math.max(depth, 1 + getDepth(n, new Set(visited)));
      }
      memo.set(curr, depth);
      return depth;
    }

    for (const node of nodes) {
      maxDepth = Math.max(maxDepth, getDepth(node.id, new Set()));
    }

    return maxDepth;
  }
}
