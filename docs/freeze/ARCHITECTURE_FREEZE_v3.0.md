# Architecture Freeze v3.0

**Epic:** C6 — Visual Builder & Runtime Layer  
**Status:** FROZEN  
**Date:** 2026-07-19

---

## 1. Cel

Zamrożenie architektury wszystkich pakietów wchodzących w skład Visual Builder i Runtime Layer. Od tego momentu zmiana publicznych kontraktów wymaga procesu wyjątkowego.

---

## 2. Zasady ogólne

1. **Jedna kierunkowa zależność.** Zależności między pakietami muszą być acykliczne (DAG).
2. **Adapter jako jedyny most.** `builder-core` może komunikować się z `runtime-core` tylko przez `PreviewRuntimeAdapter`. Żaden inny plik w `builder-core` nie może importować z `runtime-core`.
3. **Dynamiczne importy.** Ładowanie komponentów, providerów i pluginów odbywa się przez dynamiczne `import()`, nie przez `require()`.
4. **Izolacja tenantów.** Wszystkie registry i cache są per-tenant lub wymagają jawnego `tenantId`.
5. **Serializowalność kontraktów.** Wszystkie wiadomości Builder ↔ Preview muszą być serializowalne przez `postMessage` i `JSON.stringify`.
6. **Brak logiki biznesowej w UI.** Builder UI nie zawiera logiki sklepu — tylko stan i komendy edycji.

---

## 3. Diagram zależności modułów

```
platform-core
    │
    ├── runtime-core
    │       │
    │       ├── runtime-composition
    │       │
    │       ├── theme-runtime
    │       │       │
    │       │       ├── TemplateRuntime
    │       │       ├── ThemeRuntime
    │       │       ├── RendererEngine
    │       │       ├── PreviewSession
    │       │       ├── PreviewPipeline
    │       │       └── PreviewRuntime
    │       │
    │       └── component-runtime
    │               │
    │               ├── ComponentRegistry
    │               ├── ComponentResolver
    │               ├── ComponentRenderer
    │               └── ComponentManifest
    │
    ├── builder-core
    │       │
    │       ├── BuilderDocument
    │       ├── BuilderCommands
    │       ├── PreviewContract
    │       ├── PreviewMessage
    │       └── PreviewRuntimeAdapter  ← jedyny most do runtime-core
    │
    ├── asset-manager-core
    │       │
    │       ├── AssetStorage
    │       ├── AssetLibrary
    │       ├── SimpleAssetResolver
    │       └── LocalAssetStorage
    │
    ├── provision-engine
    │       │
    │       └── StoreConfigStage  → używa runtime-core
    │
    ├── publish-engine
    │       │
    │       └── loadStoreConfig → używa runtime-core
    │
    ├── deployment-core
    │
    ├── marketplace-core
    │
    └── customer-dashboard
```

---

## 4. Zamrożone kontrakty publiczne

### 4.1 builder-core

| Export | Typ | Opis |
|--------|-----|------|
| `BuilderDocument` | interface | Główny model dokumentu Buildera |
| `CompiledDocument` | interface | Wyjście `compile()` — most do Runtime |
| `createBuilderDocument` | factory | Tworzy dokument Buildera |
| `compile` | function | Kompiluje `BuilderDocument` → `CompiledDocument` |
| `PreviewMessage` | type union | Wszystkie wiadomości Builder → Preview |
| `PreviewAck` | interface | Potwierdzenia Preview → Builder |
| `createDocumentUpdate` | factory | Fabryka wiadomości DOCUMENT_UPDATE |
| `createSectionUpdate` | factory | Fabryka wiadomości SECTION_UPDATE |
| `createViewportChange` | factory | Fabryka wiadomości VIEWPORT_CHANGE |
| `PreviewChannel` | interface | Kanał komunikacji Builder ↔ Preview |
| `createMemoryChannel` | factory | Kanał w pamięci (testy/SSR) |
| `createPostMessageChannel` | factory | Kanał przez `postMessage` (iframe) |
| `createPreviewRuntimeAdapter` | factory | Adapter Builder → PreviewRuntime |
| `PreviewRenderer` | interface | Legacy interface dla adaptera (backward compat) |

**Reguła importu:** Żaden plik w `builder-core` nie może importować z `runtime-core` poza `PreviewRuntimeAdapter.ts`.

### 4.2 runtime-core

| Export | Typ | Opis |
|--------|-----|------|
| `StoreConfig` | interface | Konfiguracja sklepu po provisioning |
| `RuntimeContext` | interface | Kontekst wykonania runtime |
| `RuntimeMode` | type union | `LIVE \| PREVIEW \| EXPORT` |
| `createRuntimeContext` | factory | Tworzy kontekst runtime |
| `RuntimeSection` | interface | Sekcja strony |
| `RuntimePage` | interface | Strona sklepu |
| `createRuntimeSection` | factory | Fabryka sekcji |
| `createRuntimePage` | factory | Fabryka strony |

### 4.3 theme-runtime

| Export | Typ | Opis |
|--------|-----|------|
| `ThemeRuntime` | class | Silnik motywów per-tenant |
| `RendererEngine` | class | Renderer layoutów z slotami |
| `TemplateRuntime` | class | Runtime szablonów — sekcje → HTML |
| `PreviewSession` | class | Stan preview (enkapsulacja) |
| `PreviewPipeline` | class | Orkiestrator łańcucha preview |
| `PreviewRuntime` | class | Fasada dla PreviewRuntimeAdapter |
| `ThemeProvider` | class | Provider kontekstu motywu |

**Reguła importu:** `theme-runtime` może importować z `runtime-core` i `component-runtime`. Żadne inne pakiety nie mogą importować z `theme-runtime` poza `builder-core` (tylko `PreviewRuntime`).

