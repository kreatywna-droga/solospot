import { describe, it, expect } from 'vitest';
import {
  DocumentationAnalyzer,
  DocumentationValidator,
  DocumentationReportGenerator,
  DocumentationCLI,
} from './index';
import type { DocumentationArtifact, DocumentationCoverage } from './index';

// ===========================================================================
// Fixture Factories
// ===========================================================================

function makeDoc(
  filePath: string,
  opts: Partial<DocumentationArtifact> = {}
): DocumentationArtifact {
  return {
    filePath,
    title: opts.title ?? 'Untitled Doc',
    docType: opts.docType ?? 'guide',
    targetPackage: opts.targetPackage,
    lastModifiedAt: opts.lastModifiedAt ?? '2026-07-01T00:00:00Z',
    sections: opts.sections ?? [{ title: 'Overview', level: 2, contentLength: 100, isEmpty: false }],
    referencedDocPaths: opts.referencedDocPaths ?? [],
    isReferencedInIndex: opts.isReferencedInIndex ?? true,
    wordCount: opts.wordCount ?? 200,
  };
}

// ===========================================================================
// 1. DocumentationAnalyzer — parseArtifacts
// ===========================================================================
describe('DocumentationAnalyzer — parseArtifacts', () => {
  it('converts raw doc objects into DocumentationArtifacts', () => {
    const docs = DocumentationAnalyzer.parseArtifacts([
      { filePath: 'docs/guide.md', title: 'Guide', docType: 'guide' },
    ]);
    expect(docs).toHaveLength(1);
    expect(docs[0].filePath).toBe('docs/guide.md');
    expect(docs[0].title).toBe('Guide');
    expect(docs[0].isReferencedInIndex).toBe(true);
  });

  it('marks empty sections automatically', () => {
    const docs = DocumentationAnalyzer.parseArtifacts([
      {
        filePath: 'docs/spec.md',
        sections: [{ title: 'Empty Section', level: 2, contentLength: 0 }],
      },
    ]);
    expect(docs[0].sections[0].isEmpty).toBe(true);
  });
});

// ===========================================================================
// 2. DocumentationAnalyzer — detectMissingPackageDocs (missing docs detection)
// ===========================================================================
describe('DocumentationAnalyzer — detectMissingPackageDocs', () => {
  it('flags a known package that has no README or spec doc', () => {
    const docs = [makeDoc('packages/builder/README.md', { targetPackage: 'builder' })];
    const knownPackages = ['builder', 'runtime-engine'];
    const issues = DocumentationAnalyzer.detectMissingPackageDocs(docs, knownPackages);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('missing_package_doc');
    expect(issues[0].targetPath).toBe('packages/runtime-engine');
    expect(issues[0].severity).toBe('error');
  });

  it('returns no issues when all known packages have docs', () => {
    const docs = [
      makeDoc('packages/builder/README.md', { targetPackage: 'builder' }),
      makeDoc('packages/ui-core/README.md', { targetPackage: 'ui-core' }),
    ];
    const issues = DocumentationAnalyzer.detectMissingPackageDocs(docs, ['builder', 'ui-core']);
    expect(issues).toHaveLength(0);
  });
});

// ===========================================================================
// 3. DocumentationAnalyzer — detectMissingADRs
// ===========================================================================
describe('DocumentationAnalyzer — detectMissingADRs', () => {
  it('flags missing ADRs when key topics are absent', () => {
    const docs = [
      makeDoc('docs/adr/01_ports.md', { title: 'Ports and Adapters ADR', docType: 'adr' }),
    ];
    const issues = DocumentationAnalyzer.detectMissingADRs(docs);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.issueType === 'missing_adr')).toBe(true);
  });

  it('returns no issues when all expected ADR topics are covered', () => {
    const docs = [
      makeDoc('docs/adr/01_ports.md', { title: 'Ports and Adapters', docType: 'adr' }),
      makeDoc('docs/adr/02_gov.md', { title: 'Monorepo Governance', docType: 'adr' }),
      makeDoc('docs/adr/03_state.md', { title: 'State Management', docType: 'adr' }),
      makeDoc('docs/adr/04_isolation.md', { title: 'UI Engine Isolation', docType: 'adr' }),
      makeDoc('docs/adr/05_bus.md', { title: 'Event Bus Contract', docType: 'adr' }),
    ];
    expect(DocumentationAnalyzer.detectMissingADRs(docs)).toHaveLength(0);
  });
});

