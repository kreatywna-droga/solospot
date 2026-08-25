# G1-59 Checkpoints & Rollback Strategy

## Checkpoints
- `CHECKPOINT_BASELINE`: `cea4ce67200cff336be03abf82a16cc014205d1e` (G1-58 Baseline)
- `CHECKPOINT_BUILD_ARTIFACT`: Created during `compileSiteBuildArtifact`.
- `CHECKPOINT_FINAL_VERIFICATION`: Pre-B13 baseline.

## Rollback Protocol
- On publishing exception or invalid handoff dispatch: 0 `HistoryStack` entries committed, previous `DeploymentManifestDTO` restored 100%.
