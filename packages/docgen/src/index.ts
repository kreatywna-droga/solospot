// Extractor API
export { ApiExtractor } from './extractor/ApiExtractor';
export type {
  ExtractedProperty,
  ExtractedInterface,
  ExtractedType,
  ExtractedEnumMember,
  ExtractedEnum,
  ExtractedClass,
  ExtractedFunction,
  ExtractedApiModule,
} from './extractor/ApiExtractor';

// Markdown Generator API
export { MarkdownGenerator } from './markdown/MarkdownGenerator';

// Analyzer API
export { DependencyAnalyzer } from './analyzer/DependencyAnalyzer';
export type {
  CircularDependencyCycle,
  DependencyAnalysisReport,
} from './analyzer/DependencyAnalyzer';

// CLI API
export { DocgenCLI } from './cli/DocgenCLI';
export type { CLICommand, CLIParseResult } from './cli/DocgenCLI';
