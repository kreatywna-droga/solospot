# WF-HACP-STUDIO-G1-53: Checkpoints & Recovery Levels

1. `CHECKPOINT_SESSION_START`: Session initialization.
2. `CHECKPOINT_SELECTION`: Selection change checkpoint.
3. `CHECKPOINT_PREVIEW`: Interactive transient preview state.
4. `CHECKPOINT_COMMAND`: Single vector command execution.
5. `CHECKPOINT_TRANSACTION`: Deterministic multi-step workflow transaction.
6. `CHECKPOINT_VALIDATION`: Post-flight schema and boundary validation.

All 6 checkpoints guarantee complete preservation of `constraintEdges`.
