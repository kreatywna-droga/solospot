---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.1
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_1_FOUNDATION/DEVELOPMENT_CONSTITUTION.md
- docs/review/SPRINT_1_FOUNDATION/04_Service_Boundaries.md
---

# SPRINT 1: FOUNDATION IMPLEMENTATION
## Zadanie 10 — Implementation Roadmap
*Plan sekwencyjny wdrażania modułów platformy w kolejności minimalizującej ryzyko integracyjne (Platform Core → Runtime → Provisioning → Commerce → Dashboard → Mission Control).*

---

### 1. Graf Kolejności Implementacji (Implementation Flow)

Wdrażamy platformę od środka na zewnątrz (od jądra systemowego do interfejsu użytkownika), co gwarantuje stabilność kontraktów przed pisaniem widoków:

```text
  1. Platform Core (Baza, RLS, Typy globalne, Shared Kernel)
         │
         ▼
  2. Runtime (Edge Middleware, Host Resolver, Tenant Context)
         │
         ▼
  3. Provisioning Engine (Saga Orchestrator, Webhook Receiver, Demo installer)
         │
         ▼
  4. Commerce Engine (Koszyk, Checkout, Bramki płatności ACL)
         │
         ▼
  5. Partner Dashboard (Panel zarządzania sklepem, Server Actions)
         │
         ▼
  6. Mission Control (Panel administracyjny floty, DLQ, Impersonacja)
```

---

### 2. Szczegółowy Opis Fazy Uruchomieniowej (Implementation Phases)

#### Faza 1: Platform Core
* **Zakres:** Inicjalizacja schematu Supabase Postgres (tabele `stores`, `products`, `store_members`, `store_modules`), konfiguracja polityk RLS opartych na rolach. Utworzenie struktury katalogowej `src/shared/` (types, errors, events).
* **Kryteria Akceptacji (Verification):** Poprawne przejście testów lintera sprawdzających brak zależności kołowych. Wszystkie tabele posiadają włączone RLS.
* **Priorytet:** KRYTYCZNY (Bloker dla wszystkich pozostałych modułów).

#### Faza 2: Runtime
* **Zakres:** Implementacja Edge Middleware klasyfikującego żądania. Kod detekcji hosta (Host Resolver) z warstwą cache KV. Parser i walidator `TenantContext` przy użyciu schematu Zod z zamrażaniem stanu (`Object.freeze`).
* **Kryteria Akceptacji (Verification):** Czas wykonania Middleware w teście obciążeniowym (P95) wynosi `< 5 ms`. Każde żądanie emituje poprawne zdarzenie `RequestStarted` i `TenantResolved`.

#### Faza 3: Provisioning Engine
* **Zakres:** Utworzenie endpointu webhooka z weryfikacją klucza idempotencji. Implementacja rejestru kroków `ProvisioningStep[]` z obsługą Sagi (metody `execute()` / `compensate()`). Konfiguracja instalatora pakietów demonstracyjnych.
* **Kryteria Akceptacji (Verification):** Dwukrotne wysłanie tego samego webhooka nie powoduje zdublowania sklepu w bazie. Awaria kroku instalacji demo poprawnie cofa transakcję i usuwa tymczasowego użytkownika z Auth.

#### Faza 4: Commerce Engine
* **Zakres:** Budowa domenowych struktur koszyka i logiki kalkulatora cen. Wdrożenie warstwy Anti-Corruption Layer (ACL) z adapterem dla bramki 1koszyk.
* **Kryteria Akceptacji (Verification):** Testy jednostkowe potwierdzające poprawność obliczania podatków i zniżek. Brak bezpośredniego importu SDK płatności wewnątrz logiki domenowej koszyka.

#### Faza 5: Partner Dashboard & Mission Control
* **Zakres:** Budowa widoków zarządczych. Server Actions połączone z Application Layer. W Mission Control wdrożenie panelu telemetrii, wglądu w Dead Letter Queue (DLQ) oraz modułu bezpiecznej impersonacji.
* **Kryteria Akceptacji (Verification):** Każda akcja impersonacji zapisuje rekord audytowy w bazie danych. Interfejsy nie posiadają bezpośrednich zapytań SQL ani Supabase SDK (całość idzie przez API i Server Actions).
