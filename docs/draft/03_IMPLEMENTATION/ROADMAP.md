# WEB FACTOR Enterprise Documentation
## 03. IMPLEMENTATION
### ROADMAP.md (Wersja: 1.0 - Locked)

---

## FAZA 1: DOCUMENTATION SPRINTS

### Documentation Sprint 0 — Discovery (Zatwierdzony i Zamrożony)
*Cel: Zrozumienie, zaplanowanie, zamrożenie dokumentacji i przygotowanie twardego gruntu pod migrację z "Na Dobranoc".*
* [x] **Zadanie 1:** Code Audit (Inwentaryzacja obecnego stanu)
* [x] **Zadanie 2:** Transformation Matrix (Przypisanie statusów: Reuse, Refactor, Replace, Remove)
* [x] **Zadanie 3:** Folder Tree 2.0 (Zaprojektowanie docelowego drzewa projektu)
* [x] **Zadanie 4:** Database v2 (Domenowy model danych multi-tenant RLS)
* [x] **Zadanie 5:** Customer Journey (Pełny cykl życia B2B Partnera)
* [x] **Zadanie 5A:** Time To Business Flow (Operacyjny flow wdrożenia B2B2C)
* [x] **Zadanie 6:** Architecture Principles (Konstytucja inżynieryjna platformy)
* [x] **Zadanie 7:** Mission Control (Projekt domen operacyjnych panelu)
* [x] **Zadanie 8:** Engine DNA Specification (Forbidden Rules i mutowalność)
* [x] **Zadanie 9:** Glossary (Słownik pojęciowy projektu)

### Documentation Sprint 1 — Foundation (Zatwierdzony i Zamrożony)
*Cel: Zaprojektowanie i zamrożenie kontraktów architektonicznych platformy (Request Flow, Tenant Context, Event Model, Service Boundaries, Provisioning, Package Runtime).*
* [x] **Zadanie 1:** Platform Core Architecture (17-etapowy potok przetwarzania żądań)
* [x] **Zadanie 2:** Runtime Request Flow (Edge Middleware, detekcja hostów, cache)
* [x] **Zadanie 3:** Tenant Context (Zod Schema, immutable context)
* [x] **Zadanie 3a:** Runtime Event Model (Asynchroniczna szyna zdarzeń, idempotentność)
* [x] **Zadanie 4:** Service Boundaries (Podział odpowiedzialności i Boundary Violations)
* [x] **Zadanie 5:** Provisioning Engine (Maszyna stanów wdrożenia z Saga Rollback)
* [x] **Zadanie 6:** Package Runtime (Weryfikacja manifestów i zależności DAG)
* [x] **Zadanie 7:** Runtime Composition Engine (RuntimeSnapshot i cache LRU)
* [x] **Zadanie 8:** Rendering Pipeline (RSC Streaming i Error Boundaries)
* [x] **Zadanie 9:** Migration Strategy (Katalogowanie kodu i strategie migracji)
* [x] **Zadanie 10:** Implementation Roadmap (Sekwencja wdrażania modułów)
* [x] **Zadanie 11:** Sprint Review Specification (Kryteria jakościowe i audytowe)
* [x] **Zadanie 12:** Implementation Plan (Monorepo skeleton i bootstrap test)

### 🔒 DOCUMENTATION FREEZE v1.0 🔒
*Oficjalne zamrożenie ustaleń z fazy dokumentacyjnej. Zmiany architektoniczne wymagają zatwierdzonego w katalogu `docs/adr/` dokumentu ADR.*

---

## FAZA 2: DEVELOPMENT SPRINTS

### Development Sprint 1 — Foundation Architecture & Plan
*Cel: Zdefiniowanie fundamentów architektonicznych oraz planu Monorepo.*
* [x] **Zadanie 1:** Szkielet monorepo, konfiguracja TypeScript i Vitest.
* [x] **Zadanie 2:** Przygotowanie infrastruktury dokumentacyjnej i procedur zatwierdzania specyfikacji kontraktowej.

### Development Sprint 2 — Platform Core Runtime Foundation
*Cel: Uruchomienie platformy, obsługa konfiguracji, szyny zdarzeń, loggera oraz rozwiązywanie tenantów.*
* [x] **Zadanie 1:** Implementacja `PlatformConfig`, `PlatformLogger`, `ErrorEngine` oraz `DiagnosticsRegistry`.
* [x] **Zadanie 2:** Wdrożenie asynchronicznej szyny zdarzeń `PlatformEventBus`.
* [x] **Zadanie 3:** Implementacja rozruchu `RuntimeBootstrap` z maszynami stanu i `TenantResolver` z cache L1/L2.

### Development Sprint 3 — Runtime Composition & Store Runtime Engine
*Cel: Silnik składania dynamicznego środowiska sklepu oraz zarządzanie cyklem życia.*
* [x] **Zadanie 1:** `RuntimeCompositionEngine` - rozstrzyganie zależności pakietów (DAG), priorytety capability i tworzenie immutable `RuntimeSnapshot`.
* [x] **Zadanie 2:** `StoreRuntimeEngine` - stany cyklu życia środowiska (`CREATED` -> `LOADING` -> `READY` -> `ACTIVE` -> `DISPOSED`).

