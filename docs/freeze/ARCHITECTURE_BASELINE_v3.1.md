# Architecture Baseline v3.1

**Epic:** C6 → C8 — Visual Builder & Media Manager  
**Baseline:** v3.1  
**Status:** APPROVED  
**Date:** 2026-07-19

---

## 1. Status platformy

| Dokument | Status |
|----------|--------|
| Architecture Freeze v3.0 | ✅ FROZEN |
| C6 Final Certification | ✅ CERTIFIED |
| C7 Final Certification | ✅ CERTIFIED |
| C8 Final Certification | ✅ CERTIFIED |
| Architecture Baseline v3.1 | ✅ APPROVED |

Wersja platformy: **Baseline v3.1**  
Kod stabilny: wszystkie pakiety w `packages/` spełniają warunki Architecture Freeze v3.0 + C8 additions.

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
| `provision-engine` | `packages/provision-engine` | Provisioning: ProvisionEngine, StoreConfigStage, TemplateStage | Provisioning |
| `publish-core` | `packages/publish-core` | Publikacja: PublishPipeline, ValidateStage, DeployStage | Publish |
| `publish-engine` | `packages/publish-engine` | Publikacja: DefaultPublishEngine, PublishEngineBuilder | Publish |
| `deployment-core` | `packages/deployment-core` | Deployment: Deployment providers (local, vercel, etc.) | Deployment |
| `package-registry` | `packages/package-registry` | Rejestr pakietów: PackageManifest, PackageRegistry, lifecycle | Marketplace |
| `commerce-engine` | `packages/commerce-engine` | Commerce: PaymentEngine, OrderProcessingEngine, CartEngine | Commerce |
| `mission-control-core` | `packages/mission-control-core` | Mission Control: StoreManagement, TenantManagement | Administration |
| `mission-control` | `packages/mission-control` | Mission Control UI | Administration |
| `customer-core` | `packages/customer-core` | Customer: CustomerRepository, CustomerSession | Customer |
| `customer-dashboard` | `packages/customer-dashboard` | Customer Dashboard UI | Customer |
| `asset-builder` | `packages/asset-builder` | Asset build pipeline | Asset |
| `checkout-ui` | `packages/checkout-ui` | Checkout UI components | Commerce |

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
│  package-registry | commerce-engine | mission-control-core   │
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
    ├── asset-manager-core
    │       └── (brak zależności od runtime/builder)
    │
    ├── provision-engine
    │       └── używa runtime-core (tylko w execute)
    │
    ├── publish-engine
    │       └── używa runtime-core (tylko w execute)
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
| dowolny pakiet | `require()` w kodzie produkcyjnym | Zamiast tego: dynamiczny `import()` |

---

## 4. Publiczne API

### 4.1 @stable — stabilne, niezmienne bez procesu

