import { describe, it, expect } from 'vitest';
import { TenantSecurityManager } from './TenantSecurityManager';
import { Organization } from '../../platform-identity/src/PlatformIdentity';

describe('TenantSecurityManager (3-Layer Vertical Slice)', () => {
  const sampleOrg: Organization = {
    id: 'org-test-100',
    name: 'Acme Security Corp',
    slug: 'acme-security',
    ownerId: 'usr-owner-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('should execute 3-layer creation workflow (TenantAdmin -> ContextBuilder -> AuditLogger)', () => {
    const manager = new TenantSecurityManager();
    const result = manager.createTenant({
      organization: sampleOrg,
      tier: 'ENTERPRISE',
      limits: { maxUsers: 500, storageGb: 1000 },
      capabilities: ['BASIC_STORE', 'ADVANCED_ANALYTICS', 'CUSTOM_DOMAIN'],
      primaryDomain: 'acme.enterprise.webfactor.io',
    });

    // Layer 1 Verification (OrganizationManager State)
    expect(result.organization.id).toBe('org-test-100');
    expect(manager.getOrganizationManager().get('org-test-100')).toBeDefined();

    // Layer 2 Verification (TenantContextBuilder Schema & DeepFreeze)
    expect(result.context.tenantId).toBe('org-test-100');
    expect(result.context.plan.tier).toBe('ENTERPRISE');
    expect(result.context.plan.limits.maxUsers).toBe(500);
    expect(result.context.domains.primary).toBe('acme.enterprise.webfactor.io');
    expect(Object.isFrozen(result.context)).toBe(true);
    expect(Object.isFrozen(result.context.plan)).toBe(true);

    // Layer 3 Verification (AuditLogger Trail Entry)
    expect(result.auditLog.organizationId).toBe('org-test-100');
    expect(result.auditLog.action).toBe('TENANT_CREATED');
    expect(result.auditLog.details.tier).toBe('ENTERPRISE');

    const logs = manager.getAuditLogger().query('org-test-100');
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('TENANT_CREATED');
  });

  it('should update tenant status across all 3 layers', () => {
    const manager = new TenantSecurityManager();
    manager.createTenant({ organization: sampleOrg });

    const updated = manager.updateTenantStatus('org-test-100', 'SUSPENDED', 'Billing violation');

    // Layer 1 Update
    expect(updated.organization.id).toBe('org-test-100');

    // Layer 2 Frozen Context Status
    expect(updated.context.status).toBe('SUSPENDED');
    expect(Object.isFrozen(updated.context)).toBe(true);

    // Layer 3 Audit Event
    expect(updated.auditLog.action).toBe('TENANT_STATUS_UPDATED');
    expect(updated.auditLog.details.status).toBe('SUSPENDED');
    expect(updated.auditLog.details.reason).toBe('Billing violation');
  });

  it('should log critical audit entry on tenant deletion', () => {
    const manager = new TenantSecurityManager();
    manager.createTenant({ organization: sampleOrg });

    const deleted = manager.deleteTenant('org-test-100', 'Admin request');
    expect(deleted).toBe(true);

    expect(manager.getOrganizationManager().get('org-test-100')).toBeUndefined();

    const logs = manager.getAuditLogger().query('org-test-100', 'TENANT_DELETED');
    expect(logs.length).toBe(1);
    expect(logs[0].resource).toBe('security');
  });

  // ADVERSARIAL TEST 1: Invalid input rejection
  it('should throw error and reject invalid tenant organization payload', () => {
    const manager = new TenantSecurityManager();
    const invalidOrg = { id: '', name: '', slug: '' } as Organization;

    expect(() => manager.createTenant({ organization: invalidOrg })).toThrow(
      'Organization id, slug, and name are required'
    );
  });

  // ADVERSARIAL TEST 2: Immutability enforcement
  it('should prevent runtime mutation of returned TenantContext object', () => {
    const manager = new TenantSecurityManager();
    const { context } = manager.createTenant({ organization: sampleOrg });

    expect(() => {
      (context as any).status = 'MUTATED_STATUS';
    }).toThrow();
  });

  // ADVERSARIAL TEST 3: Update non-existent tenant error handling
  it('should throw explicit error when updating non-existent tenant', () => {
    const manager = new TenantSecurityManager();
    expect(() => manager.updateTenantStatus('non-existent-id', 'SUSPENDED', 'Test')).toThrow(
      "Organization with id 'non-existent-id' not found"
    );
  });

  // CONTROLLED FAILURE INJECTION & ROLLBACK VERIFICATION TEST
  it('should perform clean rollback of Layer 1 mutation if Layer 2 context validation fails', () => {
    const manager = new TenantSecurityManager();

    // Invalid tier enum causing TenantContextBuilder schema validation to throw
    const malformedOrg: Organization = {
      id: 'org-malformed-1',
      name: 'Malformed Corp',
      slug: 'malformed-corp',
      ownerId: 'usr-owner-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(() =>
      manager.createTenant({
        organization: malformedOrg,
        tier: 'INVALID_SUPER_TIER' as any,
      })
    ).toThrow('Invalid tenant context configuration');

    // Rollback Verification: Organization must NOT remain saved in Layer 1
    expect(manager.getOrganizationManager().get('org-malformed-1')).toBeUndefined();

    // Rollback Verification: Audit logger must contain 0 entries for failed tenant creation
    const logs = manager.getAuditLogger().query('org-malformed-1');
    expect(logs.length).toBe(0);
  });
});
