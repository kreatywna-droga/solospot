# WEB FACTOR - Architecture Specification

## Główne Założenie
Zgodnie z Playbookiem, WEB FACTOR działa w oparciu o *Single Engine Architecture* (One Engine Philosophy). Nie utrzymujemy 20 różnych systemów (Booking, Restaurant, etc.), lecz rozwijamy JEDEN zunifikowany ekosystem, który definiuje swój kształt za pomocą danych.

## Podział Architektury (Warstwy)

### 1. Platform Core
Wspólne fundamenty dla wszystkiego, co dzieje się na serwerze i w bazie danych.
- **Identity & Auth:** Supabase Auth
- **Tenant Management (Provisioning):** Izolacja na poziomie RLS
- **Event Bus:** Nasłuchiwanie na płatności (1koszyk webhook)

### 2. Commerce Engine
Jeden, uniwersalny silnik dla wszystkich sklepów.
- **Dynamic Routing:** Łapanie `/[store_slug]/[product_id]`
- **Global Cart:** Koszyk zakupowy niezależny od branży
- **Checkout Flow:** Uniwersalny proces składania zamówienia

### 3. Profile System
System tworzenia sklepów przez konfigurację. "Sklep" to instancja rekordu w bazie, a "Profile" (np. Fashion, Electronics) to tylko gotowy zestaw modułów i domyślnych danych.

### 4. Theme System
Całkowite oddzielenie logiki od wyglądu.
- Wszystkie komponenty UI renderują się na podstawie JSON/Konfiguracji.
- Brak logiki biznesowej w kodzie wizualnym.

### 5. Module System
Zestaw funkcji wielokrotnego użytku ładowanych na życzenie (Feature Flags). Zamiast pisać funkcję dla jednego klienta, tworzymy moduł (np. *Product Reviews*), który można włączyć na dowolnym innym sklepie za pomocą kliknięcia w Mission Control.
