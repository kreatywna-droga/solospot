# G1-55 Checkpoints & Rollback Strategy

## Checkpoints
- `CHECKPOINT_BASELINE`: `fa24b003a8236e448d3f82002140b59e5a3edf92` (G1-54 Baseline)
- `CHECKPOINT_INTERACTION`: Created during `createPageSession` and transaction boundaries.
- `CHECKPOINT_SESSION_START`: Baseline session state.

## Rollback Protocol
- On builder interaction exception or transaction failure: 0 `HistoryStack` entries committed, workspace snapshot restored 100%.
