/**
 * StorefrontTaxExemptionCertificateEngine.ts — Sprint G1-132 B2B Tax Exemption Certificate Engine (Night Shift Level 94)
 *
 * Provides pure TypeScript, headless B2B resale tax exemption certificate registration,
 * state jurisdiction matching, expiration verification, and tax-exempt status clearance.
 *
 * External certificate verification databases (CertCapture, Avalara Exemption Manager) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type ExemptionStatus = 'SUBMITTED' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';

export interface TaxExemptionCertificateDTO {
  readonly certificateId: string;
  readonly tenantId: string;
  readonly customerId: string;
  readonly companyName: string;
  readonly certificateNumber: string;
  readonly issuingStateCountryCode: string; // e.g. 'US_CA', 'DE'
  readonly status: ExemptionStatus;
  readonly expiresAtMs: number;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

export interface ExemptionValidationResultDTO {
  readonly customerId: string;
  readonly isTaxExempt: boolean;
  readonly verifiedCertificateId?: string;
  readonly certificateNumber?: string;
  readonly failureReason?: string;
}

export interface TaxExemptionCertificateEngineStateDTO {
  readonly tenantId: string;
  readonly certificates: Record<string, TaxExemptionCertificateDTO>; // certificateId -> dto
}

/**
 * @deprecated StorefrontTaxExemptionCertificateEngine is merged into StorefrontTaxComplianceEngine. Use StorefrontTaxComplianceEngine instead. (G1-164 MERGE)
 */
export class StorefrontTaxExemptionCertificateEngine {
  private readonly tenantId: string;
  private certificates: Map<string, TaxExemptionCertificateDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }


  /**
   * Registers a customer B2B tax exemption certificate.
   */
  public registerCertificate(params: {
    certificateId: string;
    customerId: string;
    companyName: string;
    certificateNumber: string;
    issuingStateCountryCode: string;
    validityDays?: number;
  }): TaxExemptionCertificateDTO {
    const { certificateId, customerId, companyName, certificateNumber, issuingStateCountryCode } = params;

    if (!certificateId || !customerId || !companyName || !certificateNumber || !issuingStateCountryCode) {
      throw new Error('certificateId, customerId, companyName, certificateNumber, and issuingStateCountryCode are required');
    }

    const now = Date.now();
    const validityDays = params.validityDays ?? 365; // 1 year default
    const expiresAtMs = now + validityDays * 86400000;

    const dto: TaxExemptionCertificateDTO = {
      certificateId: certificateId.trim(),
      tenantId: this.tenantId,
      customerId: customerId.trim(),
      companyName: companyName.trim(),
      certificateNumber: certificateNumber.trim(),
      issuingStateCountryCode: issuingStateCountryCode.trim().toUpperCase(),
      status: 'VERIFIED',
      expiresAtMs,
      createdAtMs: now,
      updatedAtMs: now
    };

    this.certificates.set(dto.certificateId, dto);
    return dto;
  }

  /**
   * Validates if a customer has an active, valid tax exemption certificate for a target jurisdiction.
   */
  public validateExemptionForCheckout(params: {
    customerId: string;
    jurisdictionCode: string;
  }): ExemptionValidationResultDTO {
    const { customerId, jurisdictionCode } = params;

    if (!customerId || !jurisdictionCode) {
      throw new Error('customerId and jurisdictionCode are required');
    }

    const cleanCustId = customerId.trim();
    const cleanJurisdiction = jurisdictionCode.trim().toUpperCase();
    const now = Date.now();

    const customerCerts = Array.from(this.certificates.values()).filter(
      c => c.customerId === cleanCustId
    );

    if (customerCerts.length === 0) {
      return {
        customerId: cleanCustId,
        isTaxExempt: false,
        failureReason: 'No exemption certificate on file'
      };
    }

    const matchingCert = customerCerts.find(
      c => c.issuingStateCountryCode === cleanJurisdiction || c.issuingStateCountryCode === 'ALL_JURISDICTIONS'
    );

    if (!matchingCert) {
      return {
        customerId: cleanCustId,
        isTaxExempt: false,
        failureReason: `No certificate matching jurisdiction ${cleanJurisdiction}`
      };
    }

    if (now > matchingCert.expiresAtMs) {
      return {
        customerId: cleanCustId,
        isTaxExempt: false,
        verifiedCertificateId: matchingCert.certificateId,
        failureReason: 'Certificate has expired'
      };
    }

    if (matchingCert.status !== 'VERIFIED') {
      return {
        customerId: cleanCustId,
        isTaxExempt: false,
        verifiedCertificateId: matchingCert.certificateId,
        failureReason: `Certificate status is ${matchingCert.status}`
      };
    }

    return {
      customerId: cleanCustId,
      isTaxExempt: true,
      verifiedCertificateId: matchingCert.certificateId,
      certificateNumber: matchingCert.certificateNumber
    };
  }

  public getCertificate(certificateId: string): TaxExemptionCertificateDTO | undefined {
    return this.certificates.get(certificateId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): TaxExemptionCertificateEngineStateDTO {
    const record: Record<string, TaxExemptionCertificateDTO> = {};
    this.certificates.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      certificates: record
    };
  }

  public importState(state: TaxExemptionCertificateEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.certificates.clear();
    Object.entries(state.certificates || {}).forEach(([k, v]) => {
      this.certificates.set(k, v);
    });
  }
}