### 4.4 component-runtime

| Export | Typ | Opis |
|--------|-----|------|
| `ComponentTypes` | interface/type | Podstawowe typy: `ComponentManifest`, `ComponentRenderContext` |
| `ComponentManifest` | interface | Manifest komponentu (id, version, propsSchema, loader) |
| `ComponentManifestLoader` | class | Ładowanie i walidacja manifestów |
| `ComponentRegistry` | class | Rejestr komponentów z izolacją tenantów |
| `ComponentResolver` | class | Dynamiczne ładowanie komponentów React |
| `ComponentRenderer` | class | Renderowanie komponentów do HTML string |
| `ComponentContext` | symbol/interface | Kontekst runtime dla komponentów |

**Reguła importu:** `component-runtime` może importować z `runtime-core` (tylko typy). Nie może importować z `theme-runtime` ani `builder-core`.

### 4.5 asset-manager-core

| Export | Typ | Opis |
|--------|-----|------|
| `AssetStorage` | interface | Abstrakcja storage |
| `AssetLibrary` | interface | Abstrakcja biblioteki assetów |
| `SimpleAssetResolver` | class | Rozwiązuje `AssetReference` → URL |
| `AssetReference` | class | Lekka referencja do assetu |
| `StorageFactory` | class/object | Fabryka storage (dynamiczny import providerów) |
| `LocalAssetStorage` | class | Provider lokalny (dev/test) |

**Reguła importu:** `asset-manager-core` nie może importować z żadnego pakietu runtime ani builder.

---

## 5. Zamrożone API Preview Protocol

### 5.1 Komunikacja Builder ↔ Preview

Wszystkie wiadomości muszą być serializowalne:

```typescript
// DOZWOLONE
type PreviewMessage =
  | { messageType: 'DOCUMENT_UPDATE'; document: BuilderDocument; changedSectionIds?: string[] }
  | { messageType: 'SECTION_UPDATE'; pageId: string; sectionId: string; props: Record<string, unknown> }
  | { messageType: 'VIEWPORT_CHANGE'; width: number; label: 'MOBILE' | 'TABLET' | 'DESKTOP' }
  | { messageType: 'PING' }
  | { messageType: 'RESET' };

// AKCEPTOWANE
interface PreviewAck {
  ackType: 'RENDERED' | 'ERROR' | 'PONG' | 'READY';
  correlationId: string;
  timestamp: number;
  renderTimeMs?: number;
  error?: string;
  sectionId?: string;
}
```

### 5.2 Adapter contract

```typescript
interface PreviewRuntime {
  renderPage(compiled: CompiledDocument, viewport?: { width: number; label: ViewportLabel }): Promise<PreviewRuntimeResult>;
  renderSection(pageId: string, sectionId: string, props: Record<string, unknown>): Promise<PreviewRuntimeResult>;
}
```

Adapter NIE może:
- renderować HTML bezpośrednio
- modyfikować `BuilderDocument`
- importować `TemplateRuntime`, `ComponentRuntime`, `ThemeRuntime`, `AssetResolver`

---

## 6. Zamrożone przepływy

### 6.1 Preview Pipeline

```
BuilderDocument
    ↓ compile()
CompiledDocument
    ↓ PreviewRuntimeAdapter
PreviewRuntime
    ↓
PreviewPipeline
    ↓
TemplateRuntime + ComponentRenderer + ThemeRuntime + AssetResolver
    ↓
HTML
```

### 6.2 Asset Resolution

```
AssetReference { id, type }
    ↓
SimpleAssetResolver
    ↓
AssetLibrary.getById()
    ↓
AssetStorage.getUrl()
    ↓
URL string
```

### 6.3 Component Loading

```
ComponentManifest { id, runtime.loader }
    ↓
ComponentResolver.resolve()
    ↓
manifest.runtime.loader()  // dynamic import()
    ↓
React.ComponentType
    ↓
renderToString(props)
```

---

## 7. Punkty rozszerzeń (Extension Points)

| Punkt | Pakiet | Sposób rozszerzenia |
|-------|--------|---------------------|
| Section renderers | `theme-runtime` | `TemplateRuntime.registerSectionRenderer()` |
| Theme components | `theme-runtime` | `ThemeRuntime.registerComponent()` |
| Component registry | `component-runtime` | `ComponentRegistry.register()` |
| Asset providers | `asset-manager-core` | `StorageFactory.registerProvider()` |
| Preview messages | `builder-core` | Rozszerzenie `PreviewMessage` union |
| Builder commands | `builder-core` | `BuilderCommand` union + `applyCommandToDocument()` |
| Provision stages | `provision-engine` | `ProvisionStage` interface |

---

## 8. Zabronione wzorce

1. `builder-core` importuje `runtime-core` poza `PreviewRuntimeAdapter.ts`
2. `component-runtime` importuje `theme-runtime`
3. `theme-runtime` importuje `builder-core`
4. `asset-manager-core` importuje dowolny pakiet runtime
5. `require()` w kodzie produkcyjnym — tylko `import()` dynamiczne
6. Modułowa zmiana publicznych kontraktów bez procesu wyjątkowego
7. Logika biznesowa w komponentach UI Buildera

---

## 9. Proces zmiany zamrożonych kontraktów

1. Wniosek o zmianę kontraktu (contract change request)
2. Review architektoniczny
3. Weryfikacja wpływów na wszystkie pakiety zależne
4. Aktualizacja testów integracyjnych
5. Aktualizacja dokumentacji
6. Zamrożenie nowej wersji kontraktu

**Domyślnie:** zmiana zamrożonego kontraktu jest odrzucana. Dopuszczalna tylko w przypadku bugów bezpieczeństwa lub krytycznych usterek.
