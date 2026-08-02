# @web-factor/release-readiness-intelligence

**Sprint EP33 — Release Readiness Intelligence Platform**

Static analysis package that evaluates the release readiness of the monorepo — aggregating findings from all Intelligence packages, evaluating Quality Gates, checking Architecture Freeze documentation, Public API stability, and configuration completeness — without running builds, deployments, or integration tests.

## Responsibilities

- **Read-only** static aggregation of Intelligence reports and repository artifact snapshots.
- Evaluates Release Quality Gates across security, architecture, API surface, configuration, performance, and documentation.
- Verifies Architecture Freeze documentation alignment and completion gates.
- Checks Public API stability (no unhandled breaking changes or missing barrels).
- Assesses configuration completeness across packages.
- Classifies release risks into blocker, high, medium, and low risks.
- Computes a Release Readiness Score (0–100) and readiness status (`Ready` | `Conditionally Ready` | `Not Ready`).
- Exports Markdown and JSON report formats.
- Provides a CLI parser for `release-readiness analyze | validate | report`.

## Package layout

```
src/
  model/      — Data contracts (ReleaseReadinessAssessment, ReleaseGate, ReleaseRisk, ReleaseReport, …)
  analyzer/   — Static release readiness analysis & Intelligence report aggregator
  validator/  — Gate evaluation, risk classification, prioritisation
  report/     — Readiness score calculation, status derivation, and report export
  cli/        — CLI argument parser
  index.ts    — Public API barrel
```

## Usage (programmatic)

```ts
import {
  ReleaseReadinessAnalyzer,
  ReleaseReadinessValidator,
  ReleaseReadinessReportGenerator,
  ReleaseReadinessCLI,
} from '@web-factor/release-readiness-intelligence';

const snapshot = ReleaseReadinessAnalyzer.parseSnapshot(rawRepoSnapshot);
const gates    = ReleaseReadinessAnalyzer.parseGates(rawGates);
const risks    = ReleaseReadinessAnalyzer.analyzeAll(snapshot, gates);
const results  = ReleaseReadinessValidator.evaluateGates(gates, snapshot, risks);
const assess   = ReleaseReadinessValidator.assessReadiness(results, risks);
const report   = ReleaseReadinessReportGenerator.generateReport(assess, results, risks, snapshot, gates);

console.log(ReleaseReadinessReportGenerator.toMarkdown(report));
```

## CLI

```bash
release-readiness analyze  --target=. --out=report.md
release-readiness validate --target=. --format=json
release-readiness report   --target=. --out=release-readiness.json --format=json
```

## Constraints

- ✅ Read-only static analysis — no builds, no deployments, no tests executed
- ✅ Isolated from Builder, Runtime and Agent 1 code
- ❌ Does NOT execute build or deployment pipelines
- ❌ Does NOT auto-approve releases
- ❌ Does NOT integrate with Runtime or CI/CD
