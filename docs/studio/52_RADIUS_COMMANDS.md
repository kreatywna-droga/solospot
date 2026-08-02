# Sprint 5B.4 — Radius Commands & Architecture Proposal

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 52_RADIUS_COMMANDS.md  
> **Status:** Draft — Architecture Proposal (Sprint 5B.4)  
> **Sprint:** 5B.4 — Radius Engine  
> **Zależności:** 51_RADIUS_PROPERTY_SPECIFICATION.md, 33_LAYOUT_COMMANDS.md, 45_OVERFLOW_COMMANDS.md, ADR-VISUAL-001  
>  
> **Proces:** Faza 2 z 8 — Contracts & Architecture Proposal

---

## 1. Cel i Przegląd Architektury

Niniejszy dokument definiuje specyfikację szyny komend (Command Contracts), projekty struktur modeli domenowych, reguły transformacji CSS, zasady walidacji oraz strategię testów dla subsystemu **Radius Engine**.

Zgodnie z zasadą **izolacji zadań (Agent 1 vs Agent 2)**, niniejsze opracowanie stanowi czystą propozycję architektoniczną i specyfikację projektową. **Nie zawiera żadnych modyfikacji w kodzie produkcyjnym** i nie wchodzi w kolizję ze równolegle prowadzanym Sprintem 5B.3 (Border).

---

## 2. Mechanizm Komend (Command Contracts)

### 2.1 Wykorzystanie `UPDATE_PROPS` jako uniwersalnego mechanizmu

Zgodnie z ustaleniami z **DR-CMD-001** oraz wzorcem zastosowanym przy Overflow (Sprint 5B.2), w Sprincie 5B.4 zmiany zaokrągleń narożników realizowane są za pomocą istniejącej, generycznej komendy `UPDATE_PROPS`.

```typescript
// Przykład użycia komendy UPDATE_PROPS dla promienia jednolitego
dispatch({
  type: 'UPDATE_PROPS',
  pageId: 'page_home',
  sectionId: 'sec_hero',
  props: {
    borderRadius: '12px',
  },
});

// Przykład użycia komendy UPDATE_PROPS dla indywidualnych narożników
dispatch({
  type: 'UPDATE_PROPS',
  pageId: 'page_home',
  sectionId: 'sec_hero',
  props: {
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    borderBottomRightRadius: '0px',
    borderBottomLeftRadius: '0px',
  },
});
```

### 2.2 Uzasadnienie braku komendy `SET_RADIUS` w MVP

1. **Atomiczność:** Komenda `UPDATE_PROPS` pozwala w jednej tranzakcji zaktualizować zarówno promień jednolicie, jak i zresetować/zmienić wartości pojedynczych narożników.
2. **Spójność z Undo/Redo:** Cała zmiana zapisywana jest jako pojedynczy krok na stosie historii `HistoryStack`.
3. **Przyszłe dedykowane komendy (Dedykowane w Faze Advanced):**
   W przyszłych wersjach edytora (np. przy zaawansowanym drag-and-drop narożników bezpośrednio na Canvasie) przewiduje się dedykowaną komendę `SET_CORNER_RADIUS` przekazującą identyfikator konkretnego narożnika oraz wyliczony kąt/promień.

---

## 3. Projekt Modelu Domenowego (Domain Design Proposal)

Proponowane interfejsy domenowe do przyszłego umieszczenia w strukturze typów Studio:

```typescript
/**
 * Dopuszczalne jednostki długości dla promienia narożnika
 */
export type RadiusUnit = 'px' | '%' | 'rem' | 'em' | 'vh' | 'vw';

/**
 * Wartość promienia dla konkretnego narożnika lub wartości ogólnej
 */
export interface RadiusValue {
  value: number;
  unit: RadiusUnit;
}

/**
 * Zbiór właściwości promienia dla elementu w BuilderDocument
 */
export interface RadiusProps {
  borderRadius?: string;              // Shorthand (np. '8px' lub '50%')
  borderTopLeftRadius?: string;      // Lewy górny narożnik
  borderTopRightRadius?: string;     // Prawy górny narożnik
  borderBottomRightRadius?: string;  // Prawy dolny narożnik
  borderBottomLeftRadius?: string;   // Lewy dolny narożnik
}
```

### Uzasadnienie projektu:
* **String jako elastyczna reprezentacja wartości:** Użycie reprezentacji tekstowej (np. `'12px'`) zapewnia natychmiastową zgodność z parserem CSS oraz upraszcza serializację w dokumenie JSON.
* **Rozdzielność Shorthand i Narożników Niezależnych:** Umożliwia prostą detekcję w UI Inspectora, czy użytkownik operuje naartością zbiorczej, czy dostosowuje wybrane narożniki.

---

## 4. Projekt Mapowania CSS (`radiusToCSS`)

Propozycja czystej funkcji pomocniczej odpowiedzialnej za transformację modelu domenowego do obiektu stylów CSS:

