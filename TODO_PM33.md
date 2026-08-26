# TODO — PM33 (Agent 1) Runtime Trigger Engine & Event Integration

> Status: ✅ READY FOR ARCHITECT REVIEW

## Cel
Rozszerzyć Animation Engine o warstwę wyzwalaczy (Trigger Engine) z pełną separacją od DOM, React i Runtime Preview. PM33 dostarcza **czystą warstwę oceny triggerów** — nie wykonuje animacji (to domena PM34/PM35).

## Zakres (builder-core, Animation Trigger Layer)

### 1. Trigger Definition vs Trigger State (DECISION-035)
- [x] `AnimationTrigger` — definicja triggera (immutable, z `AnimationTypes.ts`).
- [x] `AnimationTriggerState.ts` — aktualny stan runtime: `ACTIVE | WAITING | FINISHED | PAUSED`.

### 2. Serializable Trigger Context (DECISION-036)
- [x] `AnimationTriggerContext.ts` — wyłącznie dane: `scrollY`, `viewportWidth`, `viewportHeight`, `isHovered`, `isClicked`, `visibilityRatio`.
- [x] Zero Browser API (brak Event/MouseEvent/HTMLElement/DOMRect/IntersectionObserverEntry).

### 3. Pure Trigger Evaluator (DECISION-035)
- [x] `AnimationTriggerEvaluator.ts` — czysta funkcja `shouldStart(trigger, context): boolean`.
- [x] Obsługa: `onLoad`, `hover`, `click`, `inView`, `scroll`.
- [x] Bez ukrytego stanu.

### 4. Trigger Engine (DECISION-037)
- [x] `AnimationTriggerEngine.ts` — `evaluate(trigger, context): TriggerEvaluationResult`.
- [x] `evaluateTriggers(triggers[], context)` — przygotowanie pod wiele triggerów.
- [x] Nie wykonuje animacji; brak `start()/play()/dispatch()`.

### 5. Public API
- [x] Aktualizacja `packages/builder-core/src/index.ts` — eksporty typów i klas.

### 6. Unit Tests (Node, bez jsdom)
- [x] `AnimationTriggerState.test.ts`
- [x] `AnimationTriggerContext.test.ts`
- [x] `AnimationTriggerEvaluator.test.ts`
- [x] `AnimationTriggerEngine.test.ts`
- [x] Przypadki graniczne: onLoad uruchamia się tylko raz, hover/click true/false, scroll na progu / poniżej progu, visibility=0, visibility=1, pusty TriggerContext, nieznany TriggerType.

### 7. Quality Gates
- [x] `npx tsc --noEmit` — 0 nowych błędów (16 pre-istniejących, poza zakresem PM33).
- [x] `npx vitest run` (PM33 subset) — 4 pliki / 32 testy PASS.
- [x] `npm run build` — PM33 addytywny (czysto testowy/dokumentacyjny), bez ścieżek produkcyjnych.

## Zakres Niedozwolony (respektowany)
- Brak requestAnimationFrame / DOM / window / document / React / Preview / Runtime Bridge / Canvas / Builder Runtime / Inspector / CSS Runtime.
- Brak rozpoczęcia animacji (start/play/dispatch) — domena PM34/PM35.

## Raport Delta
- [x] `docs/studio/PM33_DELTA_IMPLEMENTATION_REPORT.md` — wyłącznie Delta Report (z sekcją Architectural Decisions Implemented).
