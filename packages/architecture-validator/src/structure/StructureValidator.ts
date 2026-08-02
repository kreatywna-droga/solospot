import { RuleViolation } from '../rules/ArchitectureRules';

export class StructureValidator {
  public static validatePackageStructure(packageName: string, filePaths: string[]): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const hasIndex = filePaths.some(f => f.endsWith('index.ts'));
    const hasPackageJson = filePaths.some(f => f.endsWith('package.json'));
    const hasReadme = filePaths.some(f => f.endsWith('README.md'));

    if (!hasIndex || !hasPackageJson || !hasReadme) {
      const missing: string[] = [];
      if (!hasIndex) missing.push('src/index.ts');
      if (!hasPackageJson) missing.push('package.json');
      if (!hasReadme) missing.push('README.md');

      violations.push({
        ruleId: 'ARCH-003',
        category: 'structure',
        severity: 'warning',
        message: `Package '${packageName}' is missing required files: ${missing.join(', ')}.`,
        targetPath: packageName,
      });
    }

    return violations;
  }
}
