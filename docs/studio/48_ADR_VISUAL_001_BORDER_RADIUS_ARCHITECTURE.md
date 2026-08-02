# ADR-VISUAL-001 — Border i Radius: Architektura subsystemów wizualnych

> **Status:** Proposed — Sprint 5B.3 Pre-planning  
> **Data:** 2025  
> **Cel:** Określenie relacji architektonicznej pomiędzy Border i Radius przed rozpoczęciem Sprintu 5B.3  
> **Autor:** Architecture Review (na podstawie analizy po Sprint 5B.2)  
> **Zależności:** 36_STUDIO_ENGINEERING_PROCESS.md, 37_STUDIO_SUBSYSTEM_ROADMAP.md, 43_MILESTONE_v2_GOALS.md

---

## 1. Kontekst

Po zamknięciu Sprintu 5B.2 (Overflow Engine — Architecture Freeze), projekt ma trzy niezależne subsystemy, które przeszły pełny 8-fazowy proces inżynierski:

| Subsystem | Sprint | Status |
|-----------|--------|--------|
| Layout Engine | 5A | 🔒 Frozen |
| Grid Engine | 5B.1 | 🔒 Frozen |
| Overflow Engine | 5B.2 | 🔒 Frozen |

Kolejne zaplanowane sprinty to **Border (5B.3)** i **Radius (5B.4)**. Przed rozpoczęciem implementacji należy rozstrzygnąć, jak te dwa subsystemy mają być względem siebie zaprojektowane — czy jako dwa całkowicie niezależne subsystemy, czy jako jedna spójna grupa właściwości wizualnych.

---

## 2. Analiza

### 2.1 Domain Model

**Border** opisuje:
- `border-style` (solid, dashed, dotted, double, groove, ridge, inset, outset, none)
- `border-width` (grubość w px/rem/em)
- `border-color` (kolor)
- Poszczególne krawędzie: `border-top`, `border-right`, `border-bottom`, `border-left`
- (w przyszłości) `outline`

**Radius** opisuje:
- `border-radius` (wartość globalna)
- `border-top-left-radius`, `border-top-right-radius`, `border-bottom-right-radius`, `border-bottom-left-radius`
- Jednostki: px, %, rem, em
- (w przyszłości) `border-radius: 10px 20px 30px 40px` (shorthand per-narożnik)

**Wniosek:** Są to dwa różne modele danych. Border opisuje obramowanie (styl + grubość + kolor), Radius opisuje geometrię narożników (tylko wartość). Nie współdzielą typów, jednostek ani logiki walidacji.

### 2.2 Inspector UX

Z perspektywy użytkownika Border i Radius są ze sobą silnie powiązane:

- W praktycznie każdym edytorze (Figma, Webflow, Wix Studio) znajdują się obok siebie
- Zmiana koloru obramowania bardzo często idzie razem ze zmianą zaokrąglenia
- Użytkownik oczekuje jednej sekcji "Visual" lub "Border & Radius" w Inspectorze

**Wniosek:** UX sugeruje jeden panel/kategorię w Inspectorze, nawet jeśli modele domenowe są osobne.

### 2.3 Registry

| Opcja | Registry Type | Plusy | Minusy |
|-------|--------------|-------|--------|
| Osobne typy | `border`, `radius` | Czysta separacja, zgodne z existing pattern | Dwie osobne rejestracje |
| Wspólny typ | `visual-style` | Jeden renderer | Mieszanie odpowiedzialności, łamie DR-VISUAL-001 |

**Wniosek:** Osobne typy w registry (`border`, `radius`) są zgodne z istniejącym wzorcem (overflow, flex, grid-tracks, grid-span, itd.).

### 2.4 Runtime (CSS Mapping)

- `borderToCSS()` → generuje `border`, `border-style`, `border-width`, `border-color`, per-edge variants
- `radiusToCSS()` → generuje `border-radius`, per-corner variants

Obie funkcje są **niezależne** — nie ma CSS właściwości, która łączy border i radius w jedną wartość. Finalny CSS elementu może zawierać obie grupy właściwości, ale są one generowane przez osobne pure functions.

**Wniosek:** Funkcje CSS mapping powinny działać niezależnie.

### 2.5 Testy

Scenariusze E2E użytkownika mogą być wspólne:

```
Ustaw border (styl + grubość + kolor)
  ↓
Ustaw radius
  ↓
Undo (cofa radius)
  ↓
Redo (przywraca radius)
  ↓
Undo (cofa border)
```

