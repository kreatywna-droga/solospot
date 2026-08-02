import type {
  RepositoryNode,
  RepositoryStructure,
  RepositoryIssue,
  RepositoryIssueType,
  RepositorySeverity,
} from '../model/RepositoryModel';

// ---------------------------------------------------------------------------
// Configuration constants — tweak these to adjust analysis thresholds
// ---------------------------------------------------------------------------
const MAX_ALLOWED_DEPTH = 6;
const EXPECTED_PACKAGE_FILES = ['package.json', 'tsconfig.json', 'README.md'];
const EXPECTED_PACKAGE_DIRS = ['src'];
const PACKAGES_ROOT_NAME = 'packages';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

function issue(
  prefix: string,
  issueType: RepositoryIssueType,
  severity: RepositorySeverity,
  message: string,
  targetPath?: string,
  recommendation?: string
): RepositoryIssue {
  return { id: makeId(prefix), issueType, severity, message, targetPath, recommendation };
}

// ---------------------------------------------------------------------------
// RepositoryAnalyzer — static, read-only structural analysis
// ---------------------------------------------------------------------------
export class RepositoryAnalyzer {
  // ─── Tree Construction ───────────────────────────────────────────────────

  /**
   * Build a lightweight RepositoryNode tree from a plain JS object describing
   * the file-system snapshot.  Each entry is: { path, name, isDirectory,
   * depth, sizeBytes?, children? }.
   *
   * In production the caller would walk the FS and pass the result here.
   * For unit tests, synthetic fixtures are passed directly.
   */
  public static buildNodeTree(
    entries: Array<{
      path: string;
      name: string;
      isDirectory: boolean;
      depth: number;
      sizeBytes?: number;
      children?: Array<{ path: string; name: string; isDirectory: boolean; depth: number; sizeBytes?: number }>;
    }>
  ): RepositoryNode[] {
    return entries.map((e) => ({
      path: e.path,
      name: e.name,
      isDirectory: e.isDirectory,
      depth: e.depth,
      sizeBytes: e.sizeBytes,
      children: e.children
        ? e.children.map((c) => ({
            path: c.path,
            name: c.name,
            isDirectory: c.isDirectory,
            depth: c.depth,
            sizeBytes: c.sizeBytes,
            children: [],
          }))
        : [],
    }));
  }

  // ─── Repository Structure ────────────────────────────────────────────────

  /**
   * Derive aggregate RepositoryStructure from a flat/nested node list.
   */
  public static buildStructure(nodes: RepositoryNode[], rootPath: string): RepositoryStructure {
    const allNodes = RepositoryAnalyzer.flatten(nodes);
    const directories = allNodes.filter((n) => n.isDirectory);
    const files = allNodes.filter((n) => !n.isDirectory);
    const maxDepth = allNodes.reduce((acc, n) => Math.max(acc, n.depth), 0);
    const packageCount = directories.filter(
      (n) => n.depth === 1 && nodes.some((root) => root.name === PACKAGES_ROOT_NAME && root.children.includes(n))
    ).length;

    return { rootPath, allNodes, directories, files, maxDepth, packageCount };
  }

  // ─── Analysis Entry Points ───────────────────────────────────────────────

  /**
   * Run the complete suite of structural analyses and return all detected issues.
   */
  public static analyzeStructure(nodes: RepositoryNode[]): RepositoryIssue[] {
    return [
      ...RepositoryAnalyzer.detectEmptyDirectories(nodes),
      ...RepositoryAnalyzer.detectExcessiveDepth(nodes),
      ...RepositoryAnalyzer.detectDuplicateStructures(nodes),
      ...RepositoryAnalyzer.detectMissingPackageConventions(nodes),
      ...RepositoryAnalyzer.detectInconsistentNaming(nodes),
    ];
  }

  // ─── Empty Directory Detection ───────────────────────────────────────────

  public static detectEmptyDirectories(nodes: RepositoryNode[]): RepositoryIssue[] {
    const issues: RepositoryIssue[] = [];
    const allNodes = RepositoryAnalyzer.flatten(nodes);

    for (const node of allNodes) {
      if (node.isDirectory && node.children.length === 0) {
        issues.push(
          issue(
            'ri_empty',
            'empty_directory',
            'warning',
            `Empty directory detected: '${node.path}'. Empty directories add noise to the repository.`,
            node.path,
            `Remove the empty directory '${node.name}' or add an appropriate placeholder such as a .gitkeep file if the directory is intentionally reserved.`
          )
        );
      }
    }

    return issues;
  }

  // ─── Excessive Depth Detection ───────────────────────────────────────────

