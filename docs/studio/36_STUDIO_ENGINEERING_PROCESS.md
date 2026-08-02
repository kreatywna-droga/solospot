# Studio — Engineering Process Standard

> **Status:** v1.0 — APPROVED (based on Sprint 5A process)
> **Cel:** Ujednolicony standard rozwoju subsystemów Studio

---

## 1. Cel

Ten dokument definiuje **obowiązkowy proces** dla każdego subsystemu rozwijanego w ramach WEB FACTOR Studio. Proces został zweryfikowany w Sprincie 5A (Layout Engine UI) i stanowi wzorzec dla wszystkich kolejnych sprintów.

---

## 2. Cykl rozwoju subsystemu

Każdy subsystem przechodzi przez **8 obowiązkowych faz**:

```
Faza 1: Specification  →  Dokument opisujący WHAT
Faza 2: Contracts      →  Definicja kontraktów między warstwami
Faza 3: Domain Model   →  Model domenowy w builder-core
Faza 4: Core Impl      →  Implementacja w builder-core (walidacja, mapping)
Faza 5: Registry       →  Rejestracja w PropertyRegistry
Faza 6: React UI       →  Komponenty prezentacyjne
Faza 7: Review         →  Integration Review (Quality Gates)
Faza 8: Freeze         →  Architecture Freeze (formalne zatwierdzenie)
```

**Zasada:** Żadna faza nie może zostać pominięta. Każda faza musi być zakończona przed rozpoczęciem następnej.

---

## 3. Fazy — szczegółowy opis

### Faza 1: Specification

**Efekt:** Dokument w `docs/studio/` opisujący WHAT (co subsystem robi), a nie HOW (jak jest zaimplementowany).

**Wymagane sekcje:**
- Cel i zakres subsystemu
- Lista wszystkich właściwości (properties) z typami
- Opis zachowania (behavior) dla każdej właściwości
- Przykłady użycia / wartości
- Zależności od innych subsystemów

**Przykład:** `31_LAYOUT_PROPERTY_SPECIFICATION.md`

---

### Faza 2: Contracts

**Efekt:** Dokument w `docs/studio/` definiujący kontrakty między warstwami.

**Wymagane sekcje:**
- Inspector → BuilderCommand → Runtime → History flow
- Command types i ich payload
- Zdarzenia (events) między warstwami
- Oczekiwane efekty uboczne (np. Undo/Redo, CSS export)

**Przykład:** `33_LAYOUT_COMMANDS.md`

---

### Faza 3: Domain Model

**Efekt:** Nowy plik `.ts` w `packages/builder-core/src/` z modelem domenowym.

**Wymagane elementy:**
- Typy danych (TypeScript interfaces/types) — plain objects (JSON-serializable)
- Wartości domyślne (constants)
- Funkcje walidacyjne (pure functions)
- Funkcje mapowania na CSS (pure functions)
- Eksport z `packages/builder-core/src/index.ts`
- Testy jednostkowe w `__tests__/` (minimum 100 linii lub pełne pokrycie)

**Zasady:**
- Model NIE importuje React ani żadnego frameworka UI
- Model jest w pełni testowalny bez DOM
- Model jest serializowalny do JSON

**Przykład:** `LayoutTypes.ts`, `layout-types.test.ts`

---

### Faza 4: Core Implementation

**Efekt:** Implementacja logiki biznesowej w builder-core.

**Wymagane elementy:**
- Pure functions dla transformacji danych
- Brak efektów ubocznych (side effects)
- Wszystkie funkcje pokryte testami
- Integracja z istniejącymi mechanizmami (Command Pattern, HistoryStack)

---

### Faza 5: Registry

**Efekt:** Rejestracja nowych typów w PropertyRegistry.

**Wymagane elementy:**
- Import nowego renderera w `propertyFieldRegistry.tsx`
- Rejestracja w `initializeBuiltinFields()`
- **Zero zmian** w `PropertyField.tsx` (registry-based dispatch)

