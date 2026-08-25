# G1-60 Transaction Model

## Transaction Principles
1. **Single Commit Per Form Submission**: `compileSubmissionPayload` commits exactly 1 `HistoryStack` entry.
2. **Zero Commit on Validation**: `validateFormSubmission` commits 0 `HistoryStack` entries.
3. **Determinism**: Identical field values produce identical `FormSubmissionPayloadDTO` structures.
