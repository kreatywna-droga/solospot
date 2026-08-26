# PM31 — DELTA IMPLEMENTATION REPORT (Revision 1)

## Animation Interpolation Engine

> **Status:** READY FOR ARCHITECT REVIEW
> **Rola:** Lead Implementation Engineer (Agent 1)
> **Package:** `packages/builder-core`
> **Data:** 2026-08-05
> **Decyzja Architekta:** ✅ PM31 APPROVED (Revision 1) — Korekta 1: `AnimationInterpolation.ts` jako `@deprecated` compatibility facade delegujący do nowych modułów IPM31.

---

## 1. Status

**READY FOR ARCHITECT REVIEW**

Zbudowano czystą, deterministyczną, bezstanową warstwę interpolacji (Animation Interpolation Engine) nad domeną animacji z **PM29** i fundamentem runtime z **PM30**. Zakres ściśle ograniczony do PURE MATH/LOGIC — zero DOM, zero requestAnimationFrame, zero Runtime Preview Bridge, zero warstw biznesowych.

> Pełna kompatybilność wsteczna: PM29 (domena) i PM30 (runtime) są nietknięte; API `AnimationRuntimeTypes.ts` rozszerzone **bez zmian** w kontraktach PM30.

---

## 2. File Delta

### Nowe pliki

| Plik | Opis |
|------|------|
| `packages/builder-core/src/animation/AnimationUnitParser.ts` | Parsowanie i normalizacja jednostek: `px`, `rem`, `%`, `deg` + `''` (unit-less); `parseUnit`, `areUnitsCompatible`, `isSupportedUnit` |
| `packages/builder-core/src/animation/AnimationColorInterpolator.ts` | Interpolacja kolorów RGB/RGBA: `parseColor` (hex / rgb / rgba), `interpolateColor` |
| `packages/builder-core/src/animation/AnimationTransformInterpolator.ts` | Interpolacja transform: `translateX`, `translateY`, `scale`, `rotate`; `parseTransformFunction`, `parseTransformList`, `interpolateTransform` |
| `packages/builder-core/src/animation/AnimationInterpolator.ts` | Agregator: `interpolateNumber`, `interpolateUnit`, `interpolateProperty` (number/opacity/px/rem/%/deg/color/transform) |
| `packages/builder-core/src/animation/__tests__/AnimationUnitParser.test.ts` | Testy Unit Parser |
| `packages/builder-core/src/animation/__tests__/AnimationInterpolator.test.ts` | Testy Interpolator |
| `packages/builder-core/src/animation/__tests__/AnimationColorInterpolator.test.ts` | Testy Color Interpolator |
| `packages/builder-core/src/animation/__tests__/AnimationTransformInterpolator.test.ts` | Testy Transform Interpolator |
| `TODO_PM31.md` | Tracker postępu PM31 |

### Zmodyfikowane pliki

| Plik | Zmiana |
|------|--------|
| `packages/builder-core/src/animation/AnimationRuntimeTypes.ts` | **Rozszerzone** o kontrakty interpolacji: `InterpolationType`, `InterpolationResult`, `PropertyInterpolator`, `RuntimeInterpolationContext` — **bez zmian** w istniejącym API PM30 |
| `packages/builder-core/src/animation/AnimationInterpolation.ts` | **Korekta 1**: przekształcony na `@deprecated` compatibility facade delegujący 100% wywołań do nowych modułów PM31 (bez drugiej implementacji) |
| `packages/builder-core/src/index.ts` | Dodane eksporty PM31: `interpolateNumber`, `interpolateUnit`, `interpolateProperty`, `parseUnit`, `areUnitsCompatible`, `isSupportedUnit`, `parseColor`, `interpolateColor`, `parseTransformFunction`, `parseTransformList`, `interpolateTransform` + typy |

### Usunięte pliki

Brak.

---

## 3. Implemented Scope

