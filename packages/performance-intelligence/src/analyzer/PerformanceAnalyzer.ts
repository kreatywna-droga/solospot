import type {
  PerformanceIssue,
  PerformanceIssueType,
  PerformanceCategory,
  PerformanceSeverity,
  PerformanceModuleSnapshot,
} from '../model/PerformanceModel';

// ---------------------------------------------------------------------------
// Analysis thresholds — static limits used for architectural assessment
// ---------------------------------------------------------------------------
const THRESHOLD_MAX_IMPORT_DEPTH       = 5;   // import chain levels
const THRESHOLD_MAX_FAN_IN             = 10;  // modules depending on one module
const THRESHOLD_MAX_FAN_OUT            = 15;  // modules one module depends on
const THRESHOLD_MAX_EXPORT_COUNT       = 50;  // symbols in a single barrel
const THRESHOLD_MAX_MODULE_SIZE_KB     = 200; // estimated file size
const THRESHOLD_HOTSPOT_SCORE          = 20;  // fan-in + fan-out combined
const THRESHOLD_SPLIT_CANDIDATE_EXPORTS = 30; // exports suggesting a module should split

// Known heavy third-party package prefixes (heuristic, no npm lookup)
const HEAVY_PACKAGES = new Set([
  'lodash', 'moment', 'rxjs', 'rxjs/operators',
  'antd', '@mui/material', 'three', 'd3',
  'firebase', 'aws-sdk', '@aws-sdk',
  'chart.js', 'recharts', 'highcharts',
  'date-fns', 'ramda', 'immutable',
]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

function issue(
  prefix: string,
  issueType: PerformanceIssueType,
  category: PerformanceCategory,
  severity: PerformanceSeverity,
  targetPath: string,
  message: string,
  measured?: number,
  threshold?: number,
  recommendation?: string
): PerformanceIssue {
  return {
    id: makeId(prefix),
    issueType,
    category,
    severity,
    targetPath,
    message,
    measuredValue: measured,
    threshold,
    recommendation,
  };
}

// ---------------------------------------------------------------------------
// PerformanceAnalyzer — static, read-only performance risk analysis
// ---------------------------------------------------------------------------
export class PerformanceAnalyzer {

  // ─── Module Parsing ───────────────────────────────────────────────────────

  /**
   * Convert raw module data into typed PerformanceModuleSnapshot objects.
   * Callers supply the data snapshot; this class never accesses the file system.
   */
  public static parseModules(
    rawModules: Array<{
      modulePath: string;
      importCount?: number;
      fanIn?: number;
      fanOut?: number;
      importDepth?: number;
      exportCount?: number;
      estimatedSizeKb?: number;
      dependencies?: string[];
      heavyDependencies?: string[];
    }>
  ): PerformanceModuleSnapshot[] {
    return rawModules.map((m) => ({
      modulePath:        m.modulePath,
      importCount:       m.importCount       ?? 0,
      fanIn:             m.fanIn             ?? 0,
      fanOut:            m.fanOut            ?? 0,
      importDepth:       m.importDepth       ?? 0,
      exportCount:       m.exportCount       ?? 0,
      estimatedSizeKb:   m.estimatedSizeKb   ?? 0,
      dependencies:      m.dependencies      ?? [],
      heavyDependencies: m.heavyDependencies ?? [],
    }));
  }

  // ─── Top-level Dispatch ──────────────────────────────────────────────────

  /**
   * Run all static analysis passes and return the combined issue list.
   */
  public static analyzeAll(modules: PerformanceModuleSnapshot[]): PerformanceIssue[] {
    return [
      ...PerformanceAnalyzer.detectHeavyDependencies(modules),
      ...PerformanceAnalyzer.detectOversizedModules(modules),
      ...PerformanceAnalyzer.detectDeepImportChains(modules),
      ...PerformanceAnalyzer.detectHotspots(modules),
      ...PerformanceAnalyzer.detectBarrelBloat(modules),
      ...PerformanceAnalyzer.detectSplitCandidates(modules),
      ...PerformanceAnalyzer.detectHighComplexity(modules),
      ...PerformanceAnalyzer.detectExcessiveReExports(modules),
    ];
  }

  // ─── Heavy Dependency Detection ───────────────────────────────────────────

  /**
   * Flag modules that directly depend on known heavy third-party packages.
   */
  public static detectHeavyDependencies(modules: PerformanceModuleSnapshot[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    for (const mod of modules) {
      for (const dep of mod.heavyDependencies) {
        const isHeavy = [...HEAVY_PACKAGES].some((h) => dep === h || dep.startsWith(h + '/'));
        if (isHeavy) {
          issues.push(
            issue(
              'perf_dep',
              'heavy_dependency',
              'dependency_cost',
              'warning',
              mod.modulePath,
              `Module '${mod.modulePath}' depends on the heavy package '${dep}', which may significantly increase bundle size.`,
              undefined,
              undefined,
              `Evaluate whether '${dep}' can be replaced with a lighter alternative, dynamically imported, or tree-shaken.`
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Oversized Module Detection ───────────────────────────────────────────

  /**
   * Flag modules whose estimated size exceeds the threshold.
   */
  public static detectOversizedModules(modules: PerformanceModuleSnapshot[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    for (const mod of modules) {
      if (mod.estimatedSizeKb > THRESHOLD_MAX_MODULE_SIZE_KB) {
        const sev: PerformanceSeverity =
          mod.estimatedSizeKb > THRESHOLD_MAX_MODULE_SIZE_KB * 2 ? 'error' : 'warning';
        issues.push(
          issue(
            'perf_size',
            'oversized_module',
            'bundle_size',
            sev,
            mod.modulePath,
            `Module '${mod.modulePath}' has an estimated size of ${mod.estimatedSizeKb} KB (limit: ${THRESHOLD_MAX_MODULE_SIZE_KB} KB).`,
            mod.estimatedSizeKb,
            THRESHOLD_MAX_MODULE_SIZE_KB,
            `Consider splitting '${mod.modulePath}' into smaller focused modules to reduce bundle size.`
          )
        );
      }
    }

    return issues;
  }

  // ─── Deep Import Chain Detection ─────────────────────────────────────────

  /**
   * Flag modules with an import chain depth exceeding the threshold.
   */
  public static detectDeepImportChains(modules: PerformanceModuleSnapshot[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    for (const mod of modules) {
      if (mod.importDepth > THRESHOLD_MAX_IMPORT_DEPTH) {
        const sev: PerformanceSeverity =
          mod.importDepth > THRESHOLD_MAX_IMPORT_DEPTH * 2 ? 'error' : 'warning';
        issues.push(
          issue(
            'perf_depth',
            'deep_import_chain',
            'import_depth',
            sev,
            mod.modulePath,
            `Module '${mod.modulePath}' is ${mod.importDepth} import levels deep (limit: ${THRESHOLD_MAX_IMPORT_DEPTH}).`,
            mod.importDepth,
            THRESHOLD_MAX_IMPORT_DEPTH,
            `Flatten the dependency hierarchy to reduce the import chain depth reaching '${mod.modulePath}'.`
          )
        );
      }
    }

    return issues;
  }

  // ─── Hotspot Detection ────────────────────────────────────────────────────

  /**
   * Identify architectural hotspots — modules with both high fan-in and high
   * fan-out are central structural bottlenecks.
   */
  public static detectHotspots(modules: PerformanceModuleSnapshot[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    for (const mod of modules) {
      const hotspotScore = mod.fanIn + mod.fanOut;

      if (mod.fanIn > THRESHOLD_MAX_FAN_IN) {
        issues.push(
          issue(
            'perf_fanin',
            'high_fan_in',
            'hotspot',
            'warning',
            mod.modulePath,
            `Module '${mod.modulePath}' has a fan-in of ${mod.fanIn} (limit: ${THRESHOLD_MAX_FAN_IN}). Too many modules depend on it.`,
            mod.fanIn,
            THRESHOLD_MAX_FAN_IN,
            `Extract a stable public interface from '${mod.modulePath}' to reduce its coupling.`
          )
        );
      }

      if (mod.fanOut > THRESHOLD_MAX_FAN_OUT) {
        issues.push(
          issue(
            'perf_fanout',
            'high_fan_out',
            'hotspot',
            'warning',
            mod.modulePath,
            `Module '${mod.modulePath}' has a fan-out of ${mod.fanOut} (limit: ${THRESHOLD_MAX_FAN_OUT}). It imports too many modules.`,
            mod.fanOut,
            THRESHOLD_MAX_FAN_OUT,
            `Decompose '${mod.modulePath}' into cohesive sub-modules each responsible for fewer concerns.`
          )
        );
      }

      if (hotspotScore >= THRESHOLD_HOTSPOT_SCORE) {
        issues.push(
          issue(
            'perf_hot',
            'architectural_hotspot',
            'hotspot',
            'error',
            mod.modulePath,
            `Module '${mod.modulePath}' is an architectural hotspot (fan-in ${mod.fanIn} + fan-out ${mod.fanOut} = ${hotspotScore}, threshold: ${THRESHOLD_HOTSPOT_SCORE}).`,
            hotspotScore,
            THRESHOLD_HOTSPOT_SCORE,
            `Treat '${mod.modulePath}' as a priority refactoring target — extract stable interfaces and reduce coupling.`
          )
        );
      }
    }

    return issues;
  }

  // ─── Barrel Bloat Detection ───────────────────────────────────────────────

  /**
   * Flag barrels exporting more symbols than the recommended maximum.
   * A bloated barrel forces consumers to load all symbols even when they need only a few.
   */
  public static detectBarrelBloat(modules: PerformanceModuleSnapshot[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    for (const mod of modules) {
      if (mod.exportCount > THRESHOLD_MAX_EXPORT_COUNT) {
        issues.push(
          issue(
            'perf_barrel',
            'barrel_bloat',
            're_export_overhead',
            'warning',
            mod.modulePath,
            `Barrel '${mod.modulePath}' exports ${mod.exportCount} symbols (limit: ${THRESHOLD_MAX_EXPORT_COUNT}). Consumers pay the cost of all exports even when using only a few.`,
            mod.exportCount,
            THRESHOLD_MAX_EXPORT_COUNT,
            `Split the barrel into focused sub-barrels (e.g. by feature area) or enable named sub-path exports.`
          )
        );
      }
    }

    return issues;
  }

  // ─── Split Candidate Detection ────────────────────────────────────────────

  /**
   * Modules with a very high export count combined with high complexity are
   * candidates for being split into smaller, more focused packages.
   */
  public static detectSplitCandidates(modules: PerformanceModuleSnapshot[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    for (const mod of modules) {
      if (
        mod.exportCount > THRESHOLD_SPLIT_CANDIDATE_EXPORTS &&
        mod.fanOut > THRESHOLD_MAX_FAN_OUT / 2
      ) {
        issues.push(
          issue(
            'perf_split',
            'split_candidate',
            'split_opportunity',
            'info',
            mod.modulePath,
            `Module '${mod.modulePath}' exports ${mod.exportCount} symbols and imports ${mod.fanOut} modules — it is a strong candidate for being split into focused sub-packages.`,
            mod.exportCount,
            THRESHOLD_SPLIT_CANDIDATE_EXPORTS,
            `Identify cohesive groups of exports in '${mod.modulePath}' and extract them into dedicated packages.`
          )
        );
      }
    }

    return issues;
  }

  // ─── High Complexity Detection ────────────────────────────────────────────

  /**
   * Modules where fan-out × import depth exceeds a structural complexity budget.
   */
  public static detectHighComplexity(modules: PerformanceModuleSnapshot[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const COMPLEXITY_BUDGET = THRESHOLD_MAX_FAN_OUT * THRESHOLD_MAX_IMPORT_DEPTH; // 75

    for (const mod of modules) {
      const complexity = mod.fanOut * mod.importDepth;
      if (complexity > COMPLEXITY_BUDGET) {
        const sev: PerformanceSeverity = complexity > COMPLEXITY_BUDGET * 2 ? 'error' : 'warning';
        issues.push(
          issue(
            'perf_cplx',
            'high_module_complexity',
            'module_complexity',
            sev,
            mod.modulePath,
            `Module '${mod.modulePath}' has a structural complexity score of ${complexity} (fan-out ${mod.fanOut} × depth ${mod.importDepth}; budget: ${COMPLEXITY_BUDGET}).`,
            complexity,
            COMPLEXITY_BUDGET,
            `Reduce the import depth or the number of dependencies in '${mod.modulePath}' to lower its complexity score.`
          )
        );
      }
    }

    return issues;
  }

  // ─── Excessive Re-Export Detection ───────────────────────────────────────

  /**
   * Modules that import many symbols only to re-export them incur overhead
   * in both the TypeScript compiler and bundlers.
   */
  public static detectExcessiveReExports(modules: PerformanceModuleSnapshot[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const REEXPORT_RATIO_THRESHOLD = 0.8; // if 80%+ of imports are re-exported

    for (const mod of modules) {
      if (mod.importCount > 0 && mod.exportCount > 0) {
        const ratio = mod.exportCount / mod.importCount;
        if (ratio >= REEXPORT_RATIO_THRESHOLD && mod.exportCount > 10) {
          issues.push(
            issue(
              'perf_reexp',
              'excessive_re_exports',
              're_export_overhead',
              'info',
              mod.modulePath,
              `Module '${mod.modulePath}' re-exports ${mod.exportCount} of ${mod.importCount} imported symbols (ratio: ${ratio.toFixed(2)}). This may slow TypeScript compilation.`,
              ratio,
              REEXPORT_RATIO_THRESHOLD,
              `Consider using direct imports instead of aggregating all symbols through '${mod.modulePath}'.`
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Utility ─────────────────────────────────────────────────────────────

  /**
   * Determine whether a dependency name is heuristically heavy.
   */
  public static isHeavyPackage(packageName: string): boolean {
    return [...HEAVY_PACKAGES].some((h) => packageName === h || packageName.startsWith(h + '/'));
  }

  /**
   * Compute a structural complexity score for a module snapshot.
   * complexity = fanOut × importDepth
   */
  public static complexityScore(mod: PerformanceModuleSnapshot): number {
    return mod.fanOut * mod.importDepth;
  }

  /**
   * Compute a hotspot score for a module snapshot.
   * hotspotScore = fanIn + fanOut
   */
  public static hotspotScore(mod: PerformanceModuleSnapshot): number {
    return mod.fanIn + mod.fanOut;
  }
}
