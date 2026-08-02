# Architecture Compliance Specification — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 89_ARCHITECTURE_COMPLIANCE_SPEC.md  
> **Status:** Automation Specification  
> **Zależności:** 65_ARCHITECTURE_PRINCIPLES.md, 86_ARCHITECTURE_CONSISTENCY_RULES.md  
>  
> **Proces:** Specyfikacja Automatycznej Kontroli Zgodności Architektury (Automated Compliance)

---

## 1. Cel Specyfikacji Kontroli Zgodności

Niniejszy dokument definiuje zestaw automatycznych reguł weryfikacyjnych przeznaczonych do przyszłej integracji w pipeline CI/CD. Celem jest automatyczne odrzucanie kodów i dokumentów naruszających standardy architektoniczne WEB FACTOR Studio 2.0.

---

## 2. Reguły Kontroli Zgodności (Compliance Rules Table)

| # | Identyfikator Reguły | Opis Sprawdzanego Elementu | Priorytet | Poziom Błędu | Sposób Weryfikacji (Validation Method) |
|---|----------------------|----------------------------|-----------|--------------|-----------------------------------------|
| 1 | **RULE-DIR-01** | **Struktura Katalogów:** Pola Inspectora umieszczane są wyłącznie w `inspector/fields/`. | P1 | **ERROR** | Skanowanie ścieżek plików w poszukiwaniu komponentów pól poza wyznaczonym katalogiem. |
| 2 | **RULE-NAM-02** | **Nazewnictwo Właściwości:** Nazwy właściwości w domenie w formacie `camelCase`, pliki CSS `kebab-case`. | P1 | **ERROR** | Statyczna analiza AST TypeScript / ESLint custom rule. |
| 3 | **RULE-DEP-03** | **Zależności Cykliczne:** Brak importów komponentów UI ani DOM Iframe wewnątrz plików domeny. | P1 | **ERROR** | Analizator grafu zależności (Dependency Graph Linter / Madge). |
| 4 | **RULE-DOC-04** | **Kompletność Dokumentacji:** Każdy nowy subsystem posiada komplet dokumentów 8-fazowych. | P2 | **WARNING** | Walidator obecności plików w `docs/studio/` na podstawie checklisty `60`. |
| 5 | **RULE-ADR-05** | **Weryfikacja ADR:** Każda nowa właściwość ma przypisany rekord ADR w `77_ADR_INDEX.md`. | P2 | **WARNING** | Przeszukiwanie macierzy śledzenia `62_BUILDER_TRACEABILITY_MATRIX.md`. |
| 6 | **RULE-FRZ-06** | **Naruszenie Architecture Freeze:** Brak modyfikacji zablokowanych zamrożonych sprintów bez otwartego CR. | P1 | **ERROR** | Weryfikacja Git Diff względem zamrożonych scieżek w `37_SUBSYSTEM_ROADMAP.md`. |
