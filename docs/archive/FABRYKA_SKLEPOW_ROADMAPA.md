# Roadmapa Implementacji: Fabryka Sklepów (SaaS)

Aby z sukcesem przebudować aplikację na potężną platformę sprzedażową, podzieliłem prace na 5 logicznych etapów. Będziemy realizować je krok po kroku.

## Faza 1: Fundamenty Danych (Multi-Tenant w Supabase)
Najpierw musimy przygotować bazę danych do obsługi tysięcy niezależnych sklepów.

*   [ ] **Krok 1.1:** Stworzenie tabeli `stores` (`id`, `owner_id`, `nazwa_sklepu`, `domena`, `status`).
*   [ ] **Krok 1.2:** Stworzenie tabeli `store_products` (`id`, `store_id`, `nazwa`, `cena`, `opis`, `zdjecie_url`).
*   [ ] **Krok 1.3:** Stworzenie tabeli `store_orders` (`id`, `store_id`, `dane_klienta`, `kwota`, `status`).
*   [ ] **Krok 1.4:** Wdrożenie rygorystycznych zasad RLS (Row Level Security), aby właściciele widzieli tylko dane własnych sklepów.

## Faza 2: Panel Sterowania dla Klienta (Dashboard)
Twój klient po zapłaceniu musi mieć miejsce, gdzie dodaje swoje produkty. Zbudujemy go w `/app/dashboard`.

*   [ ] **Krok 2.1:** Budowa głównego widoku statystyk (ilość zamówień, przychody ze sklepu klienta).
*   [ ] **Krok 2.2:** Formularz "Dodaj Produkt" (z uploadem zdjęć do Supabase Storage).
*   [ ] **Krok 2.3:** Tabela zarządzania asortymentem (Edycja/Usuwanie produktów).
*   [ ] **Krok 2.4:** Widok "Zamówienia", pozwalający klientowi zmieniać status wysyłki jego paczek.
*   [ ] **Krok 2.5:** Zakładka "Wygląd", gdzie klient wybiera kolory i wpisuje nazwę swojego sklepu.

## Faza 3: Silnik Sklepu (Front-End dla kupujących)
To najważniejsza technologicznie część – system, który na żywo generuje sklep na podstawie bazy danych.

*   [ ] **Krok 3.1:** Budowa dynamicznego routingu `app/sklep/[store_slug]/page.tsx`.
*   [ ] **Krok 3.2:** Integracja pobierania i wyświetlania produktów (jeśli wejdę na `/sklep/kamil`, widzę tylko buty Kamila).
*   [ ] **Krok 3.3:** Koszyk zakupowy dla ostatecznych kupujących (zapisywany w LocalStorage).
*   [ ] **Krok 3.4:** Prosty formularz kasy (Checkout), który po wypełnieniu zapisuje zamówienie w tabeli `store_orders` danego sklepu.

## Faza 4: Sprzedaż Platformy (Twoja Oferta)
Mając gotowy system, musimy go skutecznie sprzedawać.

*   [ ] **Krok 4.1:** Usunięcie starych treści i zaprojektowanie nowego Landing Page'a na stronie głównej (Hero sekcja z hasłem "Twój sklep w 1 minutę").
*   [ ] **Krok 4.2:** Tabela cennikowa prezentująca 3 plany subskrypcyjne.
*   [ ] **Krok 4.3:** Przebudowa Webhooka 1koszyk: gdy klient kupi Twój plan, system automatycznie `INSERT`uje dla niego nowy, pusty sklep do tabeli `stores`.

## Faza 5: Testy i Automatyzacja
*   [ ] **Krok 5.1:** Testowy cykl życia od A do Z: (Ty kupujesz w 1koszyku -> dostajesz sklep -> logujesz się -> dodajesz produkt -> "jakiś" klient wchodzi na Twój sklep i go kupuje).
*   [ ] **Krok 5.2:** Optymalizacja szybkości (Next.js Cache).
*   [ ] **Krok 5.3:** Konfiguracja subdomen (opcjonalnie w przyszłości: przypinanie własnych domen klientów za pomocą Vercel Domains API).
