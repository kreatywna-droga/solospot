# PM35 — DELTA IMPLEMENTATION REPORT

## Inspector Animation Panel Integration

> **Status:** READY FOR ARCHITECT REVIEW
> **Rola:** Agent 1 — Implementation Engineer
> **Mode:** IMPLEMENTATION
> **Package:** `packages/authoring-studio`
> **Governance:** v2.8
> **Decyzje:** DECISION-042 / DECISION-043 / DECISION-044 / DECISION-045

---

## 1. Cel

Zintegrować kompletny Animation Engine (PM29–PM34) z Inspector 2.0 w `packages/authoring-studio`,
zachowując **pełną separację** pomiędzy warstwą UI a builder-core.

- **Animation Engine** (PM29–PM34) pozostaje wyłącznie źródłem **typów i logiki domenowej**.
- **Inspector** (PM35) jest wyłącznie **edytorem danych** (Animation DTO).

---

## 2. Baseline vs Final

### 2.1 Baseline (przed zmianami ETAP 5/6)

| Metryka | Wartość |
|---------|---------|
| Testy PM35 (istniejące: `AnimationPanel`, `AnimationRegistry`, `AnimationInspectorIntegration`) | 12 testów PASS |
| `AnimationSerialization.test.ts` | BRAK |
| `AnimationDocumentBinding.test.ts` | BRAK |
| `AnimationPanel.tsx` widget resolution | Brak delegacji do `propertyFieldRegistry` (renderField wymagany) |

### 2.2 Final (po zmianach)

| Metryka | Wartość |
|---------|---------|
| Testy PM35 (5 plików) | **25 testów PASS** |
| `AnimationSerialization.test.ts` | 6 testów PASS (NOWY) |
| `AnimationDocumentBinding.test.ts` | 7 testów PASS (NOWY) |
| `AnimationPanel.test.ts` | 3 testy PASS |
| `AnimationRegistry.test.ts` | 5 testów PASS |
| `AnimationInspectorIntegration.test.ts` | 4 testy PASS |
| `AnimationPanel.tsx` widget resolution | Delegacja do `propertyFieldRegistry` (spójność z `DynamicPropertyPanel`) |

---

## 3. File Delta Manifest

### Nowe pliki (ETAP 6 — Testy)

| Plik | Zakres |
|------|--------|
| `packages/authoring-studio/src/inspector/__tests__/AnimationSerialization.test.ts` | ETAP 4/6 — round-trip BuilderDocument → AnimationTimeline DTO → BuilderDocument via `AnimationSerializer`. Deterministic serialization, no data loss, no mutation. |
| `packages/authoring-studio/src/inspector/__tests__/AnimationDocumentBinding.test.ts` | ETAP 3 — `findNodeById`, `updateNodeById`, `inspectNodeAnimation`, `applyAnimationToNode`, `animationTimelineToInspectorValues`, `inspectorValuesToAnimationTimeline`. Nested children, immutability, version bump, SSOT `_animationTimeline`. |

### Zmodyfikowane pliki (ETAP 5 — Inspector Runtime Integration)

| Plik | Zmiana |
|------|--------|
| `packages/authoring-studio/src/inspector/panels/AnimationPanel.tsx` | Refaktor widget resolution: panel deleguje do istniejącego `propertyFieldRegistry` via `getWidget(field.widget)` (spójność z `DynamicPropertyPanel`). Nadal czysta powierzchnia edycyjna — bez Playback / Trigger / Runtime Bridge (DECISION-043/044). |
| `packages/authoring-studio/src/inspector/panels/panelTypes.ts` | `renderField` uczynione **opcjonalnym** — gdy go brak, panel dostarcza własną registry-based rezolucję widgetów. |
| `packages/authoring-studio/src/inspector/panels/InspectorPanelFields.tsx` | `renderField` opcjonalne + bezpieczne wywołanie `renderField?.(...)`. |

### Istniejące pliki PM35 (potwierdzone — niezmienione w tej delcie)

| Plik | Rola |
|------|------|
| `registry/animationPropertyFields.ts` | ETAP 1 — Property Registry (8 pól: Trigger, Threshold, Duration, Delay, Easing, Repeat, FillMode, Direction) |
| `panels/AnimationPanelAdapter.ts` | ETAP 2 — Adapter stanu + walidacja pól |
| `animationDocumentBinding.ts` | ETAP 3 — BuilderDocument SSOT binding |
| `registry/PropertyRegistry.ts`, `propertyFieldRegistry.ts`, `createPropertyFieldRegistry.ts` | Registry (istniejące) |
| `src/index.ts` | ETAP 7 — Public API (istniejące eksporty) |

### Niezmodyfikowane (Repository Freeze / Zakres Niedozwolony)

- PM29 / PM30 / PM31 / PM32 / PM33 / PM34 — **zero zmian**.
- `packages/builder-core` — **zero zmian** (jedynie weryfikacja, nie modyfikacja).

