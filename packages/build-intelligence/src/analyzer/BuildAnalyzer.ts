import { BuildConfiguration, BuildIssue } from '../model/BuildModel';

export class BuildAnalyzer {
  public static analyzeTSConfig(config: BuildConfiguration): BuildIssue[] {
    const issues: BuildIssue[] = [];

    if (config.strict !== true) {
      issues.push({
        id: `bld_strict_${Math.random().toString(36).substring(2, 6)}`,
        issueType: 'strict_disabled',
        severity: 'warning',
        message: `TypeScript strict mode is disabled in '${config.tsconfigPath}'.`,
        targetPath: config.tsconfigPath,
      });
    }

    if (config.declaration !== true) {
      issues.push({
        id: `bld_decl_${Math.random().toString(36).substring(2, 6)}`,
        issueType: 'declaration_disabled',
        severity: 'warning',
        message: `TypeScript declaration file generation (declaration: true) is disabled in '${config.tsconfigPath}'.`,
        targetPath: config.tsconfigPath,
      });
    }

    return issues;
  }

  public static analyzePackageManifest(packageName: string, manifest: Record<string, any>): BuildIssue[] {
    const issues: BuildIssue[] = [];

    if (!manifest.main) {
      issues.push({
        id: `bld_main_${Math.random().toString(36).substring(2, 6)}`,
        issueType: 'invalid_main',
        severity: 'error',
        message: `Package '${packageName}' manifest package.json is missing 'main' entry point.`,
        targetPath: packageName,
      });
    }

    if (!manifest.types) {
      issues.push({
        id: `bld_types_${Math.random().toString(36).substring(2, 6)}`,
        issueType: 'missing_types',
        severity: 'error',
        message: `Package '${packageName}' manifest package.json is missing 'types' entry point.`,
        targetPath: packageName,
      });
    }

    return issues;
  }
}
