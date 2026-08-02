# Builder Subsystem Execution Checklist

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 60_SUBSYSTEM_CHECKLIST.md  
> **Status:** Standard Process  
> **Zależności:** 36_STUDIO_ENGINEERING_PROCESS.md, 59_BUILDER_SUBSYSTEM_TEMPLATE.md  
>  
> **Proces:** Lista Kontrolna Odbioru Subsystemów

---

## 1. Oficjalna Checklista Realizacji Subsystemu

Każdy subsystem przed oznaczeniem jako **🔒 Frozen (Approved)** musi przejść przez poniższą checklistę 12 kroków kontrolnych:

```
[ ] 1. Specification        - Specyfikacja właściwości i zakresu MVP (Dokument XX_SPECIFICATION.md)
[ ] 2. Commands             - Kontrakty komend i integracja z UPDATE_PROPS (Dokument XX_COMMANDS.md)
[ ] 3. Domain               - Definicja niezmiennych typów w Domain Model (np. BorderTypes.ts / RadiusTypes.ts)
[ ] 4. CSS Mapping          - Implementacja i przetestowanie czystej funkcji XXToCSS()
[ ] 5. Validation           - Implementacja walidatorów wartości i jednostek (validateXXProps)
[ ] 6. Registry             - Rejestracja pola w propertyFieldRegistry.tsx
[ ] 7. React UI             - Stworzenie komponentu pola Inspectora (XXField.tsx)
[ ] 8. Tests                - Pokrycie testami jednostkowymi (>90%) i integracyjnymi (Undo/Redo)
[ ] 9. Integration Review   - Dokument przeglądu integracji (Dokument XX_INTEGRATION_REVIEW.md)
[ ] 10. Architecture Freeze - Dokument zamrożenia architektury (Dokument XX_ARCHITECTURE_FREEZE.md)
[ ] 11. Roadmap Update      - Aktualizacja stanu w 37_STUDIO_SUBSYSTEM_ROADMAP.md
[ ] 12. Checklist Update    - Zaznaczenie wykonanych zadań w 99_IMPLEMENTATION_CHECKLIST.md
```

---

## 2. Kryteria Jakościowe dla Kroków Kontrolnych

* **Specification (Krok 1):** Dokument zatwierdzony, bez niedomówień w zakresie jednostek i typów.
* **Domain & Immutability (Krok 3):** Typy serializowalne w 100% do JSON, brak funkcji wewnątrz obiektu stanu.
* **Tests (Krok 8):** Testy przechodzą w 100% z wynikiem PASS (`vitest run`).
* **Architecture Freeze (Krok 10):** Wszystkie pliki przetestowane, zablokowane przed nieautoryzowanymi modyfikacjami.
