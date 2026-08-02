export interface MockTenant {
  id: string;
  name: string;
  domain: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  customDomainApproved: boolean;
}

export const MOCK_TENANTS: Record<string, MockTenant> = {
  polandTenant: {
    id: 'tenant_poland_01',
    name: 'Poland Enterprise Tenant',
    domain: 'onekoszyk.pl',
    plan: 'ENTERPRISE',
    customDomainApproved: true,
  },
  devTenant: {
    id: 'tenant_dev_01',
    name: 'Developer Sandbox Tenant',
    domain: 'dev.onekoszyk.local',
    plan: 'FREE',
    customDomainApproved: false,
  },
};
