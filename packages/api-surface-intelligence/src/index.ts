// ---------------------------------------------------------------------------
// API Surface Model — data contracts
// ---------------------------------------------------------------------------
export type {
  ApiSeverity,
  ApiIssueType,
  ApiChangeKind,
  ApiExport,
  ApiSurface,
  ApiContract,
  ApiChange,
  ApiIssue,
  ApiAssessment,
  ApiReport,
} from './model/ApiSurfaceModel';

// ---------------------------------------------------------------------------
// API Surface Analyzer
// ---------------------------------------------------------------------------
export { ApiSurfaceAnalyzer } from './analyzer/ApiSurfaceAnalyzer';

// ---------------------------------------------------------------------------
// API Surface Validator
// ---------------------------------------------------------------------------
export { ApiSurfaceValidator } from './validator/ApiSurfaceValidator';
export type { ApiMetric } from './validator/ApiSurfaceValidator';

// ---------------------------------------------------------------------------
// API Surface Report Generator
// ---------------------------------------------------------------------------
export { ApiSurfaceReportGenerator } from './report/ApiSurfaceReportGenerator';
export type { ApiReportData } from './report/ApiSurfaceReportGenerator';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
export { ApiSurfaceCLI } from './cli/ApiSurfaceCLI';
export type {
  ApiSurfaceCLICommand,
  ApiSurfaceCLIFormat,
  ApiSurfaceCLIParseResult,
} from './cli/ApiSurfaceCLI';
