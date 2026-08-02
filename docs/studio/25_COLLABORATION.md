# C16.25 — WEB FACTOR Studio Collaboration

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 25_COLLABORATION.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md (Command Pattern jest kluczowy)

---

## 1. Cel

Collaboration umożliwia wielu użytkownikom jednoczesną edycję tej samej strony — dokładnie jak w Figmie, Google Docs czy Notion.

**Kluczowa zaleta:** Dzięki Command Pattern (wszystkie akcje to BuilderCommand), dodanie współpracy nie wymaga przebudowy architektury. Wystarczy broadcastować komendy przez WebSocket.

---

## 2. Architektura

```
┌────────────────────────────────────────────────────┐
│                   WebSocket Server                   │
│                      (collaboration)                 │
├────────────────────────────────────────────────────┤
│        ↑ ↓ broadcast BuilderCommand[]               │
├──────────┬──────────┬──────────┬───────────────────┤
│ Marcin   │ Anna     │ Piotr    │ ...                │
│ Studio   │ Studio   │ Studio   │                    │
│ Client 1 │ Client 2 │ Client 3 │                    │
└──────────┴──────────┴──────────┴───────────────────┘
```

### 2.1 Przepływ

```
Marcin: dispatch(UPDATE_PROPS, { hero.title: "Witaj!" })
    ↓
local → applyCommandToDocument() → update local state
    ↓
WebSocket → broadcast { command, userId, timestamp }
    ↓
Anna: odbiera komendę → applyCommandToDocument() → update
Piotr: odbiera komendę → applyCommandToDocument() → update
```

### 2.2 Command Pattern — klucz do współpracy

```typescript
// Każda komenda jest:
// 1. Serializable — JSON, może iść przez WebSocket
// 2. Deterministic — ten sam command na tym samym doc = ten sam wynik
// 3. Idempotent — można zastosować wielokrotnie (z guardem na wersję)

interface RemoteCommand {
  command: BuilderCommand;
  userId: string;
  userName: string;
  timestamp: number;
  version: number;          // wersja dokumentu
  correlationId: string;    // do potwierdzenia
}
```

---

## 3. Conflict Resolution

### 3.1 Last Writer Wins (LWW)

```typescript
// Dla prostych propsów: ostatnia zmiana wygrywa
// Każda komenda ma timestamp + version

function resolveConflict(
  local: BuilderDocument,
  remote: RemoteCommand
): BuilderDocument {
  if (remote.version >= local.version) {
    // Remote jest nowszy → apply
    return applyCommandToDocument(local, remote.command);
  }
  // Lokalny jest nowszy → sprawdź czy to ten sam field
  // Jeśli tak → LWW (remote wygrywa, bo ma wyższy priorytet)
  return applyCommandToDocument(local, remote.command);
}
```

### 3.2 Field-level locking (opcjonalnie)

```typescript
// Gdy Marcin edytuje hero.title, to pole jest "zablokowane"
// Anna widzi: "Marcin edytuje..." z kolorem Marcina

interface LockInfo {
  sectionId: string;
  field: string;
  userId: string;
  userName: string;
  lockedAt: number;
}

// Auto-unlock po 30s braku aktywności
```

---

## 4. Cursor Presence

### 4.1 Aktywni użytkownicy

```
Prawy górny róg:

[● Marcin ● Anna ● Piotr]  → klik → lista: 
                               Marcin edytuje Hero
                               Anna edytuje Footer
                               Piotr przegląda
```

### 4.2 Kursor w canvasie

```
Canvas:

┌─────────────────────────────────────┐
│  Hero                               │
│  ┌─────────────────────────────┐    │
│  │ Witaj w sklepie!           │    │
│  │                    ── Marcin│    │ ← kursor Marcina
│  └─────────────────────────────┘    │
│                                      │
│  Footer                             │
│  ┌─────────────────────────────┐    │
│  │ © 2025             ── Anna │    │ ← kursor Anny
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘

Każdy użytkownik ma:
- Kolor (predefiniowany lub wybrany)
- Nazwę (nad lub obok kursora)
- Zaznaczoną sekcję (ramka w kolorze użytkownika)
```

