# WF-HACP-STUDIO-G1-52 Failure Injection Matrix

| ID | Attack Vector | Expected Behavior | Observed Result | Status |
|---|---|---|---|---|
| FI-01 | Corrupted edge DTO (null targetId) | Graceful handling / bypass | Handled cleanly | PASS |
| FI-02 | Cycle introduced during editing | Pre-flight abort, 0 commits | Handled cleanly | PASS |
| FI-04 | NaN bounding box mutation | Pre-flight abort, 0 commits | Handled cleanly | PASS |
| FI-10 | Locked node conflict during batch | Abort with LOCKED_NODE_CONFLICT | Handled cleanly | PASS |
| FI-23 | 200-node loop cycle detection | Abort with CYCLE_DETECTED | Handled cleanly | PASS |
| FI-25 | Max iterations limit exceeded | Abort with MAX_ITERATIONS_EXCEEDED | Handled cleanly | PASS |
