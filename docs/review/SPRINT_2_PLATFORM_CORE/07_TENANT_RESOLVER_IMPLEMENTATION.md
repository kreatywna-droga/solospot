---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_2_PLATFORM_CORE/06_RUNTIME_BOOTSTRAP_IMPLEMENTATION.md
---

# SPRINT 2: PLATFORM CORE IMPLEMENTATION
## Zadanie 7 — Tenant Resolver Implementation
*Dokumentacja techniczna oraz specyfikacja implementacyjna modułu Tenant Resolver w paczce `packages/platform-core`.*

---

### 1. Rurociąg Rozpoznawania Tenanta (Resolution Pipeline)

Moduł dynamicznej detekcji tenantów został w pełni zaimplementowany pod ścieżką `packages/platform-core/src/tenant/`. Główny punkt wejścia, klasa `TenantResolver` w `TenantResolver.ts`, realizuje rurociąg rozpoznawania na bazie priorytetów źródeł:

1. **Signed API Token (JWT)**:
   * Wyciągany z nagłówka `Authorization: Bearer <jwt>` lub parametru query `?api_key=`.
   * Parser dekoduje strukturę JWT (w sposób bezbiblioteczny, kompatybilny z Vercel Edge Runtime) i wyodrębnia bezpośrednio `tenantId`.
2. **Development Override**:
   * Przekazywany za pomocą nagłówka `X-Tenant-Override`.
   * **Reguła bezpieczeństwa (Security Rule)**: Opcja ta jest procesowana **wyłącznie** w środowisku `development`. W środowiskach `production` i `staging` nagłówek ten jest ignorowany, a próba jego użycia generuje telemetryczne ostrzeżenie `PlatformLogger.warn`.
3. **Internal Preview URL**:
   * Przetwarzany dla domen kończących się na `.webfactor.com` lub `.webfactor.io`.
   * Subdomena (np. `store-a` z `store-a.webfactor.io`) jest bezpośrednio mapowana na unikalny `slug` tenanta w bazie danych.
4. **Custom Domain**:
   * Domyślna ścieżka dopasowywania na podstawie nagłówka `Host` (np. `fashion-store-a.com`), przeszukująca tabelę domen alternatywnych.

### 1.1 Resolution Priority Decision

W implementacji zdecydowano o zastosowaniu następującej kolejności przetwarzania (Resolution Priority):
1. **Signed API Token** (najwyższy priorytet, bezpośrednia autoryzacja żądania).
2. **Development Override** (przetwarzany wyłącznie lokalnie do celów developerskich/testowych).
3. **Internal Preview URL** (adresy techniczne platformy `*.webfactor.com` / `*.webfactor.io`).
4. **Custom Domain** (najniższy priorytet, dopasowanie domeny zewnętrznej).

**Uzasadnienie decyzji (Architectural Rationale):**
Umieszczenie `Development Override` na drugim miejscu (przed mapowaniem domen) znacząco upraszcza testy integracyjne oraz lokalny proces deweloperski. Programista może wymusić kontekst dowolnego tenanta (podając nagłówek `X-Tenant-Override`) bez konieczności żmudnego manipulowania lokalnymi wpisami DNS/hosts w systemie operacyjnym.

Bezpieczeństwo produkcyjne (Production Hardening) jest w pełni zachowane, ponieważ system weryfikuje zmienną środowiskową `environment`. Jeśli `environment !== 'development'`, mechanizm ten jest całkowicie pomijany, zapobiegając próbom nieautoryzowanego przejęcia tenantów (Cross-Tenant Access) na środowiskach produkcyjnych i stagingowych.

---

### 2. Dwu-poziomowe Buforowanie (Two-Tier Caching) & Strategie Awaryjne

Klasa `TenantResolver` integruje dwa poziomy buforowania w celu zagwarantowania czasu odpowiedzi `< 5ms`:

* **L1 Cache (In-Memory)**: Lokalna pamięć podręczna w pliku `TenantCache.ts`.
* **L2 Cache (Edge KV / Redis)**: Asynchroniczny regionalny cache (interfejs `TenantL2Cache`).
* **Failover (Stale-While-Revalidate)**:
  * W przypadku awarii bazy danych (np. brak łączności z Supabase Postgres) system automatycznie próbuje serwować wersję *stale* z poziomu L2 KV.
* **Fail-Closed (Zabezpieczenie przed przedawnieniem)**:
  * Jeżeli dane w L2 Cache przekroczyły maksymalny czas tolerancji przedawnienia (`maxStaleSeconds`, domyślnie 1 dzień), system odrzuca żądanie rzucając `RuntimeError` (Fail-Closed). Zapobiega to wyciekom danych przy długotrwałych awariach synchronizacji uprawnień i planów subskrypcyjnych.

---

### 3. Zabezpieczenie przed zawieszeniem i separacja danych (Tenant Isolation)

* **Wykrycie zawieszenia (`SUSPENDED`)**:
  * Jeśli status pobranego z bazy/cache tenanta wynosi `SUSPENDED`, rzucany jest dedykowany wyjątek `TenantResolutionError` o kodzie `TENANT_SUSPENDED`.
* **Separacja Tenantów (Tenant Isolation)**:
  * Cache kluczy jest izolowany przestrzeniami domenowymi i identyfikatorami (`tenant:id:<id>`, `tenant:domain:<domain>`, `tenant:slug:<slug>`).
  * Wszelkie próby manipulacji nagłówkami hosta lub tokenami spoza zdefiniowanych tenantów skutkują natychmiastowym błędem `TENANT_NOT_FOUND`.

---

### 4. Zestaw Testów Jednostkowych (`tenant-resolver.test.ts`)

Testy zlokalizowane w `packages/platform-core/src/tenant/tenant-resolver.test.ts` weryfikują pełne spektrum zachowań modułu:

1. **Resolution by Custom Domain**: Poprawne pobranie z bazy danych po domenie.
2. **Resolution by Internal Preview URL**: Pobranie po subdomenie `.webfactor.io`.
3. **Resolution by Signed API Token**: Dekodowanie JWT z nagłówka `Authorization` lub query `?api_key=`.
4. **Development Override**:
   * Działanie w środowisku `development`.
   * Ignorowanie i fallback do domeny w środowisku `production`.
5. **Caching mechanics**:
   * Zwrócenie danych bezpośrednio z L1 Cache na drugim zapytaniu (Cache Hit).
   * Cache Miss i ponowne odpytanie bazy po wywołaniu `.invalidate()`.
6. **Error handling**:
   * Przechwycenie statusu `SUSPENDED` i wygenerowanie błędu.
   * Obsługa nieznanego tenanta (`TENANT_NOT_FOUND`).
7. **Cross-tenant Isolation**: Potwierdzenie separacji danych w cache i zapytaniach.
8. **Resiliency / Failover**:
   * Pomyślny fallback do L2 Cache przy awarii DB.
   * Blokada rozruchu i odrzucenie zapytania (Fail-Closed), gdy cache L2 wygasł ponad dopuszczalny limit wieku.
