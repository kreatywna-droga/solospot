# G1-56 Checkpoints & Rollback Strategy

## Checkpoints
- `CHECKPOINT_BASELINE`: `407a43d6928bafc9ab9d04989f47b5dcaf9e1cb6` (G1-55 Baseline)
- `CHECKPOINT_CANVAS_SESSION`: Created during `initCanvasRuntimeSession`.
- `CHECKPOINT_FINAL_VERIFICATION`: Baseline pre-B13 state.

## Rollback Protocol
- On UI adapter exception or section dispatch failure: 0 `HistoryStack` entries committed, workspace snapshot restored 100%.
