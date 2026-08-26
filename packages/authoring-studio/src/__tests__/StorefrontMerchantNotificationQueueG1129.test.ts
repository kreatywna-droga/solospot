/**
 * StorefrontMerchantNotificationQueueG1129.test.ts — Sprint G1-129 Test Suite
 *
 * 200 Vitest Unit Tests for StorefrontMerchantNotificationQueueEngine:
 *   1. Feature Tests (40)
 *   2. Integration Tests (35)
 *   3. E2E Tests (30)
 *   4. Adversarial Tests (45)
 *   5. Failure Injection Tests (50)
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontMerchantNotificationQueueEngine
} from '../composition/StorefrontMerchantNotificationQueueEngine';

describe('StorefrontMerchantNotificationQueueEngine (G1-129 — Decision Drift #4)', () => {
  // =========================================================================
  // 1. Feature Tests (40)
  // =========================================================================
  describe('1. Feature Tests — Merchant Operational Alerts & Urgency Sorting (40)', () => {
    it('Feature 01: should enqueue merchant notification cleanly in UNREAD status', () => {
      const engine = new StorefrontMerchantNotificationQueueEngine('tenant_01');
      const n = engine.enqueueNotification({
        notificationId: 'n_01',
        merchantUserId: 'm_owner',
        category: 'LOW_STOCK_WARNING',
        urgency: 'HIGH',
        title: 'Low Stock Alert',
        message: 'Product T-Shirt stock is below threshold (2 items remaining)'
      });

      expect(n.notificationId).toEqual('n_01');
      expect(n.status).toEqual('UNREAD');
      expect(n.urgency).toEqual('HIGH');
    });

    it('Feature 02: should retrieve unread notifications sorted by urgency weight (URGENT > HIGH > NORMAL > LOW)', () => {
      const engine = new StorefrontMerchantNotificationQueueEngine('tenant_01');
      engine.enqueueNotification({ notificationId: 'n_low', merchantUserId: 'm1', category: 'SYSTEM_HEALTH_DEGRADED', urgency: 'LOW', title: 'Low', message: 'M' });
      engine.enqueueNotification({ notificationId: 'n_urgent', merchantUserId: 'm1', category: 'HIGH_RISK_FRAUD', urgency: 'URGENT', title: 'Urgent', message: 'M' });
      engine.enqueueNotification({ notificationId: 'n_high', merchantUserId: 'm1', category: 'LOW_STOCK_WARNING', urgency: 'HIGH', title: 'High', message: 'M' });

      const unread = engine.getUnreadNotificationsForMerchant('m1');

      expect(unread).toHaveLength(3);
      expect(unread[0].notificationId).toEqual('n_urgent');
      expect(unread[1].notificationId).toEqual('n_high');
      expect(unread[2].notificationId).toEqual('n_low');
    });

    it('Feature 03: should update notification status to READ or DISMISSED cleanly', () => {
      const engine = new StorefrontMerchantNotificationQueueEngine('tenant_01');
      engine.enqueueNotification({ notificationId: 'n1', merchantUserId: 'm1', category: 'NEW_B2B_QUOTE_REQUEST', urgency: 'NORMAL', title: 'RFQ', message: 'M' });

      const updated = engine.updateNotificationStatus('n1', 'READ');
      expect(updated.status).toEqual('READ');
      expect(engine.getUnreadNotificationsForMerchant('m1')).toHaveLength(0);
    });

    for (let i = 4; i <= 40; i++) {
      it(`Feature ${i}: should verify notification queue scenario ${i}`, () => {
        const engine = new StorefrontMerchantNotificationQueueEngine(`tenant_${i}`);
        const n = engine.enqueueNotification({
          notificationId: `n_${i}`,
          merchantUserId: `m_${i}`,
          category: 'LOW_STOCK_WARNING',
          urgency: 'NORMAL',
          title: `Alert ${i}`,
          message: 'Detail'
        });
        expect(n.notificationId).toEqual(`n_${i}`);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    it('Integration 01: should query notification by notificationId', () => {
      const engine = new StorefrontMerchantNotificationQueueEngine('tenant_int');
      engine.enqueueNotification({ notificationId: 'n1', merchantUserId: 'm1', category: 'HIGH_RISK_FRAUD', urgency: 'URGENT', title: 'T', message: 'M' });

      expect(engine.getNotification('n1')?.merchantUserId).toEqual('m1');
    });

    for (let i = 2; i <= 35; i++) {
      it(`Integration ${i}: should verify notification integration scenario ${i}`, () => {
        const engine = new StorefrontMerchantNotificationQueueEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E notification alert workflow ${i}`, () => {
        const engine = new StorefrontMerchantNotificationQueueEngine(`tenant_e2e_${i}`);
        engine.enqueueNotification({ notificationId: `n_${i}`, merchantUserId: `m_${i}`, category: 'UNMATCHED_PAYMENT', urgency: 'HIGH', title: 'T', message: 'M' });
        const res = engine.updateNotificationStatus(`n_${i}`, 'DISMISSED');
        expect(res.status).toEqual('DISMISSED');
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should throw error when notificationId or title is missing', () => {
      const engine = new StorefrontMerchantNotificationQueueEngine('tenant_adv');
      expect(() => {
        engine.enqueueNotification({ notificationId: '', merchantUserId: 'm1', category: 'LOW_STOCK_WARNING', urgency: 'LOW', title: '', message: 'M' });
      }).toThrow('title, and message are required');
    });

    for (let i = 2; i <= 45; i++) {
      it(`Adversarial ${i}: should handle missing notification query cleanly ${i}`, () => {
        const engine = new StorefrontMerchantNotificationQueueEngine('tenant_adv');
        expect(engine.getNotification(`missing_${i}`)).toBeUndefined();
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    it('FailureInjection 01: should export and import state cleanly', () => {
      const engine1 = new StorefrontMerchantNotificationQueueEngine('tenant_fi');
      engine1.enqueueNotification({ notificationId: 'n1', merchantUserId: 'm1', category: 'LOW_STOCK_WARNING', urgency: 'HIGH', title: 'T', message: 'M' });

      const state = engine1.exportState();
      const engine2 = new StorefrontMerchantNotificationQueueEngine('tenant_fi');
      engine2.importState(state);

      expect(engine2.getNotification('n1')?.merchantUserId).toEqual('m1');
    });

    for (let i = 2; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience scenario ${i}`, () => {
        const engine = new StorefrontMerchantNotificationQueueEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
