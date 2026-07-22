# WEB FACTOR
# PLAN 0 – TRANSFORMATION FOUNDATION
## Dokument Strategiczny Transformacji Projektu
### Wersja 1.0

---

## Cel dokumentu
Celem PLANU 0 jest przygotowanie istniejącego projektu **Na Dobranoc** do transformacji w pierwszy produkt platformy **WEB FACTOR – WEB FACTOR Commerce**.
Projekt nie będzie tworzony od zera. Zostanie przebudowany na bazie istniejącej infrastruktury.
PLAN 0 definiuje kolejność prac, zasady migracji oraz sposób podejmowania decyzji.
Żadna implementacja nie rozpoczyna się przed zakończeniem PLANU 0.

---

## Główna zasada
**Najpierw rozumiemy projekt.**
**Potem go przebudowujemy.**
Nigdy odwrotnie.

---

## Cele PLANU 0
* zabezpieczenie obecnego projektu,
* pełna inwentaryzacja kodu,
* identyfikacja elementów do ponownego wykorzystania,
* identyfikacja elementów do usunięcia,
* przygotowanie architektury WEB FACTOR Commerce,
* stworzenie kompletnego planu migracji.

---

## Efekt końcowy
Po zakończeniu PLANU 0 zespół dokładnie wie:
* co zostaje,
* co przebudowujemy,
* co usuwamy,
* w jakiej kolejności pracujemy,
* jakie są zależności,
* jakie są ryzyka.
Dopiero wtedy rozpoczyna się implementacja.

---

## ETAP 0.1 — Code Freeze
**Cel:** Zamrożenie obecnego projektu.
**Zadania:**
* wykonanie pełnego backupu repozytorium,
* oznaczenie wersji projektu,
* zabezpieczenie konfiguracji,
* zabezpieczenie środowisk,
* eksport bazy danych,
* eksport Storage,
* zapis konfiguracji produkcyjnej.
**Rezultat:** Powstaje punkt przywracania projektu.

---

## ETAP 0.2 — Code Audit
**Cel:** Poznanie obecnego projektu.
**Audyt obejmuje:**
* **Frontend:** strony, komponenty, layouty, style, routing
* **Backend:** API, webhooki, logikę biznesową
* **Autoryzację:** logowanie, rejestrację, sesje, role
* **Bazę danych:** tabele, relacje, indeksy, RLS
* **Storage:** obrazy, multimedia, pliki
* **Integracje:** Supabase, 1Koszyk, PostHog, inne usługi
**Rezultat:** Dokument: *Code Audit Report*

---

## ETAP 0.3 — Dependency Audit
**Cel:** Poznanie wszystkich zależności.
**Audyt obejmuje:**
zależności komponentów, zależności routingu, zależności API, zależności bazy, biblioteki npm, zmienne środowiskowe, webhooki, proces wdrożenia.
**Rezultat:** *Dependency Map.*

---

## ETAP 0.4 — Transformation Matrix
Każdy element projektu otrzymuje decyzję.
Możliwe statusy: **REUSE, REFACTOR, REPLACE, REMOVE**

**Przykład:**
* Landing Page → REPLACE
* Dashboard → REFACTOR
* Supabase → REUSE
* Webhook → REFACTOR
* Blog → REWRITE
* Forum → REMOVE
* Audio → REMOVE
* Kontakt → REUSE
* Help Center → REFACTOR

---

## ETAP 0.5 — Data Migration Plan
**Analiza:**
obecnych tabel, nowych tabel, mapowania danych, usuwanych danych, archiwizacji.
**Rezultat:** Powstaje plan migracji bazy.

---

## ETAP 0.6 — UX Migration
Każda obecna podstrona otrzymuje nowy odpowiednik.
**Przykład:**
* `/` ↓ Landing WEB FACTOR
* `Dashboard` ↓ Commerce Dashboard
* `Checkout` ↓ Commerce Checkout
* `Blog` ↓ Blog WEB FACTOR
* `Forum` ↓ Usunięte

---

## ETAP 0.7 — Asset Audit
Analiza wszystkich zasobów:
Logo, Zdjęcia, Audio, Video, Grafiki, Ikony, Dokumenty.
Każdy zasób otrzymuje status.

---

## ETAP 0.8 — Infrastructure Audit
Analiza:
Next.js, Supabase, Hosting, DNS, SSL, Deployment, Monitoring, Backup.

---

## ETAP 0.9 — Risk Assessment
Identyfikacja ryzyk:
Ryzyko utraty danych, Ryzyko awarii, Ryzyko SEO, Ryzyko migracji, Ryzyko integracji.
Dla każdego ryzyka definiowany jest plan ograniczenia skutków.

---

## ETAP 0.10 — Architecture Validation
Sprawdzenie zgodności projektu z Playbookiem.
Czy projekt realizuje: Time To Business, Managed SaaS, Partner Model, Commerce First, Reusable Packages, Platform Core.
Jeżeli nie — wraca do analizy.

---

## Dokumenty powstające w PLANIE 0
* 01_Code_Audit.md
* 02_Dependency_Audit.md
* 03_Transformation_Matrix.md
* 04_Data_Migration_Plan.md
* 05_UX_Migration.md
* 06_Asset_Audit.md
* 07_Infrastructure_Audit.md
* 08_Risk_Assessment.md
* 09_Architecture_Validation.md
* 10_Transformation_Blueprint.md

---

## Kryteria zakończenia PLANU 0
PLAN 0 zostaje zakończony wyłącznie wtedy, gdy:
* [x] wykonano pełny backup projektu,
* [x] zinwentaryzowano cały kod,
* [x] zinwentaryzowano bazę danych,
* [x] zinwentaryzowano zasoby,
* [x] zinwentaryzowano API,
* [x] zinwentaryzowano integracje,
* [x] przygotowano Transformation Matrix,
* [x] przygotowano plan migracji,
* [x] zatwierdzono nową architekturę,
* [x] zatwierdzono harmonogram wdrożenia.

---

## Dokumenty następujące po PLANIE 0
* **PLAN 1:** WEB FACTOR Product Definition Document
* **PLAN 2:** Business Model
* **PLAN 3:** Marketing & UX Blueprint
* **PLAN 4:** WEB FACTOR Commerce Functional Specification
* **PLAN 5:** Architecture Specification
* **PLAN 6:** Database & API Specification
* **PLAN 7:** Implementation Roadmap

---

## Zasada końcowa
PLAN 0 nie służy do pisania kodu.
PLAN 0 służy do zrozumienia projektu, ograniczenia ryzyka i przygotowania bezpiecznej, kontrolowanej transformacji z produktu „Na Dobranoc” do pierwszego produktu platformy **WEB FACTOR Commerce**.
Dopiero po formalnym zakończeniu PLANU 0 rozpoczyna się implementacja.
