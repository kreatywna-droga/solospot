# Performance Budget — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 68_PERFORMANCE_BUDGET.md  
> **Status:** Performance Standard  
> **Zależności:** 15_PERFORMANCE.md, 63_ENGINEERING_METRICS.md  
>  
> **Proces:** Budżet Wydajnościowy i Limity Czasowe

---

## 1. Cel Budżetu Wydajnościowego

WEB FACTOR Studio 2.0 nakłada rygorystyczne limity opóźnień (Latency Budgets), aby zagwarantować natychmiastową reakcję interfejsu (Sub-second Responsiveness) podczas edycji wizualnej. Poniższe kryteria są automatycznie weryfikowane w testach wydajnościowych.

---

## 2. Limity Wydajnościowe (Performance Limits Table)

| Obszar Modułu | Metryka / Opis | Limit Docelowy (Target) | Sposób Pomiaru | Kryterium PASS |
|---------------|----------------|--------------------------|----------------|----------------|
| **Canvas Engine** | Płynność Odświeżania Klatek | **60 FPS** (Frame Time < 16.6ms) | `performance.mark()` w pętli `requestAnimationFrame` | Zero zgubionych klatek (Zero jank) podczas przeciągania. |
| **Runtime Engine** | Inicjalne Ładowanie Podglądu | **< 200 ms** | Performance Audit API / Navigation Timing | Strona Iframe w pełni interaktywna w < 200ms. |
| **Property Update** | Czas reakcji zmiana UI ➔ Iframe | **< 8 ms** | Pomiary czasu od `onChange` w Inspectorze do aplikacji CSS | Opóźnienie wyczuwalne dla oka = 0ms. |
| **Undo / Redo** | Przywrócenie stanu z HistoryStack | **< 10 ms** | Czas wykonania `applySnapshot()` w Reducerze | Natychmiastowa zamiana podglądu bez lagów. |
| **Registry Lookup** | Odpytanie schematu komponentu | **< 1 ms** | Pomiary czasu wywołania `ComponentRegistry.get()` | Natychmiastowy zwrot z pamięci cache (O(1)). |
| **CSS Generation** | Kompilacja arkusza stylów | **< 5 ms** | Pomiary czasu wykonania funkcji `compileDocument()` | Cały plik CSS wygenerowany w < 5ms. |
| **Render Time** | Przeliczenie Bounding Boxa nakładki | **< 4 ms** | Pomiary czasu wykonania `getBoundingClientRect()` sync | Brak opóźnień ramki zaznaczenia za kursorem. |

---

## 3. Procedura Postępowania przy Przekroczeniu Budżetu

1. **Automatyczne Odrzucenie Builda:** Jeśli test wydajnościowy wykaże czas `CSS Generation > 10ms` lub `Property Update > 16ms`, dany Pull Request / Sprint nie przechodzi etapu Architecture Freeze.
2. **Profilowanie Pamięci:** Analiza profili Chrome DevTools w celu wyeliminowania niepotrzebnych re-renderów Reacta.
