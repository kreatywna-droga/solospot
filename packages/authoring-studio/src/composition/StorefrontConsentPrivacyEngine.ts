/**
 * StorefrontConsentPrivacyEngine.ts — Sprint G1-103 Consent & Privacy Management Engine (Night Shift Level 65)
 *
 * Provides pure TypeScript, headless customer cookie consent state management, marketing & analytics consent,
 * privacy preferences, data-processing boundaries, and consent auditability (GDPR / CCPA compliance).
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type ConsentCategory = 'NECESSARY' | 'ANALYTICS' | 'MARKETING' | 'FUNCTIONAL' | 'THIRD_PARTY_SHARING';

export type ConsentPreferences = Record<ConsentCategory, boolean>;

export interface CustomerConsentRecordDTO {
  readonly consentId: string;
  readonly tenantId: string;
  readonly customerOrSessionId: string;
  readonly preferences: ConsentPreferences;
  readonly ipBoundary?: string;
  readonly userAgentBoundary?: string;
  readonly version: string;
  readonly grantedAtMs: number;
  readonly updatedAtMs: number;
}

export interface ConsentEngineStateDTO {
  readonly tenantId: string;
  readonly policyVersion: string;
  readonly records: Record<string, CustomerConsentRecordDTO>; // customerOrSessionId -> Record
}

export class StorefrontConsentPrivacyEngine {
  private readonly tenantId: string;
  private readonly policyVersion: string;
  private records: Map<string, CustomerConsentRecordDTO> = new Map();

  constructor(tenantId = 'default_tenant', policyVersion = 'v1.0') {
    this.tenantId = tenantId;
    this.policyVersion = policyVersion;
  }

  /**
   * Sets or updates consent preferences for a customer or guest session.
   */
  public updateConsent(
    customerOrSessionId: string,
    preferences: Partial<ConsentPreferences>,
    metadata?: { ipBoundary?: string; userAgentBoundary?: string }
  ): CustomerConsentRecordDTO {
    if (!customerOrSessionId) {
      throw new Error('customerOrSessionId is required to record consent preferences');
    }

    const now = Date.now();
    const existing = this.records.get(customerOrSessionId);

    const mergedPreferences: ConsentPreferences = {
      NECESSARY: true, // Necessary consent is strictly required and immutable
      ANALYTICS: preferences.ANALYTICS ?? (existing ? existing.preferences.ANALYTICS : false),
      MARKETING: preferences.MARKETING ?? (existing ? existing.preferences.MARKETING : false),
      FUNCTIONAL: preferences.FUNCTIONAL ?? (existing ? existing.preferences.FUNCTIONAL : false),
      THIRD_PARTY_SHARING: preferences.THIRD_PARTY_SHARING ?? (existing ? existing.preferences.THIRD_PARTY_SHARING : false)
    };

    const consentId = existing ? existing.consentId : `consent_${now}_${Math.random().toString(36).substring(2, 7)}`;

    const record: CustomerConsentRecordDTO = {
      consentId,
      tenantId: this.tenantId,
      customerOrSessionId: customerOrSessionId.trim(),
      preferences: mergedPreferences,
      ipBoundary: metadata?.ipBoundary?.trim(),
      userAgentBoundary: metadata?.userAgentBoundary?.trim(),
      version: this.policyVersion,
      grantedAtMs: existing ? existing.grantedAtMs : now,
      updatedAtMs: now
    };

    this.records.set(customerOrSessionId.trim(), record);
    return record;
  }

  /**
   * Checks if consent is granted for a specific privacy category.
   */
  public hasConsent(customerOrSessionId: string, category: ConsentCategory): boolean {
    if (category === 'NECESSARY') {
      return true;
    }

    const record = this.records.get(customerOrSessionId);
    if (!record) {
      return false; // Default opt-in is false for non-necessary cookies under GDPR
    }

    return record.preferences[category] === true;
  }

  /**
   * Revokes all optional consents for a customer or session.
   */
  public revokeAllOptionalConsent(customerOrSessionId: string): CustomerConsentRecordDTO {
    return this.updateConsent(customerOrSessionId, {
      ANALYTICS: false,
      MARKETING: false,
      FUNCTIONAL: false,
      THIRD_PARTY_SHARING: false
    });
  }

  public getConsentRecord(customerOrSessionId: string): CustomerConsentRecordDTO | undefined {
    return this.records.get(customerOrSessionId);
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): ConsentEngineStateDTO {
    const record: Record<string, CustomerConsentRecordDTO> = {};
    this.records.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      policyVersion: this.policyVersion,
      records: record
    };
  }

  public importState(state: ConsentEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.records.clear();
    Object.entries(state.records || {}).forEach(([k, v]) => {
      this.records.set(k, v);
    });
  }
}
