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
## Zadanie 9 — Migration Strategy Specification
*Strategia migracji, podziału i refaktoryzacji kodu ze starej aplikacji „Na Dobranoc” do docelowej architektury WEB FACTOR.*

---

### 1. Ogólne Zasady Migracji (Migration Philosophy)

Przenoszenie kodu ze starej aplikacji nie polega na bezmyślnym kopiowaniu plików. Stosujemy restrykcyjną zasadę trójdzielną: **Wyodrębnij (Migrate), Przepisz (Rewrite) lub Odrzuć (Discard)**. Wszystko po to, aby nie wnieść długu technicznego do nowo projektowanego silnika platformy.

```text
  Stary Kod "Na Dobranoc"
        │
        ├──► Wyodrębnij (Migrate)  ──► Commerce Blog, dane produktów (baza)
        │
        ├──► Przepisz (Rewrite)    ──► Logika płatności (ACL), webhooki, auth RLS
        │
        └──► Odrzuć (Discard)      ──► Ad-hoc style CSS, inline zapytania DB, stary landing
```

---

### 2. Szczegółowy Plan Podziału Komponentów (Code Transformation Map)

Poniższa tabela przedstawia mapowanie starej struktury "Na Dobranoc" na nową architekturę platformy:

| Stary Komponent | Status | Nowa Lokalizacja / Zastępca | Rationale |
| :--- | :--- | :--- | :--- |
| **Landing Page** | **Odrzuć i Przepisz** | `src/app/(marketing)/` | Dotychczasowy landing był stroną B2C. Nowy landing to strona B2B platformy WEB FACTOR (SaaS Marketing). |
| **Dashboard** | **Przepisz** | `src/app/(dashboard)/` | Stary dashboard zawierał bezpośrednie wywołania bazy. Nowy to **Partner Dashboard** połączony z Application Layer. |
| **Płatności Webhook** | **Przepisz** | `src/services/provisioning/` | Integracja z 1koszyk zostaje przeniesiona do orkiestratora jako `Provisioning Engine` ze wsparciem Sagi. |
| **Blog** | **Wyodrębnij** | `packages/modules/blog/` | Wydzielenie logiki postów i kategorii do opcjonalnego pakietu (Package Module) dla chętnych sklepów. |
| **Baza Danych** | **Migruj dane** | Supabase Postgres (RLS) | Dane produktów i użytkowników zostaną przeniesione skryptem migracyjnym do nowych struktur tabel `stores` i `products`. |

---

### 3. Fazy Procesu Migracyjnego (Migration Phasing)

Migracja jest realizowana równolegle z wdrażaniem kolejnych sprintów, podzielona na trzy fazy:

#### Faza 1: Migracja i Oczyszczenie Danych (Data Cleanse)
1. Napisanie skryptu migracyjnego SQL przenoszącego starych użytkowników do tabeli `profiles` z przypisaniem domyślnej roli `owner`.
2. Mapowanie dotychczasowych produktów "Lifetime Access" i produktów fizycznych na nowy, zunifikowany schemat tabeli `products` (w tym integracja z wariantami).

#### Faza 2: Izolacja Logiki w Adapterach (ACL Refactor)
1. Przepisanie modułu integracji z bramką płatności 1koszyk. Logika bezpośrednia zostaje zamknięta w adapterze wewnątrz `Billing Engine` zgodnie z regułą **Anti-Corruption Layer (ACL)**.
2. Usunięcie bezpośrednich odwołań do SDK Supabase z komponentów React i zastąpienie ich Server Actions w warstwie aplikacyjnej.

#### Faza 3: Uruchomienie Nowego Core (Switchover)
1. Uruchomienie nowego Edge Middleware klasyfikującego ruch.
2. Przeprowadzenie testów integracyjnych na zmigrowanych kontach Partnerów.
3. Przełączenie rekordów DNS i oficjalne uruchomienie platformy.
