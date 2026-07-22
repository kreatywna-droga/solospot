# Architecture Baseline v3.8

**Epic:** C6 → C9 — Visual Builder, Media Manager & Commerce Persistence  
**Baseline:** v3.8  
**Status:** APPROVED  
**Date:** 2026-07-20  

---

## 1. Status platformy

| Dokument | Status |
|----------|--------|
| Architecture Freeze v3.0 | ✅ FROZEN |
| C6 Final Certification | ✅ CERTIFIED |
| C7 Final Certification | ✅ CERTIFIED |
| C8 Final Certification | ✅ CERTIFIED |
| C9 Final Certification | ✅ CERTIFIED |
| C10 Final Certification | ✅ CERTIFIED |
| C11 Final Certification | ✅ CERTIFIED |
| C12.0-12.4 Platform Services | ✅ COMPLETE |
| Architecture Baseline v3.8 | ✅ APPROVED |

Wersja platformy: **Baseline v3.8** — Production ready SaaS automation platform. All tests 767/767 passing.

---

## 2. Monorepo Inventory

### 2.1 Lista pakietów

| Pakiet | Ścieżka | Odpowiedzialność | Właściciel domeny |
|--------|---------|------------------|-------------------|
| `platform-core` | `packages/platform-core` | Fundament: EventBus, Logger, EventRegistry, TenantSecurity | Platform Core |
| `runtime-core` | `packages/runtime-core` | Podstawowe kontrakty runtime: StoreConfig, RuntimeContext, RuntimeSection | Runtime |
| `runtime-composition` | `packages/runtime-composition` | Kompozycja runtime: RuntimeSnapshot, deepFreeze | Runtime |
| `theme-runtime` | `packages/theme-runtime` | Silnik motywów: ThemeRuntime, TemplateRuntime, RendererEngine, PreviewPipeline, PreviewRuntime | Runtime |
| `component-runtime` | `packages/component-runtime` | Silnik komponentów: ComponentRegistry, ComponentResolver, ComponentRenderer | Runtime |
| `builder-core` | `packages/builder-core` | Builder: BuilderDocument, BuilderCommands, PreviewContract, PreviewRuntimeAdapter | Builder |
| `asset-manager-core` | `packages/asset-manager-core` | Asset management: AssetStorage, AssetLibrary, SimpleAssetResolver, LocalAssetStorage | Asset |
| `media-manager-core` | `packages/media-manager-core` | Media domain: MediaDocument, AssetReference, AssetResolver, ProcessingPipeline, UploadEngine | Media |
| `media-manager-ui` | `packages/media-manager-ui` | Media UI: MediaLibrary, ImageEditor, AssetPicker, DragUploadZone, UploadQueue | Media |
| `commerce-persistence` | `packages/commerce-persistence` | Commerce persistence: Repository layer, Database schema, Transaction layer, CommerceDataResolver | Commerce |
| `provision-engine` | `packages/provision-engine` | Provisioning: ProvisionEngine, StoreConfigStage, TemplateStage | Provisioning |
| `publish-core` | `packages/publish-core` | Publikacja: PublishPipeline, ValidateStage, DeployStage, CommerceStage, RuntimeStage | Publish |
| `publish-engine` | `packages/publish-engine` | Publikacja: DefaultPublishEngine, PublishEngineBuilder | Publish |
| `deployment-core` | `packages/deployment-core` | Deployment: Deployment providers (local, vercel, etc.) | Deployment |
| `package-registry` | `packages/package-registry` | Rejestr pakietów: PackageManifest, PackageRegistry, lifecycle | Marketplace |
| `commerce-engine` | `packages/commerce-engine` | Commerce: PaymentEngine, OrderProcessingEngine, CartEngine, CheckoutFlow | Commerce |
| `mission-control-core` | `packages/mission-control-core` | Mission Control: StoreManagement, TenantManagement | Administration |
| `mission-control` | `packages/mission-control` | Mission Control UI | Administration |
| `customer-core` | `packages/customer-core` | Customer: CustomerRepository, CustomerSession | Customer |
| `customer-dashboard` | `packages/customer-dashboard` | Customer Dashboard UI | Customer |
| `asset-builder` | `packages/asset-builder` | Asset build pipeline | Asset |
| `checkout-ui` | `packages/checkout-ui` | Checkout UI components | Commerce |
| `template-package` | `packages/template-package` | Template packages: TemplateManifest, TemplatePackage, PackageValidator | Marketplace |
| `marketplace-core` | `packages/marketplace-core` | Marketplace: MarketplaceTemplate, MarketplaceRegistry, MarketplaceSearchEngine | Marketplace |
| `template-installer` | `packages/template-installer` | Template installer: InstallationPlan, InstallationTransaction, TenantProvisioningEngine | Marketplace |
| `authoring-studio` | `packages/authoring-studio` | Authoring Studio: TemplateEditor, ThemeEditor, ComponentEditor, LivePreview, ValidationCenter, MarketplacePublisher | Marketplace |
| `marketplace-experience` | `packages/marketplace-experience` | Client Experience: MarketplaceCatalog, ProductPage, DemoPreview, InstallWizard | Marketplace |
| `ai-layer` | `packages/ai-layer` | AI Layer: AIOchestrator, ProjectPlanner, BuilderActions, ThemeAssistant, ContentAssistant, AIValidationPreview, AIGoldenFlow | AI |
| `platform-identity` | `packages/platform-identity` | Platform Identity: Workspace, Organization, Tenant, Plan, Subscription, License, PlatformIdentityRegistry | Platform |
| `billing-core` | `packages/billing-core` | Billing Core: PlanEngine, SubscriptionEngine, UsageEngine, InvoiceEngine, PaymentGateway | Platform |
| `domain-manager` | `packages/domain-manager` | Domain Manager: DnsEngine, SslEngine, DomainRouting, DomainManager | Platform |
| `notification-center` | `packages/notification-center` | Notification Center: TemplateEngine, DeliveryEngine, PreferencesEngine, NotificationCenter | Platform |
| `workflow-engine` | `packages/workflow-engine` | Workflow Engine: TriggerEngine, ActionEngine, WorkflowRuntime, WorkflowRegistry | Platform |

