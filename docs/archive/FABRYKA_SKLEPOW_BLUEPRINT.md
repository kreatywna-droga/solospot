# Projekt: Fabryka Sklepów (SaaS) - Transformacja Architektury

Oto plan generalnego remontu naszej obecnej bazy kodowej "Na Dobranoc". Wykorzystamy potęgę Next.js, Supabase i 1koszyk, które już mamy idealnie skonfigurowane, ale zmienimy ich przeznaczenie – z aplikacji mobilnej na zautomatyzowaną fabrykę do produkowania i sprzedaży sklepów internetowych (w architekturze Multi-Tenant).

## 1. Plan Transformacji (Master Plan)

### Krok 1: Przebudowa Frontendu (Landing Page i Oferta)
*   **Zmiana tematyki całej strony głównej (`/`)**. Zamiast bajek i usypiania, tworzymy potężny, nowoczesny Landing Page pokazujący korzyści z gotowych sklepów internetowych (np. "Twój własny sklep w 60 sekund").
*   **Stworzenie sekcji Cennik (`/cennik`)** prezentującej 3 pakiety (np. Starter, Pro, VIP).
*   **Przeprojektowanie sekcji Porównanie funkcji**, aby pokazać, co wchodzi w skład każdego planu (integracje, własna domena, nielimitowane produkty).

### Krok 2: Multi-Tenant Backend (Supabase)
Obecnie w bazie mamy profile, opinie i forum. Musimy stworzyć architekturę "sklepów w sklepie".

*   Stworzymy nową tabelę `stores` (sklepy). Każdy sklep będzie miał swojego właściciela (`owner_id` przypisane do konkretnego użytkownika).
*   Stworzymy tabele `store_products` oraz `store_orders`. Każdy wiersz w tych tabelach będzie musiał posiadać `store_id`, by system wiedział, że "Ten but należy do sklepu Kamila, a ta czapka do sklepu Anny".
*   Zastosujemy RLS (Row Level Security), aby Kamil nie mógł edytować produktów w sklepie Anny.

### Krok 3: Automatyzacja Zakupu (Webhook i 1koszyk)
Przebudujemy nasz obecny `/api/webhooks/onekoszyk`.
Gdy klient kupi pakiet w 1koszyk, Webhook odpali skrypt, który:
1.  Założy klientowi konto premium.
2.  Automatycznie wpisze do bazy Supabase nowy rekord w tabeli `stores` (czyli wygeneruje mu pusty, gotowy sklep z domyślnym szablonem).
3.  Wyśle maila powitalnego z linkiem do panelu.

### Krok 4: Panel Sprzedawcy (Dashboard)
Zamiast odtwarzacza bajek, `/dashboard` stanie się profesjonalnym panelem zarządzania (CMS).
*   Klient będzie mógł tam dodawać swoje własne produkty, ustawiać kolory swojego sklepu, dodawać logo i podglądać swoje zamówienia.

### Krok 5: Silnik Wyświetlania Sklepów (Dynamic Routing)
Stworzymy dynamiczną ścieżkę Next.js (np. `/sklep/[nazwa]`), która będzie odpytywać bazę Supabase o dane konkretnego sklepu i renderować na żywo stronę dla ostatecznych kupujących.

---

## 2. Drzewo Architektury (Pliki i Foldery)

Poniżej znajduje się mapa tego, jak będzie wyglądał nasz kod po transformacji (z wykorzystaniem obecnych fundamentów):

```text
frontend-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Główny layout platformy SaaS
│   │   ├── page.tsx                     # Landing Page (Sprzedaż Twoich sklepów)
│   │   ├── cennik/
│   │   │   └─ page.tsx                  # Pakiety abonamentowe (Basic, Pro, VIP)
│   │   ├── checkout/
│   │   │   └─ page.tsx                  # Przekierowanie do 1koszyk
│   │   ├── api/
│   │   │   └─ webhooks/
│   │   │       └─ onekoszyk/
│   │   │           └─ route.ts          # Zmodyfikowany webhook: tworzy nowy sklep w bazie po zapłacie
│   │   │
│   │   ├── dashboard/                   # PANEL ZARZĄDZANIA SKLEPEM (dla Twoich klientów)
│   │   │   ├── layout.tsx               # Lewe menu (Produkty, Zamówienia, Ustawienia)
│   │   │   ├── page.tsx                 # Główne statystyki wygenerowanego sklepu
│   │   │   ├── produkty/
│   │   │   │   └─ page.tsx              # Klient dodaje tu swoje towary (zapis do 'store_products')
│   │   │   ├── zamowienia/
│   │   │   │   └─ page.tsx              # Lista kupujących u Twojego klienta
│   │   │   └─ ustawienia/
│   │   │       └─ page.tsx              # Kolory szablonu, nazwa domeny, integracje
│   │   │
│   │   ├── sklep/                       # SILNIK GENERUJĄCY SKLEPY W INTERNECIE
│   │   │   └─ [store_slug]/             # np. twojastrona.pl/sklep/kamil-shoes
│   │   │       ├── page.tsx             # Witryna sklepu wygenerowana z bazy danych
│   │   │       └─ produkt/
│   │   │           └─ [product_id]/
│   │   │               └─ page.tsx      # Strona konkretnego produktu w wygenerowanym sklepie
│   │   │
│   ├── components/
│   │   ├── saas/                        # Komponenty dla Twojej strony sprzedażowej (Cenniki, Hero)
│   │   ├── dashboard/                   # Komponenty panelu (Wykresy, tabele produktów)
│   │   └─ store-templates/              # Szablony graficzne sklepów dla Twoich klientów
│   │
│   └── lib/
│       └── supabase.ts                  # Logika łączenia z bazą (wymaga nowych tabel Multi-Tenant)
│
└── supabase/
    └── migrations/
        └── 001_ecommerce_schema.sql     # Skrypt SQL tworzący struktury sklepów w Supabase
```

---

## 3. Podsumowanie bazy danych (Supabase)

Aby ten system zadziałał, obecną bazę rozbudujemy o następującą relacyjną pajęczynę:

*   **`profiles`**: Twoi klienci (właściciele wygenerowanych sklepów).
*   **`stores`**: Lista wszystkich wygenerowanych sklepów (np. nazwa: "Kamil Shoes", slug: "kamil-shoes", theme_color: "#ff0000").
*   **`store_products`**: Asortyment dodawany przez klientów.
*   **`store_orders`**: Transakcje zawierane w wygenerowanych sklepach.
