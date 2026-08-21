# WF-HACP-STUDIO-G1-43 Mission Contract & Plan

## Mission Requirements
- Task ID: `WF-HACP-STUDIO-G1-43`
- Parent: `WF-HACP-STUDIO-G1-42` (`305db80`)
- Training Level: Night Shift Level 5
- Complexity: 5/5
- Autonomy Target: 5/5
- Target Architecture: Pure Headless TS engine, ZERO DOM, ZERO React, ZERO Browser APIs.

## Non-Negotiable Contract Constraints
1. **SSOT Integrity**: `VectorDocumentSnapshot` remains single source of truth.
2. **Transaction Boundaries**: Executing a path or boolean topology command commits exactly 1 transaction to `HistoryStack`. Previews produce 0 history entries.
3. **Rollback Safety**: Any failure during topology calculation aborts execution safely with 0 partial commits.
4. **Baseline Compliance**: 3 pre-existing baseline test failures remain untouched. 0 new failures allowed.
5. **Night Shift Target Metrics**:
   - Stages >= 8
   - Checkpoints >= 8
   - Controlled Interruptions >= 3
   - Failure Injection Scenarios >= 5
   - New Tests >= 67
   - Human Interventions = 0
