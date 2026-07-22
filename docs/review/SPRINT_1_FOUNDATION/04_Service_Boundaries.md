---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.2
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_1_FOUNDATION/DEVELOPMENT_CONSTITUTION.md
- docs/review/SPRINT_1_FOUNDATION/01_Platform_Core_Architecture.md
---

# SPRINT 1: FOUNDATION IMPLEMENTATION
## Zadanie 4 — Service Boundaries Specification
*Formalna specyfikacja granic odpowiedzialności oraz protokołów komunikacji pomiędzy kluczowymi modułami platformy WEB FACTOR.*

---

### 1. Architektura Granic Usług (Service Boundaries Map)

Aby zachować zasady **Single Engine Architecture** (SEA) oraz uniknąć splątania kodu (Spaghetti Architecture), każdy moduł systemowy działa w ściśle określonych granicach logicznych.

```mermaid
graph TB
    subgraph Środowisko Uruchomieniowe (Core Runtime)
        RuntimeEngine[Runtime Engine]
        PackageRuntime[Package Runtime]
        ThemeEngine[Theme Engine]
    end

    subgraph Logika Biznesowa (Business Core)
        CommerceEngine[Commerce Engine]
        ProvisioningEngine[Provisioning Engine]
        BillingEngine[Billing Engine]
    end

    subgraph Usługi Wspierające (Supporting Services)
        NotificationEngine[Notification Engine]
        MissionControl[Mission Control]
    end

    RuntimeEngine -->|Wstrzykuje Kontekst| ThemeEngine
    RuntimeEngine -->|Wstrzykuje Kontekst| PackageRuntime
    PackageRuntime -->|Wylicza Capabilities| CommerceEngine
    ProvisioningEngine -->|Inicjalizuje Dane| RuntimeEngine
    BillingEngine -->|Wyzwala subskrypcję| ProvisioningEngine
    CommerceEngine -->|Zdarzenie transakcyjne| NotificationEngine
    MissionControl -->|Zarządza/Impersonuje| RuntimeEngine
```

---

### 2. Macierz Zależności Usług (Dependency Matrix)

Żaden moduł nie może bezpośrednio wywoływać kodu spoza dozwolonego obszaru zależności. Ponoszenie odpowiedzialności weryfikowane jest na poziomie lintera importów:

| Usługa (Service) | Może Wywoływać (Can Use) | Zakaz Wywoływania (Forbidden) |
| :--- | :--- | :--- |
| **Runtime** | Package Loader, Theme Engine, Shared Kernel | Billing Engine, Mission Control UI |
| **Commerce** | Runtime Context, Shared Kernel | Theme Engine, Provisioning |
| **Provisioning** | Packages, Runtime Registry, Billing Events, Shared | React UI Components |
| **Theme Engine** | Runtime Context, Shared Kernel | Commerce Logic, Database Write Actions |
| **Billing** | Notification Engine, Shared Kernel | Store Runtime, React UI Components |
| **Mission Control** | Wszystkie Usługi (wyłącznie poprzez Public API) | Bezpośrednie zapytania DB bez API |

---

### 3. Warstwa Mitygacji Zewnętrznych Integracji (Anti-Corruption Layer - ACL)

Żaden rdzeń logiki biznesowej (np. Commerce Engine) nie może bezpośrednio importować SDK dostawców zewnętrznych (np. Stripe, InPost, Allegro). Integracja musi być obudowana dedykowanym adapterem:

$$\text{Commerce Engine} \rightarrow \text{Billing Adapter (ACL)} \rightarrow \text{Stripe SDK / Przelewy24}$$

* Zapewnia to, że wymiana bramki płatności na innego dostawcę nie wymaga modyfikacji logiki koszyka i transakcji.
* ACL tłumaczy wewnętrzne interfejsy i modele platformy na formaty wymagane przez systemy 3rd party.

---

### 4. Kontrakty Publiczne i Wersjonowanie (Public & Versioned Contracts)

1. **Zasada Publicznego Punktu Wejścia (Public API):** Każda usługa w katalogu `src/services/` lub silnik w `src/engines/` musi udostępniać swój interfejs wyłącznie przez plik `index.ts`. Bezpośrednie importy plików wewnętrznych są zabronione:
   * **Poprawnie:** `import { createOrder } from '@/services/commerce'`
   * **Błędnie:** `import { Cart } from '@/services/commerce/domain/Cart'`
2. **Wersjonowanie Kontraktów:** W celu zapewnienia stabilności floty, interfejsy publiczne usług są jawnie wersjonowane w ich strukturze katalogowej, np.:
   * `src/engines/commerce/v1/`
   * `src/engines/commerce/v2/`

---

### 5. Własność Usług (Service Ownership)

Każda usługa posiada zdefiniowany zespół odpowiedzialny za jej ewolucję i stabilność:

