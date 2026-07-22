import { describe, it, expect } from 'vitest';
import { SslEngine } from './SslEngine';
import { Domain } from './DomainDomain';

describe('SslEngine', () => {
  const engine = new SslEngine();

  const domain: Domain = {
    id: 'dom-1',
    tenantId: 't-1',
    hostname: 'secure.example.com',
    isPrimary: true,
    isAlias: false,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  it('should issue certificate', async () => {
    const cert = await engine.issueCertificate(domain);
    expect(cert.domainId).toBe(domain.id);
    expect(cert.provider).toBe('letsencrypt');
    expect(cert.status).toBe('pending');
  });

  it('should check renewal needed', async () => {
    const cert = await engine.issueCertificate(domain);
    const needsRenewal = engine.shouldRenew(cert);
    expect(needsRenewal).toBe(false);
  });

  it('should get certificate for domain', async () => {
    await engine.issueCertificate(domain);
    const cert = engine.getCertificate(domain.id);
    expect(cert).toBeDefined();
  });

  it('should issue renewed certificate', async () => {
    const cert = await engine.issueCertificate(domain);
    cert.expiresAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const renewed = await engine.renewCertificate(cert);
    expect(renewed).toBeDefined();
  });
});