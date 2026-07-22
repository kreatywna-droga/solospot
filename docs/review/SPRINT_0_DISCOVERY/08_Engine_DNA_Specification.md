---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.2
Last Review: 2026-07-09
Freeze Version: 1.0
Depends On:
- 00_WEB_FACTOR_PLAYBOOK.md
Blocks:
- Architecture Specification
- Development Sprint 4 (Store Engine)
---

# SPRINT 0: DISCOVERY
## Zadanie 8 — Engine DNA Specification
*Fundamentalna specyfikacja Single Engine Architecture (SEA).*

### 1. Niezmienne (Immutable)
- **Commerce Engine (Routing, Koszyk, Autoryzacja, RLS):** Nie wolno zmieniać kodu pod konkretnego klienta.
- **Baza Danych (Struktura):** Taka sama dla każdego.
- **API i Webhooki:** Ustandaryzowane dla całej platformy.

### 2. Konfigurowalne (Configurable)
- **Store Profile (Profil Sklepu):** Np. "Fashion Premium", "Electronic Standard". Narzuca zbiór modułów.
- **Modules (Funkcje dodatkowe):** Instagram Feed, Cross-sell, Zaawansowane filtry. Włączane flagami.
- **Configuration (JSON/DB):** Typ waluty, stawki VAT, metody płatności, limity darmowej dostawy.

### 3. Wizualne (Thematic)
- **Theme:** Pliki CSS / Tailwind Config odpowiadające za siatkę, typografię, promienie zaokrągleń. Zmiana Theme = zmiana designu, nie logiki.
- **Branding:** Logotypy, palety HSL.

### 4. Zakazane Praktyki (Forbidden Rules)
- **Forbidden #1:** Używanie w kodzie `if (store.type === 'fashion')`. Cały kod musi opierać się o Capability (`if (store.features.hasSizes)`).
- **Forbidden #2:** Nigdy nie stosujemy `if (plan === 'PRO')` w logice biznesowej. Zamiast tego badamy uprawnienia i flagi możliwości (`Capability`, `Permission`, `Feature Flag`, `Package`). Plan abonamentowy jest jedynie mapowaniem marketingowym na zbiór aktywnych możliwości.
- **Forbidden #3:** Komponenty wizualne i motywy (`Theme`) nie mogą bezpośrednio modyfikować ani wpływać na logikę biznesową silnika (`Engine`). Komunikacja odbywa się wyłącznie przez zdefiniowane API.
- **Forbidden #4:** Kopiowanie kodu aplikacji lub pojedynczych komponentów w celu zmodyfikowania ich pod jednego, wybranego Partnera ("Store A"). Wszystkie komponenty są współdzielone globalnie; zróżnicowanie realizujemy wyłącznie poprzez dynamiczne właściwości konfiguracyjne.
- **Forbidden #5:** Kopiowanie kodu silnika, aby stworzyć nową branżę (tzw. "Copy-Paste Forking").
