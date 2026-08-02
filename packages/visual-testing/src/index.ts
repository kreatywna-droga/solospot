// Snapshot Engine API
export { VisualSnapshotEngine } from './snapshot/VisualSnapshotEngine';
export type {
  ViewportSize,
  VisualSnapshotMetadata,
  VisualSnapshot,
} from './snapshot/VisualSnapshotEngine';

// Diff Engine API
export { VisualDiffEngine } from './diff/VisualDiffEngine';
export type {
  ChangeSeverity,
  VisualDiffDetail,
  VisualDiffResult,
} from './diff/VisualDiffEngine';

// Report Generator API
export { VisualReportGenerator } from './report/VisualReportGenerator';
export type { VisualTestExecutionReport } from './report/VisualReportGenerator';

// CLI API
export { VisualTestCLI } from './cli/VisualTestCLI';
export type { VisualCLICommand, VisualCLIParseResult } from './cli/VisualTestCLI';
