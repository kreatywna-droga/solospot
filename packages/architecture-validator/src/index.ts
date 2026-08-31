// Architecture Rules API
//
// @deprecated This package is DEPRECATED as of G1-288 (ETAP 10).
// Use `architecture-compliance-intelligence` instead, which is the canonical
// analyzer with 50+ rules. The cycle detection in `DependencyValidator.checkCycles`
// is duplicated by `runtime-composition/PackageResolver.resolve()`.
// This package is scheduled for REMOVAL in a future ETAP.
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
