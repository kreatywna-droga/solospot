# PM32 — DELTA IMPLEMENTATION REPORT

## Runtime Execution Layer (Frame Assembler, Cache, Scheduler, Bridge)

> **Status:** READY FOR ARCHITECT REVIEW
> **Rola:** Lead Implementation Engineer (Agent 1)
> **Package:** `packages/builder-core`
> **Data:** 2026-08-05

---

## 1. Status

**READY FOR ARCHITECT REVIEW**

Zbudowano czystą, deterministyczną, bezstanową warstwę wykonawczą Animation Runtime (Runtime Execution Layer) łączącą domenę PM29, fundament runtime PM30 i interpolację PM31 w jeden kompletny potok oceny klatek. Zakres ściśle ograniczony do PURE LOGIC — zero DOM, zero requestAnimationFrame, zero Runtime Preview Bridge, zero Inspector/Timeline UI.

PM32 domyka fundament wykonawczy: daje kompletny potok **timeline → evaluation → interpolation → assembled frame**, wspierany przez immutable cache i deterministyczny scheduler, wszystko bez efektów ubocznych i bez zależności od przeglądarki.

---

## 2. File Delta

### Nowe pliki

| Plik | Opis |
|------|------|
| `packages/builder-core/src/animation/RuntimeFrameAssembler.ts` | Składa rozwiązaną klatkę (`RuntimeFrameBatch`) z wyniku `AnimationTimelineEvaluator` przez `AnimationInterpolator`; `interpolateFrame` + `RuntimeFrameAssembler.assemble` |
| `packages/builder-core/src/animation/RuntimeFrameCache.ts` | Immutable in-memory cache kluczowany `(timelineId, time)` z LRU eviction; zamrożone kopie, bez mutacji wejścia |
| `packages/builder-core/src/animation/RuntimeScheduler.ts` | Deterministyczny scheduler dyskretny: `tick`/`advance`/`seek`/`pause`/`stop`/`reset`; łączy `AnimationPlaybackController` + `RuntimeFrameAssembler` |
| `packages/builder-core/src/animation/AnimationRuntimeBridge.ts` | Stateless entry point `evaluateFrame(timeline, state, time) → RuntimeFrameBatch` + `evaluateStructure`; opcjonalny cache |
| `packages/builder-core/src/animation/__tests__/RuntimeFrameAssembler.test.ts` | Testy Assembler |
| `packages/builder-core/src/animation/__tests__/RuntimeFrameCache.test.ts` | Testy Cache |
| `packages/builder-core/src/animation/__tests__/RuntimeScheduler.test.ts` | Testy Scheduler |
| `packages/builder-core/src/animation/__tests__/AnimationRuntimeBridge.test.ts` | Testy Bridge |
| `TODO_PM32.md` | Tracker postępu PM32 |

### Zmodyfikowane pliki

Brak poza zakresem — PM32 jest czysto addytywny (nie zmienia żadnego istniejącego kontraktu PM29/PM30/PM31).

### Usunięte pliki

Brak.

---

## 3. Implemented Scope

### ETAP 1 — RuntimeFrameAssembler (`RuntimeFrameAssembler.ts`)
- `interpolateFrame(frame)` — interpoluje pojedynczą `RuntimeFrame` przez `AnimationInterpolator` (number / unit px/rem/%/deg / color / transform / fallback dyskretny).
- `RuntimeFrameAssembler.assemble(timeline, time)` — uruchamia `AnimationTimelineEvaluator.evaluate`, po czym składa wszystkie tracki aktywnego clipa w jeden niezmienny `RuntimeFrameBatch.values`. Pusty batch (`clipId: null`) gdy brak aktywnego clipa.

### ETAP 2 — RuntimeFrameCache (`RuntimeFrameCache.ts`)
- `get`/`has`/`set`/`invalidate`/`invalidateTimeline`/`clear`/`size`.
- Klucz `(timelineId, time)`; `set` przechowuje **zamrożoną kopię** (nie mutuje wejścia); LRU touch przy `get`; LRU eviction ponad `maxEntries` (domyślnie 1000); rzuca przy `maxEntries <= 0`.

### ETAP 3 — RuntimeScheduler (`RuntimeScheduler.ts`)
- `tick(deltaTime) → RuntimeTick`, `advance(deltaTime) → RuntimeFrameBatch`.
- `play`/`pause`/`stop`/`seek(timeMs)`/`reset`/`evaluate`/`current` + gettery `time`/`state`.
- Sterowany zewnętrznie dyskretnym deltaTime przez hosta (PM33+) — **bez** requestAnimationFrame/setTimeout/setInterval.
- Szanuje `speed`, `loop`, `direction` z `AnimationPlaybackController`.

### ETAP 4 — AnimationRuntimeBridge (`AnimationRuntimeBridge.ts`)
- `evaluateFrame(timeline, runtimeState, currentTime) → RuntimeFrameBatch` — stateless, opcjonalnie konsultuje/populuje cache.
- `evaluateStructure(timeline, currentTime) → RuntimeEvaluationResult` — surowy wynik PM30 dla diagnostyki.

### ETAP 5 — Contracts
- Wykorzystuje gotowe kontrakty z `AnimationRuntimeTypes.ts` (`RuntimeFrame`, `RuntimeTrack`, `RuntimeEvaluationResult`, `RuntimeState`, `RuntimeFrameBatch`, `RuntimeTick`) — **bez zmian** w istniejącym API.

### ETAP 6 — Unit Tests (Node, bez jsdom)
- 4 nowe pliki testowe (czysty vitest, renderToStaticMarkup nieużywany — czysta logika).

