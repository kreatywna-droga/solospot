import { RuleViolation, ArchitectureValidationResult } from '../rules/ArchitectureRules';

export class ArchitectureReportGenerator {
  public static calculateScore(violations: RuleViolation[]): number {
    let score = 100;
    for (const v of violations) {
      if (v.severity === 'critical') score -= 25;
      else if (v.severity === 'error') score -= 15;
      else if (v.severity === 'warning') score -= 5;
      else if (v.severity === 'info') score -= 1;
    }
    return Math.max(0, Math.min(100, score));
  }

  public static generateResult(violations: RuleViolation[], rulesEvaluatedCount: number = 4): ArchitectureValidationResult {
    const score = ArchitectureReportGenerator.calculateScore(violations);
    const isValid = !violations.some(v => v.severity === 'critical' || v.severity === 'error');

    return {
      isValid,
      score,
      violations,
      rulesEvaluatedCount,
    };
  }

  public static toMarkdown(result: ArchitectureValidationResult): string {
    const lines: string[] = [];

    lines.push('# Monorepo Architecture Validation Report');
    lines.push('');
    lines.push(`- **Architecture Score:** **${result.score} / 100**`);
    lines.push(`- **Validation Status:** ${result.isValid ? 'PASSED ✅' : 'FAILED ❌'}`);
    lines.push(`- **Rules Evaluated:** ${result.rulesEvaluatedCount}`);
    lines.push(`- **Total Violations:** ${result.violations.length}`);
    lines.push('');

    if (result.violations.length > 0) {
      lines.push('## Violations List');
      lines.push('');
      lines.push('| Rule ID | Category | Severity | Message | Target |');
      lines.push('|---------|----------|----------|---------|--------|');
      for (const v of result.violations) {
        lines.push(`| \`${v.ruleId}\` | ${v.category} | **${v.severity.toUpperCase()}** | ${v.message} | \`${v.targetPath || 'global'}\` |`);
      }
      lines.push('');
    } else {
      lines.push('## Violations List');
      lines.push('');
      lines.push('🎉 **No architecture violations detected! Perfect compliance.**');
      lines.push('');
    }

    return lines.join('\n');
  }

  public static toJSON(result: ArchitectureValidationResult): string {
    return JSON.stringify(result, null, 2);
  }
}
