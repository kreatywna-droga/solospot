/**
 * Onboarding Domain Types
 * ─────────────────────────────────────────────────────────
 * Definiuje pełny kontrakt dla przepływu rejestracji nowego
 * tenanta na platformie SoloSpot.
 *
 * Przepływ: Register → Checkout → Payment → Provision → ACTIVE
 */

export type PackageId = 'starter' | 'standard' | 'professional' | 'enterprise';

export interface PackageDefinition {
  id: PackageId;
  name: string;
  priceGross: number; // w groszach (PLN)
  currency: 'PLN';
  features: string[];
}

/** Dostępne pakiety subskrypcji platformy */
export const PLATFORM_PACKAGES: Record<PackageId, PackageDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    priceGross: 9900, // 99 PLN
    currency: 'PLN',
    features: ['1 sklep', 'do 100 produktów', 'wsparcie e-mail'],
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    priceGross: 29900, // 299 PLN
    currency: 'PLN',
    features: ['1 sklep', 'do 1000 produktów', 'własna domena', 'wsparcie priorytetowe'],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    priceGross: 59900, // 599 PLN
    currency: 'PLN',
    features: ['3 sklepy', 'nieograniczone produkty', 'API dostęp', 'wsparcie 24/7'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceGross: 149900, // 1499 PLN
    currency: 'PLN',
    features: ['nieograniczone sklepy', 'dedykowany serwer', 'SLA 99.9%', 'opiekun klienta'],
  },
};

/** Żądanie rejestracji nowego tenanta */
export interface RegisterTenantRequest {
  ownerEmail: string;
  packageId: PackageId;
  storeName: string;
}

/** Odpowiedź z rejestracji — zwraca dane potrzebne do inicjalizacji checkoutu */
export interface RegisterTenantResponse {
  tenantId: string;
  ownerEmail: string;
  packageId: PackageId;
  storeName: string;
  status: 'CREATED';
  checkoutOrderId: string;
  packagePriceGross: number;
  currency: 'PLN';
  createdAt: string;
}

/** Żądanie inicjalizacji płatności za pakiet */
export interface InitiateCheckoutRequest {
  tenantId: string;
  packageId: PackageId;
}

/** Odpowiedź z inicjalizacji płatności — zawiera URL do bramki 1Koszyk */
export interface InitiateCheckoutResponse {
  tenantId: string;
  orderId: string;
  paymentUrl: string;       // URL do przekierowania klienta na 1Koszyk
  amountGross: number;
  currency: 'PLN';
  expiresAt: string;        // ISO timestamp wygaśnięcia sesji płatności
}

/** Status procesu onboardingu — używany przez Mission Control */
export type OnboardingStage =
  | 'REGISTERED'       // Tenant utworzony, nie zapłacił
  | 'CHECKOUT_PENDING' // Płatność zainicjowana
  | 'PAYMENT_RECEIVED' // Webhook odebrany
  | 'PROVISIONING'     // Trwa wdrożenie sklepu
  | 'ACTIVE'           // Sklep aktywny — onboarding zakończony
  | 'FAILED';          // Błąd na którymś etapie
