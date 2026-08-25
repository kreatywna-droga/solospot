# G1-60 Checkpoints & Rollback Strategy

## Checkpoints
- `CHECKPOINT_BASELINE`: `8b97e09f1e5c62cd2f45b981fd316e36240e8985` (G1-59 Baseline)
- `CHECKPOINT_SUBMISSION_PAYLOAD`: Created during `compileSubmissionPayload`.
- `CHECKPOINT_FINAL_VERIFICATION`: Pre-B13 baseline.

## Rollback Protocol
- On validation exception or corrupted submission JSON: 0 `HistoryStack` entries committed, baseline form state restored 100%.
