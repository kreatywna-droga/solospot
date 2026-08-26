# S27 Canonical Test Manifest

> **Subsystem:** Professional Export, Render Queue & Publishing UX (Sprint S27)  
> **Canonical Test Baseline:** 83 Unit Test Cases across 7 Test Files  
> **Execution Command:** `npx vitest run packages/authoring-studio/src/export/__tests__`  
> **Date Established:** 2026-08-12  
> **Status:** Canonical SSOT for S27 Test Audit Baseline  

---

## Executive Overview

This document establishes the official **canonical test baseline** for Sprint S27. 

Following test manifest reconciliation (**S27-G5-C**), the source code in `packages/authoring-studio/src/export/__tests__/` was verified to contain **exactly 83 unit test cases** across **7 test files**.

Any future S27 execution audit MUST evaluate against these exact 83 test cases.

---

## 1. Test Suite Manifest Summary

| # | Test File Path | Size (Bytes) | Test Cases Count | Core Domain Covered |
|---|----------------|--------------|------------------|---------------------|
| 1 | `packages/authoring-studio/src/export/__tests__/ExportCenterPanel.test.tsx` | 3,837 B | 8 | Headless React UI, DOM IDs, zero ghost APIs, SSR static markup |
| 2 | `packages/authoring-studio/src/export/__tests__/OutputManager.test.ts` | 6,337 B | 16 | Artifact validation, template token rendering, monotonic versioning, output history |
| 3 | `packages/authoring-studio/src/export/__tests__/PublishingBridge.test.ts` | 7,043 B | 8 | PM44 project publisher, S8/S9 connector upload, unified publish, PM41 animation validation |
| 4 | `packages/authoring-studio/src/export/__tests__/ReleaseWorkflow.test.ts` | 6,582 B | 12 | Golden E2E 5-step workflow state machine, step ordering enforcement, release records |
| 5 | `packages/authoring-studio/src/export/__tests__/RenderErrorRecovery.test.ts` | 6,627 B | 14 | 5 error classifications, exponential backoff, DTO generation, queue snapshot/restore |
| 6 | `packages/authoring-studio/src/export/__tests__/RenderProgress.test.ts` | 2,979 B | 11 | Progress percentage, FPS calculation, frame clamping [0, totalFrames], ETA estimation |
| 7 | `packages/authoring-studio/src/export/__tests__/RenderQueue.test.ts` | 9,229 B | 14 | Monotonic job ID counter, job state transitions, queue reordering, duplicate & retry bounds |

**Total S27 Test Files:** 7  
**Total Canonical S27 Test Cases:** 83  

---

## 2. Complete Test Cases Inventory (83 Tests)

### Suite 1: `ExportCenterPanel.test.tsx` (8 Test Cases)
1. `renders Export Center heading`
2. `renders Add Export Job button with correct id`
3. `renders 0 job(s) queued in initial state`
4. `renders Clear Completed button`
5. `renders empty queue message`
6. `accepts optional onJobEnqueued callback prop without crashing`
7. `accepts optional cloudOptions prop without crashing`
8. `does not import requestAnimationFrame, AudioContext, or DOM APIs`

### Suite 2: `OutputManager.test.ts` (16 Test Cases)
9. `returns valid for correct artifact`
10. `returns invalid for null artifact`
11. `rejects artifact with empty artifactId`
12. `rejects artifact with empty checksum`
13. `rejects artifact with sizeBytes <= 0`
14. `rejects artifact with invalid dimensions`
15. `renders all tokens correctly`
16. `sanitizes special characters in project name`
17. `uses defaults for missing tokens`
18. `getNextVersion starts at v1 for new project`
19. `registerOutputArtifact increments version monotonically`
20. `artifact IDs are unique per registration`
21. `registerOutputArtifact produces valid artifact (passes validateOutputArtifact)`
22. `getOutputHistory returns all artifacts for project`
23. `clearHistory removes artifacts for specific project only`
24. `version counters are restored from initialHistory constructor param`

