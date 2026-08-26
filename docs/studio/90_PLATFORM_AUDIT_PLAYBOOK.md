# 90. WEB FACTOR Platform Audit Playbook

> Maintained by Agent 2 (Platform Engineering Maintenance)  
> Date: 2026-07-31  
> Status: 🟢 APPROVED

---

## 1. Audit Trigger & Execution Schedule

A formal Platform Engineering Audit MUST be executed in the following scenarios:
1. **End of Product Sprint**: Automatically triggered when Agent 1 declares a product sprint complete (e.g. Sprint 6B).
2. **Pre-Release Milestone**: Executed prior to tagging candidate releases (`v1.0.0-rcX`).
3. **Architecture Freeze Review**: Executed whenever an Architecture Freeze specification is submitted for approval.

---

## 2. Package Execution Order

Audits must be run strictly in the following sequential order:

```
[1. repository-intelligence] ➔ [2. configuration-intelligence] ➔ [3. api-surface-intelligence] ➔
[4. security-intelligence] ➔ [5. dependency-intelligence] ➔ [6. code-quality-intelligence] ➔
[7. performance-intelligence] ➔ [8. documentation-intelligence] ➔ [9. architecture-compliance-intelligence] ➔
[10. release-readiness-intelligence] ➔ [11. platform-intelligence-orchestrator (MASTER)]
```

---

## 3. Result Interpretation & Definition of Green Release

A release candidate is declared **GREEN RELEASE** only if:
- **Platform Health Score**: `>= 80 / 100`
- **Release Readiness Verdict**: `READY`
- **Mandatory Quality Gates**: **100% PASS**
- **Critical Security Findings**: **0**
- **Architecture Violations**: **0 Critical / 0 Error**
- **Public API Breaking Changes**: **0**
- **Circular Dependencies**: **0**

---

## 4. Problem Escalation Procedure

1. **Critical Security or Architecture Finding**: Immediate BLOCKER. Revert commit or fix violation before re-auditing.
2. **Sub-Optimal Health Score (<80)**: Refer to `PlatformReportGenerator` recommendations and address P1 priority items.
3. **Missing Documentation**: Update package README or ADR before final approval.

---

## 5. Standard raportowania audytów (od PM33)

Od **PM33** obowiązuje zamrożony standard raportowania audytów architektonicznych. Format raportu, klasyfikacja źródeł dowodów (**Evidence Provenance**), pole **Verification Method** oraz format **Quality Gates** są zdefiniowane w jedynym źródle prawdy (SSOT):

> **`docs/studio/121_CODE_EVIDENCE_AUDIT_PROTOCOL_FREEZE_v1.0.md`**

Wszystkie audyty (w tym platform audit) **muszą** oznaczać każde źródło dowodu kategorią `Repository Verified` / `Diff Verified` / `Evidence Verified` / `Not Independently Reproduced` oraz raportować bramki (TypeScript, Vitest, Build) w formacie `Status` / `Evidence Source` / `Independent Execution`. Szczegóły w dokumencie 121.
