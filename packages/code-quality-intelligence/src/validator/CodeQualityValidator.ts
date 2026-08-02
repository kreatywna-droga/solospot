import type {
  CodeQualityAssessment,
  CodeQualityCategory,
  CodeQualityFileSnapshot,
  CodeQualityIssue,
  CodeQualityIssueType,
  CodeQualityMetric,
  CodeQualityRecommendation,
  CodeQualitySeverity,
} from '../model/CodeQualityModel';
import { CodeQualityAnalyzer } from '../analyzer/CodeQualityAnalyzer';

// ---------------------------------------------------------------------------
// Quantitative limit thresholds for Code Quality Standards
// ---------------------------------------------------------------------------
const LIMIT_MAX_COMPLEXITY_ISSUES  = 0;
const LIMIT_MAX_DUPLICATION_ISSUES = 0;
const LIMIT_MAX_OVERSIZED_FILES    = 0;
const LIMIT_MIN_MAINTAINABILITY     = 70; // Maintainability index score >= 70

// ---------------------------------------------------------------------------
// CodeQualityValidator — issue classification, threshold checking, prioritisation
// ---------------------------------------------------------------------------
export class CodeQualityValidator {

  // ─── Core Assessment ─────────────────────────────────────────────────────

  /**
   * Aggregate a raw issue list into a CodeQualityAssessment.
   * Read-only — no code modifications, no auto-refactoring.
   */
  public static assessIssues(
    issues: CodeQualityIssue[],
    files: CodeQualityFileSnapshot[] = []
  ): CodeQualityAssessment {
    const byCategory: Partial<Record<CodeQualityCategory, CodeQualityIssue[]>> = {};
    const byType: Partial<Record<CodeQualityIssueType, CodeQualityIssue[]>> = {};

    let infoCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let criticalCount = 0;

    for (const iss of issues) {
      if (!byCategory[iss.category]) byCategory[iss.category] = [];
      byCategory[iss.category]!.push(iss);

      if (!byType[iss.issueType]) byType[iss.issueType] = [];
      byType[iss.issueType]!.push(iss);

      switch (iss.severity) {
        case 'info':     infoCount++;     break;
        case 'warning':  warningCount++;  break;
        case 'error':    errorCount++;    break;
        case 'critical': criticalCount++; break;
      }
    }

    const mi = CodeQualityAnalyzer.calculateMaintainabilityIndex(files, issues);
    const metrics = CodeQualityValidator.validateLimits(issues, files);
    const recommendations = CodeQualityValidator.prioritiseRecommendations(issues);

    return {
      totalIssues: issues.length,
      infoCount,
      warningCount,
      errorCount,
      criticalCount,
      byCategory,
      byType,
      metrics,
      maintainabilityIndex: mi,
      recommendations,
    };
  }

  // ─── Limit Validation ────────────────────────────────────────────────────

  public static validateLimits(
    issues: CodeQualityIssue[],
    files: CodeQualityFileSnapshot[] = []
  ): CodeQualityMetric[] {
    const complexityCount  = issues.filter((i) => i.issueType === 'high_cyclomatic_complexity').length;
    const duplicationCount = issues.filter((i) => i.issueType === 'code_duplication').length;
    const oversizedCount   = issues.filter((i) => i.issueType === 'oversized_file').length;

    const mi = CodeQualityAnalyzer.calculateMaintainabilityIndex(files, issues);

    return [
      {
        metricName: 'highComplexityCount',
        value: complexityCount,
        targetValue: LIMIT_MAX_COMPLEXITY_ISSUES,
        passing: complexityCount <= LIMIT_MAX_COMPLEXITY_ISSUES,
        unit: 'functions',
      },
      {
        metricName: 'codeDuplicationCount',
        value: duplicationCount,
        targetValue: LIMIT_MAX_DUPLICATION_ISSUES,
        passing: duplicationCount <= LIMIT_MAX_DUPLICATION_ISSUES,
        unit: 'blocks',
      },
      {
        metricName: 'oversizedFileCount',
        value: oversizedCount,
        targetValue: LIMIT_MAX_OVERSIZED_FILES,
        passing: oversizedCount <= LIMIT_MAX_OVERSIZED_FILES,
        unit: 'files',
      },
      {
        metricName: 'maintainabilityIndex',
        value: mi,
        targetValue: LIMIT_MIN_MAINTAINABILITY,
        passing: mi >= LIMIT_MIN_MAINTAINABILITY,
        unit: 'score',
      },
    ];
  }