### Suite 3: `PublishingBridge.test.ts` (8 Test Cases)
25. `publishToCloud delegates to PM44 validateDeploymentArtifacts + publishProject`
26. `publishToCloud throws if deployment validation fails`
27. `uploadToConnector delegates to S8/S9 connector.exportData`
28. `uploadToConnector throws when connector rejects the request`
29. `publishUnified reports success when cloud publish succeeds`
30. `publishUnified mode is "dual" when connector provided`
31. `publishUnified aborts early if deployment validation fails`
32. `validateTimelineForExport delegates to AnimationExportPipeline`

### Suite 4: `ReleaseWorkflow.test.ts` (12 Test Cases)
33. `initial state is at validate step, not completed`
34. `Step 1 — validate() passes for valid document and config`
35. `Step 1 — validate() fails for null document`
36. `Step 2 — executeExport() produces artifact with checksum`
37. `Step 2 — executeExport() throws if called before validate`
38. `Step 3 — verifyArtifact() passes and advances to publish`
39. `Step 4 — publish() is BLOCKED before verifyArtifact()`
40. `Step 4 — publish() delegates to PublishingBridge after verify`
41. `Step 5 — recordRelease() produces a complete ReleaseRecord`
42. `Full Golden E2E completes without errors`
43. `Step ordering enforced — recordRelease throws before publish`
44. `logs capture all 5 steps in order`

### Suite 5: `RenderErrorRecovery.test.ts` (14 Test Cases)
45. `classifies Render-related errors as failed_render`
46. `classifies export/format errors as failed_export`
47. `classifies network/cloud errors as failed_connector`
48. `classifies cancelled/interrupted as interrupted_job`
49. `classifies unknown errors as unknown`
50. `computes exponential backoff correctly`
51. `handles non-Error objects gracefully`
52. `produces a RenderJobErrorDetails DTO with correct fields`
53. `includes stack trace for Error instances`
54. `omits stack trace for non-Error values`
55. `snapshot captures queued jobs and active job ID`
56. `restores queue with interrupted job reset to queued status`
57. `non-interrupted jobs in snapshot keep their original status`
58. `preserves history from currentState during restore`

### Suite 6: `RenderProgress.test.ts` (11 Test Cases)
59. `starts at 0% progress`
60. `start() returns initial snapshot`
61. `advanceToFrame computes progress percentage correctly`
62. `advanceToFrame clamps to [0, totalFrames]`
63. `step increments frame by delta`
64. `complete() sets progress to 100%`
65. `calculates renderingFps from elapsed time`
66. `calculates ETA from rendering FPS`
67. `falls back to targetFps ETA when no frames rendered yet`
68. `reset() returns tracker to 0`
69. `handles totalFrames=1 without division errors`

### Suite 7: `RenderQueue.test.ts` (14 Test Cases)
70. `createRenderQueueState returns empty immutable state`
71. `enqueueRenderJob adds a job with status queued`
72. `enqueueRenderJob does not mutate original state`
73. `job IDs are deterministic — no Math.random()`
74. `cancelRenderJob moves job to history with cancelled status`
75. `cancelRenderJob on unknown id returns unchanged state`
76. `retryRenderJob re-enqueues failed job with incremented retryCount`
77. `retryRenderJob does NOT re-enqueue when maxRetries exhausted`
78. `retry does not produce duplicate artifacts — new jobId assigned`
79. `reorderRenderJob moves job to target index`
80. `duplicateRenderJob adds a new queued job preserving config`
81. `clearCompletedRenderJobs removes completed/cancelled from history but keeps failed`
82. `updateJobProgressInQueue → rendering sets activeJobId`
83. `updateJobProgressInQueue → completed moves to history`

---

## 3. Reconciliation Log

During **S27-G5-C**, a source code audit verified that all 83 `it(...)` blocks in the 7 test files are active, valid, non-redundant test cases. 
- Historical mentions of 78 test cases resulted from earlier preliminary summaries that did not count all nested test cases.
- **Rule:** The canonical baseline is updated to **83 test cases**. No test logic or test cases were deleted, modified, or altered in the codebase.
