/**
 * TenantEventIsolationAuditG1204.test.ts — G1-204 Tenant Event Isolation Audit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TenantEventIsolationAuditor,
  TenantEventRecord,
  EventSubscription,
} from '../TenantEventIsolationAudit';

function makeEvent(eventId: string, tenantId: string, eventType = 'user.created'): TenantEventRecord {
  return { eventId, tenantId, eventType, payload: {}, publishedAtMs: 1000 };
}

function makeSubscription(subscriptionId: string, tenantId: string, eventType = 'user.created'): EventSubscription {
  return { subscriptionId, tenantId, eventType };
}

describe('TenantEventIsolationAuditor', () => {
  let auditor: TenantEventIsolationAuditor;

  beforeEach(() => {
    auditor = new TenantEventIsolationAuditor();
  });

  // ── auditEventIsolation ──

  describe('auditEventIsolation()', () => {
    it('returns no violations for events with valid tenant tags', () => {
      const events = [makeEvent('e1', 't1'), makeEvent('e2', 't2')];
      const violations = auditor.auditEventIsolation(events);
      expect(violations).toHaveLength(0);
    });

    it('detects events missing tenant tag', () => {
      const events = [{ eventId: 'e1', tenantId: '', eventType: 'x', payload: {}, publishedAtMs: 1000 }];
      const violations = auditor.auditEventIsolation(events);
      expect(violations).toHaveLength(1);
      expect(violations[0].violationType).toBe('MISSING_TENANT_TAG');
    });

    it('detects events with whitespace-only tenant tag', () => {
      const events = [{ eventId: 'e1', tenantId: '  ', eventType: 'x', payload: {}, publishedAtMs: 1000 }];
      const violations = auditor.auditEventIsolation(events);
      expect(violations).toHaveLength(1);
    });

    it('returns empty for no events', () => {
      const violations = auditor.auditEventIsolation([]);
      expect(violations).toHaveLength(0);
    });

    it('detects multiple missing tags', () => {
      const events = [
        { eventId: 'e1', tenantId: '', eventType: 'x', payload: {}, publishedAtMs: 1000 },
        { eventId: 'e2', tenantId: '', eventType: 'x', payload: {}, publishedAtMs: 1000 },
      ];
      const violations = auditor.auditEventIsolation(events);
      expect(violations).toHaveLength(2);
    });
  });

  // ── detectCrossTenantEventLeakage ──

  describe('detectCrossTenantEventLeakage()', () => {
    it('returns no violations when events match tenant subscriptions', () => {
      const events = [makeEvent('e1', 't1')];
      const subs = [makeSubscription('s1', 't1')];
      const violations = auditor.detectCrossTenantEventLeakage(events, subs);
      expect(violations).toHaveLength(0);
    });

    it('detects event deliverable to wrong tenant', () => {
      const events = [makeEvent('e1', 't1')];
      const subs = [makeSubscription('s1', 't2')];
      const violations = auditor.detectCrossTenantEventLeakage(events, subs);
      expect(violations).toHaveLength(1);
      expect(violations[0].violationType).toBe('CROSS_TENANT_DELIVERY');
    });

    it('detects multiple cross-tenant deliveries', () => {
      const events = [makeEvent('e1', 't1')];
      const subs = [makeSubscription('s1', 't2'), makeSubscription('s2', 't3')];
      const violations = auditor.detectCrossTenantEventLeakage(events, subs);
      expect(violations).toHaveLength(2);
    });

    it('returns empty for empty events', () => {
      const subs = [makeSubscription('s1', 't2')];
      const violations = auditor.detectCrossTenantEventLeakage([], subs);
      expect(violations).toHaveLength(0);
    });

    it('returns empty for empty subscriptions', () => {
      const events = [makeEvent('e1', 't1')];
      const violations = auditor.detectCrossTenantEventLeakage(events, []);
      expect(violations).toHaveLength(0);
    });

    it('does not flag when event type does not match subscription', () => {
      const events = [makeEvent('e1', 't1', 'user.created')];
      const subs = [makeSubscription('s1', 't2', 'order.placed')];
      const violations = auditor.detectCrossTenantEventLeakage(events, subs);
      expect(violations).toHaveLength(0);
    });
  });

  // ── validateEventTenantTag ──

  describe('validateEventTenantTag()', () => {
    it('returns true when tenant tag matches', () => {
      const event = makeEvent('e1', 't1');
      expect(auditor.validateEventTenantTag(event, 't1')).toBe(true);
    });

    it('returns false when tenant tag does not match', () => {
      const event = makeEvent('e1', 't1');
      expect(auditor.validateEventTenantTag(event, 't2')).toBe(false);
    });

    it('returns false for empty expected tenant', () => {
      const event = makeEvent('e1', 't1');
      expect(auditor.validateEventTenantTag(event, '')).toBe(false);
    });
  });

  // ── detectOrphanedEvents ──

  describe('detectOrphanedEvents()', () => {
    it('returns empty when all events have subscribers', () => {
      const events = [makeEvent('e1', 't1')];
      const subs = [makeSubscription('s1', 't1')];
      const orphans = auditor.detectOrphanedEvents(events, subs);
      expect(orphans).toHaveLength(0);
    });

    it('detects events with no subscribers', () => {
      const events = [makeEvent('e1', 't1')];
      const orphans = auditor.detectOrphanedEvents(events, []);
      expect(orphans).toHaveLength(1);
      expect(orphans[0].eventId).toBe('e1');
    });

    it('detects orphan when event type does not match subscription type', () => {
      const events = [makeEvent('e1', 't1', 'user.created')];
      const subs = [makeSubscription('s1', 't1', 'order.placed')];
      const orphans = auditor.detectOrphanedEvents(events, subs);
      expect(orphans).toHaveLength(1);
    });

    it('returns empty for empty events', () => {
      const orphans = auditor.detectOrphanedEvents([], []);
      expect(orphans).toHaveLength(0);
    });

    it('detects orphan when subscription is for different tenant', () => {
      const events = [makeEvent('e1', 't1')];
      const subs = [makeSubscription('s1', 't2')];
      const orphans = auditor.detectOrphanedEvents(events, subs);
      expect(orphans).toHaveLength(1);
    });

    it('detects orphan when event type matches but tenant does not', () => {
      const events = [makeEvent('e1', 't1', 'user.created')];
      const subs = [makeSubscription('s1', 't2', 'user.created')];
      const orphans = auditor.detectOrphanedEvents(events, subs);
      expect(orphans).toHaveLength(1);
    });
  });

  // ── generateEventIsolationReport ──

  describe('generateEventIsolationReport()', () => {
    it('generates report with correct event count', () => {
      const events = [makeEvent('e1', 't1'), makeEvent('e2', 't2')];
      const report = auditor.generateEventIsolationReport(events, []);
      expect(report.totalEvents).toBe(2);
    });

    it('reports no violations when all events isolated', () => {
      const events = [makeEvent('e1', 't1')];
      const subs = [makeSubscription('s1', 't1')];
      const report = auditor.generateEventIsolationReport(events, subs);
      expect(report.violationsFound).toBe(0);
      expect(report.summary).toContain('pass');
    });

    it('reports violations when cross-tenant delivery possible', () => {
      const events = [makeEvent('e1', 't1')];
      const subs = [makeSubscription('s1', 't2')];
      const report = auditor.generateEventIsolationReport(events, subs);
      expect(report.violationsFound).toBeGreaterThan(0);
    });

    it('includes orphaned events in report', () => {
      const events = [makeEvent('e1', 't1')];
      const report = auditor.generateEventIsolationReport(events, []);
      expect(report.orphanedEvents).toHaveLength(1);
    });

    it('includes generatedAtMs', () => {
      const before = Date.now();
      const report = auditor.generateEventIsolationReport([], []);
      const after = Date.now();
      expect(report.generatedAtMs).toBeGreaterThanOrEqual(before);
      expect(report.generatedAtMs).toBeLessThanOrEqual(after);
    });

    it('returns empty report for no events', () => {
      const report = auditor.generateEventIsolationReport([], []);
      expect(report.totalEvents).toBe(0);
      expect(report.violationsFound).toBe(0);
    });

    it('summary includes both violations and orphaned counts', () => {
      const events = [makeEvent('e1', 't1')];
      const report = auditor.generateEventIsolationReport(events, []);
      expect(report.summary).toContain('orphaned');
    });

    it('counts violations from missing tenant tags', () => {
      const events = [{ eventId: 'e1', tenantId: '', eventType: 'x', payload: {}, publishedAtMs: 1000 }];
      const report = auditor.generateEventIsolationReport(events, []);
      expect(report.violations).toHaveLength(1);
    });

    it('counts both missing tag and cross-tenant violations', () => {
      const events = [
        { eventId: 'e1', tenantId: '', eventType: 'x', payload: {}, publishedAtMs: 1000 },
        makeEvent('e2', 't1'),
      ];
      const subs = [makeSubscription('s1', 't2')];
      const report = auditor.generateEventIsolationReport(events, subs);
      expect(report.violationsFound).toBeGreaterThanOrEqual(2);
    });

    it('includes violations array in report', () => {
      const events = [{ eventId: 'e1', tenantId: '', eventType: 'x', payload: {}, publishedAtMs: 1000 }];
      const report = auditor.generateEventIsolationReport(events, []);
      expect(report.violations.length).toBeGreaterThan(0);
    });

    it('includes empty orphanedEvents when all events have subscribers', () => {
      const events = [makeEvent('e1', 't1')];
      const subs = [makeSubscription('s1', 't1')];
      const report = auditor.generateEventIsolationReport(events, subs);
      expect(report.orphanedEvents).toHaveLength(0);
    });

    it('returns summary with violation count when violations found', () => {
      const events = [{ eventId: 'e1', tenantId: '', eventType: 'x', payload: {}, publishedAtMs: 1000 }];
      const report = auditor.generateEventIsolationReport(events, []);
      expect(report.summary).toContain('1 violation');
    });
  });

  // ── additional edge case tests ──

  describe('edge cases', () => {
    it('handles events with same tenant but different event types', () => {
      const events = [makeEvent('e1', 't1', 'user.created'), makeEvent('e2', 't1', 'order.placed')];
      const subs = [makeSubscription('s1', 't1', 'user.created')];
      const orphans = auditor.detectOrphanedEvents(events, subs);
      expect(orphans).toHaveLength(1);
      expect(orphans[0].eventType).toBe('order.placed');
    });

    it('handles multiple events for same tenant with all subscribed', () => {
      const events = [makeEvent('e1', 't1', 'user.created'), makeEvent('e2', 't1', 'user.updated')];
      const subs = [
        makeSubscription('s1', 't1', 'user.created'),
        makeSubscription('s2', 't1', 'user.updated'),
      ];
      const orphans = auditor.detectOrphanedEvents(events, subs);
      expect(orphans).toHaveLength(0);
    });

    it('detects cross-tenant leakage for multiple event types', () => {
      const events = [makeEvent('e1', 't1', 'user.created'), makeEvent('e2', 't1', 'order.placed')];
      const subs = [makeSubscription('s1', 't2', 'user.created'), makeSubscription('s2', 't2', 'order.placed')];
      const violations = auditor.detectCrossTenantEventLeakage(events, subs);
      expect(violations).toHaveLength(2);
    });

    it('validateEventTenantTag handles empty event tenantId', () => {
      const event = makeEvent('e1', '');
      expect(auditor.validateEventTenantTag(event, '')).toBe(true);
    });

    it('auditEventIsolation returns empty for valid events', () => {
      const events = [makeEvent('e1', 'tenant-a'), makeEvent('e2', 'tenant-b')];
      expect(auditor.auditEventIsolation(events)).toHaveLength(0);
    });

    it('detectOrphanedEvents returns all as orphaned when no subscriptions', () => {
      const events = [makeEvent('e1', 't1'), makeEvent('e2', 't2')];
      const orphans = auditor.detectOrphanedEvents(events, []);
      expect(orphans).toHaveLength(2);
    });
  });
});