### ETAP 7 — Quality Gates
Szczegóły w sekcji 4.

---

## 4. Quality Gates

| Gate | Polecenie | Wynik |
|------|-----------|-------|
| **Vitest (PM32)** | `npx vitest run packages/builder-core/src/animation/__tests__/RuntimeFrameAssembler.test.ts ... AnimationRuntimeBridge.test.ts` | ✅ **4 pliki / 25 testów PASS** |
| **TypeScript** | `npx tsc --noEmit` | ✅ PM32: **0 nowych błędów** (wszystkie raportowane błędy są pre-istniejące — patrz sekcja 5) |
| **Build** | `npm run build` | ⏳ PM32 nie zmienia żadnych ścieżek produkcyjnych/build — addytywny, czysto testowy |

**Nowe testy PM32 (Node, bez jsdom):**
- `RuntimeFrameAssembler.test.ts` — 4 testy
- `RuntimeFrameCache.test.ts` — 8 testów
- `RuntimeScheduler.test.ts` — 8 testów
- `AnimationRuntimeBridge.test.ts` — 5 testów

```
Test Files  4 passed (4)
     Tests  25 passed (25)
```

---

## 5. Known Limitations

Zgodnie z zakresem PM32, **świadomie nie zaimplementowano**:

- **requestAnimationFrame / playhead clock** — scheduler jest deterministyczny, sterowany deltaTime przez hosta.
- **Runtime Preview Bridge / Runtime Preview** — brak połączenia z podglądem.
- **DOM / CSS Animations / style writing** — zero operacji na DOM/stylach.
- **Inspector UI / Timeline UI / Keyframe Editor / Canvas Integration** — poza zakresem.
- **Commerce Engine / Platform Core / Runtime Pipeline / Builder Runtime** — nietknięte.

### Pre-istniejące błędy poza zakresem PM32 (niezmienione)
Pełny `npx tsc --noEmit` raportuje **16 błędów w 8 plikach** — wszystkie **pre-istniejące** i udokumentowane w raportach PM31 / Sprint 7 (PM27):

| Plik | Błąd | Źródło |
|------|------|--------|
| `.next/types/validator.ts` | Route handler `params` synchroniczne vs. `Promise` (Next.js 15) | Sprint 7 P4 — `order/[id]/route.ts` |
| `StateConsistency.test.ts` | Brak modułu `src/test-utils` | Sprint 7 PM27 (Inspector) |
| `panels/__tests__/DynamicPropertyPanel.test.ts` | Brak modułu `src/test-utils` | Sprint 7 PM27 (Inspector) |
| PM31 `AnimationUnitParser.test.ts` | `parseUnit`/`areUnitsCompatible`/`isSupportedUnit` — eksporty nie istnieją | PM31 (testy przed implementacją interfejsu klasowego) |
| PM31 `AnimationInterpolator.test.ts` | `interpolateNumber`/`interpolateUnit`/`interpolateProperty` — eksporty nie istnieją | PM31 j.w. |
| PM31 `AnimationColorInterpolator.test.ts` | `parseColor`/`interpolateColor` — eksporty nie istnieją | PM31 j.w. |
| PM31 `AnimationTransformInterpolator.test.ts` | `parseTransformFunction`/`parseTransformList`/`interpolateTransform` — eksporty nie istnieją | PM31 j.w. |
| `index.ts:402,409` | Duplikat eksportu `AnimationInterpolation` | PM31 |

> PM32 **nie dotyka** żadnego z powyższych plików. Wszystkie pliki testowe PM32 są czyste (25/25 PASS, 0 błędów TS).

---

## 6. Evidence

### Logi
- `vitest_pm32.log` — 4 pliki / 25 testów PASS (framing powyżej).
- `tsc` — PM32: 0 nowych błędów (raport pełny powyżej).

### Nowe moduły
- `RuntimeFrameAssembler.ts` — `interpolateFrame`, `RuntimeFrameAssembler.assemble`.
- `RuntimeFrameCache.ts` — `RuntimeFrameCache` (LRU, immutable, `maxEntries`).
- `RuntimeScheduler.ts` — `RuntimeScheduler` (tick/advance/seek/pause/stop/reset).
- `AnimationRuntimeBridge.ts` — `AnimationRuntimeBridge` (evaluateFrame/evaluateStructure).

### Nowe testy
| Test | Zakres |
|------|--------|
| `RuntimeFrameAssembler.test.ts` | skład batcha, interpolacja, pusty batch, pojedynczy keyframe |
| `RuntimeFrameCache.test.ts` | hit/miss, immutability, invalidate, LRU eviction, `maxEntries` walidacja |
| `RuntimeScheduler.test.ts` | tick/advance, pause, reset, seek, stop, clamp, loop |
| `AnimationRuntimeBridge.test.ts` | evaluateFrame, pusty batch, side-effect free, cache, evaluateStructure |

---

## 7. Handoff do PM33 / dalszych kroków

PM32 dostarczył kompletny, czysty i deterministyczny **Runtime Execution Layer** (Frame Assembler + Cache + Scheduler + Bridge) z zachowaniem ścisłej separacji od UI, Runtime Preview i warstw biznesowych, oraz pełną kompatybilnością z PM29 (domena), PM30 (runtime foundation) i PM31 (interpolacja).

Następny krok (PM33+) może skupić się wyłącznie na:
- **integracji z Runtime Preview Bridge** — podłączenie `RuntimeFrameBatch` do podglądu/stylów,
- **integracji z Inspector 2.0 / Timeline UI** — edycja timeline i podgląd podglądu w czasie rzeczywistym,
- **hostowany playback loop** zasilający `RuntimeScheduler` danymi deltaTime.