| Pakiet | Export | Typ | Opis |
|--------|--------|-----|------|
| `builder-core` | `BuilderDocument` | interface | Model dokumentu Buildera |
| `builder-core` | `CompiledDocument` | interface | Wyjście `compile()` — most do Runtime |
| `builder-core` | `createBuilderDocument` | factory | Fabryka dokumentu Buildera |
| `builder-core` | `compile` | function | Kompilacja BuilderDocument → CompiledDocument |
| `builder-core` | `PreviewMessage` | type union | Wiadomości Builder ↔ Preview |
| `builder-core` | `PreviewAck` | interface | Potwierdzenia Preview → Builder |
| `builder-core` | `createDocumentUpdate` | factory | Fabryka DOCUMENT_UPDATE |
| `builder-core` | `createSectionUpdate` | factory | Fabryka SECTION_UPDATE |
| `builder-core` | `createViewportChange` | factory | Fabryka VIEWPORT_CHANGE |
| `builder-core` | `PreviewChannel` | interface | Kanał komunikacji Builder ↔ Preview |
| `builder-core` | `createMemoryChannel` | factory | Kanał w pamięci |
| `builder-core` | `createPostMessageChannel` | factory | Kanał postMessage |
| `builder-core` | `createPreviewRuntimeAdapter` | factory | Adapter Builder → PreviewRuntime |
| `runtime-core` | `StoreConfig` | interface | Konfiguracja sklepu |
| `runtime-core` | `RuntimeContext` | interface | Kontekst wykonania runtime |
| `runtime-core` | `RuntimeMode` | type union | `LIVE \| PREVIEW \| EXPORT` |
| `runtime-core` | `createRuntimeContext` | factory | Fabryka kontekstu runtime |
| `runtime-core` | `RuntimeSection` | interface | Sekcja strony |
| `runtime-core` | `RuntimePage` | interface | Strona sklepu |
| `runtime-core` | `createRuntimeSection` | factory | Fabryka sekcji |
| `runtime-core` | `createRuntimePage` | factory | Fabryka strony |
| `theme-runtime` | `ThemeRuntime` | class | Silnik motywów per-tenant |
| `theme-runtime` | `RendererEngine` | class | Renderer layoutów z slotami |
| `theme-runtime` | `TemplateRuntime` | class | Runtime szablonów |
| `theme-runtime` | `PreviewSession` | class | Stan preview |
| `theme-runtime` | `PreviewPipeline` | class | Orkiestrator preview |
| `theme-runtime` | `PreviewRuntime` | class | Fasada dla adaptera |
| `theme-runtime` | `ThemeProvider` | class | Provider kontekstu motywu |
| `component-runtime` | `ComponentManifest` | interface | Manifest komponentu |
| `component-runtime` | `ComponentRegistry` | class | Rejestr komponentów |
| `component-runtime` | `ComponentResolver` | class | Dynamiczne ładowanie komponentów |
| `component-runtime` | `ComponentRenderer` | class | Renderowanie komponentów |
| `asset-manager-core` | `AssetStorage` | interface | Abstrakcja storage |
| `asset-manager-core` | `AssetLibrary` | interface | Abstrakcja biblioteki assetów |
| `asset-manager-core` | `SimpleAssetResolver` | class | Rozwiązuje AssetReference → URL |
| `asset-manager-core` | `AssetReference` | class | Referencja do assetu |
| `asset-manager-core` | `StorageFactory` | class | Fabryka storage (dynamiczny import) |
| `asset-manager-core` | `LocalAssetStorage` | class | Provider lokalny |
| `media-manager-core` | `MediaDocument` | interface | Model dokumentu mediów |
| `media-manager-core` | `AssetReference` | class | Referencja do assetu (media) |
| `media-manager-core` | `SimpleAssetResolver` | class | Rozwiązuje AssetReference → URL (media) |
| `media-manager-core` | `ProcessingPipeline` | class | Przetwarzanie assetów |
| `media-manager-core` | `UploadEngine` | class | Upload z retry/progress |
| `media-manager-ui` | `MediaLibrary` | component | Główny komponent biblioteki mediów |
| `media-manager-ui` | `AssetPicker` | component | Picker assetu w Builderze |
| `media-manager-ui` | `ImageEditor` | component | Edytor obrazów |

### 4.2 @experimental — mogą się zmienić w następnych epikach

| Pakiet | Export | Powód |
|--------|--------|-------|
| `theme-runtime` | `StorefrontRuntime` | W fazie eksperymentalnej integracji |
| `theme-runtime` | `ThemeResolver` | Może ulec zmianie przy integracji z Marketplace |
| `component-runtime` | `ComponentContext` | Kontekst komponentów może ulec rozszerzeniu |
| `builder-core` | `BuilderContext` | W fazie integracji z Builder UI |
| `preview-runtime` | `PreviewRuntimeResult` | Może ulec zmianie przy dodaniu metrics |
| `media-manager-ui` | `DragUploadZone` | Może ulec zmianie przy integracji z desktop |
| `media-manager-ui` | `UploadQueue` | Może ulec zmianie przy integracji z progress HUD |

### 4.3 @internal — nie dla użytku publicznego

