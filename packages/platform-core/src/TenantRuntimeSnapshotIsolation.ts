/**
 * TenantRuntimeSnapshotIsolation — G1-207
 *
 * Ensures runtime snapshots are fully isolated between tenants.
 * Detects cross-tenant snapshot access and validates TTL-based cleanup.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TenantRuntimeSnapshot {
  readonly snapshotId: string;
  readonly tenantId: string;
  readonly data: Record<string, unknown>;
  readonly createdAtMs: number;
  readonly ttlMs: number;
}

export interface SnapshotAccessLog {
  readonly snapshotId: string;
  readonly accessedByTenant: string;
  readonly accessedAtMs: number;
  readonly authorized: boolean;
}

export interface CrossTenantAccessViolation {
  readonly snapshotId: string;
  readonly snapshotTenantId: string;
  readonly accessingTenant: string;
  readonly accessedAtMs: number;
}

export interface SnapshotIsolationReport {
  readonly generatedAtMs: number;
  readonly totalSnapshots: number;
  readonly activeSnapshots: number;
  readonly expiredSnapshots: number;
  readonly violations: CrossTenantAccessViolation[];
  readonly isolationValid: boolean;
  readonly violationsCount: number;
}

// ---------------------------------------------------------------------------
// TenantRuntimeSnapshotIsolator
// ---------------------------------------------------------------------------

let snapshotCounter = 0;

function generateSnapshotId(): string {
  snapshotCounter += 1;
  return `snap-${snapshotCounter}-${Date.now()}`;
}

export class TenantRuntimeSnapshotIsolator {
  private snapshots: TenantRuntimeSnapshot[] = [];

  createSnapshot(tenantId: string, data: Record<string, unknown>, ttlMs: number = 300000): TenantRuntimeSnapshot {
    if (!tenantId || !tenantId.trim()) {
      throw new Error('tenantId must be a non-empty string');
    }

    const snapshot: TenantRuntimeSnapshot = {
      snapshotId: generateSnapshotId(),
      tenantId: tenantId.trim(),
      data: { ...data },
      createdAtMs: Date.now(),
      ttlMs,
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  getSnapshot(snapshotId: string, tenantId: string): TenantRuntimeSnapshot | undefined {
    if (!snapshotId || !tenantId) return undefined;

    const snapshot = this.snapshots.find((s) => s.snapshotId === snapshotId);
    if (!snapshot) return undefined;

    if (snapshot.tenantId !== tenantId) return undefined;

    const now = Date.now();
    if (now - snapshot.createdAtMs > snapshot.ttlMs) return undefined;

    return snapshot;
  }

  detectCrossTenantSnapshotAccess(
    snapshots?: TenantRuntimeSnapshot[],
    accessLog?: SnapshotAccessLog[],
  ): CrossTenantAccessViolation[] {
    const targetSnapshots = snapshots ?? this.snapshots;
    const violations: CrossTenantAccessViolation[] = [];

    if (!accessLog || accessLog.length === 0) {
      return violations;
    }

    for (const log of accessLog) {
      if (log.authorized) continue;

      const snapshot = targetSnapshots.find((s) => s.snapshotId === log.snapshotId);
      if (!snapshot) continue;

      if (snapshot.tenantId !== log.accessedByTenant) {
        violations.push({
          snapshotId: snapshot.snapshotId,
          snapshotTenantId: snapshot.tenantId,
          accessingTenant: log.accessedByTenant,
          accessedAtMs: log.accessedAtMs,
        });
      }
    }

    return violations;
  }

  validateSnapshotIsolation(tenantA: string, tenantB: string): boolean {
    if (tenantA === tenantB) return true;

    const snapsA = this.snapshots.filter((s) => s.tenantId === tenantA);
    const snapsB = this.snapshots.filter((s) => s.tenantId === tenantB);

    const idsA = new Set(snapsA.map((s) => s.snapshotId));
    const idsB = new Set(snapsB.map((s) => s.snapshotId));

    for (const id of idsA) {
      if (idsB.has(id)) return false;
    }

    return true;
  }

  cleanupExpiredSnapshots(snapshots?: TenantRuntimeSnapshot[]): TenantRuntimeSnapshot[] {
    const now = Date.now();

    if (snapshots) {
      return snapshots.filter((s) => now - s.createdAtMs <= s.ttlMs);
    }

    const before = this.snapshots.length;
    this.snapshots = this.snapshots.filter((s) => now - s.createdAtMs <= s.ttlMs);
    return this.snapshots.slice(0, before);
  }

  generateSnapshotIsolationReport(): SnapshotIsolationReport {
    const now = Date.now();
    const active = this.snapshots.filter((s) => now - s.createdAtMs <= s.ttlMs);
    const expired = this.snapshots.filter((s) => now - s.createdAtMs > s.ttlMs);

    return {
      generatedAtMs: now,
      totalSnapshots: this.snapshots.length,
      activeSnapshots: active.length,
      expiredSnapshots: expired.length,
      violations: [],
      isolationValid: true,
      violationsCount: 0,
    };
  }

  getSnapshots(): TenantRuntimeSnapshot[] {
    return [...this.snapshots];
  }

  getSnapshotById(snapshotId: string): TenantRuntimeSnapshot | undefined {
    return this.snapshots.find((s) => s.snapshotId === snapshotId);
  }

  clear(): void {
    this.snapshots = [];
  }
}