// ===========================================================================
// 4. DocumentationAnalyzer — detectOrphanedDocs
// ===========================================================================
describe('DocumentationAnalyzer — detectOrphanedDocs', () => {
  it('flags a doc not referenced in index and not linked by other docs', () => {
    const doc = makeDoc('docs/secret_notes.md', { isReferencedInIndex: false });
    const issues = DocumentationAnalyzer.detectOrphanedDocs([doc]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('orphaned_document');
    expect(issues[0].severity).toBe('warning');
  });

  it('does not flag index docs or main README', () => {
    const rootReadme = makeDoc('README.md', { isReferencedInIndex: false });
    const docsIndex  = makeDoc('docs/README.md', { isReferencedInIndex: false });
    expect(DocumentationAnalyzer.detectOrphanedDocs([rootReadme, docsIndex])).toHaveLength(0);
  });

  it('does not flag docs that are linked inside another doc', () => {
    const orphanCandidate = makeDoc('docs/detail.md', { isReferencedInIndex: false });
    const parentDoc = makeDoc('docs/main.md', {
      isReferencedInIndex: true,
      referencedDocPaths: ['docs/detail.md'],
    });
    expect(DocumentationAnalyzer.detectOrphanedDocs([orphanCandidate, parentDoc])).toHaveLength(0);
  });
});

// ===========================================================================
// 5. DocumentationAnalyzer — detectChecklistInconsistencies
// ===========================================================================
describe('DocumentationAnalyzer — detectChecklistInconsistencies', () => {
  it('flags an Architecture Freeze document with insufficient word count', () => {
    const freezeDoc = makeDoc('docs/freeze.md', {
      title: 'Architecture Freeze Specification',
      docType: 'checklist',
      wordCount: 20,
    });
    const issues = DocumentationAnalyzer.detectChecklistInconsistencies([freezeDoc]);
    expect(issues.some((i) => i.issueType === 'architecture_freeze_mismatch')).toBe(true);
    expect(issues.some((i) => i.severity === 'error')).toBe(true);
  });

  it('flags empty sections in checklists as info severity', () => {
    const checklistDoc = makeDoc('docs/checklist.md', {
      docType: 'checklist',
      sections: [{ title: 'Empty Tasks', level: 2, contentLength: 0, isEmpty: true }],
      wordCount: 150,
    });
    const issues = DocumentationAnalyzer.detectChecklistInconsistencies([checklistDoc]);
    expect(issues.some((i) => i.issueType === 'empty_section')).toBe(true);
  });
});

// ===========================================================================
// 6. DocumentationAnalyzer — detectOutdatedDocs
// ===========================================================================
describe('DocumentationAnalyzer — detectOutdatedDocs', () => {
  it('flags a document modified over 180 days ago', () => {
    const oldDate = new Date('2025-01-01T00:00:00Z').toISOString();
    const nowMs   = new Date('2026-07-31T00:00:00Z').getTime();
    const doc     = makeDoc('docs/old_spec.md', { lastModifiedAt: oldDate });
    const issues  = DocumentationAnalyzer.detectOutdatedDocs([doc], nowMs);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('outdated_document');
    expect(issues[0].severity).toBe('warning');
  });

  it('returns no issues for recently modified documents', () => {
    const recentDate = new Date('2026-07-01T00:00:00Z').toISOString();
    const nowMs      = new Date('2026-07-31T00:00:00Z').getTime();
    const doc        = makeDoc('docs/recent.md', { lastModifiedAt: recentDate });
    expect(DocumentationAnalyzer.detectOutdatedDocs([doc], nowMs)).toHaveLength(0);
  });
});

// ===========================================================================
// 7. DocumentationAnalyzer — detectArchitectureDocAlignment
// ===========================================================================
describe('DocumentationAnalyzer — detectArchitectureDocAlignment', () => {
  it('flags a known package not mentioned in architecture docs', () => {
    const archDoc = makeDoc('docs/01_architecture.md', {
      title: 'Monorepo Architecture Overview',
      docType: 'spec',
      sections: [{ title: 'Builder Engine', level: 2, contentLength: 100, isEmpty: false }],
    });
    const issues = DocumentationAnalyzer.detectArchitectureDocAlignment([archDoc], ['builder', 'unknown-pkg']);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('architecture_freeze_mismatch');
    expect(issues[0].message).toContain('unknown-pkg');
  });
});

// ===========================================================================
// 8. DocumentationAnalyzer — computeCoverage (coverage evaluation)
// ===========================================================================
describe('DocumentationAnalyzer — computeCoverage', () => {
  it('computes coverage metrics correctly', () => {
    const docs = [
      makeDoc('packages/a/README.md', { targetPackage: 'pkg-a', docType: 'readme' }),
      makeDoc('docs/adr/01.md', { docType: 'adr' }),
    ];
    const coverage = DocumentationAnalyzer.computeCoverage(docs, ['pkg-a', 'pkg-b']);
    expect(coverage.totalPackages).toBe(2);
    expect(coverage.packagesWithReadme).toBe(1);
    expect(coverage.readmeCoverageRate).toBe(0.5);
    expect(coverage.totalAdrs).toBe(1);
  });

  it('returns 1.0 rates for an empty package list', () => {
    const coverage = DocumentationAnalyzer.computeCoverage([], []);
    expect(coverage.readmeCoverageRate).toBe(1);
    expect(coverage.indexReachabilityRate).toBe(1);
  });
});

// ===========================================================================
// 9. DocumentationValidator — assessIssues / validateLimits
// ===========================================================================
describe('DocumentationValidator — assessIssues', () => {
  it('returns zero counts for no issues', () => {
    const coverage: DocumentationCoverage = {
      readmeCoverageRate: 1, adrCoverageRate: 1, indexReachabilityRate: 1,
      totalPackages: 2, packagesWithReadme: 2, totalAdrs: 5, totalDocs: 10, orphanedDocsCount: 0,
    };
    const assessment = DocumentationValidator.assessIssues([], coverage);
    expect(assessment.totalIssues).toBe(0);
    expect(assessment.errorCount).toBe(0);
  });

  it('groups issues by category correctly', () => {
    const coverage: DocumentationCoverage = {
      readmeCoverageRate: 0.5, adrCoverageRate: 1, indexReachabilityRate: 1,
      totalPackages: 2, packagesWithReadme: 1, totalAdrs: 5, totalDocs: 10, orphanedDocsCount: 0,
    };
    const issues = DocumentationAnalyzer.detectMissingPackageDocs([], ['pkg-a']);
    const assessment = DocumentationValidator.assessIssues(issues, coverage);
    expect(assessment.byCategory['completeness']).toBeDefined();
  });
});

describe('DocumentationValidator — validateLimits', () => {
  it('passes all metrics when limits are satisfied', () => {
    const coverage: DocumentationCoverage = {
      readmeCoverageRate: 1, adrCoverageRate: 1, indexReachabilityRate: 1,
      totalPackages: 5, packagesWithReadme: 5, totalAdrs: 5, totalDocs: 10, orphanedDocsCount: 0,
    };
    const metrics = DocumentationValidator.validateLimits([], coverage);
    expect(metrics.every((m) => m.passing)).toBe(true);
  });

  it('fails readmeCoverageRate when below threshold (90%)', () => {
    const coverage: DocumentationCoverage = {
      readmeCoverageRate: 0.5, adrCoverageRate: 1, indexReachabilityRate: 1,
      totalPackages: 4, packagesWithReadme: 2, totalAdrs: 5, totalDocs: 10, orphanedDocsCount: 0,
    };
    const metrics = DocumentationValidator.validateLimits([], coverage);
    expect(metrics.find((m) => m.metricName === 'readmeCoverageRate')?.passing).toBe(false);
  });
});

// ===========================================================================
// 10. DocumentationValidator — prioritiseRecommendations (prioritization)
// ===========================================================================
describe('DocumentationValidator — prioritiseRecommendations', () => {
  it('assigns priority 1 to completeness recommendations', () => {
    const coverage: DocumentationCoverage = {
      readmeCoverageRate: 0.5, adrCoverageRate: 1, indexReachabilityRate: 1,
      totalPackages: 2, packagesWithReadme: 1, totalAdrs: 5, totalDocs: 10, orphanedDocsCount: 0,
    };
    const issues = DocumentationAnalyzer.detectMissingPackageDocs([], ['pkg-b']);
    const recs = DocumentationValidator.prioritiseRecommendations(issues, coverage);
    expect(recs[0].priority).toBe(1);
    expect(recs[0].category).toBe('completeness');
  });

  it('appends README coverage booster recommendation when coverage is low', () => {
    const coverage: DocumentationCoverage = {
      readmeCoverageRate: 0.5, adrCoverageRate: 1, indexReachabilityRate: 1,
      totalPackages: 4, packagesWithReadme: 2, totalAdrs: 5, totalDocs: 10, orphanedDocsCount: 0,
    };
    const recs = DocumentationValidator.prioritiseRecommendations([], coverage);
    expect(recs.some((r) => r.title.includes('Raise Package README Coverage'))).toBe(true);
  });
});

// ===========================================================================
// 11. DocumentationReportGenerator
// ===========================================================================
describe('DocumentationReportGenerator — calculateScore / deriveGrade', () => {
  it('returns 100 for a clean assessment and full coverage', () => {
    const coverage: DocumentationCoverage = {
      readmeCoverageRate: 1, adrCoverageRate: 1, indexReachabilityRate: 1,
      totalPackages: 2, packagesWithReadme: 2, totalAdrs: 5, totalDocs: 10, orphanedDocsCount: 0,
    };
    const assessment = DocumentationValidator.assessIssues([], coverage);
    const score = DocumentationReportGenerator.calculateScore(assessment, coverage);
    expect(score).toBe(100);
    expect(DocumentationReportGenerator.deriveGrade(score)).toBe('A+');
  });

  it('penalises errors (15 pts each)', () => {
    const coverage: DocumentationCoverage = {
      readmeCoverageRate: 0.5, adrCoverageRate: 1, indexReachabilityRate: 1,
      totalPackages: 2, packagesWithReadme: 1, totalAdrs: 5, totalDocs: 10, orphanedDocsCount: 0,
    };
    const issues = DocumentationAnalyzer.detectMissingPackageDocs([], ['pkg-b']);
    const assessment = DocumentationValidator.assessIssues(issues, coverage);
    const score = DocumentationReportGenerator.calculateScore(assessment, coverage);
    expect(score).toBeLessThan(100);
  });

  it('never drops below 0', () => {
    const coverage: DocumentationCoverage = {
      readmeCoverageRate: 0, adrCoverageRate: 0, indexReachabilityRate: 0,
      totalPackages: 10, packagesWithReadme: 0, totalAdrs: 0, totalDocs: 0, orphanedDocsCount: 10,
    };
    const assessment = DocumentationValidator.assessIssues([], coverage);
    assessment.criticalCount = 100;
    expect(DocumentationReportGenerator.calculateScore(assessment, coverage)).toBe(0);
    expect(DocumentationReportGenerator.deriveGrade(0)).toBe('F');
  });
});

describe('DocumentationReportGenerator — generateReport & toMarkdown / toJSON', () => {
  it('produces a valid report', () => {
    const coverage: DocumentationCoverage = {
      readmeCoverageRate: 1, adrCoverageRate: 1, indexReachabilityRate: 1,
      totalPackages: 2, packagesWithReadme: 2, totalAdrs: 5, totalDocs: 2, orphanedDocsCount: 0,
    };
    const docs = [makeDoc('README.md'), makeDoc('docs/guide.md')];
    const assessment = DocumentationValidator.assessIssues([], coverage);
    const report = DocumentationReportGenerator.generateReport(assessment, [], coverage, docs);

    expect(report.documentationHealthScore).toBe(100);
    expect(report.grade).toBe('A+');
    expect(report.docCount).toBe(2);
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('exports valid Markdown', () => {
    const coverage: DocumentationCoverage = {
      readmeCoverageRate: 1, adrCoverageRate: 1, indexReachabilityRate: 1,
      totalPackages: 2, packagesWithReadme: 2, totalAdrs: 5, totalDocs: 1, orphanedDocsCount: 0,
    };
    const assessment = DocumentationValidator.assessIssues([], coverage);
    const report = DocumentationReportGenerator.generateReport(assessment, [], coverage, [makeDoc('README.md')]);
    const md = DocumentationReportGenerator.toMarkdown(report);
    expect(md).toContain('# Documentation Intelligence Health Report');
    expect(md).toContain('README Coverage');
  });

  it('exports valid JSON', () => {
    const coverage: DocumentationCoverage = {
      readmeCoverageRate: 1, adrCoverageRate: 1, indexReachabilityRate: 1,
      totalPackages: 2, packagesWithReadme: 2, totalAdrs: 5, totalDocs: 1, orphanedDocsCount: 0,
    };
    const assessment = DocumentationValidator.assessIssues([], coverage);
    const report = DocumentationReportGenerator.generateReport(assessment, [], coverage, [makeDoc('README.md')]);
    const json = DocumentationReportGenerator.toJSON(report);
    expect(json).toContain('"documentationHealthScore"');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ===========================================================================
// 12. DocumentationCLI
// ===========================================================================
describe('DocumentationCLI', () => {
  it('defaults to help with no args', () => {
    expect(DocumentationCLI.parseArgs([]).command).toBe('help');
  });

  it('parses analyze', () => {
    expect(DocumentationCLI.parseArgs(['analyze']).command).toBe('analyze');
  });

  it('parses validate', () => {
    expect(DocumentationCLI.parseArgs(['validate']).command).toBe('validate');
  });

  it('parses report', () => {
    expect(DocumentationCLI.parseArgs(['report']).command).toBe('report');
  });

  it('parses --target, --out, --format', () => {
    const res = DocumentationCLI.parseArgs(['report', '--target=docs', '--format=json', '--out=out.json']);
    expect(res.targetPath).toBe('docs');
    expect(res.format).toBe('json');
    expect(res.outputPath).toBe('out.json');
  });

  it('help text contains all commands and options', () => {
    const help = DocumentationCLI.getHelpText();
    expect(help).toContain('analyze');
    expect(help).toContain('validate');
    expect(help).toContain('report');
    expect(help).toContain('--target');
    expect(help).toContain('--format');
    expect(help).toContain('--out');
  });
});

// ===========================================================================
// 13. analyzeAll — integration smoke test
// ===========================================================================
describe('DocumentationAnalyzer — analyzeAll integration', () => {
  it('returns no errors for a clean document set', () => {
    const docs = [
      makeDoc('packages/builder/README.md', { targetPackage: 'builder', docType: 'readme' }),
      makeDoc('docs/adr/01_ports.md', { title: 'Ports and Adapters', docType: 'adr' }),
      makeDoc('docs/adr/02_gov.md', { title: 'Monorepo Governance', docType: 'adr' }),
      makeDoc('docs/adr/03_state.md', { title: 'State Management', docType: 'adr' }),
      makeDoc('docs/adr/04_isolation.md', { title: 'UI Engine Isolation', docType: 'adr' }),
      makeDoc('docs/adr/05_bus.md', { title: 'Event Bus Contract', docType: 'adr' }),
    ];
    const issues = DocumentationAnalyzer.analyzeAll(docs, ['builder']);
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('returns combined issues across multiple passes for an incomplete doc set', () => {
    const docs = [
      makeDoc('docs/orphan.md', { isReferencedInIndex: false }),
    ];
    const issues = DocumentationAnalyzer.analyzeAll(docs, ['missing-pkg']);
    const types  = new Set(issues.map((i) => i.issueType));
    expect(types.size).toBeGreaterThan(1);
  });
});
