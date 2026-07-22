---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.1
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_1_FOUNDATION/01_Platform_Core_Architecture.md
- docs/review/SPRINT_1_FOUNDATION/07_Runtime_Composition_Engine.md
---

# SPRINT 1: FOUNDATION IMPLEMENTATION
## Zadanie 8 — Rendering Pipeline Specification
*Specyfikacja potoku renderowania stron, integracji z silnikiem SEO oraz budżetu wydajnościowego warstwy UI w oparciu o React Server Components.*

---

### 1. Architektura Potoku Renderowania (Rendering Flow)

Platforma WEB FACTOR wykorzystuje hybrydowy model renderowania Next.js (React Server Components jako domyślna warstwa logiczna oraz Client Components do interaktywności w przeglądarce).

```text
  [RuntimeSnapshot]
         │
         ▼
  Root Layout (RSC - Wstrzyknięcie CSS Variables motywu do tagu <html>)
         │
         ▼
  SEO Engine (Wygenerowanie tagów <title> i <meta> na bazie snapshotu)
         │
         ▼
  Dynamic Routing (Wywołanie odpowiedniego widoku w oparciu o aktywne pakiety)
         │
         ▼
  React Server Components (Pobranie czystych danych z bazy z użyciem RLS)
         │
         ▼
  [Przeglądarka Klienta] (Czysty, zoptymalizowany HTML + mikro-JS interakcji)
```

---

### 2. Strategie Renderowania Stron (Rendering Strategy Matrix)

W zależności od charakteru podstrony, silnik dobiera optymalną strategię renderowania w celu zminimalizowania czasu ładowania i kosztów serwerowych:

| Podstrona | Strategia (Mode) | Opis / Zachowanie |
| :--- | :--- | :--- |
| **Karta Produktu** | **ISR (Incremental Static Revalidation)** | Renderowana statycznie i odświeżana po zmianie w bazie lub po określonym TTL (np. 15 minut). |
| **Koszyk / Checkout**| **Dynamic SSR (Server-Side Rendering)** | Generowana przy każdym żądaniu w celu zachowania spójności koszyka i stanów magazynowych. |
| **Podstrony Statyczne**| **Static Generation (SSG)** | Budowane raz podczas kompilacji platformy (np. Regulamin, Polityka Prywatności). |
| **Lista Produktów** | **Streaming + ISR** | Pierwsza sekcja wysyłana natychmiast z cache, lista produktów streamowana w tle. |

---

### 3. Renderowanie Progresywne (Progressive Rendering)

Aby poprawić odczuwalną szybkość działania sklepu (Perceived Performance), stosujemy renderowanie progresywne z użyciem tagu `<Suspense>`:
1. **Above the Fold (RSC render first):** Kluczowe elementy widoczne dla użytkownika bez przewijania (Header, główna karta produktu, cena) są renderowane natychmiast po stronie serwera i wysyłane jako pierwszy kawałek HTML.
2. **Below the Fold (Stream later):** Elementy wymagające dodatkowych zapytań (np. opinie o produkcie, lista rekomendowanych akcesoriów) są obudowane w `<Suspense fallback={<Skeleton />}>` i asynchronicznie streamowane do przeglądarki przez otwarte połączenie HTTP po wyrenderowaniu sekcji głównej.

---

### 4. Izolacja Błędów Wizualnych (Error Rendering & Sandboxing)

Awaria pojedynczego modułu dodatkowego nie może doprowadzić do wyświetlenia białego ekranu śmierci (White Screen of Death) na całym sklepie:
* **Zasada Izolacji:** `awaria modułu ≠ awaria sklepu`.
* **Implementacja:** Wszystkie widoki renderowane przez pakiety opcjonalne (np. widget newslettera, pole ocen) są zamykane w dedykowanych komponentach **Error Boundary** w React.
* **Przebieg Awarii:**
  ```text
  [Błąd w kodzie wtyczki] ──► [Złapanie przez Error Boundary] ──► [Ukrycie widgetu / Render Fallback] ──► [Dalsze renderowanie strony]
  ```
  W rezultacie strona sklepu wyświetla się poprawnie, a niedziałająca wtyczka jest po prostu niewidoczna dla klienta końcowego.

---

### 5. Silnik Optymalizacji Pod Wyszukiwarki (SEO Engine Integration)

Każda generowana strona automatycznie integruje się z systemem SEO wbudowanym w warstwę aplikacyjną.
Do każdego wygenerowanego tytułu doklejany jest automatycznie zdefiniowany suffix (np. `Kup buty sportowe | Sklep MojaModa`). W przypadku braku dedykowanego opisu produktu lub wpisu blogowego, generowany jest fallback na bazie opisu domyślnego sklepu.

---

### 6. Budżet Wydajnościowy (Performance & Rendering Budget)

Monitorowane i raportowane wskaźniki (SLA P95) dla każdego żądania:

| Etap Rendera | Budżet (SLA P95) | Opis |
| :--- | :---: | :--- |
| **Tenant Resolve** | `5 ms` | Czas powiązania domeny z ID tenanta w Middleware. |
| **Runtime Composition** | `20 ms` | Czas złożenia lub odczytu snapshotu `RuntimeSnapshot`. |
| **Database Queries** | `40 ms` | Czas wykonania bezpiecznych zapytań SQL z politykami RLS. |
| **React RSC Rendering** | `40 ms` | Czas wygenerowania kodu HTML przez komponenty serwerowe. |
| **Streaming Start** | `10 ms` | Czas do wysłania pierwszego bajtu nagłówka HTML (TTFB). |
| **Client Hydration** | `< 300 ms` | Czas aktywacji JS w przeglądarce i gotowości do interakcji (FID). |
| **JS Client Bundle** | `< 120 KB` | Maksymalna dopuszczalna waga skryptów JS pobieranych przez przeglądarkę. |
