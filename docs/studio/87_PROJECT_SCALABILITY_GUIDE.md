# Project Scalability Guide — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 87_PROJECT_SCALABILITY_GUIDE.md  
> **Status:** Governance Standard  
> **Zależności:** 15_PERFORMANCE.md, 68_PERFORMANCE_BUDGET.md  
>  
> **Proces:** Przewodnik Skalowania Architektury i Wydajności Projektu

---

## 1. Strategia Skalowania Systemu Buildera

Poradnik ten określa wytyczne inżynieryjne pozwalające na bezproblemowe skalowanie projektu WEB FACTOR Studio przy wzroście liczby subsystemów (od 5 do 30+), komponentów (od 10 do 200+) oraz właściwości edytowalnych.

---

## 2. Wymiary Skalowania i Wzorce Rozwiązania

### 2.1 Skalowanie Liczby Subsystemów
* **Wzorzec:** Każdy subsystem jest samowystarczalnym modułem w formacie 8-fazowym. Dodanie 20 kolejnych subsystemów (Background, Typography, Shadow, Effects) nie zwiększa złożoności istniejącego kodu źródłowego dzięki deklaratywnej rejestracji w `propertyFieldRegistry`.

### 2.2 Skalowanie Liczby Komponentów i Właściwości
* **Wzorzec:** Leniwe ładowanie schematów (Lazy Loading). Rejestr `ComponentRegistry` wyszukuje schematy w czasie $O(1)$ przy użyciu tabeli mapującej (`Map<string, ComponentDescriptor>`).

### 2.3 Skalowanie Wydajności Silnika Runtime
* **Wzorzec:** Zastąpienie generowania pełnego kodu HTML w czasie rzeczywistym techniką **Aplikacji Łatek CSS (Style Patching)**. Zmiana promienia lub koloru tła aktualizuje tylko 1 linię w nagłówku `<style>` Iframe zamiast ponownego renderowania drzewa DOM.

### 2.4 Skalowanie Wydajności Obszaru Roboczego Canvas
* **Wzorzec:** **Wirtualizacja Widoku (Viewport Virtualization)**. Nakładki zaznaczenia i wyliczenia prostokątów ograniczeń (`DOMRect`) wykonywane są wyłącznie dla sekcji widocznych w oknie przeglądarki użytkownika.

### 2.5 Skalowanie Dokumentacji i ADR
* **Wzorzec:** Przestrzeganie zakresów numerycznych z `71_DOCUMENTATION_STYLE_GUIDE.md` oraz indeksowanie decyzji w centralnej macierzy `62_BUILDER_TRACEABILITY_MATRIX.md`.
