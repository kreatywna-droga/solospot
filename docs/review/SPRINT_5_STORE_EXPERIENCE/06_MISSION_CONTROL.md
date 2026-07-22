---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_2_PLATFORM_CORE/07_TENANT_RESOLVER_IMPLEMENTATION.md
- docs/review/SPRINT_2_PLATFORM_CORE/04_EVENT_BUS_IMPLEMENTATION.md
- docs/review/SPRINT_2_PLATFORM_CORE/05_DIAGNOSTICS_IMPLEMENTATION.md
- docs/review/SPRINT_3_RUNTIME_COMPOSITION/01_RUNTIME_COMPOSITION_ENGINE.md
- docs/review/SPRINT_3_RUNTIME_COMPOSITION/04_STORE_RUNTIME_ENGINE.md
---

# SPRINT 5: STORE EXPERIENCE LAYER
## Specyfikacja Kontraktu — 06_MISSION_CONTROL.md
*Centrum zarządzania całą platformą SaaS. Panel administratora operacyjnego obsługujący wszystkich tenantów, monitorowanie runtime, diagnostykę, provisioning, bezpieczeństwo i podgląd Event Bus.*

> **Zasada nadrzędna:** Mission Control nigdy nie modyfikuje stanu runtime bezpośrednio.
> Wszystkie operacje są delegowane przez `MissionControlAdapter` do właściwych silników platformy.
> Runtime Snapshot jest czytelny (read-only). Żadna akcja z panelu nie może naruszyć zasady immutability.

---

### 1. Architektura Mission Control

```
Admin Browser → /mission-control/*
         |
         ↓
  MissionControlRuntime
  (sesja admina, routing widoków)
         |
         ↓
  MissionControlAdapter (port)
   /    |    |    |    \
  ↓     ↓    ↓    ↓     ↓
Tenant  Pkg  Diag Prov  Security
Engine  Sys  Reg  Eng   Registry
```

`MissionControlRuntime` zarządza sesją administratora platformy, rozwiązuje ścieżki URL na widoki panelu i deleguje wszystkie operacje przez port adaptera. Panel nie ma bezpośredniego dostępu do bazy danych ani do runtime tenantów.

---

### 2. Mission Control Routes

| Ścieżka | Widok | Opis |
|---|---|---|
| `/mission-control` | `OverviewView` | Dashboard operacyjny — metryki platformy |
| `/mission-control/tenants` | `TenantListView` | Lista i zarządzanie tenantami |
| `/mission-control/tenants/:id` | `TenantDetailView` | Szczegóły tenanta + Runtime Snapshot |
| `/mission-control/packages` | `PackageManagementView` | Paczki — enable/disable/upgrade |
| `/mission-control/runtime` | `RuntimeDiagnosticsView` | Health, Bootstrap Status, Performance |
| `/mission-control/events` | `EventTimelineView` | Stream zdarzeń z Platform Event Bus |
| `/mission-control/provisioning` | `ProvisioningView` | Tworzenie nowych sklepów |
| `/mission-control/security` | `SecurityCenterView` | API Keys, role, logi audytu |

---

### 3. Mission Control Context (Immutable)

```typescript
export interface MissionControlContext {
  readonly adminId: string;
  readonly adminEmail: string;
  readonly role: 'SUPER_ADMIN' | 'SUPPORT' | 'READ_ONLY';
  readonly currentView: MissionControlView;
  readonly platformStats: PlatformStats;
}

export interface PlatformStats {
  readonly totalTenants: number;
  readonly activeTenants: number;
  readonly suspendedTenants: number;
  readonly totalOrdersToday: number;
  readonly errorRatePercent: number;
  readonly avgResponseTimeMs: number;
}
```

---

### 4. Tenant Management

Dozwolone operacje per rola:

| Operacja | SUPER_ADMIN | SUPPORT | READ_ONLY |
|---|---|---|---|
| `createTenant` | ✅ | ❌ | ❌ |
| `suspendTenant` | ✅ | ✅ | ❌ |
| `restoreTenant` | ✅ | ✅ | ❌ |
| `archiveTenant` | ✅ | ❌ | ❌ |
| `deleteTenant` | ✅ | ❌ | ❌ |
| `viewTenant` | ✅ | ✅ | ✅ |

