# SPRINT 7 MASTER PLAN — Single Source of Truth

> **Document Type:** Master Plan (Single Source of Truth)  
> **Sprint:** 7  
> **Official Name:** Inspector 2.0  
> **Created by:** Agent 1 (Implementation)  
> **Date:** 2026-08-04  
> **Status:** DRAFT — PENDING ARCHITECT APPROVAL  

---

## 0. Rozstrzygnięcie Rozbieżności (Discrepancy Resolution)

### Problem
W komunikacji zespołu pojawiła się rozbieżność dotycząca zakresu Sprintu 7:

| Źródło | Sprint 7 = |
|---------|------------|
| `docs/studio/82_PRODUCT_ROADMAP_6B_9.md` (oficjalna roadmapa) | **Inspector 2.0** |
| `docs/studio/104_SPRINT7_RELEASE_READINESS.md` (Główny Architekt) | **Inspector 2.0** |
| `docs/studio/103_SPRINT7_FINAL_ACCEPTANCE_REPORT.md` (Agent 2) | **Inspector 2.0** (PASS) |
| Ostatni raport (z poprzedniej sesji) | **Customer Runtime** ❌ |

### Werdykt
**Sprint 7 = Inspector 2.0**

**Uzasadnienie:**
1. Oficjalna roadmapa (`82_PRODUCT_ROADMAP_6B_9.md`) jednoznacznie definiuje Sprint 7 = Inspector 2.0.
2. Główny Architekt Systemu (`104_SPRINT7_RELEASE_READINESS.md`) oficjalnie zainicjował Sprint 7 jako Inspector 2.0.
3. Agent 2 (`103_SPRINT7_FINAL_ACCEPTANCE_REPORT.md`) przeprowadził audyt Sprint 7 (Inspector 2.0) z wynikiem PASS.
4. Komponenty Inspector 2.0 już istnieją w `packages/authoring-studio/src/inspector/` (InspectorShell, InspectorAccordion, AppearancePanel, TypographyPanel, LayoutPanel, DynamicPropertyPanel).
5. Referencja do "Customer Runtime" pochodzi z raportu w poprzedniej sesji i **nie ma pokrycia** w dokumentacji projektowej. Nie znaleziono tego terminu w żadnym pliku projektu.

### Status Sprint 7 (Inspector 2.0)
- **Audyt Agent 2:** 🟢 PASS (doc 103)
- **Architekt Approval:** 🟢 APPROVED (doc 104)
- **Komponenty:** Zaimplementowane w `packages/authoring-studio/`
- **Quality Gates:** 7/7 PASS

### Co dalej?
Ponieważ Sprint 7 (Inspector 2.0) został formalnie domknięty, kolejny sprint to:

**Sprint 8 — Animation Engine** (zgodnie z roadmapą `82_PRODUCT_ROADMAP_6B_9.md`)

> **Uwaga:** Jeśli zespół chce zmienić kolejność i zrealizować "Customer Runtime" przed Animation Engine, wymaga to oficjalnej decyzji Architekta i aktualizacji roadmapy w `82_PRODUCT_ROADMAP_6B_9.md`.

---

## 1. Cel Sprintu 7 (Inspector 2.0)

Rozbudowa panelu Inspektora w Builder Studio o:
1. Modułowe akordeony (InspectorAccordion) z sekcjami edycyjnymi.
2. Dynamiczne generowanie formularzy na podstawie Component Registry (PropSchema → UI controls).
3. Panele dziedzinowe: Layout, Typography, Appearance, Dynamic Properties.
4. Model wartości responsywnych (ResponsiveValue<T>) — Desktop/Tablet/Mobile.
5. Synchronizacja właściwości przez Command Bus do Runtime Preview.
6. Pełna integracja z szyną wiadomości Runtime Preview Channel.

---

## 2. Zakres (Scope)

### 2.1 Co wchodzi (In Scope)

#### A. Inspector Core
- `InspectorShell` — kontener główny, renderuje akordeony
- `InspectorAccordion` — modułowe sekcje rozwijane/zwijane
- Komunikacja jednokierunkowa przez Command Bus (brak bezpośredniej manipulacji DOM)

#### B. Property Panels
- `AppearancePanel` — kolor, tło, border, radius, shadow
- `TypographyPanel` — font, size, weight, line-height, letter-spacing
- `LayoutPanel` — display, flex/grid, padding, margin, width/height
- `DynamicPropertyPanel` — dynamiczne renderowanie na podstawie PropSchema z Component Registry

