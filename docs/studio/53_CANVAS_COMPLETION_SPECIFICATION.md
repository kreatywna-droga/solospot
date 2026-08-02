# Sprint 5C — Canvas Completion Specification

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 53_CANVAS_COMPLETION_SPECIFICATION.md  
> **Status:** Draft — Architecture Specification (Sprint 5C)  
> **Sprint:** 5C — Canvas Completion  
> **Zależności:** 03_CANVAS_ENGINE.md, 04_SELECTION_SYSTEM.md, 05_DRAG_DROP_ENGINE.md, 28_RUNTIME_EXECUTION_MODEL.md, 43_MILESTONE_v2_GOALS.md  
>  
> **Proces:** Faza 1 z 8 — Specification

---

## 1. Cel i Kontekst Sprintu 5C

Niniejszy dokument definiuje oficjalną specyfikację architektoniczną dla pełnego domknięcia modułu **Canvas Engine** w ramach **Sprintu 5C**.

Obszar Canvas stanowi centralny punkt roboczy edytora wizualnego WEB FACTOR Studio. O ile we wczesnych sprincie 4 dostarczono podstawowy podgląd siatki drucianej (wireframe preview), o tyle Sprint 5C realizuje pełną integrację z silnikiem Runtime, dwukierunkową komunikację z Ramką Iframe, precyzyjny silnik zaznaczania (Selection Engine) oraz interaktywne nakładki edycyjne (Overlays).

### 1.1 Cele Główne (Goals)

1. **Zastąpienie tymczasowego Wireframe czystą ramką Iframe Runtime:** Wyrenderowana w Canvasie strona ma być dokładnym odzwierciedleniem tego, co zobaczy użytkownik końcowy w trybie produkcyjnym.
2. **Dwukierunkowy most komunikacyjny (Memory/PostMessage Channel):** Bezprzeładowaniowy podgląd zmian z opóźnieniem < 16ms (60 FPS).
3. **Precyzyjny silnik zaznaczania (Selection & Hover System):** Zaznaczanie dowolnej sekcji lub komponentu poprzez bezpośrednie kliknięcie na Canvasie.
4. **Wizualne nakładki (Overlays & Bounding Box):** Rysowanie ramki zaznaczenia, uchwytów zmiany rozmiaru (Resize Handles) oraz pasków narzędzi nad zaznaczonym elementem.

---

## 2. Zakres MVP (Sprint 5C Scope)

### 2.1 Co wchodzi w zakres MVP Sprintu 5C

| # | Komponent / Funkcja | Opis Techniczny |
|---|---------------------|-----------------|
| 1 | **Iframe Runtime Bridge** | Izolowane środowisko Iframe renderujące stronę w trybie `EDIT_MODE`. Komunikacja via `Window.postMessage` / `MemoryChannel`. |
| 2 | **Viewport System** | Płynny przełącznik widoków: Desktop (1280px+), Tablet (768px-1023px), Mobile (375px-767px) + Custom Drag-Resize Viewport. |
| 3 | **Selection Engine 2.0** | Przechwytywanie zdarzeń `pointerdown` wewnątrz Iframe, wyliczanie Bounding Box i wysyłanie `CANVAS_SELECT_NODE` do Reducera. |
| 4 | **Hover System** | Podświetlanie obramowania elementu po najechaniu myszą wraz z etykietą typu komponentu (np. `HeroSection`, `ProductGrid`). |
| 5 | **Selection Overlay & Toolbar** | Ramka aktywnego elementu nakładana na Canvas z przyciskami szybkiej akcji: Usuń, Duplikuj, Przesuń w górę/dół, Nazwa węzła. |
| 6 | **Resize Handles (Wymiary)** | Uchwyty edycji szerokości/wysokości na krawędziach i narożnikach zaznaczenia. |

### 2.2 Co NIE wchodzi w zakres MVP Sprintu 5C (Future Releases)

| Funkcja | Powód wykluczenia z MVP | Planowany etap |
|---------|--------------------------|----------------|
| Rotacja swobodna 360° (Rotation Handle) | Złożoność matematyczna transformacji CSS; rzadki przypadek w layoutach webowych | Faza Interactions / Advanced Canvas |
| Wielokrotne zaznaczenie (Multi-Selection) | Wymaga skomplikowanego kontenera grupującego w `CanvasState` | Sprint 9 (Multi-Selection) |
| Bezpośrednie przeciąganie wewnątrz Iframe z płynnym reflow | Wymaga dedykowanego silnika Smart Guides | Sprint 6 (Smart Guides & Snap) |

---

## 3. Architektura Integracji z Runtime (Runtime Integration)

Silnik Canvas operuje na zasadzie **Ścisłego Rozdzielenia Kontekstów (Context Isolation)**:

```
┌────────────────────────────────────────────────────────────────────────┐
│  PARENT APPLICATION (Studio Editor Window)                             │
│  ┌─────────────────────────┐         ┌──────────────────────────────┐  │
│  │ BuilderStore / Reducer  │         │  Inspector / Left Sidebar    │  │
│  └────────────┬────────────┘         └──────────────▲───────────────┘  │
│               │ Dispatch Command                    │ Props Update     │
│               ▼                                     │                  │
│  ┌─────────────────────────┐         ┌──────────────┴───────────────┐  │
│  │ CanvasState / Overlays  ├─────────►  SelectionOverlay (React UI) │  │
│  └────────────┬────────────┘         └──────────────────────────────┘  │
│               │ PostMessage / State Sync                               │
├───────────────┼────────────────────────────────────────────────────────┤
│               ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ IFRAME RUNTIME (Isolated Document Window)                        │  │
│  │                                                                  │  │
│  │  [Section 1: Navbar] ➔ EventListener(click)                      │  │
│  │  [Section 2: Hero]   ➔ EventListener(click) ➔ Selected Node      │  │
│  │  [Section 3: Grid]   ➔ Dynamic Style Injection (CSS)             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Magistrala Zdarzeń (Event Bus):** Komunikaty `DOCUMENT_UPDATED`, `NODE_SELECTED`, `NODE_HOVERED` oraz `RESIZE_NODE` przesyłane są w postaci strukturyzowanych obiektów JSON z podpisem bezpieczeństwa.
2. **Dynamiczna Iniekcja CSS:** Po modyfikacji właściwości w Inspectorze (np. `Flex`, `Grid`, `Overflow`, `Border`, `Radius`), Canvas przesyła zmienione arkusze stylów bezpośrednio do ramki Iframe, unikając pełnej przeładowania drzewa DOM.

---

## 4. Kryteria Akceptacji (Acceptance Criteria)

* [ ] Wyeliminowanie widoku zastępczego (wireframe) na rzecz rzeczywistego renderu Iframe.
* [ ] Zapewnienie stałego opóźnienia odświeżania podglądu poniżej 16ms (60 FPS).
* [ ] Kliknięcie w dowolny element na stronie Iframe powoduje natychmiastowe podświetlenie i uaktualnienie danych w Inspectorze.
* [ ] Zmiana rozmiaru viewportu (Desktop/Tablet/Mobile) przelicza wymiary i dopasowuje nakładkę zaznaczenia.
* [ ] 100% zachowanie izolacji — praca nad Canvasem nie wpływa na kod i komponenty aplikacji produkcyjnej.
