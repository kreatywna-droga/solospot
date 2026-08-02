# C16.14 — WEB FACTOR Studio History Engine

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 14_HISTORY_ENGINE.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md

---

## 1. Cel

History Engine zapewnia pełne undo/redo, snapshoty, wersjonowanie i time-travel debugging. Każda zmiana w dokumencie jest rejestrowana i może być cofnięta.

**Obecnie:** HistoryStack.ts istnieje z podstawowym undo/redo.
**Docelowo:** Pełna historia z snapshotami, wersjami i przywracaniem.

---

## 2. Architektura

```
User Action → dispatch(command)
    ↓
BuilderContext.dispatch()
    ↓
applyCommandToDocument() → newDoc
    ↓
HistoryStack.push(newDoc, label)
    ↓
{
  entries: HistoryEntry[],
  currentIndex: number,
}
    ↓
UI: History Panel (lista zmian)
    ↓
User klika "Restore" → dispatch(UNDO/REDO) lub restore specific version
```

---

## 3. History Stack (istnieje + rozszerzenie)

```typescript
// ROZSZERZENIE istniejącego HistoryStack

interface HistoryEntry<T> {
  id: string;                  // unikalne ID
  label: string;               // "Zmiana koloru tła"
  timestamp: number;           // Unix ms
  state: T;                    // snapshot dokumentu
  commandType: string;         // "UPDATE_PROPS"
  sectionId?: string;          // która sekcja
  pageId?: string;             // która strona
  thumbnail?: string;          // miniaturka stanu (opcjonalnie)
  tags?: string[];             // tagi do grupowania
}

interface HistoryStack<T> {
  // Istniejące
  canUndo: boolean;
  canRedo: boolean;
  currentIndex: number;
  entries: ReadonlyArray<HistoryEntry<T>>;
  
  // Nowe
  push(state: T, label: string, metadata?: EntryMetadata): HistoryStack<T>;
  jumpTo(index: number): { stack: HistoryStack<T>; state: T } | null;
  clear(): HistoryStack<T>;
  getSnapshot(id: string): T | null;
  getEntriesByPage(pageId: string): HistoryEntry<T>[];
  getEntriesBySection(sectionId: string): HistoryEntry<T>[];
  mergeRecent(count: number, label: string): HistoryStack<T>;  // "Squash"
}
```

---

## 4. History Panel UI

### 4.1 Layout

```
┌──────────────────────────────────┐
│  📋 HISTORY              [×]    │
├──────────────────────────────────┤
│                                  │
│  ▼ TODAY                         │
│  ┌────────────────────────────┐  │
│  │  ● Zmieniono kolor tła     │  │  ← current
│  │    2 min temu              │  │
│  ├────────────────────────────┤  │
│  │  ○ Dodano sekcję Hero      │  │  ← can undo
│  │    5 min temu              │  │
│  ├────────────────────────────┤  │
│  │  ○ Przeniesiono Footer     │  │
│  │    12 min temu             │  │
│  └────────────────────────────┘  │
│                                  │
│  ▼ EARLIER TODAY                 │
│  ┌────────────────────────────┐  │
│  │  ○ Dodano stronę Kontakt   │  │
│  │    1 godz. temu            │  │
│  └────────────────────────────┘  │
│                                  │
│  ▼ YESTERDAY                     │
│  ┌────────────────────────────┐  │
│  │  ○ Stworzono sklep         │  │
│  │    2 dni temu              │  │
│  └────────────────────────────┘  │
│                                  │
├──────────────────────────────────┤
│  [🔍 Search history...]          │
│  [📸 Create Snapshot]            │
│  [🔄 Restore this version]       │
└──────────────────────────────────┘
```

### 4.2 Akcje

```
Kliknięcie na entry:
- Podświetla entry
- Pokazuje podgląd (tooltip): co zostało zmienione
- [Restore] — przywróć ten stan
- [Share] — udostępnij link do tego stanu
- [Compare] — porównaj z obecnym stanem (diff view)

Right-click:
- "Copy link to this version"
- "Create branch from here" (future)
- "Tag as milestone"
- "Delete this entry"
```

---

## 5. Snapshoty (Save Points)

