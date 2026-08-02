export interface MockOrder {
  id: string;
  storeId: string;
  tenantId: string;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'PAYMENT_PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  itemsCount: number;
  idempotencyKey: string;
}

export const MOCK_ORDERS: Record<string, MockOrder> = {
  pendingOrder: {
    id: 'ord_1001',
    storeId: 'store_demo_001',
    tenantId: 'tenant_poland_01',
    totalAmount: 299.99,
    currency: 'PLN',
    status: 'PAYMENT_PENDING',
    itemsCount: 2,
    idempotencyKey: 'idem_evt_99812',
  },
  paidOrder: {
    id: 'ord_1002',
    storeId: 'store_demo_001',
    tenantId: 'tenant_poland_01',
    totalAmount: 150.00,
    currency: 'PLN',
    status: 'PAID',
    itemsCount: 1,
    idempotencyKey: 'idem_evt_99813',
  },
};
