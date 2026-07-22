import { Domain, DomainVerification, SslCertificate } from './DomainDomain';
import { DnsEngine } from './DnsEngine';
import { SslEngine } from './SslEngine';
import { DomainRouting } from './DomainRouting';
import { PlatformContextResolver } from '../../platform-identity/src/PlatformContextResolver';

export class DomainManager {
  private domains: Map<string, Domain> = new Map();

  constructor(
    private dnsEngine: DnsEngine,
    private sslEngine: SslEngine,
    private routing: DomainRouting,
    private contextResolver: PlatformContextResolver
  ) {}

  createDomain(tenantId: string, hostname: string): Domain | null {
    const context = this.contextResolver.resolvePlatformContext(tenantId);
    if (!context || !context.capabilities.customDomains) return null;

    const hasCapability = this.contextResolver.hasCapability(tenantId, 'customDomains');
    if (!hasCapability) return null;

    const domain: Domain = {
      id: `domain-${Date.now()}`,
      tenantId,
      hostname,
      isPrimary: false,
      isAlias: false,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.domains.set(domain.id, domain);
    return domain;
  }

  verifyDomain(domainId: string): DomainVerification | null {
    const domain = this.domains.get(domainId);
    if (!domain) return null;

    return this.dnsEngine.initiateVerification(domain);
  }

  activateDomain(domainId: string): Domain | null {
    const domain = this.domains.get(domainId);
    if (!domain) return null;

    const updated: Domain = { ...domain, status: 'verified', verifiedAt: new Date().toISOString() };
    this.domains.set(domainId, updated);
    return updated;
  }

  async provisionSsl(domainId: string): Promise<SslCertificate | null> {
    const domain = this.domains.get(domainId);
    if (!domain) return null;

    const cert = await this.sslEngine.issueCertificate(domain);
    const updated: Domain = { ...domain, status: 'active' };
    this.domains.set(domainId, updated);
    return cert;
  }

  listDomains(organizationId: string): Domain[] {
    return Array.from(this.domains.values()).filter(d => {
      const context = this.contextResolver.resolvePlatformContext(d.tenantId);
      return context?.organizationId === organizationId;
    });
  }

  getDomain(id: string): Domain | undefined {
    return this.domains.get(id);
  }
}