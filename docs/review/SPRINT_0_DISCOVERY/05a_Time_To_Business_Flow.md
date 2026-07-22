---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.1
Last Review: 2026-07-09
Freeze Version: -
Depends On:
- 05_Customer_Journey.md
Blocks:
- Development Sprint 2 (Provisioning)
---

# SPRINT 0: DISCOVERY
## Zadanie 5A — Time To Business Flow
*Operacyjny, mierzalny proces techniczny od momentu checkoutu do gotowości sklepu do sprzedaży.*

---

### 1. Kluczowe Metryki Operacyjne (Mierzalność SaaS)

Dla precyzyjnego zarządzania sukcesem produktu wprowadzamy trzy odrębne, monitorowane wskaźniki operacyjne oraz jeden wskaźnik psychologiczny w backlogu:

* **1. Time To First Value (TTFV) [Cel: < 1 minuta]**
  * *Definicja:* Czas od pomyślnego zakupu do pierwszego logowania Partnera, podczas którego widzi on w pełni spersonalizowany, wygenerowany sklep z przykładowymi danymi i checklistą *Business Launch*.
* **2. Time To Business (TTB) [Mierzalny Cel Biznesowy: P95 < 15 minut]**
  * *Definicja:* Czas od pierwszego zalogowania do opublikowania przez Partnera pierwszego własnego produktu wraz z podpięciem danych płatności – moment, w którym sklep jest technicznie i prawnie gotowy do sprzedaży.
* **3. Time To First Sale (TTFS)**
  * *Definicja:* Czas od wdrożenia sklepu do zarejestrowania pierwszej transakcji od klienta końcowego. Metryka badająca skuteczność profilu i wdrożenia.
* **4. Time To Confidence (TTC) [Backlog v2]**
  * *Definicja:* Metryka psychologiczna określająca moment, w którym Partner uzyskuje pewność właściwego wyboru (np. po zaimportowaniu danych, pierwszej interakcji supportu lub pierwszej instalacji modułu z Marketplace).

---

### 2. Przepływ Techniczny (Step-by-Step Flow)

```text
[Landing Page] ──► [Wybór Pakietu B2B] ──► [Checkout 1koszyk]
                                                  │
                                            (Płatność OK)
                                                  │
                                                  ▼
                                         [Webhook Zdarzenia]
                                                  │
                                         [Provisioning Engine]
                                   ┌──────────────┴──────────────┐
                                   ▼                             ▼
                            [Utworzenie User]            [Inicjalizacja DB]
                            (Supabase Auth)              (RLS, Profile & Config)
                                   │                             │
                                   └──────────────┬──────────────┘
                                                  ▼
                                     [Automatyczny E-mail]
                                     (Dane dostępowe w 30s)
                                                  │
                                                  ▼
                                       [Pierwsze Logowanie]
                                     (Dashboard - TTFV Start)
                                                  │
                                                  ▼
                                    [Business Launch Checklist]
                                   (Dodanie logo, produktu, waluty)
                                                  │
                                                  ▼
                                         [Publikacja Sklepu]
                                     (Sklep Live - TTB Closed)
                                                  │
                                                  ▼
                                        [Pierwsza Transakcja]
                                     (Sukces B2B2C - TTFS Closed)
```
