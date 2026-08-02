import { describe, expect, it } from 'vitest';
import {
  MOCK_BUILDER_DOCUMENTS,
  MOCK_ORDERS,
  MOCK_PAYMENT_PAYLOADS,
  MOCK_PREVIEW_PAYLOADS,
  MOCK_PRODUCTS,
  MOCK_RUNTIME_SNAPSHOTS,
  MOCK_SECTIONS,
  MOCK_STORES,
  MOCK_TENANTS,
  MOCK_WEBHOOK_PAYLOADS,
} from './index';

describe('Test Data & Fixtures Library (@web-factor/test-fixtures)', () => {
  it('should export valid mock stores and tenants', () => {
    expect(MOCK_STORES.demoStore.slug).toBe('onekoszyk-demo');
    expect(MOCK_TENANTS.polandTenant.plan).toBe('ENTERPRISE');
  });

  it('should export valid mock commerce orders and products', () => {
    expect(MOCK_ORDERS.pendingOrder.status).toBe('PAYMENT_PENDING');
    expect(MOCK_PRODUCTS.tshirt.sku).toBe('TSHIRT-BLK-M');
  });

  it('should export valid mock builder documents and sections', () => {
    expect(MOCK_SECTIONS.heroBanner.type).toBe('HeroBannerSection');
    expect(MOCK_BUILDER_DOCUMENTS.landingPageDoc.pages[0].sections.length).toBe(2);
  });

  it('should export valid mock runtime snapshots and preview payloads', () => {
    expect(MOCK_RUNTIME_SNAPSHOTS.liveSnapshot.outputMode).toBe('LIVE');
    expect(MOCK_PREVIEW_PAYLOADS.updatePropsPayload.type).toBe('UPDATE_PROPS');
  });

  it('should export valid mock webhook and payment payloads', () => {
    expect(MOCK_WEBHOOK_PAYLOADS.paymentCompletedWebhook.eventType).toBe('payment.completed');
    expect(MOCK_PAYMENT_PAYLOADS.stripePaymentSuccess.status).toBe('SUCCESS');
  });
});
