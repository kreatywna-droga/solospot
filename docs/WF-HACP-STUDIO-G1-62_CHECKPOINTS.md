# G1-62 Checkpoints & Rollback Strategy

## Checkpoints
- `CHECKPOINT_BASELINE`: `f647154d6320617268ce84daa0cac09c2231daab` (G1-61 Baseline)
- `CHECKPOINT_THEME_CONFIG`: Created during `updateColorScheme`.
- `CHECKPOINT_FINAL_VERIFICATION`: Pre-B13 baseline.

## Rollback Protocol
- On theme modification exception or corrupted JSON theme string: 0 `HistoryStack` entries committed, baseline theme restored 100%.
