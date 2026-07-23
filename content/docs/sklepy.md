---
title: "Konfiguracja Sklepu"
description: "Dowiedz się, jak dostosować wygląd swojego sklepu, zarządzać produktami i obsługiwać zamówienia."
category: "Dla Sklepów"
order: 1
---

Gdy zarejestrujesz swój pierwszy sklep na SoloSpot, otrzymujesz dostęp do unikalnego panelu nawigacyjnego zwanego **Dashboardem**.

## Podstawowa Konfiguracja

Zanim zaprosisz pierwszych klientów, upewnij się, że Twój sklep wygląda profesjonalnie i wzbudza zaufanie. W zakładce **Ustawienia Sklepu** możesz zmienić:
* Nazwę sklepu i krótki opis
* Logo firmy
* Podstawowe kolory marki (tzw. Accent Color)
* Główną domenę lub własną niestandardową domenę z certyfikatem SSL

Wszystkie te zmiany automatycznie synchronizują się z silnikiem Vercela pod spodem, dzięki czemu Twoi klienci od razu widzą efekty na produkcji.

## Dodawanie Produktów Cyfrowych

SoloSpot traktuje produkty inaczej niż klasyczne platformy. Nie wymagamy podawania wagi paczki czy wymiarów przesyłki. Skupiamy się na dostępie cyfrowym.

Aby dodać produkt, wejdź w zakładkę **Produkty -> Nowy Produkt**:

1. **Typ produktu**: Wybierz, czy sprzedajesz plik do pobrania (np. ZIP, PDF), czy może klucz licencyjny.
2. **Cena**: Ustaw cenę w swojej lokalnej walucie. SoloSpot automatycznie wyliczy podatki VAT OSS, jeśli zajdzie taka potrzeba.
3. **Zasób**: Wgraj plik na nasz bezpieczny serwer CDN, do którego użytkownicy otrzymają ograniczony czasowo dostęp po opłaceniu zamówienia.

```json
{
  "product_id": "prod_x8fj320",
  "name": "Kolekcja presetów Lightroom",
  "type": "digital_download",
  "price": 4900,
  "currency": "PLN"
}
```

Powyższy blok kodu pokazuje przykładową strukturę w naszej bazie.

## Obsługa zamówień

Zarządzanie zamówieniami odbywa się w głównej sekcji Dashboardu. Widzisz tam najnowsze transakcje, status ich opłacenia oraz czy klient pomyślnie pobrał swój plik. Wszystko dzieje się automatycznie, w 99% przypadków nie wymaga Twojej interwencji!