#### C. Property System
- `propertyFieldRegistry` — rejestr pól Inspectora
- `PropSchema` — model schematu właściwości (JSON → UI)
- `ResponsiveValue<T>` — wartości responsywne (Desktop/Tablet/Mobile)
- Walidacja Fail Fast (niepoprawne dane odrzucane na poziomie Inspectora)

#### D. Runtime Preview Integration
- `PreviewChannel` — szyna komunikacji Inspector → Runtime Preview
- `renderStore()` — aktualizacja podglądu na żywo po zmianie właściwości
- Cache invalidation przez PreviewChannel

#### E. Refaktoryzacja (Technical Debt z Sprint 6)
- Usunięcie klientowego wywołania `OrderRuntime` w storefront
- Implementacja `GET /api/store/order` (serwerowe pobieranie statusu zamówienia)

### 2.2 Co nie wchodzi (Out of Scope)

| Nie wchodzi | Uzasadnienie |
|-------------|--------------|
| Animation Engine | To jest Sprint 8 |
| Customer Runtime / Customer Dashboard | Nie jest częścią Sprint 7 (brak w roadmapie) |
| Production Ready audit | To jest Sprint 9 |
| Marketplace rozbudowa | Poza zakresem Inspektora |
| Mission Control rozbudowa | Poza zakresem Inspektora |
| Nowe szablony (templates) | Poza zakresem Inspektora |

---

## 3. Definition of Done (DoD)

Zgodnie z `docs/studio/81_DEFINITION_OF_DONE.md`:

### 3.1 Kod
- [x] Wszystkie komponenty Inspector 2.0 zaimplementowane
- [x] Brak logiki domenowej w warstwie UI (InspectorShell, DynamicPropertyPanel = czyste komponenty prezentacyjne)
- [x] Komunikacja z Preview jednokierunkowa przez Command Bus
- [x] Brak zależności cyklicznych w repozytorium

### 3.2 Testy
- [x] Testy jednostkowe dla wszystkich paneli Inspektora
- [x] Testy integracyjne dla PreviewChannel
- [x] `npx vitest run` — 0 failed
- [x] `npx tsc --noEmit` — 0 errors

### 3.3 Architektura
- [x] Zgodność z ADR-001, ADR-002, ADR-003
- [x] Separacja warstw: Builder → Runtime → Commerce → Infrastructure
- [x] Component Registry jako punkt rozszerzeń
- [x] Immutable Domain (BuilderDocument)

### 3.4 Dokumentacja
- [x] `docs/studio/117_SPRINT7_INSPECTOR_FOUNDATION_AUDIT.md`
- [x] `docs/studio/118_SPRINT7_PROPERTY_SYSTEM_AUDIT.md`
- [x] `docs/studio/103_SPRINT7_FINAL_ACCEPTANCE_REPORT.md`
- [x] `docs/studio/104_SPRINT7_RELEASE_READINESS.md`
- [x] `docs/studio/105_SPRINT7_MONITORING_PROFILE.md`

### 3.5 Build
- [x] `npm run build` — GREEN
- [x] `npm run lint` — 0 errors

---

## 4. Quality Gates

Zgodnie z `docs/studio/82_PRODUCT_ROADMAP_6B_9.md` (Sprint 7 — Inspector 2.0):

| Gate | Opis | Status |
|------|------|--------|
| `INSPECTOR_CORE_COMPLETE` | InspectorShell + InspectorAccordion zaimplementowane | ✅ PASS |
| `PROPERTY_PANEL_COMPLETE` | Wszystkie panele (Layout, Typography, Appearance, Dynamic) | ✅ PASS |
| `PROPERTY_REGISTRY_COMPLETE` | propertyFieldRegistry + PropSchema | ✅ PASS |
| `PROPERTY_SYNC_COMPLETE` | Synchronizacja przez Command Bus / PreviewChannel | ✅ PASS |
| `INSPECTOR_FREEZE_APPROVED` | Scope freeze zatwierdzony przez Architekta | ✅ PASS |
| `NO_REGISTRY_REGRESSION` | Brak regresji w Component Registry | ✅ PASS |
| `INSPECTOR_RENDER_TIME` | Render time < 12ms | ✅ PASS |
| `SYNC_TIME` | Sync time < 5ms | ✅ PASS |

