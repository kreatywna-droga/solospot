/**
 * StorefrontMerchantRolePermissionEngine.ts — Sprint G1-100 Merchant Role & Authorization Engine (Night Shift Level 62)
 *
 * Provides pure TypeScript, headless multi-user merchant role evaluation (OWNER, ADMIN, EDITOR, SUPPORT, VIEWER)
 * and authorization boundaries across store operations.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type MerchantRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'SUPPORT' | 'VIEWER';

export type MerchantPermission =
  | 'MANAGE_TENANT'
  | 'MANAGE_BILLING'
  | 'MANAGE_STAFF_USERS'
  | 'EDIT_STORE_SETTINGS'
  | 'EDIT_CATALOG'
  | 'MANAGE_ORDERS'
  | 'PROCESS_REFUNDS'
  | 'VIEW_ANALYTICS'
  | 'MANAGE_SUPPORT_TICKETS'
  | 'VIEW_ONLY';

export interface MerchantUserDTO {
  readonly userId: string;
  readonly tenantId: string;
  readonly email: string;
  readonly role: MerchantRole;
  readonly customPermissions?: ReadonlyArray<MerchantPermission>;
  readonly active: boolean;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

export interface AuthorizationEvaluationDTO {
  readonly authorized: boolean;
  readonly userId: string;
  readonly tenantId: string;
  readonly role: MerchantRole;
  readonly requestedPermission: MerchantPermission;
  readonly reason?: string;
  readonly evaluatedAtMs: number;
}

export interface MerchantRolePermissionEngineStateDTO {
  readonly tenantId: string;
  readonly users: Record<string, MerchantUserDTO>;
}

export class StorefrontMerchantRolePermissionEngine {
  private readonly tenantId: string;
  private users: Map<string, MerchantUserDTO> = new Map(); // userId -> MerchantUserDTO

  // Role hierarchy default permissions
  private static readonly ROLE_PERMISSIONS: Record<MerchantRole, ReadonlyArray<MerchantPermission>> = {
    OWNER: [
      'MANAGE_TENANT',
      'MANAGE_BILLING',
      'MANAGE_STAFF_USERS',
      'EDIT_STORE_SETTINGS',
      'EDIT_CATALOG',
      'MANAGE_ORDERS',
      'PROCESS_REFUNDS',
      'VIEW_ANALYTICS',
      'MANAGE_SUPPORT_TICKETS',
      'VIEW_ONLY'
    ],
    ADMIN: [
      'MANAGE_STAFF_USERS',
      'EDIT_STORE_SETTINGS',
      'EDIT_CATALOG',
      'MANAGE_ORDERS',
      'PROCESS_REFUNDS',
      'VIEW_ANALYTICS',
      'MANAGE_SUPPORT_TICKETS',
      'VIEW_ONLY'
    ],
    EDITOR: [
      'EDIT_CATALOG',
      'MANAGE_ORDERS',
      'VIEW_ANALYTICS',
      'VIEW_ONLY'
    ],
    SUPPORT: [
      'MANAGE_ORDERS',
      'PROCESS_REFUNDS',
      'MANAGE_SUPPORT_TICKETS',
      'VIEW_ONLY'
    ],
    VIEWER: [
      'VIEW_ANALYTICS',
      'VIEW_ONLY'
    ]
  };

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Registers a new merchant staff user.
   */
  public registerUser(params: {
    userId: string;
    email: string;
    role: MerchantRole;
    customPermissions?: ReadonlyArray<MerchantPermission>;
  }): MerchantUserDTO {
    const { userId, email, role } = params;

    if (!userId || !email) {
      throw new Error('userId and email are required to register a merchant user');
    }

    const now = Date.now();
    const user: MerchantUserDTO = {
      userId: userId.trim(),
      tenantId: this.tenantId,
      email: email.trim().toLowerCase(),
      role,
      customPermissions: params.customPermissions,
      active: true,
      createdAtMs: now,
      updatedAtMs: now
    };

    this.users.set(userId.trim(), user);
    return user;
  }

  /**
   * Updates an existing user's role.
   */
  public updateUserRole(userId: string, newRole: MerchantRole): MerchantUserDTO {
    const existing = this.users.get(userId);
    if (!existing) {
      throw new Error(`Merchant user not found: ${userId}`);
    }

    const updated: MerchantUserDTO = {
      ...existing,
      role: newRole,
      updatedAtMs: Date.now()
    };

    this.users.set(userId, updated);
    return updated;
  }

  /**
   * Evaluates if a user is authorized to perform a specific action.
   */
  public evaluateAuthorization(userId: string, permission: MerchantPermission): AuthorizationEvaluationDTO {
    const user = this.users.get(userId);
    const now = Date.now();

    if (!user) {
      return {
        authorized: false,
        userId,
        tenantId: this.tenantId,
        role: 'VIEWER',
        requestedPermission: permission,
        reason: 'User not found in tenant directory',
        evaluatedAtMs: now
      };
    }

    if (!user.active) {
      return {
        authorized: false,
        userId,
        tenantId: this.tenantId,
        role: user.role,
        requestedPermission: permission,
        reason: 'User account is inactive/revoked',
        evaluatedAtMs: now
      };
    }

    const rolePerms = StorefrontMerchantRolePermissionEngine.ROLE_PERMISSIONS[user.role] || [];
    const customPerms = user.customPermissions || [];
    const hasPermission = rolePerms.includes(permission) || customPerms.includes(permission);

    return {
      authorized: hasPermission,
      userId,
      tenantId: this.tenantId,
      role: user.role,
      requestedPermission: permission,
      reason: hasPermission ? undefined : `Role ${user.role} lacks permission ${permission}`,
      evaluatedAtMs: now
    };
  }

  /**
   * Retrieves all effective permissions for a user.
   */
  public getEffectivePermissions(userId: string): ReadonlyArray<MerchantPermission> {
    const user = this.users.get(userId);
    if (!user || !user.active) {
      return [];
    }

    const rolePerms = StorefrontMerchantRolePermissionEngine.ROLE_PERMISSIONS[user.role] || [];
    const customPerms = user.customPermissions || [];
    return Array.from(new Set([...rolePerms, ...customPerms]));
  }

  public getUser(userId: string): MerchantUserDTO | undefined {
    return this.users.get(userId);
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): MerchantRolePermissionEngineStateDTO {
    const record: Record<string, MerchantUserDTO> = {};
    this.users.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      users: record
    };
  }

  public importState(state: MerchantRolePermissionEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.users.clear();
    Object.entries(state.users || {}).forEach(([k, v]) => {
      this.users.set(k, v);
    });
  }
}