**Zasada:** Jeżeli dodanie nowego typu wymaga zmiany w `PropertyField.tsx`, oznacza to, że registry jest niekompletny i należy go rozszerzyć przed dodaniem kolejnych typów.

---

### Faza 6: React UI

**Efekt:** Komponenty React w `src/components/builder/inspector/fields/`.

**Wymagane elementy:**
- Komponent wyłącznie prezentacyjny (logika biznesowa w builder-core)
- Obsługa `value` / `onChange` przez PropertyRegistry
- Dispatch przez `UPDATE_PROPS` (lub dedykowaną komendę)
- Wsparcie dla responsywności (per-breakpoint) jeśli dotyczy

**Zasady:**
- Komponent NIE zawiera logiki walidacji
- Komponent NIE zawiera logiki mapowania CSS
- Komponent NIE mutuje dokumentu bezpośrednio (zawsze przez BuilderCommand)

---

### Faza 7: Integration Review

**Efekt:** Dokument w `docs/studio/` z wynikami 6 Quality Gates.

**Obowiązkowe Gates:**

| Gate | Obszar | Co weryfikuje |
|------|--------|--------------|
| Gate 1 | Runtime Flow | UPDATE_PROPS → BuilderCommand → Runtime → History (Undo/Redo) |
| Gate 2 | Inspector Integration | Renderowanie w InspectorPanel, zmiana Selection → odświeżenie PropertyPanel |
| Gate 3 | CSS Export | Wynik eksportu zgodny z LayoutTypes, mappingi działają poprawnie |
| Gate 4 | TypeScript & Public API | `tsc --noEmit` bez błędów, publiczne API kompletne (brak wycieków wewnętrznych) |
| Gate 5 | Responsive Readiness | Typy zgodne z `ResponsiveValue<T>`, serializowalne do JSON |
| Gate 6 | Architecture Conformance | Czysta separacja warstw, React nie zawiera logiki biznesowej |

**Wyniki:**
- `PASS` — wszystko OK
- `PASS WITH MINOR ISSUES` — akceptowalne, udokumentowane w Architecture Freeze
- `FAIL` — wymagane poprawki przed Architecture Freeze

**Przykład:** `34_SPRINT5A_INTEGRATION_REVIEW.md`

---

### Faza 8: Architecture Freeze

**Efekt:** Dokument w `docs/studio/` z formalnym zatwierdzeniem subsystemu.

**Wymagane sekcje:**
1. **Scope** — które moduły objął przegląd
2. **Reviewed Artifacts** — lista wszystkich dokumentów i plików
3. **Integration Review Summary** — tabela 6 Gates z krótkim uzasadnieniem
4. **Accepted Decisions** — decyzje architektoniczne utrzymane w mocy
5. **Accepted Minor Issues** — lista PASS WITH MINOR ISSUES z decyzją (akceptacja / odroczenie)
6. **Deferred Work** — rzeczy celowo przeniesione do kolejnych sprintów
7. **Final Decision** — APPROVED / APPROVED WITH ACTIONS / REJECTED

**Zasady:**
- Po Freeze subsystem nie otrzymuje nowych funkcji
- Poprawki błędów trafiają jako bugfixy (osobna ścieżka)
- Nowe funkcjonalności rozwijane są w kolejnym sprincie

**Przykład:** `35_LAYOUT_ENGINE_ARCHITECTURE_FREEZE.md`

---

## 4. Artefakty wymagane dla każdego subsystemu

