# Subsystem Lifecycle Specification — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 84_SUBSYSTEM_LIFECYCLE.md  
> **Status:** Governance Standard  
> **Zależności:** 36_STUDIO_ENGINEERING_PROCESS.md, 60_SUBSYSTEM_CHECKLIST.md  
>  
> **Proces:** Cykl Życia Subsystemu Buildera (Subsystem Lifecycle Framework)

---

## 1. Cykl Życia Subsystemu Buildera

Każdy subsystem (od Layout Engine, aż po Typography i Animations) ewoluuje zgodnie ze ścisłym 10-etapowym cyklem życia:

```
Idea ➔ Discovery ➔ Specification ➔ Implementation ➔ Integration Review ➔ Architecture Freeze ➔ Maintenance ➔ Evolution ➔ Deprecation ➔ Removal
```

---

## 2. Wymagania i Artefakty dla Każdego Etapu

| Etap Cyklu | Wejście (Input) | Wyjście (Output) | Wymagane Artefakty | Kryteria Ukończenia |
|------------|-----------------|------------------|--------------------|---------------------|
| **1. Idea** | Potrzeba produktowa | Wniosek o subsystem | Wpisać w `81_FUTURE_SUBSYSTEM_ROADMAP.md` | Akceptacja priorytetu P1/P2 |
| **2. Discovery** | Analiza wymagań | Zarys koncepcji | ADR Draft (`77_ADR_INDEX.md`) | Zatwierdzenie podejścia |
| **3. Specification** | Zarys koncepcji | Specyfikacja i Kontrakty | `XX_SPECIFICATION.md`, `XX_COMMANDS.md` | Przejście Review Gate 70 |
| **4. Implementation** | Specyfikacja | Kod źródłowy i testy | Typy domenowe, `XXField.tsx`, Unit Tests | 100% testów PASS w Vitest |
| **5. Integration Review** | Kod źródłowy | Dokument odbioru | `XX_INTEGRATION_REVIEW.md` | Zgodność ze Store i Canvas |
| **6. Architecture Freeze** | Odbiór integracji | Blokada kodu i dok. | `XX_ARCHITECTURE_FREEZE.md` | Zaliczone 12 pkt checklisty 60 |
| **7. Maintenance** | Kod produkcyjny | Stabilna funkcja | Poprawki błędów (Bugfixes) | ZERO zgłoszeń P1/P2 |
| **8. Evolution** | Nowy wymóg MVP ➔ Faza 2 | Rozszerzenie pola | Zaktualizowany model z `66_EVOLUTION...` | Zachowanie wstecznej kompatybilności |
| **9. Deprecation** | Nowy lepszy subsystem | Oznaczenie wycofania | Status `Deprecated` w nagłówku | Odnośnik do nowego modułu |
| **10. Removal** | Brak użycia przez klientów | Usunięcie z repozytorium | Wpis w `80_DECISION_LOG.md` | Bezpieczne wyczyszczenie kodu |
