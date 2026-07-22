import {
  MissionControlContext,
  ManagedTenant,
  RuntimeSnapshot,
  DiagnosticsSnapshot,
  PlatformEventEntry,
  ApiKeyEntry,
  AuditLogEntry,
} from './MissionControlContext';

export interface MCRenderResult {
  html: string;
  errors: string[];
}

function safe(fn: () => string): MCRenderResult {
  try { return { html: fn(), errors: [] }; }
  catch (e: any) { return { html: `<div class="mc-error"><!-- ${e.message} --></div>`, errors: [e.message] }; }
}

// ── Overview View ─────────────────────────────────────────────────────────────

export class OverviewView {
  render(ctx: MissionControlContext): MCRenderResult {
    return safe(() => {
      const s = ctx.platformStats;
      return `
<section class="mc-overview">
  <h1>Mission Control</h1>
  <p class="admin-info">${ctx.adminEmail} · <span class="badge badge--${ctx.role.toLowerCase()}">${ctx.role}</span></p>
  <div class="stats-grid">
    <div class="stat"><span class="stat__value">${s.totalTenants}</span><span class="stat__label">Łączna liczba tenantów</span></div>
    <div class="stat stat--green"><span class="stat__value">${s.activeTenants}</span><span class="stat__label">Aktywne</span></div>
    <div class="stat stat--yellow"><span class="stat__value">${s.suspendedTenants}</span><span class="stat__label">Zawieszone</span></div>
    <div class="stat"><span class="stat__value">${s.totalOrdersToday}</span><span class="stat__label">Zamówienia dziś</span></div>
    <div class="stat ${s.errorRatePercent > 1 ? 'stat--red' : 'stat--green'}"><span class="stat__value">${s.errorRatePercent.toFixed(2)}%</span><span class="stat__label">Error rate</span></div>
    <div class="stat"><span class="stat__value">${s.avgResponseTimeMs}ms</span><span class="stat__label">Avg. response</span></div>
  </div>
</section>`.trim();
    });
  }
}

// ── Tenant List View ──────────────────────────────────────────────────────────

export class TenantListView {
  render(ctx: MissionControlContext, tenants: ManagedTenant[]): MCRenderResult {
    return safe(() => {
      const rows = tenants.map((t) => `
<tr>
  <td><a href="/mission-control/tenants/${t.tenantId}">${t.slug}</a></td>
  <td>${t.domain}</td>
  <td>${t.plan}</td>
  <td class="status status--${t.status.toLowerCase()}">${t.status}</td>
  <td>${new Date(t.createdAt).toLocaleDateString()}</td>
</tr>`).join('\n');

      return `
<section class="mc-tenants">
  <h1>Tenants (${tenants.length})</h1>
  <table>
    <thead><tr><th>Slug</th><th>Domena</th><th>Plan</th><th>Status</th><th>Utworzony</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5">Brak tenantów</td></tr>'}</tbody>
  </table>
</section>`.trim();
    });
  }
}

// ── Runtime Inspector View ────────────────────────────────────────────────────

export class RuntimeInspectorView {
  render(ctx: MissionControlContext, snapshot: RuntimeSnapshot): MCRenderResult {
    return safe(() => {
      const pkgs = snapshot.packages.map((p) => `<li>${p.id}@${p.version}</li>`).join('\n');
      const caps = snapshot.capabilities.join(', ');

      return `
<section class="mc-runtime-inspector">
  <h1>Runtime Inspector</h1>
  <div class="inspector-notice">⚠️ Widok tylko do odczytu. Modyfikacja runtime jest niedozwolona.</div>
  <dl>
    <dt>Tenant ID</dt><dd>${snapshot.tenantId}</dd>
    <dt>Slug</dt><dd>${snapshot.slug}</dd>
    <dt>Status</dt><dd class="status status--${snapshot.status.toLowerCase()}">${snapshot.status}</dd>
    <dt>Capabilities</dt><dd>${caps || 'brak'}</dd>
    <dt>Theme</dt><dd>${snapshot.themeId}</dd>
    <dt>Runtime Hash</dt><dd><code>${snapshot.runtimeHash}</code></dd>
  </dl>
  <h2>Zainstalowane paczki</h2>
  <ul>${pkgs || '<li>Brak</li>'}</ul>
</section>`.trim();
    });
  }
}

// ── Runtime Diagnostics View ──────────────────────────────────────────────────