| # | Artefakt | Lokalizacja | Faza |
|---|----------|-------------|------|
| 1 | Specyfikacja | `docs/studio/XX_*_SPECIFICATION.md` | 1 |
| 2 | Kontrakty | `docs/studio/XX_*_COMMANDS.md` (lub podobny) | 2 |
| 3 | Domain Model | `packages/builder-core/src/*.ts` | 3 |
| 4 | Testy modelu | `packages/builder-core/src/__tests__/*.test.ts` | 3 |
| 5 | Registry | `src/components/builder/inspector/propertyFieldRegistry.tsx` | 5 |
| 6 | React UI | `src/components/builder/inspector/fields/*.tsx` | 6 |
| 7 | Integration Review | `docs/studio/XX_*_INTEGRATION_REVIEW.md` | 7 |
| 8 | Architecture Freeze | `docs/studio/XX_*_ARCHITECTURE_FREEZE.md` | 8 |

---

## 5. Definicja ukończenia sprintu (DoD)

Sprint jest uznany za zakończony, gdy spełnione są **wszystkie** poniższe kryteria:

- [ ] Wszystkie 8 faz cyklu zakończone
- [ ] Wszystkie 8 artefaktów dostarczone
- [ ] Integration Review: brak FAIL
- [ ] Architecture Freeze: APPROVED
- [ ] Wszystkie minor issues udokumentowane z decyzją
- [ ] Publiczne API builder-core zaktualizowane i eksportowane
- [ ] Testy jednostkowe przechodzą (w izolacji od infra issues)
- [ ] Sprint oznaczony jako zamknięty w `99_IMPLEMENTATION_CHECKLIST.md`

---

## 6. Role i odpowiedzialności

| Rola | Odpowiedzialność |
|------|-----------------|
| **Architect** | Zatwierdza specyfikację, kontrakty i Architecture Freeze |
| **Engineer (builder-core)** | Implementuje Domain Model, walidację, mapping, testy |
| **Engineer (React UI)** | Implementuje komponenty prezentacyjne |
| **Reviewer** | Przeprowadza Integration Review (weryfikuje 6 Gates) |
| **Project Lead** | Aktualizuje roadmapę i `99_IMPLEMENTATION_CHECKLIST.md` |

---

## 7. Przykład: Sprint 5A — Layout Engine UI

Sprint 5A był **pierwszym subsystemem**, który przeszedł pełny cykl:

| Faza | Artefakt | Status |
|------|----------|--------|
| 1. Specification | `31_LAYOUT_PROPERTY_SPECIFICATION.md` | ✅ |
| 2. Contracts | `33_LAYOUT_COMMANDS.md` | ✅ |
| 3. Domain Model | `LayoutTypes.ts` | ✅ |
| 4. Core Impl | CSS mapping + walidacja | ✅ |
| 5. Registry | `propertyFieldRegistry.tsx` | ✅ |
| 6. React UI | SpacingField, SizeField, PositionField, FlexField | ✅ |
| 7. Review | `34_SPRINT5A_INTEGRATION_REVIEW.md` — 6 Gates ALL PASS | ✅ |
| 8. Freeze | `35_LAYOUT_ENGINE_ARCHITECTURE_FREEZE.md` — APPROVED | ✅ |

**Lekcje wyniesione (learnings):**
- Dedykowane komendy (SET_SPACING, SET_SIZE) — deferred do Sprintu 5B
- Z-index w PositionField wymagał dodatkowej obsługi controlType 'zindex' — uwzględnione w procesie jako Minor Issue

---

## 8. Wyjątki i odstępstwa

Każde odstępstwo od tego procesu wymaga:

1. Udokumentowania w Architecture Freeze jako **Accepted Minor Issue** lub **Deferred Work**
2. Zatwierdzenia przez Architekta
3. Opisania w Integration Review z uzasadnieniem

**Przykład:** Jeżeli testy E2E dla Undo/Redo nie mogą być zrealizowane w danym sprincie, trafiają jako Deferred Work do kolejnego sprintu.

---

## 9. Wersjonowanie

| Wersja | Data | Zmiany |
|--------|------|--------|
| v1.0 | 2025 | Wersja bazowa — wzorowana na procesie Sprintu 5A |

