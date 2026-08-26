# G1-15-B ERROR CLUSTER FOCUSED DELTA AUDIT — Production Subsystem Closure (3 × TS2820 in AnimationPresetLibrary.ts)

> **Rola:** Agent 2 — Independent Code Evidence Auditor
> **Tryb:** 🔴 READ-ONLY (zero modyfikacji — brak edycji CODE / TEST / CONFIG / SSOT)
> **Przedmiot audytu:** Raport identyfikacyjny G1-15-A + niezależna weryfikacja świeżym `tsc`
> **Data:** 14 sierpnia 2026 r.

---

## 1. Executive Summary

Raport G1-15-A został poddany niezależnej weryfikacji w trybie READ-ONLY.

**Identyfikacja klastra jest w 100% poprawna:** 3 × TS2820 w `AnimationPresetLibrary.ts` (linie 103, 104, 105), baseline 324, zakres CODE = 1 plik produkcyjny, TEST = 0, CONFIG = 0, SSOT = 0, freeze potwierdzony, podsystem `src/production/` zawiera dokładnie 3 błędy (wszystkie w klastrze).

**Wykryto jednak istotny błąd proponowanej naprawy (§5 i §7 raportu):** sugerowana zmiana `{ type: 'ease-in-out' }` → `{ type: 'ease-out' }` (podążająca za podpowiedzią kompilatora *"Did you mean 'ease-out'?"*) jest **regresją semantyczną** — `ease-in-out` jest pełnoprawnym easingiem w architekturze runtime projektu, a jego wierna reprezentacja w kontrakcie SSOT istnieje: `{ type: 'cubic-bezier', controlPoints: [0.42, 0, 0.58, 1] }` (standardowa krzywa CSS ease-in-out).

**Werdykt: HOLD** — klaster i delta są poprawne, ale proponowana naprawa zmienia zachowanie animacji presetu `Scale Bounce`. Należy zastosować wierną reprezentację ease-in-out (cubic-bezier), nie degradować do ease-out.

---

## 2. Fresh Baseline (niezależna weryfikacja)

| Parametr audytowy | Raport G1-15-A | Weryfikacja Agenta 2 | Wynik |
|---|---|---|---|
| Komenda | `npx tsc --noEmit --incremental false` | Tożsama, cache wyłączony | ✅ Zgodne |
| Globalny baseline | 324 | **324** (linie błędów `error TS`) | ✅ Zgodne |
| Klaster | 3 × TS2820 | 3 × TS2820 @ (103,64), (104,67), (105,64) | ✅ Zgodne |
| Podsystem `src/production/` | 3 błędy (wszystkie w klastrze) | Dokładnie 3 — `AnimationPresetLibrary.ts` tylko | ✅ Zgodne |
| `PresetLibrary.test.ts` | 0 błędów | **0 błędów** | ✅ Zgodne |
| Freeze (pliki po G1-14-D) | — | Jedynie `docs/G1-15_ERROR_CLUSTER_IDENTIFICATION_REPORT.md` (22:08:36) | ✅ Zgodne |
| SSOT `AnimationTypes.ts` | nienaruszony | 2026-08-11 17:47:31 (bez zmian) | ✅ Zgodne |

---

## 3. Weryfikacja pełnej listy błędów klastra (3 × TS2820)

| Lp. | Lokalizacja | Kod | Treść (skrót) | Potwierdzone |
|:---:|---|:---:|---|---|
| 1 | `AnimationPresetLibrary.ts(103,64)` | TS2820 | `'"ease-in-out"' is not assignable to ... "ease-out" \| "linear" \| "ease-in" \| "cubic-bezier" \| "spring"'` | ✅ |
| 2 | `AnimationPresetLibrary.ts(104,67)` | TS2820 | j.w. | ✅ |
| 3 | `AnimationPresetLibrary.ts(105,64)` | TS2820 | j.w. | ✅ |

Wszystkie 3 w obrębie `keyframes` presetu `preset-scale-bounce` (tracks → `tr-scale`):
```typescript
{ id: 'kf-1', timeOffset: 0, value: 0.8, easing: { type: 'ease-in-out' } },
{ id: 'kf-2', timeOffset: 300, value: 1.05, easing: { type: 'ease-in-out' } },
{ id: 'kf-3', timeOffset: 500, value: 1, easing: { type: 'ease-in-out' } },
```

---

## 4. Wspólna przyczyna źródłowa (Root Cause) — potwierdzona, ale z niuansem

