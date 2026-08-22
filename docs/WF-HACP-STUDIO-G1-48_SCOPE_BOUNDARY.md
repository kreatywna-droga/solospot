# WF-HACP-STUDIO-G1-48 Scope Boundary Policy

## Mandatory Scope Isolation Rules
- Milestone: `WF-HACP-STUDIO-G1-48-NIGHT-SHIFT-LEVEL-10`
- Policy Enforcement: Strict Vector Subsystem Isolation
- Target Metric: `WEB_FACTOR_SCOPE_VIOLATIONS = 0`

## Allowed Directories & Files
- `packages/authoring-studio/src/vector/**`
- `packages/authoring-studio/src/rendering/**`
- Directly required vector test files (`packages/authoring-studio/src/vector/__tests__/**`)
- Directly required vector governance documentation (`docs/WF-HACP-STUDIO-G1-48_*.md`)

## Conditionally Allowed Files
- Shared vector types/interfaces in `packages/authoring-studio/src/vector/VectorDomainModel.ts` only when strictly required.

## Strictly Forbidden Directories
- Storefront application
- Dashboard application
- Mission Control application
- Commerce Engine
- Authentication service
- Billing subsystem
- Unrelated database schemas
- Unrelated UI/framework components

## Violation Procedure
If any file outside the allowed boundary is modified:
1. STOP execution immediately.
2. REVERT unauthorized file modifications via `git checkout`.
3. DOCUMENT incident in `docs/WF-HACP-STUDIO-G1-48_SCOPE_AUDIT.md`.
4. REASSESS mission compliance before proceeding.