| Pakiet | Export | Powód |
|--------|--------|-------|
| `builder-core` | `PreviewRenderer` | Legacy interface, backward compat tylko |
| `runtime-core` | `StoreRuntimeSnapshot` | Używany wewnętrznie przez runtime-composition |
| `component-runtime` | `ComponentRenderException` | Wewnętrzny błąd renderowania |
| `theme-runtime` | `ComponentRenderException` | Re-export z component-runtime |
| `media-manager-core` | `LocalAssetStorage` | Provider testowy |
| `media-manager-core` | `MemoryMediaLibrary` | Provider testowy |

---

## 5. Extension Points

### 5.1 Builder

| Punkt | Mechanizm | Opis |
|-------|-----------|------|
| Section types | `BuilderSection.type` | Nowe typy sekcji przez rozszerzenie union |
| Builder commands | `BuilderCommand` union + `applyCommandToDocument()` | Nowe komendy edycji |
| Preview messages | `PreviewMessage` union | Nowe typy wiadomości Builder ↔ Preview |
| Canvas actions | `CanvasAction` union | Nowe akcje na canvasie |

### 5.2 Runtime

| Punkt | Mechanizm | Opis |
|-------|-----------|------|
| Section renderers | `TemplateRuntime.registerSectionRenderer()` | Własne renderery sekcji |
| Theme components | `ThemeRuntime.registerComponent()` | Własne komponenty motywu |
| Component registry | `ComponentRegistry.register()` | Rejestracja komponentów |
| Layout templates | `RendererEngine.renderPage(layoutTemplate)` | Własne layouty |

### 5.3 Asset

| Punkt | Mechanizm | Opis |
|-------|-----------|------|
| Storage providers | `StorageFactory.registerProvider()` | Własne backend-y storage (S3, R2, etc.) |
| Asset types | `AssetType` union | Nowe typy assetów |
| Transformations | `AssetStorage.getUrl(options)` | Własne transformacje |

### 5.4 Media (NOWE w v3.1)

| Punkt | Mechanizm | Opis |
|-------|-----------|------|
| Media Pipeline Extension Point | `ProcessingPipeline.registerOperation()` | Własne operacje przetwarzania (watermark, OCR, etc.) |
| Image Transformer Extension Point | `ImageTransformer.transform()` | Własne transformacje obrazów przed zapisem |
| Storage Provider Extension Point | `MediaStorageProvider.upload()` | Własne backend-y dla mediów (S3, R2, GCS) |
| Asset Type Extension Point | `AssetType` union + `detectAssetType()` | Nowe typy mediów (3D, AR, etc.) |
| Upload Hook Extension Point | `UploadEngine.registerHook()` | Hooks przed/po uploadzie (virus scan, moderation) |

### 5.5 Theme

| Punkt | Mechanizm | Opis |
|-------|-----------|------|
| Design tokens | `ThemeManifest.tokens` | Własne tokeny designu |
| Component types | `ThemeComponent.type` | Własne typy komponentów |
| Layout system | `RendererEngine` slot system | Własne systemy layoutów |

### 5.6 Component

| Punkt | Mechanizm | Opis |
|-------|-----------|------|
| Component categories | `ComponentCategory` union | Nowe kategorie komponentów |
| Props schema | `ComponentPropsSchema` | Własne typy propsów |
| Loader mechanism | `ComponentLoader` | Własne mechanizmy ładowania |

### 5.7 Preview

| Punkt | Mechanizm | Opis |
|-------|-----------|------|
| Preview messages | `PreviewMessage` union | Nowe wiadomości |
| Session extensions | `PreviewSession` | Nowe pola w sesji preview |
| Pipeline hooks | `PreviewPipeline` | Hooks w orkiestracji |

### 5.8 Publish

| Punkt | Mechanizm | Opis |
|-------|-----------|------|
| Publish stages | `PublishStage` interface | Nowe etapy publikacji |
| Deployment providers | `DeploymentProvider` interface | Nowe providery deploymentu |
| Validation rules | `ValidateStage` | Własne reguły walidacji |

### 5.9 Commerce (NOWE w v3.1)