**Potwierdzone:** unia `EasingCurve.type` w SSOT (`AnimationTypes.ts`) nie zawiera `'ease-in-out'`:
```typescript
export interface EasingCurve {
  type: 'linear' | 'ease-in' | 'ease-out' | 'cubic-bezier' | 'spring';
  controlPoints?: [number, number, number, number];
  stiffness?: number;
  damping?: number;
}
```

**Kluczowy niuans (podstawa HOLD):** `ease-in-out` jest **pełnoprawnym easingiem w warstwie runtime**, nie literówką:
- `packages/builder-core/src/animation/AnimationEasing.ts` — `EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'`, implementacja `easeInOut()` (symetryczna wokół 0.5), `resolveEasing('ease-in-out')` → `easeInOut`.
- `AnimationEasing.test.ts` — testy: `ease-in-out is symmetric around 0.5` oraz `resolveEasing('ease-in-out')` → `easeInOut`.
- `AdvancedMotionCurves.ts(66)` — `case 'ease-in-out'` w switch na `EasingCurve`.
- `GraphEditorEngine.ts(169)` oraz `TimelineAuthoringExtensions.ts(114)` — obsługa `'ease-in-out'`.
- `TimelineEasingEditor.ts(78)` — mapowanie presetu `easeInOut` → `{ type: 'ease-in-out' }` (sam generuje 4. TS2820, patrz §8).

Wniosek: `ease-in-out` jest zamierzonym, działającym easingiem (testowanym w builder-core). Raport błędnie traktuje go jako błędny literał, którego "naprawa" polega na podążeniu za podpowiedzią kompilatora (`ease-out`).

---

## 5. Weryfikacja kontraktów SSOT — poprawna, ale proponowana naprawa niezgodna z semantyką

**SSOT potwierdzony** — kontrakt `EasingCurve` nienaruszony i nie wymaga zmiany.

**Wierna reprezentacja ease-in-out w istniejącym kontrakcie SSOT istnieje** i jest już stosowana w kodzie:
- `EasingCurve.type: 'cubic-bezier'` + `controlPoints?: [number, number, number, number]`.
- Standardowa krzywa CSS `ease-in-out` = `cubic-bezier(0.42, 0.0, 0.58, 1.0)`.
- Przykłady stosowania `cubic-bezier` z `controlPoints` w kodzie: `AnimationSerialization.test.ts(88,110)`, `TimelineE2EWorkflow.test.ts(187)`, `MotionCurves.test.ts(14)`, `TimelineEasingEditor.ts` (`createCustomCubicBezierEasingCurve`, `formatEasingCurveToCSS` → `cubic-bezier(x1, y1, x2, y2)`), `AdvancedMotionCurves.ts` (`evaluateCubicBezier`).

**Poprawna naprawa (rekomendacja dla G1-15-C):**
```typescript
{ id: 'kf-1', timeOffset: 0, value: 0.8, easing: { type: 'cubic-bezier', controlPoints: [0.42, 0, 0.58, 1] } },
{ id: 'kf-2', timeOffset: 300, value: 1.05, easing: { type: 'cubic-bezier', controlPoints: [0.42, 0, 0.58, 1] } },
{ id: 'kf-3', timeOffset: 500, value: 1, easing: { type: 'cubic-bezier', controlPoints: [0.42, 0, 0.58, 1] } },
```
Zachowuje 100% semantyki ease-in-out przy SSOT nienaruszonym. Alternatywa (rozszerzenie unii o `'ease-in-out'`) byłaby zmianą SSOT — decyzja Architekta, wykracza poza scope G1-15.

**Dlaczego `{ type: 'ease-out' }` jest regresją:** ease-in-out jest symetryczny (przyspiesza i zwalnia wokół 0.5), ease-out tylko zwalnia. Dla presetu `Scale Bounce` (`0.8 → 1.05 → 1.0`, "Bouncy pop-in scale emphasis") zmiana zmienia charakter animacji (odbicie/pop). To dokładnie pułapka *"zmień na ease-out tylko żeby uciszyć kompilator"*, którą zadanie nakazywało wykluczyć.

---

## 6. Analiza błędów bezpośrednich / maskowanych / kaskadowych

| Kategoria | Raport G1-15-A | Weryfikacja Agenta 2 | Wynik |
|---|---|---|---|
| Błędy bezpośrednie (Direct) | 3 × TS2820 | 3 × TS2820 | ✅ Zgodne |
| Maskowane / kaskadowe | 0 | **0** — podsystem `src/production/` ma dokładnie 3 błędy; naprawa 3 TS2820 nie odsłoni żadnych nowych w `src/production/` | ✅ Zgodne |
| Predykcja delta | −3 → 321 | **Potwierdzona** (przy dowolnej poprawnej reprezentacji, bez wprowadzenia nowych błędów) | ✅ Zgodne |

