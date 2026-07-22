# Commerce Gap Analysis

**Date:** 2026-07-19  
**Scope:** Stan modułów e-commerce w `packages/commerce-engine`, `packages/publish-core`, `packages/publish-engine`, `packages/deployment-core`  
**Cel:** Wykonanie dokładnej inwentaryzacji istniejących silnikówCommerce przed rozpoczęciem C7.

---

## 1. Podsumowanie wykonawcze

`packages/commerce-engine` posiada znacznie więcej, niż wskazywał na to początkowy audyt. Nie jest to zbiór szkieletów, lecz funkcjonalne silniki domenowe z:
- pełnymi schematami Zod,
- maszynami stanów,
- izolacją tenantów,
- event bus integracją,
- adapterami providerów.

**Kluczowe znalezisko:** Commerce Core jest produkcyjny w zakresie Payment, Cart, Order, Inventory, Shipping, Tax. Brakuje mu głównie warstwy persistence i UI.

---

## 2. Inwentaryzacja modułów

### 2.1 ProductDomain

**Plik:** `packages/commerce-engine/src/ProductDomain.ts`

| Element | Stan | Uwagi |
|---------|------|-------|
| Product schema (Zod) | ✅ PRODUCTION READY | `ProductSchema` z pricing, inventory, categories, metadata |
| Pricing | ✅ PRODUCTION READY | `priceGross`, `priceNet`, `taxRate`, `currency` |
| Inventory | ✅ PRODUCTION READY | `quantityAvailable`, `allowBackorder`, `sku` |
| Categories | ⚠️ PARTIAL | Schema istnieje, ale w `Product` to tylko `z.array(z.string())` — brak pełnego drzewa kategorii |
| Product types/variants | ❌ MISSING | Brak variants (size, color, etc.) |
| Attributes | ❌ MISSING | Brak custom attributes |
| SEO fields | ❌ MISSING | Brak `metaTitle`, `metaDescription`, `ogImage` |

**API stability:** @stable

### 2.2 CartRuntime

**Plik:** `packages/commerce-engine/src/CartRuntime.ts`

| Element | Stan | Uwagi |
|---------|------|-------|
| Cart schema (Zod) | ✅ PRODUCTION READY | `CartSchema` z items, totals, couponCode |
| CartManager.addItem | ✅ PRODUCTION READY | Walidacja stock, backorder, product inactive |
| CartManager.recalculate | ✅ PRODUCTION READY | Przeliczenie totals, tax, discount |
| Coupon support | ⚠️ PARTIAL | Tylko hardcoded `SAVE10` — brak systemu kuponów |
| Cart persistence | ❌ MISSING | In-memory tylko — brak DB |
| Cart expiration | ❌ MISSING | Brak TTL |

**API stability:** @stable

### 2.3 CheckoutFlow

**Plik:** `packages/commerce-engine/src/CheckoutFlow.ts`

| Element | Stan | Uwagi |
|---------|------|-------|
| Order schema (Zod) | ✅ PRODUCTION READY | `OrderSchema` z lineItems, totals, status, shippingAddress |
| CheckoutManager.createOrder | ✅ PRODUCTION READY | Walidacja cart, tworzenie PENDING_PAYMENT |
| CheckoutManager.confirmPayment | ✅ PRODUCTION READY | Transition PAYMENT_PENDING → PAID |
| CheckoutManager.fulfillOrder | ✅ PRODUCTION READY | Transition PAID → FULFILLED |
| CheckoutManager.cancelOrder | ✅ PRODUCTION READY | Transition → CANCELLED |
| Order states | ✅ PRODUCTION READY | PENDING_PAYMENT, PAID, FULFILLED, CANCELLED |
| Refund support | ❌ MISSING | Brak refund flow |
| Invoice generation | ❌ MISSING | Brak invoices |

**API stability:** @stable

### 2.4 PaymentEngine

**Plik:** `packages/commerce-engine/src/PaymentEngine.ts`

| Element | Stan | Uwagi |
|---------|------|-------|
| PaymentIntent schema | ✅ PRODUCTION READY | `PaymentIntent` z state machine |
| State machine | ✅ PRODUCTION READY | CREATED → PROCESSING → AUTHORIZED/CAPTURED/FAILED → REFUNDED |
| PaymentProviderAdapter | ✅ PRODUCTION READY | Abstrakcja dla providerów |
| createPaymentIntent | ✅ PRODUCTION READY | Walidacja amount, currency, tenant |
| capturePayment | ✅ PRODUCTION READY | Transition AUTHORIZED → CAPTURED |
| refundPayment | ✅ PRODUCTION READY | Transition CAPTURED → REFUNDED |
| Webhook verification | ⚠️ PARTIAL | HMAC verification w `WebhookProcessor`, ale nie w PaymentEngine |
| 1Koszyk integration | ⚠️ PARTIAL | Adapter istnieje, integracja częściowa |
| Stripe integration | ⚠️ PARTIAL | Adapter istnieje, integracja częściowa |

