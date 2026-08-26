/**
 * StorefrontDigitalAssetDeliveryEngine.ts — Sprint G1-122 Digital Product Asset Delivery Engine (Night Shift Level 84)
 *
 * Provides pure TypeScript, headless digital product download link generation, expiring token signatures,
 * download quota management, and license key generation.
 *
 * External Cloud Object Storage (S3, GCP Storage, Cloudflare R2) signed URL generation remains explicit integration boundary.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export interface DigitalAssetGrantDTO {
  readonly grantId: string;
  readonly tenantId: string;
  readonly orderId: string;
  readonly customerId: string;
  readonly digitalAssetId: string;
  readonly assetFileName: string;
  readonly downloadToken: string;
  readonly maxAllowedDownloads: number;
  readonly currentDownloadCount: number;
  readonly licenseKey?: string;
  readonly expiresAtMs: number;
  readonly createdAtMs: number;
}

export interface DigitalDownloadVerificationResultDTO {
  readonly grantId: string;
  readonly valid: boolean;
  readonly assetFileName: string;
  readonly downloadToken: string;
  readonly remainingDownloads: number;
  readonly failureReason?: string;
}

export interface DigitalAssetDeliveryEngineStateDTO {
  readonly tenantId: string;
  readonly grants: Record<string, DigitalAssetGrantDTO>; // downloadToken -> grant
}

export class StorefrontDigitalAssetDeliveryEngine {
  private readonly tenantId: string;
  private grants: Map<string, DigitalAssetGrantDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Issues a digital asset download grant for a purchased digital item.
   */
  public issueAssetGrant(params: {
    grantId: string;
    orderId: string;
    customerId: string;
    digitalAssetId: string;
    assetFileName: string;
    maxAllowedDownloads?: number;
    validityHours?: number;
    generateLicenseKey?: boolean;
  }): DigitalAssetGrantDTO {
    const { grantId, orderId, customerId, digitalAssetId, assetFileName } = params;

    if (!grantId || !orderId || !customerId || !digitalAssetId || !assetFileName) {
      throw new Error('grantId, orderId, customerId, digitalAssetId, and assetFileName are required');
    }

    const now = Date.now();
    const validityHours = params.validityHours ?? 72; // 3 days default
    const expiresAtMs = now + validityHours * 3600000;
    const downloadToken = `dl_token_${now}_${Math.random().toString(36).substring(2, 8)}`;
    const licenseKey = params.generateLicenseKey ? `LIC-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : undefined;

    const dto: DigitalAssetGrantDTO = {
      grantId: grantId.trim(),
      tenantId: this.tenantId,
      orderId: orderId.trim(),
      customerId: customerId.trim(),
      digitalAssetId: digitalAssetId.trim(),
      assetFileName: assetFileName.trim(),
      downloadToken,
      maxAllowedDownloads: params.maxAllowedDownloads ?? 5,
      currentDownloadCount: 0,
      licenseKey,
      expiresAtMs,
      createdAtMs: now
    };

    this.grants.set(downloadToken, dto);
    return dto;
  }

  /**
   * Verifies and records a digital download attempt.
   */
  public verifyAndConsumeDownload(downloadToken: string): DigitalDownloadVerificationResultDTO {
    if (!downloadToken) {
      throw new Error('downloadToken is required');
    }

    const token = downloadToken.trim();
    const grant = this.grants.get(token);

    if (!grant) {
      return {
        grantId: 'UNKNOWN',
        valid: false,
        assetFileName: 'UNKNOWN',
        downloadToken: token,
        remainingDownloads: 0,
        failureReason: 'Invalid or non-existent download token'
      };
    }

    const now = Date.now();
    if (now > grant.expiresAtMs) {
      return {
        grantId: grant.grantId,
        valid: false,
        assetFileName: grant.assetFileName,
        downloadToken: token,
        remainingDownloads: Math.max(0, grant.maxAllowedDownloads - grant.currentDownloadCount),
        failureReason: 'Download link has expired'
      };
    }

    if (grant.currentDownloadCount >= grant.maxAllowedDownloads) {
      return {
        grantId: grant.grantId,
        valid: false,
        assetFileName: grant.assetFileName,
        downloadToken: token,
        remainingDownloads: 0,
        failureReason: 'Maximum download quota exceeded'
      };
    }

    const updated: DigitalAssetGrantDTO = {
      ...grant,
      currentDownloadCount: grant.currentDownloadCount + 1
    };

    this.grants.set(token, updated);

    return {
      grantId: grant.grantId,
      valid: true,
      assetFileName: grant.assetFileName,
      downloadToken: token,
      remainingDownloads: updated.maxAllowedDownloads - updated.currentDownloadCount
    };
  }

  public getGrantByToken(downloadToken: string): DigitalAssetGrantDTO | undefined {
    return this.grants.get(downloadToken.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): DigitalAssetDeliveryEngineStateDTO {
    const record: Record<string, DigitalAssetGrantDTO> = {};
    this.grants.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      grants: record
    };
  }

  public importState(state: DigitalAssetDeliveryEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.grants.clear();
    Object.entries(state.grants || {}).forEach(([k, v]) => {
      this.grants.set(k, v);
    });
  }
}
