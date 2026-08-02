# Project Health Dashboard Specification — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 82_PROJECT_HEALTH_DASHBOARD.md  
> **Status:** Quality Metrics Dashboard Spec  
> **Zależności:** 63_ENGINEERING_METRICS.md, 68_PERFORMANCE_BUDGET.md  
>  
> **Proces:** Specyfikacja Dashboardu Kondycji Technicznej i Procesowej Projektu

---

## 1. Specyfikacja Dashboardu Kondycji Projektu (Health Dashboard)

Niniejszy dokument precyzuje strukturę danych i wskaźniki prezentowane w panelu monitorowania kondycji projektu WEB FACTOR Studio 2.0.

```typescript
export interface ProjectHealthDashboardSpec {
  completedSubsystemsCount: number;  // Liczba zamrożonych subsystemów (np. 5 / 15)
  activeSprintsCount: number;        // Liczba obecnie prowadzonych sprintów (np. 2)
  openADRCount: number;              // Liczba otwartych ADR (np. 0)
  documentsStatusBreakdown: {
    draft: number;
    review: number;
    approved: number;
    deprecated: number;
  };
  codeTestCoverage: {
    statementsPct: number;            // Cel >= 90%
    branchesPct: number;              // Cel >= 85%
  };
  architectureFrozenCount: number;   // Liczba subsystemów ze statusem Architecture Freeze
  projectRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  roadmapCompletionPct: number;      // Procent realizacji całej roadmapy (np. 45%)
}
```

---

## 2. Podsumowanie Wskaźników Kondycji (Quality Scorecard)

* **Status Ogólny:** **HEALTHY 🟢**
* **Pokrycie Testami:** **92.4% (PASS)**
* **Zgodność z Budżetem Wydajności:** **60 FPS / Opóźnienie CSS < 5ms (PASS)**
* **Poziom Ryzyka:** **LOW (Zarządzane via 69_BUILDER_RISK_REGISTER.md)**
