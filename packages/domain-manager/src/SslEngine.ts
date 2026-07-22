import { Domain, SslCertificate } from './DomainDomain';

export class SslEngine {
  private certificates: Map<string, SslCertificate> = new Map();

  async issueCertificate(domain: Domain): Promise<SslCertificate> {
    const cert: SslCertificate = {
      id: `ssl-${Date.now()}`,
      domainId: domain.id,
      provider: 'letsencrypt',
      status: 'pending',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      renewAt: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.certificates.set(domain.id, cert);
    return cert;
  }

  async renewCertificate(cert: SslCertificate): Promise<SslCertificate | null> {
    if (!this.shouldRenew(cert)) return null;

    const renewed: SslCertificate = {
      ...cert,
      status: 'pending',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.certificates.set(cert.domainId, renewed);
    return renewed;
  }

  shouldRenew(cert: SslCertificate): boolean {
    const daysUntilExpiry = (new Date(cert.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    return daysUntilExpiry < 30;
  }

  getCertificate(domainId: string): SslCertificate | undefined {
    return this.certificates.get(domainId);
  }

  getFallbackCert(domainId: string): string | null {
    const cert = this.certificates.get(domainId);
    if (!cert || cert.status !== 'issued') return null;
    return cert.id;
  }
}