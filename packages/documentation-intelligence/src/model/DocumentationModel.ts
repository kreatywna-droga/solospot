// ---------------------------------------------------------------------------
// DocumentationSeverity — urgency of a documentation issue
// ---------------------------------------------------------------------------
export type DocumentationSeverity = 'info' | 'warning' | 'error' | 'critical';

// ---------------------------------------------------------------------------
// DocumentationCategory — domain category of doc analysis
// ---------------------------------------------------------------------------
export type DocumentationCategory =
  | 'completeness'
  | 'adr_coverage'
  | 'orphaned_doc'
  | 'checklist_alignment'
  | 'outdated_artifact'
  | 'architecture_alignment'
  | 'standards_compliance';

// ---------------------------------------------------------------------------
// DocumentationIssueType — all detectable documentation problem types
// ---------------------------------------------------------------------------
export type DocumentationIssueType =
  | 'missing_readme'
  | 'missing_package_doc'
  | 'missing_adr'
  | 'orphaned_document'
  | 'checklist_inconsistency'
  | 'roadmap_mismatch'
  | 'architecture_freeze_mismatch'
  | 'outdated_document'
  | 'empty_section'
  | 'broken_doc_link'
  | 'missing_jsdoc';

// ---------------------------------------------------------------------------
// DocumentationSection — a single section inside a documentation artifact
// ---------------------------------------------------------------------------
export interface DocumentationSection {
  /** Heading title (e.g. "## Architecture") */
  title: string;
  /** Heading level (1 = #, 2 = ##, etc.) */
  level: number;
  /** Character or line count of content under this heading */
  contentLength: number;
  /** Whether the section is empty */
  isEmpty: boolean;
}

// ---------------------------------------------------------------------------
// DocumentationArtifact — metadata snapshot of a single doc file
// ---------------------------------------------------------------------------
export interface DocumentationArtifact {
  /** File path relative to workspace root (e.g. "docs/studio/01_ARCHITECTURE.md") */
  filePath: string;
  /** Document title extracted from H1 */
  title: string;
  /** Category of artifact: 'readme' | 'adr' | 'checklist' | 'guide' | 'spec' | 'other' */
  docType: 'readme' | 'adr' | 'checklist' | 'guide' | 'spec' | 'other';
  /** Package or feature area this doc belongs to */
  targetPackage?: string;
  /** ISO timestamp of last modification date */
  lastModifiedAt?: string;
  /** Sections present in the artifact */
  sections: DocumentationSection[];
  /** Links to other markdown documents declared inside this doc */
  referencedDocPaths: string[];
  /** Whether this document is referenced in the primary docs index */
  isReferencedInIndex: boolean;
  /** Word count of the entire document */
  wordCount: number;
}

// ---------------------------------------------------------------------------
// DocumentationIssue — a single problem detected during analysis
// ---------------------------------------------------------------------------
export interface DocumentationIssue {
  id: string;
  issueType: DocumentationIssueType;
  category: DocumentationCategory;
  severity: DocumentationSeverity;
  message: string;
  /** The doc file or package path affected */
  targetPath: string;
  recommendation?: string;
}

// ---------------------------------------------------------------------------
// DocumentationCoverage — quantitative documentation coverage metrics
// ---------------------------------------------------------------------------
export interface DocumentationCoverage {
  /** Ratio of packages with a non-empty README.md (0..1) */
  readmeCoverageRate: number;
  /** Ratio of key architectural decisions covered by an ADR (0..1) */
  adrCoverageRate: number;
  /** Ratio of docs linked from index / total docs (0..1) */
  indexReachabilityRate: number;
  /** Count of total packages evaluated */
  totalPackages: number;
  /** Count of packages with README */
  packagesWithReadme: number;
  /** Count of total ADRs */
  totalAdrs: number;
  /** Count of total documentation artifacts */
  totalDocs: number;
  /** Count of orphaned docs */
  orphanedDocsCount: number;
}

// ---------------------------------------------------------------------------
// DocumentationRecommendation — prioritised recommendation for doc fixes
// ---------------------------------------------------------------------------
export interface DocumentationRecommendation {
  priority: number;
  category: DocumentationCategory;
  title: string;
  description: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// DocumentationAssessment — aggregated result produced by the Validator
// ---------------------------------------------------------------------------
export interface DocumentationAssessment {
  totalIssues: number;
  infoCount: number;
  warningCount: number;
  errorCount: number;
  criticalCount: number;
  /** Issues grouped by category */
  byCategory: Partial<Record<DocumentationCategory, DocumentationIssue[]>>;
  /** Issues grouped by issue type */
  byType: Partial<Record<DocumentationIssueType, DocumentationIssue[]>>;
  /** Quantitative coverage summary */
  coverage: DocumentationCoverage;
  /** Ordered recommendations */
  recommendations: DocumentationRecommendation[];
}

// ---------------------------------------------------------------------------
// DocumentationReport — full report produced by the Report Generator
// ---------------------------------------------------------------------------
export interface DocumentationReport {
  generatedAt: string;
  rootPath: string;
  /** Score from 0 (poorly documented) to 100 (excellently documented) */
  documentationHealthScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  assessment: DocumentationAssessment;
  issues: DocumentationIssue[];
  coverage: DocumentationCoverage;
  recommendations: DocumentationRecommendation[];
  /** Count of doc artifacts analysed */
  docCount: number;
}
