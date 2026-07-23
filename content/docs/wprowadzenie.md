---
title: "Wprowadzenie do SoloSpot"
description: "Czym jest platforma SoloSpot i jak zacząć z niej korzystać? Poznaj podstawy nowej generacji e-commerce."
category: "Podstawy"
order: 1
---

Witamy w **SoloSpot** – najbardziej elastycznej platformie do sprzedaży cyfrowych produktów. 
Nieważne, czy jesteś twórcą szablonów, programistą sprzedającym skrypty, czy oferujesz dostępy premium do swojego oprogramowania. SoloSpot zapewni Ci pełne środowisko.

## Dlaczego SoloSpot?

Większość platform (jak Shopify czy WooCommerce) została stworzona z myślą o produktach fizycznych. Sprzedaż e-booka czy paczki z kodem wymagała tam instalacji skomplikowanych wtyczek, które często ulegały awarii i spowalniały stronę.

W SoloSpot postawiliśmy na szybkość i niezawodność, od samego początku optymalizując architekturę pod **produkty cyfrowe**.

> **Pro Tip:** Zawsze korzystaj ze zintegrowanych systemów płatności wewnątrz Panelu Sklepu, aby maksymalizować zysk.

## Główna architektura

Platforma dzieli się na dwa odseparowane światy:

1. **Mission Control (Panel Administracyjny)** - To serce całej platformy. Z tego miejsca właściciel ma dostęp do globalnych ustawień, planów abonamentowych (Tenantów) i statystyk.
2. **Dashboard (Panel Sklepu)** - Unikalne centrum dowodzenia dla każdego zarejestrowanego sprzedawcy. Tutaj użytkownicy zarządzają swoimi cyfrowymi dobrami.

### Sklepy i Tenanci (Multitenancy)

Platforma oparta jest o architekturę *Multitenancy*. Oznacza to, że pojedyncza instalacja aplikacji obsługuje wielu niezależnych sprzedawców (Tenantów). 

Każdy Tenant posiada:
* Własną przestrzeń na bazę danych (izolacja za pomocą RLS w Supabase)
* Własną poddomenę w ekosystemie SoloSpot
* Indywidualną konfigurację sklepu i koszyka

Dzięki takiemu rozwiązaniu, jeden aktualizowany kod zapewnia nowości dla tysięcy sklepów jednocześnie.

## Najbliższe kroki

Aby rozpocząć pracę ze swoim pierwszym sklepem, przejdź do zakładki [Konfiguracja Sklepu](/docs/sklepy). Tam dowiesz się, jak skonfigurować branding i dodać pierwszy produkt do oferty.
