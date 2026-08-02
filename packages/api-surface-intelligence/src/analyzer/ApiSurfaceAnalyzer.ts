import type {
  ApiChange,
  ApiChangeKind,
  ApiContract,
  ApiExport,
  ApiIssue,
  ApiIssueType,
  ApiSeverity,
  ApiSurface,
} from '../model/ApiSurfaceModel';

// ---------------------------------------------------------------------------
// Naming convention — exported symbols must be PascalCase (types/classes)
// or camelCase (functions/values). All-caps SCREAMING_SNAKE_CASE constants
// are also accepted.
// ---------------------------------------------------------------------------
const VALID_SYMBOL_RE = /^([A-Z][a-zA-Z0-9]*|[a-z][a-zA-Z0-9]*|[A-Z][A-Z0-9_]*)$/;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

function issue(
  prefix: string,
  issueType: ApiIssueType,
  severity: ApiSeverity,
  packageName: string,
  message: string,
  opts: {
    symbolName?: string;
    targetPath?: string;
    recommendation?: string;
    isBreaking?: boolean;
  } = {}
): ApiIssue {
  return { id: makeId(prefix), issueType, severity, packageName, message, ...opts };
}

// ---------------------------------------------------------------------------
// ApiSurfaceAnalyzer — static, read-only analysis of Public API surfaces
// ---------------------------------------------------------------------------
export class ApiSurfaceAnalyzer {

  // ─── Surface Construction ────────────────────────────────────────────────

  /**
   * Convert raw package data into typed ApiSurface objects.
   * Callers provide the data snapshot; this class never reads the file system.
   */
  public static parseSurfaces(
    rawPackages: Array<{
      packageName: string;
      barrelPath: string;
      hasBarrel?: boolean;
      barreledExports?: Array<Omit<ApiExport, 'isBarreled'>>;
      implementationExports?: Array<Omit<ApiExport, 'isBarreled'>>;
    }>
  ): ApiSurface[] {
    return rawPackages.map((pkg) => ({
      packageName: pkg.packageName,
      barrelPath: pkg.barrelPath,
      hasBarrel: pkg.hasBarrel ?? true,
      barreledExports: (pkg.barreledExports ?? []).map((e) => ({ ...e, isBarreled: true })),
      implementationExports: (pkg.implementationExports ?? []).map((e) => ({ ...e, isBarreled: false })),
    }));
  }

  // ─── Top-level Dispatch ──────────────────────────────────────────────────

  /**
   * Run all analysis passes and return the combined issue list.
   */
  public static analyzeAll(surfaces: ApiSurface[]): ApiIssue[] {
    return [
      ...ApiSurfaceAnalyzer.detectMissingBarrels(surfaces),
      ...ApiSurfaceAnalyzer.detectMissingExports(surfaces),
      ...ApiSurfaceAnalyzer.detectDeadExports(surfaces),
      ...ApiSurfaceAnalyzer.detectUnreachableModules(surfaces),
      ...ApiSurfaceAnalyzer.detectNamingInconsistencies(surfaces),
      ...ApiSurfaceAnalyzer.detectMissingTypeExports(surfaces),
      ...ApiSurfaceAnalyzer.detectUndocumentedExports(surfaces),
    ];
  }

  // ─── Missing Barrel Detection ─────────────────────────────────────────────

  /**
   * Every package must have a src/index.ts barrel.
   */
  public static detectMissingBarrels(surfaces: ApiSurface[]): ApiIssue[] {
    return surfaces
      .filter((s) => !s.hasBarrel)
      .map((s) =>
        issue(
          'api_barrel',
          'missing_index_barrel',
          'error',
          s.packageName,
          `Package '${s.packageName}' is missing a public API barrel at '${s.barrelPath}'.`,
          {
            targetPath: s.barrelPath,
            recommendation: `Create '${s.barrelPath}' and export all public symbols from the package.`,
          }
        )
      );
  }

  // ─── Missing Export Detection ─────────────────────────────────────────────

