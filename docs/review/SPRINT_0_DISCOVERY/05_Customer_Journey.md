---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.1
Last Review: 2026-07-09
Freeze Version: -
Depends On:
- 00_WEB_FACTOR_PLAYBOOK.md
Blocks:
- UX Specification
- Development Sprint 1
---

# SPRINT 0: DISCOVERY
## Zadanie 5 — Customer Journey
*Pełna relacja Partnera z platformą WEB FACTOR w całym cyklu życia (od problemu do retencji).*

> [!NOTE]
> **Filozofia WEB FACTOR:** WEB FACTOR nie kończy procesu na sprzedaży sklepu. WEB FACTOR rozpoczyna długoterminowe partnerstwo technologiczne.

### 1. Etapy Customer Journey (Relacja Długofalowa)

* **ETAP 0 — Problem (Potrzeba Biznesowa)**
  * *Opis:* Partner ma pomysł na biznes lub chce zmigrować istniejący sklep. Nie posiada zaplecza technologicznego i obawia się kosztów budowy dedykowanego rozwiązania.
* **ETAP 1 — Odkrycie (Budowanie Zaufania)**
  * *Opis:* Trafia na Landing Page WEB FACTOR. Spotyka się z jasnym przekazem: "My zajmujemy się technologią. Ty rozwijasz swój biznes". Obserwuje profesjonalny sznyt i gotowość platformy.
* **ETAP 2 — Decyzja (Porównanie i Dopasowanie)**
  * *Opis:* Partner zapoznaje się z wersjami demo, przegląda sklepy demonstracyjne i porównuje przejrzyste pakiety START / GROW / SCALE. Wybiera odpowiedni profil sklepu.
* **ETAP 3 — Zakup (Błyskawiczny Provisioning)**
  * *Opis:* Przejście przez szybki checkout (1koszyk). Płatność aktywuje webhooka, a system natychmiast inicjuje nową instancję sklepu na bazie Commerce Engine.
* **ETAP 4 — First Success (Pierwszy Sukces - TTFV)**
  * *Opis:* Partner loguje się po raz pierwszy. Wita go intuicyjny, spersonalizowany checklist wdrożenia biznesu (*Business Launch Checklist*):
    - [ ] Wgraj logo i branding sklepu.
    - [ ] Dodaj pierwszy produkt.
    - [ ] Udostępnij swój sklep.
  * *Wartość:* Partner od razu widzi swój gotowy, działający publicznie sklep.
* **ETAP 5 — First Sale (Pierwsza Sprzedaż - TTFS)**
  * *Opis:* Pierwsza transakcja klienta końcowego. System gratuluje Partnerowi w panelu Mission Control / Partner Dashboard, budując silną satysfakcję i motywację do dalszych działań.
* **ETAP 6 — Growth (Rozwój Sklepu)**
  * *Opis:* Biznes rośnie. Partner potrzebuje nowych funkcji (np. blog, moduł InPost, Allegro). Zgłasza potrzebę -> Platforma sprawdza dostępność modułu -> Włączenie następuje jednym kliknięciem. Jeśli moduł jest unikalny, platforma tworzy go i udostępnia wszystkim.
* **ETAP 7 — Partner Success (Managed SaaS)**
  * *Opis:* Partner czuje, że ma dedykowanego opiekuna technologicznego. WEB FACTOR wykonuje za niego aktualizacje silnika, optymalizuje SEO, utrzymuje infrastrukturę Vercel/Supabase.
* **ETAP 8 — Skalowanie (Skalowanie platformy)**
  * *Opis:* Przejście na wyższy abonament (START -> GROW -> SCALE), podpięcie własnej domeny, dodanie kolejnych członków zespołu z rolami (manager, editor) w `store_members`.
* **ETAP 9 — Retencja (Długofalowa Lojalność)**
  * *Opis:* Partner pozostaje z nami na lata, ponieważ koszt migracji i samodzielnego utrzymywania technologii jest niewspółmiernie wyższy niż abonament Managed SaaS z gwarancją ciągłego rozwoju platformy.

---

### 2. Tabela Emocjonalna & Zadania Platformy

| Etap | Cel Partnera | Emocja Partnera | Zadanie WEB FACTOR (UX / System) |
| :--- | :--- | :--- | :--- |
| **0. Problem** | Znaleźć prostą drogę do sprzedaży. | Zagubienie, frustracja technicznym żargonem. | Komunikacja ukierunkowana na korzyści biznesowe, a nie funkcje. |
| **1. Odkrycie** | Upewnić się o rzetelności dostawcy. | Niepewność, rezerwa. | Przedstawienie profesjonalnych szablonów i silnego Brand Promise. |
| **2. Decyzja** | Wybrać właściwy budżet/profil. | Nadzieja, kalkulacja ryzyka. | Klarowna tabela pakietów START/GROW/SCALE i bezpłatne wersje demonstracyjne. |
| **3. Zakup** | Szybko i bezpiecznie zapłacić. | Ekscytacja, niecierpliwość. | Bezpieczna bramka, brak zbędnych formularzy (TTB Flow). |
| **4. Business Launch** | Zobaczyć działający efekt. | Ulga, poczucie sprawczości. | Brak pustego stanu (Empty State). Jasne 3 kroki wdrożenia (TTFV). |
| **5. Pierwsza Sprzedaż** | Przetestować przepływ finansowy. | Satysfakcja, radość, sukces. | Animacja sukcesu na dashboardzie, mail gratulacyjny. |
| **6. Rozwój** | Rozszerzyć możliwości sprzedaży. | Ambicja, poszukiwanie nowości. | System modułów i wdrożenia na żądanie (SEA). |
| **7. Partnerstwo** | Skoncentrować się na marketingu. | Spokój, bezpieczeństwo. | Automatyczne aktualizacje, brak przerw w działaniu bazy i frontendu. |
