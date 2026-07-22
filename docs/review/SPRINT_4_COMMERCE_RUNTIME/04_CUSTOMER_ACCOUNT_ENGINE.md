---
Status: REVIEW
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_4_COMMERCE_RUNTIME/03_ORDER_PROCESSING_ENGINE.md
---

# SPRINT 4: COMMERCE RUNTIME
## Specyfikacja Kontraktu — 04_CUSTOMER_ACCOUNT_ENGINE.md
*Definicja silnika kont klienckich (Customer Account Engine), preferencji klientów, zarządzania adresami, integracji z zamówieniami oraz reguł bezpieczeństwa wielodostępności.*

---

### 1. Domena Klienta (Customer Domain Model)

Każde konto klienta jest przypisane do konkretnego sklepu (`tenantId`). Zapewnia to izolację bazy klientów w modelu SaaS (ten sam e-mail może należeć do różnych osób na różnych instancjach sklepów).

```typescript
export interface CustomerAddress {
  id: string;
  type: 'SHIPPING' | 'BILLING';
  fullName: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface CustomerProfile {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface CustomerPreferences {
  marketingConsent: boolean;
  preferredCurrency: string; // ISO 4217 (np. PLN)
  language: string;          // ISO 639-1 (np. pl)
}

export interface Customer {
  id: string;
  tenantId: string;
  email: string;
  profile: CustomerProfile;
  addresses: CustomerAddress[];
  preferences: CustomerPreferences;
  createdAt: string;
  updatedAt: string;
}
```

---

### 2. Architektura Silnika Klienta (Customer Account Engine)

Silnik `CustomerAccountEngine` udostępnia interfejs do zarządzania tożsamością klienta, weryfikacji danych oraz powiązania klienta z historią jego zamówień.

```typescript
export interface RegisterCustomerDto {
  email: string;
  profile: CustomerProfile;
  preferences?: Partial<CustomerPreferences>;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
}
```

#### Kluczowe metody biznesowe:
* `registerCustomer(tenantId: string, dto: RegisterCustomerDto): Promise<Customer>`
* `updateProfile(tenantId: string, customerId: string, dto: UpdateProfileDto): Promise<Customer>`
* `addAddress(tenantId: string, customerId: string, address: Omit<CustomerAddress, 'id'>): Promise<Customer>`
* `removeAddress(tenantId: string, customerId: string, addressId: string): Promise<Customer>`
* `updatePreferences(tenantId: string, customerId: string, preferences: Partial<CustomerPreferences>): Promise<Customer>`

---

### 3. Zdarzenia Klienckie (Customer Events)

Zdarzenia domenowe emitowane przez silnik w celu integracji z systemami lojalnościowymi, marketingowymi oraz analitycznymi:

* **`Customer.Created`**: Wysłanie maila powitalnego, uruchomienie lead nurturingu.
* **`Customer.Updated`**: Zmiana profilu klienta.
* **`Customer.AddressAdded`**: Dodanie nowego adresu dostawy.
* **`Customer.PreferencesChanged`**: Aktualizacja np. zgód marketingowych.

---

### 4. Izolacja i Bezpieczeństwo Wielodostępności (RLS)

Każda metoda biznesowa musi bezwzględnie weryfikować przynależność klienta do tenanta kontekstu wykonania:

```typescript
private enforceTenantIsolation(tenantId: string, customerTenantId: string, action: string): void {
  if (tenantId !== customerTenantId) {
    throw new TenantSecurityException(
      `RLS violation: blocked attempt to perform '${action}' on customer belonging to another tenant.`
    );
  }
}
```

Naruszenie tej zasady rzuca wyjątek `TenantSecurityException`.

---

### 5. Kontrakt Testowy (Test Contract)

Implementacja silnika kont klienckich w pliku `customer-account.test.ts` musi zweryfikować:

1. **Rejestracja i walidacja danych**:
   * Prawidłowe tworzenie struktury konta klienta z domyślnymi preferencjami.
   * Blokowanie duplikatów e-mail w obrębie tego samego tenanta (dozwolone posiadanie tego samego maila w różnych tenantach).
2. **Zarządzanie adresami**:
   * Dodawanie i usuwanie adresów, automatyczne oznaczanie pierwszego jako domyślnego.
3. **Izolację wielodostępną (RLS)**:
   * Próba pobrania danych klienta lub aktualizacji jego profilu należącego do tenanta A z poziomu tenanta B rzuca błąd `TenantSecurityException`.
4. **Emisję Eventów**:
   * Asercja wysłania zdarzenia `Customer.Created` na szynę eventów.
