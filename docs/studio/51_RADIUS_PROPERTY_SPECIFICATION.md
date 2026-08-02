# Sprint 5B.4 — Radius Property Specification

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 51_RADIUS_PROPERTY_SPECIFICATION.md  
> **Status:** Draft — Architecture Proposal (Sprint 5B.4)  
> **Sprint:** 5B.4 — Radius Engine  
> **Zależności:** 31_LAYOUT_PROPERTY_SPECIFICATION.md, 44_OVERFLOW_PROPERTY_SPECIFICATION.md, ADR-VISUAL-001, 36_STUDIO_ENGINEERING_PROCESS.md  
>  
> **Proces:** Faza 1 z 8 — Specification

---

## 1. Cel Subsystemu

Niniejszy dokument definiuje specyfikację architektoniczną i domenową dla subsystemu **Radius** — modułu odpowiedzialnego za modelowanie, walidację, edycję wizualną oraz mapowanie CSS właściwości zaokrąglenia narożników (`border-radius`).

Radius jest kluczowym subsystemem warstwy **Visual Styling**, stanowiącym bezpośrednie uzupełnienie dla subsystemu **Border** (Sprint 5B.3). 

### 1.1 Cel Sprintu 5B.4

> **Zapewnić jednoznaczny, bezkolizyjny model danych oraz specyfikację UX dla edycji zaokrągleń narożników w WEB FACTOR Studio.**

W szczególności:
1. Sformułować spójny model domenowy dla jedno-wartościowego zaokrąglenia (Shorthand: wszystkie narożniki równe) oraz niezależnych promieni dla 4 narożników (`topLeft`, `topRight`, `bottomRight`, `bottomLeft`).
2. Określić reguły walidacji jednostek (`px`, `%`, `rem`, `em`, `vh`, `vw`) oraz zapobiegać niepoprawnym wartościom ujemnym.
3. Zdefiniować czystą funkcję transformacji modelu do składni CSS.
4. Określić założenia interfejsu użytkownika dla Inspectora (Visual ➔ Border & Radius).

---

## 2. Zakres MVP

### 2.1 Właściwości objęte zakresem MVP

| # | Właściwość (Builder Prop) | Odpowiednik CSS | Typ danych | Zakres / Dopuszczalne wartości |
|---|---------------------------|-----------------|------------|--------------------------------|
| 1 | `borderRadius` | `border-radius` | `RadiusValue` | Wartość numeryczna z jednostką (np. `8px`, `50%`, `1rem`) lub Shorthand dla 4 narożników. |
| 2 | `borderTopLeftRadius` | `border-top-left-radius` | `RadiusCornerValue` | Promień dla lewego górnego narożnika. |
| 3 | `borderTopRightRadius` | `border-top-right-radius` | `RadiusCornerValue` | Promień dla prawego górnego narożnika. |
| 4 | `borderBottomRightRadius` | `border-bottom-right-radius` | `RadiusCornerValue` | Promień dla prawego dolnego narożnika. |
| 5 | `borderBottomLeftRadius` | `border-bottom-left-radius` | `RadiusCornerValue` | Promień dla lewego dolnego narożnika. |

### 2.2 Co NIE wchodzi w zakres MVP (Future Extensions)

| Funkcja / Właściwość | Powód wykluczenia z MVP | Planowany etap |
|----------------------|--------------------------|----------------|
| Narożniki eliptyczne (`rx / ry` - np. `10px / 20px`) | Skomplikowany UX w UI Inspectora, rzadki przypadek użycia | Faza Visual Advanced |
| Logiczne właściwości CSS (`border-start-start-radius` itp.) | Wymaga pełnego silnika LTR/RTL w Canvasie | Faza Internationalization |
| Dynamiczne przeliczanie jednostek zależne od rozmiaru rodzica | Wymaga silnika Canvas Completion (Sprint 5C) | Sprint 5C |
| Animowane przełamanie promienia przy hoverzie | Należy do subsystemu Animation/Interactions | Faza Interactions |

---

## 3. Domain Model Requirements (Wymagania Modelu Domenowego)

Model domenowy dla `Radius` musi spełniać kryteria architektoniczne WEB FACTOR Studio:

