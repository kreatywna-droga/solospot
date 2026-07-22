---
Status: REVIEW
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.1
Last Review: 2026-07-09
Freeze Version: -
Depends On:
- 00_WEB_FACTOR_PLAYBOOK.md
- 01_Code_Audit.md
Blocks:
- 03_Folder_Tree_2.0.md
- Development Sprint 1
---

# SPRINT 0: DISCOVERY
## Zadanie 2 — Transformation Matrix
*Decyzyjna macierz wdrożeniowa. Stanowi kompletny kontrakt transformacji i fundament budowy nowej firmy technologicznej.*

Zgodnie z protokołem architektonicznym, macierz dzieli się na trzy kategorie decyzyjne: Istniejące Zasoby, Nowe Komponenty (rdzeń platformy) oraz Infrastrukturę.

### 1. Existing Assets (Istniejące Zasoby)
*Losy obecnego kodu aplikacji "Na Dobranoc".*

| Ścieżka / Moduł | Decyzja | Priorytet | Owner | Uzasadnienie |
| :--- | :--- | :--- | :--- | :--- |
| **Landing Page** (`/page.tsx`) | **REPLACE** | Critical | Marketing | Zmieniamy markę i cel z B2C na B2B. |
| **Dashboard** (`/dashboard`) | **REFACTOR** | Critical | Commerce | Panel klienta (zarządzanie sklepem) zamiast panelu rodzica. |
| **Auth** (`/logowanie`, `/api/auth`) | **REUSE** | Critical | Platform Core | Bezpieczny przepływ Supabase zostaje. |
| **Webhook 1koszyk** (`/api/webhooks`) | **REFACTOR** | High | Provisioning | Baza Provisioning Engine – zmiana z nadawania licencji na tworzenie rekordu Sklepu. |
| **Checkout** (`/checkout`) | **REFACTOR** | High | Commerce | Sprzedaż Pakietów START/GROW/SCALE B2B. |
| **Blog** (`/blog`) | **REWRITE** | Medium | Marketing | Baza wiedzy e-commerce zamiast opowiadań B2C. |
| **Kontakt** (`/kontakt`, `/api/contact`) | **REUSE** | Medium | Platform Core | Funkcjonujący SMTP z Nodemailer. |
| **Centrum Pomocy** (`/centrum-pomocy`) | **REFACTOR** | Medium | Marketing | Przejście na dokumentację SaaS. |
| **Forum** (`/forum`) | **REMOVE** | Low | Marketing | Zbędne obciążenie dla SaaS. |
| **Mock Checkout** (`/mock-checkout`)| **REMOVE** | Low | Commerce | Testowy relikt do usunięcia. |
| **Informacyjne** (`/funkcje` itp.)| **REMOVE** | Low | Marketing | Zastąpione blokami w ramach nowego Landing Page. |
| **Assety audio/video** (`public/*`)| **REMOVE** | High | Infrastructure | Czystka repozytorium z bajek. |
| **Assety graficzne** (`public/icons`)| **REUSE / REPLACE** | Medium | Infrastructure | Zachowanie SVG systemowych, podmiana logotypu. |

### 2. Platform Components & Content
*Decyzje w zakresie bibliotek, komponentów współdzielonych i warstwy SEO.*

| Ścieżka / Moduł | Decyzja | Priorytet | Owner | Uzasadnienie |
| :--- | :--- | :--- | :--- | :--- |
| **Komponenty** (`src/components`) | **REBUILD** | High | Platform Core | Przejście na system Modułów i Store Profiles. |
| **Biblioteki** (`src/lib/supabase.ts`) | **EXTEND** | Critical | Platform Core | Dodanie RLS i multi-tenancy. |
| **Dostawcy** (`src/providers`) | **REUSE** | High | Infrastructure | Kontekst uwierzytelniania i PostHog. |
| **Zależności** (`package.json`) | **REVIEW** | Medium | Infrastructure | Wyczyszczenie nieużywanych modułów np. do odtwarzania audio. |
| **Metadata & Open Graph** | **REPLACE** | High | Marketing | Całkowita zmiana grupy docelowej na przedsiębiorców. |
| **Robots & Sitemap** | **REWRITE** | Medium | Marketing | Wykluczenie starych tras B2C. |
| **Content Markdown** | **REMOVE** | Low | Marketing | Artykuły B2C do wyrzucenia. |

### 3. New Platform Components
*Elementy krytyczne tworzone od zera w zgodzie z Single Engine Architecture.*

| Element | Decyzja | Priorytet | Owner | Uzasadnienie |
| :--- | :--- | :--- | :--- | :--- |
| **Commerce Engine** | **CREATE** | Critical | Commerce | Jeden silnik dla wszystkich sklepów platformy. |
| **Store Profiles** | **CREATE** | Critical | Commerce | Tematyka zdefiniowana przez konfigurację, a nie osobny kod. |
| **Package System** | **CREATE** | High | Platform Core | Zunifikowany system wdrażania nowych modułów. |
| **Mission Control** | **CREATE** | Critical | Administration | Pulpit operatorski dla WEB FACTOR (Zarządzanie flotą sklepów). |

### 4. Infrastructure
*Zaplecze wspierające działanie całego ekosystemu.*

| Element | Decyzja | Priorytet | Owner | Uzasadnienie |
| :--- | :--- | :--- | :--- | :--- |
| **Next.js & App Router** | **REUSE** | Critical | Infrastructure | Obecny rdzeń technologiczny zostaje zachowany. |
| **Tailwind CSS** | **REUSE** | High | Infrastructure | Główny framework UI. |
| **TypeScript / ESLint** | **REUSE** | High | Infrastructure | Czystość kodu. |
| **Vercel** | **REUSE** | Critical | Infrastructure | System produkcyjnego wdrożenia pozostaje. |
| **Supabase (Baza i Storage)** | **EXTEND** | Critical | Infrastructure | Dodanie izolacji danych. |
| **Zmienne Środowiskowe (.env)** | **REVIEW** | High | Infrastructure | Weryfikacja starych kluczy API. |

---

### 5. Migration Statistics
Procentowy obraz przyszłej struktury platformy po zakończeniu Sprints (pozwala oszacować koszt długu technicznego względem tworzenia nowej wartości).

- **REUSE (Bez zmian / Drobny refactor):** 25% *(Głównie Infrastruktura, Vercel, Supabase, Auth, Tailwind)*
- **REFACTOR / EXTEND:** 30% *(Supabase DB, Checkout, Webhook, Dashboard)*
- **REPLACE / REWRITE:** 15% *(Landing, SEO, Metadata, Blog)*
- **REMOVE:** 10% *(Treści B2C, Assety B2C, Forum)*
- **CREATE (Nowe Rdzenie):** 20% *(Commerce Engine, Mission Control, Store Profiles)*
