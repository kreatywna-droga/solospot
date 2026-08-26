# TODO — PM34 (Agent 1) Runtime Preview Adapter (Browser → Builder Core)

> Status: FORMALLY RATIFIED 🔒

## Cel
Dostarczyć adapter i kontrakty łączące warstwę przeglądarki (Preview) z czystym silnikiem builder-core. **builder-core pozostaje 100% niezależny od środowiska wykonania** — kod zależny od window/document/IntersectionObserver/PointerEvent żyje w warstwie Preview (`src/components/builder/runtime-preview/`).

## Decyzje architektoniczne (zatwierdzone przez Architekta)
- **DECISION-038** — Runtime Preview Adapter Contract: builder-core definiuje TYLKO kontrakt; implementacja przeglądarkowa w warstwie Preview.
- **DECISION-039** — `AnimationTriggerContext` jest jedynym obiektem przekraczającym granicę Browser → Builder Core (żadnych MouseEvent/PointerEvent/WheelEvent/IntersectionObserverEntry w builder-core).
- **DECISION-040** — `AnimationRuntimePreviewBridge` integruje Trigger Engine + Runtime Bridge jako czysta warstwa, bez DOM i bez Playback Engine.
- **DECISION-041** — Browser Adapter nie przechowuje stanu biznesowego; tylko tłumaczy zdarzenia na niezmienne `AnimationTriggerContext` snapshoty.

## Zakres (builder-core + Preview)

### ETAP 1 — Runtime Preview Adapter Contract (builder-core)
- [ ] `AnimationRuntimePreviewAdapter.ts` — czysty interfejs: `connect()`, `disconnect()`, `subscribe(callback)` (bez `attach(target)` — brak sugerowania HTMLElement).
- [ ] Kontrakt niezależny od Browser API.

### ETAP 2 — Browser Adapter (warstwa Preview)
- [ ] `src/components/builder/runtime-preview/BrowserTriggerAdapter.ts` — zbiera scroll/click/hover/visibility (IntersectionObserver), konwertuje do `AnimationTriggerContext`.
- [ ] Bez logiki animacji/interpolacji/playback. Bez stanu (tylko tłumaczenie → niezmienne snapshoty).

### ETAP 3 — Runtime Preview Bridge (builder-core)
- [ ] `AnimationRuntimePreviewBridge.ts` — glue layer: TriggerEngine + RuntimeBridge.
- [ ] Brak logiki animacji, interpolacji, Playback Engine.

### ETAP 4 — Tests
- [x] `AnimationRuntimePreviewAdapter.test.ts` (kontrakt, czysty, Node).
- [x] `BrowserTriggerAdapter.test.ts` (mock Browser Environment: window/document/IntersectionObserver).
- [x] `AnimationTriggerBridge.test.ts` (integracja, Node).
- [ ] **Full Integration Test** — BrowserTriggerAdapter → TriggerContext → TriggerEngine → RuntimeBridge.

### ETAP 5 — Public API
- [ ] Aktualizacja `packages/builder-core/src/index.ts` — eksporty kontraktu i bridge.

### ETAP 6 — Quality Gates
- [ ] `npx vitest run` (PM34 subset) — PASS.
- [ ] `npx tsc --noEmit` — 0 nowych błędów (16 pre-istniejących, poza zakresem).
- [ ] `npm run build` — bez regresji (addytywny).

### ETAP 7 — Delta Report
- [ ] `docs/studio/PM34_DELTA_IMPLEMENTATION_REPORT.md` — z sekcją **Architectural Decisions Implemented** (DECISION-038/039/040/041).

## Zakres Niedozwolony (respektowany)
- ❌ CSS Animations, Web Animations API, requestAnimationFrame, Scheduler, Playback Loop, React Components, Inspector UI, Timeline UI, Canvas logic, Commerce/Platform Core.
- ❌ Żadne Browser API nie wchodzi do builder-core (DECISION-039).