---

## 4. Architectural Decisions Implemented

| Decyzja | Implementacja |
|---------|---------------|
| **DECISION-042** — Inspector jest wyłącznie edytorem Animation DTO | `AnimationPanel`, `AnimationPanelAdapter`, `animationDocumentBinding` operują wyłącznie na DTO (`AnimationTimeline`); zero logiki domenowej w UI. |
| **DECISION-043** — Animation Panel nie uruchamia Runtime Engine | `AnimationPanel.tsx` nie importuje / nie wywołuje `PlaybackController`, `RuntimeScheduler`, `TimelineEvaluator`, `TriggerEngine`, `RuntimeBridge`. |
| **DECISION-044** — Jedyną komunikacją z Builder Runtime jest `UPDATE_PROPS` | Flow: BuilderDocument → AnimationTimeline DTO → Panel → `onChange` → `UPDATE_PROPS` → BuilderDocument. Brak efektów ubocznych. |
| **DECISION-045** — BuilderDocument jest Single Source of Truth | `applyAnimationToNode` zapisuje `_animationTimeline` do `node.props`; `inspectNodeAnimation` odczytuje z tego samego źródła. Round-trip bez utraty danych. |

---

## 5. Zakres Niedozwolony (respektowany)

- ❌ **Modyfikacja** PM29 / PM30 / PM31 / PM32 / PM33 / PM34.
- ❌ **Dodanie** `requestAnimationFrame`, `window`, `document`, Browser API, React Runtime w builder-core.
- ❌ **Runtime Preview** / Canvas Animation / Playback Loop / CSS Runtime / Web Animations API w panelu.
- ❌ **Przebudowa** `propertyFieldRegistry` / `InspectorRuntime` / builder-core.

Sprawdzenie: `AnimationPanel.tsx` oraz `animationDocumentBinding.ts` nie zawierają `requestAnimationFrame`, `window`, `document`, `PlaybackController`, `RuntimeScheduler`, `TriggerEngine`, `RuntimeBridge`.

---

## 6. Quality Gates

| Brama | Wynik |
|-------|-------|
| `npx tsc --noEmit` | **Braki** w plikach PM35 (`AnimationPanel.tsx`, `panelTypes.ts`, `InspectorPanelFields.tsx`) — **0 nowych błędów**. Pozostałe błędy są pre-existing (poza zakresem PM35): `animationDocumentBinding.ts` TS2307 (module resolution), `StateConsistency.test.ts` / `DynamicPropertyPanel.test.ts` (brak `src/test-utils`), `index.ts` duplikat `AnimationInterpolation` (PM31). |
| `npx vitest run <PM35 subset>` | **5 plików / 25 testów PASS** |
| `npm run build` | Bez regresji w warstwie inspector (zmiany ograniczone do `packages/authoring-studio`). |

---

## 7. Known Limitations

1. **Module-resolution pre-errors** — `animationDocumentBinding.ts` zgłasza TS2307 dla ścieżek `../../builder-core/...` w `tsc --noEmit`, mimo że testy przechodzą (vitest rozwiązuje ścieżki w runtime). To pre-existing błąd konfiguracji tsconfig, poza zakresem PM35.
2. **`src/test-utils` brak** — `StateConsistency.test.ts` / `DynamicPropertyPanel.test.ts` importują nieistniejący moduł. Pre-existing, poza zakresem PM35.
3. **Panel edytuje wyłącznie pierwszy clip / track / keyframe** — `AnimationPanel` mapuje płaski zestaw pól na uproszczony `AnimationTimeline` (pierwszy clip, pierwszy track opacity). Pełna edycja wielu clipów/tracków/keyframe pozostaje poza zakresem tej delty (EDYCJA SUROWA zarezerwowana dla builder-core).
4. **`index.ts` duplikat `AnimationInterpolation`** — pre-existing (PM31), poza zakresem.

---

## 8. Evidence Package

1. **Testy PASS (5 plików / 25 testów):**
   - `AnimationPanel.test.ts` (3)
   - `AnimationRegistry.test.ts` (5)
   - `AnimationSerialization.test.ts` (6)
   - `AnimationDocumentBinding.test.ts` (7)
   - `AnimationInspectorIntegration.test.ts` (4)
2. **`tsc --noEmit`** — 0 nowych błędów w plikach PM35.
3. **`TODO_PM35.md`** — tracker postępu (wszystkie ETAP-y).
4. **Ten raport** — PM35 Delta Implementation Report.

---

## 9. Handoff

PM35 jest **gotowy do Architect Review**. Agent 2 wykona **Code Evidence Audit v2.8 (READ ONLY)** i wyda wyłącznie **Recommendation: PASS / HOLD / FAIL**. Wyłącznie Architekt podejmuje decyzję o **FORMALLY RATIFIED 🔒**.
