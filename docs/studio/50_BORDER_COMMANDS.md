# Sprint 5B.3 — Border Commands

> **Epic:** C16 — WEB FACTOR Studio 2.0
> **Dokument:** 50_BORDER_COMMANDS.md
> **Status:** Draft — Sprint 5B.3
> **Sprint:** 5B.3 — Border
> **Zależności:** 49_BORDER_PROPERTY_SPECIFICATION.md, 33_LAYOUT_COMMANDS.md, BorderTypes.ts
>
> **Proces:** Faza 2 z 8 — Contracts

---

## 1. Cel

Zdefiniowanie kontraktu komend Buildera dla właściwości Border. Każda komenda opisana w tym dokumencie jest mapowaniem pomiędzy:

```
UI (Inspector — BorderField)
    → BuilderCommand (UPDATE_PROPS)
        → Document Mutation (applyCommandToDocument)
            → History (undo/redo)
                → Preview Update (recompile)
```

---

## 2. Decyzja: UPDATE_PROPS jako wystarczająca komenda

Zgodnie z **DR-BORDER-003**, Sprint 5B.3 używa istniejącej komendy `UPDATE_PROPS` dla właściwości border. Nie jest wymagana dedykowana komenda `SET_BORDER`.

### Uzasadnienie:

1. **Prostota** — Border ma tylko 3 właściwości (borderStyle, borderWidth, borderColor). Dedykowana komenda nie wnosi dodatkowej wartości.

2. **Konsystencja z DR-CMD-001** — `UPDATE_PROPS` pozostaje uniwersalnym fallbackiem dla pojedyńczych właściwości.

3. **Atomiczność przez UPDATE_PROPS** — Można ustawić wiele właściwości border w jednej komendzie:
   ```typescript
   dispatch({
     type: 'UPDATE_PROPS',
     pageId: 'page_home',
     sectionId: 'sec_card',
     props: {
       borderStyle: 'solid',
       borderWidth: { value: 2, unit: 'px' },
       borderColor: '#000000',
     },
   });
   ```

4. **Brak potrzeby dodatkowej walidacji na poziomie reducera** — Walidacja odbywa się w `validateBorderProps()` na poziomie domeny (BorderTypes.ts), a reducer deleguje do istniejących mechanizmów.

---

## 3. Command flow

### 3.1 Inspector → Command → Runtime → History

```
User changes border style in BorderField
    ↓
BorderField wywołuje onChange('borderStyle', 'solid')
    ↓
InspectorPanel.dispatch({
  type: 'UPDATE_PROPS',
  pageId,
  sectionId,
  props: { borderStyle: 'solid' },
})
    ↓
applyCommandToDocument(doc, cmd)
    ├── Merge props into section
    ├── Push snapshot to HistoryStack
    ├── touchDocument(doc) → bump version
    └── Return new doc
    ↓
Re-render → Inspector shows 'solid'
    ↓
Preview re-compiles → CSS: border-style: solid
    ↓
User presses Ctrl+Z
    ↓
HistoryStack pops → restores previous snapshot
    ↓
Inspector & Preview update
```

### 3.2 Obsługa wielu właściwości jednocześnie

Gdy użytkownik ustawia wszystkie 3 właściwości border:

```
BorderField wywołuje (kolejno):
  onChange('borderStyle', 'solid')
  onChange('borderWidth', { value: 2, unit: 'px' })
  onChange('borderColor', '#333')
    ↓
InspectorPanel dispatch (kolejno):
  UPDATE_PROPS → { borderStyle: 'solid' }
  UPDATE_PROPS → { borderWidth: { value: 2, unit: 'px' } }
  UPDATE_PROPS → { borderColor: '#333' }
    ↓
Trzy osobne operacje w historii:
  "Set border style"
  "Set border width"
  "Set border color"
```

### 3.3 Reset do wartości domyślnej

Gdy użytkownik resetuje borderStyle do `undefined` (brak obramowania):

```
BorderField wywołuje:
  onChange('borderStyle', undefined)
    ↓
InspectorPanel dispatch:
  UPDATE_PROPS → { borderStyle: undefined }
    ↓
CSS mapping:
  borderStyle → undefined → brak CSS output
```

---

## 4. Walidacja na poziomie Command

### 4.1 Walidacja przed dispatch

Zanim `InspectorPanel` wyśle komendę, `BorderField` powinien przeprowadzić podstawową walidację:

```typescript
function validateBorderCommand(
  sectionId: string,
  key: string,
  value: unknown
): { valid: boolean; error?: string } {
  const validKeys = ['borderStyle', 'borderWidth', 'borderColor'];

  if (!validKeys.includes(key)) {
    return { valid: false, error: `Invalid border property: ${key}` };
  }

  if (key === 'borderStyle' && value !== undefined) {
    const validStyles = ['solid', 'dashed', 'dotted'];
    if (!validStyles.includes(value as string)) {
      return { valid: false, error: `Invalid border style: ${value}. Must be: solid, dashed, dotted` };
    }
  }

  if (key === 'borderWidth' && value !== undefined) {
    if (typeof value !== 'object' || !value || typeof (value as Record<string, unknown>).value !== 'number') {
      return { valid: false, error: 'Border width must be an object with value and unit' };
    }
  }

  if (key === 'borderColor' && value !== undefined) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return { valid: false, error: 'Border color must be a non-empty string' };
    }
  }

  return { valid: true };
}
```