To jest naturalny przepływ użytkownika, ale nie wymaga połączenia kodu — wymaga jedynie testów integracyjnych, które pokrywają obie operacje.

---

## 3. Decyzja

### ADR-VISUAL-001: Border i Radius pozostają niezależnymi subsystemami domenowymi, ale są projektowane jako jedna grupa właściwości wizualnych w Inspectorze.

| # | Decyzja | Uzasadnienie |
|---|---------|-------------|
| **D1** | **Border i Radius jako osobne subsystemy** | Dwa różne modele domenowe, różne CSS mapping, różne walidacje. Zgodne z 8-fazowym procesem. |
| **D2** | **Wspólna kategoria w Inspectorze** | "Visual" lub "Border & Radius" — jeden panel, dwie sekcje. UX spójny z oczekiwaniami użytkownika. |
| **D3** | **Osobne typy w PropertyRegistry** | `border` i `radius` jako osobne custom types. Zgodne z existing pattern. |
| **D4** | **Niezależne CSS mapping** | `borderToCSS()` i `radiusToCSS()` jako osobne pure functions. |
| **D5** | **Osobne pliki domenowe** | `BorderTypes.ts` i `RadiusTypes.ts` — brak współdzielenia modeli. |
| **D6** | **Wspólne planowanie, osobne sprinty** | Sprint 5B.3 (Border) → Sprint 5B.4 (Radius) — zachowanie małych sprintów i Architecture Freeze per subsystem. |

---

## 4. Plan implementacji

### Sprint 5B.3 — Border

| Faza | Artefakt |
|------|----------|
| 1. Specification | `48_BORDER_PROPERTY_SPECIFICATION.md` |
| 2. Contracts | `49_BORDER_COMMANDS.md` |
| 3. Domain Model | `BorderTypes.ts` (nowy plik w builder-core) |
| 4. Core Implementation | `borderToCSS()` + `validateBorder()` |
| 5. Registry | Rejestracja `'border'` w PropertyRegistry |
| 6. React UI | `BorderField.tsx` (w kategorii "Visual" w Inspectorze) |
| 7. Integration Review | `50_SPRINT5B3_INTEGRATION_REVIEW.md` |
| 8. Architecture Freeze | `51_BORDER_ARCHITECTURE_FREEZE.md` |

### Sprint 5B.4 — Radius

| Faza | Artefakt |
|------|----------|
| 1. Specification | `52_RADIUS_PROPERTY_SPECIFICATION.md` |
| 2. Contracts | `53_RADIUS_COMMANDS.md` |
| 3. Domain Model | `RadiusTypes.ts` (nowy plik w builder-core) |
| 4. Core Implementation | `radiusToCSS()` + `validateRadius()` |
| 5. Registry | Rejestracja `'radius'` w PropertyRegistry |
| 6. React UI | `RadiusField.tsx` (w kategorii "Visual" w Inspectorze, obok Border) |
| 7. Integration Review | `54_SPRINT5B4_INTEGRATION_REVIEW.md` |
| 8. Architecture Freeze | `55_RADIUS_ARCHITECTURE_FREEZE.md` |

---

## 5. Inspector UX — kategoria "Visual"

Docelowy układ w Inspectorze po Sprintach 5B.3 i 5B.4:

```
InspectorPanel
├── Layout (kategoria)
│   ├── Display / Flex
│   ├── Spacing (padding, margin)
│   ├── Size (width, height)
│   ├── Position
│   ├── Grid
│   └── Overflow
│
├── Visual (kategoria) ← NOWA
│   ├── Border
│   │   ├── Style (select: solid, dashed, dotted, etc.)
│   │   ├── Width (number + unit)
│   │   ├── Color (color picker)
│   │   └── Per-edge (expandable: top, right, bottom, left)
│   │
│   └── Radius
│       ├── Radius (number + unit: px, %, rem, em)
│       └── Per-corner (expandable: top-left, top-right, bottom-right, bottom-left)
│
├── Typography (kategoria) — przyszłość (Sprint 7)
├── Background (kategoria) — przyszłość
└── Effects (kategoria) — przyszłość
```

---

## 6. Załączniki

1. `docs/studio/36_STUDIO_ENGINEERING_PROCESS.md` — 8-fazowy proces rozwoju
2. `docs/studio/37_STUDIO_SUBSYSTEM_ROADMAP.md` — Pełna roadmapa
3. `docs/studio/43_MILESTONE_v2_GOALS.md` — Cele Milestone v2.0

---

```
ADR-VISUAL-001 — Border i Radius: Architektura subsystemów wizualnych
Status: Proposed
Data: 2025

Podpis: ________________________
