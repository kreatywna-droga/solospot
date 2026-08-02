# Repository Structure Standard — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 91_REPOSITORY_STRUCTURE_STANDARD.md  
> **Status:** Governance Standard  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 86_ARCHITECTURE_CONSISTENCY_RULES.md  
>  
> **Proces:** Standard Struktury Repozytorium i Zasad Lokalizacji Plików

---

## 1. Standard Struktury Katalogów Repozytorium

Poniższe drzewo przedstawia ustandaryzowaną strukturę projektu WEB FACTOR Studio 2.0. Wszystkie nowe pliki muszą być umieszczane ściśle według opisanych odpowiedzialności. Maksymalna dopuszczalna głębokość zagłębienia katalogów wynosi **5 poziomów**.

```
WEB FACTOR/
├── docs/
│   └── studio/                       ➔ Dokumentacja architektoniczna (00-99.md)
├── packages/
│   ├── builder-core/                 ➔ Niezmienny silnik dokumentu (BuilderDocument, Store)
│   └── runtime-engine/               ➔ Lekki silnik renderujący HTML/CSS (Iframe Runtime)
└── src/
    ├── app/                          ➔ Trasy i strony Next.js (App Router)
    ├── components/
    │   ├── builder/                  ➔ Komponenty interfejsu edytora wizualnego
    │   │   ├── canvas/               ➔ Ramka podglądu Iframe i nakładki Overlays
    │   │   ├── inspector/            ➔ Panel Inspectora i pola (fields/)
    │   │   ├── layers/               ➔ Drzewo warstw (Layers Tree)
    │   │   ├── selection/            ➔ Nakładki zaznaczania (Selection Overlays)
    │   │   ├── shell/                ➔ Paski narzędzi i układ edytora (BuilderShell)
    │   │   └── sidebar/              ➔ Lewy panel boczny i przeglądarki
    │   └── store/                    ➔ Renderery podglądu sekcji w sklepie
    └── lib/                          ➔ Moduły domenowe, pomocnicze i izolacja Supabase
```

---

## 2. Odpowiedzialność Katalogów i Zakazane Lokalizacje

* **Zakazane lokalizacje:** Brak tworzenia plików komponentów React bezpośrednio w root `src/` lub w tymczasowych katalogach poza wyznaczoną strukturą.
* **Zasady importów:** Obowiązek używania aliasów `@/lib/...` oraz `@/components/...` zamiast relatywnych ścieżek z wielokrotnym `../../..`.
