# @web-factor/dependency-intelligence

**Sprint EP32 — Dependency Intelligence Platform**

Static analysis package that inspects the monorepo dependency graph — detecting circular dependencies, version mismatches, unused or orphaned dependencies, excessive transitive depth, and graph complexity — without running code and without modifying package manifests.

## Responsibilities

- **Read-only** static analysis of package manifests (`package.json`) and import graphs.
- Detects circular dependencies (cycles in the directed dependency graph).
- Identifies unused dependencies declared in `package.json` but never imported.
- Identifies orphaned packages (packages not imported by any workspace module).
- Detects version inconsistencies across packages for shared third-party dependencies.
- Detects duplicate dependencies declared in both `dependencies` and `devDependencies`.
- Flags excessive transitive dependency depth and graph complexity.
- Computes a Dependency Health Score (0–100) with A+–F grade and prioritised fix recommendations.
- Exports Markdown and JSON report formats.
- Provides a CLI parser for `dependency-intelligence analyze | validate | report`.

## Package layout

```
src/
  model/      — Data contracts (DependencyNode, DependencyEdge, DependencyReport, …)
  analyzer/   — Static dependency analysis (cycles, unused, version conflicts, complexity)
  validator/  — Threshold validation, issue classification, prioritisation
  report/     — Health-score calculation and report export
  cli/        — CLI argument parser
  index.ts    — Public API barrel
```

## Usage (programmatic)

```ts
import {
  DependencyAnalyzer,
  DependencyValidator,
  DependencyReportGenerator,
  DependencyCLI,
} from '@web-factor/dependency-intelligence';

const nodes  = DependencyAnalyzer.parseGraph(rawNodeData);
const issues = DependencyAnalyzer.analyzeAll(nodes);
const assess = DependencyValidator.assessIssues(issues, nodes);
const report = DependencyReportGenerator.generateReport(assess, issues, nodes);

console.log(DependencyReportGenerator.toMarkdown(report));
```

## CLI

```bash
dependency-intelligence analyze  --target=packages --out=report.md
dependency-intelligence validate --target=packages --format=json
dependency-intelligence report   --target=.        --out=deps.json --format=json
```

## Constraints

- ✅ Read-only static analysis — no code execution
- ✅ Isolated from Builder, Runtime and Agent 1 code
- ❌ Does NOT automatically update or delete dependencies
- ❌ Does NOT integrate with Runtime or CI/CD