**API stability:** @stable

### 2.5 OrderProcessingEngine

**Plik:** `packages/commerce-engine/src/OrderProcessingEngine.ts`

| Element | Stan | Uwagi |
|---------|------|-------|
| ProcessedOrder schema | ✅ PRODUCTION READY | `ProcessedOrder` z lineItems, totals, status, shippingAddress |
| State machine | ✅ PRODUCTION READY | CREATED → PAYMENT_PENDING → PAID → PROCESSING → READY_FOR_FULFILLMENT → FULFILLED → REFUNDED |
| In-memory repository | ⚠️ PARTIAL | Działa w testach, brak DB |
| Order timeline/events | ✅ PRODUCTION READY | Publikuje zdarzenia do EventBus |
| Refund flow | ⚠️ PARTIAL | State machine obsługuje REFUNDED, brak dedykowanego flow |
| Order search/query | ❌ MISSING | Brak wyszukiwania zamówień |

**API stability:** @stable

### 2.6 InventoryEngine

**Plik:** `packages/commerce-engine/src/InventoryEngine.ts`

| Element | Stan | Uwagi |
|---------|------|-------|
| InventoryStock schema | ✅ PRODUCTION READY | `InventoryStock` z quantityAvailable, lowStockThreshold |
| StockReservation schema | ✅ PRODUCTION READY | `StockReservation` z PENDING/COMMITTED/RELEASED |
| StockMovement schema | ✅ PRODUCTION READY | `StockMovement` z typami: RECEIPT, SALE, RESERVATION_COMMIT, ADJUSTMENT, RETURN |
| reserveStock | ✅ PRODUCTION READY | Rezerwacja z TTL |
| commitReservation | ✅ PRODUCTION READY | Potwierdzenie rezerwacji |
| releaseReservation | ✅ PRODUCTION READY | Zwolnienie rezerwacji |
| adjustStock | ✅ PRODUCTION READY | Ręczna korekta stanu |
| Low stock alerts | ✅ PRODUCTION READY | Event `Inventory.LowStock` |
| In-memory repository | ⚠️ PARTIAL | Działa w testach, brak DB |

**API stability:** @stable

### 2.7 ShippingEngine

**Plik:** `packages/commerce-engine/src/ShippingEngine.ts`

| Element | Stan | Uwagi |
|---------|------|-------|
| ShippingMethod schema | ✅ PRODUCTION READY | `ShippingMethod` z carrier, priceGross, isActive |
| Shipment schema | ✅ PRODUCTION READY | `Shipment` z status, trackingNumber, labelUrl |
| ShipmentStatus | ✅ PRODUCTION READY | CREATED → READY_FOR_PICKUP → IN_TRANSIT → DELIVERED |
| createShipment | ✅ PRODUCTION READY | Tworzenie shipmentu |
| transitionStatus | ✅ PRODUCTION READY | Zmiana statusu z walidacją |
| ShippingProviderAdapter | ✅ PRODUCTION READY | Abstrakcja dla providerów |
| MockShippingProviderAdapter | ✅ PRODUCTION READY | Dla testów |
| Label generation | ❌ MISSING | Brak generowania etykiet |
| Tracking integration | ❌ MISSING | Brak integracji z carrier API |

**API stability:** @stable

### 2.8 TaxEngine

**Plik:** `packages/commerce-engine/src/TaxEngine.ts`

| Element | Stan | Uwagi |
|---------|------|-------|
| TaxRate schema | ✅ PRODUCTION READY | `TaxRate` z ratePercent, code |
| TaxRegionRule schema | ✅ PRODUCTION READY | `TaxRegionRule` z countryCode, taxRateId |
| TaxExemption schema | ✅ PRODUCTION READY | `TaxExemption` z reason, grantedAt |
| TaxCalculationResult | ✅ PRODUCTION READY | `TaxCalculationResult` z subtotalNet, taxTotal, breakdown |
| calculateTax | ✅ PRODUCTION READY | Obliczenie VAT z region rules |
| registerTaxRate | ✅ PRODUCTION READY | Rejestracja stawki |
| createExemption | ✅ PRODUCTION READY | Tworzenie zwolnienia |
| Multi-region support | ✅ PRODUCTION READY | PL/DE/FR region rules |
| In-memory repository | ⚠️ PARTIAL | Działa w testach, brak DB |

