/**
 * PermissionBoundaryIntegratorG1188.test.ts — G1-188 Permission Boundary Integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PermissionBoundaryIntegrator,
  Permission,
  RoleDefinition,
} from '../PermissionBoundaryIntegrator';

function perm(
  id: string,
  resource: string,
  action: string,
  effect: 'ALLOW' | 'DENY' = 'ALLOW',
): Permission {
  return { permissionId: id, resource, action, effect };
}

function role(
  id: string,
  permissions: Permission[] = [],
  inheritsFrom?: string[],
): RoleDefinition {
  return { roleId: id, permissions, inheritsFrom };
}

describe('PermissionBoundaryIntegrator', () => {
  let integrator: PermissionBoundaryIntegrator;

  beforeEach(() => {
    integrator = new PermissionBoundaryIntegrator();
  });

  // ── defineRole ──

  describe('defineRole()', () => {
    it('registers a role', () => {
      integrator.defineRole(role('admin', [perm('p1', 'users', 'read')]));
      const report = integrator.generatePermissionReport();
      expect(report.totalRoles).toBe(1);
    });

    it('throws on empty roleId', () => {
      expect(() => integrator.defineRole(role(''))).toThrow('roleId must be a non-empty string');
    });

    it('throws on whitespace-only roleId', () => {
      expect(() => integrator.defineRole(role('   '))).toThrow('roleId must be a non-empty string');
    });

    it('overwrites existing role with same id', () => {
      integrator.defineRole(role('r1', [perm('p1', 'a', 'read')]));
      integrator.defineRole(role('r1', [perm('p2', 'b', 'write')]));
      const result = integrator.checkPermission('r1', 'b', 'write');
      expect(result.allowed).toBe(true);
    });
  });

  // ── addPermission ──

  describe('addPermission()', () => {
    it('adds a permission to a role', () => {
      integrator.defineRole(role('r1'));
      integrator.addPermission('r1', perm('p1', 'files', 'read'));
      const result = integrator.checkPermission('r1', 'files', 'read');
      expect(result.allowed).toBe(true);
    });

    it('throws for non-existent role', () => {
      expect(() => integrator.addPermission('missing', perm('p1', 'a', 'read'))).toThrow(
        'Role "missing" not found',
      );
    });
  });

  // ── removePermission ──

  describe('removePermission()', () => {
    it('removes a permission', () => {
      integrator.defineRole(role('r1', [perm('p1', 'a', 'read')]));
      expect(integrator.removePermission('r1', 'p1')).toBe(true);
      const result = integrator.checkPermission('r1', 'a', 'read');
      expect(result.allowed).toBe(false);
    });

    it('returns false for non-existent role', () => {
      expect(integrator.removePermission('missing', 'p1')).toBe(false);
    });

    it('returns false for non-existent permission', () => {
      integrator.defineRole(role('r1'));
      expect(integrator.removePermission('r1', 'missing')).toBe(false);
    });
  });

  // ── checkPermission ──

  describe('checkPermission()', () => {
    it('returns allowed=true for matching ALLOW permission', () => {
      integrator.defineRole(role('r1', [perm('p1', 'users', 'read', 'ALLOW')]));
      const result = integrator.checkPermission('r1', 'users', 'read');
      expect(result.allowed).toBe(true);
      expect(result.matchedPermission?.permissionId).toBe('p1');
    });

    it('returns allowed=false when no permission matches', () => {
      integrator.defineRole(role('r1', []));
      const result = integrator.checkPermission('r1', 'users', 'read');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('No matching permission');
    });

    it('DENY takes precedence over ALLOW', () => {
      integrator.defineRole(
        role('r1', [
          perm('p1', 'users', 'read', 'ALLOW'),
          perm('p2', 'users', 'read', 'DENY'),
        ]),
      );
      const result = integrator.checkPermission('r1', 'users', 'read');
      expect(result.allowed).toBe(false);
      expect(result.matchedPermission?.effect).toBe('DENY');
    });

    it('wildcard action matches any action', () => {
      integrator.defineRole(role('r1', [perm('p1', 'files', '*', 'ALLOW')]));
      const result = integrator.checkPermission('r1', 'files', 'delete');
      expect(result.allowed).toBe(true);
    });

    it('returns reason string', () => {
      integrator.defineRole(role('r1', [perm('p1', 'a', 'b', 'ALLOW')]));
      const result = integrator.checkPermission('r1', 'a', 'b');
      expect(typeof result.reason).toBe('string');
    });
  });

  // ── getEffectivePermissions ──

  describe('getEffectivePermissions()', () => {
    it('returns empty array for non-existent role', () => {
      expect(integrator.getEffectivePermissions('missing')).toEqual([]);
    });

    it('returns direct permissions', () => {
      integrator.defineRole(role('r1', [perm('p1', 'a', 'read')]));
      const perms = integrator.getEffectivePermissions('r1');
      expect(perms).toHaveLength(1);
      expect(perms[0].permissionId).toBe('p1');
    });

    it('includes inherited permissions', () => {
      integrator.defineRole(role('parent', [perm('p1', 'a', 'read')]));
      integrator.defineRole(role('child', [perm('p2', 'b', 'write')], ['parent']));
      const perms = integrator.getEffectivePermissions('child');
      expect(perms).toHaveLength(2);
    });

    it('child permissions override inherited', () => {
      integrator.defineRole(role('parent', [perm('p1', 'a', 'read', 'ALLOW')]));
      integrator.defineRole(
        role('child', [perm('p2', 'a', 'read', 'DENY')], ['parent']),
      );
      const perms = integrator.getEffectivePermissions('child');
      const last = perms[perms.length - 1];
      expect(last.effect).toBe('DENY');
    });
  });

  // ── detectConflictingPermissions ──

  describe('detectConflictingPermissions()', () => {
    it('returns empty when no conflicts', () => {
      integrator.defineRole(role('r1', [perm('p1', 'a', 'read', 'ALLOW')]));
      expect(integrator.detectConflictingPermissions('r1')).toEqual([]);
    });

    it('detects ALLOW vs DENY conflict', () => {
      integrator.defineRole(
        role('r1', [
          perm('p1', 'files', 'delete', 'ALLOW'),
          perm('p2', 'files', 'delete', 'DENY'),
        ]),
      );
      const conflicts = integrator.detectConflictingPermissions('r1');
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].resource).toBe('files');
      expect(conflicts[0].action).toBe('delete');
    });

    it('detects conflict across inherited permissions', () => {
      integrator.defineRole(role('parent', [perm('p1', 'a', 'r', 'ALLOW')]));
      integrator.defineRole(
        role('child', [perm('p2', 'a', 'r', 'DENY')], ['parent']),
      );
      const conflicts = integrator.detectConflictingPermissions('child');
      expect(conflicts).toHaveLength(1);
    });

    it('deduplicates conflict pairs', () => {
      integrator.defineRole(
        role('r1', [
          perm('p1', 'a', 'r', 'ALLOW'),
          perm('p2', 'a', 'r', 'DENY'),
          perm('p3', 'a', 'r', 'ALLOW'),
        ]),
      );
      const conflicts = integrator.detectConflictingPermissions('r1');
      expect(conflicts.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── validateBoundaryCompliance ──

  describe('validateBoundaryCompliance()', () => {
    it('returns empty when no violations', () => {
      integrator.defineRole(role('r1', [perm('p1', 'a', 'read', 'ALLOW')]));
      expect(integrator.validateBoundaryCompliance()).toEqual([]);
    });

    it('detects violations in a role', () => {
      integrator.defineRole(
        role('r1', [
          perm('p1', 'a', 'read', 'ALLOW'),
          perm('p2', 'a', 'read', 'DENY'),
        ]),
      );
      const violations = integrator.validateBoundaryCompliance();
      expect(violations).toHaveLength(1);
      expect(violations[0].roleId).toBe('r1');
    });

    it('validates specific roles when IDs provided', () => {
      integrator.defineRole(role('clean', [perm('p1', 'a', 'read', 'ALLOW')]));
      integrator.defineRole(
        role('dirty', [
          perm('p1', 'a', 'read', 'ALLOW'),
          perm('p2', 'a', 'read', 'DENY'),
        ]),
      );
      const violations = integrator.validateBoundaryCompliance(['clean']);
      expect(violations).toHaveLength(0);
    });
  });

  // ── generatePermissionReport ──

  describe('generatePermissionReport()', () => {
    it('reports correct totalRoles', () => {
      integrator.defineRole(role('r1'));
      integrator.defineRole(role('r2'));
      const report = integrator.generatePermissionReport();
      expect(report.totalRoles).toBe(2);
    });

    it('reports correct totalPermissions', () => {
      integrator.defineRole(
        role('r1', [perm('p1', 'a', 'read'), perm('p2', 'b', 'write')]),
      );
      const report = integrator.generatePermissionReport();
      expect(report.totalPermissions).toBe(2);
    });

    it('includes conflicts in report', () => {
      integrator.defineRole(
        role('r1', [
          perm('p1', 'a', 'r', 'ALLOW'),
          perm('p2', 'a', 'r', 'DENY'),
        ]),
      );
      const report = integrator.generatePermissionReport();
      expect(report.conflicts.length).toBeGreaterThan(0);
    });

    it('includes roleSummaries', () => {
      integrator.defineRole(role('r1', [perm('p1', 'a', 'r')]));
      const report = integrator.generatePermissionReport();
      expect(report.roleSummaries).toHaveLength(1);
      expect(report.roleSummaries[0].permissionCount).toBe(1);
    });

    it('includes generatedAtMs', () => {
      const before = Date.now();
      const report = integrator.generatePermissionReport();
      expect(report.generatedAtMs).toBeGreaterThanOrEqual(before);
    });
  });
});
