import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import {
  MissionControlRuntime,
  MissionControlAdapterPort,
  AdminProfile,
} from './MissionControlRuntime';
import {
  MissionControlContext,
  ManagedTenant,
  RuntimeSnapshot,
  DiagnosticsSnapshot,
  PlatformEventEntry,
  ApiKeyEntry,
  AuditLogEntry,
  PlatformStats,
  InsufficientPermissionsException,
  MissionControlAuthException,
  NewTenantRequest,
} from './MissionControlContext';
import {
  OverviewView,
  TenantListView,
  RuntimeInspectorView,
  RuntimeDiagnosticsView,
  EventTimelineView,
  SecurityCenterView,
} from './MissionControlComponents';

describe('Mission Control', () => {
  let runtime: MissionControlRuntime;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;

  // ── Fixtures ───────────────────────────────────────────────────────────────

  const SUPER_TOKEN = 'tok_super_admin';
  const SUPPORT_TOKEN = 'tok_support';
  const READONLY_TOKEN = 'tok_readonly';

  const superAdminProfile: AdminProfile = { adminId: 'admin-001', adminEmail: 'super@solospot.com', role: 'SUPER_ADMIN' };
  const supportProfile: AdminProfile = { adminId: 'admin-002', adminEmail: 'support@solospot.com', role: 'SUPPORT' };
  const readonlyProfile: AdminProfile = { adminId: 'admin-003', adminEmail: 'viewer@solospot.com', role: 'READ_ONLY' };

  const platformStats: PlatformStats = {
    totalTenants: 42,
    activeTenants: 38,
    suspendedTenants: 4,
    totalOrdersToday: 157,
    errorRatePercent: 0.12,
    avgResponseTimeMs: 84,
  };

  const sampleTenants: ManagedTenant[] = [
    { tenantId: 'tenant-a', slug: 'shop-a', domain: 'shop-a.solospot.com', plan: 'GROWTH', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z' },
    { tenantId: 'tenant-b', slug: 'shop-b', domain: 'shop-b.solospot.com', plan: 'FREE', status: 'SUSPENDED', createdAt: '2026-02-15T00:00:00Z' },
  ];

  const sampleSnapshot: RuntimeSnapshot = {
    tenantId: 'tenant-a',
    slug: 'shop-a',
    status: 'ACTIVE',
    capabilities: ['commerce', 'payments', 'shipping'],
    packages: [{ id: 'core-store', version: '1.0.0' }, { id: 'analytics', version: '2.1.0' }],
    themeId: 'theme_minimal',
    runtimeHash: 'fd48e3683d4410f6622fa8b51d9bd5696036953786763c7fe9d70798b9889532',
  };

  const sampleDiagnostics: DiagnosticsSnapshot = {
    bootstrapStatus: 'READY',
    activeRuntimes: 12,
    memoryUsageMB: 256,
    eventQueueDepth: 3,
    lastEventAt: '2026-07-10T15:00:00Z',
    errorRatePercent: 0.12,
    avgResponseTimeMs: 84,
  };

  const sampleEvents: PlatformEventEntry[] = [
    { eventId: 'e1', eventType: 'Order.Created', tenantId: 'tenant-a', timestamp: '2026-07-10T15:01:00Z', correlationId: 'corr-001', payload: {} },
    { eventId: 'e2', eventType: 'Payment.Completed', tenantId: 'tenant-a', timestamp: '2026-07-10T15:02:00Z', correlationId: 'corr-002', payload: {} },
    { eventId: 'e3', eventType: 'Bootstrap.Ready', tenantId: 'platform', timestamp: '2026-07-10T14:00:00Z', correlationId: 'corr-003', payload: {} },
  ];

  const sampleApiKeys: ApiKeyEntry[] = [
    { keyId: 'key-001', tenantId: null, label: 'Platform Key', prefix: 'wf_live_****', createdAt: '2026-01-01T00:00:00Z', lastUsedAt: '2026-07-10T12:00:00Z' },
  ];

  const sampleAuditLog: AuditLogEntry[] = [
    { entryId: 'audit-1', adminId: 'admin-001', action: 'createTenant', targetId: 'tenant-a', targetType: 'tenant', timestamp: '2026-07-10T10:00:00Z', details: {} },
  ];

  // ── Mock Adapter ──────────────────────────────────────────────────────────

  const mockAdapter: MissionControlAdapterPort = {
    verifyAdminSession: vi.fn(),
    getPlatformStats: vi.fn().mockResolvedValue(platformStats),
    listTenants: vi.fn().mockResolvedValue(sampleTenants),
    getTenantById: vi.fn().mockImplementation(async (id) => sampleTenants.find((t) => t.tenantId === id) ?? null),
    getRuntimeSnapshot: vi.fn().mockResolvedValue(sampleSnapshot),
    createTenant: vi.fn().mockImplementation(async (req: NewTenantRequest) => ({
      tenantId: `tenant-new-${Date.now()}`,
      slug: req.slug,
      domain: req.domain,
      plan: req.plan,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
    })),
    suspendTenant: vi.fn().mockImplementation(async (id) => ({ ...sampleTenants[0], tenantId: id, status: 'SUSPENDED' as const })),
    restoreTenant: vi.fn().mockImplementation(async (id) => ({ ...sampleTenants[0], tenantId: id, status: 'ACTIVE' as const })),
    archiveTenant: vi.fn().mockImplementation(async (id) => ({ ...sampleTenants[0], tenantId: id, status: 'ARCHIVED' as const })),
    deleteTenant: vi.fn().mockResolvedValue(undefined),
    enablePackage: vi.fn().mockResolvedValue(undefined),
    disablePackage: vi.fn().mockResolvedValue(undefined),
    getDiagnostics: vi.fn().mockResolvedValue(sampleDiagnostics),
    getEventTimeline: vi.fn().mockResolvedValue([...sampleEvents]),
    getApiKeys: vi.fn().mockResolvedValue(sampleApiKeys),
    rotateApiKey: vi.fn().mockResolvedValue({ ...sampleApiKeys[0], keyId: 'key-002', prefix: 'wf_live_####' }),
    getAuditLog: vi.fn().mockResolvedValue(sampleAuditLog),
  };

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();

    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);

    runtime = new MissionControlRuntime({ eventBus, logger, adapter: mockAdapter });

    vi.mocked(mockAdapter.verifyAdminSession).mockImplementation(async (token) => {
      if (token === SUPER_TOKEN) return superAdminProfile;
      if (token === SUPPORT_TOKEN) return supportProfile;
      if (token === READONLY_TOKEN) return readonlyProfile;
      return null;
    });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  // ── Test 1: Session Init + Stats ─────────────────────────────────────────

  it('Should open admin session and return frozen MissionControlContext with platform stats', async () => {
    const ctx = await runtime.openSession(SUPER_TOKEN);

    expect(ctx.currentView).toBe('overview');
    expect(ctx.role).toBe('SUPER_ADMIN');
    expect(ctx.adminEmail).toBe('super@solospot.com');
    expect(ctx.platformStats.totalTenants).toBe(42);
    expect(ctx.platformStats.activeTenants).toBe(38);
    expect(Object.isFrozen(ctx)).toBe(true);
    expect(Object.isFrozen(ctx.platformStats)).toBe(true);
  });

  // ── Test 2: Tenant CRUD + Role Guard ─────────────────────────────────────

  it('SUPER_ADMIN can create, suspend, restore, and archive a tenant', async () => {
    await runtime.openSession(SUPER_TOKEN);

    const newTenant = await runtime.createTenant(SUPER_TOKEN, {
      slug: 'shop-new',
      domain: 'shop-new.solospot.com',
      plan: 'GROWTH',
      themeId: 'theme_minimal',
      packages: ['core-store'],
    });
    expect(newTenant.slug).toBe('shop-new');
    expect(newTenant.status).toBe('ACTIVE');

    const suspended = await runtime.suspendTenant(SUPER_TOKEN, 'tenant-a');
    expect(suspended.status).toBe('SUSPENDED');

    const restored = await runtime.restoreTenant(SUPER_TOKEN, 'tenant-a');
    expect(restored.status).toBe('ACTIVE');

    const archived = await runtime.archiveTenant(SUPER_TOKEN, 'tenant-a');
    expect(archived.status).toBe('ARCHIVED');
  });

  it('READ_ONLY role cannot create, suspend, or delete tenants', async () => {
    await runtime.openSession(READONLY_TOKEN);

    await expect(runtime.createTenant(READONLY_TOKEN, {
      slug: 'hack', domain: 'hack.io', plan: 'FREE', themeId: 'x', packages: [],
    })).rejects.toThrow(InsufficientPermissionsException);

    await expect(runtime.suspendTenant(READONLY_TOKEN, 'tenant-a')).rejects.toThrow(InsufficientPermissionsException);

    await expect(runtime.deleteTenant(READONLY_TOKEN, 'tenant-a')).rejects.toThrow(InsufficientPermissionsException);
  });

  // ── Test 3: Runtime Inspector Read-Only ──────────────────────────────────

  it('Should return read-only RuntimeSnapshot and it must be frozen by the view', async () => {
    await runtime.openSession(SUPER_TOKEN);

    const snapshot = await runtime.getRuntimeSnapshot(SUPER_TOKEN, 'tenant-a');
    expect(snapshot).not.toBeNull();
    expect(snapshot!.runtimeHash).toContain('fd48e3');
    expect(snapshot!.capabilities).toContain('commerce');

    // Render through component
    const ctx = (await runtime.openSession(SUPER_TOKEN));
    const result = new RuntimeInspectorView().render(ctx, snapshot!);
    expect(result.html).toContain('Widok tylko do odczytu');
    expect(result.html).toContain('fd48e3');
    expect(result.html).toContain('theme_minimal');
    expect(result.errors).toHaveLength(0);
  });

  // ── Test 4: Event Timeline Sorting ───────────────────────────────────────

  it('Should return events sorted newest-first regardless of input order', async () => {
    await runtime.openSession(SUPER_TOKEN);
    const events = await runtime.getEventTimeline(SUPER_TOKEN, 50);

    // Should be sorted descending by timestamp
    for (let i = 0; i < events.length - 1; i++) {
      const a = new Date(events[i].timestamp).getTime();
      const b = new Date(events[i + 1].timestamp).getTime();
      expect(a).toBeGreaterThanOrEqual(b);
    }

    // Verify the EventTimelineView renders correctly
    const ctx = await runtime.openSession(SUPER_TOKEN);
    const result = new EventTimelineView().render(ctx, events);
    expect(result.html).toContain('Payment.Completed');
    expect(result.html).toContain('Bootstrap.Ready');
  });

  // ── Test 5: Provisioning Flow ─────────────────────────────────────────────

  it('Should provision a new tenant and emit Tenant.Created + Security.AuditEntry events', async () => {
    await runtime.openSession(SUPER_TOKEN);

    const publishSpy = vi.spyOn(eventBus, 'publish');

    const tenant = await runtime.createTenant(SUPER_TOKEN, {
      slug: 'new-fashion-shop',
      domain: 'fashion.solospot.com',
      plan: 'ENTERPRISE',
      themeId: 'theme_premium',
      packages: ['core-store', 'analytics'],
    });

    expect(tenant.slug).toBe('new-fashion-shop');

    const emitted = publishSpy.mock.calls.map((c) => c[0].eventType);
    expect(emitted).toContain('Tenant.Created');
    expect(emitted).toContain('Security.AuditEntry');

    const auditEntry = publishSpy.mock.calls
      .map((c) => c[0])
      .find((e) => e.eventType === 'Security.AuditEntry');
    expect(auditEntry?.payload.action).toBe('createTenant');
    expect(auditEntry?.payload.adminId).toBe('admin-001');
  });

  // ── Test 6: Diagnostics View ──────────────────────────────────────────────

  it('Should render RuntimeDiagnosticsView with READY bootstrap status and metrics', async () => {
    const ctx = await runtime.openSession(SUPER_TOKEN);
    const diag = await runtime.getDiagnostics(SUPER_TOKEN);

    const result = new RuntimeDiagnosticsView().render(ctx, diag);

    expect(result.html).toContain('READY');
    expect(result.html).toContain('12'); // activeRuntimes
    expect(result.html).toContain('256'); // memoryUsageMB
    expect(result.html).toContain('0.12%'); // errorRate
    expect(result.errors).toHaveLength(0);
  });

  // ── Test 7: Audit Log ─────────────────────────────────────────────────────

  it('Should emit Security.AuditEntry for every admin write operation', async () => {
    await runtime.openSession(SUPER_TOKEN);

    const publishSpy = vi.spyOn(eventBus, 'publish');

    await runtime.suspendTenant(SUPER_TOKEN, 'tenant-a');
    await runtime.enablePackage(SUPER_TOKEN, 'tenant-a', 'analytics');
    await runtime.rotateApiKey(SUPER_TOKEN, 'key-001');

    const auditEvents = publishSpy.mock.calls
      .map((c) => c[0])
      .filter((e) => e.eventType === 'Security.AuditEntry');

    expect(auditEvents).toHaveLength(3);
    const actions = auditEvents.map((e) => e.payload.action);
    expect(actions).toContain('suspendTenant');
    expect(actions).toContain('enablePackage');
    expect(actions).toContain('rotateApiKey');
  });

  // ── Test 8: Context Immutability ─────────────────────────────────────────

  it('Should throw TypeError when mutating frozen MissionControlContext', async () => {
    const ctx = await runtime.openSession(SUPER_TOKEN);

    expect(() => { (ctx as any).adminId = 'hacker'; }).toThrow(TypeError);
    expect(() => { (ctx as any).role = 'SUPER_ADMIN'; }).toThrow(TypeError);
    expect(() => { (ctx as any).platformStats.totalTenants = 9999; }).toThrow(TypeError);
  });

  // ── Test 9: Auth Boundary ────────────────────────────────────────────────

  it('Should throw MissionControlAuthException for invalid or missing token', async () => {
    await expect(runtime.openSession('tok_invalid_xyz')).rejects.toThrow(MissionControlAuthException);
    expect(() => runtime['requireSession']('non-existent')).toThrow(MissionControlAuthException);
  });

  // ── Test 10: OverviewView + TenantListView rendering ─────────────────────

  it('Should render OverviewView with correct platform stats', async () => {
    const ctx = await runtime.openSession(SUPER_TOKEN);
    const result = new OverviewView().render(ctx);

    expect(result.html).toContain('42'); // totalTenants
    expect(result.html).toContain('38'); // activeTenants
    expect(result.html).toContain('157'); // ordersToday
    expect(result.html).toContain('SUPER_ADMIN');
  });

  it('Should render TenantListView with all tenants', async () => {
    const ctx = await runtime.openSession(SUPER_TOKEN);
    const tenants = await runtime.listTenants(SUPER_TOKEN);
    const result = new TenantListView().render(ctx, tenants);

    expect(result.html).toContain('shop-a');
    expect(result.html).toContain('SUSPENDED');
    expect(result.html).toContain('GROWTH');
    expect(result.errors).toHaveLength(0);
  });
});
