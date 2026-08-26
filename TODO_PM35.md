# TODO — PM35 (Agent 1) Inspector Animation Panel Integration

> Status: FORMALLY RATIFIED 🔒
> Rola: Agent 1 — Implementation Engineer
> Mode: IMPLEMENTATION
> Governance: v2.8

## Cel

Zintegrować kompletny Animation Engine (PM29–PM34) z Inspector 2.0 w `packages/authoring-studio`, zachowując pełną separację pomiędzy warstwą UI a builder-core.

## Decyzje architektoniczne (zatwierdzone przez Architekta)

- **DECISION-042** — Inspector jest wyłącznie edytorem Animation DTO.
- **DECISION-043** — Animation Panel nie uruchamia Runtime Engine.
- **DECISION-044** — Jedyną komunikacją z Builder Runtime pozostaje `UPDATE_PROPS`.
- **DECISION-045** — BuilderDocument pozostaje Single Source of Truth dla wszystkich danych animacji.

## Zakres

### ETAP 1 — Baseline Quality Gates (OBOWIĄZKOWO NA POCZĄTKU)
- [x] Uruchom istniejące testy PM35 (subset)
- [x] Zanotuj wynik (Baseline)
- [ ] Dopiero implementacja

### ETAP 2 — Animation Property Registry
- [x] Schematy dla AnimationTimeline / AnimationTrigger / AnimationClip / PropertyAnimationTrack / AnimationKeyframe / PlaybackOptions (istniejące `animationPropertyFields.ts`)
- [x] Registry odpowiada wyłącznie za mapowanie pól (bez logiki biznesowej)

### ETAP 3 — Animation Inspector Panel
- [x] `AnimationPanel.tsx` istnieje (formularze)
- [x] Panel edytuje Timeline / Trigger / Clip / Track / Keyframe / Playback Options (via `ANIMATION_PROPERTY_FIELDS`)
- [x] Bez odtwarzania animacji / interpolacji / Trigger Engine / Runtime Bridge

### ETAP 4 — Builder Document Binding
- [x] `animationDocumentBinding.ts` — flow BuilderDocument → AnimationTimeline DTO → Panel → UPDATE_PROPS → BuilderDocument
- [x] Brak efektów ubocznych

### ETAP 5 — Serialization Verification
- [x] **NOWY** `AnimationSerialization.test.ts` — round-trip BuilderDocument → AnimationTimeline DTO → BuilderDocument (brak utraty danych, brak mutacji, deterministyczna serializacja) — 6 testów PASS

### ETAP 6 — Inspector Runtime Integration
- [x] **DOSTOSOWANIE** `AnimationPanel.tsx` — rozwiązywanie widgetów via istniejący `propertyFieldRegistry` (spójność z `DynamicPropertyPanel`)
- [x] `renderField` w `panelTypes.ts` / `InspectorPanelFields.tsx` uczyniona opcjonalną, aby panel mógł dostarczyć własną registry-based rezolucję widgetów
- [x] Panel korzysta wyłącznie z Inspector Runtime + Property Registry + BuilderDocument

### ETAP 7 — Testy
- [x] `AnimationPanel.test.ts` (istnieje) — 3 testy PASS
- [x] `AnimationRegistry.test.ts` (istnieje) — 5 testów PASS
- [x] **NOWY** `AnimationSerialization.test.ts` — 6 testów PASS
- [x] **NOWY** `AnimationDocumentBinding.test.ts` — 7 testów PASS
- [x] `AnimationInspectorIntegration.test.ts` — 4 testy PASS
- [x] Node, bez jsdom

### ETAP 8 — Public API
- [x] `packages/authoring-studio/src/index.ts` — eksporty (istnieją)
- [x] `packages/builder-core` — niemodyfikowany

## Zakres Niedozwolony (respektowany)
- ❌ Modyfikacja PM29 / PM30 / PM31 / PM32 / PM33 / PM34
- ❌ requestAnimationFrame / window / document / Browser API / React Runtime w builder-core
- ❌ Runtime Preview / Canvas Animation / Playback Loop / CSS Runtime / Web Animations API
- ❌ Przebudowa propertyFieldRegistry / InspectorRuntime / builder-core

## Quality Gates (Final)
- [ ] `npx tsc --noEmit` — 0 nowych błędów (tylko pre-istniejące)
- [ ] `npx vitest run` (PM35 subset) — PASS
- [ ] `npm run build` — bez regresji

## Deliverables
- [ ] `AnimationSerialization.test.ts`
- [ ] `AnimationDocumentBinding.test.ts`
- [ ] `AnimationPanel.tsx` (dostosowanie do propertyFieldRegistry)
- [ ] `TODO_PM35.md`
- [ ] `docs/studio/PM35_DELTA_IMPLEMENTATION_REPORT.md` (z sekcją Baseline vs Final)