```typescript
/**
 * Transformuje właściwości RadiusProps do obiektu rekordów CSS.
 * Czysta funkcja bez efektów ubocznych.
 */
export function radiusToCSS(props: RadiusProps): Record<string, string> {
  const styles: Record<string, string> = {};

  // 1. Sprawdzenie narożników indywidualnych
  const hasIndividual =
    props.borderTopLeftRadius !== undefined ||
    props.borderTopRightRadius !== undefined ||
    props.borderBottomRightRadius !== undefined ||
    props.borderBottomLeftRadius !== undefined;

  if (hasIndividual) {
    if (props.borderTopLeftRadius) styles['border-top-left-radius'] = props.borderTopLeftRadius;
    if (props.borderTopRightRadius) styles['border-top-right-radius'] = props.borderTopRightRadius;
    if (props.borderBottomRightRadius) styles['border-bottom-right-radius'] = props.borderBottomRightRadius;
    if (props.borderBottomLeftRadius) styles['border-bottom-left-radius'] = props.borderBottomLeftRadius;
    return styles;
  }

  // 2. Fallback do zbiorczego borderRadius
  if (props.borderRadius !== undefined) {
    styles['border-radius'] = props.borderRadius;
  }

  return styles;
}
```

---

## 5. Projekt UX Inspectora (Inspector Section: Visual ➔ Border & Radius)

W wypracowanym układzie Inspectora (wzorce z `FlexField.tsx`, `GridField.tsx` oraz `OverflowField.tsx`), sekcja Radius proponowana jest w następującym układzie:

```
┌──────────────────────────────────────────────────────────┐
│  BORDEUR & RADIUS                                        │
├──────────────────────────────────────────────────────────┤
│  Corner Radius                                           │
│  [  8px  ]   [🔒 Link All / 🔓 Unlink ]                  │
├──────────────────────────────────────────────────────────┤
│  (Gdy Unlink jest aktywny — siatka 4 narożników):         │
│  ┌────────────────────┬────────────────────┐             │
│  │ TL: [ 8px ]        │ TR: [ 8px ]        │             │
│  ├────────────────────┼────────────────────┤             │
│  │ BL: [ 0px ]        │ BR: [ 0px ]        │             │
│  └────────────────────┴────────────────────┘             │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Strategia Walidacji (Validation Strategy)

Przewidywana funkcja `validateRadiusProps(props: RadiusProps): ValidationResult`:

1. **Weryfikacja składniowa i wartości ujemnych:**
   * Wartość typu `-5px` jest **niepoprawna**. W przypadku podania wartości ujemnej, walidator odrzuca próbę zmiany i zgłasza komunikaty: `"Radius value cannot be negative"`.
2. **Weryfikacja jednostek:**
   * Akceptowalne są wyłącznie znane jednostki CSS (`px`, `%`, `rem`, `em`, `vh`, `vw`).
   * Wartość bezpodstawna tekstowo (np. `'abc'`) zostaje odrzucona.
3. **Walidacja w czasie rzeczywistym:**
   * Pole tekstowe w UI Inspectora przy wpisywaniu błędu podświetla obramowanie na czerwono i blokuje wysłanie niepoprawnej komendy do `dispatch`.

---

## 7. Plan i Strategia Testów (Test Strategy Proposal)

Gdy rozpocznie się faza implementacji (Sprint 5B.4), zestaw testów powinien obejmować:

1. **Unit Tests (`radius.test.ts`):**
   * Test funkcji `radiusToCSS()` dla pojedynczego `borderRadius`.
   * Test funkcji `radiusToCSS()` dla 4 niezależnych narożników.
   * Test funkcji `validateRadiusProps()` dla wartości poprawnych oraz krawędziowych (np. `0px`, `-10px`, `100%`, nieznana jednostka).
2. **Integration Tests (`BuilderStore` + `HistoryStack`):**
   * Weryfikacja wysłania komendy `UPDATE_PROPS` ze zmianą promienia.
   * Weryfikacja prawidłowości operacji `Undo` oraz `Redo` (przywracanie poprzedniego promienia).
3. **Inspector UI Tests (`RadiusField.test.tsx`):**
   * Wyrenderowanie pola dla wartości domyślnej.
   * Przełączenie trybu z `Linked` na `Unlinked`.
   * Wpisanie nowej wartości i weryfikacja czy wywoływana jest funkcja `dispatch`.

---

## 8. Uwagi Architektoniczne & Zgodność z Zasadami Projektu

* **Zgodność z ADR-VISUAL-001:** Wszystkie właściwości promienia zapisywane są bezpośrednio w strukturze props sekcji/komponentu.
* **Zgodność z `36_STUDIO_ENGINEERING_PROCESS.md`:** Przestrzegano bezwzględnie zasady podziału na 8 faz. Niniejsza dokumentacja zamyka Fazy 1 (Specification) oraz 2 (Contracts & Architecture Proposal).
* **Zgodność z `43_MILESTONE_v2_GOALS.md`:** Projekt gwarantuje natychmiastowe przeliczanie styli do CSS i bezprzeładowaniowy podgląd w Canvasie po zmianie wartości promienia.
* **Brak kolizji z pracami Agenta 1:** Dokumenty nie ingerują w `BorderTypes.ts`, `BorderField.tsx`, `propertyFieldRegistry.tsx` ani żaden inny plik związany z równoległym Sprintem 5B.3.
