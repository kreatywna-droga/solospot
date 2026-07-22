---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.1
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_1_FOUNDATION/DEVELOPMENT_CONSTITUTION.md
- docs/review/SPRINT_1_FOUNDATION/01_Platform_Core_Architecture.md
---

# SPRINT 1: FOUNDATION IMPLEMENTATION
## Zadanie 2 — Runtime Request Flow
*Szczegółowy proces obsługi żądania sieciowego na poziomie środowiska uruchomieniowego platformy WEB FACTOR.*

---

### 1. Request Classification (Klasyfikacja Żądań)

Każde przychodzące do serwera żądanie HTTP jest klasyfikowane na samym wejściu w Edge Middleware. Zapobiega to zgadywaniu i niejednoznaczności na dalszych etapach potoku wykonawczego.

```mermaid
graph TD
    A[Incoming Request] --> B{Request Classifier}
    B -->|Host matches webfactor.pl / main routing| C[Marketing]
    B -->|Path starts with /dashboard| D[Partner Dashboard]
    B -->|Path starts with /admin or admin sub-domain| E[Mission Control]
    B -->|Path starts with /api/public| F[Public API]
    B -->|Path starts with /api/webhooks| G[Webhook]
    B -->|Sub-domain / custom domain match| H[Store Runtime]
    B -->|Static assets in public/ or static paths| I[Static Assets]
```

---

### 2. Runtime Flow Chart & Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Klient as Przeglądarka Klienta
    participant DNS as DNS & Vercel Edge
    participant MW as Next.js Middleware
    participant Cache as Vercel KV / Edge Cache
    participant DB as Supabase Database
    participant Core as Runtime Engine

    Klient->>DNS: Wywołanie GET https://mojsklep.pl/
    DNS->>MW: Routing do Edge Middleware
    MW->>MW: Request Classification & Security Validation
    
    rect rgb(200, 220, 240)
        note right of MW: Cache Flow
        MW->>Cache: Pobierz dane Tenanta dla hosta "mojsklep.pl"
        alt Cache Hit (Warm Start)
            Cache-->>MW: Zwraca Store ID, Status, Plan, Wersję
        else Cache Miss (Cold Start)
            Cache-->>MW: Brak danych (Cache Miss)
            MW->>DB: Zapytanie o domenę "mojsklep.pl"
            alt DB Query Success
                DB-->>MW: Zwraca Store ID, Status, Plan, Wersję
                MW->>Cache: Zapisz dane Tenanta (TTL: 1 godzina)
            else DB Timeout / Failure (Retry Flow)
                MW->>DB: Ponowna próba (Retry z Backoff: 50ms)
                alt DB Permanent Down
                    MW-->>Klient: Serwowanie 503 Maintenance Page
                end
            end
        end
    end

    MW->>MW: Wstrzyknięcie nagłówków x-store-id
    MW->>Core: Internal Rewrite to /(store-runtime)/[store_id]
    Core-->>Klient: HTML Response + Event Telemetry
```

---

### 3. Context Propagation (Propagacja Kontekstu)

Aby zapobiec wielokrotnemu odpytywaniu bazy danych lub parsowaniu tych samych parametrów w obrębie jednego żądania, obiekt `TenantContext` jest propagowany jednokierunkowo przez cały cykl życia żądania:

```text
  Middleware (Ekstrakcja i detekcja hosta)
     │
     ▼
  TenantContext (Utworzenie i walidacja)
     │
     ▼
  Request Context (Wstrzyknięcie do nagłówków HTTP / Edge Context)
     │
     ▼
  Server Components (RSC - odczyt przez Server Helper / React cache)
     │
     ▼
  Server Actions (Przekazanie kontekstu do akcji mutujących)
     │
     ▼
  API (Wykorzystanie kontekstu w routingu API)
     │
     ▼
  Logs & Observability (Propagacja ID żądania i ID tenanta do logów telemetrycznych)
```

---

### 4. Zasady Unieważniania Pamięci Podręcznej (Cache Invalidation Rules)

Dynamiczne cache'owanie wymaga jasnych reguł czyszczenia (inwalidacji) po zmianie stanu w bazie danych, aby zapobiec serwowaniu nieaktualnych danych:

| Zmiana w Systemie | Wyzwalacz (Trigger) | Cache do Wyczyszczenia (Invalidation Scope) |
| :--- | :--- | :--- |
| Zmiana stylistyki / loga | Aktualizacja w `store_configurations` (Branding) | **Theme Cache** |
| Edycja karty produktu | Aktualizacja rekordu w tabeli `products` | **Product Cache** |
| Zmiana domeny / waluty | Aktualizacja w `store_configurations` (Settings) | **Tenant Cache** (Host-to-Store-ID mapping) |
| Włączenie nowej capabilities | Dodanie rekordu w `store_modules` | **Runtime Cache** (Capabilities list) |
| Aktualizacja pakietu | Zmiana wersji pakietu w `packages` | **Package Cache** (Dependency tree) |

---

### 5. Runtime Events Sequence (Potok Zdarzeń Telemetrii)

Każde żądanie emituje zdarzenia w ściśle określonej kolejności, stanowiąc podstawę dla systemu telemetrycznego:

```text
RequestStarted
   │
   ├──► TenantResolved (Powiązanie domeny z ID tenanta)
   │
   ├──► RuntimeLoaded (Załadowanie właściwej wersji silnika)
   │
   ├──► CapabilitiesResolved (Wyliczenie możliwości technicznych)
   │
   ├──► RenderingStarted (Rozpoczęcie renderowania komponentów)
   │
   ├──► RenderingCompleted (Zakończenie renderowania drzewa RSC)
   │
[ResponseSent] (Wysłanie gotowego HTML i zakończenie telemetrii żądania)
```
Zdarzenia te mają zdefiniowany interfejs i są asynchronicznie przesyłane do analityki platformy.
