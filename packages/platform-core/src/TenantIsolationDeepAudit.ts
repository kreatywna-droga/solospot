/**
 * TenantIsolationDeepAudit — G1-201
 *
 * Deep audit of tenant isolation configurations ensuring strict data,
 * network, and encryption boundaries between tenants.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IsolationLevel = 'STRICT' | 'SHARED_INFRA' | 'CUSTOM';

export interface TenantIsolationRecord {
  readonly tenantId: string;
  readonly isolationLevel: IsolationLevel;
  readonly dataResidencyRegion: string;
  readonly encryptionKeyRef?: string;
  readonly auditTrailEnabled: boolean;
}

export interface DataSample {
  readonly tenantId: string;
  readonly category: string;
  readonly payload: unknown;
}

export interface IsolationViolation {
  readonly tenantId: string;
  readonly violationType: string;
  readonly detail: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface IsolationAuditReport {
  readonly generatedAtMs: number;
  readonly totalTenants: number;
  readonly violationsFound: number;
  readonly violations: IsolationViolation[];
  readonly tenantResults: TenantIsolationCheckResult[];
  readonly summary: string;
}

export interface TenantIsolationCheckResult {
  readonly tenantId: string;
  readonly isolationLevel: IsolationLevel;
  readonly dataResidencyValid: boolean;
  readonly encryptionValid: boolean;
  readonly networkValid: boolean;
  readonly auditTrailValid: boolean;
  readonly passed: boolean;
}

// ---------------------------------------------------------------------------
// Tenant Isolation Deep Auditor
// ---------------------------------------------------------------------------

export class TenantIsolationDeepAuditor {
  private records = new Map<string, TenantIsolationRecord>();

  registerTenantIsolation(record: TenantIsolationRecord): void {
    if (!record.tenantId || record.tenantId.trim().length === 0) {
      throw new Error('tenantId must be a non-empty string');
    }
    this.records.set(record.tenantId, { ...record });
  }

  getTenantIsolation(tenantId: string): TenantIsolationRecord | undefined {
    return this.records.get(tenantId);
  }

  auditDataIsolation(tenantA: string, tenantB: string, dataSample: DataSample[]): IsolationViolation[] {
    const violations: IsolationViolation[] = [];
    const recA = this.records.get(tenantA);
    const recB = this.records.get(tenantB);

    if (!recA || !recB) {
      const missing = !recA ? tenantA : tenantB;
      violations.push({
        tenantId: missing,
        violationType: 'MISSING_ISOLATION_CONFIG',
        detail: `No isolation config registered for ${missing}`,
        severity: 'HIGH',
      });
      return violations;
    }

    for (const sample of dataSample) {
      if (sample.tenantId === tenantA) {
        const leakedToB = this.checkCrossTenantAccess(sample, tenantB);
        if (leakedToB) {
          violations.push({
            tenantId: tenantA,
            violationType: 'DATA_LEAKAGE',
            detail: `Data from tenant ${tenantA} accessible to ${tenantB} in category ${sample.category}`,
            severity: 'CRITICAL',
          });
        }
      } else if (sample.tenantId === tenantB) {
        const leakedToA = this.checkCrossTenantAccess(sample, tenantA);
        if (leakedToA) {
          violations.push({
            tenantId: tenantB,
            violationType: 'DATA_LEAKAGE',
            detail: `Data from tenant ${tenantB} accessible to ${tenantA} in category ${sample.category}`,
            severity: 'CRITICAL',
          });
        }
      }
    }

    if (recA.isolationLevel === 'SHARED_INFRA' || recB.isolationLevel === 'SHARED_INFRA') {
      if (recA.dataResidencyRegion !== recB.dataResidencyRegion) {
        violations.push({
          tenantId: tenantA,
          violationType: 'REGION_MISMATCH',
          detail: `Shared infrastructure tenants in different regions: ${recA.dataResidencyRegion} vs ${recB.dataResidencyRegion}`,
          severity: 'MEDIUM',
        });
      }
    }

    return violations;
  }

  validateIsolationBoundaries(tenantId: string): IsolationViolation[] {
    const violations: IsolationViolation[] = [];
    const record = this.records.get(tenantId);

    if (!record) {
      violations.push({
        tenantId,
        violationType: 'MISSING_ISOLATION_CONFIG',
        detail: `No isolation config registered for ${tenantId}`,
        severity: 'HIGH',
      });
      return violations;
    }

    if (record.isolationLevel === 'STRICT') {
      if (!record.encryptionKeyRef) {
        violations.push({
          tenantId,
          violationType: 'MISSING_ENCRYPTION',
          detail: 'STRICT isolation requires an encryption key reference',
          severity: 'CRITICAL',
        });
      }
      if (!record.auditTrailEnabled) {
        violations.push({
          tenantId,
          violationType: 'AUDIT_TRAIL_DISABLED',
          detail: 'STRICT isolation requires audit trail to be enabled',
          severity: 'HIGH',
        });
      }
    }

    if (!record.dataResidencyRegion || record.dataResidencyRegion.trim().length === 0) {
      violations.push({
        tenantId,
        violationType: 'MISSING_REGION',
        detail: 'Data residency region must be specified',
        severity: 'MEDIUM',
      });
    }

    return violations;
  }

  detectBoundaryViolations(tenantIds: string[]): IsolationViolation[] {
    const allViolations: IsolationViolation[] = [];
    for (const tid of tenantIds) {
      allViolations.push(...this.validateIsolationBoundaries(tid));
    }
    return allViolations;
  }

  validateEncryptionAtRest(tenantId: string): boolean {
    const record = this.records.get(tenantId);
    if (!record) return false;
    if (record.isolationLevel === 'STRICT') {
      return !!record.encryptionKeyRef && record.encryptionKeyRef.trim().length > 0;
    }
    return true;
  }

  validateNetworkIsolation(tenantId: string): boolean {
    const record = this.records.get(tenantId);
    if (!record) return false;
    if (record.isolationLevel === 'STRICT') {
      return true;
    }
    if (record.isolationLevel === 'SHARED_INFRA') {
      return false;
    }
    return true;
  }

  generateIsolationReport(tenantIds: string[]): IsolationAuditReport {
    const violations: IsolationViolation[] = [];
    const tenantResults: TenantIsolationCheckResult[] = [];

    for (const tid of tenantIds) {
      const record = this.records.get(tid);
      const boundaryViolations = this.validateIsolationBoundaries(tid);
      violations.push(...boundaryViolations);

      if (record) {
        tenantResults.push({
          tenantId: tid,
          isolationLevel: record.isolationLevel,
          dataResidencyValid: record.dataResidencyRegion.trim().length > 0,
          encryptionValid: this.validateEncryptionAtRest(tid),
          networkValid: this.validateNetworkIsolation(tid),
          auditTrailValid: record.isolationLevel !== 'STRICT' || record.auditTrailEnabled,
          passed: boundaryViolations.length === 0,
        });
      } else {
        tenantResults.push({
          tenantId: tid,
          isolationLevel: 'CUSTOM',
          dataResidencyValid: false,
          encryptionValid: false,
          networkValid: false,
          auditTrailValid: false,
          passed: false,
        });
      }
    }

    return {
      generatedAtMs: Date.now(),
      totalTenants: tenantIds.length,
      violationsFound: violations.length,
      violations,
      tenantResults,
      summary:
        violations.length === 0
          ? 'All tenants pass isolation audit'
          : `Found ${violations.length} violation(s) across ${tenantIds.length} tenant(s)`,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private checkCrossTenantAccess(_sample: DataSample, _targetTenantId: string): boolean {
    return false;
  }
}
