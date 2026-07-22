import { describe, it, expect } from 'vitest';
import { DnsEngine } from './DnsEngine';
import { Domain } from './DomainDomain';

describe('DnsEngine', () => {
  const engine = new DnsEngine();

  const domain: Domain = {
    id: 'dom-1',
    tenantId: 't-1',
    hostname: 'example.com',
    isPrimary: true,
    isAlias: false,
    status: 'pending',
    createdAt: ''
  };

  it('should initiate verification', () => {
    const verification = engine.initiateVerification(domain);
    expect(verification.domainId).toBe(domain.id);
    expect(verification.method).toBe('dns_txt');
    expect(verification.verified).toBe(false);
  });

  it('should add DNS record', () => {
    const record = engine.addRecord(domain.id, {
      type: 'A',
      name: 'www',
      value: '192.168.1.1',
      ttl: 300
    });
    expect(record.id).toMatch(/^dns-/);
    expect(record.type).toBe('A');
  });

  it('should get records for domain', () => {
    engine.addRecord(domain.id, { type: 'TXT', name: '_verify', value: 'token', ttl: 300 });
    const records = engine.getRecords(domain.id);
    expect(records.length).toBeGreaterThan(0);
  });

  it('should check DNS records', () => {
    const status = engine.checkDnsRecords(domain);
    expect(status).toHaveProperty('verified');
    expect(status).toHaveProperty('propagation');
  });
});