```typescript
interface Snapshot {
  id: string;
  label: string;
  description?: string;
  timestamp: number;
  document: BuilderDocument;
  tags: string[];
  isMilestone: boolean;
}

function createSnapshot(doc: BuilderDocument, label: string): Snapshot {
  return {
    id: generateId('snap'),
    label,
    timestamp: Date.now(),
    document: deepClone(doc),
    tags: [],
    isMilestone: false,
  };
}
```

### 5.1 Auto-snapshots

```typescript
// Automatic snapshots
- Co 5 minut (jeśli są zmiany)
- Przed publikacją
- Przed AI akcją
- Przed dodaniem szablonu
- Na żądanie użytkownika (Ctrl+Shift+S)
```

---

## 6. Time Travel

```typescript
// Porównanie dwóch stanów
interface DiffResult {
  added: Change[];
  removed: Change[];
  modified: Change[];
}

function diffDocuments(
  before: BuilderDocument,
  after: BuilderDocument
): DiffResult {
  // Porównaj pages, sections, props, theme
  // Zwróć czytelny dla człowieka diff
}

// Time Travel UI:
┌──────────────────────────────────────────┐
│  TIME TRAVEL                              │
│                                           │
│  ─ Current ────────────────────────────   │
│  │ Zmieniono kolor tła na #7C3AED     │   │
│  └─────────────────────────────────────┘  │
│                      ↑                    │
│  ─ Snapshot 1 ────   │  ─────────────   │
│  │ Strona gotowa  │──│→│ Przywróć     │   │
│  │ do publikacji  │  │  │ ten stan    │   │
│  └────────────────┘  │  └─────────────┘   │
│                      ↓                    │
│  ─ Snapshot 2 ────   │  ─────────────   │
│  │ Z AI generacją │──│→│ Przywróć     │   │
│  └────────────────┘     └─────────────┘   │
└──────────────────────────────────────────┘
```

---

## 7. Wersjonowanie

```typescript
interface DocumentVersion {
  id: string;
  version: number;          // 1, 2, 3...
  label: string;            // "v1.0 - Initial", "v1.1 - Hero update"
  snapshot: Snapshot;
  isPublished: boolean;     // czy ta wersja była publikowana
  publishedUrl?: string;    // URL opublikowanej wersji
  changelog: string;        // lista zmian
}

// Wersja jest tworzona przy:
// - Publikacji
// - Ręcznym snapshot
// - Auto-snapshot (co 5 min)
```

---

## 8. Undo/Redo z kontekstem

### 8.1 Keyboard

```
Ctrl+Z       → undo
Ctrl+Shift+Z → redo
Ctrl+Shift+S → create snapshot
```

### 8.2 Toolbar

```
[⟲ Undo] [⟳ Redo] [📸 Snapshot] [📋 History Panel]
```

### 8.3 Menu

```
Right-click na historii:
- "Undo this change" (cofnij konkretną zmianę)
- "Redo this change" (ponów konkretną zmianę)
- "Skip to this version" (przeskocz do tej wersji)
```

---

## 9. Implementacja

### 9.1 Rozszerzenie istniejącego HistoryStack.ts

```typescript
// packages/builder-core/src/HistoryStack.ts
// Istnieje — rozszerzyć o:
// - jumpTo(index)
// - getSnapshot(id)
// - mergeRecent(count)
// - Entry metadata (commandType, sectionId, pageId)
// - Tagging
```

### 9.2 Nowe pliki

```
src/components/builder/history/
├── HistoryPanel.tsx           — główny panel historii
├── HistoryEntry.tsx           — pojedynczy wpis
├── HistoryTimeline.tsx        — oś czasu
├── SnapshotList.tsx           — lista snapshotów
├── SnapshotModal.tsx          — modal tworzenia snapshotu
├── TimeTravel.tsx             — time travel interface
├── VersionCompare.tsx         — porównanie wersji (diff)
├── AutoSaveIndicator.tsx      — wskaźnik auto-save
└── hooks/
    └── useHistory.ts          — hook do historii
```

---

## 10. Performance

- Snapshoty przechowywane w IndexedDB
- Kompresja snapshotów (JSON → compress)
- Maksymalnie 100 snapshotów na dokument
- Auto-cleanup starych snapshotów ( > 30 dni)
- Snapshoty > 1MB → przechowywane w Blob Storage

