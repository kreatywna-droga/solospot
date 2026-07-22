import { AdminContext } from './AdminContext';
import { AuditEvent } from './AuditEvent';
import { TenantManager, DefaultTenantManager } from './TenantManagement';
import { StoreManager, DefaultStoreManager } from './StoreManagement';
import { PackageManager, DefaultPackageManager } from './PackageManagement';
import { DeploymentManager, DefaultDeploymentManager } from './DeploymentManagement';
import { getServiceSupabase } from '@/lib/supabase';

export class MissionControl {
  readonly tenants: TenantManager;
  readonly stores: StoreManager;
  readonly packages: PackageManager;
  readonly deployments: DeploymentManager;

  constructor() {
    this.tenants = new DefaultTenantManager();
    this.stores = new DefaultStoreManager();
    this.packages = new DefaultPackageManager();
    this.deployments = new DefaultDeploymentManager();
  }

  async logAuditEvent(ctx: AdminContext, action: string, target: string): Promise<void> {
    const supabase = getServiceSupabase();
    const event: AuditEvent = {
      actor: ctx.userId,
      action,
      target,
      timestamp: new Date().toISOString()
    };

    await supabase.from('audit_logs').insert({
      actor: event.actor,
      action: event.action,
      target: event.target,
      timestamp: event.timestamp
    });
  }

  async getAuditLogs(ctx: AdminContext): Promise<AuditEvent[]> {
    if (ctx.role !== 'OWNER' && ctx.role !== 'ADMIN') {
      throw new Error(`InsufficientPermissions: Role '${ctx.role}' does not have permission to view audit logs`);
    }
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`MissionControl.getAuditLogs failed: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      actor: row.actor,
      action: row.action,
      target: row.target,
      timestamp: row.timestamp
    }));
  }
}
