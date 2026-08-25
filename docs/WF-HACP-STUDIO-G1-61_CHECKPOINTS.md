# G1-61 Checkpoints & Rollback Strategy

## Checkpoints
- `CHECKPOINT_BASELINE`: `2546f546b1319ecb49230237a47629bfda6032d9` (G1-60 Baseline)
- `CHECKPOINT_BATCH_QUEUE`: Created during `createBatchQueue`.
- `CHECKPOINT_FINAL_VERIFICATION`: Pre-B13 baseline.

## Rollback Protocol
- On telemetry exception or corrupted JSON session: 0 `HistoryStack` entries committed, baseline visitor session restored 100%.