| Punkt | Mechanizm | Opis |
|-------|-----------|------|
| Repository providers | `RepositoryProvider` interface | Własne backend-y danych (Supabase, Prisma, etc.) |
| Payment gateways | `PaymentGateway` interface | Własne bramki płatności |
| Shipping providers | `ShippingProvider` interface | Własne przewoźnicy |
| Tax calculators | `TaxCalculator` interface | Własne kalkulatory podatkowe |
| Inventory strategies | `InventoryStrategy` interface | Własne strategie zarządzania stanem |

### 5.10 Marketplace

| Punkt | Mechanizm | Opis |
|-------|-----------|------|
| Package types | `PackageType` union | Nowe typy pakietów |
| Install hooks | `PackageLifecycle` | Hooks instalacji/aktualizacji |
| Capability system | `Capability` union | Nowe capabilities |

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
ValidateStage → DeployStage
    ↓
DeploymentProvider.deploy()
    ↓
LIVE URL returned
```

### 6.3 Marketplace → Install

```
User selects package
    ↓
PackageRegistry.resolve()
    ↓
PackageLifecycle.install()
    ↓
ProvisionEngine.withStage(new InstallStage())
    ↓
StoreConfig updated
    ↓
PublishEngine.execute()
    ↓
LIVE Store updated
```

### 6.4 Store Provisioning

```
Create tenant
    ↓
ProvisionEngine.execute()
    ↓
TemplateStage → StoreConfigStage
    ↓
StoreConfig generated
    ↓
Tenant isolated
    ↓
Ready for Builder
```

### 6.5 Runtime Request Flow

```
HTTP Request /[store_slug]
    ↓
CommerceEngine route handler
    ↓
loadStoreConfig(tenantId, storeId)
    ↓
RuntimeContext created (LIVE mode)
    ↓
TemplateRuntime.renderPage()
    ↓
ComponentRenderer.render()
    ↓
ThemeRuntime + AssetResolver
    ↓
HTML response
```

### 6.6 Media Manager Flow (NOWE w v3.1)

```
Upload
    ↓
MediaLibrary
    ↓
ImageEditing
    ↓
AssetReference
    ↓
Builder
    ↓
PreviewPipeline
    ↓
Publish
    ↓
Runtime/CDN
```

### 6.7 Commerce Checkout Flow (NOWE w v3.1 — planowane)

```
Create Store
    ↓
Create Product
    ↓
Add Image
    ↓
Customer opens Store
    ↓
Add Cart
    ↓
Checkout
    ↓
Payment
    ↓
Order Created
    ↓
Inventory Updated
    ↓
