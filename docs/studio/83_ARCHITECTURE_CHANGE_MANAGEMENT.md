# Architecture Change Management Process — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 83_ARCHITECTURE_CHANGE_MANAGEMENT.md  
> **Status:** Governance Standard  
> **Zależności:** 65_ARCHITECTURE_PRINCIPLES.md, 72_DOCUMENT_LIFECYCLE.md  
>  
> **Proces:** Proces Zarządzania Zmianami w Architekturze (Architecture Change Management)

---

## 1. Przepływ Zarządzania Zmianami Architektonicznymi

Każda zmiana w architekturze (nowy subsystem, modyfikacja interfejsów komend, zmiana schematu dokumentu) przechodzi przez ustrukturyzowany 8-etapowy proces:

```
Zgłoszenie ➔ Klasyfikacja ➔ Ocena Wpływu ➔ Architecture Review ➔ Approval Flow ➔ Wdrożenie ➔ Aktualizacja Dok. ➔ Zamknięcie
```

---

## 2. Opis Etapów i Ról

1. **Zgłoszenie Zmiany (Change Request):** Zgłoszenie pototrzeby wprowadzenia modyfikacji w postaci wniosku z opisem problemu.
2. **Klasyfikacja Zmiany:**
   * **Minor Change (Drobna):** Dodanie opcjonalnego pola, brak wpływu na wsteczną kompatybilność.
   * **Major Change (Kluczowa):** Zmiana szyny komend, modyfikacja modelu domenowego, wpływ na Runtime.
3. **Ocena Wpływu (Impact Assessment):** Analiza wpływu na istniejące subsystemy, wydajność i testy.
4. **Architecture Review:** Weryfikacja ze słownikiem `75_ARCHITECTURE_GLOSSARY.md` oraz checklistą `70_ARCHITECTURE_REVIEW_CHECKLIST.md`.
5. **Approval Flow:** Formalna akceptacja przez Lead Architecta / Agenta Architektonicznego (Agent 2).
6. **Wdrożenie:** Implementacja kodu źródłowego przez Agenta Implementacyjnego (Agent 1).
7. **Aktualizacja Dokumentacji:** Aktualizacja rejestrów `62_BUILDER_TRACEABILITY_MATRIX.md` oraz `77_ADR_INDEX.md`.
8. **Zamknięcie Zmiany:** Zmiana zostaje oznaczona jako zrealizowana.
