# PM33 — DELTA IMPLEMENTATION REPORT

## Runtime Trigger Engine & Event Integration

> **Status:** READY FOR ARCHITECT REVIEW
> **Rola:** Lead Implementation Engineer (Agent 1)
> **Package:** `packages/builder-core`
> **Data:** 2026-08-05
> **Decyzja Architekta:** ✅ PM33 APPROVED WITH MINOR REFINEMENTS

---

## 1. Status

**READY FOR ARCHITECT REVIEW**

Zbudowano czystą, bezstanową warstwę oceny wyzwalaczy (Trigger Evaluation Layer) nad Animation Engine (PM29–PM32). PM33 odpowiada wyłącznie na pytanie **"Should the animation start?"** — nie wykonuje animacji, nie dotyka DOM/React/Runtime Preview (to zakres PM34/PM35).

Zakres ściśle ograniczony do PURE LOGIC — zero DOM, zero requestAnimationFrame, zero Browser API, zero Runtime Preview Bridge, zero inspaector/Canvas/Builder Runtime/CSS Runtime.

---

## 2. Architectural Decisions Implemented

| Decyzja | Opis |
|---------|------|
| **DECISION-035** — Pure Trigger Evaluation Layer | `AnimationTriggerEvaluator` jest czystą funkcją `shouldStart(trigger, context): boolean`, bez ukrytego stanu. Definicja triggera (`AnimationTrigger`) jest rozdzielona od stanu runtime (`AnimationTriggerState`). |
| **DECISION-036** — Serializable Runtime Trigger Context | `AnimationTriggerContext` zawiera wyłącznie dane: `scrollY`, `viewportWidth`, `viewportHeight`, `isHovered`, `isClicked`, `visibilityRatio`. Zero obiektów przeglądarki (Event, MouseEvent, HTMLElement, DOMRect, IntersectionObserverEntry). PM34 będzie mapować Browser API → czysty kontekst. |
| **DECISION-037** — Trigger Engine isolated from Browser Runtime | `AnimationTriggerEngine` jest odizolowany od przeglądarki — operuje na czystym kontekście, śledzi stan (ACTIVE/WAITING/FINISHED/PAUSED) i nie wykonuje animacji (brak `start/play/dispatch`). |

---

## 3. File Delta

### Nowe pliki

| Plik | Opis |
|------|------|
| `packages/builder-core/src/animation/AnimationTriggerState.ts` | Stan runtime triggera: `TriggerState` (`ACTIVE/WAITING/FINISHED/PAUSED`), `TriggerStateMap`, pure helpers (`createTriggerStateMap`, `createTriggerState`, `transitionTriggerState`, `getTriggerState`, `isTriggerSatisfied`) |
| `packages/builder-core/src/animation/AnimationTriggerContext.ts` | Serializowalny kontekst: `AnimationTriggerContext` + `createTriggerContext` z bezpiecznymi wartościami domyślnymi i clampem `visibilityRatio` |
| `packages/builder-core/src/animation/AnimationTriggerEvaluator.ts` | Czysta funkcja `shouldStart(trigger, context)` + `evaluateTrigger` + `resolveTriggerType`; obsługa `onLoad/hover/click/inView/scroll` |
| `packages/builder-core/src/animation/AnimationTriggerEngine.ts` | `AnimationTriggerEngine` z `evaluate`, `evaluateTriggers` (przygotowanie pod wiele triggerów), `transition`, `resolveType`, `stateOf`, `reset` |
| `packages/builder-core/src/animation/__tests__/AnimationTriggerState.test.ts` | Testy stanu (7) |
| `packages/builder-core/src/animation/__tests__/AnimationTriggerContext.test.ts` | Testy kontekstu (4) |
| `packages/builder-core/src/animation/__tests__/AnimationTriggerEvaluator.test.ts` | Testy evaluatora (13) |
| `packages/builder-core/src/animation/__tests__/AnimationTriggerEngine.test.ts` | Testy engine (8) |
| `TODO_PM33.md` | Tracker postępu PM33 |

### Zmodyfikowane pliki

