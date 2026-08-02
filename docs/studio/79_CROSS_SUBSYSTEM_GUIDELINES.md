# Cross-Subsystem Collaboration Guidelines — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 79_CROSS_SUBSYSTEM_GUIDELINES.md  
> **Status:** Governance Standard  
> **Zależności:** 65_ARCHITECTURE_PRINCIPLES.md, 74_MODULE_DEPENDENCY_GUIDE.md  
>  
> **Proces:** Zasady Współpracy i Komunikacji Pomiędzy Subsystemami

---

## 1. Zasady Współpracy Pomiędzy Subsystemami

Wszystkie subsystemy Buildera (np. Layout, Grid, Overflow, Border, Radius, Background, Typography) stanowią niezależne moduły domenowe, które współdzielą wyłącznie centralne szyny danych:

```
Subsystem A ───┐
Subsystem B ───┼───► Central Store / Command Bus ───► Runtime / Canvas
Subsystem C ───┘
```

---

## 2. Wymagania Integracyjne dla Głównych Modułów

### 2.1 Rejestr (Registry)
* Subsystemy rejestrują swoje pola i typy wyłącznie deklaratywnie w `propertyFieldRegistry`.
* Brak możliwości modyfikacji zachowania innych zaimplementowanych pól w Rejestrze.

### 2.2 Silnik Podglądu (Runtime & Canvas)
* Silnik Runtime nasłuchuje zdarzeń podmieniających CSS (`STYLE_PATCH`) generowanych na podstawie wyjścia funkcji `XXToCSS()`.
* Żaden subsystem nie ingeruje bezpośrednio w strukturę drzewa DOM ramki podglądu Iframe.

### 2.3 Stos Historii (HistoryStack)
* Wszystkie akcje subsystemu modyfikują stan dokumentu via `UPDATE_PROPS`, gwarantując natychmiastowe wsparcie dla Undo/Redo bez pisania dedykowanego kodu obsługi historii.

---

## 3. Bezwzględnie Zakazane Zależności (Forbidden Dependencies)

1. ❌ **Zakaz bezpośrednich odwołań między subsystemami:** Pole `BorderField` nie może bezpośrednio importować lub edytować stanu pola `FlexField`.
2. ❌ **Zakaz modyfikacji modeli wewnątrz komponentów UI:** Komponenty Inspectora nie modyfikują obiektów w pamięci bez wysłania komendy Reducera.
3. ❌ **Zakaz zależności cyklicznych:** Warstwa modeli domenowych nie posiada jakichkolwiek zależności od warstwy podglądu Canvas czy komponentów React.
