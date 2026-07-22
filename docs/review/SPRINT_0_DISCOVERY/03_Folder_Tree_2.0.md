---
Status: REVIEW
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.1
Last Review: 2026-07-09
Freeze Version: -
Depends On:
- 02_Transformation_Matrix.md
- 07_ENGINE_DNA_SPECIFICATION.md
Blocks:
- Development Sprint 1
---

# SPRINT 0: DISCOVERY
## Zadanie 3 — Folder Tree 2.0
*Zaprojektowana docelowa architektura katalogów platformy WEB FACTOR.*

To nie jest struktura zwykłej aplikacji Next.js. To struktura Platformy, w której Next.js App Router stanowi jedynie warstwę widoku i routingu, a cała logika żyje w wyizolowanych domenach. Każdy katalog ma ściśle określoną odpowiedzialność, bez używania generycznych nazw typu `utils` czy `misc`.

### Docelowe Drzewo Katalogów (Platform Architecture)

```text
src/
├── app/                              # WARSTWA WIDOKU I ROUTINGU (MVP)
│   ├── (marketing)/                  # Prezentacja B2B (Landing, Pakiety) [MVP]
│   ├── (partner)/                    # Portal Partnera (Zarządzanie sklepem) [MVP]
│   ├── (mission)/                    # Mission Control (Zarządzanie flotą) [MVP]
│   ├── (store-runtime)/              # Odpalanie konkretnego sklepu (Middleware) [MVP]
│   └── api/
│       ├── internal/                 # Prywatne API dla Mission Control i Partner [MVP]
│       ├── public/                   # Publiczne API dla sklepów [Future]
│       └── webhooks/                 # Nasłuch 1koszyk, Stripe [MVP]
│
├── engines/                          # SILNIKI DOMENOWE (LOGIKA BIZNESOWA)
│   ├── commerce/                     # Główny Commerce Engine (Koszyk, Checkout) [MVP]
│   └── booking/                      # Moduł Rezerwacji [Future]
│
├── packages/                         # SYSTEM PAKIETÓW (WEB FACTOR DNA)
│   ├── themes/                       # Motywy wizualne (CSS/Siatki) [MVP]
│   ├── profiles/                     # Konfiguracje branżowe (Fashion, Electronics) [MVP]
│   ├── blocks/                       # Komponenty UI Storefrontu [MVP]
│   ├── capabilities/                 # Funkcje (np. HasSizes, B2B_Pricing) [MVP]
│   ├── workflows/                    # Automatyzacje procesów [Future]
│   ├── integrations/                 # Połączenia 3rd party (np. InPost) [Future]
│   └── ai-agents/                    # Agenty AI [Future]
│
├── core/                             # RDZEŃ PLATFORMY
│   ├── identity/                     # Autoryzacja i logowanie [MVP]
│   ├── tenant/                       # Tenant Management & RLS [MVP]
│   └── security/                     # Zabezpieczenia [MVP]
│
├── runtime/                          # ŚRODOWISKO URUCHOMIENIOWE
│   ├── renderer/                     # Składanie sklepu z Profilu i Tematu [MVP]
│   └── event-bus/                    # Komunikacja wewnętrzna [MVP]
│
├── services/                         # NIEZALEŻNE USŁUGI (MIKRO-SERWISY)
│   ├── provisioning/                 # Tworzenie nowych sklepów po płatności [MVP]
│   ├── billing/                      # Odnawianie subskrypcji [MVP]
│   ├── storage/                      # Obsługa plików CDN [MVP]
│   ├── notifications/                # E-maile [MVP]
│   ├── seo/                          # Metadane i indeksowanie [MVP]
│   └── analytics/                    # PostHog i statystyki sprzedaży [MVP]
│
├── shared/                           # REUŻYWALNY KOD WSPÓŁDZIELONY [MVP]
│   ├── ui/                           # Przyciski, Formularze, Modale (Platforma)
│   ├── hooks/                        # Custom React Hooks
│   ├── types/                        # Interfejsy TypeScript (Globalne)
│   └── constants/                    # Konfiguracja bazowa
│
└── docs/
    └── contracts/                    # Umowy API, Events, Packages [MVP]
```

### Ograniczenie Zakresu (MVP vs Future)
Aby nie wpaść w pułapkę budowania *frameworka dla frameworka*, struktura narzuca żelazne zasady wdrożenia:
- Katalogi oznaczone jako **[MVP]** to priorytet absolutny. Są wymagane, by zamknąć "Time To Business" w docelowym przedziale.
- Katalogi oznaczone jako **[Future]** (np. `workflows`, `ai-agents`, `public api`) projektujemy architektonicznie na poziomie interfejsów, ale ich fizyczna implementacja jest zamrożona do czasu stabilizacji pierwszej wersji *WEB FACTOR Commerce*.
