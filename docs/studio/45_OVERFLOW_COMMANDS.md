# Sprint 5B.2 — Overflow Commands

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 45_OVERFLOW_COMMANDS.md  
> **Status:** Draft — Sprint 5B.2  
> **Sprint:** 5B.2 — Overflow  
> **Zależności:** 44_OVERFLOW_PROPERTY_SPECIFICATION.md, 33_LAYOUT_COMMANDS.md, LayoutTypes.ts
>
> **Proces:** Faza 2 z 8 — Contracts

---

## 1. Cel

Zdefiniowanie kontraktu komend Buildera dla właściwości Overflow. Każda komenda opisana w tym dokumencie jest mapowaniem pomiędzy:

```
UI (Inspector — OverflowField)
    → BuilderCommand (UPDATE_PROPS)
        → Document Mutation (applyCommandToDocument)
            → History (undo/redo)
                → Preview Update (recompile)
```

---

## 2. Decyzja: UPDATE_PROPS jako wystarczająca komenda

Zgodnie z **DR-OVERFLOW-002**, Sprint 5B.2 używa istniejącej komendy `UPDATE_PROPS` dla właściwości overflow. Nie jest wymagana dedykowana komenda `SET_OVERFLOW`.

### Uzasadnienie:

1. **Prostota** — Overflow ma tylko 3 właściwości (overflow, overflowX, overflowY), wszystkie tego samego typu (OverflowMode). Dedykowana komenda nie wnosi dodatkowej wartości.

2. **Konsystencja z DR-CMD-001** — `UPDATE_PROPS` pozostaje uniwersalnym fallbackiem dla pojedyńczych właściwości.

3. **Atomiczność przez UPDATE_PROPS** — Można ustawić wiele właściwości overflow w jednej komendzie:
   ```typescript
   dispatch({
     type: 'UPDATE_PROPS',
     pageId: 'page_home',
     sectionId: 'sec_hero',
     props: {
       overflow: 'hidden',
       overflowX: 'scroll',
     },
   });
   ```

4. **Brak potrzeby dodatkowej walidacji na poziomie reducera** — Walidacja odbywa się w `validateOverflowProps()` na poziomie domeny (LayoutTypes.ts), a reducer deleguje do istniejących mechanizmów.

---

## 3. Command flow

### 3.1 Inspector → Command → Runtime → History

```
User changes overflow in OverflowField
    ↓
OverflowField wywołuje onChange('overflow', 'hidden')
    ↓
InspectorPanel.dispatch({
  type: 'UPDATE_PROPS',
  pageId,
  sectionId,
  props: { overflow: 'hidden' },
})
    ↓
applyCommandToDocument(doc, cmd)
    ├── Merge props into section
    ├── Push snapshot to HistoryStack
    ├── touchDocument(doc) → bump version
    └── Return new doc
    ↓
Re-render → Inspector shows 'hidden'
    ↓
Preview re-compiles → CSS: overflow: hidden
    ↓
User presses Ctrl+Z
    ↓
HistoryStack pops → restores previous snapshot
    ↓
Inspector & Preview update
```

### 3.2 Obsługa wielu właściwości jednocześnie

Gdy użytkownik ustawia `overflowX` i `overflowY` (oba różne od `overflow`):

```
OverflowField wywołuje:
  onChange('overflowX', 'scroll')
  onChange('overflowY', 'auto')
    ↓
InspectorPanel dispatch (kolejno):
  UPDATE_PROPS → { overflowX: 'scroll' }
  UPDATE_PROPS → { overflowY: 'auto' }
    ↓
Dwie osobne operacje w historii:
  "Set overflow-x"
  "Set overflow-y"
```

### 3.3 Reset do wartości domyślnej

Gdy użytkownik resetuje `overflowX` do `undefined` (użycie `overflow`):

```
OverflowField wywołuje:
  onChange('overflowX', undefined)
    ↓
InspectorPanel dispatch:
  UPDATE_PROPS → { overflowX: undefined }
    ↓
CSS mapping:
  overflowX → undefined → użyj props.overflow → 'hidden'
```

---

## 4. Walidacja na poziomie Command

### 4.1 Walidacja przed dispatch

Zanim `InspectorPanel` wyśle komendę, `OverflowField` powinien przeprowadzić podstawową walidację:

```typescript
function validateOverflowCommand(
  sectionId: string,
  key: string,
  value: unknown
): { valid: boolean; error?: string } {
  const validKeys = ['overflow', 'overflowX', 'overflowY'];
  
  if (!validKeys.includes(key)) {
    return { valid: false, error: `Invalid overflow property: ${key}` };
  }

  if (value !== undefined) {
    const validValues = ['visible', 'hidden', 'scroll', 'auto'];
    if (!validValues.includes(value as string)) {
      return { valid: false, error: `Invalid overflow value: ${value}. Must be one of: visible, hidden, scroll, auto` };
    }
  }

  return { valid: true };
}
```

### 4.2 Walidacja w reducerze (opcjonalna)

Ponieważ `UPDATE_PROPS` jest generyczny, walidacja w reducerze może być pominięta — niezmiennik `OverflowProps` jest gwarantowany przez:

