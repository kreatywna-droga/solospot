# @web-factor/security-intelligence

**Sprint EP30 — Security Intelligence Platform**

Static analysis package that inspects static security risks, hardcoded secret patterns, unsafe code constructs, dangerous dependency risks, configuration flaws, and security policy compliance across the monorepo — without executing code and without modifying existing source files.

## Responsibilities

- **Read-only** static security analysis of source code, configuration files, and dependency manifests.
- Detects potential hardcoded secrets (API keys, private keys, tokens, credentials).
- Identifies unsafe code patterns (eval, innerHTML injection risk, insecure randoms, disabled SSL).
- Flags dangerous or vulnerable dependency declarations.
- Enforces Security Policy compliance (e.g. mandatory CSRF protection, secure cookies, CORS limits).
- Checks for least privilege violations (excessive permissions, wildcard origins).
- Identifies configuration security risks (debug mode in prod, exposed secrets in config).
- Computes a Security Health Score (0–100) with A+–F grade and prioritised fix recommendations.
- Exports Markdown and JSON report formats.
- Provides a CLI parser for `security-intelligence analyze | validate | report`.

## Package layout

```
src/
  model/      — Data contracts (SecurityFinding, SecurityPolicy, SecurityReport, …)
  analyzer/   — Static security analysis (secrets, patterns, deps, policies)
  validator/  — Threat classification, policy validation, prioritisation
  report/     — Health-score calculation and report export
  cli/        — CLI argument parser
  index.ts    — Public API barrel
```

## Usage (programmatic)

```ts
import {
  SecurityAnalyzer,
  SecurityValidator,
  SecurityReportGenerator,
  SecurityCLI,
} from '@web-factor/security-intelligence';

const files    = SecurityAnalyzer.parseFiles(rawFileSnapshots);
const policies = SecurityAnalyzer.parsePolicies(rawPolicies);
const findings = SecurityAnalyzer.analyzeAll(files, policies);
const assess   = SecurityValidator.assessFindings(findings, policies);
const report   = SecurityReportGenerator.generateReport(assess, findings, files, policies);

console.log(SecurityReportGenerator.toMarkdown(report));
```

## CLI

```bash
security-intelligence analyze  --target=src --out=report.md
security-intelligence validate --target=packages --format=json
security-intelligence report   --target=.        --out=sec-health.json --format=json
```

## Constraints

- ✅ Read-only static analysis — no code execution
- ✅ Isolated from Builder, Runtime and Agent 1 code
- ❌ Does NOT automatically modify code or delete secrets
- ❌ Does NOT integrate with Runtime or CI/CD
