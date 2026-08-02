# Backward Compatibility Policy — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 67_BACKWARD_COMPATIBILITY_POLICY.md  
>  **Status:** Governance Standard  
> **Zależności:** 02_BUILDER_CORE.md, 65_ARCHITECTURE_PRINCIPLES.md  
>  
> **Proces:** Polityka Wstecznej Kompatybilności i Wersjonowania Danych

---

## 1. Cel Polityki Wstecznej Kompatybilności

WEB FACTOR Studio 2.0 gwarantuje, że jakakolwiek aktualizacja edytora, wprowadzenie nowych subsystemów lub zmiana wewnętrznych typów **nigdy nie spowoduje awarii istniejących projektów użytkowników ani nie uszkodzi zapisanych dokumentów JSON**.

---

## 2. Zasady Kompatybilności według Obszarów

### 2.1 Kompatybilność Dokumentów i Wersjonowanie Schematów
* Każdy plik JSON zapisany przez edytor posiada nagłówek wersji schematu:
  ```json
  {
    "schemaVersion": "2.1.0",
    "documentId": "doc_123",
    "pages": [...]
  }
  ```
* Edytor wspiera **Backward Reading (Odczyt Starszych Wersji)**: Nowsza wersja edytora bez problemu otwiera pliki stworzone w wersji starszej, stosując domyślne wartości dla nowo dodanych pól.

### 2.2 Kompatybilność Modelu Domenowego i JSON
* **Tylko Dodawanie Pola (Add-only Policy):** Istniejące polów modeli domenowych nie wolno usuwać ani zmieniać ich nazwy. Nowe właściwości dodawane są jako opcjonalne (`propName?: Type`).
* **Ignorowanie Nieznanych Pol (Tolerance Reader):** Parser JSON igngsuje nieznane klucze zamiast zgłaszać błąd uniemożliwiający otwarcie projektu.

### 2.3 Kompatybilność Silnika Runtime i Migawki (Runtime Snapshot)
* Wygenerowane strony produkcyjne i migawki stacji roboczych są samowystarczalne.
* Zmiany w klasach CSS lub nazwach zmiennych w nowszych wersjach edytora nie modyfikują opublikowanych wcześniej serwisów bez ponownego wyklikania akcji `Publish`.

### 2.4 Kompatybilność Eksportu HTML / CSS
* Strony wyeksportowane do czystego kodu HTML/CSS muszą zachować identyczny wygląd niezależnie od wersji parsera, na którym zostały wygenerowane.
