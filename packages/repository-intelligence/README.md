# @web-factor/repository-intelligence

**Sprint EP24 — Repository Intelligence Platform**

Static analysis package that inspects monorepo structure, identifies organisational issues and generates a Repository Health Report.

## Responsibilities

- **Read-only** inspection of the repository directory tree (no writes, no builds).
- Detects structural anti-patterns: empty directories, excessive nesting, duplicate sub-trees, inconsistent package layouts.
- Validates compliance with monorepo organisational standards.
- Produces a Repository Health Score (0–100), classified issue list and actionable recommendations.
- Exports Markdown and JSON report formats.
- Provides a CLI parser for `repository-intelligence analyze | validate | report`.

## Package layout

```
src/
  model/      — Data contracts (RepositoryNode, RepositoryIssue, …)
  analyzer/   — Directory-tree static analysis
  validator/  — Issue classification and limit checking
  report/     — Health-score calculation and report export
  cli/        — CLI argument parser
  index.ts    — Public API barrel
```

## Usage (programmatic)

```ts
import {
  RepositoryAnalyzer,
  RepositoryValidator,
  RepositoryReportGenerator,
  RepositoryIntelligenceCLI,
} from '@web-factor/repository-intelligence';

const nodes   = RepositoryAnalyzer.buildNodeTree('packages');
const issues  = RepositoryAnalyzer.analyzeStructure(nodes);
const assess  = RepositoryValidator.assessIssues(issues);
const report  = RepositoryReportGenerator.generateReport(assess, issues, nodes);

console.log(RepositoryReportGenerator.toMarkdown(report));
```

## CLI

```bash
repository-intelligence analyze  --target=packages --out=report.md
repository-intelligence validate --target=packages --format=json
repository-intelligence report   --target=.        --out=health.json --format=json
```

## Constraints

- ✅ Read-only repository inspection
- ✅ Isolated from Builder, Runtime and Agent 1 code
- ❌ Does NOT modify any files in the repository
- ❌ Does NOT integrate with Runtime or CI/CD
