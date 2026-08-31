/**
 * G1-226: Data Integrity Re-Audit
 *
 * Validates data integrity across USER_DATA, ORDER_DATA, PRODUCT_DATA,
 * PAYMENT_DATA, and AUDIT_LOG. Detects corruption, orphaning,
 * and inconsistency, then suggests remediation.
 */

export type DataIntegrityStatus = 'VALID' | 'CORRUPTED' | 'ORPHANED' | 'INCONSISTENT';
export type DataType = 'USER_DATA' | 'ORDER_DATA' | 'PRODUCT_DATA' | 'PAYMENT_DATA' | 'AUDIT_LOG';

export interface DataIntegrityCheck {
  readonly checkId: string;
  readonly dataType: DataType;
  readonly integrityStatus: DataIntegrityStatus;
  readonly details: string;
}

export interface IntegrityReport {
  readonly totalChecks: number;
  readonly validCount: number;
  readonly corruptedCount: number;
  readonly orphanedCount: number;
  readonly inconsistentCount: number;
  readonly integrityScore: number;
  readonly checks: DataIntegrityCheck[];
  readonly recommendations: string[];
  readonly timestamp: number;
}

export interface DataInput {
  readonly dataType: DataType;
  readonly recordCount: number;
  readonly validRecords: number;
  readonly corruptedRecords: number;
  readonly orphanedRecords: number;
  readonly inconsistentRecords: number;
}

export class DataIntegrityReAuditor {
  private auditHistory: IntegrityReport[] = [];
  private checkCounter = 0;

  runIntegrityCheck(dataType: DataType, input: DataInput): DataIntegrityCheck {
    this.checkCounter++;

    if (input.corruptedRecords > 0) {
      return {
        checkId: `check-${this.checkCounter}-${Date.now()}`,
        dataType,
        integrityStatus: 'CORRUPTED',
        details: `${dataType}: ${input.corruptedRecords} of ${input.recordCount} records corrupted`,
      };
    }

    if (input.orphanedRecords > 0) {
      return {
        checkId: `check-${this.checkCounter}-${Date.now()}`,
        dataType,
        integrityStatus: 'ORPHANED',
        details: `${dataType}: ${input.orphanedRecords} orphaned records detected`,
      };
    }

    if (input.inconsistentRecords > 0) {
      return {
        checkId: `check-${this.checkCounter}-${Date.now()}`,
        dataType,
        integrityStatus: 'INCONSISTENT',
        details: `${dataType}: ${input.inconsistentRecords} inconsistent records found`,
      };
    }

    return {
      checkId: `check-${this.checkCounter}-${Date.now()}`,
      dataType,
      integrityStatus: 'VALID',
      details: `${dataType}: All ${input.recordCount} records passed integrity checks`,
    };
  }

  runFullIntegrityAudit(inputs: DataInput[]): DataIntegrityCheck[] {
    return inputs.map((input) => this.runIntegrityCheck(input.dataType, input));
  }

  getCorruptedRecords(checks: DataIntegrityCheck[]): DataIntegrityCheck[] {
    return checks.filter((c) => c.integrityStatus === 'CORRUPTED');
  }

  getOrphanedRecords(checks: DataIntegrityCheck[]): DataIntegrityCheck[] {
    return checks.filter((c) => c.integrityStatus === 'ORPHANED');
  }

  calculateIntegrityScore(checks: DataIntegrityCheck[]): number {
    if (checks.length === 0) return 100;
    const validCount = checks.filter((c) => c.integrityStatus === 'VALID').length;
    return Math.round((validCount / checks.length) * 100);
  }

  suggestRemediation(checks: DataIntegrityCheck[]): string[] {
    const suggestions: string[] = [];
    const corrupted = this.getCorruptedRecords(checks);
    const orphaned = this.getOrphanedRecords(checks);
    const inconsistent = checks.filter((c) => c.integrityStatus === 'INCONSISTENT');

    if (corrupted.length > 0) {
      suggestions.push(`Restore ${corrupted.length} corrupted records from backup and verify checksums`);
    }
    if (orphaned.length > 0) {
      suggestions.push(`Reassociate ${orphaned.length} orphaned records with parent entities or purge`);
    }
    if (inconsistent.length > 0) {
      suggestions.push(`Resolve ${inconsistent.length} inconsistent records via data reconciliation`);
    }
    if (suggestions.length === 0) {
      suggestions.push('No remediation needed — all data integrity checks passed');
    }
    return suggestions;
  }

  generateIntegrityReport(inputs: DataInput[]): IntegrityReport {
    const checks = this.runFullIntegrityAudit(inputs);
    const corruptedCount = this.getCorruptedRecords(checks).length;
    const orphanedCount = this.getOrphanedRecords(checks).length;
    const inconsistentCount = checks.filter((c) => c.integrityStatus === 'INCONSISTENT').length;
    const validCount = checks.filter((c) => c.integrityStatus === 'VALID').length;

    const report: IntegrityReport = {
      totalChecks: checks.length,
      validCount,
      corruptedCount,
      orphanedCount,
      inconsistentCount,
      integrityScore: this.calculateIntegrityScore(checks),
      checks,
      recommendations: this.suggestRemediation(checks),
      timestamp: Date.now(),
    };

    this.auditHistory.push(report);
    return report;
  }

  getAuditHistory(): IntegrityReport[] {
    return [...this.auditHistory];
  }
}