**Uwaga o kaskadzie między plikami:** `MotionPresetBridge.ts` (src/motion/) importuje z `AnimationPresetLibrary.ts` funkcje `getPresetDefinition` i `listPresetDefinitions`, które **nie istnieją** (plik eksportuje wyłącznie `PresetCategory`, `AnimationPreset`, `PresetLibraryState`, `BUILTIN_PRESETS`, `INITIAL_PRESET_LIBRARY_STATE`, `createPresetLibraryState`, `registerUserPreset`, `filterPresets`). Te błędy TS2305 (2 szt.) są **pre-existing** i **poza zakresem klastra** — nie są maskowane przez TS2820 i nie zostaną nimi naprawione. Stanowią osobny klaster (nie jest to efekt kaskady; naprawa TS2820 ich nie odsłania ani nie ukrywa). Odnotowano w celach integralności — nie wpływa na delta G1-15 (−3).

---

## 7. Analiza ryzyka — NIEZGODNA z raportem (znaleziony błąd)

| Ryzyko | Raport G1-15-A | Werdykt Agenta 2 |
|---|---|---|
| Regresja logiki biznesowej | "Zero (Brak)" | ❌ **NIEZgodne.** Proponowana zmiana `ease-in-out` → `ease-out` **zmienia zachowanie animacji** presetu `Scale Bounce` (regresja semantyczna). Przy naprawie przez `cubic-bezier [0.42, 0, 0.58, 1]` ryzyko = 0. |
| Naruszenie SSOT / ADR | "Zero (Brak)" | ✅ Zgodne (przy naprawie cubic-bezier SSOT nienaruszony). |
| Czystość podsystemu po naprawie | 0 błędów w `src/production/` | ✅ Zgodne (przy dowolnej poprawnej reprezentacji). |

---

## 8. Dodatkowe ustalenia poza zakresem klastra (rejestr faktów)

1. **4. błąd TS2820 o tej samej przyczynie źródłowej:** `TimelineEasingEditor.ts(78,16)` — `case 'easeInOut': return { type: 'ease-in-out' }`. Znajduje się w podsystemie `src/timeline/` (poza klastrem). Dowodzi, że przyczyna jest **systemowa**, a nie odosobniona w presecie — i że warstwa timeline *oczekuje* reprezentacji ease-in-out w DTO. Kandydat do osobnego przyszłego klastra (po zamknięciu G1-15).
2. **`AdvancedMotionCurves.ts` i `GraphEditorEngine.ts`** obsługują `ease-in-out`/`bounce`/`elastic`/`step` na typie `EasingCurve`, który ich nie zawiera (TS2678) — kolejna oznaka, że unia SSOT może być niekompletna względem możliwości runtime. Decyzja Architekta (poza scope G1-15).
3. **`MotionPresetBridge.ts`** — 4 błędy: 3 × TS2305 (w tym 2 phantom-importy z `AnimationPresetLibrary`) + 1 × TS2739 (`AnimationTimeline` bez `trigger`/`playback`). Pre-existing, poza zakresem.

Żadne z powyższych nie jest maskowane przez klaster i nie zmienia delta G1-15 (−3).

---

## 9. Zakres CODE / TEST / CONFIG / SSOT — potwierdzony

| Kategoria | Raport G1-15-A | Weryfikacja Agenta 2 | Wynik |
|---|:---:|---|---|
| CODE | 1 plik (`AnimationPresetLibrary.ts` L103–105) | Potwierdzony | ✅ |
| TEST | 0 | Potwierdzony (`PresetLibrary.test.ts` 0 błędów, brak asercji na typ easing) | ✅ |
| CONFIG | 0 | Potwierdzony (brak zmian tsconfig) | ✅ |
| SSOT | 0 modyfikacji | Potwierdzony (`AnimationTypes.ts` bez zmian) | ✅ |

Freeze: potwierdzony (jedyna zmiana po G1-14-D to raport G1-15-A, DOCS tylko).

---

## 10. Przewidywana delta — potwierdzona

| Parametr | Raport G1-15-A | Weryfikacja Agenta 2 | Wynik |
|---|---|---|---|
| Baseline | 324 | 324 | ✅ |
| Usuwane błędy | 3 | 3 | ✅ |
| Delta brutto | −3 | −3 | ✅ |
| Delta netto | −3 | −3 | ✅ |
| Oczekiwany wynik | 321 | 321 | ✅ |

