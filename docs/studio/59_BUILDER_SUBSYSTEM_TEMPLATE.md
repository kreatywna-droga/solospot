# Sprint Subsystem Template — [Nazwa Subsystemu]

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 59_BUILDER_SUBSYSTEM_TEMPLATE.md  
> **Status:** Template / Pattern  
> **Sprint:** [Numer Sprintu, np. 5B.5]  
> **Zależności:** 36_STUDIO_ENGINEERING_PROCESS.md, 61_PROPERTY_DESIGN_GUIDELINES.md, ADR-VISUAL-001  
>  
> **Proces:** Szablon Wzorcowy 8-Fazowego Procesu Inżynieryjnego

---

## 1. Cel i Kontekst

Krótkie (1-2 akapity) uzasadnienie po co powstaje dany subsystem oraz jaką funkcję pełni w WEB FACTOR Studio 2.0.

---

## 2. Zakres MVP (Scope)

### 2.1 Właściwości objęte zakresem MVP

| # | Właściwość (Builder Prop) | Odpowiednik CSS | Typ danych | Dopuszczalne wartości |
|---|---------------------------|-----------------|------------|-----------------------|
| 1 | `[NazwaProp]` | `[css-property]` | `[TypProp]` | [Zakres wartości] |

### 2.2 Co NIE wchodzi w zakres MVP (Future Scope)

| Funkcja / Właściwość | Powód wykluczenia | Planowany etap |
|----------------------|-------------------|----------------|
| [Zaawansowane pole] | [Wyjaśnienie] | [Etap] |

---

## 3. Domain Model (Model Domenowy)

```typescript
export interface [NazwaSubsystemu]Props {
  [pole]: [Typ];
}
```

---

## 4. Commands (Kontrakty Komend)

Opis wykorzystania komendy `UPDATE_PROPS` lub komend dedykowanych.

---

## 5. CSS Mapping (Odwzorowanie na CSS)

Definicja czystej funkcji `[subsystem]ToCSS(props: [NazwaSubsystemu]Props): Record<string, string>`.

---

## 6. Property Registry (Rejestracja w Rejestrze)

Definicja schematu pola dla `propertyFieldRegistry.tsx`.

---

## 7. React UI (Interfejs Użytkownika w Inspectorze)

Szkic wizualny układu pola w Inspectorze (sekcja Visual / Style).

---

## 8. Runtime Integration (Integracja z Silnikiem Strony)

Opis zachowania w czasie rzeczywistym wewnątrz ramki podglądu Iframe.

---

## 9. Validation (Zasady Walidacji)

Reguły walidacji jednostek, zakresów oraz komunikatów błędów.

---

## 10. Test Strategy (Plan i Strategia Testów)

Wyszczególnienie testów jednostkowych, integracyjnych oraz testów Undo/Redo.

---

## 11. Integration Review (Przegląd Integracyjny)

Szablon sekcji odbioru integracyjnego.

---

## 12. Architecture Freeze (Zamrożenie Architektury)

Formalne oświadczenie o zamrożeniu architektury subsystemu.

---

## 13. Acceptance Criteria (Kryteria Akceptacji)

Checklista kryteriów akceptacyjnych dopuszczających subsystem do wydania.