1. **Niezmienność (Immutability):** Wszystkie obiekty reprezentujące promienie są zamrożone i modyfikowalne wyłącznie poprzez czyste transformacje (Command Pattern).
2. **Serializowalność:** Model musi dać się w 100% zserializować do JSON bez strat informacji oraz bez cyklicznych referencji.
3. **Responsywność (ResponsiveValue<T>):** Każda właściwość promienia musi być w stanie zostać opakowana w strukturę reaktywności dla breakpointów (Desktop, Tablet, Mobile).
4. **Struktura rozłączna (Shorthand vs Individual):**
   * Gdy zdefiniowany jest `borderRadius` (jako pojedyncza wartość), odnosi się on jednolicie do wszystkich 4 narożników.
   * Gdy włączony jest tryb szczegółowy, wartości `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomRightRadius`, `borderBottomLeftRadius` nadpisują lub definiują konkretne promienie.

---

## 4. Inspector UX Specification

W strukturze paneli Studio 2.0 (wg `07_INSPECTOR.md` oraz `ADR-VISUAL-001`), ustawienia promienia znajdują się w sekcji **Visual ➔ Layout & Style ➔ Border & Radius**.

### 4.1 Wygląd i Tryby Pracy

1. **Tryb Jednolity (Default / Compact Mode):**
   * Pojedyncze pole numeryczne z wyborem jednostki (`px`, `%`, `rem`, itp.).
   * Ikona wycinka koła / narożnika sygnalizująca `Border Radius`.
   * Przycisk rozwiniecia ("Unlink corners" / ikona 4 narożników).

2. **Tryb Rozwinięty (Individual Corners Mode):**
   * Kliknięcie przycisku "Unlink" rozwija siatkę 2x2 z 4 polami wartości:
     * Lewy Górny (TL) | Prawy Górny (TR)
     * Lewy Dolny (BL) | Prawy Dolny (BR)
   * Zmiana wartości w jednym z pól aktualizuje odpowiednio pojedynczy narożnik w dokumencie.

---

## 5. CSS Mapping Requirements

Czysta funkcja `radiusToCSS(props: RadiusProps): Record<string, string>` musi realizować następujące odwzorowanie:

1. Jeśli zdefiniowane są indywidualne narożniki:
   * Wygeneruj `border-top-left-radius`, `border-top-right-radius`, `border-bottom-right-radius`, `border-bottom-left-radius`.
   * Jeśli wszystkie 4 wartości indywidualne są identyczne, funkcja może zoptymalizować wyjście do zwięzłej postaci `border-radius: X`.
2. Jeśli zdefiniowany jest wyłącznie `borderRadius`:
   * Wygeneruj `border-radius: <wartość><jednostka>`.
3. Dla wartości równej `0` generowany jest zapis `0px` lub `0` (optymalny z punktu widzenia CSS).

---

## 6. Validation Rules (Zasady Walidacji)

1. **Poprawność Jednostek:** Dopuszczalne jednostki to: `px`, `%`, `rem`, `em`, `vh`, `vw`.
2. **Zakaz Wartości Ujemnych:** Wartości `< 0` są niedopuszczalne w specyfikacji CSS. Walidator odrzuca próbę wprowadzenia liczby ujemnej i zwraca błąd walidacji lub przycina wartość do `0`.
3. **Puste Wartości:** Brak wartości oznacza dziedziczenie lub domyślny promień przeglądarki (`0`).

---

## 7. Runtime Integration

1. **Kompilacja Dokumentu:** Modyfikacja właściwości Radius generuje zaktualizowane style dla danego węzła sekcji lub komponentu.
2. **Bezprzeładowaniowy Podgląd:** Canvas nasłuchuje zdarzeń `UPDATE_PROPS` i natychmiast aplikuje zmienione właściwości CSS do elementu DOM w iframe podglądu.

---

## 8. Acceptance Criteria (Kryteria Akceptacji Sprintu 5B.4)

* [ ] Specyfikacja domenowa oraz wytyczne komend są formalnie zamrożone.
* [ ] Funkcja `radiusToCSS()` jest opisana pod kątem skrajnych przypadków (np. mieszane jednostki, wartości 0).
* [ ] Zdefiniowano zasady walidacji dla trybu ujednoliconego oraz trybu 4 narożników.
* [ ] Brak jakichkolwiek kolizji z kodem subsystemu Border (Sprint 5B.3).