**Wynik: 7/7 Quality Gates PASS** (potwierdzone przez Agent 2 w doc 103)

---

## 5. Role i Odpowiedzialności

### 5.1 Agent 1 (Implementation)

**Odpowiedzialności:**
- Implementacja komponentów Inspector 2.0
- Implementacja Property System (PropSchema, propertyFieldRegistry, ResponsiveValue)
- Implementacja PreviewChannel integration
- Refaktoryzacja technical debt (OrderRuntime client call)
- Pisanie testów jednostkowych i integracyjnych
- Przygotowanie Evidence Package (logi, wyniki testów, build logs)

**Nie może:**
- Deklarować "PASS" — może jedynie przekazać materiały do weryfikacji
- Zmieniać zakresu (Scope Freeze) bez aprobaty Architekta
- Pomijać Quality Gates

**Status deklaracji Agenta 1:**
```
READY FOR PM26 FINAL VERIFICATION
```
*(nie "READY FOR PM26 FINAL PASS" — Agent 1 nie ocenia własnej pracy)*

### 5.2 Agent 2 (Audit / Platform Engineering Maintenance)

**Odpowiedzialności:**
- Niezależny audyt architektoniczny implementacji
- Weryfikacja Quality Gates
- Sprawdzenie zgodności z ADR-001, ADR-002, ADR-003
- Weryfikacja braku logiki domenowej w UI
- Sprawdzenie regresji (Commerce, Builder SDK, Runtime)
- Wydanie werdyktu PASS / FAIL

**Narzędzia:**
- `docs/studio/88_SPRINT7_AUDIT_TEMPLATE.md`
- `docs/studio/87_INSPECTOR20_AUDIT_CHECKLIST.md`

### 5.3 Główny Architekt Systemu

**Odpowiedzialności:**
- Zatwierdzenie Scope Freeze
- Wydanie ostatecznej aprobaty (PM Final Pass)
- Inicjacja kolejnego sprintu

---

## 6. Punkty Kontrolne (Checkpoints)

| Checkpoint | Opis | Kto | Status |
|------------|------|-----|--------|
| **PM20** | Static Architecture Audit | Agent 2 | ✅ PASS |
| **PM21** | Release Gate & Integration Baseline | Agent 2 | ✅ PASS |
| **PM22** | Inspector Foundation Audit | Agent 2 | ✅ PASS (doc 117) |
| **PM23** | Property System Audit | Agent 2 | ✅ PASS (doc 118) |
| **PM24** | Sprint 6 Step 6 Architecture Audit | Agent 2 | ✅ PASS (doc 119) |
| **PM25** | Sprint 6 Step 6 Final Verification | Agent 2 | ✅ PASS (doc 120) |
| **PM26** | Sprint 7 Final Verification | Agent 2 | ✅ PASS (doc 103) |
| **PM27** | Sprint 7 Release Readiness | Architekt | ✅ APPROVED (doc 104) |

---

## 7. Architektura — Kluczowe Pliki

### 7.1 Inspector Components
```
packages/authoring-studio/src/inspector/
├── InspectorShell.tsx              # Główny kontener Inspektora
├── InspectorAccordion.tsx           # Modułowe akordeony
└── panels/
    ├── AppearancePanel.tsx          # Kolor, tło, border, radius, shadow
    ├── TypographyPanel.tsx          # Font, size, weight, line-height
    ├── LayoutPanel.tsx              # Display, flex/grid, padding, margin
    └── DynamicPropertyPanel.tsx     # Dynamiczne formularze z Registry
```

### 7.2 Runtime Preview
```
src/components/builder/canvas/
├── BuilderCanvas.tsx                # Canvas z podglądem
└── __tests__/
    └── RuntimePreviewChannel.test.ts # Testy PreviewChannel

src/lib/runtime/
└── renderStore.ts                   # Store renderowania (JSON → HTML)

src/app/preview-frame/[slug]/
└── page.tsx                          # Strona podglądu runtime
```

### 7.3 Selection & Overlay
```
src/components/builder/selection/
├── SelectionOverlay.tsx             # Nakładka selekcji
└── useOverlay.ts                    # Hook pozycjonowania overlay
```

