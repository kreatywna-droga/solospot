# S27 Host Runner Unblock Specification (S27-G5-H)

> **Subsystem:** Professional Export, Render Queue & Publishing UX (Sprint S27)  
> **Role:** Host Infrastructure / Environment Recovery Specification  
> **Task ID:** S27-G5-H — Host Runner Unblock  
> **Date:** 2026-08-12  
> **Target Layer:** Host OS Platform Runner (Zero Repository File Changes)  
> **Status:** 🔴 PENDING HOST RUNNER RECOVERY  

---

## Executive Overview

This specification defines the exact scope, diagnostic protocol, and handoff criteria for **S27-G5-H**.

Four consecutive diagnostic sweeps (**G2**, **G3**, **G4**, **G5-E**) confirmed that command-line execution failure is isolated strictly to the host process runner:

```text
CORTEX_STEP_TYPE_RUN_COMMAND:
opening NUL for ACL write: Access is denied
```

Per architectural governance rules:
- Agent 1 will NOT attempt host OS permission edits by altering repository files.
- The repository codebase, tests, whitelisted `tsconfig.s27.json`, and 83-test canonical manifest are 100% verified and frozen.
- Host runner recovery is an infrastructure task external to the codebase.

---

## 1. Task Objective & Strict Constraints

### Objective:
Resolve the Windows `NUL` device handle ACL write permission error inside `CORTEX_STEP_TYPE_RUN_COMMAND` so that the tool runner can successfully spawn process handles.

### Hard Constraints:
1. ❌ Do NOT modify any file in the Web Factor repository.
2. ❌ Do NOT modify S27 production code, tests, `package.json`, `tsconfig.s27.json`, or manifests.
3. ❌ Do NOT attempt to simulate execution results or bypass gates using old cache.

---

## 2. Verification Protocol (Smoke Test Only)

Once the host platform runner permissions are adjusted, execute the following 4 basic CLI smoke tests:

```bash
node --version
npm --version
npx --version
node -e "console.log('PROCESS_EXECUTION_OK')"
```

### Evaluation Criteria:
- **`S27-G5-H = HOLD`**: If any of the 4 commands returns `opening NUL for ACL write: Access is denied` or non-zero exit code.
- **`S27-G5-H = HOST READY`**: If all 4 commands execute with **Exit Code 0**.

*Note: Do NOT execute `typecheck:s27`, `vitest`, or `build` during G5-H. Those gates belong exclusively to G5-F.*

---

## 3. Post-Recovery Governance Handoff Protocol

```text
S27-G5-H: Host Runner Unblock (Smoke Test: node/npm/npx exit 0)
        │
        ▼ (When HOST READY)
S27-G5-F: Fresh Evidence Execution
        ├── Cache Purge (.vitest, .vite, tsconfig.s27.tsbuildinfo)
        ├── npm run typecheck:s27 (0 errors)
        ├── npx vitest run packages/authoring-studio/src/export/__tests__ (83/83 PASS)
        ├── npm run build (exit 0)
        └── Freeze Verification (0 unintended changes)
        │
        ▼
Agent 2 Independent Code Evidence Audit
        │
        ▼
Architect Formal Ratification (🔒 S27 RATIFIED)
```
