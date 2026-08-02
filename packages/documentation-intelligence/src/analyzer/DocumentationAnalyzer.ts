import type {
  DocumentationArtifact,
  DocumentationCategory,
  DocumentationCoverage,
  DocumentationIssue,
  DocumentationIssueType,
  DocumentationSeverity,
} from '../model/DocumentationModel';

// ---------------------------------------------------------------------------
// Expected key architectural decision topics that should be backed by ADRs
// ---------------------------------------------------------------------------
const EXPECTED_ADR_TOPICS = [
  'ports_and_adapters',
  'monorepo_governance',
  'state_management',
  'ui_engine_isolation',
  'event_bus_contract',
];

// ---------------------------------------------------------------------------
// Outdated threshold in milliseconds (e.g. 180 days)
// ---------------------------------------------------------------------------
const OUTDATED_MS_THRESHOLD = 180 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

function issue(
  prefix: string,
  issueType: DocumentationIssueType,
  category: DocumentationCategory,
  severity: DocumentationSeverity,
  targetPath: string,
  message: string,
  recommendation?: string
): DocumentationIssue {
  return {
    id: makeId(prefix),
    issueType,
    category,
    severity,
    targetPath,
    message,
    recommendation,
  };
}

// ---------------------------------------------------------------------------
// DocumentationAnalyzer — static, read-only documentation intelligence analyzer
// ---------------------------------------------------------------------------
export class DocumentationAnalyzer {

  // ─── Data Parsing ─────────────────────────────────────────────────────────

  /**
   * Convert raw doc metadata snapshots into typed DocumentationArtifact objects.
   * Callers supply the data snapshot; this class never reads the file system directly.
   */
  public static parseArtifacts(
    rawDocs: Array<{
      filePath: string;
      title?: string;
      docType?: DocumentationArtifact['docType'];
      targetPackage?: string;
      lastModifiedAt?: string;
      sections?: Array<{ title: string; level: number; contentLength: number }>;
      referencedDocPaths?: string[];
      isReferencedInIndex?: boolean;
      wordCount?: number;
    }>
  ): DocumentationArtifact[] {
    return rawDocs.map((d) => ({
      filePath: d.filePath,
      title: d.title ?? 'Untitled',
      docType: d.docType ?? 'other',
      targetPackage: d.targetPackage,
      lastModifiedAt: d.lastModifiedAt,
      sections: (d.sections ?? []).map((s) => ({
        ...s,
        isEmpty: s.contentLength === 0,
      })),
      referencedDocPaths: d.referencedDocPaths ?? [],
      isReferencedInIndex: d.isReferencedInIndex ?? true,
      wordCount: d.wordCount ?? 0,
    }));
  }

  // ─── Top-level Dispatch ──────────────────────────────────────────────────

  /**
   * Run all static documentation analysis passes and return the combined issue list.
   */
  public static analyzeAll(
    artifacts: DocumentationArtifact[],
    knownPackages: string[] = []
  ): DocumentationIssue[] {
    return [
      ...DocumentationAnalyzer.detectMissingPackageDocs(artifacts, knownPackages),
      ...DocumentationAnalyzer.detectMissingADRs(artifacts),
      ...DocumentationAnalyzer.detectOrphanedDocs(artifacts),
      ...DocumentationAnalyzer.detectChecklistInconsistencies(artifacts),
      ...DocumentationAnalyzer.detectOutdatedDocs(artifacts),
      ...DocumentationAnalyzer.detectEmptySections(artifacts),
      ...DocumentationAnalyzer.detectArchitectureDocAlignment(artifacts, knownPackages),
    ];
  }

  // ─── Missing Package Docs Detection ──────────────────────────────────────

  /**
   * Flag packages that lack a dedicated README.md or package specification doc.
   */
  public static detectMissingPackageDocs(
    artifacts: DocumentationArtifact[],
    knownPackages: string[]
  ): DocumentationIssue[] {
    const issues: DocumentationIssue[] = [];
    const documentedPackages = new Set(
      artifacts.map((a) => a.targetPackage).filter(Boolean) as string[]
    );

    for (const pkg of knownPackages) {
      if (!documentedPackages.has(pkg)) {
        issues.push(
          issue(
            'doc_pkg',
            'missing_package_doc',
            'completeness',
            'error',
            `packages/${pkg}`,
            `Package '${pkg}' has no dedicated README.md or package documentation.`,
            `Create 'packages/${pkg}/README.md' describing its responsibilities, Public API, and usage examples.`
          )
        );
      }
    }

    return issues;
  }

