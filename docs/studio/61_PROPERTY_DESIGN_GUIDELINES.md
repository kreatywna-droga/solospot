# Property Design Guidelines — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 61_PROPERTY_DESIGN_GUIDELINES.md  
> **Status:** Standard Process / Architectural Guidelines  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, ADR-VISUAL-001  
>  
> **Proces:** Wytyczne Projektowania Właściwości Buildera

---

## 1. Zasady Ogólne Projektowania Właściwości

Każda właściwość opisująca wygląd, strukturę lub zachowanie komponentu w WEB FACTOR Studio 2.0 musi bezwzględnie przestrzegać poniższych 8 reguł architektonicznych:

### 1. Model Domenowy i Nazewnictwo
* Nazwy właściwości w kodzie Buildera są w formacie `camelCase` (np. `borderRadius`, `overflowX`, `borderWidth`).
* Właściwości muszą jednoznacznie odpowiadać ich standardowym odpowiednikom CSS.

### 2. Niezmienność (Immutability)
* Wszystkie obiekty reprezentujące właściwości są traktowane jako obiekty zamrożone.
* Modyfikacja właściwości odbywa się wyłącznie poprzez tworzenie nowej instancji obiektu stanu (zwykle za pomocą podmieniających czystych funkcji reducerów).

### 3. Wsparcie dla Reaktywności (`ResponsiveValue<T>`)
* Każda właściwość wizualna musi być gotowa do opakowania w typ `ResponsiveValue<T>`:
  ```typescript
  export type ResponsiveValue<T> = {
    desktop: T;
    tablet?: T;
    mobile?: T;
  };
  ```

### 4. 100% Serializowalność do JSON
* Obiekty właściwości nie mogą zawierać funkcji, cyklicznych referencji ani klas z prototypami.
* Stan dokumentu musi dać się w dowolnym momencie zapisać via `JSON.stringify()` i odtworzyć via `JSON.parse()`.

### 5. Strategia Walidacji
* Każdy subsystem dostarcza czystą funkcję walidującą `validateXXProps(props)` zwracającą wynik walidacji oraz czytelne komunikaty błędów.
* Walidacja odrzuca nieznane jednostki oraz niedozwolone wartości numeryczne (np. ujemne wymiary).

### 6. Czyste Mapowanie CSS (`XXToCSS`)
* Transformacja modelu domenowego do obiektu stylów CSS odbywa się przez czyste funkcje nieposiadające efektów ubocznych (Pure Functions).
* Funkcje generują standardowe klucze CSS w formacie `kebab-case` (np. `border-radius`, `overflow-x`).

### 7. Integracja z Silnikiem Runtime
* Zmiana właściwości nie przeładowuje drzewa DOM na Canvasie, lecz natychmiast aplikuje łatkę stylów (Style Patching) bezpośrednio do ramki Iframe.

### 8. Kompatybilność ze Stosem Historii (Undo / Redo)
* Zmiana każdej właściwości wysyłana jest w postaci komendy `UPDATE_PROPS`, co automatycznie rejestruje snapshot dokumentu w `HistoryStack`.