1. Walidację w `OverflowField` (UI)
2. Walidację w `overflowToCSS()` (pure function, rzuca błąd dla nieznanych wartości)
3. Testy jednostkowe

---

## 5. Historia (Undo/Redo)

### 5.1 Label mapping

| Zmiana | Label w historii |
|--------|-----------------|
| Ustawienie `overflow` | "Set overflow" |
| Ustawienie `overflowX` | "Set overflow-x" |
| Ustawienie `overflowY` | "Set overflow-y" |
| Reset `overflowX` do domyślnej | "Reset overflow-x" |
| Reset `overflowY` do domyślnej | "Reset overflow-y" |

### 5.2 Mechanizm

`UPDATE_PROPS` korzysta z istniejącego mechanizmu `HistoryStack` (snapshot-based). Każda zmiana tworzy snapshot przed mutacją.

---

## 6. Lista przyszłych dedykowanych komend

Poniższe komendy nie są implementowane w Sprincie 5B.2, ale są zdefiniowane na potrzeby przyszłych sprintów:

| Komenda | Planowany sprint | Opis |
|---------|:----------------:|------|
| `SET_OVERFLOW` | Późniejszy | Atomiczna zmiana wszystkich 3 właściwości overflow jednocześnie, z walidacją na poziomie reducera |
| `SET_TEXT_OVERFLOW` | Sprint 7 (Inspector 2.0) | `text-overflow: clip \| ellipsis` |

### 6.1 SET_OVERFLOW (future)

```typescript
interface SetOverflowCommand {
  readonly type: 'SET_OVERFLOW';
  readonly pageId: string;
  readonly sectionId: string;
  readonly value: OverflowProps;
  readonly breakpoint?: Breakpoint;
}
```

---

## 7. Kontrakt między warstwami

### 7.1 Inspector → BuilderCommand

| Z | Do | Format danych |
|---|----|-------------|
| OverflowField | InspectorPanel | `(key: 'overflow', value: 'hidden')` |
| InspectorPanel | dispatch | `UPDATE_PROPS { props: { overflow: 'hidden' } }` |
| dispatch | applyCommandToDocument | `BuilderCommand` |

### 7.2 BuilderCommand → Runtime

| Z | Do | Format danych |
|---|----|-------------|
| applyCommandToDocument | BuilderDocument | Mutacja `section.props.overflow` |
| compile() | CompiledDocument | `compiledProps.overflow: 'hidden'` |
| CompiledDocument | Runtime (Preview) | CSS string przez PostMessage |

### 7.3 Runtime → History

| Z | Do | Format danych |
|---|----|-------------|
| applyCommandToDocument | HistoryStack | Snapshot BuilderDocument przed mutacją |
| HistoryStack | applyCommandToDocument | Przywrócenie snapshota |

---

## 8. Przykłady użycia

### 8.1 Ukrycie overflow

```typescript
// Użytkownik ustawia overflow: hidden na sekcji hero
dispatch({
  type: 'UPDATE_PROPS',
  pageId: 'page_home',
  sectionId: 'sec_hero',
  props: {
    overflow: 'hidden',
  },
});

// CSS output:
// .sec-hero { overflow: hidden; }
```

### 8.2 Scroll tylko w osi Y

```typescript
// Użytkownik ustawia overflow: auto, overflowY: scroll
dispatch({
  type: 'UPDATE_PROPS',
  pageId: 'page_home',
  sectionId: 'sec_sidebar',
  props: {
    overflow: 'auto',
    overflowY: 'scroll',
  },
});

// CSS output:
// .sec-sidebar { overflow-x: auto; overflow-y: scroll; }
```

### 8.3 Reset do wartości domyślnej

```typescript
// Użytkownik resetuje overflowX do undefined (użycie overflow)
dispatch({
  type: 'UPDATE_PROPS',
  pageId: 'page_home',
  sectionId: 'sec_hero',
  props: {
    overflowX: undefined,
  },
});

// CSS output: overflow: hidden (jeśli overflow był hidden)
// Jeśli overflow był visible → pusty CSS
```

---

## 9. Decision Records

### DR-OVERFLOW-CMD-001: UPDATE_PROPS zamiast SET_OVERFLOW
**Status:** Proposed  
**Uzasadnienie:** Overflow ma tylko 3 proste właściwości tego samego typu. Dedykowana komenda nie wnosi wartości dodanej. `UPDATE_PROPS` jest wystarczający i zgodny z DR-CMD-001.

### DR-OVERFLOW-CMD-002: Walidacja na poziomie UI, nie reducera
**Status:** Proposed  
**Uzasadnienie:** Ponieważ `UPDATE_PROPS` jest generyczny, walidacja na poziomie reducera wymagałaby dodania logiki specyficznej dla overflow do generycznego mechanizmu. Walidacja w `OverflowField` + testy jednostkowe `validateOverflow()` są wystarczające.

---

```
Sprint 5B.2 — Overflow Commands
Status: Draft
Data: 2025

Podpis: ________________________
```

