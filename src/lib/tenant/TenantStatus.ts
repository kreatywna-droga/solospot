export type TenantStatus = 'CREATED' | 'PROVISIONING' | 'ACTIVE' | 'DEACTIVATED' | 'SUSPENDED';
export type StoreStatus = 'CREATED' | 'LOADING' | 'READY' | 'DISPOSED';

export interface Tenant {
  id: string;
  ownerEmail: string;
  packageId: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoreInstance {
  id: string;
  tenantId: string;
  name: string;
  status: StoreStatus;
  createdAt: string;
  updatedAt: string;
}
