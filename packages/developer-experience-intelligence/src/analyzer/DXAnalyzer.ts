import { DXIssue } from '../model/DXModel';

export class DXAnalyzer {
  public static analyzeNamingConventions(packageName: string, exportNames: string[]): DXIssue[] {
    const issues: DXIssue[] = [];

    for (const exp of exportNames) {
      // Check if export name uses non-standard casing (e.g. UPPERCASE_CONSTANT instead of Pascal/camel)
      if (exp.length > 1 && exp === exp.toUpperCase() && !exp.startsWith('DEFAULT_')) {
        issues.push({
          id: `dx_name_${Math.random().toString(36).substring(2, 6)}`,
          category: 'naming',
          severity: 'warning',
          message: `Export '${exp}' in package '${packageName}' uses raw UPPERCASE naming instead of camelCase or PascalCase.`,
          targetPath: packageName,
        });
      }
    }

    return issues;
  }

  public static analyzeExportCompleteness(packageName: string, filePaths: string[], indexExportPaths: string[]): DXIssue[] {
    const issues: DXIssue[] = [];

    // Find TypeScript source files that are not re-exported by index.ts
    const internalSourceFiles = filePaths.filter(f => f.endsWith('.ts') && !f.endsWith('index.ts') && !f.endsWith('.test.ts'));

    if (internalSourceFiles.length > 0 && indexExportPaths.length === 0) {
      issues.push({
        id: `dx_exp_${Math.random().toString(36).substring(2, 6)}`,
        category: 'exports',
        severity: 'error',
        message: `Package '${packageName}' has ${internalSourceFiles.length} internal source modules but zero re-exports in src/index.ts.`,
        targetPath: packageName,
      });
    }

    return issues;
  }
}
