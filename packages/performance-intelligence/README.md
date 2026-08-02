# @web-factor/performance-intelligence

**Sprint EP27 — Performance Intelligence Platform**

Static analysis package that identifies architectural performance risks in the monorepo — without executing benchmarks, profiling code, or running build processes.

## Responsibilities

- **Read-only** static analysis of module structure and dependency metadata.
- Identifies potentially costly dependencies (heavy third-party packages, deep transitive chains).
- Flags oversized modules that may cause bundle bloat.
- Detects deep import chains that increase build graph complexity.
- Identifies architectural hotspots (high fan-in / high fan-out modules).
- Suggests module split opportunities.
- Computes structural complexity indicators.
- Produces a Performance Health Score (0–100) with A+–F grade and prioritised recommendations.
- Exports Markdown and JSON report formats.
- Provides a CLI parser for `performance-intelligence analyze | validate | report`.

## Package layout

```
src/
  model/      — Data contracts (PerformanceMetric, PerformanceIssue, …)
  analyzer/   — Static performance risk analysis
  validator/  — Issue classification, threshold validation, prioritisation
  report/     — Health-score calculation and report export
  cli/        — CLI argument parser
  index.ts    — Public API barrel
```

## Usage (programmatic)

```ts
import {
  PerformanceAnalyzer,
  PerformanceValidator,
  PerformanceReportGenerator,
  PerformanceCLI,
} from '@web-factor/performance-intelligence';

const modules  = PerformanceAnalyzer.parseModules(rawModuleData);
const issues   = PerformanceAnalyzer.analyzeAll(modules);
const assess   = PerformanceValidator.assessIssues(issues);
const report   = PerformanceReportGenerator.generateReport(assess, issues, modules);

console.log(PerformanceReportGenerator.toMarkdown(report));
```

## CLI

```bash
performance-intelligence analyze  --target=packages --out=report.md
performance-intelligence validate --target=packages --format=json
performance-intelligence report   --target=.        --out=health.json --format=json
```

## Constraints

- ✅ Read-only static analysis — no code execution, no benchmarks
- ✅ Isolated from Builder, Runtime and Agent 1 code
- ❌ Does NOT run profiling or benchmark processes
- ❌ Does NOT automatically optimise any code
- ❌ Does NOT integrate with Runtime or CI/CD
