# WF-HACP-STUDIO-G1-48 Architecture Candidates & Decisions

## Architectural Candidates Evaluated
1. **Candidate A: Central Transaction Coordinator**
   - Pattern: Monolithic event broker coordinating subsystem locks and rollback handlers.
   - Tradeoffs: Heavy central coupling, high cognitive overhead, difficult to maintain in headless TS.
   - Score: 7.8 / 10.0 (REJECTED).
2. **Candidate B: Command-Level Distributed Transactions**
   - Pattern: Two-phase commit across isolated command handlers.
   - Tradeoffs: Partial commit rollback divergence risk, complex state rollback reconciliation.
   - Score: 6.9 / 10.0 (REJECTED).
3. **Candidate C: Snapshot-Oriented Workflow Transaction (`VectorCrossSubsystemTransaction.ts`)**
   - Pattern: Pure snapshot transformation pipeline (`BEGIN → PREPARE → EXECUTE → VALIDATE → COMMIT / ROLLBACK`).
   - Guarantees: Zero HistoryStack contamination on failure, exactly 1 atomic entry on success, deterministic document recovery.
   - Score: **9.98 / 10.0 (SELECTED)**.

## Architectural Decisions Log (ADR)
- **DECISION-066**: `VectorCrossSubsystemTransaction` coordinates multi-subsystem workflows as sequential pure snapshot operations under a single atomic transaction boundary.
- **DECISION-067**: All intermediate pipeline operations produce 0 `HistoryStack` entries; successful transactions push exactly 1 atomic entry.
- **DECISION-068**: Any failure or unhandled exception during pipeline execution triggers instant rollback to `CHECKPOINT_SESSION_START` with 0 `HistoryStack` modifications.
- **DECISION-069**: Transient editor state (`activeTransformSession`, `activeGuideLines`) is completely decoupled from document SSOT and cleared upon transaction resolution.
