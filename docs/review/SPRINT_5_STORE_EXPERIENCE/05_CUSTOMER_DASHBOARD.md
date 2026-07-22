---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_4_COMMERCE_RUNTIME/04_CUSTOMER_ACCOUNT_ENGINE.md
- docs/review/SPRINT_4_COMMERCE_RUNTIME/03_ORDER_PROCESSING_ENGINE.md
- docs/review/SPRINT_5_STORE_EXPERIENCE/04_CHECKOUT_UI.md
---

# SPRINT 5: STORE EXPERIENCE LAYER
## Specyfikacja Kontraktu — 05_CUSTOMER_DASHBOARD.md
*Definicja panelu klienta końcowego (Customer Dashboard), kontekstu sesji, widoków zamówień, książki adresowej, preferencji, granicy uwierzytelniania oraz kontraktu zdarzeń i testów.*

> **Zasada nadrzędna:** Dashboard UI nie wykonuje bezpośrednich zapytań do bazy danych.
> Każda operacja delegowana jest przez `DashboardRuntime` do `CustomerAccountEngine` lub `OrderProcessingEngine`.

---

### 1. Dashboard Runtime Architecture

```
Customer Browser → /account/*
         |
         ↓
  DashboardRuntime
  (sesja klienta, routing widoków)
         |
         ↓
 DashboardAdapter (port)
    /           \
   ↓             ↓
CustomerAccount  OrderProcessing
   Engine          Engine
         |
         ↓
    Store Runtime
```

`DashboardRuntime` zarządza sesją zalogowanego klienta, rozwiązuje ścieżkę URL na właściwy widok dashboardu oraz deleguje operacje CRUD do odpowiednich silników przez port adaptera. Nie zawiera logiki domenowej.

---

### 2. Dashboard Routes

| Ścieżka | Widok | Opis |
|---|---|---|
| `/account` | `AccountHome` | Strona główna panelu klienta |
| `/account/orders` | `OrdersView` | Lista zamówień klienta |
| `/account/orders/:orderId` | `OrderDetailView` | Szczegóły zamówienia i śledzenie |
| `/account/addresses` | `AddressBookView` | Zarządzanie adresami dostawy |
| `/account/preferences` | `PreferencesView` | Język, waluta, zgody |

---

### 3. Dashboard Context (Immutable)

```typescript
export interface DashboardContext {
  readonly tenantId: string;
  readonly customerId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly locale: string;
  readonly currency: string;
  readonly currentView: DashboardView;
}

export type DashboardView =
  | 'account_home'
  | 'orders'
  | 'order_detail'
  | 'addresses'
  | 'preferences';
```

`DashboardContext` jest tworzony przez `Object.freeze()` i nie może być mutowany po inicjalizacji. Próba zmiany `customerId` lub `tenantId` skutkuje `TypeError`.

---

### 4. Authentication Boundary

Dashboard wymagamy sesji uwierzytelnionego klienta. Przed zbudowaniem `DashboardContext` wymagane jest:
1. Weryfikacja tokena sesji (JWT) lub cookie sesyjnego.
2. Walidacja `customerId` względem `tenantId` — klient nie może przeglądać danych innego tenanta.
3. Odrzucenie żądania z błędem `AuthenticationRequiredException` jeśli sesja nie istnieje lub wygasła.

---

### 5. Orders View Integration

```typescript
// Odpowiedź adaptera
interface CustomerOrder {
  orderId: string;
  status: 'CREATED' | 'PAYMENT_PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalCents: number;
  currency: string;
  createdAt: string;
  trackingNumber?: string;
}
```

`OrdersView` renderuje listę zamówień pobraną z `OrderProcessingEngine`. `OrderDetailView` wyświetla szczegóły i status przesyłki (jeśli `trackingNumber` jest dostępny).

---

### 6. Address Book Integration

`AddressBookView` integruje się z `CustomerAccountEngine`. Obsługuje operacje:
- `addAddress(tenantId, customerId, address)` → dodaje nowy adres dostawy
- `removeAddress(tenantId, customerId, addressId)` → usuwa adres (nie można usunąć domyślnego)
- `setDefaultAddress(tenantId, customerId, addressId)` → ustawia adres jako domyślny

---

### 7. Preferences Integration

`PreferencesView` zarządza preferencjami klienta:
- `locale` — język interfejsu (`pl_PL`, `en_US`, `de_DE`)
- `currency` — waluta wyświetlana (`PLN`, `EUR`, `USD`)
- `marketingConsent` — zgoda na komunikację marketingową (bool)
- `newsletterConsent` — subskrypcja newslettera (bool)

---

### 8. Event Contract

| Zdarzenie | Kiedy emitowane |
|---|---|
| `Dashboard.Opened` | Pierwsze otwarcie panelu (sesja aktywna) |
| `Customer.ProfileUpdated` | Zapis danych profilu |
| `Customer.AddressAdded` | Dodanie nowego adresu |
| `Customer.AddressRemoved` | Usunięcie adresu |
| `Customer.AddressSetDefault` | Ustawienie domyślnego adresu |
| `Customer.PreferenceUpdated` | Zmiana preferencji klienta |

---

### 9. Test Contract

**Test 1 — Dashboard Session Init**
Prawidłowe uruchomienie sesji ładuje profil klienta i zwraca zamrożony `DashboardContext` z `currentView: 'account_home'`.

**Test 2 — Orders View Rendering**
`OrdersView` poprawnie renderuje listę zamówień klienta. Zamówienie ze statusem `SHIPPED` wyświetla numer śledzenia.

**Test 3 — Address CRUD**
Pełny cykl: add → setDefault → remove adresu. Próba usunięcia jedynego/domyślnego adresu zwraca błąd.

**Test 4 — Preference Update + Event**
Zmiana `locale` na `de_DE` emituje zdarzenie `Customer.PreferenceUpdated` i aktualizuje kontekst sesji.

**Test 5 — Tenant Isolation**
Klient z `tenant-a` nie może odczytać zamówień ani adresów należących do `tenant-b`.

**Test 6 — Authentication Boundary**
Żądanie bez ważnej sesji zwraca `AuthenticationRequiredException` zamiast danych klienta.

**Test 7 — Context Immutability**
Próba mutacji `dashboardContext.customerId` lub `dashboardContext.tenantId` rzuca `TypeError`.