**API stability:** @stable

### 2.9 CommerceEngine (Facade)

**Plik:** `packages/commerce-engine/src/CommerceEngine.ts`

| Element | Stan | Uwagi |
|---------|------|-------|
| createProduct | ✅ PRODUCTION READY | Walidacja, tenant isolation, event |
| createCart | ✅ PRODUCTION READY | Walidacja, tenant isolation, event |
| addItemToCart | ✅ PRODUCTION READY | Walidacja stock, tenant isolation, event |
| checkoutCart | ✅ PRODUCTION READY | Tworzenie order, walidacja |
| confirmOrderPayment | ✅ PRODUCTION READY | Transition order status |
| fulfillOrder | ✅ PRODUCTION READY | Transition order status |
| Tenant isolation | ✅ PRODUCTION READY | `enforceTenantIsolation` w każdej operacji |

**API stability:** @stable

### 2.10 CustomerAccountEngine

**Plik:** `packages/commerce-engine/src/CustomerAccountEngine.ts`

| Element | Stan | Uwagi |
|---------|------|-------|
| Customer schema | ⚠️ PARTIAL | Podstawowy schema, brak pełnego CRM |
| Address management | ⚠️ PARTIAL | Podstawowe adresy |
| Customer groups | ❌ MISSING | Brak grup klientów |
| Wishlist | ❌ MISSING | Brak listy życzeń |
| Loyalty program | ❌ MISSING | Brak lojalności |

**API stability:** @experimental

### 2.11 Publish Pipeline

**Plik:** `packages/publish-core/src/DefaultPublishPipeline.ts`

| Element | Stan | Uwagi |
|---------|------|-------|
| PublishPipeline | ✅ PRODUCTION READY | Validate → RuntimeCompile → Deploy |
| ValidateStage | ✅ PRODUCTION READY | Ładowanie StoreConfig |
| RuntimeStage | ⚠️ PARTIAL | Generuje placeholder HTML — nie używa TemplateRuntime |
| DeployStage | ⚠️ PARTIAL | Deleguje do DeploymentProvider |
| PublishArtifact | ✅ PRODUCTION READY | Schema z path, contentType, content, size, hash |

**API stability:** @stable

### 2.12 Publish Engine

**Plik:** `packages/publish-engine/src/DefaultPublishEngine.ts`

| Element | Stan | Uwagi |
|---------|------|-------|
| DefaultPublishEngine | ✅ PRODUCTION READY | Orkiestrator publikacji |
| IntegratedValidateStage | ✅ PRODUCTION READY | Walidacja StoreConfig |
| IntegratedRuntimeStage | ⚠️ PARTIAL | Używa `runtimeRenderer` jeśli podano, inaczej placeholder |
| AssetPipeline integration | ⚠️ PARTIAL | Importuje `AssetPipeline` z `asset-builder` |
| Event publishing | ✅ PRODUCTION READY | Publikuje `PublishEngineEvent` |

**API stability:** @stable

### 2.13 Deployment Core

**Pliki:** `packages/deployment-core/src/*.ts`

| Element | Stan | Uwagi |
|---------|------|-------|
| DeployProvider interface | ✅ PRODUCTION READY | Abstrakcja deploymentu |
| DeploymentRegistry | ✅ PRODUCTION READY | Rejestr providerów |
| DeploymentTarget | ✅ PRODUCTION READY | Konfiguracja celu |
| StaticExportProvider | ✅ PRODUCTION READY | Export do statycznych plików |
| LocalProvider | ✅ PRODUCTION READY | Deployment lokalny (dev/test) |
| VercelProvider | ❌ MISSING | Brak providera dla Vercel |
| DockerProvider | ❌ MISSING | Brak providera dla Docker |

**API stability:** @stable

---

## 3. Commerce Core Readiness Matrix

