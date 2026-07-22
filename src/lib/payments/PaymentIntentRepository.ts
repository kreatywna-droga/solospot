import type { PaymentProviderType } from './PaymentProviderEvent';

export class PaymentIntentNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentIntentNotFoundException';
  }
}

export type PaymentIntentStatus =
  | 'CREATED'
  | 'PROCESSING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUNDED';

export interface PaymentIntentRecord {
  id: string;
  tenantId: string;
  provider: PaymentProviderType;
  providerTransactionId: string;
  orderId?: string;
  status: PaymentIntentStatus;
}

export interface PaymentIntentRepository {
  findByProviderTransactionId(params: {
    tenantId: string;
    provider: PaymentProviderType;
    transactionId: string;
  }): Promise<PaymentIntentRecord | null>;
}

