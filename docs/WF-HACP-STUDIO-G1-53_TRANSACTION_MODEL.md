# WF-HACP-STUDIO-G1-53: Transaction Model

## Transaction Structure
- **Workflow**: `resolveConstraintConflictsWorkflow`
- **Steps**:
  1. `step_1_analyze_and_detect`: Generates `ConflictReport`.
  2. `step_2_resolve_and_solve`: Resolves conflicts via strategy and runs incremental solver.
- **Commit Behavior**: Exactly 1 history entry pushed on success; 0 history entries pushed on failure/rollback/no-op.
