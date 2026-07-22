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
- Development Sprint 5
---

# SPRINT 0: DISCOVERY
## Zadanie 7 — Mission Control
*Projekt panelu operatora platformy WEB FACTOR (Centrum Operacyjne).*

Mission Control nie jest widoczny dla zwykłych Partnerów. To dedykowana ścieżka `/mission-control` przeznaczona tylko dla administratorów systemu WEB FACTOR.

### Domeny Operacyjne Mission Control
Panel zarządzania został podzielony na odrębne domeny funkcyjne, aby ułatwić długofalowe skalowanie operacji platformowych:

1. **Fleet Operations (Zarządzanie Flotą Sklepów)**
   - Lista wszystkich aktywnych, zawieszonych i prowizjonowanych sklepów.
   - Kolumny: ID Instancji | Właściciel | Nazwa Sklepu | Wersja Runtime | Status
   - Akcje: "Odwiedź Sklep", "Zawieś/Odwieś", "Wymuś aktualizację".
2. **Customer Success & Impersonation (Wsparcie Partnera)**
   - Moduł ticketów wsparcia połączony z formularzami kontaktowymi Partnerów.
   - **Bezpieczny mechanizm impersonacji:** Umożliwia administratorowi zalogowanie się w kontekście wybranego Partnera. Każda sesja impersonacji wymaga podania powodu biznesowego, rejestruje czas rozpoczęcia i zakończenia oraz zapisuje zdarzenie do audit logs w celu zachowania standardów bezpieczeństwa.
3. **Billing Operations (Finanse i Rozliczenia)**
   - Monitorowanie statusów odnawialnych subskrypcji i integracja z bramkami płatniczymi (1koszyk, Stripe).
   - Automatyczne powiadomienia i restrykcje dla nieopłaconych kont.
4. **Platform Health (Monitoring i Metryki)**
   - Podgląd obciążenia baz danych Supabase i usług API.
   - Monitorowanie całkowitego wolumenu zamówień i obrotów (Total GMV).
5. **Security Center (Bezpieczeństwo)**
   - Zarządzanie kluczami API, weryfikacja certyfikatów SSL domen własnych Partnerów.
6. **Package Registry (Katalog Modułów i Motywów)**
   - Centralne repozytorium pakietów dopuszczonych do instalacji w silniku.
7. **Deployments (Wydania i Aktualizacje)**
   - Zarządzanie i wdrażanie nowych wersji `Commerce Engine` na flotę sklepów.
8. **Analytics (Analityka Globalna)**
   - Metryki biznesowe platformy (MRR, Churn Rate, TTFV/TTB).
