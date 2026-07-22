# Checklista Wdrożeniowa: WEB FACTOR (SaaS)

Poniższa lista zawiera najważniejsze kroki do pełnego, produkcyjnego uruchomienia aplikacji. Zaznaczyłem to, co z naszego dotychczasowego kontekstu wynika, że jest już gotowe.

## 1. Hosting (Vercel)
- [x] Założenie projektu w Vercel
- [x] Podpięcie repozytorium GitHub / Vercel CLI
- [x] Pierwszy udany deploy (aplikacja jest widoczna pod adresem `solospot.vercel.app`)

## 2. Domena (Custom Domain)
- [x] Kupno docelowej domeny (`solospot.pl`)
- [x] Dodanie domeny w panelu Vercel (`Settings` -> `Domains` -> `Add`)
- [x] Skopiowanie rekordów DNS z Vercela i ustawienie ich u rejestratora domeny (Seohost - delegacja ns1/ns2)
- [ ] Oczekiwanie na propagację i zielone/niebieskie światło w Vercel (wygenerowanie certyfikatu SSL)
- [ ] Zaktualizowanie zmiennej `NEXT_PUBLIC_APP_URL` na nową, docelową domenę.

## 3. Baza Danych (Supabase Production)
- [x] Stworzenie oddzielnego, produkcyjnego projektu w Supabase (żeby nie psuć bazy dev)
- [ ] Zastosowanie wszystkich migracji (`supabase db push`) w bazie produkcyjnej
- [ ] Włączenie RLS (Row Level Security) - aby dane klientów były bezpieczne
- [x] Skopiowanie produkcyjnych kluczy (URL, ANON_KEY) i dodanie ich do "Environment Variables" w Vercel
- [ ] Hasła zapisane bezpiecznie w menedżerze haseł.

## 4. Weryfikacja Kodu (Testy i Build)
- [ ] Uruchomienie aplikacji lokalnie i weryfikacja funkcji (Rejestracja, Marketplace, Builder)
- [x] Pomyślne przejście testów: `npx vitest run` (819 testów zaliczonych na zielono!)
- [x] Pomyślne sprawdzanie typów: `npx tsc --noEmit` (0 błędów - perfekcyjnie!)
- [x] Kompilacja produkcji: `npm run build` bez zająknięcia (zakończone sukcesem)

## 5. Integracje (Webhooki i Płatności)
- [ ] Skonfigurowanie webhooka 1Koszyk / Stripe, aby wskazywał na `https://twoja-domena.pl/api/webhooks/...`
- [ ] Ustawienie tajnego klucza webhooka w zmiennych środowiskowych Vercel
- [ ] Przeprowadzenie pełnego testu zakupu (Demo Store -> Płatność -> Automatyczne postawienie sklepu klienta).

---
*Możesz odhaczać (`[x]`) kolejne punkty w tym dokumencie w miarę postępów!*
