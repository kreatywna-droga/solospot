export interface MockWebhookPayload {
  eventId: string;
  eventType: 'payment.completed' | 'payment.failed';
  signature: string;
  payload: {
    orderId: string;
    amount: number;
    currency: string;
    status: 'PAID' | 'FAILED';
  };
}

export const MOCK_WEBHOOK_PAYLOADS: Record<string, MockWebhookPayload> = {
  paymentCompletedWebhook: {
    eventId: 'evt_wh_001',
    eventType: 'payment.completed',
    signature: 't=1600000000,v1=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    payload: {
      orderId: 'ord_1001',
      amount: 299.99,
      currency: 'PLN',
      status: 'PAID',
    },
  },
};
