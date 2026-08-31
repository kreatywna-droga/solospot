/**
 * PermissionBoundaryIntegrator — G1-188
 *
 * Manages role definitions and permission boundaries, enforcing that
 * DENY permissions always take precedence over ALLOW.
 */

// ---------------------------------------------------------------------------
// Permission & Role Types
// ---------------------------------------------------------------------------

export interface Permission {
  readonly permissionId: string;
  readonly resource: string;
  readonly action: string;
  readonly effect: 'ALLOW' | 'DENY';
}

export interface RoleDefinition {
  readonly roleId: string;
  readonly permissions: Permission[];
  readonly inheritsFrom?: string[];
}

// ---------------------------------------------------------------------------
// Report Types
// ---------------------------------------------------------------------------

export interface PermissionCheckResult {
  readonly roleId: string;
  readonly resource: string;
  readonly action: string;
  readonly allowed: boolean;
  readonly matchedPermission?: Permission;
  readonly reason: string;
}

export interface ConflictingPermission {
  readonly permissionA: Permission;
  readonly permissionB: Permission;
  readonly resource: string;
  readonly action: string;
}

export interface BoundaryViolation {
  readonly roleId: string;
  readonly violations: string[];
}

export interface PermissionReport {
  readonly generatedAtMs: number;
  readonly totalRoles: number;
  readonly totalPermissions: number;
  readonly conflicts: ConflictingPermission[];
  readonly boundaryViolations: BoundaryViolation[];
  readonly roleSummaries: Array<{
    roleId: string;
    permissionCount: number;
    inheritedPermissionCount: number;
    conflictCount: number;
  }>;
}

// ---------------------------------------------------------------------------
// Permission Boundary Integrator
// ---------------------------------------------------------------------------

export class PermissionBoundaryIntegrator {
  private roles = new Map<string, RoleDefinition>();

  /**
   * Registers a role definition.
   */
  defineRole(role: RoleDefinition): void {
    if (!role.roleId || role.roleId.trim().length === 0) {
      throw new Error('roleId must be a non-empty string');
    }
    this.roles.set(role.roleId, { ...role, permissions: [...role.permissions] });
  }

  /**
   * Adds a permission to an existing role.
   */
  addPermission(roleId: string, permission: Permission): void {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role "${roleId}" not found`);
    }
    role.permissions.push(permission);
  }

  /**
   * Removes a permission by permissionId from a role.
   */
  removePermission(roleId: string, permissionId: string): boolean {
    const role = this.roles.get(roleId);
    if (!role) return false;
    const idx = role.permissions.findIndex(p => p.permissionId === permissionId);
    if (idx === -1) return false;
    role.permissions.splice(idx, 1);
    return true;
  }

  /**
   * Checks if a role has permission for a resource+action.
   * DENY always takes precedence over ALLOW.
   */
  checkPermission(roleId: string, resource: string, action: string): PermissionCheckResult {
    const effective = this.getEffectivePermissions(roleId);
    const matching = effective.filter(
      p => p.resource === resource && (p.action === action || p.action === '*'),
    );

    if (matching.length === 0) {
      return {
        roleId,
        resource,
        action,
        allowed: false,
        reason: 'No matching permission found',
      };
    }

    const denyMatch = matching.find(p => p.effect === 'DENY');
    if (denyMatch) {
      return {
        roleId,
        resource,
        action,
        allowed: false,
        matchedPermission: denyMatch,
        reason: 'DENY permission matched',
      };
    }

    const allowMatch = matching.find(p => p.effect === 'ALLOW');
    return {
      roleId,
      resource,
      action,
      allowed: true,
      matchedPermission: allowMatch,
      reason: 'ALLOW permission matched',
    };
  }

  /**
   * Returns all permissions for a role, including inherited ones.
   * Inherited permissions come first; role's own permissions override.
   */
  getEffectivePermissions(roleId: string): Permission[] {
    const role = this.roles.get(roleId);
    if (!role) return [];

    const inherited: Permission[] = [];
    if (role.inheritsFrom) {
      for (const parentRoleId of role.inheritsFrom) {
        const parentPerms = this.getEffectivePermissions(parentRoleId);
        inherited.push(...parentPerms);
      }
    }

    return [...inherited, ...role.permissions];
  }

  /**
   * Finds ALLOW and DENY conflicts for the same resource+action within a role.
   */
  detectConflictingPermissions(roleId: string): ConflictingPermission[] {
    const effective = this.getEffectivePermissions(roleId);
    const conflicts: ConflictingPermission[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < effective.length; i++) {
      for (let j = i + 1; j < effective.length; j++) {
        const a = effective[i];
        const b = effective[j];
        if (
          a.resource === b.resource &&
          a.action === b.action &&
          a.effect !== b.effect
        ) {
          const key = [a.permissionId, b.permissionId].sort().join('|');
          if (!seen.has(key)) {
            seen.add(key);
            conflicts.push({
              permissionA: a,
              permissionB: b,
              resource: a.resource,
              action: a.action,
            });
          }
        }
      }
    }
    return conflicts;
  }

  /**
   * Checks all roles satisfy boundary constraints (no unresolvable conflicts).
   */
  validateBoundaryCompliance(rolesToCheck?: string[]): BoundaryViolation[] {
    const roleIds = rolesToCheck ?? [...this.roles.keys()];
    const violations: BoundaryViolation[] = [];

    for (const roleId of roleIds) {
      const conflicts = this.detectConflictingPermissions(roleId);
      if (conflicts.length > 0) {
        violations.push({
          roleId,
          violations: conflicts.map(
            c => `Conflict on ${c.resource}:${c.action} between ${c.permissionA.effect} and ${c.permissionB.effect}`,
          ),
        });
      }
    }
    return violations;
  }

  /**
   * Generates a comprehensive permission report.
   */
  generatePermissionReport(): PermissionReport {
    const allConflicts: ConflictingPermission[] = [];
    const boundaryViolations: BoundaryViolation[] = [];
    const roleSummaries: PermissionReport['roleSummaries'] = [];

    for (const [roleId, role] of this.roles) {
      const conflicts = this.detectConflictingPermissions(roleId);
      allConflicts.push(...conflicts);

      const inheritedCount = role.inheritsFrom
        ? role.inheritsFrom.reduce(
            (sum, pid) => sum + this.getEffectivePermissions(pid).length,
            0,
          )
        : 0;

      if (conflicts.length > 0) {
        boundaryViolations.push({
          roleId,
          violations: conflicts.map(
            c => `Conflict on ${c.resource}:${c.action}`,
          ),
        });
      }

      roleSummaries.push({
        roleId,
        permissionCount: role.permissions.length,
        inheritedPermissionCount: inheritedCount,
        conflictCount: conflicts.length,
      });
    }

    const totalPermissions = [...this.roles.values()].reduce(
      (sum, r) => sum + r.permissions.length,
      0,
    );

    return {
      generatedAtMs: Date.now(),
      totalRoles: this.roles.size,
      totalPermissions,
      conflicts: allConflicts,
      boundaryViolations,
      roleSummaries,
    };
  }
}