### ETAP 1 — AnimationInterpolator (`AnimationInterpolator.ts`)
- `interpolateNumber(start, end, ratio)` — liniowa interpolacja liczb.
- `interpolateUnit(start, end, ratio)` — interpolacja wartości z jednostką (`px`/`rem`/`%`/`deg`); fallback dyskretny przy niezgodnych jednostkach.
- `interpolateProperty(type, start, end, ratio)` — dyspozytor typowany: `number`, `opacity`, `px`, `rem`, `%`, `deg`, `color`, `transform`.
- Czyste, deterministyczne, bezstanowe — bez side-effectów.

### ETAP 2 — Color Interpolation (`AnimationColorInterpolator.ts`)
- `parseColor` — obsługa `#rgb`, `#rrggbb`, `rgb(r,g,b)`, `rgba(r,g,b,a)`; zwraca `RGBAColor` lub `null`.
- `interpolateColor` — liniowa interpolacja kanałów RGBA z clampem kanałów; wyjście w formacie `rgba()`.
- **BEZ** HSL / LAB / OKLAB / gradientów.

### ETAP 3 — Transform Interpolation (`AnimationTransformInterpolator.ts`)
- `parseTransformFunction` / `parseTransformList` — parsowanie `translateX`, `translateY`, `scale`, `rotate`.
- `interpolateTransform` — dopasowanie po nazwie funkcji (wyrównanie pozycyjne); fallback dyskretny przy niezgodności strukturalnej.
- **BEZ** `matrix()`, `matrix3d()`, `perspective()`, `skew()`.

### ETAP 4 — Unit Parsing (`AnimationUnitParser.ts`)
- `parseUnit` — `px`, `rem`, `%`, `deg` + unit-less (`''`).
- `areUnitsCompatible` — walidacja zgodności jednostek (interpolacja tylko przy identycznej jednostce).
- `isSupportedUnit` — walidacja wartości względem wspieranego zestawu jednostek.

### ETAP 5 — Contracts (`AnimationRuntimeTypes.ts` rozszerzone)
- `InterpolationType`, `InterpolationResult`, `PropertyInterpolator`, `RuntimeInterpolationContext` dodane jako typy — **bez zmian** w kontraktach PM30 (`RuntimeFrame`, `RuntimeTrack`, `RuntimeEvaluationResult`, `RuntimeState`, `PlaybackStatus`).

### ETAP 6 — Unit Tests (Node, bez jsdom)
- 4 nowe pliki testowe (Node env, czysty vitest, bez jsdom — zgodnie z konwencją PM29/PM30).

### ETAP 7 — Compatibility Facade (Korekta 1)
- `AnimationInterpolation.ts` → `@deprecated`, deleguje do `AnimationUnitParser`, `AnimationInterpolator`, `AnimationColorInterpolator`. Zero logiki biznesowej.

### ETAP 8 — Quality Gates
Wszystkie bramki uruchomione (szczegóły w sekcji 4).

---

## 4. Quality Gates

| Gate | Polecenie | Wynik |
|------|-----------|-------|
| **TypeScript** | `npx tsc --noEmit` (zakres PM31) | ✅ 0 errors (exit 0) |
| **Vitest** | `npx vitest run packages/builder-core/src/animation` | ✅ **10 plików / 50 testów PASS** (w tym wszystkie 4 nowe pliki PM31) |
| **Build** | `npm run build` | ✅ GREEN (Next.js production build) |

**Szczegół — testy animacji (PM29 + PM30 + PM31):**
```
Test Files  10 passed (10)
     Tests  50 passed (50)
```
Wszystkie 10 plików testowych animacji (domena PM29, runtime PM30, interpolacja PM31) przechodzą w 100%.

**Nowe testy PM31:**
- `AnimationUnitParser.test.ts`
- `AnimationInterpolator.test.ts`
- `AnimationColorInterpolator.test.ts`
- `AnimationTransformInterpolator.test.ts`

---

## 5. Known Limitations

Zgodnie z zakresem PM31, **świadomie nie zaimplementowano**:

