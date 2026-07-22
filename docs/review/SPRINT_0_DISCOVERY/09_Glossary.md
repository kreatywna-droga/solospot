---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.1
Last Review: 2026-07-09
Freeze Version: 1.0
Depends On:
- 00_WEB_FACTOR_PLAYBOOK.md
Blocks:
- Documentation Freeze
---

# SPRINT 0: DISCOVERY
## Zadanie 9 — Glossary (Słownik Pojęć)
*Jedno źródło prawdy dla terminologii biznesowej, technicznej i produktowej platformy WEB FACTOR.*

---

### 1. Business & UX Terms

* **Partner**
  * *Definicja:* Przedsiębiorca korzystający z platformy WEB FACTOR w celu prowadzenia swojego sklepu. Zastępuje pojęcie "Klient" lub "Użytkownik" w dokumentacji B2B, kładąc nacisk na długofalową relację managed service.
* **Klient Końcowy (End Customer)**
  * *Definicja:* Konsument, który dokonuje zakupów w sklepie należącym do Partnera (model B2B2C).
* **Business Launch (Uruchomienie Biznesu)**
  * *Definicja:* Proces od pierwszego zalogowania się Partnera do momentu gotowości sklepu do sprzedaży. Zastępuje techniczne pojęcie "Onboarding".
* **Business Launch Checklist**
  * *Definicja:* Spersonalizowana lista pierwszych 3 kroków do wykonania po zalogowaniu (Logo, Pierwszy Produkt, Publikacja), gwarantująca najszybsze uzyskanie wartości (TTFV).
* **Managed SaaS**
  * *Definicja:* Model operacyjny platformy, w którym WEB FACTOR bierze pełną odpowiedzialność za infrastrukturę, aktualizacje i SEO, odciążając technologicznie Partnera.
* **Partner Success**
  * *Definicja:* Strategia wsparcia technologicznego Partnerów, polegająca na dostarczaniu gotowych modułów, ciągłej optymalizacji i rozwoju platformy wraz z ich rosnącym biznesem ("We Grow With You").

---

### 2. Platform & Engineering Terms

* **Commerce Engine (Silnik Sklepu)**
  * *Definicja:* Niezmienny, wspólny rdzeń logiki handlowej (koszyk, transakcje, API, routing), z którego korzystają wszystkie sklepy w architekturze platformy.
* **Single Engine Architecture (SEA) / One Engine Philosophy**
  * *Definicja:* Koncepcja budowy platformy w oparciu o dokładnie jeden współdzielony kod silnika. Sklepy różnią się jedynie dynamiczną konfiguracją i przypisanymi motywami.
* **Package (Pakiet)**
  * *Definicja:* Jednostka rozszerzalności platformy posiadająca standardowy kontrakt `manifest.json`. Może być typem `theme` (motyw), `profile` (konfiguracja branżowa) lub `module` (dodatkowa funkcjonalność).
* **Store Profile (Profil Sklepu)**
  * *Definicja:* Predefiniowany pakiet startowy dla danej branży (np. Fashion Premium, Electronics), który przy wdrażaniu automatycznie determinuje domyślne motywy, moduły i parametry.
* **Store Configuration (Konfiguracja Sklepu)**
  * *Definicja:* Zbiór dynamicznych właściwości sklepu (palety kolorów, fonty, klucze API integracji) zapisany w formacie JSON i wersjonowany w bazie danych.
* **Runtime**
  * *Definicja:* Izolowane środowisko wykonawcze silnika odpowiedzialne za dynamiczne renderowanie właściwego sklepu w oparciu o Middleware i konfigurację z bazy.
* **Runtime Version**
  * *Definicja:* Określona wersja środowiska wykonawczego przypisana do sklepu Partnera, gwarantująca stabilność działania i bezpieczeństwo podczas globalnych aktualizacji platformy.
* **Provisioning Engine (Silnik Wdrożeniowy)**
  * *Definicja:* Zautomatyzowany podsystem odpowiedzialny za zakładanie konta, konfigurację RLS, alokację zasobów i inicjalizację pustej konfiguracji bazy danych dla nowo zarejestrowanego Partnera.
* **Capability (Możliwość)**
  * *Definicja:* Wewnętrzna flaga określająca konkretne uprawnienie lub funkcjonalność biznesową posiadaną przez daną instancję sklepu (np. obsługa rozmiarów produktów). Zastępuje twarde wiązanie do planów abonamentowych.
* **Feature Flag (Flaga Funkcji)**
  * *Definicja:* Zdalnie sterowany przełącznik pozwalający na aktywowanie lub dezaktywowanie określonych fragmentów kodu na poziomie runtime.
* **Fleet (Flota)**
  * *Definicja:* Ogół działających na platformie instancji sklepów Partnerów zarządzanych centralnie z poziomu Mission Control.

---

### 3. Governance & Metrics Terms

* **Time To First Value (TTFV)**
  * *Definicja:* Mierzalny czas (cel: < 1 minuta) od momentu zakupu do pierwszego kontaktu z zalogowanym dashboardem, pokazującym spersonalizowany, działający sklep demonstracyjny.
* **Time To Business (TTB)**
  * *Definicja:* Czas niezbędny do technicznego i prawnego przygotowania sklepu do sprzedaży (pierwszy własny produkt + podpięcie płatności). Cel operacyjny: P95 < 15 minut.
* **Time To First Sale (TTFS)**
  * *Definicja:* Czas mierzony od publikacji sklepu do zarejestrowania pierwszej transakcji od klienta końcowego.
* **Time To Confidence (TTC)**
  * *Definicja:* Wskaźnik psychologiczny określający moment, w którym Partner nabiera całkowitego zaufania do platformy i uznaje decyzję o zakupie za słuszną.
* **Architecture Decision Record (ADR)**
  * *Definicja:* Formalny dokument opisujący kluczowe decyzje architektoniczne, ich uzasadnienie, kontekst oraz wpływ na przyszły rozwój systemu.
* **Documentation Freeze**
  * *Definicja:* Status oznaczający formalne zamrożenie specyfikacji architektonicznych i dokumentacji sprintów przed rozpoczęciem prac programistycznych.

---

### 4. Design Philosophy

* **Principle of Intentional Complexity (Zasada Celowej Złożoności)**
  * *Definicja:* Architektura systemu może być złożona wewnętrznie (Supabase RLS, Middleware, dynamiczny routing, pakiety), ale interfejs prezentowany Partnerowi musi pozostać maksymalnie prosty, eliminując niepotrzebne kroki konfiguracyjne.