  /**
   * Symbols present in implementationExports but absent from barreledExports
   * are potentially unreachable by consumers.
   */
  public static detectMissingExports(surfaces: ApiSurface[]): ApiIssue[] {
    const issues: ApiIssue[] = [];

    for (const surface of surfaces.filter((s) => s.hasBarrel)) {
      const barreledNames = new Set(surface.barreledExports.map((e) => e.symbolName));

      for (const impl of surface.implementationExports) {
        if (!barreledNames.has(impl.symbolName)) {
          issues.push(
            issue(
              'api_miss',
              'missing_export',
              'warning',
              surface.packageName,
              `Symbol '${impl.symbolName}' in '${impl.sourceFile}' is not exported from the public barrel '${surface.barrelPath}'.`,
              {
                symbolName: impl.symbolName,
                targetPath: surface.barrelPath,
                recommendation: `Add 'export { ${impl.symbolName} } from '${impl.sourceFile}'' to '${surface.barrelPath}'.`,
              }
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Dead Export Detection ────────────────────────────────────────────────

  /**
   * Symbols present in barreledExports but absent from implementationExports
   * have no matching implementation (dead / ghost exports).
   */
  public static detectDeadExports(surfaces: ApiSurface[]): ApiIssue[] {
    const issues: ApiIssue[] = [];

    for (const surface of surfaces.filter((s) => s.hasBarrel)) {
      const implNames = new Set(surface.implementationExports.map((e) => e.symbolName));

      for (const barrelExport of surface.barreledExports) {
        if (!implNames.has(barrelExport.symbolName)) {
          issues.push(
            issue(
              'api_dead',
              'dead_export',
              'error',
              surface.packageName,
              `Barrel '${surface.barrelPath}' exports symbol '${barrelExport.symbolName}' which has no corresponding implementation.`,
              {
                symbolName: barrelExport.symbolName,
                targetPath: surface.barrelPath,
                isBreaking: false,
                recommendation: `Remove the dead export '${barrelExport.symbolName}' from '${surface.barrelPath}' or add the missing implementation.`,
              }
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Unreachable Module Detection ─────────────────────────────────────────

  /**
   * Implementation files that have zero exports reaching the barrel
   * are considered unreachable for consumers.
   */
  public static detectUnreachableModules(surfaces: ApiSurface[]): ApiIssue[] {
    const issues: ApiIssue[] = [];

    for (const surface of surfaces.filter((s) => s.hasBarrel)) {
      const barreledNames = new Set(surface.barreledExports.map((e) => e.symbolName));

      // Group implementation exports by source file
      const byFile = new Map<string, ApiExport[]>();
      for (const exp of surface.implementationExports) {
        const list = byFile.get(exp.sourceFile) ?? [];
        list.push(exp);
        byFile.set(exp.sourceFile, list);
      }

      for (const [sourceFile, exports] of byFile) {
        const anyReachable = exports.some((e) => barreledNames.has(e.symbolName));
        if (!anyReachable) {
          issues.push(
            issue(
              'api_reach',
              'unreachable_module',
              'warning',
              surface.packageName,
              `Module '${sourceFile}' in package '${surface.packageName}' has no symbols exported through the public barrel.`,
              {
                targetPath: sourceFile,
                recommendation: `Either export symbols from '${sourceFile}' via '${surface.barrelPath}', or mark the module as internal.`,
              }
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Naming Inconsistency Detection ──────────────────────────────────────

  /**
   * Exported symbol names must follow PascalCase (types/classes),
   * camelCase (functions/values) or SCREAMING_SNAKE_CASE (constants).
   */
  public static detectNamingInconsistencies(surfaces: ApiSurface[]): ApiIssue[] {
    const issues: ApiIssue[] = [];

    for (const surface of surfaces) {
      const allExports = [
        ...surface.barreledExports,
        ...surface.implementationExports,
      ];

      for (const exp of allExports) {
        if (!VALID_SYMBOL_RE.test(exp.symbolName)) {
          issues.push(
            issue(
              'api_name',
              'naming_inconsistency',
              'warning',
              surface.packageName,
              `Exported symbol '${exp.symbolName}' in '${surface.packageName}' does not follow the naming convention (PascalCase / camelCase / SCREAMING_SNAKE_CASE).`,
              {
                symbolName: exp.symbolName,
                targetPath: exp.sourceFile,
                recommendation: `Rename '${exp.symbolName}' to follow the monorepo naming convention.`,
              }
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Missing Type Export Detection ───────────────────────────────────────

  /**
   * For every value export (class / function), the public barrel should also
   * export its corresponding type/interface if one exists in the implementation.
   */
  public static detectMissingTypeExports(surfaces: ApiSurface[]): ApiIssue[] {
    const issues: ApiIssue[] = [];

    for (const surface of surfaces.filter((s) => s.hasBarrel)) {
      const barreledTypes = new Set(
        surface.barreledExports.filter((e) => e.kind === 'type').map((e) => e.symbolName)
      );

      const implTypes = surface.implementationExports.filter((e) => e.kind === 'type');

      for (const typeExport of implTypes) {
        if (!barreledTypes.has(typeExport.symbolName)) {
          issues.push(
            issue(
              'api_type',
              'type_export_missing',
              'warning',
              surface.packageName,
              `Type '${typeExport.symbolName}' is defined in '${typeExport.sourceFile}' but not re-exported from the public barrel '${surface.barrelPath}'.`,
              {
                symbolName: typeExport.symbolName,
                targetPath: surface.barrelPath,
                recommendation: `Add 'export type { ${typeExport.symbolName} }' to '${surface.barrelPath}'.`,
              }
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Undocumented Export Detection ───────────────────────────────────────

  public static detectUndocumentedExports(surfaces: ApiSurface[]): ApiIssue[] {
    const issues: ApiIssue[] = [];

    for (const surface of surfaces) {
      for (const exp of surface.barreledExports) {
        if (!exp.isDocumented) {
          issues.push(
            issue(
              'api_doc',
              'undocumented_export',
              'info',
              surface.packageName,
              `Public export '${exp.symbolName}' in '${surface.packageName}' lacks documentation (JSDoc / TSDoc).`,
              {
                symbolName: exp.symbolName,
                targetPath: exp.sourceFile,
                recommendation: `Add a JSDoc comment to '${exp.symbolName}' describing its purpose, parameters and return value.`,
              }
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── API Change Classification ────────────────────────────────────────────

  /**
   * Compare two snapshots of the same package's API surface and classify all
   * changes as breaking, non-breaking, addition or removal.
   */
  public static classifyChanges(
    previous: ApiSurface,
    current: ApiSurface
  ): ApiChange[] {
    const changes: ApiChange[] = [];
    const prevNames = new Map(previous.barreledExports.map((e) => [e.symbolName, e]));
    const currNames = new Map(current.barreledExports.map((e) => [e.symbolName, e]));

    // Removals — present in previous, absent in current → BREAKING
    for (const [name, prev] of prevNames) {
      if (!currNames.has(name)) {
        changes.push({
          packageName: current.packageName,
          kind: 'removal',
          symbolName: name,
          description: `Public export '${name}' (${prev.kind}) was removed — this is a BREAKING change.`,
        });
      }
    }

    // Additions — absent in previous, present in current → non-breaking
    for (const [name, curr] of currNames) {
      if (!prevNames.has(name)) {
        changes.push({
          packageName: current.packageName,
          kind: 'addition',
          symbolName: name,
          description: `Public export '${name}' (${curr.kind}) was added — this is a non-breaking change.`,
        });
      }
    }

    // Kind changes (e.g. value → type) → BREAKING
    for (const [name, curr] of currNames) {
      const prev = prevNames.get(name);
      if (prev && prev.kind !== curr.kind) {
        changes.push({
          packageName: current.packageName,
          kind: 'breaking',
          symbolName: name,
          description: `Export kind of '${name}' changed from '${prev.kind}' to '${curr.kind}' — this is a BREAKING change.`,
        });
      }
    }

    return changes;
  }

  /**
   * Convert ApiChange objects to ApiIssue objects for unified reporting.
   */
  public static changesToIssues(changes: ApiChange[]): ApiIssue[] {
    return changes.map((c) => {
      const isBreaking = c.kind === 'breaking' || c.kind === 'removal';
      const severity: ApiSeverity = isBreaking ? 'error' : 'info';
      const issueType: ApiIssueType = isBreaking ? 'breaking_change' : 'non_breaking_change';

      return issue(
        'api_chg',
        issueType,
        severity,
        c.packageName,
        c.description,
        {
          symbolName: c.symbolName,
          isBreaking,
          recommendation: isBreaking
            ? `Increment the major version of '${c.packageName}' if this removal/change is intentional.`
            : undefined,
        }
      );
    });
  }

  /**
   * Validate a surface against a formal ApiContract.
   */
  public static validateContract(
    surface: ApiSurface,
    contract: ApiContract
  ): ApiIssue[] {
    const issues: ApiIssue[] = [];
    const barreledNames = new Set(surface.barreledExports.map((e) => e.symbolName));

    // Required exports that are missing
    for (const required of contract.requiredExports) {
      if (!barreledNames.has(required)) {
        issues.push(
          issue(
            'api_contract',
            'contract_violation',
            'critical',
            surface.packageName,
            `Contract requires symbol '${required}' to be exported from '${surface.packageName}', but it is absent from the barrel.`,
            {
              symbolName: required,
              targetPath: surface.barrelPath,
              isBreaking: true,
              recommendation: `Export '${required}' from '${surface.barrelPath}' or update the contract.`,
            }
          )
        );
      }
    }

    // Forbidden exports that are present
    for (const forbidden of contract.forbiddenExports) {
      if (barreledNames.has(forbidden)) {
        issues.push(
          issue(
            'api_contract',
            'policy_violation',
            'error',
            surface.packageName,
            `Symbol '${forbidden}' is explicitly forbidden from the Public API of '${surface.packageName}' but appears in the barrel.`,
            {
              symbolName: forbidden,
              targetPath: surface.barrelPath,
              recommendation: `Remove '${forbidden}' from the public barrel or move it to an internal module.`,
            }
          )
        );
      }
    }

    return issues;
  }
}