  // ─── Recommendation Prioritisation ───────────────────────────────────────

  public static prioritiseRecommendations(issues: CodeQualityIssue[]): CodeQualityRecommendation[] {
    const recs: CodeQualityRecommendation[] = [];
    let priority = 1;

    const groups: Array<{
      category: CodeQualityCategory;
      types: CodeQualityIssueType[];
      title: string;
      description: string;
      impact: CodeQualityRecommendation['estimatedImpact'];
      effort: CodeQualityRecommendation['effort'];
    }> = [
      {
        category: 'complexity',
        types: ['high_cyclomatic_complexity'],
        title: 'Reduce Function Cyclomatic Complexity',
        description: 'Functions with high branching complexity are bug-prone and difficult to unit test.',
        impact: 'high',
        effort: 'medium',
      },
      {
        category: 'duplication',
        types: ['code_duplication'],
        title: 'Refactor Duplicated Code Blocks',
        description: 'Duplicated code increases maintenance effort and risks inconsistent bug fixes.',
        impact: 'high',
        effort: 'medium',
      },
      {
        category: 'file_length',
        types: ['oversized_file'],
        title: 'Decompose Oversized Files',
        description: 'Files exceeding 300 lines hinder readability and navigation.',
        impact: 'medium',
        effort: 'medium',
      },
      {
        category: 'function_length',
        types: ['long_function'],
        title: 'Shorten Long Functions',
        description: 'Functions exceeding 50 lines violate the single responsibility principle.',
        impact: 'medium',
        effort: 'low',
      },
      {
        category: 'design_convention',
        types: ['excessive_parameters', 'missing_return_type'],
        title: 'Enforce Function Design Conventions',
        description: 'Functions with > 4 parameters should use options objects for better readability.',
        impact: 'low',
        effort: 'low',
      },
      {
        category: 'dead_code',
        types: ['dead_code_detected'],
        title: 'Clean Up Unused Code and Block Comments',
        description: 'Dead functions and commented-out code blocks clutter the codebase.',
        impact: 'low',
        effort: 'low',
      },
    ];

    for (const group of groups) {
      const matches = issues.filter((i) => group.types.includes(i.issueType));
      if (matches.length > 0) {
        recs.push({
          priority: priority++,
          category: group.category,
          title: group.title,
          description: `${group.description} (${matches.length} instance${matches.length > 1 ? 's' : ''} detected)`,
          estimatedImpact: group.impact,
          effort: group.effort,
        });
      }
    }

    return recs;
  }

  // ─── Classification Utilities ─────────────────────────────────────────────

  public static sortBySeverity(issues: CodeQualityIssue[]): CodeQualityIssue[] {
    const order: Record<CodeQualitySeverity, number> = {
      critical: 0, error: 1, warning: 2, info: 3,
    };
    return [...issues].sort((a, b) => order[a.severity] - order[b.severity]);
  }

  public static filterByCategory(
    issues: CodeQualityIssue[],
    category: CodeQualityCategory
  ): CodeQualityIssue[] {
    return issues.filter((i) => i.category === category);
  }

  public static filterBySeverity(
    issues: CodeQualityIssue[],
    severity: CodeQualitySeverity
  ): CodeQualityIssue[] {
    return issues.filter((i) => i.severity === severity);
  }
}
