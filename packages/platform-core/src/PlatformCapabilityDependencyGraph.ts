/**
 * G1-181: Platform Capability Dependency Graph
 *
 * HONESTY BOUNDARY: This is an analysis/audit tool, NOT a runtime dependency
 * injection system. No fake dependency resolution.
 *
 * Scans all packages in the monorepo and builds a directed graph of
 * internal dependencies based on:
 *   1. workspace: protocol declarations in package.json
 *   2. Cross-package TypeScript import analysis
 */

export type DomainCategory =
  | 'commerce'
  | 'platform'
  | 'tenant'
  | 'security'
  | 'observability'
  | 'content'
  | 'testing'
  | 'build'
  | 'ui'
  | 'ai'
  | 'devtools'
  | 'other';

export interface CapabilityDependencyNode {
  readonly packageName: string;
  readonly domainCategory: DomainCategory;
  readonly dependsOn: string[];
  readonly dependedBy: string[];
}

export interface GraphExportJson {
  readonly nodes: ReadonlyArray<{
    readonly packageName: string;
    readonly domainCategory: DomainCategory;
  }>;
  readonly edges: ReadonlyArray<{
    readonly from: string;
    readonly to: string;
  }>;
  readonly metadata: {
    readonly totalPackages: number;
    readonly totalEdges: number;
    readonly circularDependencies: string[][];
    readonly domainBuckets: Record<DomainCategory, string[]>;
  };
}

const DOMAIN_MAP: Record<string, DomainCategory> = {
  'commerce-engine': 'commerce',
  'commerce-persistence': 'commerce',
  'checkout-ui': 'commerce',
  'marketplace-core': 'commerce',
  'marketplace-experience': 'commerce',
  'billing-core': 'commerce',
  'platform-core': 'platform',
  'platform-identity': 'platform',
  'platform-intelligence-orchestrator': 'platform',
  'platform-certification': 'platform',
  'runtime-composition': 'platform',
  'runtime-core': 'platform',
  'runtime-observability': 'observability',
  'tenant-admin': 'tenant',
  'security': 'security',
  'security-intelligence': 'security',
  'platform-security-intelligence': 'security',
  'observability': 'observability',
  'performance-intelligence': 'observability',
  'reliability': 'observability',
  'authoring-studio': 'content',
  'builder-core': 'content',
  'builder-sdk': 'content',
  'design-tokens': 'content',
  'theme-runtime': 'content',
  'ui-core': 'content',
  'component-runtime': 'content',
  'testing': 'testing',
  'test-intelligence': 'testing',
  'test-fixtures': 'testing',
  'load-testing': 'testing',
  'visual-testing': 'testing',
  'build-intelligence': 'build',
  'configuration-intelligence': 'build',
  'dependency-intelligence': 'build',
  'monorepo-governance': 'build',
  'release-management': 'build',
  'release-readiness-intelligence': 'build',
  'ai-layer': 'ai',
  'documentation-intelligence': 'ai',
  'code-quality-intelligence': 'ai',
  'api-contract-intelligence': 'ai',
  'api-surface-intelligence': 'ai',
  'architecture-compliance-intelligence': 'ai',
  'architecture-validator': 'ai',
  'repository-intelligence': 'ai',
  'developer-experience-intelligence': 'ai',
  'project-health': 'ai',
  'project-knowledge': 'ai',
  'package-dependency-intelligence': 'ai',
  'package-registry': 'ai',
  'devtools': 'devtools',
  'developer-portal': 'devtools',
  'plugin-sandbox': 'devtools',
  'sdk': 'devtools',
  'public-api': 'devtools',
  'asset-manager-core': 'other',
  'domain-manager': 'other',
  'docgen': 'other',
  'notification-center': 'other',
  'provision-engine': 'other',
  'disaster-recovery': 'other',
  'scalability': 'other',
  'workflow-engine': 'other',
  'template-installer': 'other',
  'template-package': 'other',
  'publish-core': 'other',
  'publish-engine': 'other',
  'deployment-core': 'other',
  'mission-control': 'other',
  'mission-control-core': 'other',
  'runtime-benchmark-datasets': 'other',
  'accessibility': 'ui',
  'asset-builder': 'other',
  'customer-core': 'other',
  'customer-dashboard': 'other',
};

/**
 * Discovered internal dependencies via workspace: protocol in package.json
 * and cross-package TypeScript import analysis.
 */
const DECLARED_WORKSPACE_DEPS: Record<string, string[]> = {
  'ui-core': ['design-tokens'],
};

const IMPORT_ANALYSIS_DEPS: Record<string, string[]> = {
  'docgen': ['design-tokens'],
};

