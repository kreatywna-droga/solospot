# Governance KPI Scorecard — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 105_GOVERNANCE_KPI.md  
> **Status:** Governance Standard  
> **Zależności:** 63_ENGINEERING_METRICS.md, 82_PROJECT_HEALTH_DASHBOARD.md  
>  
> **Proces:** Mierniki Jakości i Efektywności Procesu Governance (KPI Scorecard)

---

## 1. Zestaw Wskaźników Jakości Procesu Governance (KPI Scorecard)

Poniższa tabela definiuje 6 kluczowych wskaźników efektywności (KPI) monitorujących dojrzałość zarządczą i jakość procesu inżynieryjnego.

| # | Nazwa KPI | Definicja Operacyjna | Sposób Pomiaru | Częstotliwość Raportowania | Próg Akceptacji (Target Threshold) |
|---|-----------|----------------------|----------------|----------------------------|-----------------------------------|
| 1 | **Czas Zamknięcia Review** | Czas od przedłożenia specyfikacji do formalnego zamrożenia. | Różnica dat miedzy `Draft` a `Approved` w `77`. | Co sprint | **< 3 dni robocze** |
| 2 | **Liczba Otwartych ADR** | Liczba rekordów ADR ze statusem `Draft`. | Odpytanie indeksu `77_ADR_INDEX.md`. | Co sprint | **0 otwartych ADR przed Freeze** |
| 3 | **Pokrycie Dokumentacji** | Procent subsystemów z kompletem dokumentów 8-fazowych. | Raport z `100_DOC_COVERAGE_REPORT.md`. | Co sprint | **100% dla zaimplementowanych** |
| 4 | **Subsystemy Zamrożone** | Liczba subsystemów ze statusem `🔒 Architecture Freeze`. | Odpytanie `37_STUDIO_ROADMAP.md`. | Co miesiąc | **Zgodnie z planem sprintu** |
| 5 | **Zgodność z Quality Gates** | Procent automatycznych przejść bramek CI bez poprawek. | Statystyka z `92_CI_QUALITY_GATES.md`. | Co sprint | **≥ 95% PASS za 1 razem** |
| 6 | **Liczba Wyjątków od Normy** | Liczba zatwierdzonych odstępstw od standardów architektonicznych. | Rejestr wyjątków w `80_DECISION_LOG.md`. | Co kwartał | **0 wyjątków bez zaakceptowanego ADR** |