| Usługa (Service) | Właściciel (Owner) |
| :--- | :--- |
| **Runtime Engine** | Runtime Team |
| **Commerce Engine** | Commerce Team |
| **Provisioning Engine** | Platform Team |
| **Mission Control** | Operations Team |

---

### 6. Kontrakt Monitorowania Zdrowia (Health Contract)

Każda usługa ma obowiązek udostępnienia interfejsu diagnostycznego do badania stanu zdrowia (Health Check) odpytywanego przez Mission Control:

```typescript
export interface HealthStatus {
  readonly status: 'OK' | 'WARNING' | 'CRITICAL';
  readonly version: string;
  readonly dependencies: Array<{
    readonly serviceName: string;
    readonly status: 'OK' | 'CRITICAL';
  }>;
  readonly uptimeSeconds: number;
}
```

---

### 7. Izolacja Awarii (Circuit Isolation & Fault Tolerance)

Błędy usług wspierających nie mogą paraliżować kluczowych funkcji platformy.
* **Awaria Notification Service / Email / Analytics:** Platforma handlowa oraz checkout działają nieprzerwanie. Zdarzenia transakcyjne trafiają do kolejki i są wysyłane po przywróceniu sprawności usługi.
* **Awaria Package Registry:** Już wdrożone i aktywne instancje sklepów korzystają z lokalnych cache i działają bez zakłóceń. Blokowane jest jedynie tworzenie nowych instancji (Provisioning) oraz zmiany konfiguracji.

---

### 8. Konstrukcja Wspólnego Jądra (Shared Kernel Guidelines)

Współdzielony katalog `src/shared/` służy wyłącznie jako rejestr statycznych typów i kontraktów platformy. Dopuszczalna struktura podkatalogów:
* `src/shared/types/` — Globalne definicje TypeScript.
* `src/shared/contracts/` — Kontrakty wymiany danych.
* `src/shared/errors/` — Ustandaryzowane klasy błędów.
* `src/shared/events/` — Interfejsy zdarzeń platformy.
* `src/shared/validation/` — Globalne schematy walidacyjne (np. Zod Helpery).
* `src/shared/constants/` — Stałe systemowe.
* **Kategoryczny Zakaz:** Umieszczanie jakiejkolwiek logiki biznesowej, kalkulacji cenowych lub integracji w katalogu `shared`.

---

### 9. Transakcje Międzyusługowe (Cross-Service Transactions)

Platforma kategorycznie zabrania stosowania transakcji rozproszonych (Distributed Transactions/2PC) blokujących zasoby bazy danych na poziomie wielu mikroserwisów.
* Komunikacja i transakcyjność między usługami jest realizowana w oparciu o **wzorce Saga Pattern** oraz komunikację **Event-Driven**.
* Każdy krok operacji (np. rezerwacja magazynu $\rightarrow$ pobranie płatności) jest osobnym, idempotentnym zdarzeniem, a w przypadku awarii jednego z nich Saga wyzwala asynchroniczne zdarzenie kompensujące (np. anulowanie rezerwacji).

---

### 10. Przykłady Naruszenia Granic (Boundary Violation Examples)

W celu ochrony czystości architektonicznej i automatycznej kontroli jakości, poniższe powiązania są uznawane za niedozwolone naruszenie granic odpowiedzialności i będą zgłaszane jako błędy CI/CD:

* **Commerce Engine $\rightarrow$ Package Loader ❌**
  * *Błąd:* Silnik handlowy próbuje bezpośrednio sprawdzać zależności pakietów lub wersje.
  * *Rozwiązanie:* Commerce Engine odczytuje wyłącznie wyliczone uprawnienia i możliwości z przekazanego kontekstu za pomocą funkcji `hasCapability()`.
* **Runtime Engine $\rightarrow$ Payment Provider SDK ❌**
  * *Błąd:* Kod middleware lub layoutu sklepu bezpośrednio importuje API Stripe / 1koszyk.
  * *Rozwiązanie:* Runtime orkiestruje jedynie routing; bramki płatności leżą wyłącznie w warstwie integracji `Billing Engine` (za warstwą ACL).
* **Mission Control $\rightarrow$ Direct DB Tenant Mutation ❌**
  * *Błąd:* Panel administracyjny modyfikuje rekordy konfiguracyjne tenanta bezpośrednim zapytaniem SQL bez wyzwolenia zdarzenia domenowego.
  * *Rozwiązanie:* MC wywołuje akcję przez oficjalne Public API (np. `/api/admin/suspend`), które generuje zdarzenie telemetryczne i transakcję w trybie append-only log.
* **Provisioning Engine $\rightarrow$ Order Processing ❌**
  * *Błąd:* Orkiestrator wdrożenia sklepu próbuje dokonać kalkulacji koszyków zakupowych klientów końcowych.
  * *Rozwiązanie:* Provisioning odpowiada za narodziny sklepu, a za bieżącą sprzedaż odpowiada wyłącznie Commerce Engine.

