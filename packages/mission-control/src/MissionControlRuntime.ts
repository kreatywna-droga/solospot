import {
  MissionControlContext,
  MissionControlView,
  AdminRole,
  PlatformStats,
  ManagedTenant,
  NewTenantRequest,
  RuntimeSnapshot,
  DiagnosticsSnapshot,
  PlatformEventEntry,
  ApiKeyEntry,
  AuditLogEntry,
  createMissionControlContext,
  assertPermission,
  MissionControlAuthException,
} from './MissionControlContext';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';

// ── Adapter Port ──────────────────────────────────────────────────────────────

export interface AdminProfile {
  adminId: string;
  adminEmail: string;
  role: AdminRole;
}

export interface MissionControlAdapterPort {
  verifyAdminSession(token: string): Promise<AdminProfile | null>;
  getPlatformStats(): Promise<PlatformStats>;
  listTenants(): Promise<ManagedTenant[]>;
  getTenantById(tenantId: string): Promise<ManagedTenant | null>;
  getRuntimeSnapshot(tenantId: string): Promise<RuntimeSnapshot | null>;
  createTenant(req: NewTenantRequest): Promise<ManagedTenant>;
  suspendTenant(tenantId: string): Promise<ManagedTenant>;
  restoreTenant(tenantId: string): Promise<ManagedTenant>;
  archiveTenant(tenantId: string): Promise<ManagedTenant>;
  deleteTenant(tenantId: string): Promise<void>;
  enablePackage(tenantId: string, packageId: string): Promise<void>;
  disablePackage(tenantId: string, packageId: string): Promise<void>;
  getDiagnostics(): Promise<DiagnosticsSnapshot>;
  getEventTimeline(limit: number): Promise<PlatformEventEntry[]>;
  getApiKeys(tenantId: string | null): Promise<ApiKeyEntry[]>;
  rotateApiKey(keyId: string): Promise<ApiKeyEntry>;
  getAuditLog(limit: number): Promise<AuditLogEntry[]>;
}

// ── Mission Control Runtime ───────────────────────────────────────────────────

export class MissionControlRuntime {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;
  private readonly adapter: MissionControlAdapterPort;

  // Active admin sessions: token → context
  private readonly sessions = new Map<string, MissionControlContext>();

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
    adapter: MissionControlAdapterPort;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;
    this.adapter = options.adapter;

