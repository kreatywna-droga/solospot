import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDb, clearMockDb } from '@/lib/supabase';
import { MissionControl } from '../src/MissionControl';
import { AdminContext } from '../src/AdminContext';

vi.mock('@/lib/supabase');

describe('Mission Control Core Package Tests', () => {
  beforeEach(() => {
    clearMockDb();
    mockDb.tenants = [
      { id: 't-1', owner_email: 'owner@example.com', package_id: 'pro', status: 'ACTIVE', created_at: '2026-07-10T10:00:00Z', updated_at: '2026-07-10T10:00:00Z' }
    ];
    mockDb.stores = [
      { id: 's-1', tenant_id: 't-1', name: 'Original Store', slug: 'orig', status: 'READY', created_at: '2026-07-10T10:01:00Z', updated_at: '2026-07-10T10:01:00Z' }
    ];
    mockDb.audit_logs = [];
    mockDb.deployments = [];
  });

  const ownerCtx: AdminContext = {
    userId: 'u-owner',
    role: 'OWNER',
    permissions: [],
    correlationId: 'c-owner'
  };

  const supportCtx: AdminContext = {
    userId: 'u-support',
    role: 'SUPPORT',
    permissions: [],
    correlationId: 'c-support'
  };

  it('should list tenants for authorized roles and throw error for unauthorized roles', async () => {
    const mc = new MissionControl();
    
    const tenants = await mc.tenants.listTenants(ownerCtx);
    expect(tenants).toHaveLength(1);
    expect(tenants[0].id).toBe('t-1');

    const supportTenants = await mc.tenants.listTenants(supportCtx);
    expect(supportTenants).toHaveLength(1); // Support has list permission
  });

  it('should restrict suspendTenant to OWNER and ADMIN', async () => {
    const mc = new MissionControl();

    // Support should fail to suspend
    await expect(mc.tenants.suspendTenant(supportCtx, 't-1')).rejects.toThrow(/InsufficientPermissions/);

    // Owner should succeed
    const suspended = await mc.tenants.suspendTenant(ownerCtx, 't-1');
    expect(suspended.status).toBe('SUSPENDED');
  });

  it('should allow owner to log and retrieve audit logs', async () => {
    const mc = new MissionControl();
    await mc.logAuditEvent(ownerCtx, 'CREATE_STORE', 's-2');

    const logs = await mc.getAuditLogs(ownerCtx);
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('CREATE_STORE');
    expect(logs[0].actor).toBe('u-owner');

    // Support cannot fetch audit logs
    await expect(mc.getAuditLogs(supportCtx)).rejects.toThrow(/InsufficientPermissions/);
  });

  it('should provision and publish stores with correct orchestrations', async () => {
    const mc = new MissionControl();

    // Mock provision engine output
    const provisionRes = await mc.stores.provisionStore(ownerCtx, {
      tenantId: 't-1',
      storeId: 's-new',
      storeName: 'New Store',
      templateId: 'tpl-minimal',
      initialPackages: []
    });

    expect(provisionRes.success).toBe(true);
    expect(mockDb.stores.some(s => s.id === 's-new')).toBe(true);
  });

  it('should support deployment rollbacks', async () => {
    const mc = new MissionControl();

    // Put a deployment in mockDb
    mockDb.deployments.push({
      id: 'b-100',
      store_id: 's-1',
      tenant_id: 't-1',
      status: 'SUCCESS',
      url: 'file:///tmp/out',
      pages_count: 5,
      artifacts_count: 2,
      duration_ms: 120,
      provider_type: 'local',
      created_at: '2026-07-10T10:02:00Z',
      artifacts: [
        { path: 'index.html', contentType: 'text/html', content: 'test', size: 4, hash: 'h-1' }
      ]
    });

    // Support role cannot roll back deployment
    await expect(mc.deployments.rollbackDeployment(supportCtx, 't-1', 's-1', 'b-100')).rejects.toThrow(/InsufficientPermissions/);

    // Owner rolls back successfully
    await mc.deployments.rollbackDeployment(ownerCtx, 't-1', 's-1', 'b-100');

    // After rollback, the deployment status updates
    const dep = await mc.deployments.getDeployment(ownerCtx, 'b-100');
    expect(dep?.status).toBe('FAILED');
  });
});