### 4.3 Warstwy

```
LayerTree:

Pages
└── Home
    ├── Hero         ← Marcin edytuje (fioletowy)
    ├── Features
    ├── Gallery      ← Anna edytuje (zielony)
    ├── Footer
    └── Contact
```

---

## 5. Presence API

```typescript
interface PresenceState {
  users: CollaborativeUser[];
  selections: CollaborativeSelection[];
  cursors: CollaborativeCursor[];
  locks: LockInfo[];
}

interface CollaborativeUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  isActive: boolean;
  lastSeen: number;
  currentSectionId?: string;
}

interface CollaborativeSelection {
  userId: string;
  sectionId: string;
  pageId: string;
}

interface CollaborativeCursor {
  userId: string;
  x: number;
  y: number;
  targetSectionId?: string;
}
```

---

## 6. WebSocket Messages

```typescript
// Client → Server:
{ type: 'COMMAND', command: BuilderCommand, version: number }
{ type: 'CURSOR_MOVE', x: number, y: number }
{ type: 'SELECTION_CHANGE', sectionId: string, pageId: string }
{ type: 'LOCK_REQUEST', sectionId: string, field: string }
{ type: 'LOCK_RELEASE', sectionId: string, field: string }
{ type: 'PING' }

// Server → Client:
{ type: 'COMMAND', command: BuilderCommand, userId: string, userName: string }
{ type: 'CURSOR_MOVE', userId: string, x: number, y: number }
{ type: 'SELECTION_CHANGE', userId: string, sectionId: string }
{ type: 'LOCK_GRANTED', sectionId: string, field: string, userId: string }
{ type: 'LOCK_RELEASED', sectionId: string, field: string }
{ type: 'USER_JOINED', user: CollaborativeUser }
{ type: 'USER_LEFT', userId: string }
{ type: 'STATE_SYNC', document: BuilderDocument, users: CollaborativeUser[] }
{ type: 'PONG' }
```

---

## 7. UI

### 7.1 Active Users

```
┌──────────────────────────────────┐
│  [● Marcin] [● Anna] [● Piotr]  │
│  [+ Invite]                      │
│                                  │
│  Marcin  ● Hero (edytuje)       │
│  Anna    ● Footer (edytuje)     │
│  Piotr   ● Gallery (przegląda)  │
└──────────────────────────────────┘
```

### 7.2 Invite Modal

```
┌──────────────────────────────────────────┐
│  INVITE TO EDIT                            │
│                                            │
│  [Enter email...]                    [Send]│
│                                            │
│  Link: https://studio.webfactor.com/...    │
│  [Copy link] [Copy embed]                  │
│                                            │
│  Permissions:                              │
│  ○ Can edit                                │
│  ○ Can comment                             │
│  ○ Can view                                │
│                                            │
│  Recently invited:                         │
│  ● anna@example.com — Can edit            │
│  ● piotr@example.com — Can view           │
└──────────────────────────────────────────┘
```

---

## 8. Historia dla collaboration

```typescript
// Każda zmiana ma autora
interface HistoryEntry {
  // ... existing fields
  userId: string;
  userName: string;
}

// Można filtrować: "pokaż tylko zmiany Marcina"
// Można cofnąć: "Cofnij ostatnią zmianę Anny"
// Można przywrócić: "Przywróć wersję zanim Piotr edytował"
```

---

## 9. Pliki

```
src/components/builder/collaboration/
├── CollaborationProvider.tsx   — provider WebSocket + presence
├── ActiveUsers.tsx             — lista aktywnych użytkowników
├── UserCursor.tsx              — kursor użytkownika na canvasie
├── UserSelection.tsx           — zaznaczenie innego użytkownika
├── LockIndicator.tsx           — wskaźnik blokady pola
├── InviteModal.tsx             — modal zaproszenia
└── hooks/
    ├── useCollaboration.ts     — hook do współpracy
    ├── usePresence.ts          — hook do presence
    └── useRemoteCommands.ts    — hook do zdalnych komend

server/
├── collaboration-server.ts     — WebSocket server
└── collaboration-store.ts      — stan serwera
```

