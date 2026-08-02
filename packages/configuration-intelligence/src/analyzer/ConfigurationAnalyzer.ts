import type {
  ConfigurationArtifact,
  ConfigurationIssue,
  ConfigurationIssueType,
  ConfigurationSeverity,
  ConfigurationToolType,
} from '../model/ConfigurationModel';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

function issue(
  prefix: string,
  issueType: ConfigurationIssueType,
  severity: ConfigurationSeverity,
  message: string,
  opts: {
    targetPath?: string;
    affectedPackages?: string[];
    conflictKey?: string;
    recommendation?: string;
  } = {}
): ConfigurationIssue {
  return { id: makeId(prefix), issueType, severity, message, ...opts };
}

// ---------------------------------------------------------------------------
// Canonical baseline values used across packages
// ---------------------------------------------------------------------------
const REQUIRED_TSCONFIG_KEYS: Array<{ key: string; expected: unknown; issueType: ConfigurationIssueType }> = [
  { key: 'strict',      expected: true,    issueType: 'strict_mode_disabled' },
  { key: 'declaration', expected: true,    issueType: 'declaration_disabled' },
];

const COMPATIBLE_TARGETS = new Set(['ES2020', 'ES2021', 'ES2022', 'ESNext']);

const REQUIRED_PACKAGE_JSON_FIELDS = ['main', 'types'] as const;

// ---------------------------------------------------------------------------
// ConfigurationAnalyzer — static, read-only analysis of configuration files
// ---------------------------------------------------------------------------
export class ConfigurationAnalyzer {

  // ─── Artifact Construction ───────────────────────────────────────────────

  /**
   * Convert raw config data into a typed ConfigurationArtifact list.
   * Callers provide the data; this class never touches the file system.
   */
  public static parseArtifacts(
    rawConfigs: Array<{
      filePath: string;
      packageName: string;
      toolType: ConfigurationToolType;
      settings: Record<string, unknown>;
      exists?: boolean;
    }>
  ): ConfigurationArtifact[] {
    return rawConfigs.map((r) => ({
      filePath: r.filePath,
      packageName: r.packageName,
      toolType: r.toolType,
      settings: r.settings,
      exists: r.exists ?? true,
    }));
  }

  // ─── Top-level Dispatch ──────────────────────────────────────────────────

  /**
   * Run all analysis passes and return the combined issue list.
   */
  public static analyzeAll(artifacts: ConfigurationArtifact[]): ConfigurationIssue[] {
    return [
      ...ConfigurationAnalyzer.detectMissingConfigs(artifacts),
      ...ConfigurationAnalyzer.analyzeTSConfigs(artifacts),
      ...ConfigurationAnalyzer.analyzePackageJsons(artifacts),
      ...ConfigurationAnalyzer.analyzeESLintConfigs(artifacts),
      ...ConfigurationAnalyzer.analyzePrettierConfigs(artifacts),
      ...ConfigurationAnalyzer.analyzeVitestConfigs(artifacts),
      ...ConfigurationAnalyzer.detectSettingDivergence(artifacts),
      ...ConfigurationAnalyzer.detectPathAliasMismatches(artifacts),
    ];
  }

  // ─── Missing Config Detection ────────────────────────────────────────────

