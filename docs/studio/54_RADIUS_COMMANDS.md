# Sprint 5B.4 — Radius Commands

> **Epic:** C16 — WEB FACTOR Studio 2.0
> **Dokument:** 54_RADIUS_COMMANDS.md
> **Status:** Draft — Sprint 5B.4
> **Sprint:** 5B.4 — Radius
> **Zależności:** 53_RADIUS_PROPERTY_SPECIFICATION.md, 33_LAYOUT_COMMANDS.md, RadiusTypes.ts
>
> **Proces:** Faza 2 z 8 — Contracts

---

## 1. Cel

Zdefiniowanie kontraktu komend Buildera dla właściwości Radius. Każda komenda opisana w tym dokumencie jest mapowaniem pomiędzy:

```
UI (Inspector — RadiusField)
    → BuilderCommand (UPDATE_PROPS)
        → Document Mutation (applyCommandToDocument)
            → History (undo/redo)
                → Preview Update (recompile)
```

---

## 2. Decyzja: UPDATE_PROPS jako wystarczająca komenda

Zgodnie z **DR-RADIUS-003**, Sprint 5B.4 używa istniejącej komendy `UPDATE_PROPS` dla właściwości radius. Nie jest wymagana dedykowana komenda `SET_RADIUS`.

### Uzasadnienie:

1. **Prostota** — Radius ma maksymalnie 5 właściwości (mode + 4 narożniki). Dedykowana komenda nie wnosi dodatkowej wartości.

2. **Konsystencja z DR-CMD-001** — `UPDATE_PROPS` pozostaje uniwersalnym fallbackiem dla pojedyńczych właściwości.

3. **Atomiczność przez UPDATE_PROPS** — Można ustawić radius i przełączyć tryb w jednej komendzie:
   ```typescript
   dispatch({
     type: 'UPDATE_PROPS',
     pageId: 'page_home',
     sectionId: 'sec_card',
     props: {
       borderRadius: {
         mode: 'uniform',
         radius: { value: 8, unit: 'px' },
       },
     },
   });
   ```

4. **Brak potrzeby dodatkowej walidacji na poziomie reducera** — Walidacja odbywa się w `validateRadiusProps()` na poziomie domeny (RadiusTypes.ts), a reducer deleguje do istniejących mechanizmów.

---

## 3. Command flow

### 3.1 Inspector → Command → Runtime → History

```
User changes radius in RadiusField
    ↓
RadiusField wywołuje onChange('borderRadius', { mode: 'uniform', radius: { value: 8, unit: 'px' } })
    ↓
InspectorPanel.dispatch({
  type: 'UPDATE_PROPS',
  pageId,
  sectionId,
  props: { borderRadius: { mode: 'uniform', radius: { value: 8, unit: 'px' } } },
})
    ↓
applyCommandToDocument(doc, cmd)
    ├── Merge props into section
    ├── Push snapshot to HistoryStack
    ├── touchDocument(doc) → bump version
    └── Return new doc
    ↓
Re-render → Inspector shows '8px'
    ↓
Preview re-compiles → CSS: border-radius: 8px
    ↓
User presses Ctrl+Z
    ↓
HistoryStack pops → restores previous snapshot
    ↓
Inspector & Preview update
```

### 3.2 Przełączanie trybu uniform ↔ per-corner

```
User przełącza z uniform na per-corner
    ↓
RadiusField wywołuje onChange('borderRadius', {
  mode: 'per-corner',
  topLeft: { value: 8, unit: 'px' },
  topRight: { value: 8, unit: 'px' },
  bottomRight: { value: 8, unit: 'px' },
  bottomLeft: { value: 8, unit: 'px' },
})
    ↓
InspectorPanel dispatch:
  UPDATE_PROPS → { borderRadius: { mode: 'per-corner', ... } }
    ↓
CSS mapping:
  per-corner → border-top-left-radius: 8px;
               border-top-right-radius: 8px;
               border-bottom-right-radius: 8px;
               border-bottom-left-radius: 8px;
```

### 3.3 Zmiana pojedynczego narożnika (per-corner mode)

```
User zmienia topLeft na 16px
    ↓
RadiusField wywołuje onChange('borderRadius', existingProps z zmienionym topLeft)
    ↓
InspectorPanel dispatch:
  UPDATE_PROPS → { borderRadius: { mode: 'per-corner', topLeft: { value: 16, unit: 'px' }, ... } }
    ↓
Tylko border-top-left-radius: 16px jest aktualizowany w CSS
```

### 3.4 Reset do wartości domyślnej

```
User resetuje radius (wszystkie wartości → undefined)
    ↓
RadiusField wywołuje onChange('borderRadius', { mode: 'uniform' })
    ↓
InspectorPanel dispatch:
  UPDATE_PROPS → { borderRadius: { mode: 'uniform' } }
    ↓
CSS mapping:
  radius → undefined → brak CSS output
```

---

## 4. Label mapping dla historii

