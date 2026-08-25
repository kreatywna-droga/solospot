# WF-HACP-STUDIO-G1-53: Recovery Model

## Automated Rollback Guarantee
If conflict resolution fails or if the strategy is `rollback`, the transaction engine restores `state.snapshot` byte-for-byte to its pre-transaction checkpoint state. Zero mutations are committed to `HistoryStack`.
