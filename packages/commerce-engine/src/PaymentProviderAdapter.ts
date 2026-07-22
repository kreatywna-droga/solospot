export type PaymentState = 'CREATED' | 'PROCESSING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';

export interface PaymentIntent {
  id: string;
  tenantId: string;
  orderId: string;
  amountGross: number;      // in smallest currency unit (cents, grosze)
  currency: string;
  status: PaymentState;
  providerId: string;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  tenantId: string;
  paymentIntentId: string;
  type: 'CHARGE' | 'REFUND';
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  rawResponse?: Record<string, any>;
  createdAt: string;
}

export interface Refund {
  id: string;
  tenantId: string;
  paymentIntentId: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface CreateProviderIntentDto {
  orderId: string;
  amountGross: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface PaymentProviderAdapter {
  readonly id: string;
  createIntent(dto: CreateProviderIntentDto): Promise<{
    externalId: string;
    clientSecret?: string;
    rawPayload: any;
  }>;
  getPaymentStatus(externalId: string): Promise<PaymentState>;
  refundPayment(externalId: string, amount: number): Promise<{
    refundExternalId: string;
    success: boolean;
    rawPayload: any;
  }>;
}

export class InvalidPaymentStateException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPaymentStateException';
  }
}