Published Runtime
```

---

## 7. Architecture Invariants

Te reguły są NIEZMIENNE. Każde naruszenie wymaga procesu wyjątkowego zgodnego z Architecture Freeze v3.0.

1. **Builder nie importuje Runtime poza adapterem.**  
   `builder-core` może komunikować się z `runtime-core` tylko przez `PreviewRuntimeAdapter.ts`. Żaden inny plik w `builder-core` nie może importować z `runtime-core`.

2. **AssetReference nigdy nie przechowuje URL.**  
   `AssetReference` przechowuje tylko `{ id, type }`. URL jest generowany dynamicznie przez `AssetResolver.resolve()`.

3. **Multi-tenant isolation jest obowiązkowa.**  
   Wszystkie registry (`ComponentRegistry`, `ThemeRuntime.registries`, `AssetLibrary`, `MediaLibrary`) muszą obsługiwać izolację per-tenant. Brak wycieków danych między tenantami.

4. **Runtime jest stateless.**  
   `RuntimeContext`, `StoreConfig`, `PreviewSession` są immutable po utworzeniu. Mutacje tworzą nowe instancje.

5. **One Engine Architecture (SEA).**  
   Istnieje JEDEN silnik renderowania (`TemplateRuntime` + `ComponentRuntime` + `ThemeRuntime` + `AssetResolver`). Nie ma oddzielnych silników dla Preview, Publish i Export — tylko różne tryby (`RuntimeMode`).

6. **Dynamiczne importy dla pluginów.**  
   Wszystkie pluginy, providery i komponenty ładowane są przez dynamiczne `import()`. Brak `require()` w kodzie produkcyjnym.

7. **Serializowalność kontraktów komunikacyjnych.**  
   Wszystkie wiadomości między Builder a Preview, oraz między API a Engine, muszą być serializowalne przez `JSON.stringify` i `postMessage`.

8. **Adapter jako jedyny most między warstwami.**  
   Każda warstwa komunikuje się z inną przez jasno zdefiniowany adapter/fasadę. Bezpośrednie importy między warstwami są zabronione.

9. **Error boundary obowiązkowy.**  
   Każdy publiczny punkt wejścia renderowania musi mieć error boundary. Błąd komponentu nie może zniszczyć całej strony ani Buildera.

10. **Testy jako gate.**  
    Każdy milestone musi kończyć się zielonymi testami, `tsc --noEmit` i produkcyjnym buildem przed przejściem do następnego.

11. **Commerce Engine nie zna Supabase.**  
    `commerce-engine` komunikuje się z bazą danych tylko przez `Repository` interface. Bezpośrednie zapytania SQL lub ORM w domenie commerce są zabronione.

12. **Transactions są obowiązkowe dla operacji finansowych.**  
    Checkout, płatności i aktualizacja stanu magazynowego muszą być wykonywane w transakcji z rollbackem w przypadku błędu.

---

## 8. Otwarte obszary rozwoju

### 8.1 C7 — Visual Builder Pro ✅ COMPLETED

**Cel:** Pełny edytor wizualny z drag & drop, snapping, constraints, responsywne układy.

**Status:** Production Complete

### 8.2 C8 — Media Manager ✅ COMPLETED

**Cel:** Zaawansowany menedżer mediów z uploadem, wyszukiwaniem, transformacjami i CDN.

**Status:** Production Complete

### 8.3 C9 — Commerce Persistence (aktualny)

**Cel:** Trwałość danych dla Commerce: produkty, zamówienia, klienci, magazyn.

**Zakres:**
- Repository layer (Supabase + Memory)
- Database schema z RLS
- Transaction layer dla checkout
- Commerce Data Resolver w runtime
- Golden commerce flow tests

**Zależności od C8:**  
C8.1-C8.8 (wszystkie zamrożone)

### 8.4 C10 — Marketplace Authoring

**Cel:** Tworzenie i publikacja własnych template'ów, komponentów i motywów przez twórców.

**Zakres:**
- Template authoring tool
- Component SDK
- Theme editor
- Publishing workflow
- Versioning i rollback

**Zależności od C9:**  
C9.1-C9.6 ( Commerce Persistence — zamrożone)

### 8.5 C11 — Workflow Automation

**Cel:** Automatyzacje sklepu (publikacja, import produktów, akcje po zamówieniach).

**Zakres:**
- Automation rules engine
- Webhook triggers
- Scheduled tasks
- Integration with external services

**Zależności od C9:**  
C9 (wszystkie — zamrożone)

### 8.6 C12 — AI Layer

**Cel:** Generowanie sklepów, sekcji, opisów i układów na bazie promptów.

**Zakres:**
- AI-powered layout generation
- Content generation (descriptions, SEO)
- Image generation/selection
- Natural language editing

**Zależności od C9:**  
C9 (wszystkie — zamrożone)

---

## 9. Wersja dokumentu

| Wersja | Data | Zmiany |
|--------|------|--------|
| 3.0 | 2026-07-19 | Architecture Freeze + C6 Final Certification + Architecture Baseline |
| 3.1 | 2026-07-19 | C7 + C8 Final Certification + Media packages + Media/Commerce extension points + Commerce Persistence plan |

---

## 10. Podpis cyfrowy

Ten dokument jest oficjalnym punktem odniesienia dla wszystkich następnych sprintów i epików w WEB FACTOR. Każda zmiana wymaga procesu wyjątkowego zgodnego z Architecture Freeze v3.0.

**Status:** APPROVED ✅  
**Data:** 2026-07-19  
**Wersja:** 3.1
