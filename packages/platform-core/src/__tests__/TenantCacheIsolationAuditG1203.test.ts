/**
 * TenantCacheIsolationAuditG1203.test.ts — G1-203 Tenant Cache Isolation Audit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TenantCacheIsolationAuditor,
  CacheIsolationRecord,
} from '../TenantCacheIsolationAudit';

function makeConfig(tenantId: string, overrides?: Partial<CacheIsolationRecord>): CacheIsolationRecord {
  return {
    tenantId,
    cacheNamespace: `ns-${tenantId}`,
    isolationStrategy: 'PREFIX',
    ...overrides,
  };
}

describe('TenantCacheIsolationAuditor', () => {
  let auditor: TenantCacheIsolationAuditor;

  beforeEach(() => {
    auditor = new TenantCacheIsolationAuditor();
  });

  // ── registerCacheConfig ──

  describe('registerCacheConfig()', () => {
    it('registers a cache config', () => {
      auditor.registerCacheConfig(makeConfig('t1'));
      expect(auditor.getConfig('t1')).toBeDefined();
    });

    it('stores correct namespace', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: 'my-ns' }));
      expect(auditor.getConfig('t1')?.cacheNamespace).toBe('my-ns');
    });

    it('stores isolation strategy', () => {
      auditor.registerCacheConfig(makeConfig('t1', { isolationStrategy: 'SEGREGATED' }));
      expect(auditor.getConfig('t1')?.isolationStrategy).toBe('SEGREGATED');
    });

    it('throws on empty tenantId', () => {
      expect(() => auditor.registerCacheConfig(makeConfig(''))).toThrow('tenantId must be a non-empty string');
    });

    it('throws on whitespace-only tenantId', () => {
      expect(() => auditor.registerCacheConfig(makeConfig('   '))).toThrow('tenantId must be a non-empty string');
    });

    it('overwrites existing config', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: 'old' }));
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: 'new' }));
      expect(auditor.getConfig('t1')?.cacheNamespace).toBe('new');
    });

    it('returns undefined for unregistered tenant', () => {
      expect(auditor.getConfig('unknown')).toBeUndefined();
    });
  });

  // ── auditCacheIsolation ──

  describe('auditCacheIsolation()', () => {
    it('returns no violations when tenants have different namespaces', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: 'ns-t1' }));
      auditor.registerCacheConfig(makeConfig('t2', { cacheNamespace: 'ns-t2' }));
      const violations = auditor.auditCacheIsolation('t1', 't2', []);
      expect(violations).toHaveLength(0);
    });

    it('detects shared namespace collision', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: 'shared', isolationStrategy: 'SHARED' }));
      auditor.registerCacheConfig(makeConfig('t2', { cacheNamespace: 'shared', isolationStrategy: 'SHARED' }));
      const violations = auditor.auditCacheIsolation('t1', 't2', []);
      expect(violations.some(v => v.violationType === 'SHARED_NAMESPACE_COLLISION')).toBe(true);
    });

    it('detects prefix overlap', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: 'common', isolationStrategy: 'PREFIX' }));
      auditor.registerCacheConfig(makeConfig('t2', { cacheNamespace: 'common', isolationStrategy: 'PREFIX' }));
      const violations = auditor.auditCacheIsolation('t1', 't2', []);
      expect(violations.some(v => v.violationType === 'PREFIX_OVERLAP')).toBe(true);
    });

    it('returns violation for missing config', () => {
      auditor.registerCacheConfig(makeConfig('t1'));
      const violations = auditor.auditCacheIsolation('t1', 't2', []);
      expect(violations).toHaveLength(1);
      expect(violations[0].violationType).toBe('MISSING_CACHE_CONFIG');
    });

    it('returns violations for both missing configs', () => {
      const violations = auditor.auditCacheIsolation('t1', 't2', []);
      expect(violations.length).toBeGreaterThanOrEqual(1);
    });

    it('does not flag segregated isolation', () => {
      auditor.registerCacheConfig(makeConfig('t1', { isolationStrategy: 'SEGREGATED' }));
      auditor.registerCacheConfig(makeConfig('t2', { isolationStrategy: 'SEGREGATED' }));
      const violations = auditor.auditCacheIsolation('t1', 't2', []);
      expect(violations).toHaveLength(0);
    });

    it('does not flag prefix with different namespaces', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: 'a', isolationStrategy: 'PREFIX' }));
      auditor.registerCacheConfig(makeConfig('t2', { cacheNamespace: 'b', isolationStrategy: 'PREFIX' }));
      const violations = auditor.auditCacheIsolation('t1', 't2', []);
      expect(violations).toHaveLength(0);
    });
  });

  // ── validateKeyNamespacing ──

  describe('validateKeyNamespacing()', () => {
    it('returns no violations when keys are properly namespaced', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: 'app1', isolationStrategy: 'PREFIX' }));
      const violations = auditor.validateKeyNamespacing('t1', ['app1:users', 'app1:sessions']);
      expect(violations).toHaveLength(0);
    });

    it('detects unnamespaced keys', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: 'app1', isolationStrategy: 'PREFIX' }));
      const violations = auditor.validateKeyNamespacing('t1', ['other:users']);
      expect(violations.some(v => v.violationType === 'KEY_NOT_NAMESPACED')).toBe(true);
    });

    it('returns violation for missing config', () => {
      const violations = auditor.validateKeyNamespacing('unknown', ['key1']);
      expect(violations).toHaveLength(1);
      expect(violations[0].violationType).toBe('MISSING_CACHE_CONFIG');
    });

    it('returns no violations for SEGREGATED strategy', () => {
      auditor.registerCacheConfig(makeConfig('t1', { isolationStrategy: 'SEGREGATED' }));
      const violations = auditor.validateKeyNamespacing('t1', ['any-key']);
      expect(violations).toHaveLength(0);
    });

    it('returns no violations for empty keys', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: 'app1', isolationStrategy: 'PREFIX' }));
      const violations = auditor.validateKeyNamespacing('t1', []);
      expect(violations).toHaveLength(0);
    });

    it('validates key starts with namespace prefix', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: 'myns', isolationStrategy: 'PREFIX' }));
      const violations = auditor.validateKeyNamespacing('t1', ['myns:data']);
      expect(violations).toHaveLength(0);
    });
  });

  // ── detectCacheOverlap ──

  describe('detectCacheOverlap()', () => {
    it('returns empty when no overlapping keys', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: 'ns1' }));
      auditor.registerCacheConfig(makeConfig('t2', { cacheNamespace: 'ns2' }));
      const overlaps = auditor.detectCacheOverlap(['t1', 't2'], ['ns1:key1', 'ns2:key2']);
      expect(overlaps).toHaveLength(0);
    });

    it('detects overlapping keys with same namespace', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: 'shared' }));
      auditor.registerCacheConfig(makeConfig('t2', { cacheNamespace: 'shared' }));
      const overlaps = auditor.detectCacheOverlap(['t1', 't2'], ['shared:key1']);
      expect(overlaps).toHaveLength(1);
      expect(overlaps[0].tenantIds).toContain('t1');
      expect(overlaps[0].tenantIds).toContain('t2');
    });

    it('returns empty for empty keys', () => {
      auditor.registerCacheConfig(makeConfig('t1'));
      const overlaps = auditor.detectCacheOverlap(['t1'], []);
      expect(overlaps).toHaveLength(0);
    });

    it('returns empty for empty tenants', () => {
      const overlaps = auditor.detectCacheOverlap([], ['key1']);
      expect(overlaps).toHaveLength(0);
    });

    it('returns empty when no config matches', () => {
      const overlaps = auditor.detectCacheOverlap(['t1'], ['unknown:key1']);
      expect(overlaps).toHaveLength(0);
    });
  });

  // ── generateCacheIsolationReport ──

  describe('generateCacheIsolationReport()', () => {
    it('generates a report with correct tenant count', () => {
      auditor.registerCacheConfig(makeConfig('t1'));
      auditor.registerCacheConfig(makeConfig('t2'));
      const report = auditor.generateCacheIsolationReport();
      expect(report.totalTenants).toBe(2);
    });

    it('reports no violations for valid configs', () => {
      auditor.registerCacheConfig(makeConfig('t1'));
      const report = auditor.generateCacheIsolationReport();
      expect(report.violationsFound).toBe(0);
      expect(report.summary).toContain('pass');
    });

    it('reports violation for empty namespace', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: '' }));
      const report = auditor.generateCacheIsolationReport();
      expect(report.violationsFound).toBeGreaterThan(0);
    });

    it('includes generatedAtMs', () => {
      const before = Date.now();
      const report = auditor.generateCacheIsolationReport();
      const after = Date.now();
      expect(report.generatedAtMs).toBeGreaterThanOrEqual(before);
      expect(report.generatedAtMs).toBeLessThanOrEqual(after);
    });

    it('returns empty report for no tenants', () => {
      const report = auditor.generateCacheIsolationReport();
      expect(report.totalTenants).toBe(0);
      expect(report.violationsFound).toBe(0);
    });

    it('reports violations for whitespace namespace', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: '  ' }));
      const report = auditor.generateCacheIsolationReport();
      expect(report.violationsFound).toBeGreaterThan(0);
    });

    it('includes violations array in report', () => {
      auditor.registerCacheConfig(makeConfig('t1', { cacheNamespace: '' }));
      const report = auditor.generateCacheIsolationReport();
      expect(report.violations.length).toBeGreaterThan(0);
    });
  });
});
