---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_6_OPERATIONAL_READINESS/01_WEBHOOK_INTEGRATION.md
---

# SPRINT 7: PRODUCTION HARDENING & FIRST TENANT
## Plan Operacyjny — 01_PRODUCTION_PLAN.md
*Specyfikacja wdrożenia infrastruktury produkcyjnej, walidacji bazy danych, wdrożenia pierwszego realnego dzierżawcy oraz monitorowania telemetrii w WEB FACTOR.*

> **Cel główny:** Przejście platformy ze stanu teoretycznego do w pełni zweryfikowanego środowiska wielodostępnego (SaaS Multi-tenant) z potwierdzonym przepływem produkcyjnym (Golden Flow).

---

### 1. Plan Wdrożenia (Sprint 7.1 do 7.5)

```
       [Sprint 7.1: Deployment] ──► [Sprint 7.2: Database RLS]
                  │                            │
                  ▼                            ▼
     [Sprint 7.4: Observability] ◄── [Sprint 7.3: Golden Flow]
                  │
                  ▼
      [Sprint 7.5: Security] ──► [PROD GO-LIVE]
```

---

### Sprint 7.1 — Deployment Foundation
Cel: Uruchomienie platformy w rzeczywistym środowisku chmurowym.

1. **Environment Management (`.env.production`)**:
   - Wyraźny podział na konfiguracje publiczne (`NEXT_PUBLIC_*`), sekrety serwerowe (np. `SUPABASE_SERVICE_ROLE_KEY`) oraz klucze dostawców płatności (`ONEKOSZYK_SIGNATURE_KEY`).
2. **Hosting Setup**:
   - Vercel: Serwowanie frontendu (Next.js SSR/ISR) oraz API routes.
   - Railway / Supabase: Serwowanie baz danych PostgreSQL, usług pomocniczych i przechowywanie sekretów.
3. **Health Check Endpoint (`GET /api/health`)**:
   - Zwraca stan zdrowia kluczowych zależności:
     ```json
     {
       "status": "healthy" | "degraded",
       "runtime": "ok",
       "database": "connected" | "disconnected",
       "eventBus": "active" | "inactive"
     }
     ```
   - *Status: ✅ Zaimplementowano w `src/app/api/health/route.ts` oraz przetestowano w `src/app/api/health/health.test.ts`.*

---

### Sprint 7.2 — Database Reality Layer
Cel: Walidacja bazy danych Supabase pod kątem izolacji dzierżawców.

1. **Schema Validation**:
   - Weryfikacja struktur tabel pod kątem kluczy obcych i indeksów wydajnościowych (`tenant_id`, `created_at`, `status`).
   - Tabela docelowe: `tenants`, `users`, `packages`, `orders`, `payments`, `payment_intents`, `webhook_events`, `audit_events`.
2. **Row Level Security (RLS) Policies**:
   - Każda tabela przechowująca dane powiązane z dzierżawcą musi mieć aktywne RLS.
   - Reguła nadrzędna:
     ```sql
     CREATE POLICY tenant_isolation_policy ON table_name
       FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
     ```
3. **Tenant Isolation Test Suite**:
   - Automatyczny test integracyjny weryfikujący, że operacje zapisu i odczytu dla `tenant_id = A` nie wyciekają ani nie modyfikują danych dla `tenant_id = B`.

---

### Sprint 7.3 — First Real Tenant Flow
Cel: Uruchomienie pełnego, 9-etapowego scenariusza biznesowego (Golden Flow).

```
1. CREATE TENANT (Provisioning SaaS)
        ↓
2. PROVISION STORE (Utworzenie instancji sklepu)
        ↓
3. ASSIGN PACKAGE (Instalacja capability płatności i szablonów)
        ↓
4. PUBLIC STOREFRONT (Renderowanie dynamicznego katalogu pod domeną tenanta)
        ↓
5. CUSTOMER CHECKOUT (Dodanie do koszyka i utworzenie transakcji)
        ↓
6. PAYMENT INITIATION (Utworzenie PaymentIntent)
        ↓
7. WEBHOOK CALLBACK (Symulacja 1Koszyk: PAYMENT_COMPLETED z HMAC)
        ↓
8. ORDER CONFIRMATION (Idempotentne zatwierdzenie w OrderProcessingEngine)
        ↓
9. MISSION CONTROL VIEW (Widoczność w panelu zarządczym floty)
```

---

### Sprint 7.4 — Observability
Cel: Pełna widoczność operacji i zdarzeń w czasie rzeczywistym.

1. **Mission Control Runtime Dashboard**:
   - Wyświetlanie statystyk: liczba aktywnych tenantów, wolumen żądań API, wskaźnik sukcesu webhooków oraz statusy transakcji płatniczych.
2. **Event Timeline & Traceability**:
   - Oś czasu zdarzeń korelująca operacje biznesowe za pomocą `Correlation ID`:
     * `Tenant.Created` ──► `Store.Provisioned` ──► `Checkout.Started` ──► `Payment.Completed` ──► `Order.Confirmed`

---

### Sprint 7.5 — Security Review
Cel: Zabezpieczenie platformy przed wdrożeniem produkcyjnym.

1. **Key Rotation & Secrets Policy**:
   - Procedury rotowania kluczy API, tokenów dostępowych oraz sekretów webhooków.
2. **Rate Limiting & Threat Mitigation**:
   - Limitowanie liczby zapytań (Rate Limiting) na endpointach webhooków (`/api/webhooks/*`) oraz checkoutu, zapobiegające atakom DDoS i brute force.
3. **RBAC Validation**:
   - Weryfikacja uprawnień użytkowników: Partner (zarządzanie własnym sklepem) vs Super Admin (dostęp do floty Mission Control).
