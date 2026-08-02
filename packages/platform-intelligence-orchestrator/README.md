# @web-factor/platform-intelligence-orchestrator

**Sprint EP34 — Platform Intelligence Orchestrator**

Master orchestration package that aggregates, normalises, deduplicates, and synthesises results from all Platform Engineering Intelligence packages into a single, unified view of monorepo platform health — without executing static analyses independently and without modifying any source files.

## Integrated Intelligence Modules

1. `@web-factor/repository-intelligence` (EP24)
2. `@web-factor/configuration-intelligence` (EP25)
3. `@web-factor/api-surface-intelligence` (EP26)
4. `@web-factor/performance-intelligence` (EP27)
5. `@web-factor/architecture-compliance-intelligence` (EP28)
6. `@web-factor/documentation-intelligence` (EP29)
7. `@web-factor/security-intelligence` (EP30)
8. `@web-factor/code-quality-intelligence` (EP31)
9. `@web-factor/dependency-intelligence` (EP32)
10. `@web-factor/release-readiness-intelligence` (EP33)

## Responsibilities

- **Read-only** aggregation of Intelligence reports and snapshots.
- Deduplicates identical or overlapping findings across modules.
- Normalises severity levels across disparate domain taxonomies.
- Merges prioritised recommendations into a single, unified action plan.
- Calculates the Overall Platform Health Score (0–100) and grade (`Excellent` | `Good` | `Fair` | `Poor`).
- Exports unified Markdown and JSON reports.
- Provides a CLI parser for `platform-intelligence aggregate | validate | report`.

## Package layout

```
src/
  model/         — Data contracts (PlatformSnapshot, IntelligenceResult, PlatformReport, …)
  orchestrator/  — Report reader, deduplication, severity normaliser, score calculator
  validator/     — Report completeness validation, risk classification, prioritisation
  report/        — Overall score calculation, grade derivation, Markdown & JSON export
  cli/           — CLI argument parser
  index.ts       — Public API barrel
```

## Usage (programmatic)

```ts
import {
  PlatformOrchestrator,
  PlatformValidator,
  PlatformReportGenerator,
  PlatformCLI,
} from '@web-factor/platform-intelligence-orchestrator';

const snapshot = PlatformOrchestrator.aggregateReports(moduleResults);
const assess   = PlatformValidator.assessPlatform(snapshot);
const report   = PlatformReportGenerator.generateReport(assess, snapshot);

console.log(PlatformReportGenerator.toMarkdown(report));
```

## CLI

```bash
platform-intelligence aggregate --target=. --out=report.md
platform-intelligence validate  --target=. --format=json
platform-intelligence report    --target=. --out=platform-health.json --format=json
```

## Constraints

- ✅ Read-only aggregation — no custom static analysis execution
- ✅ Isolated from Builder, Runtime and Agent 1 code
- ❌ Does NOT modify source files or code
- ❌ Does NOT integrate with Runtime or CI/CD
