# @web-factor/documentation-intelligence

**Sprint EP29 — Documentation Intelligence Platform**

Static analysis package that inspects technical documentation completeness, consistency, ADR coverage, checklist alignment, and documentation quality across the monorepo — without modifying any code and without running the application.

## Responsibilities

- **Read-only** static analysis of documentation artifacts (`docs/`, `README.md`, `ADR`, checklists).
- Detects missing documentation for public packages and features.
- Verifies alignment between documentation, architecture, checklists, and roadmap.
- Flags missing ADRs for key architectural decisions.
- Identifies orphaned documentation files not referenced anywhere in the docs index.
- Detects potentially outdated documentation artifacts.
- Evaluates documentation coverage metrics across packages.
- Produces a Documentation Health Score (0–100) with A+–F grade and prioritised recommendations.
- Exports Markdown and JSON report formats.
- Provides a CLI parser for `documentation-intelligence analyze | validate | report`.

## Package layout

```
src/
  model/      — Data contracts (DocumentationArtifact, DocumentationCoverage, DocumentationReport, …)
  analyzer/   — Static documentation analysis
  validator/  — Issue classification, coverage validation, prioritisation
  report/     — Health-score calculation and report export
  cli/        — CLI argument parser
  index.ts    — Public API barrel
```

## Usage (programmatic)

```ts
import {
  DocumentationAnalyzer,
  DocumentationValidator,
  DocumentationReportGenerator,
  DocumentationCLI,
} from '@web-factor/documentation-intelligence';

const artifacts = DocumentationAnalyzer.parseArtifacts(rawDocData);
const issues    = DocumentationAnalyzer.analyzeAll(artifacts);
const coverage  = DocumentationAnalyzer.computeCoverage(artifacts);
const assess    = DocumentationValidator.assessIssues(issues, coverage);
const report    = DocumentationReportGenerator.generateReport(assess, issues, coverage, artifacts);

console.log(DocumentationReportGenerator.toMarkdown(report));
```

## CLI

```bash
documentation-intelligence analyze  --target=docs --out=report.md
documentation-intelligence validate --target=docs --format=json
documentation-intelligence report   --target=.    --out=doc-health.json --format=json
```

## Constraints

- ✅ Read-only static analysis — no code execution, no app execution
- ✅ Isolated from Builder, Runtime and Agent 1 code
- ❌ Does NOT automatically modify any documentation
- ❌ Does NOT integrate with Runtime or CI/CD
