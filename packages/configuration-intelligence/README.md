# @web-factor/configuration-intelligence

**Sprint EP25 — Configuration Intelligence Platform**

Static analysis package that inspects monorepo configuration files, detects inconsistencies, missing configs and inter-package conflicts — without modifying any file and without running build processes.

## Responsibilities

- **Read-only** inspection of all configuration files.
- Analyses `tsconfig*.json`, `package.json`, ESLint, Prettier, Vitest, and bundler configs.
- Detects path-alias mismatches, setting divergence across packages, missing required config files, and conflicting tool settings.
- Produces a Configuration Health Score (0–100) with A+–F grade, classified issue list and actionable recommendations.
- Exports Markdown and JSON report formats.
- Provides a CLI parser for `configuration-intelligence analyze | validate | report`.

## Package layout

```
src/
  model/      — Data contracts (ConfigurationArtifact, ConfigurationIssue, …)
  analyzer/   — Per-tool and cross-package static analysis
  validator/  — Issue classification, conflict detection, aggregation
  report/     — Health-score calculation and report export
  cli/        — CLI argument parser
  index.ts    — Public API barrel
```

## Usage (programmatic)

```ts
import {
  ConfigurationAnalyzer,
  ConfigurationValidator,
  ConfigurationReportGenerator,
  ConfigurationIntelligenceCLI,
} from '@web-factor/configuration-intelligence';

const artifacts = ConfigurationAnalyzer.parseArtifacts(rawConfigData);
const issues    = ConfigurationAnalyzer.analyzeAll(artifacts);
const assess    = ConfigurationValidator.assessIssues(issues);
const report    = ConfigurationReportGenerator.generateReport(assess, issues, artifacts);

console.log(ConfigurationReportGenerator.toMarkdown(report));
```

## CLI

```bash
configuration-intelligence analyze  --target=packages --out=report.md
configuration-intelligence validate --target=packages --format=json
configuration-intelligence report   --target=.        --out=health.json --format=json
```

## Constraints

- ✅ Read-only configuration inspection
- ✅ Isolated from Builder, Runtime and Agent 1 code
- ❌ Does NOT modify any configuration file
- ❌ Does NOT integrate with Runtime or CI/CD
