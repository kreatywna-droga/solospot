---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_4_COMMERCE_RUNTIME/01_COMMERCE_ENGINE.md
- docs/review/SPRINT_4_COMMERCE_RUNTIME/02_PAYMENT_ENGINE.md
- docs/review/SPRINT_4_COMMERCE_RUNTIME/03_ORDER_PROCESSING_ENGINE.md
- docs/review/SPRINT_4_COMMERCE_RUNTIME/06_SHIPPING_ENGINE.md
- docs/review/SPRINT_5_STORE_EXPERIENCE/03_STOREFRONT_RUNTIME.md
---

# SPRINT 5: STORE EXPERIENCE LAYER
## Specyfikacja Kontraktu — 04_CHECKOUT_UI.md
*Definicja warstwy UI procesu zakupowego (Checkout UI), orkiestratora kontekstu checkout, komponentów widoku, integracji z Commerce Engine oraz kontraktu zdarzeń i testów.*

> **Zasada nadrzędna:** UI orkiestruje, Commerce Engine decyduje.
> Checkout UI nie posiada żadnej własnej logiki domenowej. Wszystkie decyzje biznesowe (ceny, podatki, dostępność, stany) podejmuje warstwa Commerce.

---

### 1. Architektura Checkout UI

```
Customer Browser / Storefront Runtime
             |
             ↓
      CheckoutRuntime
     (orkiestrator sesji)
             |
             ↓
  CheckoutRuntimeAdapter
  (fasada do Commerce Engine)
       /     |      \
      ↓      ↓       ↓
    Cart  Shipping  Payment
  Runtime  Engine   Engine
                       |
                       ↓
             Order Processing Engine
```

`CheckoutRuntime` zarządza sesją zakupową, koordynuje przejścia między stanami i deleguje każdą operację do właściwego modułu Commerce Engine poprzez `CheckoutRuntimeAdapter`. Warstwa UI nie ma bezpośredniego dostępu do bazy danych.

---

### 2. Checkout State Machine

Maszyna stanów odwzorowuje istniejące stany Commerce Engine na poziomie UI. Każde przejście jest walidowane po stronie backendu przed aktualizacją stanu sesji.

```typescript
export type CheckoutState =
  | 'CART_REVIEW'
  | 'CUSTOMER_INFO'
  | 'SHIPPING_SELECTION'
  | 'PAYMENT_SELECTION'
  | 'PAYMENT_PROCESSING'
  | 'CONFIRMATION'
  | 'FAILED';
```

**Dozwolone przejścia stanów:**
```
CART_REVIEW → CUSTOMER_INFO
CUSTOMER_INFO → SHIPPING_SELECTION
SHIPPING_SELECTION → PAYMENT_SELECTION
PAYMENT_SELECTION → PAYMENT_PROCESSING
PAYMENT_PROCESSING → CONFIRMATION | FAILED
FAILED → CART_REVIEW (retry flow)
```

Przejście do stanu niedozwolonego (np. z `CART_REVIEW` do `PAYMENT_PROCESSING`) powoduje wyrzucenie `IllegalCheckoutStateTransitionException`.

---

### 3. Checkout Context (Immutable)

`CheckoutContext` jest niezmiennym obiektem transferu danych między orkiestratorem a komponentami UI. Zabrania się mutowania jego właściwości po utworzeniu.

```typescript
export interface CheckoutContext {
  readonly tenantId: string;
  readonly cartId: string;
  readonly customerId: string | null;
  readonly currency: string;
  readonly locale: string;
  readonly cartSummary: CartSummary;
  readonly shippingMethods: ShippingMethod[];
  readonly selectedShippingId: string | null;
  readonly paymentMethods: PaymentMethodInfo[];
  readonly selectedPaymentMethod: string | null;
  readonly currentState: CheckoutState;
}
```

Próba modyfikacji (`checkoutContext.tenantId = 'other'`) musi skutkować `TypeError: Cannot assign to read only property`.

---

### 4. Komponenty UI (CheckoutComponent Contract)

