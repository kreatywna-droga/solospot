# Project Maturity Model — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 94_PROJECT_MATURITY_MODEL.md  
> **Status:** Governance Standard  
> **Zależności:** Wszystkie dokumenty governance (59-93) w `docs/studio/`  
>  
> **Proces:** Model Dojrzałości Projektowej i Kryteria Awansu (Project Maturity Model)

---

## 1. Pięć Poziomów Dojrzałości Projektowej

Model Dojrzałości Projektowej WEB FACTOR Studio 2.0 klasyfikuje zaawansowanie inżynieryjne projektu w 5-stopniowej skali:

```
Level 1: Initial ➔ Level 2: Structured ➔ Level 3: Standardized ➔ Level 4: Managed ➔ Level 5: Optimized
```

---

## 2. Wymagania i Kryteria dla Poziomów Dojrzałości

### Level 1 — Initial (Początkowy)
* **Wymagania:** Kod pisany ad-hoc, brak spisanej architektury, brak formalnych testów.
* **Mierniki:** Ad-hoc commits, brak powtarzalnych procesów.
* **Przykładowe Artefakty:** Podstawowy plik `README.md`.

### Level 2 — Structured (Ustrukturyzowany)
* **Wymagania:** Zdefiniowany podział na moduły, podstawa edytora (Shell, Core, Registry) oraz wstępna lista wdrożeniowa.
* **Mierniki:** Podstawowy wskaźnik pokrycia testami, istnienie 8-fazowego procesu.
* **Przykładowe Artefakty:** `01_STUDIO_ARCHITECTURE.md`, `99_IMPLEMENTATION_CHECKLIST.md`.

### Level 3 — Standardized (Ustandaryzowany)
* **Wymagania:** Kompletne standardy inżynieryjne, poradnik stylu dokumentacji, wytyczne spójności architektonicznej i sprawdzona szyna komend.
* **Mierniki:** 100% spójność dokumentów, obecność szablonów subsystemów.
* **Przykładowe Artefakty:** `59_BUILDER_SUBSYSTEM_TEMPLATE.md`, `65_ARCHITECTURE_PRINCIPLES.md`, `71_DOCUMENTATION_STYLE_GUIDE.md`.

### Level 4 — Managed (Zarządzany)
* **Wymagania:** Wdrożenie kwantyfikowalnego systemu metryk, budżetu wydajności, macierzy śledzenia oraz formalnego zarządzania zmianą.
* **Mierniki:** `METRIC_CYCLE_TIME`, `METRIC_CANVAS_FPS` 60 FPS, pokrycie testami domeny ≥90%.
* **Przykładowe Artefakty:** `62_BUILDER_TRACEABILITY_MATRIX.md`, `68_PERFORMANCE_BUDGET.md`, `82_PROJECT_HEALTH_DASHBOARD.md`.

### Level 5 — Optimized (Zoptymalizowany)
* **Wymagania:** Pełna automatyzacja bramek jakości w CI/CD (Quality Gates), automatyczny Doc Linter, samodoskonalący się proces i zero długu technologicznego.
* **Mierniki:** 100% automatycznych przejść bramek CI, zero ręcznej weryfikacji architektury.
* **Przykładowe Artefakty:** `89_ARCHITECTURE_COMPLIANCE_SPEC.md`, `92_CI_QUALITY_GATES.md`.

---

## 3. Ocena Wymogów Awansu dla WEB FACTOR Studio na Podstawie Dokumentacji

Na podstawie ścisłej analizy istniejących artefaktów w `docs/studio/`:

1. **Warunki osiągnięcia i utwierdzenia Poziomu 3 (Standardized):**
   * Projekt posiada zamrożone specyfikacje podstawy (Shell, Core, Registry, Layout, Grid) oraz kompletny poradnik stylu dokumentacji (`71`). Warunkiem utwierdzenia L3 jest ukończenie kodu dla trwających sprintów (Border 5B.3, Radius 5B.4).
2. **Warunki przejścia do Poziomu 4 (Managed):**
   * Po zakończeniu wdrożenia kodu dla Sprintów 5B.3, 5B.4 oraz 5C (Canvas Completion), wdrożenie w bieżącej praktyce pomiarów z `63_ENGINEERING_METRICS.md` i stałe monitorowanie `82_PROJECT_HEALTH_DASHBOARD.md`.
3. **Warunki przejścia do Poziomu 5 (Optimized):**
   * Fizyczne skompletowanie i uruchomienie automatycznych skryptów pipeline'u CI/CD realizujących bramki jakości zdefiniowane w specyfikacji `92_CI_QUALITY_GATES.md`.