### Development Sprint 4 — Commerce Runtime (Backend Engine)
*Cel: Kompletny silnik transakcyjny bez twardych zależności od frameworka renderującego.*
* [x] **Zadanie 1:** `ProductDomain` i `CartRuntime` (koszyk zakupów z całkowitą precyzją groszową).
* [x] **Zadanie 2:** `CheckoutFlow` i `PaymentEngine` (intent, adaptery Mock/Stripe/P24 z maszyną stanów płatności).
* [x] **Zadanie 3:** `OrderProcessingEngine` (cykl życia zamówienia, webhooki) oraz `CustomerAccountEngine` (konta i adresy).
* [x] **Zadanie 4:** `InventoryEngine` (rezerwacja, zatwierdzanie/zwolnienia stanów magazynowych).
* [x] **Zadanie 5:** `ShippingEngine` (przewoźnicy DHL/InPost, etykiety) oraz `TaxEngine` (kalkulator VAT, regionalizacja PL/DE/FR i zwolnienia).

### Development Sprint 5 — Store Experience Layer
*Cel: Renderowanie, szablony, koszyk UI i checkout dla klienta końcowego.*
* [x] **Zadanie 1: Theme Runtime Engine:** System motywów, manifest, `ThemeResolver` z RLS i `ThemeRuntime`.
* [x] **Zadanie 2: Renderer Engine:** Silnik kompilacji szablonów do wynikowego kodu HTML/RSC.
* [x] **Zadanie 3: Storefront Runtime:** Dynamiczne serwowanie strony głównej i katalogu produktów pod domenami tenantów.
* [x] **Zadanie 4: Checkout UI:** Formularz płatności i integracja interfejsu koszyka.
* [x] **Zadanie 5: Customer Dashboard:** Panel profilu klienta końcowego.
* [x] **Zadanie 6: Mission Control:** Pierwsza wersja panelu floty dla administratorów SaaS.

### Development Sprint 6 — Operational Readiness
*Cel: Integracja webhooków, idempotencji oraz runtime'u płatności i zamówień.*
* [x] **Zadanie 1: Webhook Infrastructure:** Podpisywanie i weryfikacja HMAC, wyodrębnianie Correlation ID oraz Tenant ID.
* [x] **Zadanie 2: Persistent Idempotency:** Wdrożenie SupabaseIdempotencyStore z blokowaniem współbieżności i wykrywaniem konfliktów unikalności.
* [x] **Zadanie 3: Payment Runtime Integration:** Mapowanie statusów i integracja z bramką płatności 1Koszyk.
* [x] **Zadanie 4: Order Runtime Integration:** Potwierdzanie płatności i automatyczna aktywacja licencji przy statusie COMPLETED.
* [x] **Zadanie 5: Event & Audit Integration:** Publikacja zdarzeń w szynie PlatformEventBus oraz zapisy audytowe do osi czasu.

### Development Sprint 7 — Production Hardening & First Tenant ✅ COMPLETE
*Cel: Uruchomienie infrastruktury produkcyjnej, walidacja bazy danych i wdrożenie pierwszego dzierżawcy.*
* [x] **Zadanie 1 (Sprint 7.1): Deployment Foundation** — Konfiguracja sekretów, wdrożenie endpointu `/api/health` i weryfikacja.
* [x] **Zadanie 2 (Sprint 7.2): Database Reality Layer** — Migracje tabel, walidacja schematów i automatyczne testy RLS/izolacji.
* [x] **Zadanie 3 (Sprint 7.3): First Real Tenant Flow (Golden Flow)** — Specyfikacja kontraktu przepływu, silnik `TenantProvisioningEngine` i test integracyjny.
* [x] **Zadanie 4 (Sprint 7.4): Observability** — Oś czasu telemetrii, Correlation ID tracing, 4 trasy API Mission Control.
* [x] **Zadanie 5 (Sprint 7.5): Security Hardening** — Walidacja środowiska (fail-fast), RBAC, Rate Limiting (sliding window), audyt zdarzeń Security.* w Timeline.

### Development Sprint 8 — Production Tenant #1 (Planowany ⏳)
*Cel: Uruchomienie pierwszego prawdziwego dzierżawcy w środowisku produkcyjnym.*
* [ ] **Zadanie 1 (Sprint 8.1): Production Environment Setup** — Wdrożenie aplikacji na Vercel + Supabase produkcja, skonfigurowanie sekretów i migracji.
* [ ] **Zadanie 2 (Sprint 8.2): First Tenant Onboarding** — Rejestracja, konfiguracja sklepu, integracja 1Koszyk webhook produkcyjny.
* [ ] **Zadanie 3 (Sprint 8.3): Mission Control UI** — Interfejs operatora platformy: panel tenantów, oś czasu, zarządzanie zamówieniami.
* [ ] **Zadanie 4 (Sprint 8.4): End-to-End Production Validation** — Weryfikacja Golden Flow w środowisku produkcyjnym z prawdziwą transakcją.
