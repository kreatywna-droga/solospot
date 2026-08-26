/**
 * StorefrontBackupRecoveryEngine.ts — Sprint G1-107 Disaster Recovery & Snapshot Engine (Night Shift Level 69)
 *
 * Provides pure TypeScript, headless tenant snapshot creation, version compatibility verification,
 * data restore workflows, recovery validation, and automated rollback point generation.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type SnapshotType = 'FULL_TENANT_BACKUP' | 'CATALOG_SNAPSHOT' | 'CUSTOMER_DATA_SNAPSHOT' | 'SETTINGS_SNAPSHOT';

export interface SnapshotMetadataDTO {
  readonly snapshotId: string;
  readonly tenantId: string;
  readonly snapshotType: SnapshotType;
  readonly schemaVersion: string;
  readonly payloadJson: string;
  readonly checksum: string; // simple hash string
  readonly createdAtMs: number;
}

export interface RestoreResultDTO {
  readonly success: boolean;
  readonly snapshotId: string;
  readonly tenantId: string;
  readonly restoredSchemaVersion: string;
  readonly rollbackSnapshotId?: string;
  readonly failureReason?: string;
  readonly restoredAtMs: number;
}

export interface BackupRecoveryEngineStateDTO {
  readonly tenantId: string;
  readonly currentSchemaVersion: string;
  readonly snapshots: Record<string, SnapshotMetadataDTO>;
}

export class StorefrontBackupRecoveryEngine {
  private readonly tenantId: string;
  private readonly currentSchemaVersion: string;
  private snapshots: Map<string, SnapshotMetadataDTO> = new Map();

  constructor(tenantId = 'default_tenant', currentSchemaVersion = 'v3.2') {
    this.tenantId = tenantId;
    this.currentSchemaVersion = currentSchemaVersion;
  }

  /**
   * Computes a simple checksum string for snapshot integrity verification.
   */
  public computeChecksum(payload: string): string {
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `chk_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Captures a backup snapshot of tenant domain state.
   */
  public createSnapshot(snapshotType: SnapshotType, payloadJson: string): SnapshotMetadataDTO {
    if (!payloadJson || payloadJson.trim().length === 0) {
      throw new Error('payloadJson is required to create a snapshot');
    }

    const now = Date.now();
    const snapshotId = `snap_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const checksum = this.computeChecksum(payloadJson);

    const snapshot: SnapshotMetadataDTO = {
      snapshotId,
      tenantId: this.tenantId,
      snapshotType,
      schemaVersion: this.currentSchemaVersion,
      payloadJson,
      checksum,
      createdAtMs: now
    };

    this.snapshots.set(snapshotId, snapshot);
    return snapshot;
  }

  /**
   * Restores tenant state from a previously saved snapshot with version compatibility and rollback safety.
   */
  public restoreSnapshot(snapshotId: string, currentStatePayloadJson?: string): RestoreResultDTO {
    const snapshot = this.snapshots.get(snapshotId);
    const now = Date.now();

    if (!snapshot) {
      return {
        success: false,
        snapshotId,
        tenantId: this.tenantId,
        restoredSchemaVersion: this.currentSchemaVersion,
        failureReason: `Snapshot ${snapshotId} not found in recovery index`,
        restoredAtMs: now
      };
    }

    // Integrity Check
    const expectedChecksum = this.computeChecksum(snapshot.payloadJson);
    if (snapshot.checksum !== expectedChecksum) {
      return {
        success: false,
        snapshotId,
        tenantId: this.tenantId,
        restoredSchemaVersion: snapshot.schemaVersion,
        failureReason: 'Snapshot checksum mismatch — data integrity corrupted',
        restoredAtMs: now
      };
    }

    // Version Compatibility Check
    if (snapshot.schemaVersion !== this.currentSchemaVersion) {
      const majorCurrent = this.currentSchemaVersion.split('.')[0];
      const majorSnapshot = snapshot.schemaVersion.split('.')[0];
      if (majorCurrent !== majorSnapshot) {
        return {
          success: false,
          snapshotId,
          tenantId: this.tenantId,
          restoredSchemaVersion: snapshot.schemaVersion,
          failureReason: `Incompatible major schema version (${snapshot.schemaVersion} vs ${this.currentSchemaVersion})`,
          restoredAtMs: now
        };
      }
    }

    // Create automatic rollback point before applying restore
    let rollbackSnapshotId: string | undefined;
    if (currentStatePayloadJson) {
      const rollback = this.createSnapshot('FULL_TENANT_BACKUP', currentStatePayloadJson);
      rollbackSnapshotId = rollback.snapshotId;
    }

    return {
      success: true,
      snapshotId,
      tenantId: this.tenantId,
      restoredSchemaVersion: snapshot.schemaVersion,
      rollbackSnapshotId,
      restoredAtMs: now
    };
  }

  public getSnapshot(snapshotId: string): SnapshotMetadataDTO | undefined {
    return this.snapshots.get(snapshotId);
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): BackupRecoveryEngineStateDTO {
    const record: Record<string, SnapshotMetadataDTO> = {};
    this.snapshots.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      currentSchemaVersion: this.currentSchemaVersion,
      snapshots: record
    };
  }

  public importState(state: BackupRecoveryEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.snapshots.clear();
    Object.entries(state.snapshots || {}).forEach(([k, v]) => {
      this.snapshots.set(k, v);
    });
  }
}
