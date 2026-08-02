# Central Decision Log — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 80_DECISION_LOG.md  
> **Status:** Active Decision Log  
> **Zależności:** 77_ADR_INDEX.md, 65_ARCHITECTURE_PRINCIPLES.md  
>  
> **Proces:** Centralny Rejestr Decyzji Projektowych i Architektonicznych

---

## 1. Rejestr Decyzji Projektowych (Central Decision Log)

| Identyfikator | Opis Decyzji | Uzasadnienie | Alternatywy | Wpływ | Status | Powiązane ADR | Data Przeglądu |
|---------------|--------------|--------------|-------------|-------|--------|---------------|----------------|
| **DEC-001** | Użycie ramki Iframe do renderowania podglądu Canvas. | Pełna izolacja stylów i skryptów edytora od budowanego sklepu. | Render bezpośredni w drzewie Reacta (Shadow DOM). | Wysoki | APPROVED | `ADR-001` | 2026-07-15 |
| **DEC-002** | Wykorzystanie `UPDATE_PROPS` jako uniwersalnej komendy. | Prostota architektoniczna, natychmiastowe Undo/Redo bez dedykowanych reducerów dla każdego pola. | Tworzenie osobnej komendy Reducera dla każdej właściwości CSS. | Wysoki | APPROVED | `ADR-002` | 2026-07-16 |
| **DEC-003** | Czyste funkcje mapowania CSS (`XXToCSS`). | Łatwość testowania jednostkowego, 0 efektów ubocznych, gwarancja determinizmu. | Metody wewnątrz klas modeli domenowych. | Średni | APPROVED | `ADR-004` | 2026-07-20 |
| **DEC-004** | Jednostkowy i 4-narożnikowy model dla Radius. | Łatwy UX w Inspectorze i gotowość na zaawansowaną edycję zaokrągleń. | Tylko pojedyncza wartość promienia. | Średni | APPROVED | `ADR-008` | 2026-07-30 |
| **DEC-005** | Rozdzielenie ról na Agenta 1 (Kod) i Agenta 2 (Architektura). | Eliminacja konfliktów w repozytorium Git i maksymalne tempo dostarczania. | Praca w jednym pliku przez obu agentów naraz. | Wysoki | APPROVED | `ADR-009` | 2026-07-30 |