Delta jest osiągalna **tylko pod warunkiem** zastosowania poprawnej reprezentacji (cubic-bezier), bez degradacji do ease-out i bez wprowadzenia nowych błędów.

---

## 11. Wynik audytu (Finding)

### G1-15-B-F1 — Proponowana naprawa jest regresją semantyczną (ease-in-out → ease-out)

- **Lokalizacja:** `docs/G1-15_ERROR_CLUSTER_IDENTIFICATION_REPORT.md` §5 i §7 (propozycja `{ type: 'ease-out' }` oraz deklaracja "zero ryzyka regresji logiki biznesowej").
- **Dowody:**
  1. `AnimationEasing.ts` (builder-core): `EasingName` zawiera `'ease-in-out'`; `easeInOut()` zaimplementowane; `resolveEasing('ease-in-out')` → `easeInOut`.
  2. `AnimationEasing.test.ts` L33–39, L52: testy symetrii i resolwowania ease-in-out.
  3. `AdvancedMotionCurves.ts(66)`, `GraphEditorEngine.ts(169)`, `TimelineAuthoringExtensions.ts(114)`: `case 'ease-in-out'`.
  4. `EasingCurve` wspiera wierną reprezentację: `{ type: 'cubic-bezier', controlPoints: [0.42, 0, 0.58, 1] }` (standard CSS ease-in-out); wzorce w `AnimationSerialization.test.ts`, `TimelineE2EWorkflow.test.ts`, `TimelineEasingEditor.ts`.
  5. `ease-out` ≠ `ease-in-out` matematycznie (symetria wokół 0.5 vs. tylko deceleracja).
- **Wpływ:** Zmiana semantyki presetu `Scale Bounce` (charakter "bouncy pop-in"). Identyfikacja klastra i delta pozostają poprawne; naprawa wymaga korekty.
- **Rekomendacja:** W fazie G1-15-C zastosować `{ type: 'cubic-bezier', controlPoints: [0.42, 0, 0.58, 1] }` (SSOT nienaruszony, semantyka ease-in-out zachowana). Nie zmieniać na `{ type: 'ease-out' }`.

---

## 12. Rekomendacja i blokada postępu

**Recommendation: HOLD** (Agent 2 — nieuprawniony do formalnej ratyfikacji 🔒).

Uzasadnienie zgodne z protokołem: raport G1-15-A poprawnie zidentyfikował klaster (3 × TS2820, baseline 324, zakres, freeze, delta −3 → 321 — wszystkie parametry potwierdzone), **ale proponowana naprawa (§5) jest semantycznie błędna** (`ease-in-out` → `ease-out`), a deklaracja §7 o zerowym ryzyku regresji logiki biznesowej jest nieprawdziwa. Warunek HOLD z zadania ("niepewność co do prawidłowej naprawy, semantyki easing") został spełniony.

**Czynność przed ratyfikacją:** Architekt formalnie zatwierdza naprawę w wariancie `cubic-bezier [0.42, 0, 0.58, 1]` (rekomendacja G1-15-B-F1), po czym G1-15-C może przystąpić do naprawy, a G1-15-D zweryfikuje delta −3 → 321.

---

================================================================================

G1-15-B FOCUSED DELTA AUDIT RESULT:

Baseline (fresh tsc):                324 (zgodne)
Klaster (3 × TS2820):                103:64, 104:67, 105:64 — potwierdzone
Podsystem src/production/:           3 błędy — wszystkie w klastrze (0 po naprawie)
PresetLibrary.test.ts:               0 błędów
Freeze / SSOT:                       potwierdzone (AnimationTypes.ts 2026-08-11)
Zakres CODE/TEST/CONFIG/SSOT:        1/0/0/0 — zgodne
Błędy maskowane/kaskadowe:           0 — zgodne
Przewidywana delta:                  324 → 321 (−3) — potwierdzona
Integrity (any/@ts-*):               0 nowych; phantom-importy getPresetDefinition/listPresetDefinitions (MotionPresetBridge.ts) — pre-existing, poza zakresem

FINDING:                             G1-15-B-F1 — naprawa ease-in-out → ease-out to regresja semantyczna; poprawna reprezentacja: cubic-bezier [0.42, 0, 0.58, 1]

Recommendation:                      HOLD
Formal ratification:                 🔒 wyłącznie Architekt

STATUS: G1-15-B = HOLD — oczekuje na decyzję Architekta; nie blokuje delta −3 przy poprawnej naprawie

================================================================================

🛑 STOP. Agent 2 nie wykonuje żadnej naprawy i oczekuje na ratyfikację Architekta.