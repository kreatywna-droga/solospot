// Architecture Rules API
export { DEFAULT_RULES } from './rules/ArchitectureRules';
export type {
  RuleCategory,
  RuleSeverity,
  ArchitectureRule,
  RuleViolation,
  ArchitectureValidationResult,
} from './rules/ArchitectureRules';

// Dependency Validator API
export { DependencyValidator } from './dependencies/DependencyValidator';

// Structure Validator API
export { StructureValidator } from './structure/StructureValidator';

// Report Generator API
export { ArchitectureReportGenerator } from './report/ArchitectureReportGenerator';

// CLI API
export { ArchitectureValidatorCLI } from './cli/ArchitectureValidatorCLI';
export type { ArchCLICommand, ArchCLIParseResult } from './cli/ArchitectureValidatorCLI';