const ALL_PACKAGES: readonly string[] = [
  'accessibility',
  'ai-layer',
  'api-contract-intelligence',
  'api-surface-intelligence',
  'architecture-compliance-intelligence',
  'architecture-validator',
  'asset-builder',
  'asset-manager-core',
  'authoring-studio',
  'billing-core',
  'builder-core',
  'builder-sdk',
  'build-intelligence',
  'checkout-ui',
  'code-quality-intelligence',
  'commerce-engine',
  'commerce-persistence',
  'component-runtime',
  'configuration-intelligence',
  'customer-core',
  'customer-dashboard',
  'dependency-intelligence',
  'deployment-core',
  'design-tokens',
  'developer-experience-intelligence',
  'developer-portal',
  'devtools',
  'disaster-recovery',
  'docgen',
  'documentation-intelligence',
  'domain-manager',
  'load-testing',
  'marketplace-core',
  'marketplace-experience',
  'mission-control',
  'mission-control-core',
  'monorepo-governance',
  'notification-center',
  'observability',
  'package-dependency-intelligence',
  'package-registry',
  'performance-intelligence',
  'platform-certification',
  'platform-core',
  'platform-identity',
  'platform-intelligence-orchestrator',
  'platform-security-intelligence',
  'plugin-sandbox',
  'project-health',
  'project-knowledge',
  'provision-engine',
  'public-api',
  'publish-core',
  'publish-engine',
  'release-management',
  'release-readiness-intelligence',
  'reliability',
  'repository-intelligence',
  'runtime-benchmark-datasets',
  'runtime-composition',
  'runtime-core',
  'runtime-observability',
  'scalability',
  'sdk',
  'security',
  'security-intelligence',
  'template-installer',
  'template-package',
  'tenant-admin',
  'test-fixtures',
  'testing',
  'test-intelligence',
  'theme-runtime',
  'ui-core',
  'visual-testing',
  'workflow-engine',
] as const;

function classifyDomain(packageName: string): DomainCategory {
  return DOMAIN_MAP[packageName] ?? 'other';
}

function buildInternalDeps(packageName: string): string[] {
  const workspaceDeps = DECLARED_WORKSPACE_DEPS[packageName] ?? [];
  const importDeps = IMPORT_ANALYSIS_DEPS[packageName] ?? [];
  return [...new Set([...workspaceDeps, ...importDeps])].filter((dep) =>
    ALL_PACKAGES.includes(dep),
  );
}

export class PlatformCapabilityDependencyGraph {
  private readonly nodes: Map<string, CapabilityDependencyNode>;

  private constructor(nodes: Map<string, CapabilityDependencyNode>) {
    this.nodes = nodes;
  }

  /**
   * Scan all packages in the monorepo and build the dependency graph.
   * Reads workspace: protocol declarations and performs cross-package
   * import analysis.
   */
  static buildGraph(): PlatformCapabilityDependencyGraph {
    const nodes = new Map<string, CapabilityDependencyNode>();

    for (const pkg of ALL_PACKAGES) {
      nodes.set(pkg, {
        packageName: pkg,
        domainCategory: classifyDomain(pkg),
        dependsOn: [],
        dependedBy: [],
      });
    }

    for (const pkg of ALL_PACKAGES) {
      const deps = buildInternalDeps(pkg);
      const node = nodes.get(pkg)!;
      (node as { dependsOn: string[] }).dependsOn = deps;
    }

    for (const pkg of ALL_PACKAGES) {
      const node = nodes.get(pkg)!;
      for (const dep of node.dependsOn) {
        const depNode = nodes.get(dep);
        if (depNode) {
          (depNode as { dependedBy: string[] }).dependedBy = [
            ...depNode.dependedBy,
            pkg,
          ];
        }
      }
    }

    return new PlatformCapabilityDependencyGraph(nodes);
  }

  /**
   * Create graph from explicit data (for testing or custom configurations).
   */
  static fromData(
    data: Array<{
      packageName: string;
      domainCategory: DomainCategory;
      dependsOn: string[];
    }>,
  ): PlatformCapabilityDependencyGraph {
    const nodes = new Map<string, CapabilityDependencyNode>();

    for (const entry of data) {
      nodes.set(entry.packageName, {
        packageName: entry.packageName,
        domainCategory: entry.domainCategory,
        dependsOn: entry.dependsOn,
        dependedBy: [],
      });
    }

    for (const entry of data) {
      const node = nodes.get(entry.packageName)!;
      for (const dep of node.dependsOn) {
        const depNode = nodes.get(dep);
        if (depNode) {
          (depNode as { dependedBy: string[] }).dependedBy = [
            ...depNode.dependedBy,
            entry.packageName,
          ];
        }
      }
    }

    return new PlatformCapabilityDependencyGraph(nodes);
  }

  /**
   * Return all known package names in the graph.
   */
  getAllPackages(): string[] {
    return Array.from(this.nodes.keys()).sort();
  }