    const events = [
      'MissionControl.Opened',
      'Tenant.Created',
      'Tenant.Suspended',
      'Tenant.Restored',
      'Tenant.Archived',
      'Package.Enabled',
      'Package.Disabled',
      'Security.ApiKeyRotated',
      'Security.AuditEntry',
    ];
    for (const evt of events) {
      EventRegistry.register(evt);
    }
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private async publish(
    eventType: string,
    payload: Record<string, any>,
    cid: string
  ): Promise<void> {
    await this.eventBus.publish({
      eventId: `evt_mc_${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId: 'platform',
      payload,
    });
  }

  private async audit(
    ctx: MissionControlContext,
    action: string,
    targetId: string,
    targetType: AuditLogEntry['targetType'],
    details: Record<string, any>,
    cid: string
  ): Promise<void> {
    await this.publish('Security.AuditEntry', {
      adminId: ctx.adminId,
      action,
      targetId,
      targetType,
      details,
    }, cid);
  }

  private requireSession(token: string): MissionControlContext {
    const ctx = this.sessions.get(token);
    if (!ctx) throw new MissionControlAuthException('No active admin session for token');
    return ctx;
  }

  // ── Session ───────────────────────────────────────────────────────────────

  public async openSession(token: string, correlationId?: string): Promise<MissionControlContext> {
    const cid = correlationId || `mc_open_${Date.now()}`;

    const admin = await this.adapter.verifyAdminSession(token);
    if (!admin) throw new MissionControlAuthException('Admin token invalid or expired');

    const stats = await this.adapter.getPlatformStats();

    const ctx = createMissionControlContext({
      adminId: admin.adminId,
      adminEmail: admin.adminEmail,
      role: admin.role,
      currentView: 'overview',
      platformStats: stats,
    });

    this.sessions.set(token, ctx);

    await this.publish('MissionControl.Opened', { adminId: admin.adminId }, cid);
    this.logger.info({
      message: `Mission Control session opened for admin: ${admin.adminEmail} (role: ${admin.role})`,
      correlationId: cid,
      tenantId: 'platform',
    });

    return ctx;
  }

  public closeSession(token: string): void {
    this.sessions.delete(token);
  }

  // ── Tenant Management ─────────────────────────────────────────────────────

  public async listTenants(token: string): Promise<ManagedTenant[]> {
    const ctx = this.requireSession(token);
    assertPermission(ctx.role, 'viewTenant');
    return this.adapter.listTenants();
  }

  public async getTenantById(token: string, tenantId: string): Promise<ManagedTenant | null> {
    const ctx = this.requireSession(token);
    assertPermission(ctx.role, 'viewTenant');
    return this.adapter.getTenantById(tenantId);
  }

  public async getRuntimeSnapshot(token: string, tenantId: string): Promise<RuntimeSnapshot | null> {
    const ctx = this.requireSession(token);
    assertPermission(ctx.role, 'viewTenant');
    return this.adapter.getRuntimeSnapshot(tenantId);
  }

  public async createTenant(token: string, req: NewTenantRequest, correlationId?: string): Promise<ManagedTenant> {
    const cid = correlationId || `mc_create_${Date.now()}`;
    const ctx = this.requireSession(token);
    assertPermission(ctx.role, 'createTenant');

    const tenant = await this.adapter.createTenant(req);
    await this.publish('Tenant.Created', { tenantId: tenant.tenantId, slug: tenant.slug }, cid);
    await this.audit(ctx, 'createTenant', tenant.tenantId, 'tenant', { slug: req.slug, plan: req.plan }, cid);

    return tenant;
  }

  public async suspendTenant(token: string, tenantId: string, correlationId?: string): Promise<ManagedTenant> {
    const cid = correlationId || `mc_suspend_${Date.now()}`;
    const ctx = this.requireSession(token);
    assertPermission(ctx.role, 'suspendTenant');

    const tenant = await this.adapter.suspendTenant(tenantId);
    await this.publish('Tenant.Suspended', { tenantId }, cid);
    await this.audit(ctx, 'suspendTenant', tenantId, 'tenant', {}, cid);

    return tenant;
  }

  public async restoreTenant(token: string, tenantId: string, correlationId?: string): Promise<ManagedTenant> {
    const cid = correlationId || `mc_restore_${Date.now()}`;
    const ctx = this.requireSession(token);
    assertPermission(ctx.role, 'restoreTenant');

    const tenant = await this.adapter.restoreTenant(tenantId);
    await this.publish('Tenant.Restored', { tenantId }, cid);
    await this.audit(ctx, 'restoreTenant', tenantId, 'tenant', {}, cid);

    return tenant;
  }

  public async archiveTenant(token: string, tenantId: string, correlationId?: string): Promise<ManagedTenant> {
    const cid = correlationId || `mc_archive_${Date.now()}`;
    const ctx = this.requireSession(token);
    assertPermission(ctx.role, 'archiveTenant');

    const tenant = await this.adapter.archiveTenant(tenantId);
    await this.publish('Tenant.Archived', { tenantId }, cid);
    await this.audit(ctx, 'archiveTenant', tenantId, 'tenant', {}, cid);

    return tenant;
  }

  public async deleteTenant(token: string, tenantId: string, correlationId?: string): Promise<void> {
    const cid = correlationId || `mc_delete_${Date.now()}`;
    const ctx = this.requireSession(token);
    assertPermission(ctx.role, 'deleteTenant');

    await this.adapter.deleteTenant(tenantId);
    await this.audit(ctx, 'deleteTenant', tenantId, 'tenant', {}, cid);
  }

  // ── Package Management ────────────────────────────────────────────────────

  public async enablePackage(token: string, tenantId: string, packageId: string, correlationId?: string): Promise<void> {
    const cid = correlationId || `mc_pkg_en_${Date.now()}`;
    const ctx = this.requireSession(token);
    assertPermission(ctx.role, 'enablePackage');

    await this.adapter.enablePackage(tenantId, packageId);
    await this.publish('Package.Enabled', { tenantId, packageId }, cid);
    await this.audit(ctx, 'enablePackage', packageId, 'package', { tenantId }, cid);
  }

  public async disablePackage(token: string, tenantId: string, packageId: string, correlationId?: string): Promise<void> {
    const cid = correlationId || `mc_pkg_dis_${Date.now()}`;
    const ctx = this.requireSession(token);
    assertPermission(ctx.role, 'disablePackage');

    await this.adapter.disablePackage(tenantId, packageId);
    await this.publish('Package.Disabled', { tenantId, packageId }, cid);
    await this.audit(ctx, 'disablePackage', packageId, 'package', { tenantId }, cid);
  }

  // ── Diagnostics ───────────────────────────────────────────────────────────

  public async getDiagnostics(token: string): Promise<DiagnosticsSnapshot> {
    this.requireSession(token);
    return this.adapter.getDiagnostics();
  }

  // ── Event Timeline ────────────────────────────────────────────────────────

  public async getEventTimeline(token: string, limit = 50): Promise<PlatformEventEntry[]> {
    this.requireSession(token);
    const events = await this.adapter.getEventTimeline(limit);
    // Always sorted: newest first
    return [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // ── Security ──────────────────────────────────────────────────────────────

  public async getApiKeys(token: string, tenantId: string | null): Promise<ApiKeyEntry[]> {
    const ctx = this.requireSession(token);
    assertPermission(ctx.role, 'viewSecurity');
    return this.adapter.getApiKeys(tenantId);
  }

  public async rotateApiKey(token: string, keyId: string, correlationId?: string): Promise<ApiKeyEntry> {
    const cid = correlationId || `mc_key_rot_${Date.now()}`;
    const ctx = this.requireSession(token);
    assertPermission(ctx.role, 'rotateApiKey');

    const newKey = await this.adapter.rotateApiKey(keyId);
    await this.publish('Security.ApiKeyRotated', { keyId, newKeyId: newKey.keyId }, cid);
    await this.audit(ctx, 'rotateApiKey', keyId, 'api_key', { newKeyId: newKey.keyId }, cid);

    return newKey;
  }

  public async getAuditLog(token: string, limit = 100): Promise<AuditLogEntry[]> {
    const ctx = this.requireSession(token);
    assertPermission(ctx.role, 'viewSecurity');
    return this.adapter.getAuditLog(limit);
  }
}
