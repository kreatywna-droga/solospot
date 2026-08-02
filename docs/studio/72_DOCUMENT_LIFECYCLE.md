# Document Lifecycle & Workflow — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 72_DOCUMENT_LIFECYCLE.md  
> **Status:** Governance Standard  
> **Zależności:** 36_STUDIO_ENGINEERING_PROCESS.md, 71_DOCUMENTATION_STYLE_GUIDE.md  
>  
> **Proces:** Cykl Życia Dokumentacji Architektonicznej

---

## 1. Cykl Życia Dokumentacji Architektonicznej

Dokumentacja techniczna w WEB FACTOR Studio 2.0 nie jest statycznym zbiorem plików plikowych, lecz żywym ekosystemem, który ewoluuje zgodnie z 8-etapowym cyklem życia:

```
Draft ➔ Review ➔ Approved ➔ Implementation ➔ Integration Review ➔ Architecture Freeze ➔ Maintained ➔ Deprecated
```

---

## 2. Opis Etapów Cyklu Życia

### Etap 1: Draft (Szkic Architektoniczny)
* **Cel:** Sformułowanie koncepcji nowego subsystemu, specyfikacji właściwości lub propozycji komend.
* **Odpowiedzialność:** Agent Architektoniczny (Agent 2) / Architekt Oprogramowania.
* **Kryteria Przejścia:** Ukończenie roboczego tekstu ze wszystkimi wymaganymi sekcjami z `59_BUILDER_SUBSYSTEM_TEMPLATE.md`.

### Etap 2: Review (Przegląd Architektoniczny)
* **Cel:** Weryfikacja spójności projektu z zasadami `65_ARCHITECTURE_PRINCIPLES.md` oraz sprawdzenie braku kolizji z innymi subsystemami.
* **Odpowiedzialność:** Zespół Deweloperski / Code & Arch Reviewer.
* **Kryteria Przejścia:** Przejście 10 punktów kontrolnych z checklisty `70_ARCHITECTURE_REVIEW_CHECKLIST.md`.

### Etap 3: Approved (Zatwierdzony do Implementacji)
* **Cel:** Formalne zamrożenie specyfikacji jako podstawy dla zespołu programistycznego.
* **Odpowiedzialność:** Lead Architect.
* **Kryteria Przejścia:** Oznaczenie statusu `Approved ✅` i rozpoczęcie prac programistycznych.

### Etap 4: Implementation (Faza Programistyczna)
* **Cel:** Tworzenie kodów źródłowych, typów domenowych i komponentów UI zgodnie z zatwierdzonym dokumentem.
* **Odpowiedzialność:** Agent Implementacyjny (Agent 1) / Deweloper Frontend.
* **Kryteria Przejścia:** Napisanie kodu w `src/` oraz kompletnych testów jednostkowych w Vitest.

### Etap 5: Integration Review (Odbiór Integracyjny)
* **Cel:** Sporządzenie dokumentu odbioru integracji (`XX_INTEGRATION_REVIEW.md`) potwierdzającego współdziałanie kodu z silnikami Canvas, Inspector i Runtime.
* **Odpowiedzialność:** QA / Architekt Integracji.
* **Kryteria Przejścia:** Pozytywny wynik testów integracyjnych end-to-end.

### Etap 6: Architecture Freeze (Zamrożenie Architektury)
* **Cel:** Ostateczne zablokowanie kodu i dokumentacji danego sprintu przed dalszymi modyfikacjami.
* **Odpowiedzialność:** Release Master / Agent 2.
* **Kryteria Przejścia:** Utworzenie pliku `XX_ARCHITECTURE_FREEZE.md` i zaktualizowanie macierzy `62_BUILDER_TRACEABILITY_MATRIX.md`.

### Etap 7: Maintained (Utrzymanie i Drobne Poprawki)
* **Cel:** Utrzymanie aktualności dokumentu w fazie produkcyjnej.
* **Odpowiedzialność:** Zespół Utrzymania.
* **Kryteria Przejścia:** Dokument służy jako odniesienie dla wydań maintenance.

### Etap 8: Deprecated (Wycofanie / Zastąpienie)
* **Cel:** Oznaczenie przestarzałej specyfikacji, która została w całości zastąpiona nowszym subsystemem.
* **Odpowiedzialność:** Lead Architect.
* **Kryteria Przejścia:** Dodanie czytelnego nagłówka wskazującego nowy dokument zastępujący.
