/**
 * PlatformContractRecoveryG1189.test.ts — G1-189 Platform Contract Recovery
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PlatformContractRecovery,
  ContractRegistryEntry,
  ContractField,
  ContractInconsistency,
} from '../PlatformContractRecovery';

function field(
  name: string,
  expectedType: string,
  opts?: { actualType?: string; present?: boolean; required?: boolean },
): ContractField {
  return {
    fieldName: name,
    expectedType,
    actualType: opts?.actualType,
    present: opts?.present ?? true,
    required: opts?.required ?? false,
  };
}

function registry(
  name: string,
  fields: ContractField[],
  version = '1.0.0',
): ContractRegistryEntry {
  return { contractName: name, fields, version };
}

function makeInconsistency(
  overrides: Partial<ContractInconsistency> = {},
): ContractInconsistency {
  return {
    inconsistencyId: 'inc-test',
    contractName: 'TestContract',
    severity: 'LOW',
    description: 'test issue',
    detectedAtMs: Date.now(),
    ...overrides,
  };
}

describe('PlatformContractRecovery', () => {
  let recovery: PlatformContractRecovery;

  beforeEach(() => {
    recovery = new PlatformContractRecovery();
  });

  // ── detectInconsistencies ──

  describe('detectInconsistencies()', () => {
    it('returns empty array when no issues', () => {
      const entries = [registry('c1', [field('id', 'string', { present: true })])];
      expect(recovery.detectInconsistencies(entries)).toEqual([]);
    });

    it('detects missing required field', () => {
      const entries = [registry('c1', [field('id', 'string', { present: false, required: true })])];
      const issues = recovery.detectInconsistencies(entries);
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('CRITICAL');
            expect(issues[0].description.toLowerCase()).toContain('required');
    });

    it('detects missing optional field as LOW', () => {
      const entries = [registry('c1', [field('meta', 'object', { present: false, required: false })])];
      const issues = recovery.detectInconsistencies(entries);
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('LOW');
    });

    it('detects type mismatch on required field as HIGH', () => {
      const entries = [
        registry('c1', [field('id', 'string', { actualType: 'number', required: true })]),
      ];
      const issues = recovery.detectInconsistencies(entries);
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('HIGH');
    });

    it('detects type mismatch on optional field as MEDIUM', () => {
      const entries = [
        registry('c1', [field('name', 'string', { actualType: 'number', required: false })]),
      ];
      const issues = recovery.detectInconsistencies(entries);
      expect(issues).toHaveLength(1);
      expect(issues[0].severity).toBe('MEDIUM');
    });

    it('handles multiple contracts', () => {
      const entries = [
        registry('c1', [field('id', 'string', { present: false, required: true })]),
        registry('c2', [field('name', 'string', { present: false, required: false })]),
      ];
      const issues = recovery.detectInconsistencies(entries);
      expect(issues).toHaveLength(2);
    });
  });

  // ── classifyInconsistency ──

  describe('classifyInconsistency()', () => {
    it('keeps CRITICAL severity unchanged', () => {
      const inc = makeInconsistency({ severity: 'CRITICAL' });
      expect(recovery.classifyInconsistency(inc).severity).toBe('CRITICAL');
    });

    it('promotes to HIGH if description mentions "required"', () => {
      const inc = makeInconsistency({ severity: 'MEDIUM', description: 'required field missing' });
      expect(recovery.classifyInconsistency(inc).severity).toBe('HIGH');
    });

    it('keeps LOW severity if not "required"', () => {
      const inc = makeInconsistency({ severity: 'LOW', description: 'optional field missing' });
      expect(recovery.classifyInconsistency(inc).severity).toBe('LOW');
    });
  });

  // ── autoResolve ──

  describe('autoResolve()', () => {
    it('resolves LOW severity inconsistency', () => {
      const inc = makeInconsistency({ severity: 'LOW' });
      const resolved = recovery.autoResolve(inc);
      expect(resolved.resolvedAtMs).toBeDefined();
      expect(resolved.resolutionStrategy).toBe('AUTO_FILL_DEFAULT');
    });

    it('does not resolve HIGH severity inconsistency', () => {
      const inc = makeInconsistency({ severity: 'HIGH' });
      const result = recovery.autoResolve(inc);
      expect(result.resolvedAtMs).toBeUndefined();
    });

    it('does not resolve CRITICAL severity', () => {
      const inc = makeInconsistency({ severity: 'CRITICAL' });
      const result = recovery.autoResolve(inc);
      expect(result.resolvedAtMs).toBeUndefined();
    });
  });

  // ── escalate ──

  describe('escalate()', () => {
    it('escalates an inconsistency', () => {
      const inc = makeInconsistency({ inconsistencyId: 'inc-1' });
      // First add to internal state
      recovery.detectInconsistencies([registry('c1', [field('x', 'string', { present: false, required: false })])]);
      const escalated = recovery.escalate(inc);
      expect(escalated.resolutionStrategy).toBe('ESCALATE');
    });

    it('promotes LOW to MEDIUM when escalated', () => {
      const inc = makeInconsistency({ inconsistencyId: 'inc-1', severity: 'LOW' });
      recovery.detectInconsistencies([registry('c1', [field('x', 'string', { present: false, required: false })])]);
      const escalated = recovery.escalate(inc);
      expect(escalated.severity).toBe('MEDIUM');
    });

    it('keeps HIGH severity when escalated', () => {
      const inc = makeInconsistency({ inconsistencyId: 'inc-1', severity: 'HIGH' });
      recovery.detectInconsistencies([registry('c1', [field('x', 'string', { present: false, required: false })])]);
      const escalated = recovery.escalate(inc);
      expect(escalated.severity).toBe('HIGH');
    });
  });

  // ── getRecoveryStatus ──

  describe('getRecoveryStatus()', () => {
    it('returns zero counts when empty', () => {
      const status = recovery.getRecoveryStatus();
      expect(status.totalInconsistencies).toBe(0);
      expect(status.pending).toBe(0);
    });

    it('counts pending inconsistencies', () => {
      recovery.detectInconsistencies([registry('c1', [field('a', 'string', { present: false, required: true })])]);
      const status = recovery.getRecoveryStatus();
      expect(status.pending).toBe(1);
      expect(status.totalInconsistencies).toBe(1);
    });

    it('counts by severity', () => {
      recovery.detectInconsistencies([
        registry('c1', [
          field('req', 'string', { present: false, required: true }),
          field('opt', 'string', { present: false, required: false }),
        ]),
      ]);
      const status = recovery.getRecoveryStatus();
      expect(status.bySeverity.CRITICAL).toBe(1);
      expect(status.bySeverity.LOW).toBe(1);
    });

    it('tracks auto-resolved count', () => {
      recovery.detectInconsistencies([registry('c1', [field('a', 'string', { present: false, required: false })])]);
      const history = recovery.getInconsistencyHistory();
      recovery.autoResolve(history[0]);
      const status = recovery.getRecoveryStatus();
      expect(status.autoResolved).toBe(1);
      expect(status.pending).toBe(0);
    });

    it('tracks escalated count', () => {
      recovery.detectInconsistencies([registry('c1', [field('a', 'string', { present: false, required: false })])]);
      const history = recovery.getInconsistencyHistory();
      recovery.escalate(history[0]);
      const status = recovery.getRecoveryStatus();
      expect(status.escalated).toBe(1);
    });
  });

  // ── getInconsistencyHistory ──

  describe('getInconsistencyHistory()', () => {
    it('returns empty array initially', () => {
      expect(recovery.getInconsistencyHistory()).toEqual([]);
    });

    it('includes detected inconsistencies', () => {
      recovery.detectInconsistencies([registry('c1', [field('a', 'string', { present: false, required: true })])]);
      const history = recovery.getInconsistencyHistory();
      expect(history).toHaveLength(1);
    });

    it('returns a copy (not the internal array)', () => {
      const history = recovery.getInconsistencyHistory();
      history.push(makeInconsistency());
      expect(recovery.getInconsistencyHistory()).toHaveLength(0);
    });

    it('preserves chronological order', () => {
      recovery.detectInconsistencies([registry('c1', [field('a', 'string', { present: false, required: false })])]);
      recovery.detectInconsistencies([registry('c2', [field('b', 'string', { present: false, required: true })])]);
      const history = recovery.getInconsistencyHistory();
      expect(history[0].contractName).toBe('c1');
      expect(history[1].contractName).toBe('c2');
    });
  });

  // ── generateRecoveryReport ──

  describe('generateRecoveryReport()', () => {
    it('includes generatedAtMs', () => {
      const before = Date.now();
      const report = recovery.generateRecoveryReport();
      expect(report.generatedAtMs).toBeGreaterThanOrEqual(before);
    });

    it('includes summary with correct totals', () => {
      recovery.detectInconsistencies([registry('c1', [field('a', 'string', { present: false, required: true })])]);
      const report = recovery.generateRecoveryReport();
      expect(report.summary.totalInconsistencies).toBe(1);
    });

    it('includes inconsistencies list', () => {
      recovery.detectInconsistencies([registry('c1', [field('a', 'string', { present: false, required: false })])]);
      const report = recovery.generateRecoveryReport();
      expect(report.inconsistencies).toHaveLength(1);
    });

    it('provides recommendations', () => {
      recovery.detectInconsistencies([registry('c1', [field('a', 'string', { present: false, required: true })])]);
      const report = recovery.generateRecoveryReport();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('recommends all resolved when none pending', () => {
      const report = recovery.generateRecoveryReport();
      expect(report.recommendations).toContain('All inconsistencies have been resolved');
    });

    it('includes CRITICAL recommendation when applicable', () => {
      recovery.detectInconsistencies([registry('c1', [field('a', 'string', { present: false, required: true })])]);
      const report = recovery.generateRecoveryReport();
      const criticalRec = report.recommendations.find(r => r.includes('CRITICAL'));
      expect(criticalRec).toBeDefined();
    });
  });
});
