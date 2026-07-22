export type PaymentProviderType = 'onekoszyk' | 'stripe' | 'payu';

export type PaymentEventType =
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED';

export interface PaymentProviderEvent {
  id: string;

  provider: PaymentProviderType;

  type: PaymentEventType;

  tenantId: string;

  // ID zamówienia wewnętrznego (platforma) — powinno być mapowane wcześniej
  // lub wyliczone w ramach korelacji.
  orderId: string;

  transactionId: string;

  amount: number;
  currency: string;

  occurredAt: string; // ISO

  correlationId: string;

  // Surowy payload dostawcy (dla audit/debug). Nie używać do logiki biznesowej.
  // W future: payloadHash zamiast trzymania całego payload.
  providerPayload?: unknown;
}