  public static detectExcessiveDepth(nodes: RepositoryNode[]): RepositoryIssue[] {
    const issues: RepositoryIssue[] = [];
    const allNodes = RepositoryAnalyzer.flatten(nodes);

    for (const node of allNodes) {
      if (node.depth > MAX_ALLOWED_DEPTH) {
        issues.push(
          issue(
            'ri_depth',
            'excessive_depth',
            'warning',
            `Directory '${node.path}' is nested ${node.depth} levels deep (limit: ${MAX_ALLOWED_DEPTH}).`,
            node.path,
            `Flatten the directory structure under '${node.name}' to reduce cognitive overhead and improve discoverability.`
          )
        );
      }
    }

    return issues;
  }

  // ─── Duplicate Structure Detection ───────────────────────────────────────

  /**
   * Identifies directories that share identical child-name signatures —
   * a heuristic for accidentally duplicated package scaffolding.
   */
  public static detectDuplicateStructures(nodes: RepositoryNode[]): RepositoryIssue[] {
    const issues: RepositoryIssue[] = [];
    const allNodes = RepositoryAnalyzer.flatten(nodes);
    const dirNodes = allNodes.filter((n) => n.isDirectory && n.children.length > 0);

    // Build a signature for each directory: sorted child names joined
    const signatureMap = new Map<string, RepositoryNode[]>();
    for (const dir of dirNodes) {
      const sig = dir.children
        .map((c) => c.name)
        .sort()
        .join('|');
      if (sig === '') continue;
      const existing = signatureMap.get(sig) ?? [];
      existing.push(dir);
      signatureMap.set(sig, existing);
    }

    for (const [, dirs] of signatureMap) {
      if (dirs.length >= 2) {
        const paths = dirs.map((d) => d.path).join(', ');
        issues.push(
          issue(
            'ri_dup',
            'duplicate_structure',
            'info',
            `Directories with identical child structure detected: [${paths}]. This may indicate unintended duplication.`,
            dirs[0].path,
            `Review the directories [${paths}] and consolidate if the duplication is unintentional.`
          )
        );
      }
    }

    return issues;
  }

  // ─── Package Convention Compliance ───────────────────────────────────────

  /**
   * For every directory that looks like a monorepo package (direct child of
   * the "packages" directory), verify that the expected files and directories
   * are present.
   */
  public static detectMissingPackageConventions(nodes: RepositoryNode[]): RepositoryIssue[] {
    const issues: RepositoryIssue[] = [];

    const packagesRoot = nodes.find((n) => n.isDirectory && n.name === PACKAGES_ROOT_NAME);
    if (!packagesRoot) return issues;

    for (const pkg of packagesRoot.children) {
      if (!pkg.isDirectory) continue;

      const childNames = pkg.children.map((c) => c.name);

      for (const requiredFile of EXPECTED_PACKAGE_FILES) {
        if (!childNames.includes(requiredFile)) {
          const typeMap: Record<string, RepositoryIssueType> = {
            'package.json': 'missing_package_json',
            'tsconfig.json': 'missing_tsconfig',
            'README.md': 'missing_readme',
          };
          issues.push(
            issue(
              'ri_pkg',
              typeMap[requiredFile] ?? 'missing_index',
              'error',
              `Package '${pkg.name}' is missing required file '${requiredFile}'.`,
              pkg.path,
              `Add '${requiredFile}' to '${pkg.path}'.`
            )
          );
        }
      }

      for (const requiredDir of EXPECTED_PACKAGE_DIRS) {
        const hasDir = pkg.children.some((c) => c.isDirectory && c.name === requiredDir);
        if (!hasDir) {
          issues.push(
            issue(
              'ri_src',
              'missing_src_directory',
              'error',
              `Package '${pkg.name}' is missing required directory '${requiredDir}/'.`,
              pkg.path,
              `Create the '${requiredDir}/' directory inside '${pkg.path}'.`
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Inconsistent Naming Detection ───────────────────────────────────────

  /**
   * Packages should use kebab-case names only.
   */
  public static detectInconsistentNaming(nodes: RepositoryNode[]): RepositoryIssue[] {
    const issues: RepositoryIssue[] = [];
    const kebabRe = /^[a-z][a-z0-9-]*$/;

    const packagesRoot = nodes.find((n) => n.isDirectory && n.name === PACKAGES_ROOT_NAME);
    if (!packagesRoot) return issues;

    for (const pkg of packagesRoot.children) {
      if (!pkg.isDirectory) continue;
      if (!kebabRe.test(pkg.name)) {
        issues.push(
          issue(
            'ri_name',
            'inconsistent_naming',
            'warning',
            `Package directory '${pkg.name}' does not follow the kebab-case naming convention.`,
            pkg.path,
            `Rename '${pkg.name}' to a lowercase kebab-case identifier.`
          )
        );
      }
    }

    return issues;
  }

  // ─── Utility ─────────────────────────────────────────────────────────────

  /** Flatten a potentially nested node tree into a single list. */
  public static flatten(nodes: RepositoryNode[]): RepositoryNode[] {
    const result: RepositoryNode[] = [];
    const queue = [...nodes];
    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node);
      if (node.children.length > 0) {
        queue.push(...node.children);
      }
    }
    return result;
  }
}
