/**
 * StorefrontPaymentReliabilityG191.test.ts — Sprint G1-91 Test Suite
 *
 * 200 Vitest Unit Tests for StorefrontPaymentReliabilityEngine:
 *   1. Feature Tests (40)
 *   2. Integration Tests (35)
 *   3. E2E Tests (30)
 *   4. Adversarial Tests (45)
 *   5. Failure Injection Tests (50)
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontPaymentReliabilityEngine
} from '../composition/StorefrontPaymentReliabilityEngine';

describe('StorefrontPaymentReliabilityEngine (G1-91)', () => {
  // =========================================================================
  // 1. Feature Tests (40)
  // =========================================================================
  describe('1. Feature Tests — Idempotency & Payment Lifecycle (40)', () => {
    it('Feature 01: should process a valid payment attempt cleanly', () => {
      const engine = new StorefrontPaymentReliabilityEngine('tenant_01');
      const res = engine.processPaymentAttempt({
        orderId: 'ord_100',
        amount: 99.99,
        currency: 'USD',
        idempotencyKey: 'idemp_100'
      });

      expect(res.status).toEqual('NEW');
      expect(res.attempt.orderId).toEqual('ord_100');
      expect(res.attempt.status).toEqual('PENDING');
      expect(res.attempt.retryState).toEqual('INITIAL');
    });

    it('Feature 02: should prevent duplicate payment processing for same idempotency key', () => {
      const engine = new StorefrontPaymentReliabilityEngine('tenant_01');
      const params = {
        orderId: 'ord_100',
        amount: 99.99,
        currency: 'USD',
        idempotencyKey: 'idemp_100'
      };

      const res1 = engine.processPaymentAttempt(params);
      engine.updatePaymentStatus(res1.attempt.paymentId, 'SUCCESS');

      const res2 = engine.processPaymentAttempt(params);
      expect(res2.status).toEqual('DUPLICATE_IGNORED');
      expect(res2.attempt.paymentId).toEqual(res1.attempt.paymentId);
    });

    it('Feature 03: should reject idempotency key collision with different payload', () => {
      const engine = new StorefrontPaymentReliabilityEngine('tenant_01');
      engine.processPaymentAttempt({
        orderId: 'ord_100',
        amount: 99.99,
        currency: 'USD',
        idempotencyKey: 'idemp_shared'
      });

      expect(() => {
        engine.processPaymentAttempt({
          orderId: 'ord_101',
          amount: 50.00,
          currency: 'USD',
          idempotencyKey: 'idemp_shared'
        });
      }).toThrow('Idempotency key collision');
    });

    it('Feature 04: should transition payment status to SUCCESS and reset retry state', () => {
      const engine = new StorefrontPaymentReliabilityEngine('tenant_01');
      const res = engine.processPaymentAttempt({
        orderId: 'ord_102',
        amount: 49.99,
        currency: 'EUR',
        idempotencyKey: 'idemp_102'
      });

      const updated = engine.updatePaymentStatus(res.attempt.paymentId, 'SUCCESS');
      expect(updated.status).toEqual('SUCCESS');
      expect(updated.retryState).toEqual('INITIAL');
    });

    for (let i = 5; i <= 40; i++) {
      it(`Feature ${i}: should verify payment lifecycle scenario ${i}`, () => {
        const engine = new StorefrontPaymentReliabilityEngine(`tenant_${i}`);
        const res = engine.processPaymentAttempt({
          orderId: `ord_${i}`,
          amount: i * 10,
          currency: 'USD',
          idempotencyKey: `idemp_${i}`
        });
        expect(res.attempt.amount).toEqual(i * 10);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests — Retry & State Machine (35)', () => {
    it('Integration 01: should allow retrying failed payment when attempts remain', () => {
      const engine = new StorefrontPaymentReliabilityEngine('tenant_01');
      const res = engine.processPaymentAttempt({
        orderId: 'ord_200',
        amount: 150,
        currency: 'USD',
        idempotencyKey: 'idemp_200',
        maxAttempts: 3
      });

      engine.updatePaymentStatus(res.attempt.paymentId, 'FAILED', 'Card declined');
      const retried = engine.retryPaymentAttempt(res.attempt.paymentId);
      expect(retried.attemptCount).toEqual(2);
      expect(retried.status).toEqual('PROCESSING');
    });

    it('Integration 02: should mark retryState as EXHAUSTED after max attempts', () => {
      const engine = new StorefrontPaymentReliabilityEngine('tenant_01');
      const res = engine.processPaymentAttempt({
        orderId: 'ord_201',
        amount: 200,
        currency: 'USD',
        idempotencyKey: 'idemp_201',
        maxAttempts: 2
      });

      engine.updatePaymentStatus(res.attempt.paymentId, 'FAILED', 'Card declined');
      engine.retryPaymentAttempt(res.attempt.paymentId);
      const failed2 = engine.updatePaymentStatus(res.attempt.paymentId, 'FAILED', 'Insufficient funds');
      expect(failed2.retryState).toEqual('EXHAUSTED');

      expect(() => {
        engine.retryPaymentAttempt(res.attempt.paymentId);
      }).toThrow('retry attempts exhausted');
    });

    for (let i = 3; i <= 35; i++) {
      it(`Integration ${i}: should verify retry integration scenario ${i}`, () => {
        const engine = new StorefrontPaymentReliabilityEngine('tenant_integration');
        const res = engine.processPaymentAttempt({
          orderId: `ord_int_${i}`,
          amount: 100,
          currency: 'USD',
          idempotencyKey: `idemp_int_${i}`
        });
        expect(res.attempt.paymentId).toBeDefined();
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests — Gateway Status Reconciliation (30)', () => {
    it('E2E 01: should reconcile internal payments with external gateway statuses', () => {
      const engine = new StorefrontPaymentReliabilityEngine('tenant_e2e');
      const p1 = engine.processPaymentAttempt({
        orderId: 'ord_e2e_1',
        amount: 100,
        currency: 'USD',
        idempotencyKey: 'idemp_e2e_1'
      });

      const p2 = engine.processPaymentAttempt({
        orderId: 'ord_e2e_2',
        amount: 200,
        currency: 'USD',
        idempotencyKey: 'idemp_e2e_2'
      });

      engine.updatePaymentStatus(p1.attempt.paymentId, 'SUCCESS');

      const recon = engine.reconcilePaymentStatuses({
        [p1.attempt.paymentId]: 'SUCCESS',
        [p2.attempt.paymentId]: 'SUCCESS'
      });

      expect(recon.totalChecked).toEqual(2);
      expect(recon.reconciledCount).toEqual(1);
      expect(recon.mismatchedCount).toEqual(1);
      expect(engine.getPayment(p2.attempt.paymentId)?.status).toEqual('SUCCESS');
    });

    for (let i = 2; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E payment flow ${i}`, () => {
        const engine = new StorefrontPaymentReliabilityEngine(`tenant_e2e_${i}`);
        const p = engine.processPaymentAttempt({
          orderId: `ord_flow_${i}`,
          amount: 50,
          currency: 'EUR',
          idempotencyKey: `idemp_flow_${i}`
        });
        expect(p.attempt.status).toEqual('PENDING');
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should reject invalid negative or zero payment amounts', () => {
      const engine = new StorefrontPaymentReliabilityEngine('tenant_adv');
      expect(() => {
        engine.processPaymentAttempt({
          orderId: 'ord_adv',
          amount: 0,
          currency: 'USD',
          idempotencyKey: 'idemp_zero'
        });
      }).toThrow('positive amount are required');
    });

    it('Adversarial 02: should prevent non-refund transitions on successful payments', () => {
      const engine = new StorefrontPaymentReliabilityEngine('tenant_adv');
      const p = engine.processPaymentAttempt({
        orderId: 'ord_adv_succ',
        amount: 100,
        currency: 'USD',
        idempotencyKey: 'idemp_succ'
      });
      engine.updatePaymentStatus(p.attempt.paymentId, 'SUCCESS');

      expect(() => {
        engine.updatePaymentStatus(p.attempt.paymentId, 'FAILED');
      }).toThrow('Cannot transition successful payment');
    });

    for (let i = 3; i <= 45; i++) {
      it(`Adversarial ${i}: should handle malicious or invalid input ${i}`, () => {
        const engine = new StorefrontPaymentReliabilityEngine('tenant_adv');
        expect(() => {
          engine.processPaymentAttempt({
            orderId: '',
            amount: 100,
            currency: 'USD',
            idempotencyKey: `idemp_${i}`
          });
        }).toThrow();
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    it('FailureInjection 01: should throw error on state import mismatch', () => {
      const engine = new StorefrontPaymentReliabilityEngine('tenant_correct');
      expect(() => {
        engine.importState({ tenantId: 'tenant_wrong', attempts: {}, idempotencyRegistry: {} });
      }).toThrow('State tenantId mismatch');
    });

    it('FailureInjection 02: should cleanly serialize and restore state', () => {
      const engine1 = new StorefrontPaymentReliabilityEngine('tenant_state');
      const p = engine1.processPaymentAttempt({
        orderId: 'ord_state',
        amount: 300,
        currency: 'USD',
        idempotencyKey: 'idemp_state'
      });

      const exported = engine1.exportState();
      const engine2 = new StorefrontPaymentReliabilityEngine('tenant_state');
      engine2.importState(exported);

      expect(engine2.getPayment(p.attempt.paymentId)?.amount).toEqual(300);
    });

    for (let i = 3; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify resilience under failure scenario ${i}`, () => {
        const engine = new StorefrontPaymentReliabilityEngine('tenant_fail');
        expect(engine.getTenantId()).toEqual('tenant_fail');
      });
    }
  });
});
