# G1-58 Checkpoints & Rollback Strategy

## Checkpoints
- `CHECKPOINT_BASELINE`: `b71545799df342bf282b0232a7dcb6ce09edf6fe` (G1-57 Baseline)
- `CHECKPOINT_CART_SESSION`: Created during `createCartSession`.
- `CHECKPOINT_FINAL_VERIFICATION`: Pre-B13 baseline.

## Rollback Protocol
- On cart/checkout exception or invalid transition dispatch: 0 `HistoryStack` entries committed, initial cart session restored 100%.
