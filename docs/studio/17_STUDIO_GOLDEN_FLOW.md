# C16.17 — WEB FACTOR Studio Golden Flow

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 17_STUDIO_GOLDEN_FLOW.md  
> **Status:** Draft  
> **Zależności:** Wszystkie dokumenty C16

---

## 1. Cel

Golden Flow to główny przepływ użytkownika przez Studio — od wejścia do publikacji. Każdy krok został zaprojektowany tak, aby był intuicyjny i prowadził użytkownika naturalnie.

---

## 2. Flow Overview

```
1. WEJŚCIE
   Użytkownik klika "Edytuj" w dashboardzie
   ↓
2. LOADING
   Ładowanie dokumentu z API
   Instant skeleton UI
   ↓
3. PIERWSZE SPOJRZENIE
   Canvas z podglądem strony
   Warstwy, komponenty, inspector
   ↓
4. EDYCJA
   Kliknij → edytuj
   Przeciągnij → move
   Panel → zmiana propsów
   ↓
5. PODGLĄD
   Preview mode
   Responsywne widoki
   ↓
6. PUBLIKACJA
   Snapshot
   Deploy na CDN
   Gotowe!
```

---

## 3. Krok 1: Wejście do Studio

### 3.1 Trigger

```
Miejsca wejścia:
- Dashboard → "Edytuj sklep" button
- Mission Control → "Studio" dla tenanta
- Nowy sklep → automatyczne przejście do Studio
- Link bezpośredni: /studio/[storeId]
```

### 3.2 Loading state

```
1. Pokaż od razu shell Studio (layout)
2. Skeleton loading dla paneli
3. Ładowanie dokumentu z API
4. Progress: "Ładowanie sklepu..." → "Przygotowanie edytora..."
5. Gotowe! → płynna animacja pojawienia się canvasu

Całość < 2s
```

---

## 4. Krok 2: Pierwsze spojrzenie

### 4.1 Co widzi użytkownik

```
1. Canvas z podglądem strony (jeśli istnieje)
   lub pusty canvas z komunikatem "Dodaj pierwszą sekcję"
   
2. Lewy sidebar z warstwami (pusta strona = tylko nazwa strony)
   
3. Prawy sidebar (Inspector) — pusty, z komunikatem:
   "Kliknij sekcję, aby edytować właściwości"
   
4. Toolbar z nazwą sklepu, przyciskami Undo/Redo/Save/Publish
   
5. Bottom bar z breakpointami i zoomem
```

### 4.2 Empty state dla nowego sklepu

```
┌──────────────────────────────────────────────────────────────┐
│  Toolbar: [Mój Sklep]                    [Save] [Publish]    │
├──────────┬──────────────────────────────────┬────────────────┤
│ Pages    │                                  │ Inspector      │
│ ── Home  │  ┌──────────────────────────┐   │                │
│          │  │                          │   │  Kliknij       │
│ Layers   │  │   Witaj w Studio!        │   │  sekcję, aby   │
│ ── (puste)│  │                          │   │  edytować      │
│          │  │   Aby rozpocząć:          │   │  właściwości   │
│ Comps    │  │   • Kliknij "Dodaj sekcję"│   │                │
│ ── Hero  │  │   • Przeciągnij z panelu  │   │                │
│ ── CTA   │  │   • Użyj AI: "Stwórz      │   │                │
│ ── ...   │  │     landing page"         │   │                │
│          │  │                          │   │                │
│          │  │   [✨ Stwórz stronę z AI] │   │                │
│          │  │   [📦 Wybierz szablon]   │   │                │
│          │  │   [➕ Dodaj sekcję]       │   │                │
│          │  └──────────────────────────┘   │                │
├──────────┴──────────────────────────────────┴────────────────┤
│  [DESKTOP] [TABLET] [MOBILE]      [Zoom: 100%]              │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Krok 3: Edycja

### 5.1 Scenariusz A: Dodawanie sekcji z panelu

```
1. Kliknij zakładkę "Components" w lewym sidebarze
2. Przeglądaj kategorie (Hero, CTA, Features...)
3. Kliknij "Hero Basic"
4. Sekcja pojawia się na canvasie + w warstwach
5. Inspector pokazuje właściwości Hero
6. Edytuj tytuł, kolor tła, obrazek
7. Canvas odświeża się natychmiast

Czas: ~30 sekund do pierwszej edytowalnej sekcji
```

### 5.2 Scenariusz B: Edycja istniejącej sekcji

```
1. Kliknij na sekcję w canvasie (lub w warstwach)
2. Sekcja podświetlona + overlay z bounding box
3. Inspector pokazuje właściwości z kategoriami
4. Rozwiń "Typography" → zmień font size
5. Rozwiń "Background" → zmień kolor na gradient
6. Canvas odświeża się natychmiast

