export interface MockPaymentPayload {
  paymentId: string;
  orderId: string;
  provider: 'STRIPE' | 'PAYU' | 'BLIK';
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED';
}

export const MOCK_PAYMENT_PAYLOADS: Record<string, MockPaymentPayload> = {
  stripePaymentSuccess: {
    paymentId: 'pay_stripe_001',
    orderId: 'ord_1001',
    provider: 'STRIPE',
    amount: 299.99,
    currency: 'PLN',
    status: 'SUCCESS',
  },
};
