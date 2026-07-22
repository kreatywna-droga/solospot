import { Domain, DomainVerification, DnsRecord } from './DomainDomain';

export class DnsEngine {
  private records: Map<string, DnsRecord[]> = new Map();

  initiateVerification(domain: Domain): DomainVerification {
    return {
      domainId: domain.id,
      method: 'dns_txt',
      recordName: `_verify.${domain.hostname}`,
      recordValue: `solospot-${Math.random().toString(36).substring(7)}`,
      verified: false
    };
  }

  addRecord(domainId: string, record: Omit<DnsRecord, 'id' | 'domainId'>): DnsRecord {
    const fullRecord: DnsRecord = {
      ...record,
      id: `dns-${Date.now()}`,
      domainId
    };

    const existing = this.records.get(domainId) || [];
    existing.push(fullRecord);
    this.records.set(domainId, existing);

    return fullRecord;
  }

  getRecords(domainId: string): DnsRecord[] {
    return this.records.get(domainId) || [];
  }

  checkDnsRecords(domain: Domain): { verified: boolean; propagation: 'pending' | 'partial' | 'complete' } {
    const records = this.getRecords(domain.id);
    const hasVerifyRecord = records.some(r => r.type === 'TXT' && r.name.includes('_verify'));

    return {
      verified: hasVerifyRecord,
      propagation: hasVerifyRecord ? 'complete' : 'pending'
    };
  }

  checkPropagation(domain: Domain): 'pending' | 'partial' | 'complete' {
    const records = this.getRecords(domain.id);
    if (records.length === 0) return 'pending';
    return 'complete';
  }
}