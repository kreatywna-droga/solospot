import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import { PaymentEngine } from './PaymentEngine';
import { PaymentProviderAdapter, InvalidPaymentStateException, PaymentIntent } from './PaymentProviderAdapter';
import { TenantSecurityException } from './CommerceEngine';

describe('Payment Engine', () => {
  let engine: PaymentEngine;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;

  // Mock Stripe Adapter
  const mockStripeAdapter: PaymentProviderAdapter = {
    id: 'stripe',
    createIntent: async (dto) => {
      return {
        externalId: `ext_stripe_intent_${Math.random().toString(36).substr(2, 9)}`,
        clientSecret: 'secret_123456',
        rawPayload: { service: 'stripe_mock', status: 'created' },
      };
    },
    getPaymentStatus: async (externalId) => {
      return 'CAPTURED';
    },
    refundPayment: async (externalId, amount) => {
      return {
        refundExternalId: `ref_stripe_${Math.random().toString(36).substr(2, 9)}`,
        success: true,
        rawPayload: { amount_refunded: amount },
      };
    },
  };

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();

    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);

    engine = new PaymentEngine({ eventBus, logger });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('Should successfully create payment intent and transition status: CREATED -> PROCESSING -> CAPTURED', async () => {
    const tenantId = 'tenant-xyz';
    const orderId = 'ord_12345';

    // 1. Create intent
    let intent = await engine.createPaymentIntent(tenantId, orderId, 10000, 'PLN', mockStripeAdapter);
    expect(intent.tenantId).toBe(tenantId);
    expect(intent.orderId).toBe(orderId);
    expect(intent.amountGross).toBe(10000);
    expect(intent.status).toBe('CREATED');
    expect(intent.providerId).toBe('stripe');

    // 2. Start Processing (CREATED -> PROCESSING)
    intent = await engine.startProcessing(tenantId, intent);
    expect(intent.status).toBe('PROCESSING');

    // 3. Complete (PROCESSING -> CAPTURED)
    intent = await engine.completePayment(tenantId, intent);
    expect(intent.status).toBe('CAPTURED');
  });

  it('Should throw InvalidPaymentStateException for illegal transitions', async () => {
    const tenantId = 'tenant-xyz';
    const orderId = 'ord_12345';

    let intent = await engine.createPaymentIntent(tenantId, orderId, 10000, 'PLN', mockStripeAdapter);

    // Direct transition CREATED -> CAPTURED is forbidden (must go through PROCESSING first)
    await expect(
      engine.completePayment(tenantId, intent)
    ).rejects.toThrow(InvalidPaymentStateException);

    // Transition to PROCESSING is valid
    intent = await engine.startProcessing(tenantId, intent);
    expect(intent.status).toBe('PROCESSING');

    // Transition to FAILED is valid
    intent = await engine.failPayment(tenantId, intent);
    expect(intent.status).toBe('FAILED');

    // Transition from FAILED to CAPTURED is forbidden
    await expect(
      engine.completePayment(tenantId, intent)
    ).rejects.toThrow(InvalidPaymentStateException);
  });

  it('Should enforce RLS and throw TenantSecurityException on cross-tenant operations', async () => {
    const tenantA = 'tenant-a';
    const tenantB = 'tenant-b';

    let intentA = await engine.createPaymentIntent(tenantA, 'ord-a', 5000, 'PLN', mockStripeAdapter);

    // Tenant B trying to process Tenant A's intent -> throws
    await expect(
      engine.startProcessing(tenantB, intentA)
    ).rejects.toThrow(TenantSecurityException);

    // Tenant B trying to complete Tenant A's intent -> throws
    await expect(
      engine.completePayment(tenantB, intentA)
    ).rejects.toThrow(TenantSecurityException);
  });

  it('Should process refund for completed payment (CAPTURED -> REFUNDED) via adapter', async () => {
    const tenantId = 'tenant-xyz';
    const orderId = 'ord_12345';

    let intent = await engine.createPaymentIntent(tenantId, orderId, 10000, 'PLN', mockStripeAdapter);
    intent = await engine.startProcessing(tenantId, intent);
    intent = await engine.completePayment(tenantId, intent);
    expect(intent.status).toBe('CAPTURED');

    // Refund intent
    const refundAmount = 5000;
    const { intent: refundedIntent, refund } = await engine.refundPayment(
      tenantId,
      intent,
      refundAmount,
      'Customer request',
      mockStripeAdapter
    );

    expect(refundedIntent.status).toBe('REFUNDED');
    expect(refund.paymentIntentId).toBe(intent.id);
    expect(refund.amount).toBe(refundAmount);
    expect(refund.status).toBe('COMPLETED');
  });
});
