# WF-HACP-STUDIO-G1-42 Mission Contract & Plan

## Mission Requirements
- Task ID: `WF-HACP-STUDIO-G1-42`
- Parent: `WF-HACP-STUDIO-G1-41` (`eda6cab`)
- Training Level: Night Shift Level 4
- Complexity: 5/5
- Autonomy Target: 5/5
- Target Architecture: Pure Headless TS engine, ZERO DOM, ZERO React, ZERO Browser APIs.

## Non-Negotiable Contract Constraints
1. **SSOT Integrity**: `VectorDocumentSnapshot` remains single source of truth.
2. **Transaction Boundaries**: Executing a workflow command or batch commits exactly 1 transaction to `HistoryStack`. Preview/cancel produce 0 history entries.
3. **Rollback Safety**: Any failure during batch command execution triggers full transactional rollback with 0 partial commits.
4. **Baseline Compliance**: 3 pre-existing baseline test failures remain untouched. 0 new failures allowed.
5. **Night Shift Target Metrics**:
   - Stages >= 12
   - Checkpoints >= 12
   - Controlled Interruptions >= 4
   - Model Reassessments >= 4
   - Real Rework Events >= 3
   - Failure Injection Scenarios >= 8
