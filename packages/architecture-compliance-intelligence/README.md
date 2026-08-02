# @web-factor/architecture-compliance-intelligence

**Sprint EP28 — Architecture Compliance Intelligence Platform**

Static analysis package that verifies whether the implementation conforms to the reference architecture of the platform. It detects architectural layer violations, forbidden cross-layer dependencies, module boundary breaches and ADR non-conformance — without modifying any code and without running the application.

## Responsibilities

- **Read-only** static analysis of dependency declarations and module metadata.
- Validates allowed dependency directions between architectural layers.
- Detects imports that cross forbidden layer boundaries.
- Enforces module isolation rules (e.g. UI must not import infrastructure directly).
- Checks conformance with recorded Architecture Decision Records (ADRs).
- Identifies separation-of-concerns violations.
- Detects forbidden cross-package dependency edges.
- Produces an Architecture Compliance Score (0–100) with A+–F grade and prioritised recommendations.
- Exports Markdown and JSON report formats.
- Provides a CLI parser for `architecture-compliance analyze | validate | report`.

## Package layout

```
src/
  model/      — Data contracts (ArchitectureRule, ArchitectureViolation, …)
  analyzer/   — Static compliance analysis
  validator/  — Violation classification, metric computation, prioritisation
  report/     — Compliance score and report export
  cli/        — CLI argument parser
  index.ts    — Public API barrel
```

## Usage (programmatic)

```ts
import {
  ComplianceAnalyzer,
  ComplianceValidator,
  ComplianceReportGenerator,
  ComplianceCLI,
} from '@web-factor/architecture-compliance-intelligence';

const modules    = ComplianceAnalyzer.parseModules(rawModuleData);
const rules      = ComplianceAnalyzer.parseRules(rawRuleData);
const violations = ComplianceAnalyzer.analyzeAll(modules, rules);
const assessment = ComplianceValidator.assessViolations(violations);
const report     = ComplianceReportGenerator.generateReport(assessment, violations, modules, rules);

console.log(ComplianceReportGenerator.toMarkdown(report));
```

## CLI

```bash
architecture-compliance analyze  --target=packages --out=report.md
architecture-compliance validate --target=packages --format=json
architecture-compliance report   --target=.        --out=compliance.json --format=json
```

## Constraints

- ✅ Read-only static analysis — no code execution, no application run
- ✅ Isolated from Builder, Runtime and Agent 1 code
- ❌ Does NOT automatically fix architectural violations
- ❌ Does NOT integrate with Runtime or CI/CD
- ❌ Does NOT modify any source files
