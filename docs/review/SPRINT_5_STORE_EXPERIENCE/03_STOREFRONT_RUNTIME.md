---
Status: REVIEW
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_5_STORE_EXPERIENCE/02_RENDERER_ENGINE.md
---

# SPRINT 5: STORE EXPERIENCE LAYER
## Specyfikacja Kontraktu — 03_STOREFRONT_RUNTIME.md
*Definicja potoku obsługi żądań publicznych (Storefront Runtime), routingu, optymalizacji SEO, wielopoziomowego buforowania (Cache Boundary) oraz zdarzeń cyklu życia żądania.*

---

### 1. Potok Obsługi Żądań (Storefront Request Lifecycle)

Storefront Runtime łączy jądro platformy (Platform Core), kompozycję runtime (`StoreRuntime`) oraz silnik prezentacji (`ThemeRuntime` + `RendererEngine`) w jeden spójny potok obsługi publicznego żądania HTTP.

```
HTTP Request (sklep.pl/product/but-sportowy)
       ↓
Tenant Resolver (Wykrywa Tenant ID: tenant-123)
       ↓
StoreRuntime Engine (Uruchamia instancję na bazie RuntimeSnapshot)
       ↓
Storefront Router (Dopasowuje trasę do typu 'product')
       ↓
Page Resolver & SEO (Pobiera dane z bazy / Cache, generuje tagi SEO)
       ↓
ThemeRuntime (Pobiera aktywny motyw i komponenty)
       ↓
RendererEngine (Generuje wynikowy kod HTML)
       ↓
Cache Layer (Zapisuje wyjściowy HTML w cache)
       ↓
HTTP Response (HTML)
```

---

### 2. Definicja Tras i Routing (Storefront Routing)

Silnik obsługuje następujące predefiniowane trasy sklepowe:
* `/` ➔ Główna strona sklepu (typ strony: `home`).
* `/products` ➔ Lista i filtrowanie produktów (typ strony: `products_list`).
* `/product/:slug` ➔ Szczegóły konkretnego produktu (typ strony: `product_detail`).
* `/cart` ➔ Podgląd koszyka zakupowego (typ strony: `cart`).
* `/checkout` ➔ Formularz zamówienia i wybór płatności (typ strony: `checkout`).
* `/account` ➔ Profil klienta i historia zamówień (typ strony: `account`).

---

### 3. Page Resolver & SEO Runtime

`PageResolver` tłumaczy dopasowaną trasę na strukturę strony i zasila ją danymi biznesowymi pobieranymi z izolowanego kontekstu biznesowego (`CommerceEngine`). Odpowiada także za automatyczne generowanie nagłówków i tagów SEO.

```typescript
export interface SEOMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  ogImage?: string;
  jsonLdSchema?: Record<string, any>;
}

export interface ResolvedPage {
  routeType: 'home' | 'products_list' | 'product_detail' | 'cart' | 'checkout' | 'account';
  title: string;
  seo: SEOMetadata;
  data: Record<string, any>;
}
```

Generator SEO automatycznie składa tagi HTML w sekcji `<head>` w oparciu o obiekt `SEOMetadata`.

---

### 4. Cache Boundary (Wydajność SaaS)

Dla zapewnienia ultra-niskich opóźnień (P95 < 20 ms dla powracających żądań), Storefront Runtime implementuje dwa poziomy buforowania:
1. **L1 Snapshot Cache**: Buforowanie złożonej konfiguracji i weryfikacji pakietów (dostarczane przez `StoreRuntimeEngine`).
2. **L2 Page Cache**: Buforowanie wynikowego kodu HTML dla stron w pełni statycznych lub rzadko zmieniających się (np. strona główna, karty produktów). Bufor ten jest unieważniany (invalidated) przy zdarzeniach takich jak aktualizacja produktu czy zmiana konfiguracji motywu.

---

### 5. API Storefront Runtime

```typescript
export interface StorefrontRequest {
  host: string;
  path: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
}

export interface StorefrontResponse {
  statusCode: number;
  headers: Record<string, string>;
  html: string;
  cacheStatus: 'HIT' | 'MISS' | 'BYPASS';
}

export class StorefrontRuntime {
  public async handleRequest(req: StorefrontRequest, correlationId?: string): Promise<StorefrontResponse>;
  public invalidatePageCache(tenantId: string, path: string): void;
}
```

---

### 6. Zdarzenia Systemowe (Storefront Events)

System rozgłasza następujące zdarzenia w celach diagnostycznych i analitycznych:
* **`Storefront.RequestReceived`**: Odebranie żądania i rozpoczęcie przetwarzania.
* **`Storefront.RouteMatched`**: Dopasowanie ścieżki URL do zarejestrowanego typu strony.
* **`Storefront.PageResolved`**: Pomyślne pobranie danych strony i wygenerowanie metadanych SEO.
* **`Storefront.CacheHit`**: Zwrócenie strony z bufora L2 Page Cache bez uruchamiania renderera.
* **`Storefront.ResponseSent`**: Zakończenie procesu przetwarzania żądania i wysłanie odpowiedzi.

---

### 7. Kontrakt Testowy (Test Contract)

Testy w pliku `storefront-runtime.test.ts` muszą zweryfikować:

1. **Routing i dopasowywanie parametrów (Happy Path)**:
   * Żądanie pod ścieżkę `/product/but-do-biegania` poprawnie dopasowuje trasę `product_detail`, wyciąga slug `but-do-biegania` i przekazuje do kontekstu renderowania.
2. **Wstrzykiwanie nagłówków i tagów SEO**:
   * Zwrócony kod HTML zawiera odpowiednie tagi `<meta name="description">` oraz strukturyzowane dane JSON-LD dla wyszukiwarek.
3. **Zachowanie Cache Boundary**:
   * Pierwsze zapytanie daje status `MISS` i renderuje stronę.
   * Drugie zapytanie pod tę samą ścieżkę daje status `HIT` i błyskawicznie zwraca zbuforowaną treść.
   * Wywołanie `invalidatePageCache` wymusza ponowne wyrenderowanie (kolejny `MISS`).
4. **Izolacja tenantów w Cache i Routingu**:
   * Tenant A pod adresem `sklep-a.pl/` nie może otrzymać w odpowiedzi zbuforowanej strony głównej Tenanta B z `sklep-b.pl/`.
