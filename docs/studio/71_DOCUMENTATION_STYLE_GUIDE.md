# Documentation Style Guide — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 71_DOCUMENTATION_STYLE_GUIDE.md  
> **Status:** Governance Standard  
> **Zależności:** 29_STUDIO_ENGINEERING_GUIDELINES.md, 65_ARCHITECTURE_PRINCIPLES.md  
>  
> **Proces:** Standard Tworzenia i Utrzymania Dokumentacji Architektonicznej

---

## 1. Cel Standardu Dokumentacji

Niniejszy poradnik stylu (Style Guide) definiuje oficjalne zasady tworzenia, formatowania, wersjonowania oraz aktualizacji dokumentacji technicznej i architektonicznej w projekcie WEB FACTOR Studio 2.0. Wszystkie nowe dokumenty wprowadzane do katalogu `docs/studio/` muszą być bezwzględnie zgodne z poniższymi regułami.

---

## 2. Standard Nazewnictwa i Numeracji Plików

### 2.1 Format Nazwy Pliku
Wszystkie pliki w katalogu `docs/studio/` używają dwucyfrowego prefiksu numerycznego oraz nazwy w formacie `SNAKE_CASE_UPPERCASE` lub `SCREAMING_SNAKE_CASE` z rozszerzeniem `.md`:
```
[DwieCyfry]_[NAZWA_DOKUMENTU].md
```
* Przykłady poprawne: `51_RADIUS_PROPERTY_SPECIFICATION.md`, `65_ARCHITECTURE_PRINCIPLES.md`.
* Przykłady niepoprawne: `radius-spec.md`, `51_radius.markdown`, `Draft_Radius.md`.

### 2.2 Rezerwacja Zakresów Numeracji

| Zakres Numeryczny | Kategoria Dokumentacji | Przykłady |
|-------------------|------------------------|-----------|
| `00` – `30` | Architektura Podstawowa i Wizja Studio | `00_STUDIO_VISION.md`, `01_STUDIO_ARCHITECTURE.md` |
| `31` – `49` | Subsystemy Layout, Grid, Overflow i Milestone v1/v2 | `31_LAYOUT_PROPERTY_SPECIFICATION.md`, `44_OVERFLOW...` |
| `50` – `58` | Subsystemy Border, Radius oraz Canvas Completion | `50_BORDER...`, `51_RADIUS...`, `53_CANVAS...` |
| `59` – `64` | Sprint Q1 — Quality Framework | `59_BUILDER_SUBSYSTEM_TEMPLATE.md`, `60_SUBSYSTEM...` |
| `65` – `70` | Sprint Q2 — Governance & Evolution | `65_ARCHITECTURE_PRINCIPLES.md`, `68_PERFORMANCE...` |
| `71` – `80` | Sprint Q3 — Platform Governance & Ecosystem | `71_DOCUMENTATION_STYLE_GUIDE.md`, `75_GLOSSARY...` |
| `99` | Lista Wdrożeniowa i Zbiorcza | `99_IMPLEMENTATION_CHECKLIST.md` |

---

## 3. Obowiązkowa Nagłówek i Metadane Dokumentu

Każdy dokument rozpoczyna się od nagłówka poziomu H1 oraz bloku metadanych w formacie cytatu Markdown (`>`):

```markdown
# [Tytuł Dokumentu]

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** [NazwaPliku.md]  
> **Status:** [Draft / Review / Approved / Deprecated]  
> **Zależności:** [Lista powiązanych dokumentów]  
>  
> **Proces:** [Krótki opis celu i fazy]
```

### Dopuszczalne Statusy Dokumentu:
1. `Draft`: Dokument w trakcie tworzenia, niezweryfikowany architektonicznie.
2. `Review`: Dokument gotowy do przeglądu integracyjnego.
3. `Approved`: Dokument zaakceptowany, stanowiący podstawę do wdrożenia.
4. `Deprecated`: Dokument zastąpiony przez nowszą specyfikację (zawiera odnośnik do nowego dokumentu).

---

## 4. Zasady Formatowania Kodu i Diagramów

### 4.1 Bloki Kodu (Code Blocks)
* Wszystkie fragmenty kodu, interfejsów lub JSON muszą posiadać jawne oznaczenie języka (`typescript`, `json`, `css`, `markdown`).
* Kody stanowiące przykłady muszą być zwięzłe i poprawne pod kątem typowania TypeScript.

### 4.2 Schematy i Diagramy
* Przebiegi procesów i struktury warstwowe przedstawiane są za pomocą schematów ASCII-Art w blokach kodu lub diagramów Mermaid.
