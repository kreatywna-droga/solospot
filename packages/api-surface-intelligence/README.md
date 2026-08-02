# @web-factor/api-surface-intelligence

**Sprint EP26 — API Surface Intelligence Platform**

Static analysis package that inspects the Public API surface of every package in the monorepo. It detects missing exports, dead exports, naming inconsistencies, breaking/non-breaking API changes and contract violations — without modifying any code and without running build processes.

## Responsibilities

- **Read-only** inspection of `src/index.ts` barrel files and implementation modules.
- Detects exports present in implementation but absent from the public barrel (unreachable public modules).
- Detects exports present in the barrel but with no corresponding implementation (dead exports).
- Classifies API changes as **breaking** or **non-breaking**.
- Validates compliance with the monorepo Public API policy.
- Produces an API Surface Health Score (0–100) with A+–F grade, classified issue list and actionable recommendations.
- Exports Markdown and JSON report formats.
- Provides a CLI parser for `api-surface analyze | validate | report`.

## Package layout

```
src/
  model/      — Data contracts (ApiSurface, ApiExport, ApiContract, ApiChange, …)
  analyzer/   — Export completeness and contract static analysis
  validator/  — Issue classification, contract compliance, aggregation
  report/     — Health-score calculation and report export
  cli/        — CLI argument parser
  index.ts    — Public API barrel
```

## Usage (programmatic)

```ts
import {
  ApiSurfaceAnalyzer,
  ApiSurfaceValidator,
  ApiSurfaceReportGenerator,
  ApiSurfaceCLI,
} from '@web-factor/api-surface-intelligence';

const surfaces = ApiSurfaceAnalyzer.parseSurfaces(rawPackageData);
const issues   = ApiSurfaceAnalyzer.analyzeAll(surfaces);
const assess   = ApiSurfaceValidator.assessIssues(issues);
const report   = ApiSurfaceReportGenerator.generateReport(assess, issues, surfaces);

console.log(ApiSurfaceReportGenerator.toMarkdown(report));
```

## CLI

```bash
api-surface analyze  --target=packages --out=report.md
api-surface validate --target=packages --format=json
api-surface report   --target=.        --out=health.json --format=json
```

## Constraints

- ✅ Read-only API surface inspection
- ✅ Isolated from Builder, Runtime and Agent 1 code
- ❌ Does NOT modify any source files or barrel exports
- ❌ Does NOT integrate with Runtime or CI/CD
