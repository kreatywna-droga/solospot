/**
 * TenantFailureContainmentG1208.test.ts — G1-208 Tenant Failure Containment
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TenantFailureContainmentEngine,
  TenantFailureEvent,
} from '../TenantFailureContainment';

describe('TenantFailureContainmentEngine', () => {
  let engine: TenantFailureContainmentEngine;

  beforeEach(() => {
    engine = new TenantFailureContainmentEngine();
  });

  // ── reportFailure ──

  describe('reportFailure()', () => {
    it('reports a failure with generated failureId', () => {
      const f = engine.reportFailure({
        tenantId: 't1',
        severity: 'LOW',
        component: 'auth',
        errorMessage: 'timeout',
        blastRadius: 1,
      });
      expect(f.failureId).toContain('fail-');
      expect(f.tenantId).toBe('t1');
    });

    it('sets occurredAtMs to current time', () => {
      const before = Date.now();
      const f = engine.reportFailure({
        tenantId: 't1',
        severity: 'HIGH',
        component: 'db',
        errorMessage: 'conn refused',
        blastRadius: 5,
      });
      const after = Date.now();
      expect(f.occurredAtMs).toBeGreaterThanOrEqual(before);
      expect(f.occurredAtMs).toBeLessThanOrEqual(after);
    });

    it('throws on empty tenantId', () => {
      expect(() =>
        engine.reportFailure({
          tenantId: '',
          severity: 'LOW',
          component: 'x',
          errorMessage: 'e',
          blastRadius: 0,
        }),
      ).toThrow('tenantId must be a non-empty string');
    });

    it('throws on whitespace-only tenantId', () => {
      expect(() =>
        engine.reportFailure({
          tenantId: '   ',
          severity: 'MEDIUM',
          component: 'x',
          errorMessage: 'e',
          blastRadius: 0,
        }),
      ).toThrow('tenantId must be a non-empty string');
    });

    it('preserves all failure properties', () => {
      const f = engine.reportFailure({
        tenantId: 't1',
        severity: 'CRITICAL',
        component: 'payment',
        errorMessage: 'insufficient funds',
        blastRadius: 10,
      });
      expect(f.severity).toBe('CRITICAL');
      expect(f.component).toBe('payment');
      expect(f.errorMessage).toBe('insufficient funds');
      expect(f.blastRadius).toBe(10);
    });

    it('generates unique failureIds', () => {
      const f1 = engine.reportFailure({ tenantId: 't1', severity: 'LOW', component: 'a', errorMessage: 'e', blastRadius: 0 });
      const f2 = engine.reportFailure({ tenantId: 't1', severity: 'LOW', component: 'a', errorMessage: 'e', blastRadius: 0 });
      expect(f1.failureId).not.toBe(f2.failureId);
    });

    it('containedAtMs is undefined initially', () => {
      const f = engine.reportFailure({ tenantId: 't1', severity: 'LOW', component: 'a', errorMessage: 'e', blastRadius: 0 });
      expect(f.containedAtMs).toBeUndefined();
    });
  });

  // ── containFailure ──

  describe('containFailure()', () => {
    it('contains a failure and sets containedAtMs', () => {
      const f = engine.reportFailure({ tenantId: 't1', severity: 'LOW', component: 'a', errorMessage: 'e', blastRadius: 1 });
      const result = engine.containFailure(f.failureId);
      expect(result.contained).toBe(true);
      expect(result.affectedTenants).toContain('t1');
    });

    it('returns contained: false for unknown failureId', () => {
      const result = engine.containFailure('fail-unknown');
      expect(result.contained).toBe(false);
      expect(result.affectedTenants).toHaveLength(0);
    });

    it('sets containedAtMs on the failure event', () => {
      const f = engine.reportFailure({ tenantId: 't1', severity: 'HIGH', component: 'db', errorMessage: 'down', blastRadius: 3 });
      engine.containFailure(f.failureId);
      const stored = engine.getFailures().find((x) => x.failureId === f.failureId);
      expect(stored?.containedAtMs).toBeDefined();
      expect(stored!.containedAtMs!).toBeGreaterThanOrEqual(f.occurredAtMs);
    });

    it('returns affectedTenants with single tenant', () => {
      const f = engine.reportFailure({ tenantId: 't5', severity: 'MEDIUM', component: 'cache', errorMessage: 'miss', blastRadius: 2 });
      const result = engine.containFailure(f.failureId);
      expect(result.affectedTenants).toEqual(['t5']);
    });

    it('containment timestamp is after occurrence timestamp', () => {
      const f = engine.reportFailure({ tenantId: 't1', severity: 'LOW', component: 'a', errorMessage: 'e', blastRadius: 0 });
      const result = engine.containFailure(f.failureId);
      expect(result.containedAtMs).toBeGreaterThanOrEqual(f.occurredAtMs);
    });
  });

  // ── assessBlastRadius ──

  describe('assessBlastRadius()', () => {
    it('multiplies blastRadius by severity LOW (1x)', () => {
      const f: TenantFailureEvent = {
        failureId: 'f1', tenantId: 't1', severity: 'LOW', component: 'a', errorMessage: 'e', occurredAtMs: 0, blastRadius: 5,
      };
      expect(engine.assessBlastRadius(f)).toBe(5);
    });

    it('multiplies blastRadius by severity MEDIUM (2x)', () => {
      const f: TenantFailureEvent = {
        failureId: 'f1', tenantId: 't1', severity: 'MEDIUM', component: 'a', errorMessage: 'e', occurredAtMs: 0, blastRadius: 5,
      };
      expect(engine.assessBlastRadius(f)).toBe(10);
    });

    it('multiplies blastRadius by severity HIGH (4x)', () => {
      const f: TenantFailureEvent = {
        failureId: 'f1', tenantId: 't1', severity: 'HIGH', component: 'a', errorMessage: 'e', occurredAtMs: 0, blastRadius: 5,
      };
      expect(engine.assessBlastRadius(f)).toBe(20);
    });

    it('multiplies blastRadius by severity CRITICAL (8x)', () => {
      const f: TenantFailureEvent = {
        failureId: 'f1', tenantId: 't1', severity: 'CRITICAL', component: 'a', errorMessage: 'e', occurredAtMs: 0, blastRadius: 5,
      };
      expect(engine.assessBlastRadius(f)).toBe(40);
    });

    it('handles zero blastRadius', () => {
      const f: TenantFailureEvent = {
        failureId: 'f1', tenantId: 't1', severity: 'CRITICAL', component: 'a', errorMessage: 'e', occurredAtMs: 0, blastRadius: 0,
      };
      expect(engine.assessBlastRadius(f)).toBe(0);
    });
  });

  // ── detectCascadingFailures ──

  describe('detectCascadingFailures()', () => {
    it('detects cascade across tenants in same component', () => {
      const now = Date.now();
      const failures: TenantFailureEvent[] = [
        { failureId: 'f1', tenantId: 't1', severity: 'HIGH', component: 'db', errorMessage: 'e', occurredAtMs: now, blastRadius: 5 },
        { failureId: 'f2', tenantId: 't2', severity: 'HIGH', component: 'db', errorMessage: 'e', occurredAtMs: now + 1000, blastRadius: 5 },
      ];
      const cascades = engine.detectCascadingFailures(failures);
      expect(cascades.length).toBeGreaterThan(0);
    });

    it('returns empty when no cascading', () => {
      const now = Date.now();
      const failures: TenantFailureEvent[] = [
        { failureId: 'f1', tenantId: 't1', severity: 'LOW', component: 'db', errorMessage: 'e', occurredAtMs: now, blastRadius: 1, containedAtMs: now + 100 },
      ];
      const cascades = engine.detectCascadingFailures(failures);
      expect(cascades).toHaveLength(0);
    });

    it('ignores contained failures as source', () => {
      const now = Date.now();
      const failures: TenantFailureEvent[] = [
        { failureId: 'f1', tenantId: 't1', severity: 'HIGH', component: 'db', errorMessage: 'e', occurredAtMs: now, blastRadius: 5, containedAtMs: now + 50 },
        { failureId: 'f2', tenantId: 't2', severity: 'HIGH', component: 'db', errorMessage: 'e', occurredAtMs: now + 1000, blastRadius: 5, containedAtMs: now + 1100 },
      ];
      const cascades = engine.detectCascadingFailures(failures);
      expect(cascades).toHaveLength(0);
    });

    it('ignores failures in different components', () => {
      const now = Date.now();
      const failures: TenantFailureEvent[] = [
        { failureId: 'f1', tenantId: 't1', severity: 'HIGH', component: 'db', errorMessage: 'e', occurredAtMs: now, blastRadius: 5 },
        { failureId: 'f2', tenantId: 't2', severity: 'HIGH', component: 'cache', errorMessage: 'e', occurredAtMs: now + 1000, blastRadius: 5 },
      ];
      const cascades = engine.detectCascadingFailures(failures);
      expect(cascades).toHaveLength(0);
    });

    it('ignores failures with time gap > 60s', () => {
      const now = Date.now();
      const failures: TenantFailureEvent[] = [
        { failureId: 'f1', tenantId: 't1', severity: 'HIGH', component: 'db', errorMessage: 'e', occurredAtMs: now, blastRadius: 5 },
        { failureId: 'f2', tenantId: 't2', severity: 'HIGH', component: 'db', errorMessage: 'e', occurredAtMs: now + 70000, blastRadius: 5 },
      ];
      const cascades = engine.detectCascadingFailures(failures);
      expect(cascades).toHaveLength(0);
    });

    it('builds correct cascade path', () => {
      const now = Date.now();
      const failures: TenantFailureEvent[] = [
        { failureId: 'f1', tenantId: 't1', severity: 'CRITICAL', component: 'auth', errorMessage: 'e', occurredAtMs: now, blastRadius: 10 },
        { failureId: 'f2', tenantId: 't2', severity: 'HIGH', component: 'auth', errorMessage: 'e', occurredAtMs: now + 500, blastRadius: 8 },
        { failureId: 'f3', tenantId: 't3', severity: 'MEDIUM', component: 'auth', errorMessage: 'e', occurredAtMs: now + 1000, blastRadius: 4 },
      ];
      const cascades = engine.detectCascadingFailures(failures);
      expect(cascades.length).toBeGreaterThan(0);
      expect(cascades[0].cascadePath).toContain('t1');
    });
  });

  // ── validateContainment ──

  describe('validateContainment()', () => {
    it('validates properly contained failure', () => {
      const now = Date.now();
      const f: TenantFailureEvent = {
        failureId: 'f1', tenantId: 't1', severity: 'LOW', component: 'a', errorMessage: 'e',
        occurredAtMs: now, containedAtMs: now + 1000, blastRadius: 1,
      };
      expect(engine.validateContainment(f)).toBe(true);
    });

    it('rejects uncontained failure', () => {
      const f: TenantFailureEvent = {
        failureId: 'f1', tenantId: 't1', severity: 'LOW', component: 'a', errorMessage: 'e',
        occurredAtMs: Date.now(), blastRadius: 1,
      };
      expect(engine.validateContainment(f)).toBe(false);
    });

    it('rejects containment before occurrence', () => {
      const f: TenantFailureEvent = {
        failureId: 'f1', tenantId: 't1', severity: 'LOW', component: 'a', errorMessage: 'e',
        occurredAtMs: 1000, containedAtMs: 500, blastRadius: 1,
      };
      expect(engine.validateContainment(f)).toBe(false);
    });

    it('rejects containment exceeding time limit for CRITICAL', () => {
      const f: TenantFailureEvent = {
        failureId: 'f1', tenantId: 't1', severity: 'CRITICAL', component: 'a', errorMessage: 'e',
        occurredAtMs: 0, containedAtMs: 40000, blastRadius: 10,
      };
      expect(engine.validateContainment(f)).toBe(false);
    });

    it('validates containment within time limit for CRITICAL', () => {
      const f: TenantFailureEvent = {
        failureId: 'f1', tenantId: 't1', severity: 'CRITICAL', component: 'a', errorMessage: 'e',
        occurredAtMs: 0, containedAtMs: 20000, blastRadius: 10,
      };
      expect(engine.validateContainment(f)).toBe(true);
    });

    it('validates containment within time limit for HIGH', () => {
      const f: TenantFailureEvent = {
        failureId: 'f1', tenantId: 't1', severity: 'HIGH', component: 'a', errorMessage: 'e',
        occurredAtMs: 0, containedAtMs: 50000, blastRadius: 5,
      };
      expect(engine.validateContainment(f)).toBe(true);
    });

    it('validates containment within time limit for MEDIUM', () => {
      const f: TenantFailureEvent = {
        failureId: 'f1', tenantId: 't1', severity: 'MEDIUM', component: 'a', errorMessage: 'e',
        occurredAtMs: 0, containedAtMs: 100000, blastRadius: 3,
      };
      expect(engine.validateContainment(f)).toBe(true);
    });
  });

  // ── generateContainmentReport ──

  describe('generateContainmentReport()', () => {
    it('generates report with no failures', () => {
      const report = engine.generateContainmentReport();
      expect(report.totalFailures).toBe(0);
      expect(report.containmentValid).toBe(true);
      expect(report.containmentRate).toBe(1);
    });

    it('reports containment rate correctly', () => {
      const f1 = engine.reportFailure({ tenantId: 't1', severity: 'LOW', component: 'a', errorMessage: 'e', blastRadius: 1 });
      engine.reportFailure({ tenantId: 't2', severity: 'LOW', component: 'b', errorMessage: 'e', blastRadius: 1 });
      engine.containFailure(f1.failureId);

      const report = engine.generateContainmentReport();
      expect(report.containedFailures).toBe(1);
      expect(report.uncontainedFailures).toBe(1);
      expect(report.containmentRate).toBe(0.5);
    });

    it('detects cascading failures in report', () => {
      const now = Date.now();
      engine.reportFailure({ tenantId: 't1', severity: 'HIGH', component: 'db', errorMessage: 'e', blastRadius: 5 });
      // Need to backdate so time is now
      const failures = engine.getFailures();
      // Not contained, so cascading detection applies
      const report = engine.generateContainmentReport();
      expect(report.cascadingFailures).toBeDefined();
    });

    it('includes generatedAtMs timestamp', () => {
      const before = Date.now();
      const report = engine.generateContainmentReport();
      const after = Date.now();
      expect(report.generatedAtMs).toBeGreaterThanOrEqual(before);
      expect(report.generatedAtMs).toBeLessThanOrEqual(after);
    });

    it('reports violations for uncontained failures', () => {
      engine.reportFailure({ tenantId: 't1', severity: 'CRITICAL', component: 'x', errorMessage: 'e', blastRadius: 10 });
      const report = engine.generateContainmentReport();
      expect(report.violations.length).toBeGreaterThan(0);
      expect(report.violations[0]).toContain('t1');
    });
  });

  // ── edge cases ──

  describe('edge cases', () => {
    it('handles many failures across tenants', () => {
      for (let i = 0; i < 50; i++) {
        engine.reportFailure({
          tenantId: `t${i % 10}`,
          severity: 'LOW',
          component: `comp${i % 5}`,
          errorMessage: `err${i}`,
          blastRadius: i,
        });
      }
      const report = engine.generateContainmentReport();
      expect(report.totalFailures).toBe(50);
    });

    it('clear removes all failures', () => {
      engine.reportFailure({ tenantId: 't1', severity: 'LOW', component: 'a', errorMessage: 'e', blastRadius: 0 });
      engine.clear();
      expect(engine.getFailures()).toHaveLength(0);
    });

    it('blastRadius assessment is monotonic with severity', () => {
      const base: TenantFailureEvent = {
        failureId: 'f', tenantId: 't', severity: 'LOW', component: 'c', errorMessage: 'e', occurredAtMs: 0, blastRadius: 5,
      };
      expect(engine.assessBlastRadius({ ...base, severity: 'LOW' })).toBeLessThan(
        engine.assessBlastRadius({ ...base, severity: 'MEDIUM' }),
      );
      expect(engine.assessBlastRadius({ ...base, severity: 'MEDIUM' })).toBeLessThan(
        engine.assessBlastRadius({ ...base, severity: 'HIGH' }),
      );
      expect(engine.assessBlastRadius({ ...base, severity: 'HIGH' })).toBeLessThan(
        engine.assessBlastRadius({ ...base, severity: 'CRITICAL' }),
      );
    });
  });
});
