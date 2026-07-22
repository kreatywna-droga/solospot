import { AuditLog } from '../../tenant-admin/src/TenantAdminDomain';

export class AuditLogger {
  private logs: AuditLog[] = [];

  log(entry: AuditLog): void {
    this.logs.push(entry);
  }

  query(organizationId: string, action?: string): AuditLog[] {
    let result = this.logs.filter(l => l.organizationId === organizationId);
    if (action) {
      result = result.filter(l => l.action === action);
    }
    return result.slice(-100);
  }

  critical(organizationId: string, action: string, details: Record<string, unknown>): void {
    this.log({
      id: `audit-${Date.now()}`,
      organizationId,
      action,
      resource: 'security',
      details,
      timestamp: new Date().toISOString()
    });
  }
}