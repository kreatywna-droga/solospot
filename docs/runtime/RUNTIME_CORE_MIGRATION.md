# Runtime Core Migration Map

## Sprint
**B1.1 — Runtime Core Unification**

---

## 1. Cel migracji

**Opis:**
WEB FACTOR posiada obecnie dwa modele runtime:

- `src/lib/runtime`
- `src/lib/store-runtime`

Celem Sprint B1 jest stworzenie jednego Runtime Engine.

**Docelowy przepływ:**

Template
    ↓
Runtime Config
    ↓
Runtime Engine
    ↓
Runtime Result
    ↓
Section Renderer
    ↓
Published Store
    ↓
HTML Export

---

## 2. Aktualny stan

### 2.1 Runtime Core (ACTIVE)

**Lokalizacja:**
`src/lib/runtime/`

**Aktualne elementy:**
- `RuntimeTypes.ts`
- `RuntimeResolver.ts`
- `RuntimeValidator.ts`
- `StoreRuntime.ts`
- `index.ts`

#### `RuntimeTypes.ts`

**Obecne kontrakty:**
- `RuntimeSection`
- `RuntimePage`
- `RuntimeTheme`
- `RuntimeNavigation`
- `RuntimeSEO`
- `RuntimeProduct`
- `StoreRuntimeConfig`
- `RuntimeResult`

**Problem:**
- `RuntimeResult` wymaga ujednolicenia w kierunku kontraktu Sprint B1.1.2.

#### `RuntimeResolver.ts`

**Aktualna odpowiedzialność:**
- `Store` + `Products` + `Template`
- wynik: `StoreRuntimeConfig`

**Status:** ✅ działa

**Do poprawy:**
- mocniejszy contract
- blokowanie niepoprawnych konfiguracji

#### `RuntimeValidator.ts`

**Aktualnie:**
- walidacja konfiguracji
- `canRender()`
- `isPubliclyAccessible()`

**Do rozszerzenia:**
- Runtime Gate.

#### `StoreRuntime.ts`

**Aktualnie:**
- `StoreRuntimeConfig` → `RuntimeResult`

**Problem (plan):**
- brakuje pipeline/lifecycle/versioning/preview/export mode

### 2.2 Legacy Runtime

**Lokalizacja:**
`src/lib/store-runtime/`

**Status:** `LEGACY`

**DO NOT EXTEND**

**Aktualne elementy:**
- `StoreRenderer.ts`
- `types.ts`

**Problem:**
- posiada własne kontrakty
  - inne typy sekcji
  - własny `RenderedPage`
  - własny model theme
- nie może być rozwijany
- jedyną dopuszczalną rolą jest izolacja i przepisanie zależności do nowego runtime core

---

## 3. Docelowa architektura Runtime Engine 2.0

**renderStore(slug)**

→ `RuntimeResolver`

→ `RuntimeValidator`

→ `RuntimeEngine`

→ `RuntimeResult`

→ `SectionRegistry`

→ `SectionRenderer`

→ Output Mode

**Output:**
- `LIVE`
- `PREVIEW`
- `EXPORT`

---

## 4. Docelowy kontrakt RuntimeSection

```ts
RuntimeSection {
  id: string
  type: string
  props: object
  order: number
  visible: boolean
}
```

- sekcja nie zna implementacji komponentów
- łączenie:
  - `type` → registry → component

---

## 5. Docelowy RuntimeResult (Unified)

W Sprint B1.1.2 obowiązuje **jeden** kontrakt wyniku dla wszystkich trybów.

```ts
RuntimeResult {
  success: boolean
  storeId: string
  tenantId: string
  slug: string
  version: string
  config: StoreRuntimeConfig
  page: RuntimePage
  sections: RuntimeSection[]
  errors?: string[]
}
```

- jeden kontrakt dla:
  - live store
  - preview
  - export

---

## 6. Public API

**Docelowy punkt wejścia:**

- `renderStore(slug)`

**Zasada:**
Każdy system korzysta tylko z niego:
- `/store/[slug]`
- preview
- export
- builder
- marketplace provisioning

---

## 7. Migracja plików (zasady)

- **Zostaje:** `src/lib/runtime/*`
- **Zamrożone:** `src/lib/store-runtime/*`

Dodać:

- `src/lib/store-runtime/README.md`

**Treść (guideline):**

```txt
LEGACY RUNTIME

This module is frozen.
Do not add new features.
```

---

## 8. Kolejność implementacji B1

1. **B1.1.2** — Runtime Core API (kontrakty)
   - dodanie `RuntimeEngine.ts`
2. **B1.1.3** — Unified RuntimeResult
3. **B1.2** — Section Contract System
4. **B1.3** — Section Registry
5. **B1.4** — Runtime Pipeline
6. **B1.5** — Preview Engine
7. **B1.6** — Publication Lifecycle
8. **B1.7** — Export Foundation
9. **B1.8** — Test Matrix

---

## 9. Kryteria zamknięcia B1.1

Sprint przechodzi dalej tylko gdy:
- ✅ istnieje dokument migracji
- ✅ `src/lib/runtime` jest jedynym core
- ✅ `src/lib/store-runtime` oznaczone jako legacy
- ✅ `RuntimeResult` ma jeden kontrakt
- ✅ istnieje plan renderStore()
- ✅ `runtime-core.test.ts` przygotowany

Po wykonaniu nie ruszać kodu.

Następny krok dopiero:
**B1.1.2 — Runtime Core API + RuntimeEngine.ts**

