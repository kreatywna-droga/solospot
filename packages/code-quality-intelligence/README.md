# @web-factor/code-quality-intelligence

**Sprint EP31 — Code Quality Intelligence Platform**

Static analysis package that measures code quality, cyclomatic complexity, code duplication, file/function length, dead code, naming consistency, and design convention compliance across the monorepo — without modifying any code and without running tests or build processes.

## Responsibilities

- **Read-only** static analysis of TypeScript / JavaScript source files.
- Evaluates function and module cyclomatic complexity budgets.
- Detects duplicated code blocks across source files.
- Identifies oversized files and long functions exceeding readability thresholds.
- Flags naming inconsistencies (non-camelCase functions, non-PascalCase classes/types).
- Detects unused/dead code declarations (unused functions, exports, variables).
- Enforces design convention compliance (e.g. max parameters per function, explicit return types).
- Computes maintainability index indicators.
- Produces a Code Quality Health Score (0–100) with A+–F grade and prioritised fix recommendations.
- Exports Markdown and JSON report formats.
- Provides a CLI parser for `code-quality-intelligence analyze | validate | report`.

## Package layout

```
src/
  model/      — Data contracts (CodeQualityIssue, CodeQualityMetric, CodeQualityReport, …)
  analyzer/   — Static quality analysis (complexity, duplication, length, naming, dead code)
  validator/  — Threshold validation, issue classification, prioritisation
  report/     — Health-score calculation and report export
  cli/        — CLI argument parser
  index.ts    — Public API barrel
```

## Usage (programmatic)

```ts
import {
  CodeQualityAnalyzer,
  CodeQualityValidator,
  CodeQualityReportGenerator,
  CodeQualityCLI,
} from '@web-factor/code-quality-intelligence';

const files   = CodeQualityAnalyzer.parseFiles(rawFileSnapshots);
const issues  = CodeQualityAnalyzer.analyzeAll(files);
const assess  = CodeQualityValidator.assessIssues(issues, files);
const report  = CodeQualityReportGenerator.generateReport(assess, issues, files);

console.log(CodeQualityReportGenerator.toMarkdown(report));
```

## CLI

```bash
code-quality-intelligence analyze  --target=src --out=report.md
code-quality-intelligence validate --target=packages --format=json
code-quality-intelligence report   --target=.        --out=quality.json --format=json
```

## Constraints

- ✅ Read-only static analysis — no code execution
- ✅ Isolated from Builder, Runtime and Agent 1 code
- ❌ Does NOT automatically modify or refactor code
- ❌ Does NOT integrate with Runtime or CI/CD
