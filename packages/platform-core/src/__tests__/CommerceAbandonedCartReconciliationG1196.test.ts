/**
 * CommerceAbandonedCartReconciliationG1196.test.ts — G1-196
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AbandonedCartRecoveryReconciler,
  AbandonedCart,
  CartRecovery,
  RecoveryNotification,
} from '../CommerceAbandonedCartReconciliation';

function makeCart(overrides: Partial<AbandonedCart> = {}): AbandonedCart {
  return {
    cartId: 'cart-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    items: [{ productId: 'p1', quantity: 1, price: 10 }],
    totalAmount: 10,
    abandonedAt: '2025-01-01T10:00:00Z',
    currency: 'USD',
    ...overrides,
  };
}

function makeRecovery(overrides: Partial<CartRecovery> = {}): CartRecovery {
  return {
    recoveryId: 'rec-1',
    cartId: 'cart-1',
    tenantId: 'tenant-1',
    recoveredAt: '2025-01-01T12:00:00Z',
    recoveryType: 'EMAIL',
    discountOffered: 10,
    status: 'SENT',
    ...overrides,
  };
}

function makeNotification(overrides: Partial<RecoveryNotification> = {}): RecoveryNotification {
  return {
    notificationId: 'notif-1',
    recoveryId: 'rec-1',
    channel: 'EMAIL',
    sentAt: '2025-01-01T12:01:00Z',
    deliveredAt: '2025-01-01T12:02:00Z',
    status: 'DELIVERED',
    ...overrides,
  };
}

describe('AbandonedCartRecoveryReconciler', () => {
  let reconciler: AbandonedCartRecoveryReconciler;

  beforeEach(() => {
    reconciler = new AbandonedCartRecoveryReconciler();
  });

  // --- auditAbandonedCartRecovery ---

  describe('auditAbandonedCartRecovery()', () => {
    it('returns a report with timestamp', () => {
      const report = reconciler.auditAbandonedCartRecovery([], [], []);
      expect(report.timestamp).toBeDefined();
    });

    it('returns zero counts for empty inputs', () => {
      const report = reconciler.auditAbandonedCartRecovery([], [], []);
      expect(report.totalAbandonedCarts).toBe(0);
      expect(report.totalRecoveries).toBe(0);
      expect(report.totalNotifications).toBe(0);
    });

    it('counts abandoned carts correctly', () => {
      const report = reconciler.auditAbandonedCartRecovery([makeCart(), makeCart({ cartId: 'cart-2' })], [], []);
      expect(report.totalAbandonedCarts).toBe(2);
    });

    it('counts recoveries correctly', () => {
      const report = reconciler.auditAbandonedCartRecovery([], [makeRecovery()], []);
      expect(report.totalRecoveries).toBe(1);
    });

    it('counts notifications correctly', () => {
      const report = reconciler.auditAbandonedCartRecovery([], [], [makeNotification()]);
      expect(report.totalNotifications).toBe(1);
    });

    it('detects unrecovered carts in report', () => {
      const report = reconciler.auditAbandonedCartRecovery([makeCart()], [], []);
      expect(report.unrecoveredCount).toBe(1);
    });

    it('scores 100 for fully recovered carts', () => {
      const cart = makeCart();
      const recovery = makeRecovery();
      const notif = makeNotification();
      const report = reconciler.auditAbandonedCartRecovery([cart], [recovery], [notif]);
      expect(report.integrityScore).toBe(100);
    });

    it('reduces score for unrecovered carts', () => {
      const report = reconciler.auditAbandonedCartRecovery([makeCart()], [], []);
      expect(report.integrityScore).toBeLessThan(100);
    });

    it('returns issues array', () => {
      const report = reconciler.auditAbandonedCartRecovery([], [], []);
      expect(Array.isArray(report.issues)).toBe(true);
    });
  });

  // --- detectUnrecoveredCarts ---

  describe('detectUnrecoveredCarts()', () => {
    it('returns empty when all carts have recoveries', () => {
      const issues = reconciler.detectUnrecoveredCarts([makeCart()], [makeRecovery()]);
      expect(issues.length).toBe(0);
    });

    it('detects cart with no recovery', () => {
      const issues = reconciler.detectUnrecoveredCarts([makeCart()], []);
      expect(issues.length).toBe(1);
      expect(issues[0].issueType).toBe('UNRECOVERED_CART');
    });

    it('detects multiple unrecovered carts', () => {
      const carts = [makeCart({ cartId: 'c1' }), makeCart({ cartId: 'c2' })];
      const issues = reconciler.detectUnrecoveredCarts(carts, []);
      expect(issues.length).toBe(2);
    });

    it('returns empty for empty abandoned carts', () => {
      const issues = reconciler.detectUnrecoveredCarts([], [makeRecovery()]);
      expect(issues.length).toBe(0);
    });

    it('marks unrecovered as HIGH severity', () => {
      const issues = reconciler.detectUnrecoveredCarts([makeCart()], []);
      expect(issues[0].severity).toBe('HIGH');
    });

    it('includes cartId in issue', () => {
      const issues = reconciler.detectUnrecoveredCarts([makeCart({ cartId: 'test-cart' })], []);
      expect(issues[0].cartId).toBe('test-cart');
    });

    it('sets recoveryId to null for unrecovered', () => {
      const issues = reconciler.detectUnrecoveredCarts([makeCart()], []);
      expect(issues[0].recoveryId).toBeNull();
    });

    it('does not flag cart with failed recovery as unrecovered', () => {
      const issues = reconciler.detectUnrecoveredCarts(
        [makeCart()],
        [makeRecovery({ status: 'FAILED' })],
      );
      expect(issues.length).toBe(0);
    });
  });

  // --- detectUnsentNotifications ---

  describe('detectUnsentNotifications()', () => {
    it('returns empty when notifications exist for all sent recoveries', () => {
      const issues = reconciler.detectUnsentNotifications(
        [makeRecovery()],
        [makeNotification()],
      );
      expect(issues.length).toBe(0);
    });

    it('detects recovery with no notification', () => {
      const issues = reconciler.detectUnsentNotifications([makeRecovery()], []);
      expect(issues.length).toBe(1);
      expect(issues[0].issueType).toBe('UNSENT_NOTIFICATION');
    });

    it('marks unsent as MEDIUM severity', () => {
      const issues = reconciler.detectUnsentNotifications([makeRecovery()], []);
      expect(issues[0].severity).toBe('MEDIUM');
    });

    it('does not flag PENDING recoveries', () => {
      const issues = reconciler.detectUnsentNotifications(
        [makeRecovery({ status: 'PENDING' })],
        [],
      );
      expect(issues.length).toBe(0);
    });

    it('does not flag FAILED recoveries', () => {
      const issues = reconciler.detectUnsentNotifications(
        [makeRecovery({ status: 'FAILED' })],
        [],
      );
      expect(issues.length).toBe(0);
    });

    it('returns empty for empty recoveries', () => {
      const issues = reconciler.detectUnsentNotifications([], [makeNotification()]);
      expect(issues.length).toBe(0);
    });

    it('detects multiple unsent notifications', () => {
      const recs = [
        makeRecovery({ recoveryId: 'r1' }),
        makeRecovery({ recoveryId: 'r2' }),
      ];
      const issues = reconciler.detectUnsentNotifications(recs, []);
      expect(issues.length).toBe(2);
    });

    it('includes recoveryId in issue', () => {
      const issues = reconciler.detectUnsentNotifications(
        [makeRecovery({ recoveryId: 'rec-test' })],
        [],
      );
      expect(issues[0].recoveryId).toBe('rec-test');
    });
  });

  // --- detectDuplicateRecoveries ---

  describe('detectDuplicateRecoveries()', () => {
    it('returns empty when each cart has one recovery', () => {
      const issues = reconciler.detectDuplicateRecoveries(
        [makeCart()],
        [makeRecovery()],
      );
      expect(issues.length).toBe(0);
    });

    it('detects duplicate recovery for same cart', () => {
      const recs = [
        makeRecovery({ recoveryId: 'r1' }),
        makeRecovery({ recoveryId: 'r2' }),
      ];
      const issues = reconciler.detectDuplicateRecoveries([makeCart()], recs);
      expect(issues.length).toBe(1);
      expect(issues[0].issueType).toBe('DUPLICATE_RECOVERY');
    });

    it('marks duplicate as MEDIUM severity', () => {
      const recs = [makeRecovery({ recoveryId: 'r1' }), makeRecovery({ recoveryId: 'r2' })];
      const issues = reconciler.detectDuplicateRecoveries([makeCart()], recs);
      expect(issues[0].severity).toBe('MEDIUM');
    });

    it('does not flag different carts with one recovery each', () => {
      const carts = [makeCart({ cartId: 'c1' }), makeCart({ cartId: 'c2' })];
      const recs = [makeRecovery({ cartId: 'c1' }), makeRecovery({ cartId: 'c2' })];
      const issues = reconciler.detectDuplicateRecoveries(carts, recs);
      expect(issues.length).toBe(0);
    });

    it('returns empty for empty recoveries', () => {
      const issues = reconciler.detectDuplicateRecoveries([makeCart()], []);
      expect(issues.length).toBe(0);
    });

    it('detects triple duplicate', () => {
      const recs = [
        makeRecovery({ recoveryId: 'r1' }),
        makeRecovery({ recoveryId: 'r2' }),
        makeRecovery({ recoveryId: 'r3' }),
      ];
      const issues = reconciler.detectDuplicateRecoveries([makeCart()], recs);
      expect(issues.length).toBe(1);
    });

    it('includes cartId in issue', () => {
      const recs = [makeRecovery({ recoveryId: 'r1', cartId: 'dup-cart' }), makeRecovery({ recoveryId: 'r2', cartId: 'dup-cart' })];
      const issues = reconciler.detectDuplicateRecoveries([makeCart({ cartId: 'dup-cart' })], recs);
      expect(issues[0].cartId).toBe('dup-cart');
    });
  });

  // --- validateRecoveryTiming ---

  describe('validateRecoveryTiming()', () => {
    it('returns null for recovery within window', () => {
      const cart = makeCart({ abandonedAt: '2025-01-01T10:00:00Z' });
      const recovery = makeRecovery({ recoveredAt: '2025-01-01T12:00:00Z' });
      const issue = reconciler.validateRecoveryTiming(cart, recovery);
      expect(issue).toBeNull();
    });

    it('returns HIGH severity when recovery is before abandonment', () => {
      const cart = makeCart({ abandonedAt: '2025-01-01T10:00:00Z' });
      const recovery = makeRecovery({ recoveredAt: '2025-01-01T09:00:00Z' });
      const issue = reconciler.validateRecoveryTiming(cart, recovery);
      expect(issue).not.toBeNull();
      expect(issue!.severity).toBe('HIGH');
    });

    it('returns LOW severity for recovery beyond window', () => {
      const cart = makeCart({ abandonedAt: '2025-01-01T00:00:00Z' });
      const recovery = makeRecovery({ recoveredAt: '2025-01-04T12:00:00Z' });
      const issue = reconciler.validateRecoveryTiming(cart, recovery);
      expect(issue).not.toBeNull();
      expect(issue!.severity).toBe('LOW');
    });

    it('returns TIMING_VIOLATION issue type for bad timing', () => {
      const cart = makeCart({ abandonedAt: '2025-01-01T00:00:00Z' });
      const recovery = makeRecovery({ recoveredAt: '2025-01-04T12:00:00Z' });
      const issue = reconciler.validateRecoveryTiming(cart, recovery);
      expect(issue!.issueType).toBe('TIMING_VIOLATION');
    });

    it('returns null for exact boundary timing (72h)', () => {
      const cart = makeCart({ abandonedAt: '2025-01-01T00:00:00Z' });
      const recovery = makeRecovery({ recoveredAt: '2025-01-04T00:00:00Z' });
      const issue = reconciler.validateRecoveryTiming(cart, recovery);
      expect(issue).toBeNull();
    });

    it('includes cartId in timing issue', () => {
      const cart = makeCart({ cartId: 'timing-cart', abandonedAt: '2025-01-01T00:00:00Z' });
      const recovery = makeRecovery({ recoveredAt: '2025-01-04T12:00:00Z' });
      const issue = reconciler.validateRecoveryTiming(cart, recovery);
      expect(issue!.cartId).toBe('timing-cart');
    });
  });

  // --- generateReconciliationReport ---

  describe('generateReconciliationReport()', () => {
    it('delegates to auditAbandonedCartRecovery', () => {
      const cart = makeCart();
      const recovery = makeRecovery();
      const notif = makeNotification();
      const report = reconciler.generateReconciliationReport([cart], [recovery], [notif]);
      expect(report.recoveredCount).toBe(1);
      expect(report.integrityScore).toBe(100);
    });

    it('returns zero counts for empty inputs', () => {
      const report = reconciler.generateReconciliationReport([], [], []);
      expect(report.totalAbandonedCarts).toBe(0);
      expect(report.unrecoveredCount).toBe(0);
    });
  });
});
