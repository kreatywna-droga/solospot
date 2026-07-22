import { TenantRepository } from '@/lib/tenant/TenantRepository';
import type { Tenant } from '@/lib/tenant/TenantStatus';
import { AdminContext } from './AdminContext';

export interface TenantManager {
  listTenants(ctx: AdminContext): Promise<Tenant[]>;
  getTenant(ctx: AdminContext, id: string): Promise<Tenant | null>;
  suspendTenant(ctx: AdminContext, id: string): Promise<Tenant>;
  activateTenant(ctx: AdminContext, id: string): Promise<Tenant>;
}

export class DefaultTenantManager implements TenantManager {
  private readonly repo: TenantRepository;

  constructor() {
    this.repo = new TenantRepository();
  }

  private checkPermission(ctx: AdminContext, action: string) {
    if (ctx.role === 'OWNER' || ctx.role === 'ADMIN') {
      return;
    }
    if (ctx.role === 'OPERATOR' && ['listTenants', 'getTenant'].includes(action)) {
      return;
    }
    if (ctx.role === 'SUPPORT' && ['listTenants', 'getTenant'].includes(action)) {
      return;
    }
    throw new Error(`InsufficientPermissions: Role '${ctx.role}' does not have permission to execute action '${action}'`);
  }

  async listTenants(ctx: AdminContext): Promise<Tenant[]> {
    this.checkPermission(ctx, 'listTenants');
    return this.repo.getAllTenants();
  }

  async getTenant(ctx: AdminContext, id: string): Promise<Tenant | null> {
    this.checkPermission(ctx, 'getTenant');
    return this.repo.getTenant(id);
  }

  async suspendTenant(ctx: AdminContext, id: string): Promise<Tenant> {
    this.checkPermission(ctx, 'suspendTenant');
    return this.repo.updateTenantStatus(id, 'SUSPENDED');
  }

  async activateTenant(ctx: AdminContext, id: string): Promise<Tenant> {
    this.checkPermission(ctx, 'activateTenant');
    return this.repo.updateTenantStatus(id, 'ACTIVE');
  }
}