```
packages/checkout-ui/src/
  ├── CheckoutContext.ts      — typy i fabryka kontekstu
  ├── CheckoutRuntime.ts      — orkiestrator i maszyna stanów
  ├── CheckoutAdapter.ts      — fasada łącząca z Commerce Engine
  ├── components/
  │   ├── CartSummary.ts
  │   ├── CustomerForm.ts
  │   ├── ShippingSelector.ts
  │   ├── PaymentSelector.ts
  │   ├── OrderReview.ts
  │   └── ConfirmationView.ts
  └── checkout-ui.test.ts
```

Każdy komponent implementuje kontrakt:
```typescript
export interface CheckoutComponent {
  render(context: CheckoutContext): CheckoutRenderResult;
}

export interface CheckoutRenderResult {
  html: string;
  state: CheckoutState;
  errors: string[];
}
```

---

### 5. Integracja Shipping Engine

`ShippingSelector` pobiera dostępne metody wysyłki z `ShippingEngine` przez `CheckoutAdapter`. Adapter obsługuje wyjątek `ShippingUnavailableException` i przekazuje go do Error Boundary warstwy Checkout.

```typescript
// Odpowiedź adaptera
interface ShippingMethod {
  id: string;
  provider: 'InPost' | 'DHL' | 'DPD' | string;
  name: string;
  priceCents: number;
  currency: string;
  estimatedDays: number;
}
```

---

### 6. Integracja Payment Engine

`PaymentSelector` wyświetla dostępne metody płatności. UI **nie zna** szczegółów dostawcy. Adapter deleguje inicjalizację do `PaymentEngine` i zwraca UI token potwierdzający intencję.

```
PaymentSelector (UI)
        ↓
CheckoutAdapter.initiatePayment()
        ↓
PaymentEngine.createIntent()
        ↓
Provider Adapter (Mock/Stripe/P24)
```

---

### 7. Order Confirmation Flow

```
Payment.Completed (Event Bus)
        ↓
CheckoutRuntime.onPaymentCompleted()
        ↓
state → CONFIRMATION
        ↓
Order Processing Engine → Order Created
        ↓
ConfirmationView.render(context)
        ↓
HTML: "Dziękujemy za zamówienie! Nr: ORD-XXXX"
```

---

### 8. Checkout Error Boundary

Awaria pojedynczego komponentu (np. `PaymentSelector`) nie może blokować renderowania całego checkout. Każda próba wywołania `component.render()` jest opakowana w try/catch. Błąd skutkuje zamiast komponentu wstawieniem węzła `<div class="checkout-error">`.

---

### 9. Kontrakt Zdarzeń (Event Contract)

| Zdarzenie | Kiedy emitowane |
|---|---|
| `Checkout.Started` | Wejście w stan `CART_REVIEW` |
| `Checkout.CustomerUpdated` | Zapisanie danych klienta |
| `Checkout.ShippingSelected` | Wybór metody wysyłki |
| `Checkout.PaymentSelected` | Wybór metody płatności |
| `Checkout.Completed` | Wejście w stan `CONFIRMATION` |
| `Checkout.Failed` | Wejście w stan `FAILED` |

---

### 10. Kontrakt Testowy

**Test 1 — Happy Path (pełny przepływ zakupowy)**
Sesja przechodzi przez wszystkie stany: `CART_REVIEW → CUSTOMER_INFO → SHIPPING_SELECTION → PAYMENT_SELECTION → PAYMENT_PROCESSING → CONFIRMATION`. Warunki: koszyk niepusty, płatność symulowana przez Mock provider.

**Test 2 — Tenant Isolation**
`CheckoutRuntime` dla `tenant-a` nie może obsłużyć `cartId` należącego do `tenant-b`. Oczekiwany wynik: `TenantScopeViolationException`.

**Test 3 — Payment Failure → FAILED state**
Gdy adapter symuluje `Payment.Failed`, sesja przechodzi do stanu `FAILED` i emituje zdarzenie `Checkout.Failed`.

**Test 4 — ShippingUnavailableException**
Brak dostępnych metod wysyłki powoduje wyjątek, który jest przechwycony przez Error Boundary i zatrzymuje checkout w stanie `SHIPPING_SELECTION`.

**Test 5 — Context Immutability**
Próba mutacji `checkoutContext.tenantId` lub `checkoutContext.cartId` musi wyrzucić `TypeError`.
