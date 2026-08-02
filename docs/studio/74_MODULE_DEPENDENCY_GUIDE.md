# Module Dependency Guide — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 74_MODULE_DEPENDENCY_GUIDE.md  
> **Status:** Governance Standard  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 65_ARCHITECTURE_PRINCIPLES.md  
>  
> **Proces:** Mapa Zależności i Dopuszczalne Punkty Integracji Modułów

---

## 1. Mapa Zależności Modułów (Module Dependency Map)

Projekt WEB FACTOR Studio 2.0 opiera się na **Acyklicznym Grafie Zależności (Directed Acyclic Graph - DAG)**. Zależności między modułami mogą przepływać wyłącznie z wyższych warstw (UI) do niższych warstw (Core/Domain). Direct cykliczne referencje są bezwzględnie zakazane.

```
┌────────────────────────────────────────────────────────────────────────┐
│  WARSTWA PREZENTACJI (UI LAYER)                                       │
│  ┌───────────────────────┐             ┌───────────────────────────┐   │
│  │ Inspector Panel (UI)  │             │ Canvas Engine / Overlays  │   │
│  └───────────┬───────────┘             └─────────────┬─────────────┘   │
└──────────────┼───────────────────────────────────────┼─────────────────┘
               │ Dispatch Commands                     │ PostMessage / State
               ▼                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│  WARSTWA PODSTAWOWA (CORE & STORE LAYER)                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ BuilderStore / Reducer / HistoryStack                           │   │
│  └───────────────────────────────┬─────────────────────────────────┘   │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │ Compiles Document
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│  WARSTWA DOMENY I REJESTRU (DOMAIN & REGISTRY LAYER)                   │
│  ┌────────────────────────┐  ┌─────────────────┐  ┌─────────────┐   │
│  │ ComponentRegistry      │  │ Domain Models   │  │ Runtime     │   │
│  └────────────────────────┘  └─────────────────┘  └─────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tabela Zależności i Zakazanych Powiązań

| Moduł Zależny (From) | Moduł Docelowy (To) | Kierunek | Dopuszczalny Punkt Integracji | Zakazane Zależności (Forbidden) |
|----------------------|---------------------|----------|-------------------------------|----------------------------------|
| **Inspector (UI)** | **BuilderStore** | ➔ Down | Wywoływanie `dispatch(UPDATE_PROPS)` | ❌ Brak bezpośredniej edycji stanu DOM Iframe. |
| **Inspector (UI)** | **ComponentRegistry**| ➔ Down | Odczyt schematów `PropSchema` z rejestru | ❌ Modyfikacja rejestru z poziomu komponentu UI. |
| **Canvas Engine** | **Runtime Engine** | ➔ Down | Bezpieczny IPC Mostek `postMessage` | ❌ Importowanie obiektów DOM Iframe do parent React. |
| **BuilderStore** | **HistoryStack** | ➔ Down | Zapis snaphotu `BuilderDocument` przed redukcją | ❌ Bezpośrednia modyfikacja stosu historii z UI. |
| **Runtime Engine** | **Builder Core** | ➔ Down | Odczyt czystego `BuilderDocument` dla kompilacji | ❌ Runtime nie wysyła komend modyfikujących dokument. |
| **Domain Models** | **Górne Warstwy** | Standalone | Brak – warstwa domeny jest czysta i niezależna | ❌ Importowanie klas React, Reducera lub UI w domenie. |

---

## 3. Zasady Izolacji Modułowej

1. **Zakaz Cykli (No Circular Dependencies):** Żaden plik domeny ani rdzenia nie może importować komponentu React z warstwy paneli UI.
2. **Czystość Warstwy Domeny:** Pliki w `Domain Models` (np. `LayoutTypes.ts`, `BorderTypes.ts`, `RadiusTypes.ts`) zawierają czyste typy TypeScript i interfejsy bez jakichkolwiek zależności od Reacta czy Reduksa.