### 2.2 Warstwy architektury

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  Builder UI | Mission Control | Customer Dashboard | Store  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Builder Layer                            │
│                    builder-core                              │
│  BuilderDocument | BuilderCommands | PreviewRuntimeAdapter  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Runtime Layer                            │
│  runtime-core | theme-runtime | component-runtime           │
│  StoreConfig | TemplateRuntime | ComponentRuntime | Theme   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Commerce Layer                          │
│              commerce-persistence | commerce-engine         │
│        Repository | CommerceDataResolver | CheckoutFlow     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Asset Layer                             │
│  media-manager-core | asset-manager-core                    │
│  MediaDocument | AssetReference | AssetResolver             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Platform Core Layer                        │
│                    platform-core                             │
│  EventBus | Logger | EventRegistry | TenantSecurity         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Layer                            │
│  provision-engine | publish-engine | deployment-core         │
│  package-registry | mission-control-core | customer-core     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Dependency Graph

### 3.1 Dozwolone importy

```
platform-core
    ├── runtime-core
    │       ├── runtime-composition
    │       ├── theme-runtime
    │       │       └── TemplateRuntime
    │       │       └── ThemeRuntime
    │       │       └── RendererEngine
    │       │       └── PreviewPipeline
    │       │       └── PreviewRuntime
    │       │
    │       └── component-runtime
    │               └── ComponentRegistry
    │               └── ComponentResolver
    │               └── ComponentRenderer
    │
    ├── builder-core
    │       └── PreviewRuntimeAdapter  ← JEDYNY most do runtime-core
    │
    ├── media-manager-core
    │       └── (brak zależności od runtime/builder)
    │
    ├── media-manager-ui
    │       └── media-manager-core (tylko types)
    │
    ├── commerce-persistence
    │       └── (brak zależności od runtime/builder)
    │
    ├── asset-manager-core
    │       └── (brak zależności od runtime/builder)
    │
    ├── provision-engine
    │       └── używa runtime-core (tylko w execute)
    │
    ├── publish-core
    │       └── używa runtime-core (tylko w execute)
    │
    ├── publish-engine
    │       └── CommerceDataResolver interface (dependency injection)
    │
    ├── deployment-core
    ├── package-registry
    ├── commerce-engine
    └── mission-control-core
```