  // ─── Missing ADR Detection ────────────────────────────────────────────────

  /**
   * Check whether key architectural decision topics are covered by an ADR artifact.
   */
  public static detectMissingADRs(artifacts: DocumentationArtifact[]): DocumentationIssue[] {
    const issues: DocumentationIssue[] = [];
    const adrDocs = artifacts.filter((a) => a.docType === 'adr');
    const adrTitlesAndPaths = adrDocs
      .map((a) => `${a.title} ${a.filePath}`.toLowerCase())
      .join(' ');

    for (const topic of EXPECTED_ADR_TOPICS) {
      const topicKeywords = topic.split('_');
      const isCovered = topicKeywords.every((kw) => adrTitlesAndPaths.includes(kw));

      if (!isCovered) {
        issues.push(
          issue(
            'doc_adr',
            'missing_adr',
            'adr_coverage',
            'warning',
            'docs/adr/',
            `No Architecture Decision Record (ADR) was found for key decision topic '${topic.replace(/_/g, ' ')}'.`,
            `Create a new ADR file in 'docs/adr/' documenting the rationale and consequences for '${topic}'.`
          )
        );
      }
    }

    return issues;
  }

  // ─── Orphaned Documents Detection ─────────────────────────────────────────

  /**
   * Flag documentation files that are not referenced in the primary index
   * nor linked from any other documentation file.
   */
  public static detectOrphanedDocs(artifacts: DocumentationArtifact[]): DocumentationIssue[] {
    const issues: DocumentationIssue[] = [];

    // Collect all paths linked across all documents
    const allReferencedPaths = new Set<string>();
    for (const doc of artifacts) {
      for (const ref of doc.referencedDocPaths) {
        allReferencedPaths.add(ref);
      }
    }

    for (const doc of artifacts) {
      // Exclude root READMEs / index docs
      if (
        doc.filePath === 'README.md' ||
        doc.filePath === 'docs/README.md' ||
        doc.filePath.endsWith('index.md')
      ) {
        continue;
      }

      if (!doc.isReferencedInIndex && !allReferencedPaths.has(doc.filePath)) {
        issues.push(
          issue(
            'doc_orph',
            'orphaned_document',
            'orphaned_doc',
            'warning',
            doc.filePath,
            `Document '${doc.filePath}' is orphaned — it is not linked in the docs index nor referenced by any other document.`,
            `Add a link to '${doc.filePath}' in the main documentation index or archive the document if obsolete.`
          )
        );
      }
    }

    return issues;
  }

  // ─── Checklist / Roadmap / Freeze Alignment Detection ─────────────────────

  /**
   * Verify consistency between roadmap items, checklist statuses, and Architecture Freeze declarations.
   */
  public static detectChecklistInconsistencies(
    artifacts: DocumentationArtifact[]
  ): DocumentationIssue[] {
    const issues: DocumentationIssue[] = [];
    const checklists = artifacts.filter((a) => a.docType === 'checklist');

    for (const list of checklists) {
      // If a checklist claims Architecture Freeze APPROVED but has uncompleted items
      const hasFreezeApproved = list.title.toLowerCase().includes('freeze') ||
        list.sections.some((s) => s.title.toLowerCase().includes('architecture freeze'));

      for (const section of list.sections) {
        if (section.isEmpty) {
          issues.push(
            issue(
              'doc_chk',
              'empty_section',
              'checklist_alignment',
              'info',
              list.filePath,
              `Checklist '${list.filePath}' has an empty section '${section.title}'.`,
              `Fill in the tasks for section '${section.title}' or remove the heading.`
            )
          );
        }
      }

      if (hasFreezeApproved && list.wordCount < 50) {
        issues.push(
          issue(
            'doc_chk',
            'architecture_freeze_mismatch',
            'checklist_alignment',
            'error',
            list.filePath,
            `Architecture Freeze document '${list.filePath}' has insufficient content (${list.wordCount} words). A freeze declaration requires detailed specification.`,
            `Expand '${list.filePath}' with complete architecture freeze specifications and approval gates.`
          )
        );
      }
    }

    return issues;
  }

  // ─── Outdated Documents Detection ─────────────────────────────────────────

