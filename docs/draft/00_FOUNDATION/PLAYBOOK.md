# WEB FACTOR
**Company Playbook & Enterprise Implementation Blueprint**
*Version 1.0 – Foundation Edition*

## 1. Manifest
**Kim jesteśmy**
WEB FACTOR nie jest firmą sprzedającą strony internetowe.
Nie jest również kreatorem sklepów.
Nie jest kolejnym SaaS.
WEB FACTOR jest partnerem technologicznym, który umożliwia przedsiębiorcom rozpoczęcie sprzedaży internetowej bez konieczności projektowania i budowania sklepu od podstaw.
Naszym produktem jest gotowy biznes online.

## 2. Misja
Usuwamy technologiczne bariery wejścia do e-commerce.
Przedsiębiorca powinien skupić się na sprzedaży.
Technologia jest naszym obowiązkiem.

## 3. Wizja
Stworzyć najbardziej zaufaną platformę do uruchamiania i rozwijania biznesów internetowych.
Docelowo WEB FACTOR stanie się platformą, na której będą działały różne rozwiązania biznesowe, jednak pierwszym produktem pozostaje WEB FACTOR Commerce.

## 4. Brand Promise
My zajmujemy się technologią.
Ty rozwijasz swój biznes.

## 5. Time To Business
Najważniejszy wskaźnik firmy (wewnętrzny kompas).
Time To Business oznacza czas od zakupu produktu do chwili, w której klient może rozpocząć sprzedaż.
Każda decyzja projektowa musi odpowiadać na pytanie:
*Czy skraca Time To Business?*
Jeżeli nie — funkcja nie jest priorytetem.

## 6. Product Philosophy
Klient nie kupuje technologii.
Kupuje spokój i pewność. 
Dostaje:
- gotowy sklep,
- gotowy panel,
- gotowy hosting,
- gotowe bezpieczeństwo,
- gotowe aktualizacje,
- gotowe wsparcie,
- gotowego partnera.

## 7. Product Principles
- Klient nigdy nie projektuje sklepu od zera.
- Klient rozwija gotowy produkt.
- Technologia jest niewidoczna.
- Każda funkcja musi skracać drogę do sprzedaży.
- Każda nowa funkcja powinna nadawać się do ponownego wykorzystania.
- Każda funkcja powinna działać modułowo.
- Platforma rozwija się razem z klientem (We Grow With You).

## 8. Business Model
Model: **Launch ↓ Grow ↓ Partner**

- **Launch**: Klient kupuje gotowy sklep.
- **Grow**: Klient rozwija sklep poprzez gotowe moduły oraz personalizację.
- **Partner**: WEB FACTOR pozostaje partnerem technologicznym i rozwija rozwiązanie razem z klientem.

## 9. Oferta
Bardzo prosty model produktu:
- **START**: Uruchomienie gotowego sklepu.
- **GROW**: Rozbudowa o kolejne możliwości.
- **SCALE**: Zaawansowane funkcje, indywidualne wdrożenia i priorytetowe wsparcie.

## 10. Największa przewaga
Nie konkurujemy liczbą funkcji. Konkurujemy:
- szybkością uruchomienia,
- prostotą,
- bezpieczeństwem,
- partnerstwem,
- ciągłym rozwojem ("Zrobimy to dla Ciebie").

## 11. Strona internetowa
Cel: Sprzedaż gotowych biznesów online. Nie sprzedaż technologii.
Architektura komunikacji ma pokazywać „co otrzymujesz”, a nie „funkcje”.

**Landing Page:**
- Hero
- Korzyści
- Branże
- Demo sklepów
- Proces uruchomienia
- Pakiety
- Dlaczego WEB FACTOR
- Historie klientów
- FAQ
- Kontakt
- CTA

## 12. Hero
Uruchom swój biznes online jeszcze dziś.
Otrzymasz gotowy sklep internetowy.
Dodaj produkty.
Rozpocznij sprzedaż.

## 13. Co otrzymujesz
✔ Gotowy sklep
✔ Panel administracyjny
✔ Hosting
✔ SSL
✔ Kopie zapasowe
✔ Aktualizacje
✔ Bezpieczeństwo
✔ Wsparcie
✔ Rozwój
✔ Partnera technologicznego

## 14. Customer Journey
Wejście na stronę ↓ Wybór branży ↓ Wybór szablonu ↓ Zakup ↓ Automatyczne utworzenie sklepu ↓ Logowanie ↓ Dodanie produktów ↓ Rozpoczęcie sprzedaży

