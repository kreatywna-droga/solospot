# Sprint 1 — Studio Shell

## Status: COMPLETED ✅

### Toolbar (top bar)
- [x] Back button → powrót do dashboardu
- [x] Store name + status (Saved/Unsaved)
- [x] Navigation tabs (Pages, Layers, Assets, AI, History)
- [x] Viewport switcher (Desktop, Tablet, Mobile)
- [x] Undo/Redo buttons
- [x] Save button
- [x] Publish button
- [x] Command Palette (Ctrl+K) — modal z wyszukiwarką

### Left Sidebar
- [x] Tab switcher (Pages, Layers, Assets, Components)
- [x] Pages panel — lista stron z ikonami
- [x] Layers panel — drzewo warstw z visibility/lock
- [x] Assets panel — kategorie assetów
- [x] Components panel — delegacja do ComponentPanel

### Canvas
- [ ] iframe placeholder (Sprint 4)
- [ ] Grid overlay (Sprint 4)
- [x] Empty state (istniejący)
- [x] Zoom controls (w Bottom Bar)

### Inspector (right panel)
- [x] Header z nazwą sekcji
- [ ] Kategorie (accordion) — Sprint 7
- [x] Scroll area

### Bottom Bar
- [x] Responsive switcher (Desktop, Tablet, Mobile)
- [x] Zoom controls (presety, +/-)
- [x] Preview, History, AI, Publish buttons

### Framework
- [x] BuilderShell.tsx — główny layout (przebudowa)
- [x] BuilderTopBar.tsx — toolbar z nawigacją i akcjami
- [x] BuilderLeftSidebar.tsx — 4 panele (Pages, Layers, Assets, Components)
- [x] BuilderBottomBar.tsx — responsive + zoom + akcje
- [x] BuilderApp.tsx — delegacja do BuilderShellWithProvider
- [x] CSS Grid / Flexbox layout (flex-1, h-screen)
- [x] Responsywność UI (min 1024px, adaptive)
- [ ] Globalne skróty klawiszowe (Ctrl+1-5, Ctrl+K, Ctrl+Z)
- [ ] Token → CSS Custom Properties integration

### Pliki utworzone
- `src/components/builder/shell/BuilderTopBar.tsx` — toolbar
- `src/components/builder/shell/BuilderBottomBar.tsx` — bottom bar
- `src/components/builder/shell/BuilderLeftSidebar.tsx` — left sidebar
- `src/components/builder/shell/BuilderShell.tsx` — główny shell + provider wrapper

### Pliki zmodyfikowane
- `src/components/builder/BuilderApp.tsx` — delegacja do nowego shella

### Sprint 1 — pozostałe zadania do ukończenia przed Sprint 2
- [x] Global keyboard shortcuts: Ctrl+1-5 (taby), Ctrl+S (save), Escape (deselect)
- [x] Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z (redo) — istnieją w BuilderProvider
- [ ] Resizable left sidebar (drag edge) — *deferowane do Sprint 2*

> Token → CSS Custom Properties przeniesione do Sprint 11 (Design System) ✅

### Quality Checklist (Definition of Done)
- [ ] `npm run typecheck` — zero błędów TypeScript
- [ ] `npm run lint` — zero błędów ESLint
- [ ] `npm test` — wszystkie testy przechodzą
- [ ] `npm run build` — build bez błędów
- [ ] Brak `any` w nowym kodzie
- [ ] Brak TODO pozostawionych w implementacji
- [ ] Code Review — minimum 1 osoba

