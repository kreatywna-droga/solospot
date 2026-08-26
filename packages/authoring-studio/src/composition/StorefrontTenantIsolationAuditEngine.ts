/**
 * StorefrontTenantIsolationAuditEngine.ts — Sprint G1-108 Multi-Tenant Isolation & Security Audit Engine (Night Shift Level 70)
 *
 * Provides pure TypeScript, headless multi-tenant security boundary auditing, cross-tenant access prevention,
 * resource ownership verification, and strict fail-closed security enforcement.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type IsolationViolationType =
  | 'CROSS_TENANT_READ_ATTEMPT'
  | 'CROSS_TENANT_MUTATION_ATTEMPT'
  | 'MISSING_TENANT_CONTEXT'
  | 'TENANT_HEADER_PAYLOAD_MISMATCH';

export interface TenantBoundaryAuditResultDTO {
  readonly valid: boolean;
  readonly requestingTenantId: string;
  readonly resourceOwnerTenantId: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly violationType?: IsolationViolationType;
  readonly failClosedTriggered: boolean;
  readonly auditTimestampMs: number;
}

export interface TenantIsolationReportDTO {
  readonly auditedTenantId: string;
  readonly totalAccessAttempts: number;
  readonly totalValidAttempts: number;
  readonly totalViolationsBlocked: number;
  readonly isolationStatus: 'SECURE_TENANT_ISOLATION' | 'ISOLATION_BREACH_PREVENTED';
  readonly violations: ReadonlyArray<TenantBoundaryAuditResultDTO>;
  readonly auditedAtMs: number;
}

export interface TenantIsolationEngineStateDTO {
  readonly masterTenantId: string;
  readonly auditHistory: Record<string, TenantBoundaryAuditResultDTO>;
}

export class StorefrontTenantIsolationAuditEngine {
  private readonly masterTenantId: string;
  private auditHistory: Map<string, TenantBoundaryAuditResultDTO> = new Map();

  constructor(masterTenantId = 'system_root_tenant') {
    this.masterTenantId = masterTenantId;
  }

  /**
   * Verifies that the requesting tenant strictly owns the target resource before access or mutation.
   * Enforces fail-closed behavior if tenant IDs do not match.
   */
  public verifyResourceOwnership(params: {
    requestingTenantId: string;
    resourceOwnerTenantId: string;
    resourceType: string;
    resourceId: string;
    isMutation?: boolean;
  }): TenantBoundaryAuditResultDTO {
    const { requestingTenantId, resourceOwnerTenantId, resourceType, resourceId } = params;

    const now = Date.now();
    const isMutation = params.isMutation ?? false;

    if (!requestingTenantId || !resourceOwnerTenantId) {
      const result: TenantBoundaryAuditResultDTO = {
        valid: false,
        requestingTenantId: requestingTenantId || 'UNSPECIFIED',
        resourceOwnerTenantId: resourceOwnerTenantId || 'UNSPECIFIED',
        resourceType: resourceType || 'UNKNOWN',
        resourceId: resourceId || 'UNKNOWN',
        violationType: 'MISSING_TENANT_CONTEXT',
        failClosedTriggered: true,
        auditTimestampMs: now
      };
      this.recordAuditResult(result);
      return result;
    }

    const reqTenant = requestingTenantId.trim();
    const ownerTenant = resourceOwnerTenantId.trim();

    if (reqTenant !== ownerTenant && reqTenant !== this.masterTenantId) {
      const violationType: IsolationViolationType = isMutation
        ? 'CROSS_TENANT_MUTATION_ATTEMPT'
        : 'CROSS_TENANT_READ_ATTEMPT';

      const result: TenantBoundaryAuditResultDTO = {
        valid: false,
        requestingTenantId: reqTenant,
        resourceOwnerTenantId: ownerTenant,
        resourceType: resourceType.trim().toUpperCase(),
        resourceId: resourceId.trim(),
        violationType,
        failClosedTriggered: true,
        auditTimestampMs: now
      };

      this.recordAuditResult(result);
      return result;
    }

    const validResult: TenantBoundaryAuditResultDTO = {
      valid: true,
      requestingTenantId: reqTenant,
      resourceOwnerTenantId: ownerTenant,
      resourceType: resourceType.trim().toUpperCase(),
      resourceId: resourceId.trim(),
      failClosedTriggered: false,
      auditTimestampMs: now
    };

    this.recordAuditResult(validResult);
    return validResult;
  }

  /**
   * Generates a multi-tenant isolation compliance report for a specific tenant scope.
   */
  public generateIsolationReport(tenantId: string): TenantIsolationReportDTO {
    const audits = Array.from(this.auditHistory.values()).filter(a => a.requestingTenantId === tenantId);
    const violations = audits.filter(a => !a.valid);

    return {
      auditedTenantId: tenantId,
      totalAccessAttempts: audits.length,
      totalValidAttempts: audits.length - violations.length,
      totalViolationsBlocked: violations.length,
      isolationStatus: violations.length === 0 ? 'SECURE_TENANT_ISOLATION' : 'ISOLATION_BREACH_PREVENTED',
      violations,
      auditedAtMs: Date.now()
    };
  }

  private recordAuditResult(result: TenantBoundaryAuditResultDTO): void {
    const auditId = `audit_iso_${result.auditTimestampMs}_${Math.random().toString(36).substring(2, 7)}`;
    this.auditHistory.set(auditId, result);
  }

  public getMasterTenantId(): string {
    return this.masterTenantId;
  }

  public exportState(): TenantIsolationEngineStateDTO {
    const record: Record<string, TenantBoundaryAuditResultDTO> = {};
    this.auditHistory.forEach((val, key) => {
      record[key] = val;
    });

    return {
      masterTenantId: this.masterTenantId,
      auditHistory: record
    };
  }

  public importState(state: TenantIsolationEngineStateDTO): void {
    if (!state || state.masterTenantId !== this.masterTenantId) {
      throw new Error('State masterTenantId mismatch during import');
    }
    this.auditHistory.clear();
    Object.entries(state.auditHistory || {}).forEach(([k, v]) => {
      this.auditHistory.set(k, v);
    });
  }
}