export class RuntimeDiagnosticsView {
  render(ctx: MissionControlContext, diag: DiagnosticsSnapshot): MCRenderResult {
    return safe(() => {
      const statusClass = diag.bootstrapStatus === 'READY' ? 'green' : diag.bootstrapStatus === 'DEGRADED' ? 'yellow' : 'red';

      return `
<section class="mc-diagnostics">
  <h1>Runtime Diagnostics</h1>
  <div class="diag-grid">
    <div class="diag-card diag-card--${statusClass}">
      <span class="diag__label">Bootstrap Status</span>
      <span class="diag__value">${diag.bootstrapStatus}</span>
    </div>
    <div class="diag-card">
      <span class="diag__label">Aktywne runtimes</span>
      <span class="diag__value">${diag.activeRuntimes}</span>
    </div>
    <div class="diag-card">
      <span class="diag__label">Pamięć (MB)</span>
      <span class="diag__value">${diag.memoryUsageMB}</span>
    </div>
    <div class="diag-card">
      <span class="diag__label">Event Queue</span>
      <span class="diag__value">${diag.eventQueueDepth}</span>
    </div>
    <div class="diag-card ${diag.errorRatePercent > 1 ? 'diag-card--red' : 'diag-card--green'}">
      <span class="diag__label">Error Rate</span>
      <span class="diag__value">${diag.errorRatePercent.toFixed(2)}%</span>
    </div>
    <div class="diag-card">
      <span class="diag__label">Avg. Response</span>
      <span class="diag__value">${diag.avgResponseTimeMs}ms</span>
    </div>
  </div>
  <p class="last-event">Ostatnie zdarzenie: ${new Date(diag.lastEventAt).toLocaleString()}</p>
</section>`.trim();
    });
  }
}

// ── Event Timeline View ───────────────────────────────────────────────────────

export class EventTimelineView {
  render(ctx: MissionControlContext, events: PlatformEventEntry[]): MCRenderResult {
    return safe(() => {
      const rows = events.map((e) => `
<tr>
  <td>${new Date(e.timestamp).toLocaleString()}</td>
  <td><code>${e.eventType}</code></td>
  <td>${e.tenantId}</td>
  <td><code>${e.correlationId.slice(0, 16)}…</code></td>
</tr>`).join('\n');

      return `
<section class="mc-events">
  <h1>Event Timeline</h1>
  <table>
    <thead><tr><th>Czas</th><th>Typ zdarzenia</th><th>Tenant</th><th>Correlation ID</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4">Brak zdarzeń</td></tr>'}</tbody>
  </table>
</section>`.trim();
    });
  }
}

// ── Security Center View ──────────────────────────────────────────────────────

export class SecurityCenterView {
  render(ctx: MissionControlContext, keys: ApiKeyEntry[], auditLog: AuditLogEntry[]): MCRenderResult {
    return safe(() => {
      const keyRows = keys.map((k) => `
<tr>
  <td>${k.label}</td>
  <td><code>${k.prefix}</code></td>
  <td>${k.tenantId ?? 'Platform'}</td>
  <td>${new Date(k.createdAt).toLocaleDateString()}</td>
  <td>${k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : '—'}</td>
  <td><button data-action="rotate" data-key-id="${k.keyId}">Rotuj</button></td>
</tr>`).join('\n');

      const auditRows = auditLog.slice(0, 20).map((a) => `
<tr>
  <td>${new Date(a.timestamp).toLocaleString()}</td>
  <td>${a.adminId}</td>
  <td><code>${a.action}</code></td>
  <td>${a.targetId}</td>
</tr>`).join('\n');

      return `
<section class="mc-security">
  <h1>Security Center</h1>
  <h2>API Keys</h2>
  <table>
    <thead><tr><th>Nazwa</th><th>Prefix</th><th>Tenant</th><th>Utworzony</th><th>Ostatnio użyty</th><th></th></tr></thead>
    <tbody>${keyRows || '<tr><td colspan="6">Brak kluczy</td></tr>'}</tbody>
  </table>
  <h2>Audit Log (ostatnie 20)</h2>
  <table>
    <thead><tr><th>Czas</th><th>Admin</th><th>Akcja</th><th>Target</th></tr></thead>
    <tbody>${auditRows || '<tr><td colspan="4">Brak wpisów</td></tr>'}</tbody>
  </table>
</section>`.trim();
    });
  }
}
