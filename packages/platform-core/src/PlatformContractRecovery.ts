/**
 * PlatformContractRecovery — G1-189
 *
 * Detects and resolves platform contract inconsistencies,
 * providing automatic resolution for low-severity issues
 * and escalation for critical ones.
 */

// ---------------------------------------------------------------------------
// Contract Types
// ---------------------------------------------------------------------------

export type InconsistencySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ResolutionStatus = 'PENDING' | 'AUTO_RESOLVED' | 'ESCALATED' | 'MANUALLY_RESOLVED';
export type ResolutionStrategy = 'AUTO_FILL_DEFAULT' | 'REMOVE_OPTIONAL' | 'ESCALATE' | 'MANUAL';

export interface ContractField {
  readonly fieldName: string;
  readonly expectedType: string;
  readonly actualType?: string;
  readonly present: boolean;
  readonly required: boolean;
}

export interface ContractRegistryEntry {
  readonly contractName: string;
  readonly fields: ContractField[];
  readonly version: string;
}

export interface ContractInconsistency {
  readonly inconsistencyId: string;
  readonly contractName: string;
  readonly severity: InconsistencySeverity;
  readonly description: string;
  readonly detectedAtMs: number;
  readonly resolvedAtMs?: number;
  readonly resolutionStrategy?: ResolutionStrategy;
}

export interface RecoveryStatusSummary {
  readonly totalInconsistencies: number;
  readonly pending: number;
  readonly autoResolved: number;
  readonly escalated: number;
  readonly manuallyResolved: number;
  readonly bySeverity: Record<InconsistencySeverity, number>;
}

export interface RecoveryReport {
  readonly generatedAtMs: number;
  readonly summary: RecoveryStatusSummary;
  readonly inconsistencies: ContractInconsistency[];
  readonly recommendations: string[];
}

// ---------------------------------------------------------------------------
// Platform Contract Recovery
// ---------------------------------------------------------------------------

export class PlatformContractRecovery {
  private inconsistencyCounter = 0;
  private inconsistencies: ContractInconsistency[] = [];

  /**
   * Scans a contract registry for missing fields and type mismatches.
   */
  detectInconsistencies(contractRegistry: ContractRegistryEntry[]): ContractInconsistency[] {
    const detected: ContractInconsistency[] = [];

    for (const entry of contractRegistry) {
      for (const field of entry.fields) {
        if (!field.present && field.required) {
          detected.push(
            this.createInconsistency(
              entry.contractName,
              'CRITICAL',
              `Required field "${field.fieldName}" is missing`,
            ),
          );
        } else if (!field.present && !field.required) {
          detected.push(
            this.createInconsistency(
              entry.contractName,
              'LOW',
              `Optional field "${field.fieldName}" is missing`,
            ),
          );
        } else if (field.actualType && field.actualType !== field.expectedType) {
          const sev = this.classifyTypeMismatchSeverity(field);
          detected.push(
            this.createInconsistency(
              entry.contractName,
              sev,
              `Field "${field.fieldName}" type mismatch: expected "${field.expectedType}", got "${field.actualType}"`,
            ),
          );
        }
      }
    }

    this.inconsistencies.push(...detected);
    return detected;
  }

  /**
   * Classifies an inconsistency based on its impact.
   */
  classifyInconsistency(inconsistency: ContractInconsistency): ContractInconsistency {
    const updated = { ...inconsistency };
    if (updated.severity === 'CRITICAL') return updated;
    if (updated.description.includes('required')) updated.severity = 'HIGH';
    return updated;
  }

  /**
   * Attempts automatic resolution for LOW-severity inconsistencies.
   */
  autoResolve(inconsistency: ContractInconsistency): ContractInconsistency {
    if (inconsistency.severity !== 'LOW') {
      return inconsistency;
    }
    const resolved: ContractInconsistency = {
      ...inconsistency,
      resolvedAtMs: Date.now(),
      resolutionStrategy: 'AUTO_FILL_DEFAULT',
    };
    this.replaceInconsistency(resolved);
    return resolved;
  }

  /**
   * Escalates an inconsistency for manual resolution.
   */
  escalate(inconsistency: ContractInconsistency): ContractInconsistency {
    const escalated: ContractInconsistency = {
      ...inconsistency,
      severity: inconsistency.severity === 'LOW' ? 'MEDIUM' : inconsistency.severity,
      resolutionStrategy: 'ESCALATE',
    };
    this.replaceInconsistency(escalated);
    return escalated;
  }

  /**
   * Returns a summary of all inconsistencies and resolutions.
   */
  getRecoveryStatus(): RecoveryStatusSummary {
    const bySeverity: Record<InconsistencySeverity, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    let pending = 0;
    let autoResolved = 0;
    let escalated = 0;
    let manuallyResolved = 0;

    for (const inc of this.inconsistencies) {
      bySeverity[inc.severity]++;
      if (inc.resolvedAtMs) {
        if (inc.resolutionStrategy === 'AUTO_FILL_DEFAULT') autoResolved++;
        else if (inc.resolutionStrategy === 'ESCALATE') escalated++;
        else if (inc.resolutionStrategy === 'MANUAL') manuallyResolved++;
        else autoResolved++;
      } else {
        pending++;
      }
    }

    return {
      totalInconsistencies: this.inconsistencies.length,
      pending,
      autoResolved,
      escalated,
      manuallyResolved,
      bySeverity,
    };
  }

  /**
   * Returns the full history of all inconsistencies.
   */
  getInconsistencyHistory(): ContractInconsistency[] {
    return [...this.inconsistencies];
  }

  /**
   * Generates a comprehensive recovery report.
   */
  generateRecoveryReport(): RecoveryReport {
    const summary = this.getRecoveryStatus();
    const recommendations: string[] = [];

    if (summary.bySeverity.CRITICAL > 0) {
      recommendations.push(
        `Address ${summary.bySeverity.CRITICAL} CRITICAL inconsistency(ies) immediately`,
      );
    }
    if (summary.bySeverity.HIGH > 0) {
      recommendations.push(
        `Schedule resolution for ${summary.bySeverity.HIGH} HIGH severity issue(s)`,
      );
    }
    if (summary.pending > 0) {
      recommendations.push(`${summary.pending} inconsistency(ies) still pending resolution`);
    }
    if (summary.autoResolved > 0) {
      recommendations.push(`${summary.autoResolved} issue(s) auto-resolved successfully`);
    }
    if (recommendations.length === 0) {
      recommendations.push('All inconsistencies have been resolved');
    }

    return {
      generatedAtMs: Date.now(),
      summary,
      inconsistencies: [...this.inconsistencies],
      recommendations,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private createInconsistency(
    contractName: string,
    severity: InconsistencySeverity,
    description: string,
  ): ContractInconsistency {
    return {
      inconsistencyId: `inc-${++this.inconsistencyCounter}`,
      contractName,
      severity,
      description,
      detectedAtMs: Date.now(),
    };
  }

  private classifyTypeMismatchSeverity(field: ContractField): InconsistencySeverity {
    if (field.required) return 'HIGH';
    return 'MEDIUM';
  }

  private replaceInconsistency(updated: ContractInconsistency): void {
    const idx = this.inconsistencies.findIndex(
      i => i.inconsistencyId === updated.inconsistencyId,
    );
    if (idx !== -1) {
      this.inconsistencies[idx] = updated;
    }
  }
}
