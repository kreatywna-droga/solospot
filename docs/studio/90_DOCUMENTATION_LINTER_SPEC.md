# Documentation Linter Specification — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 90_DOCUMENTATION_LINTER_SPEC.md  
> **Status:** Automation Specification  
> **Zależności:** 71_DOCUMENTATION_STYLE_GUIDE.md, 76_DOCUMENTATION_AUDIT_CHECKLIST.md  
>  
> **Proces:** Specyfikacja Lintera Dokumentacji Architektonicznej (Doc Linter Specification)

---

## 1. Cel Specyfikacji Lintera Dokumentacji

Dokument definiuje architekturę i reguły walidacyjne dla automatycznego narzędzia Lintera Dokumentacji (Doc Linter), które weryfikuje poprawność składniową, strukturalną oraz spójność linków w plikach `.md` w katalogu `docs/studio/`.

---

## 2. Reguły Walidacyjne Lintera (Linter Validation Rules)

### 2.1 Numeracja i Nazewnictwo Plików
* **Reguła `LINT-01`:** Plik musi rozpoczynać się od dwucyfrowego prefiksu z zakresu `00`–`99` oraz nazwy w konwencji `SCREAMING_SNAKE_CASE.md`.

### 2.2 Blok Metadanych
* **Reguła `LINT-02`:** W pierwszych 10 liniach dokumentu wymagana jest obecność bloku metadanych w formacie:
  ```markdown
  > **Epic:** ...
  > **Dokument:** ...
  > **Status:** [Draft|Review|Approved|Deprecated]
  ```

### 2.3 Obowiązkowe Sekcje i Linki
* **Reguła `LINT-03`:** Walidacja obecności nagłówka H1 matching tytułowi pliku.
* **Reguła `LINT-04`:** Sprawdzenie integralności odnośników wewn. `file:///` oraz względnych do innych dokumentów w `docs/studio/` (wykrywanie 404 / martwych linków).
* **Reguła `LINT-05`:** Weryfikacja spójności numeracji ADR podanych w tekście z centralnym indeksem `77_ADR_INDEX.md`.