## 15. Managed SaaS (Partnerstwo)
Po zakupie klient nigdy nie zostaje sam. Klient to nasz **Partner**.
WEB FACTOR zapewnia:
- aktualizacje,
- rozwój,
- wsparcie,
- konsultacje,
- nowe moduły,
- pomoc techniczną.

## 16. Model rozwoju
Jeżeli partner potrzebuje nowej funkcji:
1. zgłasza potrzebę ("Potrzebuję sekcji do rezerwacji"),
2. funkcja jest analizowana,
3. zostaje wykonana jako moduł ("Zrobimy ją"),
4. jeżeli ma wartość dla innych klientów — trafia do biblioteki platformy.

Tworzymy raz. Sprzedajemy wielokrotnie.

## 17. Architektura produktu
- **Warstwa 1 (Business Solution):** WEB FACTOR Commerce
- **Warstwa 2 (Domain Engine):** Commerce Engine
- **Warstwa 3 (Platform Core):** Identity, Authorization, Storage, Events, Configuration, Permissions, Caching, Routing, Rendering, Billing, Deployment
- **Warstwa 4 (Infrastructure):** Next.js, Supabase, Storage, CDN, CI/CD, Monitoring

## 18. Runtime
Platform Runtime odpowiada za:
ładowanie pakietów, rozwiązywanie zależności, inicjalizację sklepu, konfigurację, rejestrację zdarzeń, uruchamianie usług, renderowanie.

## 19. Package System
Każdy element platformy jest Package.
Rodzaje: Theme, Block, Capability, Workflow, Integration, Template, Language, AI Agent.

## 20. Lifecycle
Install → Validate → Enable → Configure → Publish → Monitor → Update → Rollback → Disable → Remove

## 21. Partner Operations Center (Mission Control)
Centralna aplikacja operatora (zamiast technicznego Mission Control).
Zawiera zarządzanie: partnerami, sklepami, subskrypcjami, billingiem, zgłoszeniami, wdrożeniami, monitoringiem, logami, bezpieczeństwem, aktualizacjami.

## 22. Bezpieczeństwo
Role, Uprawnienia, Audyt, Historia zmian, Rollback, Logi, RLS, Kopie zapasowe.

## 23. Dokumentacja projektu
- **VISION**: Manifest, Strategia, Business Model, Roadmap
- **ARCHITECTURE**: Platform Core, Runtime, Package System, Security, Mission Control, ADR, Event Contracts, Domain Model
- **IMPLEMENTATION**: Sprinty, Roadmap, Migracje, Checklisty, Testy, Deployment

## 24. Roadmapa
- **Faza 0 (Platform Foundation):** Identity, Tenant Manager, Runtime, Event Bus, Package System, Permission System
- **Faza 1 (WEB FACTOR Commerce):** Landing Page, Cennik, Zakup, Provisioning, Dashboard, Szablony, Produkty, Zamówienia, Mission Control, Biblioteka bloków
- **Faza 2 (Rozszerzalność):** Marketplace, Workflow Engine, AI, Capability Packages, SDK
- **Faza 3 (Nowe domeny):** Booking, Restaurant (Kolejne rozwiązania tylko wtedy, gdy potwierdzi je rynek).

## 25. Definition of Done
Produkt uznaje się za gotowy, gdy:
- klient może kupić sklep,
- sklep tworzy się automatycznie,
- klient dodaje produkty,
- klient może rozpocząć sprzedaż,
- Time To Business mieści się w założonym celu,
- wszystkie procesy są monitorowane,
- dostępne są logi i mechanizmy odzyskiwania.

## 26. Decision Principles
Każda decyzja produktowa musi odpowiedzieć twierdząco na poniższe pytania:
- Czy skraca Time To Business?
- Czy upraszcza obsługę klientowi?
- Czy można ją ponownie wykorzystać?
- Czy zwiększa stabilność platformy?
- Czy nie komplikuje niepotrzebnie produktu?
- Czy wspiera model managed SaaS?

Jeżeli odpowiedź brzmi "nie", funkcja nie trafia do bieżącego zakresu prac.

