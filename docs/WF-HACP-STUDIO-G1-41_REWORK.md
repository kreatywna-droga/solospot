# WF-HACP-STUDIO-G1-41 Real Rework Events Log

## Rework Event #1: Test Function Name Mismatch
- **Problem**: `VectorTransformPipelineG141.test.ts` initial draft imported `createInitialWorkspaceState` and `selectNodesAction`, which caused 10 test failures due to `TypeError: createInitialWorkspaceState is not a function`.
- **Detection**: Caught during initial test execution in Stage 09.
- **Root Cause**: Controller exports in `VectorWorkspaceController.ts` are named `createVectorWorkspaceState` and `selectNodes`.
- **Architectural Decision**: Update test suite imports to match exact exported controller function signatures.
- **Correction**: Updated imports and invocations in `VectorTransformPipelineG141.test.ts`.
- **Retest**: Re-ran test suite; 10 failures resolved immediately.
- **Regression Verification**: 0 regression impact.

## Rework Event #2: HistoryStack API & Immutability Reconciliation
- **Problem**: Test assertions in `I01`, `I02`, `I03`, `I07`, `I08`, `E2E-06`, `E2E-10` attempted to read `state.historyStack.past.length` and invoke `undo()` / `redo()` as mutating methods, causing 14 test failures.
- **Detection**: Caught during Stage 09 test execution.
- **Root Cause**: `HistoryStack` in `builder-core` is an immutable data structure where entries are stored in `entries: ReadonlyArray<HistoryEntry<T>>` and `undo()` / `redo()` return `{ stack, history, state }` objects.
- **Architectural Decision**: Reconcile test assertions to consume `historyStack.entries.length` and properly destructure `{ state, stack } = historyStack.undo()`.
- **Correction**: Updated `VectorTransformPipelineG141.test.ts` to consume exact `HistoryStack` API.
- **Retest**: All 69 tests passed 100%.
- **Regression Verification**: Confirmed zero impact on core domain models or prior test suites.
