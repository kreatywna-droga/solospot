---
Status: REVIEW
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.1
Last Review: 2026-07-09
Freeze Version: -
Depends On:
- 00_WEB_FACTOR_PLAYBOOK.md
- 01_PLAN_0_TRANSFORMATION.md
Blocks:
- 02_Transformation_Matrix.md
- Development Sprint 1
---

# SPRINT 0: DISCOVERY
## Zadanie 1 — Code Audit
*Cel: Inwentaryzacja obecnego stanu kodu (Aplikacja "Na Dobranoc") oraz ocena jego przydatności przed migracją do architektury "WEB FACTOR Commerce".*

### 1. Co mamy (Stan Obecny)
Obecne repozytorium to kompletna aplikacja zbudowana w Next.js App Router, zaprojektowana dla segmentu B2C. Brakuje jej architektury Multi-Tenant wymaganej dla B2B.
- **Frontend / Routing:** Struktura w `src/app/`. Posiada ścieżki contentowe: `/o-aplikacji`, `/opinie`, `/funkcje`, `/blog`, `/forum`.
- **Backend / API:** `/api/auth` (Supabase), `/api/contact` (Nodemailer), `/api/webhooks/onekoszyk` (obsługa zdarzeń płatności).
- **Zasoby (Assets):** Znaczny wolumen plików w `public/` (nagrania `.mp3`, grafiki produktowe, pliki wideo) specyficznych dla domeny produktu B2C.

### 2. Co zostaje (Reuse)
Poniższe elementy stanowią fundament infrastrukturalny nowej platformy:
- **Konfiguracja Next.js + Tailwind CSS** (Priorytet: Critical) – Gotowe środowisko pracy.
- **Integracja Supabase** (`lib/supabase.ts`) (Priorytet: Critical) – Utrzymanie łączności z bazą.
- **Autoryzacja** (`/api/auth`) (Priorytet: Critical) – Bezpieczne sesje.
- **System śledzenia** (PostHog provider) (Priorytet: Medium) – Gotowy system analityczny.

### 3. Co przebudowujemy (Refactor)
Elementy wymagające dostosowania logiki lub interfejsu do modelu SaaS:
- **Webhook 1koszyk** (`/api/webhooks/onekoszyk`) (Priorytet: Critical) – Istniejąca implementacja stanowiąca podstawę Provisioning Engine. Zmiana akcji z "nadaj licencję" na "uruchom instancję sklepu".
- **Landing Page** (`/page.tsx`) (Priorytet: High) – Przebudowa wizualna w stronę komunikacji technologii e-commerce.
- **Dashboard** (`/dashboard`) (Priorytet: High) – Transformacja z panelu B2C na główny panel sterowania sklepem.
- **Centrum Pomocy** (`/centrum-pomocy`) (Priorytet: Medium) – Adaptacja pod dokumentację techniczną platformy.

### 4. Co usuwamy (Remove)
Obszary niezgodne z nową strategią produktu. **Zasada: Do usunięcia wyłącznie po zakończeniu migracji, nigdy przed zabezpieczeniem działania nowych modułów.**
- **Assety Aplikacji** (`public/audio`, `public/videos`, mockupy) (Priorytet: Low) – Redukcja długu technologicznego.
- **Trasy Contentowe** (`/blog`, `/forum`, `/o-aplikacji`, `/funkcje`) (Priorytet: Low) – Brak zgodności z domeną biznesową.
- **Content Markdown** (`src/content/blog`) (Priorytet: Low) – Niekompatybilny kontent B2C.

### 5. Ocena Ryzyka (Risk Assessment)
Zidentyfikowane ryzyka w procesie migracji:

| Obszar Ryzyka | Poziom | Środki mitygujące |
| :--- | :--- | :--- |
| **Utrata routingu (404)** | Wysokie | Zabezpieczenie przekierowań (Redirects) dla usuniętych ścieżek B2C. |
| **Usunięcie zależności API** | Wysokie | Ścisły Code Freeze i audyt importów przed skasowaniem logiki B2C. |
| **Spadek wydajności** | Średnie | Migracja do statycznych tras dla Landing Page; redukcja zapytań o stary content. |
| **Assety** | Niskie | Archiwizacja zewnętrzna plików `.mp3` i `.mp4`. |

### 6. Reuse Score (Wskaźnik Wykorzystania Ponownego)
Procentowy udział obecnej architektury w docelowym rozwiązaniu (bezpośrednie wsparcie KPI: Time To Business):

| Obszar Architektury | Wynik Reuse | Uwagi |
| :--- | :--- | :--- |
| **Infrastruktura (Next.js)** | 100% | Pełna zgodność i gotowość. |
| **Baza Danych (Supabase)** | 100% | Wymaga rozbudowy modelu RLS, ale infrastruktura połączenia zostaje. |
| **Autoryzacja (Auth)** | 100% | Gotowe rozwiązanie. |
| **Płatności (Webhook)** | 80% | Wymaga zmiany procedury docelowej (Action), logika komunikacji zostaje. |
| **Interfejsy (Dashboard/Landing)** | 40% | Wymaga głębokiego refactoringu wizualnego pod nowy Branding. |
| **Assety i Treści** | 5% | Tylko logo i wybrane grafiki systemowe. |
| **Content B2C** | 0% | Całkowity reset pod strategię B2B. |