### 3.2 Zakazane zależności

| Źródło | Cel | Powód |
|--------|-----|-------|
| `builder-core` | `runtime-core` (poza `PreviewRuntimeAdapter.ts`) | Narusza izolację |
| `component-runtime` | `theme-runtime` | Zakazane przez Architecture Freeze |
| `theme-runtime` | `builder-core` | Zakazane przez Architecture Freeze |
| `asset-manager-core` | dowolny pakiet runtime | Zakazane przez Architecture Freeze |
| `media-manager-core` | dowolny pakiet runtime | Zakazane przez Architecture Freeze |
| `media-manager-ui` | dowolny pakiet runtime | Zakazane przez Architecture Freeze |
| `commerce-persistence` | dowolny pakiet runtime | Commerce Engine nie zna Supabase; Repository interface oddzielone |
| `commerce-engine` | `commerce-persistence` (poza Repository interface) | Domena Commerce oddzielona od persistence |
| dowolny pakiet | `require()` w kodzie produkcyjnym | Zamiast tego: dynamiczny `import()` |

---

## 4. Publiczne API

### 4.1 @stable — stabilne, niezmienne bez procesu

| Pakiet | Export | Typ | Opis |
|--------|--------|-----|------|
| `commerce-persistence` | `Repository<T>` | interface | Uniwersalny interfejs repozytorium |
| `commerce-persistence` | `ProductRepository` | interface | CRUD + findBySlug, findByCategory, search |
| `commerce-persistence` | `OrderRepository` | interface | CRUD + findByCustomer, findByStatus |
| `commerce-persistence` | `CartRepository` | interface | CRUD + findByCustomer, findBySession |
| `commerce-persistence` | `InventoryRepository` | interface | reserve / release / adjust |
| `commerce-persistence` | `CustomerRepository` | interface | CRUD + findByEmail |
| `commerce-persistence` | `CommerceDataResolver` | class | Ładuje produkty → RuntimeProduct[] |
| `commerce-persistence` | `CheckoutTransaction` | class | Transakcja checkout z rollback |

*(pozostałe eksporty z v3.1 niezmienione)*

---

## 5. Extension Points

### 5.1 Commerce (NOWE w v3.2)

| Punkt | Mechanizm | Opis |
|-------|-----------|------|
| Repository Provider | `Repository<T>` interface | Własne backend-y danych (Supabase, Prisma, etc.) |
| Payment Gateway | `PaymentGateway` interface | Własne bramki płatności |
| Shipping Provider | `ShippingProvider` interface | Własne przewoźnicy |
| Tax Calculator | `TaxCalculator` interface | Własne kalkulatory podatkowe |
| Inventory Strategy | `InventoryStrategy` interface | Własne strategie zarządzania stanem |

---

## 6. Golden Flows

### 6.1 Builder → Preview

```
BuilderDocument created
    ↓
DOCUMENT_UPDATE sent via PreviewChannel
    ↓
PreviewRuntimeAdapter.handleMessage()
    ↓
PreviewRuntime.renderPage()
    ↓
PreviewPipeline.renderPage()
    ↓
TemplateRuntime.renderPage() + ComponentRenderer.render() + ThemeRuntime + AssetResolver
    ↓
HTML string
    ↓
PreviewAck (RENDERED) returned to Builder
    ↓
Builder displays preview
```

### 6.2 Builder → Publish

```
BuilderDocument compiled
    ↓
StoreConfig created
    ↓
PublishEngine.execute()
    ↓
ValidateStage → CommerceStage → RuntimeStage → AssetStage → ManifestStage → DeployStage
    ↓
DeploymentProvider.deploy()
    ↓
LIVE URL returned
```

