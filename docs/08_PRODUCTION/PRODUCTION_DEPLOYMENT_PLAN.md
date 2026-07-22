# WEB FACTOR Platform
## PRODUCTION DEPLOYMENT PLAN
### Wersja: 1.0 — Sprint 8.1
### Status: DRAFT (oczekuje na zatwierdzenie przed wdrożeniem)

---

## 1. CEL DOKUMENTU

Niniejszy dokument definiuje kompletną procedurę uruchomienia platformy WEB FACTOR w środowisku produkcyjnym.

Dokument jest **wymagany przed wykonaniem jakiegokolwiek wdrożenia produkcyjnego**.
Zmiany w tym dokumencie wymagają zatwierdzenia przez operatora platformy.

> ⚠️ **REGUŁA BEZWZGLĘDNA:** Żaden deployment na środowisko produkcyjne nie może nastąpić bez kompletnej checklisty release (`§ 7`) oznaczonej jako DONE.

---

## 2. ARCHITEKTURA DEPLOYMENTU

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET / DNS                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   VERCEL (Edge)                         │
│                                                         │
│  Next.js App Router                                     │
│  ├── /app/api/health                (Health Check)      │
│  ├── /app/api/webhooks/onekoszyk    (Payment Webhooks)  │
│  ├── /app/api/mission-control/*     (Operator API)      │
│  └── /app/[tenant]/*                (Storefront)        │
└────────────────────┬────────────────────────────────────┘
                     │  Service Role Key (server-only)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              SUPABASE (Production Project)              │
│                                                         │
│  Database (PostgreSQL + RLS)                            │
│  ├── payment_intents       (0002)                       │
│  ├── webhook_events        (0003)                       │
│  └── timeline_events       (0004)                       │
│                                                         │
│  Auth (Supabase Auth)                                   │
│  Storage (assets, uploads)                              │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              1KOSZYK (Payment Provider)                 │
│                                                         │
│  Webhooks → POST /api/webhooks/onekoszyk                │
│  HMAC-SHA256 signature verification                     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. WYMAGANE ZMIENNE ŚRODOWISKOWE

Wszystkie poniższe zmienne **muszą** być skonfigurowane w panelu Vercel (Settings → Environment Variables) dla środowiska `Production`.

Walidacja jest wymuszana przez `EnvironmentValidator.ts` przy każdym uruchomieniu serwera — brakująca zmienna powoduje natychmiastowe `FAIL FAST` i blokuje start aplikacji.

### 3.1 Supabase

| Zmienna | Zakres | Opis |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Edge + Client) | URL projektu Supabase Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Edge + Client) | Klucz anonimowy (Row Level Security aktywne) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only (secret)** | Klucz serwisowy — nigdy nie eksponować klientowi |

### 3.2 Bramka Płatności (1Koszyk)

| Zmienna | Zakres | Opis |
|---|---|---|
| `ONEKOSZYK_SIGNATURE_KEY` | **Server-only (secret)** | Klucz HMAC-SHA256 do weryfikacji podpisów webhooków |
| `ONEKOSZYK_PARTNER_ID` | **Server-only (secret)** | Identyfikator partnera w systemie 1Koszyk |

### 3.3 Platforma

| Zmienna | Zakres | Opis |
|---|---|---|
| `JWT_SECRET` | **Server-only (secret)** | Klucz podpisywania tokenów JWT (min. 32 znaki) |
| `ENCRYPTION_KEY_32` | **Server-only (secret)** | Klucz szyfrowania danych wrażliwych (**dokładnie** 32 znaki) |

> ⚠️ `ENCRYPTION_KEY_32` musi mieć **dokładnie 32 znaki** — walidacja Zod odrzuci inną długość.

### 3.4 Polityka sekretów

- Sekrety generowane kryptograficznie (minimum 256 bitów entropii)
- Rotacja kluczy `ONEKOSZYK_SIGNATURE_KEY` i `JWT_SECRET` — co 90 dni
- Każda rotacja **musi** generować zdarzenie `Security.SecretRotation` w Timeline
- `SUPABASE_SERVICE_ROLE_KEY` — dostęp tylko z kodu serwera (nigdy `NEXT_PUBLIC_`)

---

## 4. MIGRACJE BAZY DANYCH SUPABASE

### 4.1 Sekwencja migracji (kolejność obowiązkowa)

| # | Plik | Tworzy tabelę | Zależności |
|---|---|---|---|
| 0002 | `0002_payment_intents.sql` | `payment_intents` | pgcrypto (UUID) |
| 0003 | `0003_webhook_events.sql` | `webhook_events` | — |
| 0004 | `0004_timeline_events.sql` | `timeline_events` | pgcrypto (UUID) |

> Migracja `0001_initial.sql` powinna istnieć i tworzyć bazowe tabele (tenants, stores, itp.) przed migracjami powyżej.

### 4.2 Procedura aplikacji migracji

```bash
# Option A: Supabase CLI (zalecane)
supabase db push --project-ref <PROD_PROJECT_REF>

# Option B: Supabase Dashboard → SQL Editor
# Wkleić zawartość każdego pliku sekwencyjnie: 0002 → 0003 → 0004
```

### 4.3 Weryfikacja po migracji

Wykonać w SQL Editorze Supabase (produkcja):

```sql
-- Weryfikacja istnienia tabel
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('payment_intents', 'webhook_events', 'timeline_events');

-- Weryfikacja indeksów
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('payment_intents', 'webhook_events', 'timeline_events');

-- Weryfikacja RLS (Row Level Security)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('payment_intents', 'webhook_events', 'timeline_events');
```

Oczekiwany wynik: Wszystkie 3 tabele widoczne, `rowsecurity = true`.

### 4.4 Polityki RLS (wymagane po migracji)

Dla każdej tabeli włączyć RLS i zdefiniować polityki:

```sql
-- payment_intents: tenant może widzieć tylko swoje rekordy
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants see own payment intents" ON public.payment_intents
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- webhook_events: tylko service role (webhook processor)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- timeline_events: tenant widzi swoje, operator widzi wszystkie
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants see own timeline" ON public.timeline_events
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Service role full access" ON public.timeline_events
  FOR ALL USING (auth.role() = 'service_role');
```

---

## 5. DEPLOYMENT NA VERCEL

### 5.1 Konfiguracja projektu Vercel

```
Project Settings:
  Framework Preset:  Next.js
  Root Directory:    ./   (monorepo root)
  Build Command:     next build
  Output Directory:  .next
  Install Command:   npm install
  Node.js Version:   20.x (LTS)
```

### 5.2 Branches i środowiska

| Branch | Środowisko Vercel | Baza danych |
|---|---|---|
| `main` | Production | Supabase Production |
| `develop` | Preview | Supabase Staging (osobny projekt) |
| `feature/*` | Preview | Supabase Staging |

### 5.3 Build Verification

Build musi przejść następujące kroki bez błędów:

```
1. npm install           → wszystkie zależności zainstalowane
2. npx tsc --noEmit      → 0 błędów TypeScript
3. next build            → bundle skompilowany (exit code 0)
```

> Vercel automatycznie uruchamia `next build`. Kroki 1-2 można dodać jako `prebuild` w `package.json`.

---

## 6. PRODUKCYJNY SMOKE TEST

Po każdym deployment wykonać sekwencję weryfikacyjną:

### 6.1 Health Check (podstawowy)

```bash
curl -s https://your-domain.vercel.app/api/health | jq .
```

**Oczekiwana odpowiedź:**
```json
{
  "status": "healthy",
  "runtime": "ok",
  "database": "connected",
  "eventBus": "active",
  "timestamp": "2026-07-11T00:00:00.000Z"
}
```

**Warunki akceptacji:**
- HTTP status: `200`
- `status`: `"healthy"`
- `database`: `"connected"` (nie `"error"` ani `"timeout"`)
- `eventBus`: `"active"`

### 6.2 Webhook Endpoint (dostępność)

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://your-domain.vercel.app/api/webhooks/onekoszyk \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Oczekiwany status:** `401` lub `400` (nie `404` ani `500`)
— endpoint musi istnieć i odrzucić nieautoryzowane żądanie.

### 6.3 Mission Control API (dostępność)

```bash
curl -s -o /dev/null -w "%{http_code}" \
  https://your-domain.vercel.app/api/mission-control/events
```

**Oczekiwany status:** `200` (pusta lista zdarzeń) lub `401` (auth wymagana)

---

## 7. CHECKLISTA RELEASE (wymagana przed każdym deployment)

### 7.1 Pre-deployment

- [ ] Wszystkie testy lokalne przeszły: `npx vitest run` → exit code 0
- [ ] Kompilacja TypeScript: `npx tsc --noEmit` → 0 błędów
- [ ] Plik `.env.production.example` zgodny z aktualnym `EnvironmentValidator.ts`
- [ ] Migracje SQL zatwierdzone i przetestowane lokalnie

### 7.2 Supabase Production

- [ ] Projekt Supabase Production istnieje i jest aktywny
- [ ] Migracje `0002` → `0003` → `0004` zastosowane (w tej kolejności)
- [ ] Tabele `payment_intents`, `webhook_events`, `timeline_events` istnieją
- [ ] RLS aktywne na wszystkich tabelach produkcyjnych
- [ ] Polityki RLS zdefiniowane i zweryfikowane
- [ ] Indeksy istnieją i są aktywne

### 7.3 Vercel Environment Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — ustawione (format URL)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — ustawione
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — ustawione jako **secret** (nie widoczne w logach)
- [ ] `ONEKOSZYK_SIGNATURE_KEY` — ustawione jako **secret**
- [ ] `ONEKOSZYK_PARTNER_ID` — ustawione
- [ ] `JWT_SECRET` — ustawione jako **secret** (min. 32 znaki)
- [ ] `ENCRYPTION_KEY_32` — ustawione jako **secret** (**dokładnie** 32 znaki)

### 7.4 Post-deployment Smoke Test

- [ ] `GET /api/health` → HTTP 200, `status: "healthy"`, `database: "connected"`
- [ ] `POST /api/webhooks/onekoszyk` (bez podpisu) → HTTP 400/401 (nie 500)
- [ ] `GET /api/mission-control/events` → HTTP 200 lub 401
- [ ] Brak błędów `5xx` w logach Vercel przez 5 minut po deployment

### 7.5 1Koszyk Webhook Configuration

- [ ] URL webhooka skonfigurowany w panelu 1Koszyk: `https://your-domain.vercel.app/api/webhooks/onekoszyk`
- [ ] Klucz HMAC skonfigurowany po obu stronach (1Koszyk + `ONEKOSZYK_SIGNATURE_KEY`)
- [ ] Test webhook z panelu 1Koszyk zakończony sukcesem

---

## 8. STRATEGIA ROLLBACK

W przypadku krytycznego błędu po deployment:

### 8.1 Rollback aplikacji (Vercel)

```
Vercel Dashboard → Project → Deployments → 
  Wybierz poprzedni deployment → Actions → Promote to Production
```

Czas rollback: **< 2 minuty**

### 8.2 Rollback migracji bazy danych

> ⚠️ Migracje SQL są **trudno odwracalne**. Standardem jest dodanie migracji `undo`:

```sql
-- Przykład cofnięcia migracji 0004 (w razie potrzeby):
DROP INDEX IF EXISTS public.timeline_events_tenant_timestamp_idx;
DROP INDEX IF EXISTS public.timeline_events_correlation_idx;
DROP TABLE IF EXISTS public.timeline_events;
```

**Zasada:** Nie usuwać danych produkcyjnych bez zatwierdzenia przez operatora platformy.

### 8.3 Rollback sekretów

Jeśli klucze zostały naruszone:
1. Natychmiast zmienić `ONEKOSZYK_SIGNATURE_KEY` w panelu 1Koszyk oraz Vercel
2. Nowy deployment (automatycznie pobierze nowe sekrety)
3. Opublikować zdarzenie `Security.SecretRotation` w Timeline
4. Powiadomić tenantów jeśli naruszenie dotyczyło danych klienckich

---

## 9. MONITORING PO WDROŻENIU

### 9.1 Metryki do obserwowania

Po pierwszym deployment monitorować przez minimum **24 godziny**:

| Metryka | Narzędzie | Alert threshold |
|---|---|---|
| HTTP 5xx errors | Vercel Analytics | > 1% request |
| `/api/health` response time | External ping | > 2000ms |
| Webhook processing failures | Timeline Events | > 0 błędów |
| Database connection errors | Supabase Dashboard | > 0 błędów |

### 9.2 Mission Control jako narzędzie monitorowania

Po wdrożeniu pierwszego tenanta, Mission Control API dostarcza:

```
GET /api/mission-control/events
  → ostatnie 100 zdarzeń platformowych

GET /api/mission-control/tenants
  → lista tenantów z aktualnym statusem

GET /api/mission-control/tenant/:id/timeline
  → pełna oś czasu operacji dla danego tenanta
```

---

## 10. KOLEJNE KROKI PO ZATWIERDZENIU

Po zatwierdzeniu tego dokumentu i przejściu pełnej checklisty (`§ 7`):

```
Sprint 8.1 ✅ COMPLETE
      │
      ▼
Sprint 8.2 — First Tenant Onboarding
  Cel: uruchomienie pierwszego prawdziwego dzierżawcy
  Weryfikacja: Golden Flow z prawdziwą transakcją 1Koszyk
      │
      ▼
Sprint 8.3 — Mission Control UI
  Cel: interfejs operatora z danymi produkcyjnymi
  Warunek: dane z Sprint 8.2 jako live data source
      │
      ▼
Sprint 8.4 — E2E Production Validation
  Cel: potwierdzenie pełnego cyklu na produkcji
```

---

*Dokument: `docs/08_PRODUCTION/PRODUCTION_DEPLOYMENT_PLAN.md`*
*Sprint: 8.1 — Production Environment Setup*
*Autor: WEB FACTOR Platform Team*
*Wersja: 1.0 DRAFT*