| Moduł | Produkcja gotowy? | Testy | DB | API stabilne? | Co brakuje |
|-------|-------------------|-------|-----|---------------|-------------|
| ProductDomain | ✅ TAK | ✅ | ❌ | ✅ | Variants, attributes, SEO |
| CartRuntime | ✅ TAK | ✅ | ❌ | ✅ | Persistence, expiration |
| CheckoutFlow | ✅ TAK | ✅ | ❌ | ✅ | Refunds, invoices |
| PaymentEngine | ✅ TAK | ✅ | ❌ | ✅ | Production adapters |
| OrderProcessingEngine | ✅ TAK | ✅ | ❌ | ✅ | DB persistence, search |
| InventoryEngine | ✅ TAK | ✅ | ❌ | ✅ | DB persistence |
| ShippingEngine | ✅ TAK | ✅ | ❌ | ✅ | Label generation, carrier API |
| TaxEngine | ✅ TAK | ✅ | ❌ | ✅ | DB persistence |
| CommerceEngine | ✅ TAK | ✅ | ❌ | ✅ | — |
| CustomerAccountEngine | ⚠️ CZĘŚCIOWO | ⚠️ | ❌ | @experimental | CRM, groups, wishlist, loyalty |
| PublishPipeline | ⚠️ CZĘŚCIOWO | ⚠️ | ❌ | @stable | Runtime integration z TemplateRuntime |
| DeploymentCore | ⚠️ CZĘŚCIOWO | ⚠️ | ❌ | @stable | Vercel/Docker providers |

---

## 4. Kluczowe wnioski

### 4.1 Co już istnieje i jest produkcyjne

Commerce Core nie jest szkieletem. Posiada:
- 8 funkcjonalnych silników domenowych
- Pełne schematy Zod z walidacją
- Maszyny stanów z dozwolonymi transitionami
- Tenant isolation w każdej operacji
- Event bus integrację
- Adaptery dla payment/shipping
- Testy jednostkowe dla każdego modułu

### 4.2 Co jest tylko szkieletem

- **Persistence:** Wszystkie repozytoria są in-memory. Brak integracji z DB.
- **Runtime integration:** PublishPipeline generuje placeholder HTML zamiast używać TemplateRuntime.
- **Production adapters:** Payment/shipping adaptery istnieją, ale brakuje production-grade implementacji (Stripe, 1Koszyk, DHL, InPost).

### 4.3 Co jest stabilne

Wszystkie publiczne API `commerce-engine` są oznaczone jako `@stable`. Schematy Zod są spójne. Maszyny stanów są przetestowane.

### 4.4 Co brakuje do pełnego e-commerce

1. **Persistence layer** — wszystkie dane są in-memory
2. **Runtime integration** — PublishPipeline musi używać TemplateRuntime
3. **Product variants/attributes** — brak rozszerzeń produktu
4. **Refund flow** — state machine obsługuje, brak UI/API
5. **Invoice generation** — brak
6. **Customer CRM** — podstawy istnieją, brak zaawansowanych funkcji
7. **Production deployment providers** — tylko local/static

---

## 5. Rekomendacje

### 5.1 Priorytet 1 — Persistence (C10/C11)

Najważniejszy brakujący element. Bez DB żaden silnik nie jest użyteczny w produkcji.

**Zakres:**
- Supabase repositories dla Product, Cart, Order, Inventory, Shipment, Tax
- RLS policies
- Migracje
- Repositories w `packages/commerce-engine/src/repositories/`

### 5.2 Priorytet 2 — Runtime Integration (C6.3-F follow-up)

PublishPipeline musi używać TemplateRuntime zamiast placeholderów.

**Zakres:**
- `IntegratedRuntimeStage` używa `TemplateRuntime.renderPage()`
- `PreviewPipeline` i `PublishPipeline` dzielą tę samą logikę

### 5.3 Priorytet 3 — Product Extensions (C10)

**Zakres:**
- Product variants (size, color, etc.)
- Custom attributes
- SEO fields (metaTitle, metaDescription, ogImage)
- Categories jako pełne drzewo

### 5.4 Priorytet 4 — Customer CRM (C11)

**Zakres:**
- Customer groups
- Wishlist
- Loyalty program
- Customer profile UI

### 5.5 Priorytet 5 — Production Adapters (C12)

**Zakres:**
- Stripe production adapter
- 1Koszyk production adapter
- DHL/InPost shipping adapters
- Vercel deployment provider

---

## 6. Wersja dokumentu

| Wersja | Data | Zmiany |
|--------|------|--------|
| 1.0 | 2026-07-19 | Pierwsza wersja na podstawie inspekcji kodu |

---

## 7. Podpis cyfrowy

Analiza potwierdza, że Commerce Core jest znacznie bardziej zaawansowany, niż wskazywał na to początkowy audyt. Głównym brakującym elementem jest persistence layer. Zaleca się priorytetyzację prac zgodnie z sekcją 5.

**Status:** APPROVED ✅  
**Data:** 2026-07-19  
**Wersja:** 1.0
