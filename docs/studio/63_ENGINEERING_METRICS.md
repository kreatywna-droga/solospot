# Engineering Metrics System — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 63_ENGINEERING_METRICS.md  
> **Status:** Standard Process / Quality Dashboard  
> **Zależności:** 36_STUDIO_ENGINEERING_PROCESS.md, 60_SUBSYSTEM_CHECKLIST.md  
>  
> **Proces:** System Metryk Inżynieryjnych i Jakościowych

---

## 1. Cel Systemu Metryk Inżynieryjnych

System metryk inżynieryjnych ma na celu obiektywne i kwantyfikowalne monitorowanie prędkości dostarczania (Velocity), stabilności kodu oraz poziomu dojrzałości architektonicznej projektu WEB FACTOR Studio.

---

## 2. Karta Metryk Inżynieryjnych (Metrics Scorecard)

| # | Metryka Inżynieryjna | Kod Metryki | Sposób Wyliczania | Cel / Wartość Docelowa |
|---|----------------------|-------------|-------------------|------------------------|
| 1 | **Subsystemy Zamrożone** | `METRIC_FROZEN_COUNT` | Liczba subsystemów ze statusem `🔒 Freeze Approved` | 100% po zakończeniu Milestone |
| 2 | **Średni Czas Sprintu** | `METRIC_CYCLE_TIME` | Średnia liczba dni potrzebna na przejście 8 faz | < 5 dni roboczych / subsystem |
| 3 | **Wskaźnik Otwartych ADR** | `METRIC_OPEN_ADR` | Liczba decyzji architektonicznych w stanie Draft | 0 przed Freeze Sprintu |
| 4 | **Odłożone Funkcje (Deferred)** | `METRIC_DEFERRED_SCOPE` | Liczba właściwości przeniesionych do Future Scope | < 20% całego zakresu MVP |
| 5 | **Pokrycie Testami (Coverage)** | `METRIC_TEST_COVERAGE` | Wynik pokrycia instrukcji w Vitest (`% Statements`) | ≥ 90% dla silnika domenowego |
| 6 | **Zaliczone Quality Gates** | `METRIC_QUALITY_GATES` | Liczba zaliczonych punktów kontrolnych checklisty | 12 / 12 punktów checklisty |
| 7 | **Wydajność Canvasu (FPS)** | `METRIC_CANVAS_FPS` | Średnia liczba klatek/sek. podczas odświeżania podglądu | 60 FPS (opóźnienie klatki < 16.6ms) |

---

## 3. Zastosowanie Metryk w Rytmie Sprinterskim

1. **Na początku Sprintu:** Weryfikacja `METRIC_OPEN_ADR` — żaden sprint nie rozpoczyna implementacji bez zamrożonych decyzji.
2. **W trakcie Sprintu:** Kontrola `METRIC_CYCLE_TIME` oraz bieżące pokrycie testami.
3. **Na zakończenie Sprintu:** Weryfikacja przejścia 12 punktów `METRIC_QUALITY_GATES` i aktualizacja `METRIC_FROZEN_COUNT`.