### 7.4 Builder Shell
```
src/components/builder/shell/
└── BuilderTopBar.tsx                 # Górny pasek narzędzi
```

---

## 8. Zależności (Dependencies)

### 8.1 Wymagane (Sprint 7 zależy od)
- ✅ Sprint 6A (Drag & Drop Foundation) — COMPLETE
- ✅ Sprint 6B (Smart Guides Foundation) — COMPLETE
- ✅ Sprint 6C (Constraint Engine) — COMPLETE
- ✅ Sprint 6D (Responsive Engine) — COMPLETE
- ✅ `@web-factor/ui-core` — AVAILABLE
- ✅ Component Registry — AVAILABLE

### 8.2 Blokowane przez Sprint 7
- Sprint 8 (Animation Engine) — zależy od Inspector 2.0
- Sprint 9 (Production Ready) — zależy od wszystkich sprintów 5C–8

---

## 9. Ryzyka (Risks)

Zgodnie z `docs/studio/80_PRODUCT_RISK_REGISTER.md`:

| ID | Ryzyko | Prawdopodobieństwo | Wpływ | Status |
|----|--------|---------------------|-------|--------|
| RSK-017 | Inspector render time > 12ms | LOW | MEDIUM | ✅ MITIGATED |
| RSK-018 | Property sync time > 5ms | LOW | MEDIUM | ✅ MITIGATED |
| RSK-019 | Registry regression | LOW | HIGH | ✅ MITIGATED |
| RSK-020 | UI logic leak into domain | LOW | HIGH | ✅ MITIGATED |
| RSK-021 | Circular dependency | LOW | HIGH | ✅ MITIGATED |
| RSK-022 | Memory leak in Preview | LOW | MEDIUM | ✅ MITIGATED |

---

## 10. Roadmap Kontekst

```
[✅ 5C Canvas] ➔ [✅ 6A D&D] ➔ [✅ 6B Smart Guides] ➔ [✅ 6C Constraints] ➔ [✅ 6D Responsive] ➔ [✅ 7 Inspector 2.0] ➔ [⏳ 8 Animation Engine] ➔ [⏳ 9 Production Ready]
```

### Status sprintów:
- **Sprint 5C** — Canvas Foundation — ✅ COMPLETE
- **Sprint 6A** — Drag & Drop — ✅ COMPLETE
- **Sprint 6B** — Smart Guides — ✅ COMPLETE
- **Sprint 6C** — Constraint Engine — ✅ COMPLETE
- **Sprint 6D** — Responsive Engine — ✅ COMPLETE
- **Sprint 6 Step 3.3** — Storefront Shell — ✅ COMPLETE
- **Sprint 6 Step 4** — Cart Runtime — ✅ COMPLETE
- **Sprint 6 Step 5** — Checkout & Payment — ✅ COMPLETE
- **Sprint 6 Step 6** — Commerce Product Experience — ✅ COMPLETE (PM24 & PM25 PASS)
- **Sprint 7** — Inspector 2.0 — ✅ COMPLETE (PM26 PASS, PM27 APPROVED)
- **Sprint 8** — Animation Engine — ⏳ NEXT
- **Sprint 9** — Production Ready — ⏳ FUTURE

---

## 11. Następny Sprint (Sprint 8 — Animation Engine)

### Cel
Implementacja klatek kluczowych (keyframes), animacji scroll-triggered i efektów hover state.

### Zależności
- ✅ Inspector 2.0 (Sprint 7) — COMPLETE

### Oczekiwane rezultaty
- Keyframe Timeline
- Transition Engine
- `70_ANIMATION_ENGINE_FREEZE.md`

### Kryteria ukończenia
- DoD (Doc 81) PASS

---

## 12. Historia Zmian

| Data | Autor | Zmiana |
|------|-------|--------|
| 2026-08-04 | Agent 1 | Utworzenie dokumentu. Rozstrzygnięcie rozbieżności Inspector 2.0 vs Customer Runtime. |

---

> **Zastrzeżenie:** Ten dokument jest **jedynym źródłem prawdy** dla Sprintu 7. Wszelkie inne raporty wskazujące Sprint 7 = "Customer Runtime" są nieaktualne i zostały rozstrzygnięte w sekcji 0. Wszelkie zmiany zakresu wymagają aktualizacji tego dokumentu oraz aprobaty Głównego Architekta Systemu.