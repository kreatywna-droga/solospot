/**
 * StorefrontMultiStoreBranchEngine.ts — Sprint G1-137 Multi-Store Branch & Domain Routing Engine (Night Shift Level 99)
 *
 * Provides pure TypeScript, headless multi-store branch management under unified tenant context,
 * domain/subdomain routing resolution, currency/locale mapping per store branch, and fallback branch routing.
 *
 * External Edge DNS / GeoIP resolution APIs (Cloudflare Workers / Fastly VCL) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export interface StoreBranchDTO {
  readonly branchId: string;
  readonly tenantId: string;
  readonly branchName: string;
  readonly customDomain: string; // e.g. 'eu.store.com'
  readonly targetCountryCodes: ReadonlyArray<string>; // e.g. ['DE', 'FR', 'ES']
  readonly defaultCurrency: string; // e.g. 'EUR'
  readonly defaultLocale: string; // e.g. 'de-DE'
  readonly isDefaultBranch: boolean;
  readonly createdAtMs: number;
}

export interface BranchRoutingResultDTO {
  readonly requestedDomain?: string;
  readonly detectedCountryCode?: string;
  readonly matchedBranchId: string;
  readonly matchedBranchName: string;
  readonly defaultCurrency: string;
  readonly defaultLocale: string;
  readonly isFallbackMatch: boolean;
}

export interface MultiStoreBranchEngineStateDTO {
  readonly tenantId: string;
  readonly branches: Record<string, StoreBranchDTO>; // branchId -> dto
}

export class StorefrontMultiStoreBranchEngine {
  private readonly tenantId: string;
  private branches: Map<string, StoreBranchDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Registers a multi-store regional branch.
   */
  public registerBranch(params: {
    branchId: string;
    branchName: string;
    customDomain: string;
    targetCountryCodes: ReadonlyArray<string>;
    defaultCurrency: string;
    defaultLocale: string;
    isDefaultBranch?: boolean;
  }): StoreBranchDTO {
    const { branchId, branchName, customDomain, targetCountryCodes, defaultCurrency, defaultLocale } = params;

    if (!branchId || !branchName || !customDomain || !defaultCurrency || !defaultLocale) {
      throw new Error('branchId, branchName, customDomain, defaultCurrency, and defaultLocale are required');
    }

    const now = Date.now();
    const dto: StoreBranchDTO = {
      branchId: branchId.trim(),
      tenantId: this.tenantId,
      branchName: branchName.trim(),
      customDomain: customDomain.trim().toLowerCase(),
      targetCountryCodes: targetCountryCodes.map(c => c.trim().toUpperCase()),
      defaultCurrency: defaultCurrency.trim().toUpperCase(),
      defaultLocale: defaultLocale.trim(),
      isDefaultBranch: params.isDefaultBranch ?? false,
      createdAtMs: now
    };

    this.branches.set(dto.branchId, dto);
    return dto;
  }

  /**
   * Resolves target store branch based on incoming host domain or buyer GeoIP country code.
   */
  public resolveBranchForRequest(params: {
    hostname?: string;
    countryCode?: string;
  }): BranchRoutingResultDTO {
    const allBranches = Array.from(this.branches.values());

    if (allBranches.length === 0) {
      throw new Error('No store branches registered for tenant');
    }

    const cleanHost = params.hostname ? params.hostname.trim().toLowerCase() : '';
    const cleanCountry = params.countryCode ? params.countryCode.trim().toUpperCase() : '';

    // 1. Match custom domain
    if (cleanHost) {
      const domainMatch = allBranches.find(b => b.customDomain === cleanHost);
      if (domainMatch) {
        return {
          requestedDomain: cleanHost,
          detectedCountryCode: cleanCountry,
          matchedBranchId: domainMatch.branchId,
          matchedBranchName: domainMatch.branchName,
          defaultCurrency: domainMatch.defaultCurrency,
          defaultLocale: domainMatch.defaultLocale,
          isFallbackMatch: false
        };
      }
    }

    // 2. Match country code
    if (cleanCountry) {
      const countryMatch = allBranches.find(b => b.targetCountryCodes.includes(cleanCountry));
      if (countryMatch) {
        return {
          requestedDomain: cleanHost,
          detectedCountryCode: cleanCountry,
          matchedBranchId: countryMatch.branchId,
          matchedBranchName: countryMatch.branchName,
          defaultCurrency: countryMatch.defaultCurrency,
          defaultLocale: countryMatch.defaultLocale,
          isFallbackMatch: false
        };
      }
    }

    // 3. Fallback to default branch or first branch
    const defaultBranch = allBranches.find(b => b.isDefaultBranch) || allBranches[0];

    return {
      requestedDomain: cleanHost,
      detectedCountryCode: cleanCountry,
      matchedBranchId: defaultBranch.branchId,
      matchedBranchName: defaultBranch.branchName,
      defaultCurrency: defaultBranch.defaultCurrency,
      defaultLocale: defaultBranch.defaultLocale,
      isFallbackMatch: true
    };
  }

  public getBranch(branchId: string): StoreBranchDTO | undefined {
    return this.branches.get(branchId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): MultiStoreBranchEngineStateDTO {
    const record: Record<string, StoreBranchDTO> = {};
    this.branches.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      branches: record
    };
  }

  public importState(state: MultiStoreBranchEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.branches.clear();
    Object.entries(state.branches || {}).forEach(([k, v]) => {
      this.branches.set(k, v);
    });
  }
}
