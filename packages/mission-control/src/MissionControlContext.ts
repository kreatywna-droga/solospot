// ── Admin Roles ───────────────────────────────────────────────────────────────

export type AdminRole = 'SUPER_ADMIN' | 'SUPPORT' | 'READ_ONLY';

export type MissionControlView =
  | 'overview'
  | 'tenants'
  | 'tenant_detail'
  | 'packages'
  | 'runtime_diagnostics'
  | 'event_timeline'
  | 'provisioning'
  | 'security';

// ── Platform Stats ────────────────────────────────────────────────────────────

export interface PlatformStats {
  readonly totalTenants: number;
  readonly activeTenants: number;
  readonly suspendedTenants: number;
  readonly totalOrdersToday: number;
  readonly errorRatePercent: number;
  readonly avgResponseTimeMs: number;
}

// ── Mission Control Context (Immutable) ───────────────────────────────────────

export interface MissionControlContext {
  readonly adminId: string;
  readonly adminEmail: string;
  readonly role: AdminRole;
  readonly currentView: MissionControlView;
  readonly platformStats: PlatformStats;
}

export function createMissionControlContext(data: MissionControlContext): MissionControlContext {
  return Object.freeze({
    ...data,
    platformStats: Object.freeze({ ...data.platformStats }),
  }) as MissionControlContext;
}

// ── Tenant Management Types ───────────────────────────────────────────────────

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' | 'DELETED';

export interface ManagedTenant {
  readonly tenantId: string;
  readonly slug: string;
  readonly plan: 'FREE' | 'GROWTH' | 'ENTERPRISE';
  readonly status: TenantStatus;
  readonly createdAt: string;
  readonly domain: string;
}

export interface NewTenantRequest {
  readonly slug: string;
  readonly domain: string;
  readonly plan: 'FREE' | 'GROWTH' | 'ENTERPRISE';
  readonly themeId: string;
  readonly packages: string[];
}

// ── Runtime Snapshot ──────────────────────────────────────────────────────────

export interface RuntimeSnapshot {
  readonly tenantId: string;
  readonly slug: string;
  readonly status: TenantStatus;
  readonly capabilities: string[];
  readonly packages: Array<{ id: string; version: string }>;
  readonly themeId: string;
  readonly runtimeHash: string;
}

// ── Diagnostics ───────────────────────────────────────────────────────────────

export interface DiagnosticsSnapshot {
  readonly bootstrapStatus: 'READY' | 'DEGRADED' | 'FAILED';
  readonly activeRuntimes: number;
  readonly memoryUsageMB: number;
  readonly eventQueueDepth: number;
  readonly lastEventAt: string;
  readonly errorRatePercent: number;
  readonly avgResponseTimeMs: number;
}

// ── Platform Events ───────────────────────────────────────────────────────────

export interface PlatformEventEntry {
  readonly eventId: string;
  readonly eventType: string;
  readonly tenantId: string;
  readonly timestamp: string;
  readonly correlationId: string;
  readonly payload: Record<string, any>;
}

// ── Security ──────────────────────────────────────────────────────────────────

export interface ApiKeyEntry {
  readonly keyId: string;
  readonly tenantId: string | null; // null = platform-global key
  readonly label: string;
  readonly prefix: string; // e.g. "wf_live_****"
  readonly createdAt: string;
  readonly lastUsedAt: string | null;
}

export interface AuditLogEntry {
  readonly entryId: string;
  readonly adminId: string;
  readonly action: string;
  readonly targetId: string;
  readonly targetType: 'tenant' | 'package' | 'api_key' | 'admin';
  readonly timestamp: string;
  readonly details: Record<string, any>;
}

// ── Custom Exceptions ─────────────────────────────────────────────────────────

export class InsufficientPermissionsException extends Error {
  constructor(role: AdminRole, action: string) {
    super(`InsufficientPermissionsException: Role '${role}' cannot perform action '${action}'`);
    this.name = 'InsufficientPermissionsException';
  }
}

export class MissionControlAuthException extends Error {
  constructor(reason: string = 'Admin session invalid or expired') {
    super(`MissionControlAuthException: ${reason}`);
    this.name = 'MissionControlAuthException';
  }
}

// ── Permission Guard ──────────────────────────────────────────────────────────

const WRITE_ROLES: AdminRole[] = ['SUPER_ADMIN', 'SUPPORT'];
const SUPER_ADMIN_ONLY: AdminRole[] = ['SUPER_ADMIN'];

export const ROLE_PERMISSIONS: Record<string, AdminRole[]> = {
  viewTenant:       ['SUPER_ADMIN', 'SUPPORT', 'READ_ONLY'],
  suspendTenant:    WRITE_ROLES,
  restoreTenant:    WRITE_ROLES,
  createTenant:     SUPER_ADMIN_ONLY,
  archiveTenant:    SUPER_ADMIN_ONLY,
  deleteTenant:     SUPER_ADMIN_ONLY,
  enablePackage:    WRITE_ROLES,
  disablePackage:   WRITE_ROLES,
  provision:        SUPER_ADMIN_ONLY,
  rotateApiKey:     SUPER_ADMIN_ONLY,
  viewSecurity:     WRITE_ROLES,
};

export function assertPermission(role: AdminRole, action: string): void {
  const allowed = ROLE_PERMISSIONS[action] ?? [];
  if (!allowed.includes(role)) {
    throw new InsufficientPermissionsException(role, action);
  }
}
