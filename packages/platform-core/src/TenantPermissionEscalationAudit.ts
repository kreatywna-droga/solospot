/**
 * TenantPermissionEscalationAudit — G1-205
 *
 * Audits permission escalation patterns across tenants to detect
 * unauthorized privilege escalation, privilege creep, and role hierarchy violations.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TenantPermissionRecord {
  readonly tenantId: string;
  readonly userId: string;
  readonly roleId: string;
  readonly permissions: string[];
  readonly grantedAtMs: number;
  readonly grantedBy: string;
}

export interface RoleDefinition {
  readonly roleId: string;
  readonly tenantId: string;
  readonly parentRoleId?: string;
  readonly level: number;
}

export interface EscalationViolation {
  readonly tenantId: string;
  readonly userId: string;
  readonly violationType: string;
  readonly detail: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PrivilegeCreepEntry {
  readonly userId: string;
  readonly tenantId: string;
  readonly totalPermissions: number;
  readonly roles: string[];
}

export interface EscalationReport {
  readonly generatedAtMs: number;
  readonly totalPermissions: number;
  readonly violationsFound: number;
  readonly violations: EscalationViolation[];
  readonly privilegeCreepEntries: PrivilegeCreepEntry[];
  readonly summary: string;
}

// ---------------------------------------------------------------------------
// Tenant Permission Escalation Auditor
// ---------------------------------------------------------------------------

export class TenantPermissionEscalationAuditor {
  private readonly MAX_PERMISSIONS_PER_USER = 20;

  auditPermissionEscalation(permissions: TenantPermissionRecord[]): EscalationViolation[] {
    const violations: EscalationViolation[] = [];

    for (const perm of permissions) {
      if (perm.permissions.includes('superadmin') || perm.permissions.includes('admin.all')) {
        const isAdminGrant = perm.grantedBy === 'system' || perm.grantedBy === 'superadmin';
        if (!isAdminGrant) {
          violations.push({
            tenantId: perm.tenantId,
            userId: perm.userId,
            violationType: 'UNAUTHORIZED_ADMIN_GRANT',
            detail: `User ${perm.userId} granted superadmin permissions by ${perm.grantedBy}`,
            severity: 'CRITICAL',
          });
        }
      }

      if (perm.permissions.length > 15) {
        violations.push({
          tenantId: perm.tenantId,
          userId: perm.userId,
          violationType: 'EXCESSIVE_PERMISSIONS',
          detail: `User ${perm.userId} has ${perm.permissions.length} permissions (threshold: 15)`,
          severity: 'HIGH',
        });
      }

      if (!perm.grantedBy || perm.grantedBy.trim().length === 0) {
        violations.push({
          tenantId: perm.tenantId,
          userId: perm.userId,
          violationType: 'MISSING_GRANTOR',
          detail: `Permission grant for ${perm.userId} has no grantor`,
          severity: 'MEDIUM',
        });
      }
    }

    return violations;
  }

  detectPrivilegeCreep(permissions: TenantPermissionRecord[]): PrivilegeCreepEntry[] {
    const userMap = new Map<string, { tenantId: string; permissions: string[]; roles: Set<string> }>();

    for (const perm of permissions) {
      const key = `${perm.tenantId}:${perm.userId}`;
      const existing = userMap.get(key);
      if (existing) {
        existing.permissions.push(...perm.permissions);
        existing.roles.add(perm.roleId);
      } else {
        userMap.set(key, {
          tenantId: perm.tenantId,
          permissions: [...perm.permissions],
          roles: new Set([perm.roleId]),
        });
      }
    }

    const entries: PrivilegeCreepEntry[] = [];
    for (const [key, data] of userMap) {
      const [, userId] = key.split(':');
      if (data.permissions.length > this.MAX_PERMISSIONS_PER_USER) {
        entries.push({
          userId,
          tenantId: data.tenantId,
          totalPermissions: data.permissions.length,
          roles: Array.from(data.roles),
        });
      }
    }

    return entries.sort((a, b) => b.totalPermissions - a.totalPermissions);
  }

  validatePermissionHierarchy(roles: RoleDefinition[]): EscalationViolation[] {
    const violations: EscalationViolation[] = [];
    const roleMap = new Map<string, RoleDefinition>();

    for (const role of roles) {
      const key = `${role.tenantId}:${role.roleId}`;
      if (roleMap.has(key)) {
        violations.push({
          tenantId: role.tenantId,
          userId: '',
          violationType: 'DUPLICATE_ROLE',
          detail: `Duplicate role definition for ${role.roleId} in tenant ${role.tenantId}`,
          severity: 'MEDIUM',
        });
      }
      roleMap.set(key, role);
    }

    for (const role of roles) {
      if (role.parentRoleId) {
        const parentKey = `${role.tenantId}:${role.parentRoleId}`;
        const parent = roleMap.get(parentKey);
        if (!parent) {
          violations.push({
            tenantId: role.tenantId,
            userId: '',
            violationType: 'MISSING_PARENT_ROLE',
            detail: `Role ${role.roleId} references non-existent parent ${role.parentRoleId}`,
            severity: 'HIGH',
          });
        } else if (parent.level >= role.level) {
          violations.push({
            tenantId: role.tenantId,
            userId: '',
            violationType: 'HIERARCHY_VIOLATION',
            detail: `Parent role ${role.parentRoleId} (level ${parent.level}) must have lower level than child ${role.roleId} (level ${role.level})`,
            severity: 'HIGH',
          });
        }
      }
    }

    return violations;
  }

  detectCrossTenantPermissionLeakage(permissions: TenantPermissionRecord[]): EscalationViolation[] {
    const violations: EscalationViolation[] = [];
    const tenantUserPerms = new Map<string, Set<string>>();

    for (const perm of permissions) {
      const key = `${perm.tenantId}:${perm.userId}`;
      if (!tenantUserPerms.has(key)) {
        tenantUserPerms.set(key, new Set());
      }
      for (const p of perm.permissions) {
        tenantUserPerms.get(key)!.add(p);
      }
    }

    for (const perm of permissions) {
      if (perm.tenantId === '' || perm.tenantId.trim().length === 0) {
        violations.push({
          tenantId: perm.tenantId,
          userId: perm.userId,
          violationType: 'MISSING_TENANT_CONTEXT',
          detail: `Permission record for ${perm.userId} has no tenant context`,
          severity: 'CRITICAL',
        });
      }
    }

    return violations;
  }

  generateEscalationReport(permissions: TenantPermissionRecord[]): EscalationReport {
    const escalationViolations = this.auditPermissionEscalation(permissions);
    const privilegeCreep = this.detectPrivilegeCreep(permissions);
    const allViolations = [...escalationViolations];

    return {
      generatedAtMs: Date.now(),
      totalPermissions: permissions.length,
      violationsFound: allViolations.length,
      violations: allViolations,
      privilegeCreepEntries: privilegeCreep,
      summary:
        allViolations.length === 0
          ? 'No permission escalation violations detected'
          : `Found ${allViolations.length} violation(s) and ${privilegeCreep.length} privilege creep entries`,
    };
  }
}
