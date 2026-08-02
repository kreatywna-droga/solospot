import { APIContract } from '../model/ContractModel';
import { ContractAnalyzer, BreakingChange } from '../analyzer/ContractAnalyzer';

export interface CompatibilityValidationResult {
  isCompatible: boolean;
  errors: string[];
  warnings: string[];
  breakingChanges: BreakingChange[];
}

export class CompatibilityValidator {
  public static validateBackwardCompatibility(
    baseContract: APIContract,
    candidateContract: APIContract
  ): CompatibilityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const breakingChanges = ContractAnalyzer.detectBreakingChanges(baseContract, candidateContract);

    if (breakingChanges.length > 0) {
      for (const bc of breakingChanges) {
        if (bc.severity === 'critical') {
          errors.push(`Critical breaking change in ${bc.interfaceName}: ${bc.description}`);
        } else {
          warnings.push(`Warning breaking change in ${bc.interfaceName}: ${bc.description}`);
        }
      }
    }

    return {
      isCompatible: errors.length === 0,
      errors,
      warnings,
      breakingChanges,
    };
  }
}
