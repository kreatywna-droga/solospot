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
- Architecture Specification
- All Development Sprints
---

# SPRINT 0: DISCOVERY
## Zadanie 6 — Architecture Principles
*Konstytucja Architektoniczna platformy WEB FACTOR. Zbiór nienaruszalnych zasad inżynieryjnych i projektowych.*

---

### 1. One Engine Philosophy & Single Engine Architecture (SEA)
1. Jest tylko **jeden silnik** (`Commerce Engine`). Nigdy nie tworzymy nowej gałęzi kodu ani repozytorium dla nowego sklepu.
2. Zmiana zachowania lub wyglądu sklepu wynika z jego konfiguracji i aktywowanych pakietów (Packages), a nie z modyfikacji kodu bazowego.
3. Każde ulepszenie silnika staje się natychmiast dostępne dla wszystkich Partnerów korzystających z danej wersji runtime.

### 2. Database Principles
1. **Database Principle #1:** *The database models the platform, not the current UI.* Baza danych ma odzwierciedlać architekturę platformy, a nie aktualny wygląd panelu administracyjnego.
2. **Database Principle #2:** *Every installable element is represented as a Package.* Motywy, profile branżowe, integracje, wtyczki, agenci AI oraz rozszerzenia muszą być reprezentowane jako ustandaryzowane rekordy w tabeli `packages`.
3. **Database Principle #3:** *RLS Role-Based Access Control.* Izolacja danych w Supabase opiera się o relację z tabeli `store_members` i przypisane role, co eliminuje sztywne przypisanie do jednego właściciela i umożliwia pracę zespołową (np. Manager, Support).

### 3. Package & Extensibility Principles
1. Wszystkie pakiety posiadają plik kontraktu `manifest.json` definiujący ich typ, wersję, wymagane capabilities oraz zależności.
2. Żaden pakiet nie może bezpośrednio modyfikować schematu bazy danych. Zmiany danych pakietów żyją w ustrukturyzowanych polach typu `JSONB` w konfiguracji modułów sklepu.

### 4. Runtime & Provisioning Principles
1. Inicjalizacja nowej instancji sklepu (Provisioning) musi odbywać się w sposób w pełni zautomatyzowany za pośrednictwem webhooka bramki płatniczej.
2. Silnik opiera routing i dopasowanie danych o Middleware, dynamicznie rozpoznając identyfikator dzierżawcy na podstawie subdomeny lub domeny własnej.

### 5. Experience & Business Launch Principles (TTB)
1. **Experience Principle #1:** *Każdy ekran powinien przybliżać Partnera do pierwszej sprzedaży lub rozwoju biznesu. Jeżeli ekran tego nie robi, nie powinien istnieć.*
2. **Business Launch over Onboarding:** Nigdy nie projektujemy "onboardingu" do aplikacji. Projektujemy proces uruchamiania biznesu (*Business Launch Checklist*).
3. **Puste stany (Empty States) są zabronione:** Pierwsze logowanie Partnera musi natychmiast załadować szablon demo sklepu wraz z 3 krokami wdrożenia (Logo -> Produkt -> Publikacja) w celu skrócenia czasu do pierwszego odczucia wartości (TTFV).
4. **Principle of Intentional Complexity:** *System może być złożony wewnętrznie, ale zawsze powinien wydawać się prosty dla Partnera.* Partner nie musi rozumieć jak działa Runtime czy RLS – system ma po prostu działać bez wysiłku poznawczego.

### 6. Security & Isolation Principles
1. Bezwzględna separacja dzierżawców w bazie danych za pomocą RLS (Row Level Security). Naruszenie izolacji danych skutkuje natychmiastowym zatrzymaniem builda produkcyjnego.
2. Kod z zewnątrz (np. skrypty integracji zewnętrznych) może być uruchamiany wyłącznie w izolowanej piaskownicy (Sandbox) lub za pośrednictwem zarejestrowanych webhooków bez bezpośredniego dostępu do bazy produkcyjnej.
3. **Audyt Impersonacji:** Każda sesja impersonacji (logowania w zastępstwie Partnera przez administratora w celu wsparcia technicznego) jest bezwzględnie rejestrowana. Wymaga podania uzasadnienia biznesowego, rejestruje czas rozpoczęcia i zakończenia sesji oraz generuje pełny audit trail w bazie danych.

---

### 7. Evolution & Compatibility Principles (v2.0 Recommendation)
1. **Zgodność wsteczna (Backward Compatibility):** Każda aktualizacja silnika (Core), pakietu (Package) czy struktury konfiguracji (Configuration Schema) musi być wprowadzana z zachowaniem pełnej kompatybilności wstecznej z aktywnymi sklepami.
2. **Rozszerzanie zamiast modyfikacji (Extend, Don't Mutate):** Nowe funkcjonalności powinny być dodawane jako opcjonalne moduły lub rozszerzenia schematu konfiguracyjnego, a nie bezpośrednie modyfikacje istniejących metod.

### 8. Performance & Observability Principles (v2.0 Recommendation)
1. **Monitorowanie Krytyczne (Observability):** Każdy krytyczny krok biznesowy (płatności, proces tworzenia sklepu, routing domeny, zapytania do bazy danych) musi być w pełni monitorowany logami analitycznymi w panelu administracyjnym.
2. **Bezpieczeństwo wydajnościowe (Performance Isolation):** Ciężkie operacje lub specyficzne optymalizacje wydajnościowe jednego Partnera nie mogą wpływać na czasy odpowiedzi silnika pozostałych instancji sklepowych.

### 9. Governance & Change Principles
1. **Architecture Decision Record (ADR):** Żadna fundamentalna decyzja projektowa, zasada bazodanowa lub inżynieryjna zdefiniowana w Konstytucji nie może zostać zmodyfikowana lub ominięta bez formalnego utworzenia i zatwierdzenia dokumentu ADR.