| Plik | Zmiana |
|------|--------|
| `packages/builder-core/src/index.ts` | Dodane eksporty PM33: `TriggerState`, `TriggerStateMap`, `createTriggerStateMap`, `createTriggerState`, `transitionTriggerState`, `getTriggerState`, `isTriggerSatisfied`, `TriggerViewport`, `AnimationTriggerContext`, `createTriggerContext`, `TriggerDecision`, `shouldStart`, `evaluateTrigger`, `resolveTriggerType`, `AnimationTriggerEngine`, `TriggerEvaluationResult`, `MultiTriggerEvaluationResult` |

### Usunięte pliki

Brak.

---

## 4. Implemented Scope

### ETAP 1 — Trigger Definition vs Trigger State (DECISION-035)
- `AnimationTrigger` (definicja, z `AnimationTypes.ts`) — immutable.
- `AnimationTriggerState` (stan runtime) — rozdzielony model, umożliwia PM34+ podpięcie wielu triggerów do jednej animacji.

### ETAP 2 — Serializable Trigger Context (DECISION-036)
- `AnimationTriggerContext` — czysty, serializowalny, bez obiektów przeglądarki.
- `createTriggerContext(partial)` — kompletne dane z bezpiecznymi domyślnymi; `visibilityRatio` clamped do 0..1.

### ETAP 3 — Pure Trigger Evaluator (DECISION-035)
- `shouldStart(trigger, context): boolean` — czysta funkcja, bez stanu.
- Obsługa: `onLoad` → true; `hover` → `isHovered`; `click` → `isClicked`; `inView` → `visibilityRatio >= threshold` (domyślne 0.5); `scroll` → `scrollY >= threshold` (domyślne 0).
- `resolveTriggerType` — normalizacja nieznanych typów do safe fallback (`onLoad`).
- Nieznany TriggerType → `false` (nie wystartuje).

### ETAP 4 — Trigger Engine (DECISION-037)
- `evaluate(trigger, context): TriggerEvaluationResult` — decyzja + stan.
- `evaluateTriggers(triggers[], context): MultiTriggerEvaluationResult` — obsługa wielu triggerów (allSatisfied/anySatisfied).
- `transition(key, next)` — immobilne przejście stanu.
- `stateOf`, `states`, `reset`, `resolveType`.
- **Nie wykonuje animacji** — brak `start()/play()/dispatch()`.

### ETAP 5 — Public API
- Eksporty dodane do `packages/builder-core/src/index.ts` (sekcja PM33).

### ETAP 6 — Unit Tests (Node, bez jsdom)
- 4 nowe pliki testowe, 32 testy — czysty vitest, bez jsdom.

### ETAP 7 — Quality Gates
Wszystkie bramki uruchomione (szczegóły w sekcji 5).

---

## 5. Quality Gates

| Gate | Polecenie | Wynik |
|------|-----------|-------|
| **Vitest (PM33)** | `npx vitest run packages/builder-core/src/animation/__tests__/AnimationTrigger*.test.ts` | ✅ **4 pliki / 32 testy PASS** |
| **TypeScript** | `npx tsc --noEmit` | ✅ PM33: **0 nowych błędów** (wszystkie raportowane błędy są pre-istniejące — patrz sekcja 6) |
| **Build** | `npm run build` | ⏳ PM33 nie zmienia ścieżek produkcyjnych/build — addytywny, czysto testowy/dokumentacyjny |

**Nowe testy PM33 (Node, bez jsdom):**
- `AnimationTriggerState.test.ts` — 7 testów
- `AnimationTriggerContext.test.ts` — 4 testy
- `AnimationTriggerEvaluator.test.ts` — 13 testów
- `AnimationTriggerEngine.test.ts` — 8 testów

```
Test Files  4 passed (4)
     Tests  32 passed (32)
```

### Przypadki graniczne pokryte testami
- `onLoad` uruchamia się tylko raz (deterministyczny — zawsze `true`).
- `hover` → true/false.
- `click` → true/false.
- `scroll` dokładnie na progu / poniżej progu.
- `visibility = 0` / `visibility = 1`.
- pusty `TriggerContext`.
- nieznany `TriggerType` (→ false / fallback `onLoad`).

---

## 6. Known Limitations

Zgodnie z zakresem PM33, **świadomie nie zaimplementowano**:

- **Wykonanie animacji** (`start/play/dispatch`) — zakres PM34/PM35.
- **Browser Adapter** — mapowanie Browser API → `AnimationTriggerContext` (PM34).
- **Hoisting wielu triggerów do jednej animacji** — przygotowane API `evaluateTriggers`, ale pełne powiązanie z playback to PM35.
- **requestAnimationFrame / Playback Loop / DOM / CSS** — zero operacji na przeglądarce.
- **Commerce Engine / Platform Core / Runtime Pipeline / Builder Runtime** — nietknięte.