  /**
   * For every artifact marked exists=false, emit a missing-config issue.
   */
  public static detectMissingConfigs(artifacts: ConfigurationArtifact[]): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];

    const missingMap: Record<ConfigurationToolType, ConfigurationIssueType> = {
      tsconfig:     'missing_tsconfig',
      package_json: 'missing_package_json',
      eslint:       'missing_eslint_config',
      prettier:     'missing_prettier_config',
      vitest:       'missing_vitest_config',
      bundler:      'missing_tsconfig', // reuse closest available
      postcss:      'missing_tsconfig',
      other:        'missing_tsconfig',
    };

    for (const artifact of artifacts) {
      if (!artifact.exists) {
        const issueType = missingMap[artifact.toolType];
        const pkgLabel = artifact.packageName ? ` in package '${artifact.packageName}'` : '';
        issues.push(
          issue(
            'cfg_miss',
            issueType,
            'error',
            `Required configuration file '${artifact.filePath}' is missing${pkgLabel}.`,
            {
              targetPath: artifact.filePath,
              affectedPackages: artifact.packageName ? [artifact.packageName] : [],
              recommendation: `Create '${artifact.filePath}' following the monorepo standards.`,
            }
          )
        );
      }
    }

    return issues;
  }

  // ─── TSConfig Analysis ───────────────────────────────────────────────────

  public static analyzeTSConfigs(artifacts: ConfigurationArtifact[]): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];
    const tsconfigs = artifacts.filter((a) => a.toolType === 'tsconfig' && a.exists);

    for (const artifact of tsconfigs) {
      const co = (artifact.settings.compilerOptions ?? artifact.settings) as Record<string, unknown>;

      // strict / declaration flags
      for (const { key, expected, issueType } of REQUIRED_TSCONFIG_KEYS) {
        if (co[key] !== expected) {
          issues.push(
            issue(
              'cfg_ts',
              issueType,
              'warning',
              `'${key}' is not set to ${String(expected)} in '${artifact.filePath}'.`,
              {
                targetPath: artifact.filePath,
                affectedPackages: artifact.packageName ? [artifact.packageName] : [],
                conflictKey: `compilerOptions.${key}`,
                recommendation: `Set compilerOptions.${key} = ${String(expected)} in '${artifact.filePath}'.`,
              }
            )
          );
        }
      }

      // Validate target compatibility
      const target = co['target'] as string | undefined;
      if (target && !COMPATIBLE_TARGETS.has(target)) {
        issues.push(
          issue(
            'cfg_ts',
            'incompatible_target',
            'warning',
            `TSConfig target '${target}' in '${artifact.filePath}' is outside the recommended set (${[...COMPATIBLE_TARGETS].join(', ')}).`,
            {
              targetPath: artifact.filePath,
              affectedPackages: artifact.packageName ? [artifact.packageName] : [],
              conflictKey: 'compilerOptions.target',
              recommendation: `Update compilerOptions.target to ES2022 or ESNext in '${artifact.filePath}'.`,
            }
          )
        );
      }
    }

    return issues;
  }

  // ─── Package.json Analysis ───────────────────────────────────────────────

  public static analyzePackageJsons(artifacts: ConfigurationArtifact[]): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];
    const manifests = artifacts.filter((a) => a.toolType === 'package_json' && a.exists);

    for (const artifact of manifests) {
      const s = artifact.settings;

      // Required top-level fields
      const fieldIssueMap: Record<typeof REQUIRED_PACKAGE_JSON_FIELDS[number], ConfigurationIssueType> = {
        main:  'missing_main_entry',
        types: 'missing_types_entry',
      };
      for (const field of REQUIRED_PACKAGE_JSON_FIELDS) {
        if (!s[field]) {
          issues.push(
            issue(
              'cfg_pkg',
              fieldIssueMap[field],
              'error',
              `'${field}' entry is missing from '${artifact.filePath}'.`,
              {
                targetPath: artifact.filePath,
                affectedPackages: artifact.packageName ? [artifact.packageName] : [],
                conflictKey: field,
                recommendation: `Add a '${field}' entry pointing to the package entry point in '${artifact.filePath}'.`,
              }
            )
          );
        }
      }

      // Test script presence
      const scripts = s['scripts'] as Record<string, string> | undefined;
      if (!scripts?.['test']) {
        issues.push(
          issue(
            'cfg_pkg',
            'missing_test_script',
            'warning',
            `No 'test' script defined in '${artifact.filePath}'.`,
            {
              targetPath: artifact.filePath,
              affectedPackages: artifact.packageName ? [artifact.packageName] : [],
              conflictKey: 'scripts.test',
              recommendation: `Add "test": "vitest run" to the scripts section of '${artifact.filePath}'.`,
            }
          )
        );
      }
    }

    return issues;
  }

  // ─── ESLint Config Analysis ───────────────────────────────────────────────

  public static analyzeESLintConfigs(artifacts: ConfigurationArtifact[]): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];
    const eslintConfigs = artifacts.filter((a) => a.toolType === 'eslint' && a.exists);

    for (const artifact of eslintConfigs) {
      const rules = artifact.settings['rules'] as Record<string, unknown> | undefined;

      if (rules) {
        // Detect contradictory rule pairs (simple heuristic)
        const ruleKeys = Object.keys(rules);
        const seen = new Map<string, string>();
        for (const key of ruleKeys) {
          // Flag if two rules in the same file have identical keys with differing values
          const val = String(rules[key]);
          if (seen.has(key) && seen.get(key) !== val) {
            issues.push(
              issue(
                'cfg_esl',
                'eslint_rule_conflict',
                'error',
                `ESLint rule '${key}' is defined with conflicting values in '${artifact.filePath}'.`,
                {
                  targetPath: artifact.filePath,
                  affectedPackages: artifact.packageName ? [artifact.packageName] : [],
                  conflictKey: `rules.${key}`,
                  recommendation: `Consolidate the '${key}' rule definition in '${artifact.filePath}'.`,
                }
              )
            );
          }
          seen.set(key, val);
        }
      }
    }

    return issues;
  }

  // ─── Prettier Config Analysis ─────────────────────────────────────────────

  public static analyzePrettierConfigs(artifacts: ConfigurationArtifact[]): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];
    const prettierConfigs = artifacts.filter((a) => a.toolType === 'prettier' && a.exists);

    // If more than one Prettier config exists, check for option divergence
    if (prettierConfigs.length >= 2) {
      const referenceArtifact = prettierConfigs[0];
      const referenceSettings = referenceArtifact.settings;

      for (let i = 1; i < prettierConfigs.length; i++) {
        const artifact = prettierConfigs[i];
        for (const key of Object.keys(referenceSettings)) {
          if (key in artifact.settings && artifact.settings[key] !== referenceSettings[key]) {
            issues.push(
              issue(
                'cfg_prt',
                'prettier_option_conflict',
                'warning',
                `Prettier option '${key}' differs between '${referenceArtifact.filePath}' (${String(referenceSettings[key])}) and '${artifact.filePath}' (${String(artifact.settings[key])}).`,
                {
                  targetPath: artifact.filePath,
                  affectedPackages: [referenceArtifact.packageName, artifact.packageName].filter(Boolean),
                  conflictKey: key,
                  recommendation: `Align the '${key}' option across all Prettier configuration files.`,
                }
              )
            );
          }
        }
      }
    }

    return issues;
  }

  // ─── Vitest Config Analysis ───────────────────────────────────────────────

  public static analyzeVitestConfigs(artifacts: ConfigurationArtifact[]): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];
    const vitestConfigs = artifacts.filter((a) => a.toolType === 'vitest' && a.exists);

    for (const artifact of vitestConfigs) {
      const hasTest = artifact.settings['test'];
      const coverage = (artifact.settings['test'] as Record<string, unknown> | undefined)?.['coverage'];
      if (hasTest && !coverage) {
        issues.push(
          issue(
            'cfg_vt',
            'vitest_coverage_missing',
            'info',
            `Vitest coverage is not configured in '${artifact.filePath}'.`,
            {
              targetPath: artifact.filePath,
              affectedPackages: artifact.packageName ? [artifact.packageName] : [],
              conflictKey: 'test.coverage',
              recommendation: `Add a coverage configuration block to '${artifact.filePath}' to enable test coverage reporting.`,
            }
          )
        );
      }
    }

    return issues;
  }

  // ─── Cross-Package Setting Divergence ────────────────────────────────────

  /**
   * Compare the same setting key across multiple packages of the same tool type.
   * If the value differs, emit a setting_divergence issue.
   */
  public static detectSettingDivergence(artifacts: ConfigurationArtifact[]): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];

    // Group artifacts by tool type
    const byTool = new Map<ConfigurationToolType, ConfigurationArtifact[]>();
    for (const artifact of artifacts.filter((a) => a.exists)) {
      const group = byTool.get(artifact.toolType) ?? [];
      group.push(artifact);
      byTool.set(artifact.toolType, group);
    }

    const DIVERGENCE_KEYS: Partial<Record<ConfigurationToolType, string[]>> = {
      tsconfig: ['strict', 'target', 'declaration', 'moduleResolution'],
      vitest:   ['globals', 'environment'],
    };

    for (const [toolType, group] of byTool) {
      if (group.length < 2) continue;
      const keys = DIVERGENCE_KEYS[toolType] ?? [];

      for (const key of keys) {
        const valueMap = new Map<string, string[]>();
        for (const artifact of group) {
          const co = (toolType === 'tsconfig'
            ? (artifact.settings.compilerOptions ?? artifact.settings)
            : artifact.settings) as Record<string, unknown>;
          const val = co[key];
          if (val !== undefined) {
            const valStr = String(val);
            const paths = valueMap.get(valStr) ?? [];
            paths.push(artifact.filePath);
            valueMap.set(valStr, paths);
          }
        }

        if (valueMap.size >= 2) {
          const summary = [...valueMap.entries()]
            .map(([v, paths]) => `${v}: [${paths.join(', ')}]`)
            .join(' vs ');
          issues.push(
            issue(
              'cfg_div',
              'setting_divergence',
              'warning',
              `Setting '${key}' diverges across ${toolType} configs: ${summary}.`,
              {
                affectedPackages: group.map((a) => a.packageName).filter(Boolean),
                conflictKey: key,
                recommendation: `Standardise '${key}' across all ${toolType} configuration files.`,
              }
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Path Alias Mismatch Detection ───────────────────────────────────────

  /**
   * Compare path aliases declared in tsconfig files across packages.
   * If the same alias key maps to different paths, emit a mismatch issue.
   */
  public static detectPathAliasMismatches(artifacts: ConfigurationArtifact[]): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];
    const tsconfigs = artifacts.filter((a) => a.toolType === 'tsconfig' && a.exists);

    // Build a map: alias -> [ { value, filePath } ]
    const aliasMap = new Map<string, Array<{ value: string; filePath: string; packageName: string }>>();

    for (const artifact of tsconfigs) {
      const co = (artifact.settings.compilerOptions ?? artifact.settings) as Record<string, unknown>;
      const paths = co['paths'] as Record<string, string[]> | undefined;
      if (!paths) continue;

      for (const [alias, targets] of Object.entries(paths)) {
        const targetStr = targets.join(',');
        const existing = aliasMap.get(alias) ?? [];
        existing.push({ value: targetStr, filePath: artifact.filePath, packageName: artifact.packageName });
        aliasMap.set(alias, existing);
      }
    }

    for (const [alias, entries] of aliasMap) {
      const uniqueValues = new Set(entries.map((e) => e.value));
      if (uniqueValues.size >= 2) {
        const summary = [...uniqueValues].join(' vs ');
        issues.push(
          issue(
            'cfg_alias',
            'path_alias_mismatch',
            'error',
            `Path alias '${alias}' maps to different targets across tsconfig files: ${summary}.`,
            {
              affectedPackages: entries.map((e) => e.packageName).filter(Boolean),
              conflictKey: `compilerOptions.paths.${alias}`,
              recommendation: `Align the '${alias}' path alias across all tsconfig files or define it once in the root tsconfig.`,
            }
          )
        );
      }
    }

    return issues;
  }
}