Operacja bez wymaganych uprawnień skutkuje `InsufficientPermissionsException`.

---

### 5. Runtime Inspector (Read-Only)

`RuntimeInspectorView` pokazuje aktywny Runtime Snapshot tenanta:

```
Tenant ID: tenant-shop-a
Slug:      shop-a
Status:    ACTIVE
────────────────────────
Capabilities: [commerce, payments, shipping]
Packages:     [core-store@1.0.0, analytics@2.1.0]
Theme:        theme_minimal@1.0.0
Runtime Hash: fd48e3683d44...
```

**Zabrania się** jakiejkolwiek modyfikacji Snapshot przez UI. Widok jest read-only.

---

### 6. Runtime Diagnostics

Integracja z `DiagnosticsRegistry` i `PlatformEventBus`:

```typescript
interface DiagnosticsSnapshot {
  bootstrapStatus: 'READY' | 'DEGRADED' | 'FAILED';
  activeRuntimes: number;
  memoryUsageMB: number;
  eventQueueDepth: number;
  lastEventAt: string;
}
```

---

### 7. Event Timeline

`EventTimelineView` wyświetla strumień zdarzeń z Event Bus posortowany malejąco po czasie:

```typescript
interface PlatformEvent {
  eventId: string;
  eventType: string;
  tenantId: string;
  timestamp: string;
  correlationId: string;
  payload: Record<string, any>;
}
```

---

### 8. Provisioning

`ProvisioningView` orkiestruje stworzenie nowego tenanta:

```
Admin → New Store Wizard
         ↓
  Set: slug, domain, plan, theme
         ↓
  MissionControlAdapter.provisionTenant()
         ↓
  Tenant Created + Runtime Initialized
         ↓
  Redirect → /mission-control/tenants/:id
```

---

### 9. Security Center

`SecurityCenterView` zarządza:
- **API Keys**: generowanie, rotacja, unieważnianie kluczy per tenant lub globalnych
- **Role**: przypisywanie ról administratorów
- **Audit Log**: niemodyfikowalny dziennik operacji (kto, co, kiedy)

---

### 10. Event Contract

| Zdarzenie | Kiedy emitowane |
|---|---|
| `MissionControl.Opened` | Otwarcie panelu przez admina |
| `Tenant.Created` | Nowy tenant dodany przez provisioning |
| `Tenant.Suspended` | Tenant zawieszony |
| `Tenant.Restored` | Tenant przywrócony |
| `Tenant.Archived` | Tenant zarchiwizowany |
| `Package.Enabled` | Paczka włączona dla tenanta |
| `Package.Disabled` | Paczka wyłączona dla tenanta |
| `Security.ApiKeyRotated` | Rotacja klucza API |
| `Security.AuditEntry` | Każda operacja administracyjna |

---

### 11. Test Contract

**Test 1 — Session Init + Stats**
Prawidłowe otwarcie sesji admina zwraca zamrożony `MissionControlContext` z `PlatformStats`.

**Test 2 — Tenant CRUD + Role Guard**
`SUPER_ADMIN` może tworzyć, zawieszać i usuwać tenantów. `READ_ONLY` przy próbie operacji otrzymuje `InsufficientPermissionsException`.

**Test 3 — Runtime Inspector Read-Only**
Odczyt Runtime Snapshot tenanta nie modyfikuje żadnego stanu. Próba mutacji obiektu wyrzuca `TypeError`.

**Test 4 — Event Timeline**
EventTimelineView renderuje zdarzenia posortowane malejąco — najnowsze na górze.

**Test 5 — Provisioning Flow**
Pełny przepływ provisioning: dane → adapter → `Tenant.Created` event.

**Test 6 — Diagnostics View**
`RuntimeDiagnosticsView` renderuje status Bootstrap, aktywne runtimes i error rate.

**Test 7 — Audit Log**
Każda operacja administracyjna emituje zdarzenie `Security.AuditEntry` z `adminId`, `action` i `targetId`.

**Test 8 — Context Immutability**
Próba mutacji `missionControlContext.adminId` lub `missionControlContext.role` rzuca `TypeError`.
