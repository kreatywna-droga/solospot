/**
 * CrossDomainEventContractAuditG1186.test.ts — G1-186 Cross-Domain Event Contract Audit
 *
 * Covers event registration, integrity validation, orphan/unsubscribe detection,
 * event flow graph, and audit report generation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CrossDomainEventContractAuditor,
  EventContract,
  EventAuditReport,
} from '../CrossDomainEventContractAudit';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeContract(overrides: Partial<EventContract> = {}): EventContract {
  return {
    eventName: 'test-event',
    publisherDomain: 'platform-core',
    subscriberDomains: ['tenant-admin', 'billing-core'],
    payloadSchema: ['eventId', 'tenantId', 'payload'],
    version: '1.0.0',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('CrossDomainEventContractAuditor', () => {
  let auditor: CrossDomainEventContractAuditor;

  beforeEach(() => {
    auditor = new CrossDomainEventContractAuditor();
  });

  // ──────────────────────────────────────────────────────────────
  // Registration (tests 1–5)
  // ──────────────────────────────────────────────────────────────

  it('1: registerEventContract stores an event contract', () => {
    auditor.registerEventContract(makeContract());
    const report = auditor.generateEventAuditReport();
    expect(report.totalEvents).toBe(1);
  });

  it('2: registerEventContract stores multiple distinct events', () => {
    auditor.registerEventContract(makeContract({ eventName: 'event-a' }));
    auditor.registerEventContract(makeContract({ eventName: 'event-b' }));
    const report = auditor.generateEventAuditReport();
    expect(report.totalEvents).toBe(2);
  });

  it('3: registerEventContract overwrites existing contract with same name', () => {
    auditor.registerEventContract(makeContract({ eventName: 'evt', version: '1.0.0' }));
    auditor.registerEventContract(makeContract({ eventName: 'evt', version: '2.0.0' }));
    const report = auditor.generateEventAuditReport();
    expect(report.totalEvents).toBe(1);
  });

  it('4: registerEventContract with single subscriber', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'single',
      subscriberDomains: ['only-one'],
    }));
    const report = auditor.generateEventAuditReport();
    expect(report.totalEvents).toBe(1);
  });

  it('5: registerEventContract with empty subscriber list (orphaned)', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'orphan',
      subscriberDomains: [],
    }));
    const report = auditor.generateEventAuditReport();
    expect(report.orphanedEvents).toContain('orphan');
  });

  // ──────────────────────────────────────────────────────────────
  // Integrity validation (tests 6–14)
  // ──────────────────────────────────────────────────────────────

  it('6: validateEventIntegrity returns valid for well-formed contract', () => {
    auditor.registerEventContract(makeContract());
    const result = auditor.validateEventIntegrity('test-event');
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('7: validateEventIntegrity returns invalid for unknown event', () => {
    const result = auditor.validateEventIntegrity('nonexistent');
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('8: validateEventIntegrity flags empty publisher domain', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'bad-pub',
      publisherDomain: '',
    }));
    const result = auditor.validateEventIntegrity('bad-pub');
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('Publisher domain'))).toBe(true);
  });

  it('9: validateEventIntegrity flags no subscribers', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'no-subs',
      subscriberDomains: [],
    }));
    const result = auditor.validateEventIntegrity('no-subs');
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('No subscriber'))).toBe(true);
  });

  it('10: validateEventIntegrity flags empty payload schema', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'empty-schema',
      payloadSchema: [],
    }));
    const result = auditor.validateEventIntegrity('empty-schema');
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('Payload schema'))).toBe(true);
  });

  it('11: validateEventIntegrity flags duplicate subscriber domains', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'dup-subs',
      subscriberDomains: ['a', 'b', 'a'],
    }));
    const result = auditor.validateEventIntegrity('dup-subs');
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('Duplicate subscriber'))).toBe(true);
  });

  it('12: validateEventIntegrity flags publisher as subscriber', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'self-sub',
      publisherDomain: 'core',
      subscriberDomains: ['core', 'other'],
    }));
    const result = auditor.validateEventIntegrity('self-sub');
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.includes('potential event loop'))).toBe(true);
  });

  it('13: validateEventIntegrity with multiple issues returns all', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'multi-issue',
      publisherDomain: '',
      subscriberDomains: [],
      payloadSchema: [],
    }));
    const result = auditor.validateEventIntegrity('multi-issue');
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThanOrEqual(2);
  });

  it('14: validateEventIntegrity passes with valid contract and many subscribers', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'many-subs',
      subscriberDomains: ['a', 'b', 'c', 'd', 'e'],
    }));
    const result = auditor.validateEventIntegrity('many-subs');
    expect(result.valid).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // Orphan detection (tests 15–18)
  // ──────────────────────────────────────────────────────────────

  it('15: detectOrphanedEvents returns empty when all events have subscribers', () => {
    auditor.registerEventContract(makeContract({ subscriberDomains: ['a'] }));
    expect(auditor.detectOrphanedEvents()).toEqual([]);
  });

  it('16: detectOrphanedEvents returns events with no subscribers', () => {
    auditor.registerEventContract(makeContract({ eventName: 'e1', subscriberDomains: ['a'] }));
    auditor.registerEventContract(makeContract({ eventName: 'e2', subscriberDomains: [] }));
    auditor.registerEventContract(makeContract({ eventName: 'e3', subscriberDomains: [] }));
    const orphaned = auditor.detectOrphanedEvents();
    expect(orphaned).toEqual(['e2', 'e3']);
  });

  it('17: detectOrphanedEvents returns empty for empty auditor', () => {
    expect(auditor.detectOrphanedEvents()).toEqual([]);
  });

  it('18: detectOrphanedEvents returns sorted results', () => {
    auditor.registerEventContract(makeContract({ eventName: 'z-evt', subscriberDomains: [] }));
    auditor.registerEventContract(makeContract({ eventName: 'a-evt', subscriberDomains: [] }));
    expect(auditor.detectOrphanedEvents()).toEqual(['a-evt', 'z-evt']);
  });

  // ──────────────────────────────────────────────────────────────
  // Unsubscribed detection (tests 19–22)
  // ──────────────────────────────────────────────────────────────

  it('19: detectUnsubscribedEvents returns empty when all events have publishers', () => {
    auditor.registerEventContract(makeContract({ publisherDomain: 'core' }));
    expect(auditor.detectUnsubscribedEvents()).toEqual([]);
  });

  it('20: detectUnsubscribedEvents returns events with empty publisher', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'e1',
      publisherDomain: 'valid',
    }));
    auditor.registerEventContract(makeContract({
      eventName: 'e2',
      publisherDomain: '',
    }));
    const unsub = auditor.detectUnsubscribedEvents();
    expect(unsub).toEqual(['e2']);
  });

  it('21: detectUnsubscribedEvents returns empty for empty auditor', () => {
    expect(auditor.detectUnsubscribedEvents()).toEqual([]);
  });

  it('22: detectUnsubscribedEvents returns sorted results', () => {
    auditor.registerEventContract(makeContract({ eventName: 'z', publisherDomain: '' }));
    auditor.registerEventContract(makeContract({ eventName: 'a', publisherDomain: '' }));
    expect(auditor.detectUnsubscribedEvents()).toEqual(['a', 'z']);
  });

  // ──────────────────────────────────────────────────────────────
  // Event flow graph (tests 23–27)
  // ──────────────────────────────────────────────────────────────

  it('23: getEventFlowGraph returns empty object for no contracts', () => {
    expect(auditor.getEventFlowGraph()).toEqual({});
  });

  it('24: getEventFlowGraph shows publisher → subscriber edges', () => {
    auditor.registerEventContract(makeContract({
      publisherDomain: 'core',
      subscriberDomains: ['tenant', 'billing'],
    }));
    const graph = auditor.getEventFlowGraph();
    expect(graph['core']).toContain('tenant');
    expect(graph['core']).toContain('billing');
  });

  it('25: getEventFlowGraph aggregates multiple events from same publisher', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'e1',
      publisherDomain: 'core',
      subscriberDomains: ['a'],
    }));
    auditor.registerEventContract(makeContract({
      eventName: 'e2',
      publisherDomain: 'core',
      subscriberDomains: ['b'],
    }));
    const graph = auditor.getEventFlowGraph();
    expect(graph['core']).toContain('a');
    expect(graph['core']).toContain('b');
  });

  it('26: getEventFlowGraph deduplicates subscriber domains', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'e1',
      publisherDomain: 'core',
      subscriberDomains: ['a'],
    }));
    auditor.registerEventContract(makeContract({
      eventName: 'e2',
      publisherDomain: 'core',
      subscriberDomains: ['a'],
    }));
    const graph = auditor.getEventFlowGraph();
    const coreSubs = graph['core'];
    expect(coreSubs.filter((s) => s === 'a')).toHaveLength(1);
  });

  it('27: getEventFlowGraph sorts subscriber domains', () => {
    auditor.registerEventContract(makeContract({
      publisherDomain: 'core',
      subscriberDomains: ['z', 'a', 'm'],
    }));
    const graph = auditor.getEventFlowGraph();
    expect(graph['core']).toEqual(['a', 'm', 'z']);
  });

  // ──────────────────────────────────────────────────────────────
  // Audit report (tests 28–34)
  // ──────────────────────────────────────────────────────────────

  it('28: generateEventAuditReport returns empty report for no contracts', () => {
    const report = auditor.generateEventAuditReport();
    expect(report.totalEvents).toBe(0);
    expect(report.totalContracts).toBe(0);
    expect(report.orphanedEvents).toEqual([]);
    expect(report.unsubscribedEvents).toEqual([]);
    expect(report.integrityIssues).toEqual([]);
  });

  it('29: generateEventAuditReport counts events correctly', () => {
    auditor.registerEventContract(makeContract({ eventName: 'a' }));
    auditor.registerEventContract(makeContract({ eventName: 'b' }));
    auditor.registerEventContract(makeContract({ eventName: 'c' }));
    const report = auditor.generateEventAuditReport();
    expect(report.totalEvents).toBe(3);
    expect(report.totalContracts).toBe(3);
  });

  it('30: generateEventAuditReport includes integrity issues', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'bad',
      payloadSchema: [],
    }));
    const report = auditor.generateEventAuditReport();
    expect(report.integrityIssues.length).toBeGreaterThan(0);
  });

  it('31: generateEventAuditReport includes orphaned events', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'lonely',
      subscriberDomains: [],
    }));
    const report = auditor.generateEventAuditReport();
    expect(report.orphanedEvents).toContain('lonely');
  });

  it('32: generateEventAuditReport includes event flow graph', () => {
    auditor.registerEventContract(makeContract({
      publisherDomain: 'src',
      subscriberDomains: ['dst'],
    }));
    const report = auditor.generateEventAuditReport();
    expect(report.eventFlowGraph['src']).toContain('dst');
  });

  it('33: generateEventAuditReport has valid ISO timestamp', () => {
    const report = auditor.generateEventAuditReport();
    expect(() => new Date(report.timestamp)).not.toThrow();
    expect(new Date(report.timestamp).getTime()).not.toBeNaN();
  });

  it('34: generateEventAuditReport with mixed valid/invalid contracts', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'good',
      publisherDomain: 'core',
      subscriberDomains: ['a', 'b'],
      payloadSchema: ['id', 'data'],
    }));
    auditor.registerEventContract(makeContract({
      eventName: 'orphan',
      subscriberDomains: [],
    }));
    auditor.registerEventContract(makeContract({
      eventName: 'no-pub',
      publisherDomain: '',
    }));
    const report = auditor.generateEventAuditReport();
    expect(report.totalEvents).toBe(3);
    expect(report.orphanedEvents).toContain('orphan');
    expect(report.unsubscribedEvents).toContain('no-pub');
  });

  // ──────────────────────────────────────────────────────────────
  // Edge cases (tests 35–38)
  // ──────────────────────────────────────────────────────────────

  it('35: registerEventContract with many subscriber domains', () => {
    const subs = Array.from({ length: 20 }, (_, i) => `domain-${i}`);
    auditor.registerEventContract(makeContract({
      eventName: 'mega',
      subscriberDomains: subs,
    }));
    const graph = auditor.getEventFlowGraph();
    expect(graph['platform-core']).toHaveLength(20);
  });

  it('36: validateEventIntegrity passes with whitespace-only publisher treated as invalid', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'ws-pub',
      publisherDomain: '   ',
    }));
    const result = auditor.validateEventIntegrity('ws-pub');
    expect(result.valid).toBe(false);
  });

  it('37: getEventFlowGraph with multiple publishers', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'e1',
      publisherDomain: 'core',
      subscriberDomains: ['a'],
    }));
    auditor.registerEventContract(makeContract({
      eventName: 'e2',
      publisherDomain: 'other',
      subscriberDomains: ['b'],
    }));
    const graph = auditor.getEventFlowGraph();
    expect(Object.keys(graph).sort()).toEqual(['core', 'other']);
  });

  it('38: generateEventAuditReport includes all event names in flow graph keys', () => {
    auditor.registerEventContract(makeContract({
      eventName: 'x',
      publisherDomain: 'pub-x',
      subscriberDomains: ['sub-x'],
    }));
    const report = auditor.generateEventAuditReport();
    expect(Object.keys(report.eventFlowGraph)).toContain('pub-x');
  });
});
