/**
 * TenantPermissionEscalationAuditG1205.test.ts — G1-205 Tenant Permission Escalation Audit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TenantPermissionEscalationAuditor,
  TenantPermissionRecord,
  RoleDefinition,
} from '../TenantPermissionEscalationAudit';

function makePerm(userId: string, tenantId: string, permissions: string[], overrides?: Partial<TenantPermissionRecord>): TenantPermissionRecord {
  return {
    tenantId,
    userId,
    roleId: 'role-1',
    permissions,
    grantedAtMs: 1000,
    grantedBy: 'admin-1',
    ...overrides,
  };
}

function makeRole(roleId: string, tenantId: string, level: number, parentRoleId?: string): RoleDefinition {
  return { roleId, tenantId, level, parentRoleId };
}

describe('TenantPermissionEscalationAuditor', () => {
  let auditor: TenantPermissionEscalationAuditor;

  beforeEach(() => {
    auditor = new TenantPermissionEscalationAuditor();
  });

  // ── auditPermissionEscalation ──

  describe('auditPermissionEscalation()', () => {
    it('returns no violations for normal permissions', () => {
      const perms = [makePerm('u1', 't1', ['read', 'write'])];
      const violations = auditor.auditPermissionEscalation(perms);
      expect(violations).toHaveLength(0);
    });

    it('detects unauthorized superadmin grant', () => {
      const perms = [makePerm('u1', 't1', ['superadmin'], { grantedBy: 'regular-user' })];
      const violations = auditor.auditPermissionEscalation(perms);
      expect(violations).toHaveLength(1);
      expect(violations[0].violationType).toBe('UNAUTHORIZED_ADMIN_GRANT');
      expect(violations[0].severity).toBe('CRITICAL');
    });

    it('allows superadmin grant by system', () => {
      const perms = [makePerm('u1', 't1', ['superadmin'], { grantedBy: 'system' })];
      const violations = auditor.auditPermissionEscalation(perms);
      expect(violations).toHaveLength(0);
    });

    it('allows superadmin grant by superadmin', () => {
      const perms = [makePerm('u1', 't1', ['superadmin'], { grantedBy: 'superadmin' })];
      const violations = auditor.auditPermissionEscalation(perms);
      expect(violations).toHaveLength(0);
    });

    it('detects excessive permissions', () => {
      const perms = [makePerm('u1', 't1', Array.from({ length: 16 }, (_, i) => `perm-${i}`))];
      const violations = auditor.auditPermissionEscalation(perms);
      expect(violations.some(v => v.violationType === 'EXCESSIVE_PERMISSIONS')).toBe(true);
    });

    it('does not flag 15 permissions as excessive', () => {
      const perms = [makePerm('u1', 't1', Array.from({ length: 15 }, (_, i) => `perm-${i}`))];
      const violations = auditor.auditPermissionEscalation(perms);
      expect(violations.some(v => v.violationType === 'EXCESSIVE_PERMISSIONS')).toBe(false);
    });

    it('detects missing grantor', () => {
      const perms = [makePerm('u1', 't1', ['read'], { grantedBy: '' })];
      const violations = auditor.auditPermissionEscalation(perms);
      expect(violations.some(v => v.violationType === 'MISSING_GRANTOR')).toBe(true);
    });

    it('detects missing grantor with whitespace', () => {
      const perms = [makePerm('u1', 't1', ['read'], { grantedBy: '  ' })];
      const violations = auditor.auditPermissionEscalation(perms);
      expect(violations.some(v => v.violationType === 'MISSING_GRANTOR')).toBe(true);
    });

    it('detects admin.all unauthorized grant', () => {
      const perms = [makePerm('u1', 't1', ['admin.all'], { grantedBy: 'hacker' })];
      const violations = auditor.auditPermissionEscalation(perms);
      expect(violations.some(v => v.violationType === 'UNAUTHORIZED_ADMIN_GRANT')).toBe(true);
    });

    it('returns empty for empty permissions', () => {
      const violations = auditor.auditPermissionEscalation([]);
      expect(violations).toHaveLength(0);
    });
  });

  // ── detectPrivilegeCreep ──

  describe('detectPrivilegeCreep()', () => {
    it('returns empty when permissions below threshold', () => {
      const perms = [makePerm('u1', 't1', ['read', 'write'])];
      const entries = auditor.detectPrivilegeCreep(perms);
      expect(entries).toHaveLength(0);
    });

    it('detects user with accumulated excessive permissions', () => {
      const perms = Array.from({ length: 25 }, (_, i) =>
        makePerm('u1', 't1', [`perm-${i}`], { roleId: `role-${i % 5}` }),
      );
      const entries = auditor.detectPrivilegeCreep(perms);
      expect(entries).toHaveLength(1);
      expect(entries[0].totalPermissions).toBe(25);
    });

    it('groups permissions by tenant and user', () => {
      const perms = [
        makePerm('u1', 't1', ['read']),
        makePerm('u1', 't2', ['write']),
      ];
      const entries = auditor.detectPrivilegeCreep(perms);
      expect(entries).toHaveLength(0);
    });

    it('collects unique roles', () => {
      const perms = Array.from({ length: 25 }, (_, i) =>
        makePerm('u1', 't1', [`perm-${i}`], { roleId: `role-${i % 3}` }),
      );
      const entries = auditor.detectPrivilegeCreep(perms);
      expect(entries[0].roles.length).toBeLessThanOrEqual(3);
    });

    it('returns empty for empty permissions', () => {
      const entries = auditor.detectPrivilegeCreep([]);
      expect(entries).toHaveLength(0);
    });

    it('sorts entries by totalPermissions descending', () => {
      const perms = [
        ...Array.from({ length: 25 }, (_, i) => makePerm('u1', 't1', [`p-${i}`])),
        ...Array.from({ length: 30 }, (_, i) => makePerm('u2', 't1', [`p-${i}`])),
      ];
      const entries = auditor.detectPrivilegeCreep(perms);
      expect(entries[0].totalPermissions).toBeGreaterThanOrEqual(entries[1].totalPermissions);
    });
  });

  // ── validatePermissionHierarchy ──

  describe('validatePermissionHierarchy()', () => {
    it('returns no violations for valid hierarchy', () => {
      const roles = [makeRole('admin', 't1', 0), makeRole('editor', 't1', 1, 'admin')];
      const violations = auditor.validatePermissionHierarchy(roles);
      expect(violations).toHaveLength(0);
    });

    it('detects missing parent role', () => {
      const roles = [makeRole('editor', 't1', 1, 'nonexistent')];
      const violations = auditor.validatePermissionHierarchy(roles);
      expect(violations.some(v => v.violationType === 'MISSING_PARENT_ROLE')).toBe(true);
    });

    it('detects hierarchy violation when parent has higher level', () => {
      const roles = [makeRole('admin', 't1', 2), makeRole('superadmin', 't1', 1, 'admin')];
      const violations = auditor.validatePermissionHierarchy(roles);
      expect(violations.some(v => v.violationType === 'HIERARCHY_VIOLATION')).toBe(true);
    });

    it('detects duplicate role definition', () => {
      const roles = [makeRole('admin', 't1', 1), makeRole('admin', 't1', 2)];
      const violations = auditor.validatePermissionHierarchy(roles);
      expect(violations.some(v => v.violationType === 'DUPLICATE_ROLE')).toBe(true);
    });

    it('does not flag roles in different tenants', () => {
      const roles = [makeRole('admin', 't1', 1), makeRole('admin', 't2', 1)];
      const violations = auditor.validatePermissionHierarchy(roles);
      expect(violations.some(v => v.violationType === 'DUPLICATE_ROLE')).toBe(false);
    });

    it('returns empty for empty roles', () => {
      const violations = auditor.validatePermissionHierarchy([]);
      expect(violations).toHaveLength(0);
    });

    it('returns empty for roles without parents', () => {
      const roles = [makeRole('viewer', 't1', 0), makeRole('editor', 't1', 1)];
      const violations = auditor.validatePermissionHierarchy(roles);
      expect(violations).toHaveLength(0);
    });
  });

  // ── detectCrossTenantPermissionLeakage ──

  describe('detectCrossTenantPermissionLeakage()', () => {
    it('returns no violations for valid permissions', () => {
      const perms = [makePerm('u1', 't1', ['read'])];
      const violations = auditor.detectCrossTenantPermissionLeakage(perms);
      expect(violations).toHaveLength(0);
    });

    it('detects missing tenant context', () => {
      const perms = [makePerm('u1', '', ['read'])];
      const violations = auditor.detectCrossTenantPermissionLeakage(perms);
      expect(violations).toHaveLength(1);
      expect(violations[0].violationType).toBe('MISSING_TENANT_CONTEXT');
    });

    it('detects whitespace tenant context', () => {
      const perms = [makePerm('u1', '  ', ['read'])];
      const violations = auditor.detectCrossTenantPermissionLeakage(perms);
      expect(violations).toHaveLength(1);
    });

    it('returns empty for empty permissions', () => {
      const violations = auditor.detectCrossTenantPermissionLeakage([]);
      expect(violations).toHaveLength(0);
    });
  });

  // ── generateEscalationReport ──

  describe('generateEscalationReport()', () => {
    it('generates report with correct permission count', () => {
      const perms = [makePerm('u1', 't1', ['read']), makePerm('u2', 't1', ['write'])];
      const report = auditor.generateEscalationReport(perms);
      expect(report.totalPermissions).toBe(2);
    });

    it('reports no violations for normal permissions', () => {
      const perms = [makePerm('u1', 't1', ['read'])];
      const report = auditor.generateEscalationReport(perms);
      expect(report.violationsFound).toBe(0);
      expect(report.summary).toContain('No permission escalation');
    });

    it('reports violations when found', () => {
      const perms = [makePerm('u1', 't1', ['superadmin'], { grantedBy: 'hacker' })];
      const report = auditor.generateEscalationReport(perms);
      expect(report.violationsFound).toBeGreaterThan(0);
    });

    it('includes privilege creep entries', () => {
      const perms = Array.from({ length: 25 }, (_, i) =>
        makePerm('u1', 't1', [`perm-${i}`], { roleId: `role-${i % 3}` }),
      );
      const report = auditor.generateEscalationReport(perms);
      expect(report.privilegeCreepEntries).toHaveLength(1);
    });

    it('includes generatedAtMs', () => {
      const before = Date.now();
      const report = auditor.generateEscalationReport([]);
      const after = Date.now();
      expect(report.generatedAtMs).toBeGreaterThanOrEqual(before);
      expect(report.generatedAtMs).toBeLessThanOrEqual(after);
    });

    it('returns empty report for no permissions', () => {
      const report = auditor.generateEscalationReport([]);
      expect(report.totalPermissions).toBe(0);
      expect(report.violationsFound).toBe(0);
    });

    it('includes violations array in report', () => {
      const perms = [makePerm('u1', 't1', ['superadmin'], { grantedBy: 'hacker' })];
      const report = auditor.generateEscalationReport(perms);
      expect(report.violations.length).toBeGreaterThan(0);
    });

    it('summary includes both violations and creep counts', () => {
      const perms = [
        makePerm('u1', 't1', ['superadmin'], { grantedBy: 'hacker' }),
        ...Array.from({ length: 25 }, (_, i) => makePerm('u2', 't1', [`perm-${i}`])),
      ];
      const report = auditor.generateEscalationReport(perms);
      expect(report.summary).toContain('violation');
      expect(report.summary).toContain('privilege creep');
    });
  });
});