**Stages:**
1. **ValidateStage** - Validate tenantId/storeId, load StoreConfig
2. **CommerceStage** - Resolve live commerce products via CommerceDataResolver
3. **RuntimeStage** - Render pages via TemplateRuntime
4. **AssetStage** - Build CSS/JS assets
5. **ManifestStage** - Generate manifest.json
6. **DeployStage** - Deploy to target provider

### 6.3 Commerce Checkout Flow

```
Create Order
    ↓
Reserve Inventory (InventoryRepository.reserve)
    ↓
Charge Payment (CheckoutTransaction)
    ↓
Confirm Order
    ↓
Rollback on failure (release inventory, cancel order)
```

### 6.4 Commerce Runtime Flow (NOWE w v3.2)

```
HTTP Request /[store_slug]
    ↓
CommerceEngine route handler
    ↓
loadStoreConfig(tenantId, storeId)
    ↓
CommerceDataResolver.resolve(tenantId) → products
    ↓
RuntimeContext created (LIVE mode)
    ↓
TemplateRuntime.renderPage()
    ↓
ComponentRenderer.render()
    ↓
ThemeRuntime + AssetResolver + CommerceData
    ↓
HTML response
```

---

## 7. Architecture Invariants

1. **Builder nie importuje Runtime poza adapterem.**
2. **AssetReference/CommerceData nie przechowuje URL.**
3. **Multi-tenant isolation jest obowiązkowa.**
4. **Runtime jest stateless.**
5. **One Engine Architecture (SEA).**
6. **Dynamiczne importy dla pluginów.**
7. **Serializowalność kontraktów komunikacyjnych.**
8. **Adapter jako jedyny most między warstwami.**
9. **Error boundary obowiązkowy.**
10. **Testy jako gate.**
11. **Commerce Engine nie zna Supabase.**
12. **Transactions są obowiązkowe dla operacji finansowych.**
13. **Commerce Persistence oddzielone od Commerce Engine domeny.**
14. **CommerceDataResolver injectowany przez PublishEngine, nie importowany bezpośrednio.**

---

## 8. Otwarte obszary rozwoju

### 8.4 C10 — Marketplace Authoring & Experience

**C10.1 Template Package Contract:** ✅ COMPLETED  
**C10.2 Marketplace Registry:** ✅ COMPLETED  
**C10.3 Template Installer:** ✅ COMPLETED  
**C10.4 Authoring Studio:** ✅ COMPLETED  
**C10.5 Marketplace Experience:** ✅ COMPLETED  

C10.4 Authoring Studio — thin layer over runtime (no new engines)
C10.5 Marketplace Experience — client-facing catalog + full golden flow

---

## 9. Document Version History

| Wersja | Data | Zmiany |
|--------|------|--------|
| 3.0 | 2026-07-19 | Architecture Freeze + C6 Final Certification |
| 3.1 | 2026-07-19 | C7 + C8 Final Certification + Media packages + Commerce extension points |
| 3.2 | 2026-07-19 | C9 Final Certification + commerce-persistence |
| 3.3 | 2026-07-19 | C10.1-C10.4 Template Package, Registry, Installer, Authoring Studio |
| 3.4 | 2026-07-19 | C10.5 Marketplace Experience complete |
| 3.5 | 2026-07-20 | C11 AI Layer complete + C12.0.1-12.0.4 Platform Identity |
| 3.6 | 2026-07-20 | C12.1-C12.4 Complete: Billing, Domains, Notifications, Workflow Engine |
| 3.7 | 2026-07-20 | Final C12 certification + C13/14 roadmap |

---

## 10. Podpis cyfrowy

Ten dokument jest oficjalnym punktem odniesienia dla wszystkich następnych sprintów i epików w WEB FACTOR. Każda zmiana wymaga procesu wyjątkowego zgodnego z Architecture Freeze v3.0.

**Status:** APPROVED ✅  
**Data:** 2026-07-20  
**Wersja:** 3.8

---

## 13. C12.0 Platform Identity — Status

**Epic C12.0 COMPLETE** — Foundation for Billing, Domains, Notifications, Workflow

