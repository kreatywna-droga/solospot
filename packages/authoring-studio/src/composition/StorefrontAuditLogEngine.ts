/**
 * StorefrontAuditLogEngine.ts — Sprint G1-101 Enterprise Governance Audit Log Engine (Night Shift Level 63)
 *
 * Provides pure TypeScript, headless audit trail logging for enterprise governance and compliance.
 * Tracks who changed what, when, tenant scope, resource type, action, and before/after metadata state snapshots.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY';

export interface AuditLogEntryDTO {
  readonly logId: string;
  readonly tenantId: string;
  readonly actorUserId: string;
  readonly actorRole?: string;
  readonly actorIpBoundary?: string;
  readonly resourceType: string; // e.g. 'PRODUCT', 'ORDER', 'SETTINGS', 'USER_ROLE'
  readonly resourceId: string;
  readonly action: string; // e.g. 'CREATE', 'UPDATE', 'DELETE', 'ROLE_CHANGE', 'REFUND'
  readonly severity: AuditSeverity;
  readonly beforeStateJson?: string;
  readonly afterStateJson?: string;
  readonly metadataJson?: string;
  readonly timestampMs: number;
}

export interface AuditLogQueryFilterDTO {
  readonly actorUserId?: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
  readonly action?: string;
  readonly severity?: AuditSeverity;
  readonly fromTimestampMs?: number;
  readonly toTimestampMs?: number;
  readonly limit?: number;
}

export interface AuditLogEngineStateDTO {
  readonly tenantId: string;
  readonly logs: Record<string, AuditLogEntryDTO>;
}

export class StorefrontAuditLogEngine {
  private readonly tenantId: string;
  private logs: Map<string, AuditLogEntryDTO> = new Map(); // logId -> AuditLogEntryDTO

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Records an immutable audit log entry.
   */
  public recordLog(params: {
    actorUserId: string;
    actorRole?: string;
    actorIpBoundary?: string;
    resourceType: string;
    resourceId: string;
    action: string;
    severity?: AuditSeverity;
    beforeStateJson?: string;
    afterStateJson?: string;
    metadataJson?: string;
  }): AuditLogEntryDTO {
    const { actorUserId, resourceType, resourceId, action } = params;

    if (!actorUserId || !resourceType || !resourceId || !action) {
      throw new Error('Invalid audit log entry: actorUserId, resourceType, resourceId, and action are required');
    }

    const now = Date.now();
    const logId = `audit_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const severity = params.severity || 'INFO';

    const entry: AuditLogEntryDTO = {
      logId,
      tenantId: this.tenantId,
      actorUserId: actorUserId.trim(),
      actorRole: params.actorRole?.trim(),
      actorIpBoundary: params.actorIpBoundary?.trim(),
      resourceType: resourceType.trim().toUpperCase(),
      resourceId: resourceId.trim(),
      action: action.trim().toUpperCase(),
      severity,
      beforeStateJson: params.beforeStateJson,
      afterStateJson: params.afterStateJson,
      metadataJson: params.metadataJson,
      timestampMs: now
    };

    this.logs.set(logId, entry);
    return entry;
  }

  /**
   * Queries audit log history with filter constraints.
   */
  public queryLogs(filter?: AuditLogQueryFilterDTO): ReadonlyArray<AuditLogEntryDTO> {
    let results = Array.from(this.logs.values());

    if (!filter) {
      return results.sort((a, b) => b.timestampMs - a.timestampMs);
    }

    if (filter.actorUserId) {
      results = results.filter(l => l.actorUserId === filter.actorUserId);
    }
    if (filter.resourceType) {
      const targetRes = filter.resourceType.toUpperCase();
      results = results.filter(l => l.resourceType === targetRes);
    }
    if (filter.resourceId) {
      results = results.filter(l => l.resourceId === filter.resourceId);
    }
    if (filter.action) {
      const targetAction = filter.action.toUpperCase();
      results = results.filter(l => l.action === targetAction);
    }
    if (filter.severity) {
      results = results.filter(l => l.severity === filter.severity);
    }
    if (filter.fromTimestampMs !== undefined) {
      results = results.filter(l => l.timestampMs >= filter.fromTimestampMs!);
    }
    if (filter.toTimestampMs !== undefined) {
      results = results.filter(l => l.timestampMs <= filter.toTimestampMs!);
    }

    results.sort((a, b) => b.timestampMs - a.timestampMs);

    if (filter.limit !== undefined && filter.limit > 0) {
      return results.slice(0, filter.limit);
    }

    return results;
  }

  public getLog(logId: string): AuditLogEntryDTO | undefined {
    return this.logs.get(logId);
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): AuditLogEngineStateDTO {
    const record: Record<string, AuditLogEntryDTO> = {};
    this.logs.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      logs: record
    };
  }

  public importState(state: AuditLogEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.logs.clear();
    Object.entries(state.logs || {}).forEach(([k, v]) => {
      this.logs.set(k, v);
    });
  }
}
