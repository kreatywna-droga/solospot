/**
 * StorefrontCustomDomainDnsBridgeEngine.ts — Sprint G1-78 Storefront Custom Domain DNS Engine (Night Shift Level 40)
 *
 * Implements a pure TypeScript, headless custom domain binding, DNS record verification (CNAME/A/TXT), SSL certificate status manifest,
 * and custom domain routing engine for published WEB FACTOR storefronts. Enables non-programmer site owners to attach custom domains.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export type DomainStatus = 'PENDING_DNS' | 'ACTIVE' | 'SSL_PROVISIONING' | 'ERROR';
export type DnsRecordType = 'CNAME' | 'A' | 'TXT';

export interface DnsRecordDTO {
  readonly type: DnsRecordType;
  readonly name: string;
  readonly value: string;
  readonly status: 'PENDING' | 'VERIFIED' | 'FAILED';
}

export interface CustomDomainRecordDTO {
  readonly domainId: string;
  readonly customDomain: string;
  readonly status: DomainStatus;
  readonly dnsRecords: ReadonlyArray<DnsRecordDTO>;
  readonly sslCertificateActive: boolean;
  readonly createdAt: number;
  readonly verifiedAt?: number;
}

export interface CustomDomainConfigDTO {
  readonly siteId: string;
  readonly domains: ReadonlyArray<CustomDomainRecordDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontCustomDomainDnsBridgeEngine {
  /**
   * Creates a default domain configuration.
   */
  public static createDefaultDomainConfig(siteId = 'default_storefront_site'): CustomDomainConfigDTO {
    return {
      siteId,
      domains: [],
      lastUpdated: Date.now()
    };
  }

  /**
   * Registers a custom domain and generates required DNS verification records.
   */
  public static registerCustomDomain(config: CustomDomainConfigDTO, customDomain: string): CustomDomainConfigDTO {
    if (!config || !customDomain) throw new Error('StorefrontCustomDomainDnsBridgeEngine: Config or customDomain is null');

    const cleanDomain = customDomain.toLowerCase().trim().replace(/^https?:\/\//, '');
    const now = Date.now();
    const domainId = `dom_${now}_${Math.floor(Math.random() * 1000)}`;

    const dnsRecords: DnsRecordDTO[] = [
      { type: 'CNAME', name: 'www', value: 'cname.webfactor.io', status: 'PENDING' },
      { type: 'A', name: '@', value: '76.76.21.21', status: 'PENDING' },
      { type: 'TXT', name: '_webfactor-challenge', value: `verification=${domainId}`, status: 'PENDING' }
    ];

    const newRecord: CustomDomainRecordDTO = {
      domainId,
      customDomain: cleanDomain,
      status: 'PENDING_DNS',
      dnsRecords,
      sslCertificateActive: false,
      createdAt: now
    };

    return {
      ...config,
      domains: [...config.domains, newRecord],
      lastUpdated: now
    };
  }

  /**
   * Simulates DNS verification and provisions SSL certificate manifest.
   */
  public static verifyDomainDns(config: CustomDomainConfigDTO, domainId: string): CustomDomainConfigDTO {
    if (!config || !domainId) throw new Error('StorefrontCustomDomainDnsBridgeEngine: Config or domainId is null');

    const now = Date.now();
    const updatedDomains = config.domains.map(d => {
      if (d.domainId === domainId) {
        const verifiedDns = d.dnsRecords.map(r => ({ ...r, status: 'VERIFIED' as const }));
        return {
          ...d,
          status: 'ACTIVE' as DomainStatus,
          dnsRecords: verifiedDns,
          sslCertificateActive: true,
          verifiedAt: now
        };
      }
      return d;
    });

    return {
      ...config,
      domains: updatedDomains,
      lastUpdated: now
    };
  }

  /**
   * Retrieves active primary custom domain.
   */
  public static getPrimaryDomain(config: CustomDomainConfigDTO): CustomDomainRecordDTO | undefined {
    if (!config) return undefined;
    return config.domains.find(d => d.status === 'ACTIVE');
  }

  /**
   * Serializes domain config to JSON string.
   */
  public static serializeDomainConfig(config: CustomDomainConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores domain config from JSON string.
   */
  public static restoreDomainConfig(json: string): CustomDomainConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid domain JSON structure');
      }
      return parsed as CustomDomainConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore domain config: ${err.message}`);
    }
  }
}