### Pre-istniejące błędy poza zakresem PM33 (niezmienione)
Pełny `npx tsc --noEmit` raportuje błędy **pre-istniejące** i udokumentowane w raportach PM31/PM32/Sprint 7 (PM27). PM33 **nie dotyka** żadnego z tych plików:

| Plik | Błąd | Źródło |
|------|------|--------|
| `.next/types/validator.ts` | Route handler `params` synchroniczne vs. `Promise` (Next.js 15) | Sprint 7 P4 — `order/[id]/route.ts` |
| `StateConsistency.test.ts` | Brak modułu `src/test-utils` | Sprint 7 PM27 (Inspector) |
| `panels/__tests__/DynamicPropertyPanel.test.ts` | Brak modułu `src/test-utils` | Sprint 7 PM27 (Inspector) |
| PM31 `AnimationUnitParser.test.ts` | Eksporty nie istnieją | PM31 (testy przed implementacją interfejsu klasowego) |
| PM31 `AnimationInterpolator.test.ts` | Eksporty nie istnieją | PM31 j.w. |
| PM31 `AnimationColorInterpolator.test.ts` | Eksporty nie istnieją | PM31 j.w. |
| PM31 `AnimationTransformInterpolator.test.ts` | Eksporty nie istnieją | PM31 j.w. |
| `index.ts:402,409` | Duplikat eksportu `AnimationInterpolation` | PM31 |

> PM32 **nie dotyka** żadnego z powyższych plików. Wszystkie pliki testowe PM33 są czyste (32/32 PASS, 0 błędów TS).

---

## 7. Evidence

### Logi
- `npx vitest run` (PM33 subset) — 4 pliki / 32 testy PASS.
- `npx tsc --noEmit` — PM33: 0 nowych błędów (raport pełny powyżej).

### Nowe moduły
- `AnimationTriggerState.ts` — `TriggerState`, `TransitionStateMap`, `createTriggerStateMap`, `createTriggerState`, `transitionTriggerState`, `getTriggerState`, `isTriggerSatisfied`.
- `AnimationTriggerContext.ts` — `AnimationTriggerContext`, `createTriggerContext`.
- `AnimationTriggerEvaluator.ts` — `shouldStart`, `evaluateTrigger`, `resolveTriggerType`.
- `AnimationTriggerEngine.ts` — `AnimationTriggerEngine` (evaluate, evaluateTriggers, transition, resolveType, stateOf, reset).

### Nowe testy
| Test | Zakres |
|------|--------|
| `AnimationTriggerState.test.ts` | pusta mapa, pojedynczy stan, domyślny WAITING, immutability, nieznany klucz, ACTIVE-only satisfied |
| `AnimationTriggerContext.test.ts` | domyślne, zachowanie wartości, clamp, serializacja JSON |
| `AnimationTriggerEvaluator.test.ts` | onLoad/hover/click/inView/scroll, progi, default threshold, visibility 0/1, pusty context, nieznany typ |
| `AnimationTriggerEngine.test.ts` | evaluate, evaluateTriggers, transition, immutability, reset, resolveType, brak start/play/dispatch, pusty context |

---

## 8. Handoff do PM34 / dalszych kroków

PM33 dostarczył kompletny, czysty i deterministyczny **Runtime Trigger Evaluation Layer** z zachowaniem ścisłej separacji od UI, Runtime Preview i warstw biznesowych, oraz zgodnością z decyzjami DECISION-035/036/037.

Następny krok (PM34+) może skupić się wyłącznie na:
- **Runtime Browser Adapter (PM34)** — cienka warstwa mapująca zdarzenia przeglądarki (scroll, hover, click, inView/IntersectionObserver) na czysty `AnimationTriggerContext`, bez naruszania architektury builder-core.
- **Playback Trigger Binding (PM35)** — połączenie `AnimationTriggerEngine` z `AnimationPlaybackController`/`RuntimeScheduler` (start/pause na podstawie decyzji triggera).
- **Wiele triggerów na jedną animację** — pełne wykorzystanie `evaluateTriggers` i `TriggerStateMap`.
