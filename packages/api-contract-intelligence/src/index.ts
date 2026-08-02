// Contract Model API
export type {
  ContractParameter,
  ContractResponse,
  ContractMethod,
  ContractInterface,
  ContractVersion,
  ContractMetadata,
  APIContract,
} from './model/ContractModel';

// Contract Analyzer API
export { ContractAnalyzer } from './analyzer/ContractAnalyzer';
export type { BreakingChangeType, BreakingChange } from './analyzer/ContractAnalyzer';

// Compatibility Validator API
export { CompatibilityValidator } from './validator/CompatibilityValidator';
export type { CompatibilityValidationResult } from './validator/CompatibilityValidator';

// Report Generator API
export { ContractReportGenerator } from './report/ContractReportGenerator';
export type { ContractReportData } from './report/ContractReportGenerator';

// CLI API
export { APIContractCLI } from './cli/APIContractCLI';
export type { ContractCLICommand, ContractCLIParseResult } from './cli/APIContractCLI';