## 27. Ostateczna definicja WEB FACTOR
WEB FACTOR to firma dostarczająca gotowe biznesy internetowe.
Technologia pozostaje w tle.
Klient otrzymuje gotowe środowisko sprzedaży, wsparcie, rozwój i partnera technologicznego, dzięki czemu może skoncentrować się wyłącznie na rozwoju własnego biznesu.

## 28. Engineering Manifesto (Single Engine Architecture)

**Engineering Principle #1: One Engine Philosophy**
WEB FACTOR rozwija wyłącznie jeden Commerce Engine. Każdy sklep działa na tym samym silniku. Nie istnieją osobne silniki dla branż ani indywidualne implementacje logiki.

**Engineering Principle #2: Configuration Over Custom Code**
Tożsamość sklepu definiowana jest przez dane (konfigurację), nigdy przez kod. Zmieniają się jedynie: Theme, Branding, Profile, Content, Modules, Configuration. Silnik pozostaje identyczny.

**Engineering Principle #3: Theme Never Changes Logic**
Theme odpowiada wyłącznie za wygląd, kolory, typografię, animacje i układ wizualny. Nigdy nie zawiera logiki biznesowej.

**Engineering Principle #4: Every Feature Belongs To The Engine**
Nowa funkcjonalność nigdy nie powstaje tylko dla jednego sklepu. Jest implementowana w Commerce Engine i staje się dostępna dla wszystkich. Tworzymy raz, udostępniamy wszystkim.

**Engineering Principle #5: Reuse Before Rewrite**
Zanim napiszemy nowy kod, sprawdzamy: czy to już istnieje, czy można to rozszerzyć lub skonfigurować. Nowy kod to ostateczność.

**Engineering Principle #6: Every Improvement Improves Every Store**
Każda poprawka wydajności, SEO czy bezpieczeństwa automatycznie poprawia wszystkie sklepy. Nie rozwijamy pojedynczego sklepu – rozwijamy całą platformę.

**Engineering Principle #7: Store Profiles**
Sklep nie jest projektem – jest instancją Commerce Engine. Profil sklepu definiuje branżę, motyw, domyślne moduły i układ.

**Engineering Principle #8: Modules Before Customization**
Potrzeby klienta zaspokajamy konfigurując moduły. Dedykowane rozwiązania "z ręki" to ostateczność.

**Engineering Principle #9: Copy Nothing**
Bezwzględny zakaz kopiowania całych sklepów (powielania kodu). Sklepy powstają przez Provisioning nowej instancji (nowego rekordu w bazie) dla tego samego kodu źródłowego.

**Engineering Principle #10: One Bug Fix = Infinite Value**
Jedna poprawka w rdzeniu systemu to zysk dla każdego z 1000 wygenerowanych sklepów.

## 29. Architecture DNA

Niezmienne, wspólne DNA każdego sklepu:

                  WEB FACTOR
                      │
             Commerce Engine
                      │
          -----------------------
          │                     │
      Store Profile        Modules
          │                     │
      Configuration       Capabilities
          │                     │
          -------- Rendering -----
                    │
                 Theme
                    │
                 Branding
                    │
                  Content
                    │
## 30. Database Principles

**Database Principle #1: The database models the platform, not the current UI.**
Baza danych musi odzwierciedlać architekturę platformy, a nie aktualny wygląd panelu administracyjnego czy tymczasowe wymagania widoków.

**Database Principle #2: Every installable element is represented as a Package.**
Każdy instalowalny lub wdrażalny element platformy (Theme, Profile, Module, Capability, Integration, Workflow, Language, AI Agent) musi być reprezentowany w bazie danych jako ustandaryzowany rekord w tabeli `packages`. Ułatwia to wdrażanie, wersjonowanie i przyszłą budowę Marketplace.

**Database Principle #3: RLS Role-Based Access Control.**
Dostęp do danych w bazie Supabase jest regulowany przez RLS w oparciu o członkostwo i role w tabeli `store_members`, a nie proste przypisanie pojedynczego właściciela.

## 31. Experience Principles

**Experience Principle #1: Każdy ekran powinien przybliżać Partnera do pierwszej sprzedaży lub rozwoju biznesu. Jeżeli ekran tego nie robi, nie powinien istnieć.**
Zasada ta stanowi filtr projektowy dla dashboardu i interfejsów panelu administracyjnego. Wszystkie widoki i widgety muszą bezpośrednio wspierać cele biznesowe Partnera (uruchomienie, sprzedaż, rozwój), eliminując zbędne ekrany konfiguracyjne.
