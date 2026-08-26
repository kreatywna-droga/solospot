# Knowledge Transfer & Onboarding Standard — WEB FACTOR Studio 2.0

> [!IMPORTANT]
> **STATUS: Requires Re-ratification**
> 
> Status dokumentu nie został jeszcze formalnie zatwierdzony przez Architekta.
> Dokument opisuje wykonane prace, jednak jedynym źródłem prawdy o statusie sprintów pozostaje:
> `docs/studio/99_IMPLEMENTATION_CHECKLIST.md`

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 103_PROJECT_KNOWLEDGE_TRANSFER.md  
> **Status:** Governance Standard  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 65_ARCHITECTURE_PRINCIPLES.md, 75_ARCHITECTURE_GLOSSARY.md  
>  
> **Proces:** Standard Przekazywania Wiedzy i Onboarding Nowych Członków Zespołu

---

## 1. Ścieżka Onboardingu i Przekazywania Wiedzy

Niniejszy standard opisuje sekwencyjny proces zapoznawania nowych inżynierów oraz agentów AI ze strukturą i regułami WEB FACTOR Studio 2.0.

---

## 2. Zalecana Kolejność Czytania Dokumentów (Reading Sequence)

```
1. Wizja i Słownik ➔ 2. Architektura ➔ 3. Zasady i Jakość ➔ 4. Core & Runtime ➔ 5. Specyfikacje Subsystemów
```

| Krok | Kolejność Czytania | Tytuł Dokumentu | Cel |
|------|--------------------|-----------------|-----|
| 1 | `00_STUDIO_VISION.md` + `75_ARCHITECTURE_GLOSSARY.md` | Wizja i Słownik Pojęć | Zrozumienie celu biznesowego i uniwersalnej terminologii. |
| 2 | `01_STUDIO_ARCHITECTURE.md` | Główna Architektura Studio | Zapoznanie się z układem modułów Shell, Core, Canvas, Inspector. |
| 3 | `65_ARCHITECTURE_PRINCIPLES.md` + `86_RULES.md` | Zasady i Reguły Spójności | Poznamie 10 nadrzędnych zasad i zakazanych naruszeń. |
| 4 | `02_BUILDER_CORE.md` + `28_RUNTIME_MODEL.md` | Builder Core & Runtime | Zrozumienie niezmiennego drzewa dokumentu i silnika Iframe. |
| 5 | `59_SUBSYSTEM_TEMPLATE.md` + `60_CHECKLIST.md` | Szablon i Checklista Subsystemu | Zapoznanie się z 8-fazowym cyklem wdrażania nowych pól. |

---

## 3. Checklista Startowa i Najczęstsze Błędy (Pitfalls)

### Checklista Rozpoczęcia Pracy:
* [ ] Przeczytano 5 kluczowych dokumentów z tabeli powyżej.
* [ ] Zapoznano się ze słownikiem `75_ARCHITECTURE_GLOSSARY.md`.
* [ ] Sprawdzono przydział ról w procesie (Agent 1: Implementacja vs Agent 2: Dokumentacja).

### Najczęstsze Błędy do Unikania (Common Pitfalls):
1. ❌ **Łamanie Niezmienności (Mutating State):** Nadpisywanie pól wewnątrz obiektu `BuilderDocument` bez wywołania Reducera.
2. ❌ **Modyfikowanie Iframe z Parent Window:** Bezpośrednie manipulowanie węzłami DOM strony podglądu zamiast przesyłania `PostMessage`.
3. ❌ **Pomięcie Dokumentacji:** Pisanie kodu przed zamrożeniem specyfikacji w `docs/studio/`.