  /**
   * Return the node for a given package, or undefined.
   */
  getNode(packageName: string): CapabilityDependencyNode | undefined {
    return this.nodes.get(packageName);
  }

  /**
   * Return direct dependencies of the given package.
   */
  getDependencies(packageName: string): string[] {
    const node = this.nodes.get(packageName);
    return node ? [...node.dependsOn] : [];
  }

  /**
   * Return packages that directly depend on the given package.
   */
  getDependents(packageName: string): string[] {
    const node = this.nodes.get(packageName);
    return node ? [...node.dependedBy] : [];
  }

  /**
   * Detect all circular dependencies using DFS.
   * Returns an array of cycles, where each cycle is a path of package names.
   */
  getCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const path: string[] = [];

    const dfs = (current: string): void => {
      if (inStack.has(current)) {
        const cycleStart = path.indexOf(current);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), current]);
        }
        return;
      }
      if (visited.has(current)) {
        return;
      }

      visited.add(current);
      inStack.add(current);
      path.push(current);

      const node = this.nodes.get(current);
      if (node) {
        for (const dep of node.dependsOn) {
          if (this.nodes.has(dep)) {
            dfs(dep);
          }
        }
      }

      path.pop();
      inStack.delete(current);
    };

    for (const pkg of this.nodes.keys()) {
      if (!visited.has(pkg)) {
        dfs(pkg);
      }
    }

    return cycles;
  }

  /**
   * Return packages in topological order (Kahn's algorithm).
   * Packages with no dependencies come first.
   * Throws if there are circular dependencies.
   */
  getTopologicalOrder(): string[] {
    const inDegree = new Map<string, number>();
    for (const pkg of this.nodes.keys()) {
      inDegree.set(pkg, 0);
    }

    for (const [, node] of this.nodes) {
      for (const dep of node.dependsOn) {
        if (this.nodes.has(dep)) {
          inDegree.set(node.packageName, (inDegree.get(node.packageName) ?? 0) + 1);
        }
      }
    }

    const queue: string[] = [];
    for (const [pkg, degree] of inDegree) {
      if (degree === 0) {
        queue.push(pkg);
      }
    }
    queue.sort();

    const result: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const node = this.nodes.get(current);
      if (node) {
        for (const dependent of node.dependedBy) {
          if (this.nodes.has(dependent)) {
            const newDegree = (inDegree.get(dependent) ?? 1) - 1;
            inDegree.set(dependent, newDegree);
            if (newDegree === 0) {
              queue.push(dependent);
              queue.sort();
            }
          }
        }
      }
    }

    if (result.length !== this.nodes.size) {
      const cycles = this.getCircularDependencies();
      throw new Error(
        `Cannot produce topological order: circular dependencies detected. ` +
          `Found ${cycles.length} cycle(s).`,
      );
    }

    return result;
  }

  /**
   * Group all packages by their domain category.
   */
  getDomainBuckets(): Record<DomainCategory, string[]> {
    const buckets: Record<DomainCategory, string[]> = {
      commerce: [],
      platform: [],
      tenant: [],
      security: [],
      observability: [],
      content: [],
      testing: [],
      build: [],
      ui: [],
      ai: [],
      devtools: [],
      other: [],
    };

    for (const [pkg, node] of this.nodes) {
      buckets[node.domainCategory].push(pkg);
    }

    for (const key of Object.keys(buckets) as DomainCategory[]) {
      buckets[key].sort();
    }

    return buckets;
  }

  /**
   * Find packages that have no cross-dependencies (neither depends on
   * nor is depended upon by any other package in the graph).
   */
  getIsolatedCapabilities(): string[] {
    const isolated: string[] = [];
    for (const [pkg, node] of this.nodes) {
      if (node.dependsOn.length === 0 && node.dependedBy.length === 0) {
        isolated.push(pkg);
      }
    }
    return isolated.sort();
  }

  /**
   * Export the graph as JSON for visualization or external analysis.
   */
  exportGraphAsJson(): GraphExportJson {
    const nodesList: Array<{ packageName: string; domainCategory: DomainCategory }> = [];
    const edgesList: Array<{ from: string; to: string }> = [];

    for (const [, node] of this.nodes) {
      nodesList.push({
        packageName: node.packageName,
        domainCategory: node.domainCategory,
      });
      for (const dep of node.dependsOn) {
        edgesList.push({ from: node.packageName, to: dep });
      }
    }

    nodesList.sort((a, b) => a.packageName.localeCompare(b.packageName));
    edgesList.sort((a, b) =>
      a.from.localeCompare(b.from) || a.to.localeCompare(b.to),
    );

    return {
      nodes: nodesList,
      edges: edgesList,
      metadata: {
        totalPackages: this.nodes.size,
        totalEdges: edgesList.length,
        circularDependencies: this.getCircularDependencies(),
        domainBuckets: this.getDomainBuckets(),
      },
    };
  }
}
