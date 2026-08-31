/**
 * TenantContextPropagationAuditorG1187.test.ts — G1-187 Tenant Context Propagation Audit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TenantContextPropagationAuditor,
  TenantContext,
  ContextChainLink,
} from '../TenantContextPropagationAuditor';

function makeContext(
  tenantId: string,
  overrides?: Partial<TenantContext>,
): TenantContext {
  return {
    tenantId,
    roles: [],
    permissions: [],
    requestTimestampMs: 1000,
    ...overrides,
  };
}

describe('TenantContextPropagationAuditor', () => {
  let auditor: TenantContextPropagationAuditor;

  beforeEach(() => {
    auditor = new TenantContextPropagationAuditor();
  });

  // ── createContext ──

  describe('createContext()', () => {
    it('creates a context with the given tenantId', () => {
      const ctx = auditor.createContext('tenant-1');
      expect(ctx.tenantId).toBe('tenant-1');
    });

    it('sets default empty arrays for roles and permissions', () => {
      const ctx = auditor.createContext('tenant-1');
      expect(ctx.roles).toEqual([]);
      expect(ctx.permissions).toEqual([]);
    });

    it('accepts optional roles and permissions', () => {
      const ctx = auditor.createContext('tenant-1', {
        roles: ['admin'],
        permissions: ['read', 'write'],
      });
      expect(ctx.roles).toEqual(['admin']);
      expect(ctx.permissions).toEqual(['read', 'write']);
    });

    it('trims whitespace from tenantId', () => {
      const ctx = auditor.createContext('  tenant-1  ');
      expect(ctx.tenantId).toBe('tenant-1');
    });

    it('throws on empty tenantId', () => {
      expect(() => auditor.createContext('')).toThrow('tenantId must be a non-empty string');
    });

    it('throws on whitespace-only tenantId', () => {
      expect(() => auditor.createContext('   ')).toThrow('tenantId must be a non-empty string');
    });

    it('sets requestTimestampMs to current time by default', () => {
      const before = Date.now();
      const ctx = auditor.createContext('t1');
      const after = Date.now();
      expect(ctx.requestTimestampMs).toBeGreaterThanOrEqual(before);
      expect(ctx.requestTimestampMs).toBeLessThanOrEqual(after);
    });

    it('preserves userId when provided', () => {
      const ctx = auditor.createContext('t1', { userId: 'u-42' });
      expect(ctx.userId).toBe('u-42');
    });

    it('preserves sessionId when provided', () => {
      const ctx = auditor.createContext('t1', { sessionId: 'sess-99' });
      expect(ctx.sessionId).toBe('sess-99');
    });
  });

  // ── validateContext ──

  describe('validateContext()', () => {
    it('returns true for a valid context', () => {
      const ctx = auditor.createContext('tenant-1');
      expect(auditor.validateContext(ctx)).toBe(true);
    });

    it('returns false for null', () => {
      expect(auditor.validateContext(null as any)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(auditor.validateContext(undefined as any)).toBe(false);
    });

    it('returns false for empty tenantId', () => {
      expect(auditor.validateContext({ tenantId: '', requestTimestampMs: 0, roles: [], permissions: [] })).toBe(false);
    });

    it('returns false for negative timestamp', () => {
      expect(auditor.validateContext({ tenantId: 't1', requestTimestampMs: -1, roles: [], permissions: [] })).toBe(false);
    });

    it('returns false for NaN timestamp', () => {
      expect(auditor.validateContext({ tenantId: 't1', requestTimestampMs: NaN, roles: [], permissions: [] })).toBe(false);
    });

    it('returns false for Infinity timestamp', () => {
      expect(auditor.validateContext({ tenantId: 't1', requestTimestampMs: Infinity, roles: [], permissions: [] })).toBe(false);
    });
  });

  // ── propagateContext ──

  describe('propagateContext()', () => {
    it('creates a child context with the same tenantId', () => {
      const parent = auditor.createContext('tenant-1');
      const child = auditor.propagateContext(parent);
      expect(child.tenantId).toBe('tenant-1');
    });

    it('inherits roles from parent by default', () => {
      const parent = auditor.createContext('t1', { roles: ['editor'] });
      const child = auditor.propagateContext(parent);
      expect(child.roles).toEqual(['editor']);
    });

    it('overrides roles when specified in childOptions', () => {
      const parent = auditor.createContext('t1', { roles: ['editor'] });
      const child = auditor.propagateContext(parent, { roles: ['admin'] });
      expect(child.roles).toEqual(['admin']);
    });

    it('inherits permissions from parent', () => {
      const parent = auditor.createContext('t1', { permissions: ['read'] });
      const child = auditor.propagateContext(parent);
      expect(child.permissions).toEqual(['read']);
    });

    it('throws on invalid parent context', () => {
      expect(() => auditor.propagateContext(null as any)).toThrow('Invalid parent context');
    });

    it('sets parentId to parent sessionId', () => {
      const parent = auditor.createContext('t1', { sessionId: 's-1' });
      const child = auditor.propagateContext(parent);
      expect(child.parentId).toBe('s-1');
    });
  });

  // ── auditContextChain ──

  describe('auditContextChain()', () => {
    it('returns VALID for empty chain', () => {
      const result = auditor.auditContextChain([]);
      expect(result.status).toBe('VALID');
    });

    it('returns VALID when all contexts share the same tenantId', () => {
      const chain: ContextChainLink[] = [
        { context: makeContext('t1'), depth: 0 },
        { context: makeContext('t1'), depth: 1 },
        { context: makeContext('t1'), depth: 2 },
      ];
      const result = auditor.auditContextChain(chain);
      expect(result.status).toBe('VALID');
      expect(result.mismatchedIndices).toEqual([]);
    });

    it('returns LEAKAGE_DETECTED when tenantIds differ', () => {
      const chain: ContextChainLink[] = [
        { context: makeContext('t1'), depth: 0 },
        { context: makeContext('t2'), depth: 1 },
      ];
      const result = auditor.auditContextChain(chain);
      expect(result.status).toBe('LEAKAGE_DETECTED');
      expect(result.mismatchedIndices).toEqual([1]);
    });

    it('detects multiple mismatches', () => {
      const chain: ContextChainLink[] = [
        { context: makeContext('t1'), depth: 0 },
        { context: makeContext('t2'), depth: 1 },
        { context: makeContext('t3'), depth: 2 },
      ];
      const result = auditor.auditContextChain(chain);
      expect(result.mismatchedIndices).toEqual([1, 2]);
    });

    it('returns VALID for a single-element chain', () => {
      const chain: ContextChainLink[] = [
        { context: makeContext('t1'), depth: 0 },
      ];
      const result = auditor.auditContextChain(chain);
      expect(result.status).toBe('VALID');
    });
  });

  // ── detectContextLeakage ──

  describe('detectContextLeakage()', () => {
    it('returns empty array when no leakage', () => {
      const contexts = [makeContext('t1'), makeContext('t1')];
      expect(auditor.detectContextLeakage(contexts)).toEqual([]);
    });

    it('detects leakage between two different tenants', () => {
      const contexts = [makeContext('t1'), makeContext('t2')];
      const records = auditor.detectContextLeakage(contexts);
      expect(records).toHaveLength(1);
      expect(records[0].reason).toContain('t1');
      expect(records[0].reason).toContain('t2');
    });

    it('detects leakage in a group of contexts', () => {
      const contexts = [makeContext('t1'), makeContext('t1'), makeContext('t2'), makeContext('t3')];
      const records = auditor.detectContextLeakage(contexts);
      expect(records.length).toBeGreaterThanOrEqual(2);
    });

    it('returns empty for single context', () => {
      expect(auditor.detectContextLeakage([makeContext('t1')])).toEqual([]);
    });

    it('returns empty for empty array', () => {
      expect(auditor.detectContextLeakage([])).toEqual([]);
    });
  });

  // ── getContextFingerprint ──

  describe('getContextFingerprint()', () => {
    it('returns a fingerprint string', () => {
      const ctx = auditor.createContext('t1');
      const fp = auditor.getContextFingerprint(ctx);
      expect(fp).toMatch(/^fp-[0-9a-f]+$/);
    });

    it('returns the same fingerprint for identical contexts', () => {
      const fp1 = auditor.getContextFingerprint(makeContext('t1', { requestTimestampMs: 100 }));
      const fp2 = auditor.getContextFingerprint(makeContext('t1', { requestTimestampMs: 100 }));
      expect(fp1).toBe(fp2);
    });

    it('returns different fingerprints for different tenantIds', () => {
      const fp1 = auditor.getContextFingerprint(makeContext('t1'));
      const fp2 = auditor.getContextFingerprint(makeContext('t2'));
      expect(fp1).not.toBe(fp2);
    });

    it('returns different fingerprints for different timestamps', () => {
      const fp1 = auditor.getContextFingerprint(makeContext('t1', { requestTimestampMs: 100 }));
      const fp2 = auditor.getContextFingerprint(makeContext('t1', { requestTimestampMs: 200 }));
      expect(fp1).not.toBe(fp2);
    });
  });

  // ── generatePropagationReport ──

  describe('generatePropagationReport()', () => {
    it('generates a report with correct totalContexts', () => {
      const contexts = [makeContext('t1'), makeContext('t2')];
      const report = auditor.generatePropagationReport(contexts);
      expect(report.totalContexts).toBe(2);
    });

    it('reports leakageDetected as false when all contexts share tenantId', () => {
      const contexts = [makeContext('t1'), makeContext('t1')];
      const report = auditor.generatePropagationReport(contexts);
      expect(report.leakageDetected).toBe(false);
      expect(report.leakageRecords).toHaveLength(0);
    });

    it('reports leakageDetected as true when tenants differ', () => {
      const contexts = [makeContext('t1'), makeContext('t2')];
      const report = auditor.generatePropagationReport(contexts);
      expect(report.leakageDetected).toBe(true);
      expect(report.leakageRecords.length).toBeGreaterThan(0);
    });

    it('lists unique tenantIds', () => {
      const contexts = [makeContext('t1'), makeContext('t1'), makeContext('t2')];
      const report = auditor.generatePropagationReport(contexts);
      expect(report.uniqueTenantIds).toEqual(expect.arrayContaining(['t1', 't2']));
      expect(report.uniqueTenantIds).toHaveLength(2);
    });

    it('includes generatedAtMs timestamp', () => {
      const before = Date.now();
      const report = auditor.generatePropagationReport([makeContext('t1')]);
      const after = Date.now();
      expect(report.generatedAtMs).toBeGreaterThanOrEqual(before);
      expect(report.generatedAtMs).toBeLessThanOrEqual(after);
    });

    it('provides a summary string', () => {
      const report = auditor.generatePropagationReport([makeContext('t1')]);
      expect(typeof report.summary).toBe('string');
      expect(report.summary.length).toBeGreaterThan(0);
    });
  });
});