| Zmiana | Label w historii |
|--------|-----------------|
| Ustawienie radius (uniform) | "Set border radius" |
| Ustawienie topLeft | "Set top-left radius" |
| Ustawienie topRight | "Set top-right radius" |
| Ustawienie bottomRight | "Set bottom-right radius" |
| Ustawienie bottomLeft | "Set bottom-left radius" |
| Przełączenie na per-corner | "Switch to per-corner" |
| Przełączenie na uniform | "Switch to uniform radius" |
| Reset radius | "Reset border radius" |

---

## 5. Walidacja na poziomie Command

### 5.1 Walidacja przed dispatch

Zanim `InspectorPanel` wyśle komendę, `RadiusField` przeprowadza podstawową walidację:

- `mode` musi być 'uniform' lub 'per-corner'
- `value` w RadiusValue musi być liczbą ≥ 0
- `unit` musi być 'px' lub '%'

### 5.2 Walidacja w reducerze (opcjonalna)

Ponieważ `UPDATE_PROPS` jest generyczny, walidacja w reducerze może być pominięta — niezmiennik `RadiusProps` jest gwarantowany przez:

1. Walidację w `RadiusField` (UI)
2. Walidację w `radiusToCSS()` (pure function)
3. Testy jednostkowe

---

## 6. Kontrakt między warstwami

### 6.1 Inspector → BuilderCommand

| Z | Do | Format danych |
|---|----|-------------|
| RadiusField | InspectorPanel | `(key: 'borderRadius', value: RadiusProps)` |
| InspectorPanel | dispatch | `UPDATE_PROPS { props: { borderRadius: RadiusProps } }` |
| dispatch | applyCommandToDocument | `BuilderCommand` |

### 6.2 BuilderCommand → Runtime

| Z | Do | Format danych |
|---|----|-------------|
| applyCommandToDocument | BuilderDocument | Mutacja `section.props.borderRadius` |
| compile() | CompiledDocument | `compiledProps.borderRadius` |
| CompiledDocument | Runtime (Preview) | CSS string przez PostMessage |

### 6.3 Runtime → History

| Z | Do | Format danych |
|---|----|-------------|
| applyCommandToDocument | HistoryStack | Snapshot BuilderDocument przed mutacją |
| HistoryStack | applyCommandToDocument | Przywrócenie snapshota |

---

## 7. Przykłady użycia

### 7.1 Zaokrąglone rogi (uniform)

```typescript
dispatch({
  type: 'UPDATE_PROPS',
  pageId: 'page_home',
  sectionId: 'sec_card',
  props: {
    borderRadius: {
      mode: 'uniform',
      radius: { value: 8, unit: 'px' },
    },
  },
});

// CSS output:
// .sec-card { border-radius: 8px; }
```

### 7.2 Koło (50%)

```typescript
dispatch({
  type: 'UPDATE_PROPS',
  pageId: 'page_home',
  sectionId: 'sec_avatar',
  props: {
    borderRadius: {
      mode: 'uniform',
      radius: { value: 50, unit: '%' },
    },
  },
});

// CSS output:
// .sec-avatar { border-radius: 50%; }
```

### 7.3 Różne narożniki (per-corner)

```typescript
dispatch({
  type: 'UPDATE_PROPS',
  pageId: 'page_home',
  sectionId: 'sec_banner',
  props: {
    borderRadius: {
      mode: 'per-corner',
      topLeft: { value: 16, unit: 'px' },
      topRight: { value: 0, unit: 'px' },
      bottomRight: { value: 16, unit: 'px' },
      bottomLeft: { value: 0, unit: 'px' },
    },
  },
});

// CSS output:
// .sec-banner { border-top-left-radius: 16px; border-bottom-right-radius: 16px; }
```

### 7.4 Tylko górne narożniki

```typescript
dispatch({
  type: 'UPDATE_PROPS',
  pageId: 'page_home',
  sectionId: 'sec_header',
  props: {
    borderRadius: {
      mode: 'per-corner',
      topLeft: { value: 12, unit: 'px' },
      topRight: { value: 12, unit: 'px' },
    },
  },
});

// CSS output:
// .sec-header { border-top-left-radius: 12px; border-top-right-radius: 12px; }
```

---

## 8. Decision Records

### DR-RADIUS-CMD-001: UPDATE_PROPS zamiast SET_RADIUS
**Status:** Proposed
**Uzasadnienie:** Radius to prosty subsystem z jednym złożonym polem (RadiusProps). Dedykowana komenda nie wnosi wartości dodanej. `UPDATE_PROPS` jest wystarczający i zgodny z DR-CMD-001.

### DR-RADIUS-CMD-002: Walidacja na poziomie UI, nie reducera
**Status:** Proposed
**Uzasadnienie:** Ponieważ `UPDATE_PROPS` jest generyczny, walidacja na poziomie reducera wymagałaby dodania logiki specyficznej dla radius do generycznego mechanizmu. Walidacja w `RadiusField` + testy jednostkowe `validateRadiusProps()` są wystarczające.

---

```text
Sprint 5B.4 — Radius Commands
Status: Draft
Data: 2025

Podpis: ________________________
```

