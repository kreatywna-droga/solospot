export type PaymentProviderType = 'onekoszyk';

export interface CheckoutRequest {
  planId: string;
  tenantId?: string;
  userId?: string;
  email?: string;
  // correlationId może być generowane na warstwie HTTP lub w UI.
  // Jeśli nie podasz — adapter powinien go utworzyć lub fallbackować.
  correlationId?: string;
}

export interface CheckoutSession {
  redirectUrl: string;
  provider: PaymentProviderType;
  correlationId: string;
  // Na potrzeby future: pełny kontekst sesji.
  // Dzięki temu UI nie musi znać providera.
  providerSessionId?: string;
  expiresAt?: string;
}

export interface PaymentProvider {
  createCheckoutSession(request: CheckoutRequest): Promise<CheckoutSession>;
}

