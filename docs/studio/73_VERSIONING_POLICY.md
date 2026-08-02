# Versioning Policy — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 73_VERSIONING_POLICY.md  
> **Status:** Governance Standard  
> **Zależności:** 67_BACKWARD_COMPATIBILITY_POLICY.md, 71_DOCUMENTATION_STYLE_GUIDE.md  
>  
> **Proces:** Polityka Wersjonowania Danych i Dokumentów (Semantic Versioning)

---

## 1. Cel Polityki Wersjonowania

Niniejszy dokument precyzuje uniwersalne reguły numeracji wersji (Semantic Versioning `MAJOR.MINOR.PATCH`) dla wszystkich zasobów architektonicznych, dokumentów specyfikacji, modeli domenowych, schematów migawek Runtime oraz eksportów projektowych w WEB FACTOR Studio 2.0.

---

## 2. Zasady Zwiększania Numerów Wersji (`MAJOR.MINOR.PATCH`)

```
   MAJOR . MINOR . PATCH
     │       │       │
     │       │       └─ Poprawki literówek, wyjaśnienia w tekście, drobne refaktory
     │       └───────── Nowe opcjonalne właściwości, rozszerzenia niewpływające na wsteczną kompatybilność
     └───────────────── Breaking changes: zmiana struktury wymuszająca transformację migawki
```

### 2.1 Wersjonowanie Schematów Dokumentu JSON (`schemaVersion`)
* **MAJOR (+1.0.0):** Zmiana struktury usuwająca istniejące pola lub zmieniająca typ wymagający napisania dedykowanego migratora.
* **MINOR (+0.1.0):** Dodanie nowych opcjonalnych pól (np. dodanie wsparcia dla nowego subsystemu `borderTopLeftRadius`).
* **PATCH (+0.0.1):** Poprawki formatowania lub wartości domyślnych nie wpływające na poprawność parsera.

### 2.2 Wersjonowanie Specyfikacji i ADR
* **MAJOR:** Przebudowa koncepcji architektonicznej subsystemu (np. zastąpienie szyny komend nowym wzorcem).
* **MINOR:** Dodanie nowych sekcji w specyfikacji lub opisanie dodatkowych właściwości z fazy Future Scope.
* **PATCH:** Poprawka błędów formatowania lub doprecyzowanie definicji słownikowych.

### 2.3 Wersjonowanie Eksportów Projektu (HTML/CSS Export Engine)
* Eksportowane pliki produkcyjne zawierają w sekcji meta wersję generatora:
  ```html
  <meta name="generator" content="WEB FACTOR Studio v2.4.1">
  ```
