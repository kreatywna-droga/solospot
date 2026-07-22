import { Role } from './Role';
import { Permission } from './Permission';

export interface UserContext {
  id: string;
  role: Role;
  tenantId?: string; // Present for tenant-isolated users (TENANT_ADMIN, CUSTOMER)
}

export class AuthorizationEngine {
  private static readonly rolePermissions: Record<Role, Set<Permission>> = {
    SUPER_ADMIN: new Set([
      'VIEW_ALL_TENANTS',
      'PROVISION_TENANT',
      'MANAGE_TENANT_STORE',
      'VIEW_TENANT_TIMELINE',
      'VIEW_TENANT_ORDERS',
      'VIEW_OWN_ORDERS',
      'PLACE_ORDER',
      'MANAGE_SYSTEM_SETTINGS',
    ]),
    PLATFORM_OPERATOR: new Set([
      'VIEW_ALL_TENANTS',
      'PROVISION_TENANT',
      'MANAGE_TENANT_STORE',
      'VIEW_TENANT_TIMELINE',
      'VIEW_TENANT_ORDERS',
      'VIEW_OWN_ORDERS',
      'PLACE_ORDER',
    ]),
    TENANT_ADMIN: new Set([
      'MANAGE_TENANT_STORE',
      'VIEW_TENANT_TIMELINE',
      'VIEW_TENANT_ORDERS',
      'VIEW_OWN_ORDERS',
    ]),
    CUSTOMER: new Set([
      'VIEW_OWN_ORDERS',
      'PLACE_ORDER',
    ]),
  };

  /**
   * Evaluates if a user is permitted to perform an action.
   * Isolates tenant access: a TENANT_ADMIN/CUSTOMER can only act on resources that belong to their own tenantId.
   */
  public static can(user: UserContext, permission: Permission, targetTenantId?: string): boolean {
    const permissions = this.rolePermissions[user.role];
    if (!permissions || !permissions.has(permission)) {
      return false;
    }

    // Tenant Isolation Check:
    // If the permission is tenant-specific, and the user is a TENANT_ADMIN or CUSTOMER,
    // they must only access their own tenant's data.
    if (user.role === 'TENANT_ADMIN' || user.role === 'CUSTOMER') {
      if (targetTenantId && user.tenantId !== targetTenantId) {
        return false;
      }
    }

    return true;
  }
}
