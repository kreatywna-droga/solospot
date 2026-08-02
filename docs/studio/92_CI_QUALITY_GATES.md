# CI Quality Gates Specification — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 92_CI_QUALITY_GATES.md  
> **Status:** Automation Specification  
> **Zależności:** 63_ENGINEERING_METRICS.md, 68_PERFORMANCE_BUDGET.md, 89_ARCHITECTURE_COMPLIANCE_SPEC.md  
>  
> **Proces:** Specyfikacja Bramki Jakości w Pipeline CI/CD (Quality Gates)

---

## 1. Specyfikacja Bramek Jakości w Pipeline CI/CD

Poniższa tabela definiuje 6 automatycznych bramek jakościowych (Quality Gates), przez które musi przejść każdy kod przed scaleniem do gałęzi `main`.

| Bramka CI | Wejście (Input) | Warunki PASS (Sukces) | Warunki FAIL (Odrzucenie Builda) |
|-----------|-----------------|-----------------------|----------------------------------|
| **1. Documentation Validation** | Pliki `docs/studio/*.md` | Doc Linter nie zgłasza błędów syntaxu, brak martwych linków. | Wykryto brak nagłówka metadanych lub martwe odnośniki. |
| **2. Architecture Validation** | Kod w `src/` oraz `packages/` | Przejście 100% reguł z `89_ARCHITECTURE_COMPLIANCE_SPEC.md`. | Wykryto nieuprawnione zależności cykliczne lub złe nazewnictwo. |
| **3. Type Validation** | Kod TypeScript | Czysta kompilacja `tsc --noEmit` bez błędów typowania. | Wykryto chociaż 1 błąd typowania TypeScript. |
| **4. Test Validation** | Zestaw testów Vitest | 100% testów przechodzi z wynikiem PASS, pokrycie domeny ≥90%. | Dowolny test kończy się niepowodzeniem (FAIL) lub brak pokrycia. |
| **5. Performance Validation** | Benchmarki wydajności | Kompilacja CSS < 5ms, opóźnienie klatki Canvasu < 16.6ms. | Wykryto przekroczenie budżetu z `68_PERFORMANCE_BUDGET.md`. |
| **6. Release Validation** | Paczka produkcyjna | Zaliczone 7 filarów z `64_RELEASE_READINESS.md`. | Otwarty chociaż 1 defekt o priorytecie P1/P2. |