### 4.2 Walidacja w reducerze (opcjonalna)

Ponieważ `UPDATE_PROPS` jest generyczny, walidacja w reducerze może być pominięta — niezmiennik `BorderProps` jest gwarantowany przez:

1. Walidację w `BorderField` (UI)
2. Walidację w `borderToCSS()` (pure function)
3. Testy jednostkowe

---

## 5. Historia (Undo/Redo)

### 5.1 Label mapping

| Zmiana | Label w historii |
|--------|-----------------|
| Ustawienie `borderStyle` | "Set border style" |
| Ustawienie `borderWidth` | "Set border width" |
| Ustawienie `borderColor` | "Set border color" |
| Reset `borderStyle` do domyślnej | "Reset border style" |

### 5.2 Mechanizm

`UPDATE_PROPS` korzysta z istniejącego mechanizmu `HistoryStack` (snapshot-based). Każda zmiana tworzy snapshot przed mutacją.

---

## 6. Lista przyszłych dedykowanych komend

Poniższe komendy nie są implementowane w Sprincie 5B.3, ale są zdefiniowane na potrzeby przyszłych sprintów:

| Komenda | Planowany sprint | Opis |
|---------|:----------------:|------|
| `SET_BORDER` | Późniejszy | Atomiczna zmiana wszystkich właściwości border jednocześnie, z walidacją na poziomie reducera |
| `SET_BORDER_EDGE` | Późniejszy | Per-edge border (border-top, border-left...) |

### 6.1 SET_BORDER (future)

```typescript
interface SetBorderCommand {
  readonly type: 'SET_BORDER';
  readonly pageId: string;
  readonly sectionId: string;
  readonly value: BorderProps;
  readonly breakpoint?: Breakpoint;
}
```

---

## 7. Kontrakt między warstwami

### 7.1 Inspector → BuilderCommand

| Z | Do | Format danych |
|---|----|-------------|
| BorderField | InspectorPanel | `(key: 'borderStyle', value: 'solid')` |
| InspectorPanel | dispatch | `UPDATE_PROPS { props: { borderStyle: 'solid' } }` |
| dispatch | applyCommandToDocument | `BuilderCommand` |

### 7.2 BuilderCommand → Runtime

| Z | Do | Format danych |
|---|----|-------------|
| applyCommandToDocument | BuilderDocument | Mutacja `section.props.borderStyle` |
| compile() | CompiledDocument | `compiledProps.borderStyle: 'solid'` |
| CompiledDocument | Runtime (Preview) | CSS string przez PostMessage |

### 7.3 Runtime → History

| Z | Do | Format danych |
|---|----|-------------|
| applyCommandToDocument | HistoryStack | Snapshot BuilderDocument przed mutacją |
| HistoryStack | applyCommandToDocument | Przywrócenie snapshota |

---

## 8. Przykłady użycia

### 8.1 Solid border

```typescript
dispatch({
  type: 'UPDATE_PROPS',
  pageId: 'page_home',
  sectionId: 'sec_card',
  props: {
    borderStyle: 'solid',
    borderWidth: { value: 1, unit: 'px' },
    borderColor: '#e2e8f0',
  },
});

// CSS output:
// .sec-card { border-style: solid; border-width: 1px; border-color: #e2e8f0; }
```

### 8.2 Dashed border bez koloru

```typescript
dispatch({
  type: 'UPDATE_PROPS',
  pageId: 'page_home',
  sectionId: 'sec_alert',
  props: {
    borderStyle: 'dashed',
    borderWidth: { value: 2, unit: 'px' },
  },
});

// CSS output:
// .sec-alert { border-style: dashed; border-width: 2px; }
```

### 8.3 Reset border (usunięcie obramowania)

```typescript
dispatch({
  type: 'UPDATE_PROPS',
  pageId: 'page_home',
  sectionId: 'sec_card',
  props: {
    borderStyle: undefined,
    borderWidth: undefined,
    borderColor: undefined,
  },
});

// CSS output: (brak — żaden border CSS nie jest emitowany)
```

---

## 9. Decision Records

### DR-BORDER-CMD-001: UPDATE_PROPS zamiast SET_BORDER
**Status:** Proposed
**Uzasadnienie:** Border ma tylko 3 proste właściwości. Dedykowana komenda nie wnosi wartości dodanej. `UPDATE_PROPS` jest wystarczający i zgodny z DR-CMD-001.

### DR-BORDER-CMD-002: Walidacja na poziomie UI, nie reducera
**Status:** Proposed
**Uzasadnienie:** Ponieważ `UPDATE_PROPS` jest generyczny, walidacja na poziomie reducera wymagałaby dodania logiki specyficznej dla border do generycznego mechanizmu. Walidacja w `BorderField` + testy jednostkowe `validateBorderProps()` są wystarczające.

---

```text
Sprint 5B.3 — Border Commands
Status: Draft
Data: 2025

Podpis: ________________________
```

