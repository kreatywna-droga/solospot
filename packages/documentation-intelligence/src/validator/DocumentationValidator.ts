import type {
  DocumentationAssessment,
  DocumentationCategory,
  DocumentationCoverage,
  DocumentationIssue,
  DocumentationIssueType,
  DocumentationRecommendation,
  DocumentationSeverity,
} from '../model/DocumentationModel';

// ---------------------------------------------------------------------------
// Quantitative limit thresholds for Documentation Standards
// ---------------------------------------------------------------------------
const LIMIT_MIN_README_COVERAGE        = 0.9;  // 90% of packages must have README
const LIMIT_MIN_ADR_COVERAGE           = 0.8;  // 80% of topics must have ADRs
const LIMIT_MAX_ORPHANED_DOCS          = 0;    // 0 orphaned docs allowed
const LIMIT_MAX_CHECKLIST_MISMATCHES   = 0;    // 0 checklist mismatches allowed

export interface DocumentationMetric {
  metricName: string;
  value: number;
  targetValue: number;
  passing: boolean;
  unit?: string;
}

// ---------------------------------------------------------------------------
// DocumentationValidator — issue classification, threshold checking, prioritisation
// ---------------------------------------------------------------------------
export class DocumentationValidator {

  // ─── Core Assessment ─────────────────────────────────────────────────────

  /**
   * Aggregate a raw issue list and coverage snapshot into a DocumentationAssessment.
   * Read-only — no code/documentation modifications.
   */
  public static assessIssues(
    issues: DocumentationIssue[],
    coverage: DocumentationCoverage
  ): DocumentationAssessment {
    const byCategory: Partial<Record<DocumentationCategory, DocumentationIssue[]>> = {};
    const byType: Partial<Record<DocumentationIssueType, DocumentationIssue[]>> = {};

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

    const recommendations = DocumentationValidator.prioritiseRecommendations(issues, coverage);

    return {
      totalIssues: issues.length,
      infoCount,
      warningCount,
      errorCount,
      criticalCount,
      byCategory,
      byType,
      coverage,
      recommendations,
    };
  }

  // ─── Limit Validation ────────────────────────────────────────────────────

  /**
   * Check measured values against Documentation Standards limits.
   */
  public static validateLimits(
    issues: DocumentationIssue[],
    coverage: DocumentationCoverage
  ): DocumentationMetric[] {
    const orphanedCount = issues.filter((i) => i.issueType === 'orphaned_document').length;
    const checklistMismatches = issues.filter(
      (i) => i.category === 'checklist_alignment' && i.severity !== 'info'
    ).length;

    return [
      {
        metricName: 'readmeCoverageRate',
        value: coverage.readmeCoverageRate,
        targetValue: LIMIT_MIN_README_COVERAGE,
        passing: coverage.readmeCoverageRate >= LIMIT_MIN_README_COVERAGE,
        unit: 'ratio',
      },
      {
        metricName: 'adrCoverageRate',
        value: coverage.adrCoverageRate,
        targetValue: LIMIT_MIN_ADR_COVERAGE,
        passing: coverage.adrCoverageRate >= LIMIT_MIN_ADR_COVERAGE,
        unit: 'ratio',
      },
      {
        metricName: 'orphanedDocsCount',
        value: orphanedCount,
        targetValue: LIMIT_MAX_ORPHANED_DOCS,
        passing: orphanedCount <= LIMIT_MAX_ORPHANED_DOCS,
        unit: 'docs',
      },
      {
        metricName: 'checklistMismatchCount',
        value: checklistMismatches,
        targetValue: LIMIT_MAX_CHECKLIST_MISMATCHES,
        passing: checklistMismatches <= LIMIT_MAX_CHECKLIST_MISMATCHES,
        unit: 'mismatches',
      },
    ];
  }

  // ─── Recommendation Prioritisation ───────────────────────────────────────

  /**
   * Derive a prioritised list of DocumentationRecommendation objects.
   */
  public static prioritiseRecommendations(
    issues: DocumentationIssue[],
    coverage: DocumentationCoverage
  ): DocumentationRecommendation[] {
    const recs: DocumentationRecommendation[] = [];
    let priority = 1;

    const groups: Array<{
      category: DocumentationCategory;
      types: DocumentationIssueType[];
      title: string;
      description: string;
      impact: DocumentationRecommendation['estimatedImpact'];
      effort: DocumentationRecommendation['effort'];
    }> = [
      {
        category: 'completeness',
        types: ['missing_package_doc', 'missing_readme'],
        title: 'Create Missing Package Documentation',
        description: 'Packages without a README.md or spec file hinder onboarding and maintainability.',
        impact: 'high',
        effort: 'medium',
      },
      {
        category: 'adr_coverage',
        types: ['missing_adr'],
        title: 'Document Key Architectural Decisions (ADRs)',
        description: 'Key architectural choices require ADR records to preserve context and rationale.',
        impact: 'high',
        effort: 'medium',
      },
      {
        category: 'checklist_alignment',
        types: ['architecture_freeze_mismatch', 'checklist_inconsistency', 'roadmap_mismatch'],
        title: 'Align Checklists with Architecture Freeze State',
        description: 'Inconsistencies between checklists, roadmaps, and architecture freeze status confuse task completion tracking.',
        impact: 'high',
        effort: 'low',
      },
      {
        category: 'orphaned_doc',
        types: ['orphaned_document'],
        title: 'Link or Archive Orphaned Documents',
        description: 'Documents not reachable from the documentation index accumulate stale content.',
        impact: 'medium',
        effort: 'low',
      },
      {
        category: 'outdated_artifact',
        types: ['outdated_document'],
        title: 'Review Outdated Documentation Artifacts',
        description: 'Artifacts un-updated for over 180 days risk providing obsolete instructions.',
        impact: 'medium',
        effort: 'medium',
      },
      {
        category: 'standards_compliance',
        types: ['empty_section', 'broken_doc_link'],
        title: 'Clean Up Empty Sections and Broken Links',
        description: 'Empty headings and broken references reduce documentation quality.',
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

    // Add coverage-driven recommendation if readme coverage is below target
    if (coverage.readmeCoverageRate < LIMIT_MIN_README_COVERAGE) {
      recs.push({
        priority: priority++,
        category: 'completeness',
        title: 'Raise Package README Coverage',
        description: `Current package README coverage is Math.round(${coverage.readmeCoverageRate * 100})% (target: ${LIMIT_MIN_README_COVERAGE * 100}%).`,
        estimatedImpact: 'high',
        effort: 'medium',
      });
    }

    return recs;
  }

  // ─── Classification Utilities ─────────────────────────────────────────────

  /** Sort issues: critical → error → warning → info. */
  public static sortBySeverity(issues: DocumentationIssue[]): DocumentationIssue[] {
    const order: Record<DocumentationSeverity, number> = {
      critical: 0, error: 1, warning: 2, info: 3,
    };
    return [...issues].sort((a, b) => order[a.severity] - order[b.severity]);
  }

  /** Filter by category. */
  public static filterByCategory(
    issues: DocumentationIssue[],
    category: DocumentationCategory
  ): DocumentationIssue[] {
    return issues.filter((i) => i.category === category);
  }

  /** Filter by severity. */
  public static filterBySeverity(
    issues: DocumentationIssue[],
    severity: DocumentationSeverity
  ): DocumentationIssue[] {
    return issues.filter((i) => i.severity === severity);
  }
}
