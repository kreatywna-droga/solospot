export type FindingSeverity = 'info' | 'warning' | 'error';
export type FindingCategory = 'naming' | 'duplication' | 'structure' | 'orphan' | 'exports';

export interface QualityFinding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  message: string;
  filePath?: string;
}

export class QualityAnalyzer {
  public static checkNamingConventions(filePaths: string[]): QualityFinding[] {
    const findings: QualityFinding[] = [];
    for (const file of filePaths) {
      const fileName = file.split('/').pop() || '';
      if (fileName.endsWith('.ts') && !fileName.endsWith('.test.ts') && !fileName.endsWith('.d.ts')) {
        // Check if file uses valid camelCase or PascalCase
        if (/[A-Z]/.test(fileName.charAt(0)) && !fileName.endsWith('Component.ts') && !fileName.endsWith('Engine.ts') && !fileName.endsWith('State.ts') && !fileName.endsWith('API.ts') && !fileName.endsWith('SDK.ts') && !fileName.endsWith('CLI.ts')) {
          findings.push({
            id: `q_naming_${Math.random().toString(36).substring(2, 6)}`,
            category: 'naming',
            severity: 'info',
            message: `File name '${fileName}' uses PascalCase conventions.`,
            filePath: file,
          });
        }
      }
    }
    return findings;
  }

  public static detectOrphanModules(filePaths: string[], importsMap: Record<string, string[]>): QualityFinding[] {
    const findings: QualityFinding[] = [];
    const allImported = new Set<string>();

    for (const deps of Object.values(importsMap)) {
      for (const d of deps) {
        allImported.add(d);
      }
    }

    for (const file of filePaths) {
      if (file.endsWith('index.ts') || file.endsWith('package.json') || file.endsWith('README.md') || file.endsWith('.test.ts')) {
        continue;
      }
      const baseName = file.split('/').pop()?.replace(/\.ts$/, '') || '';
      let isImported = false;
      for (const imp of allImported) {
        if (imp.includes(baseName) || imp.includes(file)) {
          isImported = true;
          break;
        }
      }
      if (!isImported && allImported.size > 0) {
        findings.push({
          id: `q_orphan_${Math.random().toString(36).substring(2, 6)}`,
          category: 'orphan',
          severity: 'warning',
          message: `Potential orphan module '${file}' - not directly referenced in imports map.`,
          filePath: file,
        });
      }
    }

    return findings;
  }

  public static checkPackageStructure(filePaths: string[]): QualityFinding[] {
    const findings: QualityFinding[] = [];
    const hasIndex = filePaths.some(f => f.endsWith('index.ts'));
    const hasReadme = filePaths.some(f => f.endsWith('README.md'));
    const hasPackageJson = filePaths.some(f => f.endsWith('package.json'));

    if (!hasIndex) {
      findings.push({
        id: `q_struct_index`,
        category: 'structure',
        severity: 'error',
        message: 'Package missing entrypoint index.ts file.',
      });
    }
    if (!hasReadme) {
      findings.push({
        id: `q_struct_readme`,
        category: 'structure',
        severity: 'info',
        message: 'Package missing README.md documentation file.',
      });
    }
    if (!hasPackageJson) {
      findings.push({
        id: `q_struct_pkg`,
        category: 'structure',
        severity: 'warning',
        message: 'Package missing package.json manifest.',
      });
    }

    return findings;
  }
}
