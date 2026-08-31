/**
 * CrossTenantDataLeakageDetector — G1-202
 *
 * Detects data leakage incidents between tenants by scanning datasets,
 * query results, and record stores for cross-tenant contamination.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LeakageSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DataLeakageIncident {
  readonly incidentId: string;
  readonly sourceTenantId: string;
  readonly targetTenantId: string;
  readonly dataCategory: string;
  readonly severity: LeakageSeverity;
  readonly detectedAtMs: number;
  readonly resolvedAtMs?: number;
}

export interface TenantDataRecord {
  readonly tenantId: string;
  readonly recordId: string;
  readonly category: string;
  readonly payload: unknown;
}

export interface QueryResult {
  readonly tenantId: string;
  readonly queryId: string;
  readonly rows: unknown[];
}

export interface LeakageReport {
  readonly generatedAtMs: number;
  readonly totalIncidents: number;
  readonly activeIncidents: number;
  readonly resolvedIncidents: number;
  readonly incidents: DataLeakageIncident[];
  readonly summary: string;
}

// ---------------------------------------------------------------------------
// Cross-Tenant Data Leakage Detector
// ---------------------------------------------------------------------------

let incidentCounter = 0;

export class CrossTenantDataLeakageDetector {
  private incidents: DataLeakageIncident[] = [];

  scanForLeakage(tenantDataMap: Map<string, TenantDataRecord[]>): DataLeakageIncident[] {
    const detected: DataLeakageIncident[] = [];

    for (const [ownerTenantId, records] of tenantDataMap) {
      const cross = this.detectRecordLeakage(records, ownerTenantId);
      detected.push(...cross);
    }

    this.incidents.push(...detected);
    return detected;
  }

  detectRecordLeakage(sourceRecords: TenantDataRecord[], targetTenantId: string): DataLeakageIncident[] {
    const leaked = sourceRecords.filter(r => r.tenantId !== targetTenantId);
    const incidents: DataLeakageIncident[] = [];

    for (const record of leaked) {
      const incident: DataLeakageIncident = {
        incidentId: `inc-${++incidentCounter}`,
        sourceTenantId: record.tenantId,
        targetTenantId,
        dataCategory: record.category,
        severity: 'HIGH',
        detectedAtMs: Date.now(),
      };
      incidents.push(incident);
    }

    this.incidents.push(...incidents);
    return incidents;
  }

  detectQueryLeakage(queryResults: QueryResult[], expectedTenantId: string): DataLeakageIncident[] {
    const incidents: DataLeakageIncident[] = [];

    for (const result of queryResults) {
      if (result.tenantId !== expectedTenantId) {
        const incident: DataLeakageIncident = {
          incidentId: `inc-${++incidentCounter}`,
          sourceTenantId: expectedTenantId,
          targetTenantId: result.tenantId,
          dataCategory: 'query_result',
          severity: 'CRITICAL',
          detectedAtMs: Date.now(),
        };
        incidents.push(incident);
      }
    }

    this.incidents.push(...incidents);
    return incidents;
  }

  classifySeverity(incident: DataLeakageIncident): LeakageSeverity {
    if (incident.dataCategory === 'credentials' || incident.dataCategory === 'pii') {
      return 'CRITICAL';
    }
    if (incident.dataCategory === 'financial') {
      return 'HIGH';
    }
    if (incident.dataCategory === 'query_result') {
      return 'CRITICAL';
    }
    return incident.severity;
  }

  getActiveIncidents(): DataLeakageIncident[] {
    return this.incidents.filter(i => i.resolvedAtMs === undefined);
  }

  resolveIncident(incidentId: string): boolean {
    const incident = this.incidents.find(i => i.incidentId === incidentId);
    if (!incident || incident.resolvedAtMs !== undefined) return false;
    (incident as { resolvedAtMs: number }).resolvedAtMs = Date.now();
    return true;
  }

  generateLeakageReport(): LeakageReport {
    const active = this.getActiveIncidents();
    const resolved = this.incidents.filter(i => i.resolvedAtMs !== undefined);

    return {
      generatedAtMs: Date.now(),
      totalIncidents: this.incidents.length,
      activeIncidents: active.length,
      resolvedIncidents: resolved.length,
      incidents: [...this.incidents],
      summary:
        active.length === 0
          ? 'No active leakage incidents'
          : `${active.length} active incident(s) out of ${this.incidents.length} total`,
    };
  }
}
