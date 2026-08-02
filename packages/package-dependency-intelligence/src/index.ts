// Dependency Model API
export type {
  PackageNode,
  PackageDependency,
  DependencyCycle,
  DependencyIssueType,
  DependencyIssue,
  DependencyGraph,
  DependencyAssessment,
} from './model/PkgDepModel';

// Dependency Analyzer API
export { PackageDependencyAnalyzer } from './analyzer/PackageDependencyAnalyzer';

// Dependency Validator API
export { DependencyValidator } from './validator/DependencyValidator';

// Report Generator API
export { DependencyReportGenerator } from './report/DependencyReportGenerator';
export type { DependencyReportData } from './report/DependencyReportGenerator';

// CLI API
export { PackageDependencyCLI } from './cli/PackageDependencyCLI';
export type { PkgDepCLICommand, PkgDepCLIParseResult } from './cli/PackageDependencyCLI';