Czas: < 1s na zmianę właściwości
```

### 5.3 Scenariusz C: Drag & drop

```
1. Najedź na sekcję w warstwach (lub canvasie)
2. Złap za uchwyt drag (6 kropek)
3. Przeciągnij poniżej innej sekcji
4. Niebieska linia pokazuje gdzie wpadnie
5. Puść → sekcja przeniesiona
6. Historia: "Moved Hero section"

Czas: < 2s na reorganizację
```

### 5.4 Scenariusz D: AI asystent

```
1. Kliknij ikonę AI w toolbarze (lub Ctrl+K)
2. Wpisz: "Stwórz landing page dla sklepu z kawą"
3. AI generuje: Hero + Features + Gallery + Footer
4. Kolory: brąz, krem, zieleń (dobrane do kawy)
5. Teksty: "Najlepsza kawa w mieście"
6. Kliknij "Zastosuj" → wszystko dodane do strony

Czas: ~10 sekund na wygenerowanie pełnej strony
```

---

## 6. Krok 4: Podgląd i responsywność

### 6.1 Preview mode

```
1. Kliknij "Preview" w bottom barze (lub Ctrl+Shift+V)
2. Canvas przełącza się w tryb podglądu:
   - Brak overlay'ów (bounding box, handles)
   - Brak siatki
   - Czysta strona jak dla użytkownika
3. Kliknij "Exit Preview" → powrót do edycji
```

### 6.2 Responsywność

```
1. Kliknij "Tablet" w bottom barze
2. Canvas zmienia szerokość na 768px
3. Sprawdź czy layout wygląda dobrze
4. Jeśli nie → kliknij sekcję → Inspector → Responsive
5. Ustaw hide na mobile lub zmień layout
6. Kliknij "Mobile" → sprawdź czy działa

Czas: ~2 minuty na dostosowanie responsywności
```

---

## 7. Krok 5: Publikacja

### 7.1 Przed publikacją

```
1. Auto-snapshot (zapisany)
2. Walidacja:
   - Czy strona ma hero? (warning)
   - Czy są produkty? (info)
   - Czy SEO jest wypełnione? (warning)
3. Podgląd ostatniej wersji
```

### 7.2 Publikacja

```
1. Kliknij "Publish" w toolbarze
2. Modal:
   ┌─────────────────────────────────────────┐
   │  PUBLIKUJ SKLEP                         │
   │                                         │
   │   ✓ Wszystkie strony gotowe (5/5)       │
   │   ✓ Obrazy zoptymalizowane              │
   │   ⚠ Uzupełnij SEO dla strony "Blog"    │
   │                                         │
   │   [● Opublikuj na żywo]                 │
   │   [○ Zapisz jako wersję roboczą]        │
   │                                         │
   │   [Cancel]    [Publikuj]               │
   └─────────────────────────────────────────┘
   
3. Kliknij "Publikuj"
4. Progress: "Kompilacja..." → "Deploy na CDN..." → "Gotowe!"
5. Link do opublikowanej strony
```

---

## 8. Obsługa błędów w flow

### 8.1 Load error

```
Problem: Nie udało się załadować dokumentu
Reakcja:
  - Pokaż error state z komunikatem
  - Przycisk "Spróbuj ponownie"
  - Jeśli trwały błąd → "Utwórz nowy dokument"
```

### 8.2 Save error

```
Problem: Nie udało się zapisać
Reakcja:
  - Auto-retry (3 próby co 5s)
  - Jeśli nadal błąd:
    - Ostrzeżenie: "Nie udało się zapisać"
    - Możliwość pobrania kopii lokalnej
    - Auto-save do localStorage jako backup
```

### 8.3 Publish error

```
Problem: Publikacja nieudana
Reakcja:
  - Szczegółowy komunikat błędu (logi)
  - "Spróbuj ponownie" lub "Skontaktuj się z supportem"
  - Stan dokumentu niezmieniony (bezpieczny)
```

---

## 9. KPI dla Golden Flow

| Etap | Czas (target) | Mierzone |
|------|---------------|----------|
| Wejście → Canvas gotowy | < 2s | Time to Interactive |
| Pierwsza edycja | < 30s | Czas do pierwszej zmiany |
| Dodanie sekcji | < 5s | Od kliknięcia do pojawienia się |
| Zmiana propsa | < 50ms | Od zmiany do preview update |
| Drag & drop | < 100ms | Od złapania do reakcji |
| Preview mode | < 500ms | Przełączenie trybu |
| Publikacja | < 30s | Od kliknięcia do gotowego URL |
| Pełna strona (nowa) | < 5 min | Od 0 do opublikowanej strony |