| Module | Status | Tests |
|--------|--------|-------|
| C12.0.1 Core Domain & Contracts | ✅ COMPLETED | 3 |
| C12.0.2 Identity Registry | ✅ COMPLETED | 4 |
| C12.0.3 Context Resolver | ✅ COMPLETED | 4 |
| C12.0.4 Golden Context | ✅ COMPLETED | 1 |
| **Total C12.0** | ✅ COMPLETE | **12 tests** |

**Architecture:** All C12-C15 modules consume Platform Context via `resolvePlatformContext()` — never direct tenant/plan queries.

## 14. C12.1 Billing Core — Status

**Epic C12.1 COMPLETE** — SaaS billing engine, payment flow, invoicing

| Module | Status | Tests |
|--------|--------|-------|
| C12.1.1 Billing Domain | ✅ COMPLETED | Invoice, UsageRecord, CreditNote |
| C12.1.2 Plan Engine | ✅ COMPLETED | Free/Starter/Business/Enterprise |
| C12.1.3 Subscription Engine | ✅ COMPLETED | Activation, upgrade, downgrade, grace |
| C12.1.4 Usage Engine | ✅ COMPLETED | Storage, bandwidth, API, AI credits |
| C12.1.5 Invoice Engine | ✅ COMPLETED | Generation, VAT, credit notes |
| C12.1.6 Payment Gateway | ✅ COMPLETED | Stripe abstraction |
| C12.1.7 Billing Golden Flow | ✅ COMPLETED | Registration → plan → payment → invoice |

**Architecture:** All C12.1 modules consume `PlatformContext` via resolver — no direct repository access.

## 15. C12.2 Domain Manager — Status

**Epic C12.2 COMPLETE** — Custom domain provisioning with SSL

| Module | Status | Tests |
|--------|--------|-------|
| C12.2.1 Domain Domain | ✅ COMPLETED | Domain, DNS, SSL, Binding |
| C12.2.2 DNS Engine | ✅ COMPLETED | Verification, records, propagation |
| C12.2.3 SSL Engine | ✅ COMPLETED | Let's Encrypt issuance/renewal |
| C12.2.4 Domain Routing | ✅ COMPLETED | Domain → tenant mapping |
| C12.2.5 Domain Manager | ✅ COMPLETED | Orchestration layer |
| C12.2.6 Golden Flow | ✅ COMPLETED | Create → verify → SSL → publish |

## 16. C12.3 Notification Center — Status

**Epic C12.3 COMPLETE** — Multi-channel notifications via EventBus

| Module | Status | Tests |
|--------|--------|-------|
| C12.3.1 Notification Domain | ✅ COMPLETED | Notification, Template, Preference, Event |
| C12.3.2 Template Engine | ✅ COMPLETED | Variable substitution, localization |
| C12.3.3 Delivery Engine | ✅ COMPLETED | Queue, retry, rate limiting, gateway abstraction |
| C12.3.4 Preferences | ✅ COMPLETED | Channel selection, quiet hours, frequency |
| C12.3.5 Event Integration | ✅ COMPLETED | EventBus subscription, Billing/Domain events |
| C12.3.6 Golden Flow | ✅ COMPLETED | Event → Template → Channel → Delivery |

**Architecture:** Notification Center receives EventBus events → renders templates → delivers via gateway. No knowledge of Billing/Domain business logic.

## 17. C12.4 Workflow Engine — Status

**Epic C12.4 COMPLETE** — Native n8n/Zapier equivalent

| Module | Status | Tests |
|--------|--------|-------|
| C12.4.1 Workflow Domain | ✅ COMPLETED | Workflow, Trigger, Action, Execution |
| C12.4.2 Trigger Engine | ✅ COMPLETED | EventBus, Cron, Webhook, Manual, Schedule |
| C12.4.3 Action Engine | ✅ COMPLETED | Plugin handlers, conditions, retries |
| C12.4.4 Workflow Runtime | ✅ COMPLETED | Step execution, compensation, rollback |
| C12.4.5 Workflow Registry | ✅ COMPLETED | Registration, versioning |
| C12.4.6 Golden Flow | ✅ COMPLETED | Billing → Provisioning → Publish → Notify |

**Architecture:** Workflow Engine orchestrates via PlatformContext. No business logic coupling.