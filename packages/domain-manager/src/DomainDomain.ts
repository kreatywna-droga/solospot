export interface Domain {
  id: string;
  tenantId: string;
  hostname: string;
  isPrimary: boolean;
  isAlias: boolean;
  status: 'pending' | 'verified' | 'active' | 'failed';
  verifiedAt?: string;
  createdAt: string;
}

export interface DomainVerification {
  domainId: string;
  method: 'dns_txt' | 'dns_cname' | 'html_file';
  recordName: string;
  recordValue: string;
  verified: boolean;
}

export interface DnsRecord {
  id: string;
  domainId: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  name: string;
  value: string;
  ttl: number;
}

export interface SslCertificate {
  id: string;
  domainId: string;
  provider: 'letsencrypt' | 'cloudflare' | 'custom';
  status: 'pending' | 'issued' | 'expired' | 'failed';
  issuedAt?: string;
  expiresAt: string;
  renewAt?: string;
}

export interface DomainBinding {
  domainId: string;
  tenantId: string;
  organizationId: string;
  environmentId: string;
  hostname: string;
  isPrimary: boolean;
  redirectToPrimary: boolean;
  sslEnabled: boolean;
}