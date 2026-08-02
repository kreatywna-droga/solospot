# Builder Architectural Risk Register — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 69_BUILDER_RISK_REGISTER.md  
> **Status:** Risk Management Standard  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 63_ENGINEERING_METRICS.md  
>  
> **Proces:** Rejestr Ryzyk Architektonicznych i Strategia Ograniczania (Mitigation)

---

## 1. Rejestr Ryzyk Architektonicznych (Architectural Risk Matrix)

Poniższa macierz klasyfikuje główne zagrożenia technologiczne i architektoniczne mogące wystąpić podczas długofalowej rozbudowy WEB FACTOR Studio 2.0 oraz określa strategie zapobiegawcze.

| # | Identyfikator Ryzyka | Opis Zagrożenia | Prawdopodobieństwo | Wpływ | Sposób Wykrycia | Strategia Ograniczania (Mitigation) |
|---|----------------------|-----------------|------------------- |-------|-----------------|--------------------------------------|
| 1 | **RISK-RUN-01** | **Rozrost Paczki Runtime (Runtime Bloat):** Dodawanie kolejnych subsystemów powoduje drastyczny wzrost rozmiaru skryptu wygenerowanej strony. | Średnie | Wysoki | Automatyczny audyt wielkości paczki JS w procesie CI/CD. | Drzewiaste usuwanie nieużywanego kodu (Tree-shaking), podział skryptów na moduły on-demand oraz ograniczenie bibliotek zewnętrznych. |
| 2 | **RISK-REG-02** | **Złożoność Rejestru (Registry Bottleneck):** Rejestrowanie setek właściwości zwalnia czas odpytywania `ComponentRegistry`. | Niskie | Średni | Pomiary czasu z `68_PERFORMANCE_BUDGET.md` (`< 1ms`). | Indeksowanie schematów za pomocą tabel haszujących (Map O(1)) oraz leniwe ładowanie panelu Inspectora. |
| 3 | **RISK-CAN-03** | **Spadek Wydajności Canvasu:** Przy złożonych stronach (50+ sekcji) odświeżanie nakładek powoduje spadek płynności poniżej 60 FPS. | Średnie | Wysoki | Pomiary czasu klatki w `METRIC_CANVAS_FPS`. | Wirtualizacja listy sekcji w Iframe, ograniczenie przeliczania Bounding Box tylko do widocznego obszaru (Viewport Virtualization). |
| 4 | **RISK-DOM-04** | **Niespójność Modeli Domenowych:** Różne nazewnictwo tych samych pojęć (np. `radius` vs `borderRadius`) między subsystemami. | Niskie | Wysoki | Walidacja schematów w procesie Architecture Review (Checklista 70). | Rygorystyczne przestrzeganie `61_PROPERTY_DESIGN_GUIDELINES.md` i centralizacja typów. |
| 5 | **RISK-REG-05** | **Regresje po Dodawaniu Subsystemów:** Wdrożenie nowego pola (np. Shadow) uszkadza wcześniej zaimplementowane właściwości (np. Border). | Średnie | Wysoki | Automatyczne testy regresyjne w Vitest przed każdym merges. | Izolacja modeli domenowych oraz obowiązkowy test integracyjny pętli Undo/Redo dla całego dokumentu. |