- **requestAnimationFrame / Playback Loop** — silnik jest deterministyczny i bezstanowy.
- **Runtime Preview Bridge / Runtime Preview** — brak połączenia z podglądem.
- **DOM / CSS Animations** — zero operacji na DOM i stylach.
- **Inspector UI / Timeline UI / Keyframe Editor / Canvas Integration / Responsive Animation UI** — poza zakresem.
- **transform matrix / matrix3d / perspective / skew** — poza zakresem.
- **color interpolation**: HSL / LAB / OKLAB / gradients — poza zakresem.
- **spring physics / spring easing / cubic-bezier editor** — poza zakresem.
- **Commerce Engine / Platform Core / Runtime Pipeline** — nietknięte.

### Znane, pre-istniejące błędy poza zakresem PM31
Podczas pełnego `npx vitest run` zidentyfikowano niepowodzenia w **`packages/authoring-studio` (Inspector 2.0 — Sprint 7 PM27)**, w pełni poza zakresem PM31:

**Failed Suites (2):**
- `StateConsistency.test.ts` — import `src/test-utils` z nieistniejącej ścieżki.
- `DynamicPropertyPanel.test.ts` (panels) — j.w. (brak modułu `src/test-utils`).

**Failed Tests (3):**
- `BuilderInspectorIntegration.test.ts` — asercja `DOCUMENT_UPDATE` na kanale preview.
- `PreviewSync.test.ts` — oczekiwana dokładnie 1 wiadomość `DOCUMENT_UPDATE`.
- `RegistryConsistency.test.ts` — asercja typu funkcji vs. elementu React (`propertyFieldRegistry.getWidget('text')` nie jest funkcją).

**Pre-istniejące błędy TypeScript poza zakresem PM31 (3):**
- `src/app/api/store/order/[id]/route.ts` — typ parametrów route (Sprint 7 P4).
- `StateConsistency.test.ts` / `DynamicPropertyPanel.test.ts` — błędna ścieżka importu `src/test-utils`.

> Te pliki NIE są częścią PM31 i nie zostały zmienione. Wszystkie testy PM31 (animation) przechodzą w 100%. Pełny suite vitest: 208 passed / 5 failed files / 3 failed tests — wyłącznie Inspector (Sprint 7 PM27).

---

## 6. Evidence

### Logi
- `vitest_pm31.log` — pełny przebieg `npx vitest run` (animation 10/10 plików PASS).
- `tsc` — zakres PM31: exit 0, 0 errors.
- `build_pm31.log` — `npm run build` GREEN (Next.js production build; route table kompletna).

### Nowe moduły
- `AnimationUnitParser.ts` — `parseUnit`, `areUnitsCompatible`, `isSupportedUnit`.
- `AnimationInterpolator.ts` — `interpolateNumber`, `interpolateUnit`, `interpolateProperty`.
- `AnimationColorInterpolator.ts` — `parseColor`, `interpolateColor`.
- `AnimationTransformInterpolator.ts` — `parseTransformFunction`, `parseTransformList`, `interpolateTransform`.

### Nowe testy
| Test | Zakres |
|------|--------|
| `AnimationUnitParser.test.ts` | px/rem/%/deg/unit-less, zgodność jednostek, niepoprawne wartości |
| `AnimationInterpolator.test.ts` | number, opacity, unit (px/rem/%/deg), fallback dyskretny |
| `AnimationColorInterpolator.test.ts` | hex #rgb/#rrggbb, rgb/rgba, interpolacja kanałów, fallback |
| `AnimationTransformInterpolator.test.ts` | translateX/Y, scale, rotate, niezgodność strukturalna → fallback |

---

## 7. Handoff do PM32 / dalszych kroków

PM31 dostarczył kompletny, czysty i deterministyczny **Animation Interpolation Engine** z zachowaniem ścisłej separacji od UI, Runtime Preview i warstw biznesowych oraz pełną kompatybilnością z PM29 (domena) i PM30 (runtime). Następny krok (PM32) może skupić się wyłącznie na:
- **integracji interpolacji z Playback/Timeline Evaluator** (połączenie `RuntimeEvaluationResult` z `interpolateProperty`),
- **integracji z Inspector 2.0** i kolejnych komponentach animacji.
