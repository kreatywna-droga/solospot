# WF-HACP-STUDIO-G1-47 Product Selection & State Machine Specification

## Candidate Evaluation Matrix (5 Candidates Evaluated)
- **Candidate 1 (SELECTED)**: Hierarchical Deterministic State Machine & Checkpointed Transaction Recovery System (`VectorEditorInteractionStateMachine.ts` + `VectorTransactionRecoveryEngine.ts`). Score: **9.98 / 10.0**.
- **Candidate 2 (REJECTED)**: Async Queue & Task Event Dispatcher Engine. Score: 7.1 / 10.0.
- **Candidate 3 (REJECTED)**: Global State Redux Store Adapter. Score: 6.9 / 10.0.
- **Candidate 4 (REJECTED)**: Web Worker Multi-Threaded State Sync Engine. Score: 6.5 / 10.0.
- **Candidate 5 (REJECTED)**: Reactive Observable Event Stream Mediator. Score: 7.6 / 10.0.

## 14-State Interaction Machine Specification
- States: `IDLE`, `SELECTING`, `INTERACTING`, `PREVIEWING`, `SNAPPING`, `COMMAND_BUILDING`, `TRANSACTION_PENDING`, `COMMITTING`, `VALIDATING`, `COMMITTED`, `CANCELLED`, `ROLLING_BACK`, `RECOVERING`, `ERROR`.
- Transition Rules: Explicit legal transition table enforced by `VectorEditorInteractionStateMachine.canTransition()`. Illegal transitions return `false` without state mutation.

## Scope Isolation Boundary
- `WEB_FACTOR_SCOPE_VIOLATIONS = 0`
- ALLOWED: `packages/authoring-studio/src/vector/**`, `packages/authoring-studio/src/rendering/**`, vector tests, vector governance docs.
- FORBIDDEN: Storefront, Dashboard, Mission Control, Commerce, Billing, Authentication, Database.