  /**
   * Flag documentation artifacts that have not been modified within the threshold.
   */
  public static detectOutdatedDocs(
    artifacts: DocumentationArtifact[],
    nowMs: number = Date.now()
  ): DocumentationIssue[] {
    const issues: DocumentationIssue[] = [];

    for (const doc of artifacts) {
      if (doc.lastModifiedAt) {
        const modifiedMs = new Date(doc.lastModifiedAt).getTime();
        if (!isNaN(modifiedMs) && nowMs - modifiedMs > OUTDATED_MS_THRESHOLD) {
          const daysOld = Math.floor((nowMs - modifiedMs) / (24 * 60 * 60 * 1000));
          issues.push(
            issue(
              'doc_out',
              'outdated_document',
              'outdated_artifact',
              'warning',
              doc.filePath,
              `Document '${doc.filePath}' was last updated ${daysOld} days ago (threshold: 180 days). It may contain stale information.`,
              `Review '${doc.filePath}' for accuracy and update its content to reflect the current codebase state.`
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Empty Sections Detection ─────────────────────────────────────────────

  /**
   * Flag empty headings in non-checklist documents.
   */
  public static detectEmptySections(artifacts: DocumentationArtifact[]): DocumentationIssue[] {
    const issues: DocumentationIssue[] = [];

    for (const doc of artifacts.filter((a) => a.docType !== 'checklist')) {
      for (const section of doc.sections) {
        if (section.isEmpty) {
          issues.push(
            issue(
              'doc_sec',
              'empty_section',
              'standards_compliance',
              'info',
              doc.filePath,
              `Document '${doc.filePath}' contains an empty heading '${section.title}'.`,
              `Add documentation under heading '${section.title}' or remove the unused section.`
            )
          );
        }
      }
    }

    return issues;
  }

  // ─── Architecture Doc Alignment Detection ─────────────────────────────────

  /**
   * Verify that architecture specification docs mention all known packages.
   */
  public static detectArchitectureDocAlignment(
    artifacts: DocumentationArtifact[],
    knownPackages: string[]
  ): DocumentationIssue[] {
    const issues: DocumentationIssue[] = [];
    const archDocs = artifacts.filter(
      (a) => a.filePath.includes('architecture') || a.docType === 'spec'
    );

    if (archDocs.length === 0) return issues;

    const allArchContent = archDocs
      .map((a) => `${a.title} ${a.sections.map((s) => s.title).join(' ')}`.toLowerCase())
      .join(' ');

    for (const pkg of knownPackages) {
      if (!allArchContent.includes(pkg.toLowerCase())) {
        issues.push(
          issue(
            'doc_arch',
            'architecture_freeze_mismatch',
            'architecture_alignment',
            'warning',
            archDocs[0].filePath,
            `Package '${pkg}' is not mentioned in the architecture specification documents.`,
            `Update '${archDocs[0].filePath}' to document package '${pkg}' in the system architecture overview.`
          )
        );
      }
    }

    return issues;
  }

  // ─── Coverage Computation ─────────────────────────────────────────────────

  /**
   * Compute quantitative documentation coverage metrics.
   */
  public static computeCoverage(
    artifacts: DocumentationArtifact[],
    knownPackages: string[] = []
  ): DocumentationCoverage {
    const documentedPackages = new Set(
      artifacts.map((a) => a.targetPackage).filter(Boolean) as string[]
    );
    const packagesWithReadme = knownPackages.filter((pkg) => documentedPackages.has(pkg)).length;
    const readmeCoverageRate = knownPackages.length > 0 ? packagesWithReadme / knownPackages.length : 1;

    const adrCount = artifacts.filter((a) => a.docType === 'adr').length;
    const adrCoverageRate = EXPECTED_ADR_TOPICS.length > 0
      ? Math.min(1, adrCount / EXPECTED_ADR_TOPICS.length)
      : 1;

    const reachableDocs = artifacts.filter((a) => a.isReferencedInIndex).length;
    const indexReachabilityRate = artifacts.length > 0 ? reachableDocs / artifacts.length : 1;

    const orphanedCount = artifacts.filter(
      (a) => !a.isReferencedInIndex && a.filePath !== 'README.md'
    ).length;

    return {
      readmeCoverageRate: Math.round(readmeCoverageRate * 100) / 100,
      adrCoverageRate: Math.round(adrCoverageRate * 100) / 100,
      indexReachabilityRate: Math.round(indexReachabilityRate * 100) / 100,
      totalPackages: knownPackages.length,
      packagesWithReadme,
      totalAdrs: adrCount,
      totalDocs: artifacts.length,
      orphanedDocsCount: orphanedCount,
    };
  }
}
