/**
 * TenantIsolationDeepAuditG1201.test.ts — G1-201 Tenant Isolation Deep Audit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TenantIsolationDeepAuditor,
  TenantIsolationRecord,
  DataSample,
} from '../TenantIsolationDeepAudit';

function makeRecord(tenantId: string, overrides?: Partial<TenantIsolationRecord>): TenantIsolationRecord {
  return {
    tenantId,
    isolationLevel: 'STRICT',
    dataResidencyRegion: 'us-east-1',
    encryptionKeyRef: 'key-1',
    auditTrailEnabled: true,
    ...overrides,
  };
}

describe('TenantIsolationDeepAuditor', () => {
  let auditor: TenantIsolationDeepAuditor;

  beforeEach(() => {
    auditor = new TenantIsolationDeepAuditor();
  });

  // ── registerTenantIsolation ──

  describe('registerTenantIsolation()', () => {
    it('registers a tenant isolation record', () => {
      auditor.registerTenantIsolation(makeRecord('t1'));
      expect(auditor.getTenantIsolation('t1')).toBeDefined();
    });

    it('stores correct isolation level', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { isolationLevel: 'SHARED_INFRA' }));
      expect(auditor.getTenantIsolation('t1')?.isolationLevel).toBe('SHARED_INFRA');
    });

    it('throws on empty tenantId', () => {
      expect(() => auditor.registerTenantIsolation(makeRecord(''))).toThrow('tenantId must be a non-empty string');
    });

    it('throws on whitespace-only tenantId', () => {
      expect(() => auditor.registerTenantIsolation(makeRecord('   '))).toThrow('tenantId must be a non-empty string');
    });

    it('overwrites previous record for same tenant', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { isolationLevel: 'SHARED_INFRA' }));
      auditor.registerTenantIsolation(makeRecord('t1', { isolationLevel: 'CUSTOM' }));
      expect(auditor.getTenantIsolation('t1')?.isolationLevel).toBe('CUSTOM');
    });

    it('stores data residency region', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { dataResidencyRegion: 'eu-west-1' }));
      expect(auditor.getTenantIsolation('t1')?.dataResidencyRegion).toBe('eu-west-1');
    });

    it('stores encryption key ref', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { encryptionKeyRef: 'kms-key-42' }));
      expect(auditor.getTenantIsolation('t1')?.encryptionKeyRef).toBe('kms-key-42');
    });

    it('stores audit trail enabled flag', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { auditTrailEnabled: false }));
      expect(auditor.getTenantIsolation('t1')?.auditTrailEnabled).toBe(false);
    });
  });

  // ── auditDataIsolation ──

  describe('auditDataIsolation()', () => {
    it('returns no violations when data samples belong to correct tenants', () => {
      auditor.registerTenantIsolation(makeRecord('t1'));
      auditor.registerTenantIsolation(makeRecord('t2'));
      const samples: DataSample[] = [
        { tenantId: 't1', category: 'users', payload: { id: 1 } },
        { tenantId: 't2', category: 'users', payload: { id: 2 } },
      ];
      const violations = auditor.auditDataIsolation('t1', 't2', samples);
      const leakage = violations.filter(v => v.violationType === 'DATA_LEAKAGE');
      expect(leakage).toHaveLength(0);
    });

    it('returns violation when tenant config is missing', () => {
      auditor.registerTenantIsolation(makeRecord('t1'));
      const violations = auditor.auditDataIsolation('t1', 't2', []);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].violationType).toBe('MISSING_ISOLATION_CONFIG');
    });

    it('detects region mismatch for shared infra tenants', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { isolationLevel: 'SHARED_INFRA', dataResidencyRegion: 'us-east-1' }));
      auditor.registerTenantIsolation(makeRecord('t2', { isolationLevel: 'SHARED_INFRA', dataResidencyRegion: 'eu-west-1' }));
      const violations = auditor.auditDataIsolation('t1', 't2', []);
      const regionViolations = violations.filter(v => v.violationType === 'REGION_MISMATCH');
      expect(regionViolations).toHaveLength(1);
    });

    it('does not flag region mismatch for strict tenants', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { isolationLevel: 'STRICT', dataResidencyRegion: 'us-east-1' }));
      auditor.registerTenantIsolation(makeRecord('t2', { isolationLevel: 'STRICT', dataResidencyRegion: 'eu-west-1' }));
      const violations = auditor.auditDataIsolation('t1', 't2', []);
      const regionViolations = violations.filter(v => v.violationType === 'REGION_MISMATCH');
      expect(regionViolations).toHaveLength(0);
    });

    it('returns no violations for empty data samples', () => {
      auditor.registerTenantIsolation(makeRecord('t1'));
      auditor.registerTenantIsolation(makeRecord('t2'));
      const violations = auditor.auditDataIsolation('t1', 't2', []);
      expect(violations).toHaveLength(0);
    });

    it('returns violation when both tenants missing', () => {
      const violations = auditor.auditDataIsolation('t1', 't2', []);
      expect(violations.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── validateIsolationBoundaries ──

  describe('validateIsolationBoundaries()', () => {
    it('returns no violations for valid STRICT config', () => {
      auditor.registerTenantIsolation(makeRecord('t1'));
      const violations = auditor.validateIsolationBoundaries('t1');
      expect(violations).toHaveLength(0);
    });

    it('detects missing encryption for STRICT tenant', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { encryptionKeyRef: undefined }));
      const violations = auditor.validateIsolationBoundaries('t1');
      expect(violations.some(v => v.violationType === 'MISSING_ENCRYPTION')).toBe(true);
    });

    it('detects disabled audit trail for STRICT tenant', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { auditTrailEnabled: false }));
      const violations = auditor.validateIsolationBoundaries('t1');
      expect(violations.some(v => v.violationType === 'AUDIT_TRAIL_DISABLED')).toBe(true);
    });

    it('detects missing region', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { dataResidencyRegion: '' }));
      const violations = auditor.validateIsolationBoundaries('t1');
      expect(violations.some(v => v.violationType === 'MISSING_REGION')).toBe(true);
    });

    it('returns violation for unregistered tenant', () => {
      const violations = auditor.validateIsolationBoundaries('unknown');
      expect(violations).toHaveLength(1);
      expect(violations[0].violationType).toBe('MISSING_ISOLATION_CONFIG');
    });

    it('does not require encryption for SHARED_INFRA', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { isolationLevel: 'SHARED_INFRA', encryptionKeyRef: undefined }));
      const violations = auditor.validateIsolationBoundaries('t1');
      expect(violations.some(v => v.violationType === 'MISSING_ENCRYPTION')).toBe(false);
    });

    it('does not require audit trail for CUSTOM', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { isolationLevel: 'CUSTOM', auditTrailEnabled: false }));
      const violations = auditor.validateIsolationBoundaries('t1');
      expect(violations.some(v => v.violationType === 'AUDIT_TRAIL_DISABLED')).toBe(false);
    });
  });

  // ── detectBoundaryViolations ──

  describe('detectBoundaryViolations()', () => {
    it('returns empty when all tenants are valid', () => {
      auditor.registerTenantIsolation(makeRecord('t1'));
      auditor.registerTenantIsolation(makeRecord('t2'));
      const violations = auditor.detectBoundaryViolations(['t1', 't2']);
      expect(violations).toHaveLength(0);
    });

    it('detects violations across multiple tenants', () => {
      auditor.registerTenantIsolation(makeRecord('t1'));
      auditor.registerTenantIsolation(makeRecord('t2', { encryptionKeyRef: undefined }));
      const violations = auditor.detectBoundaryViolations(['t1', 't2']);
      expect(violations.length).toBeGreaterThan(0);
    });

    it('includes violations from unregistered tenants', () => {
      const violations = auditor.detectBoundaryViolations(['unknown']);
      expect(violations).toHaveLength(1);
    });

    it('returns empty for empty tenant list', () => {
      expect(auditor.detectBoundaryViolations([])).toHaveLength(0);
    });
  });

  // ── validateEncryptionAtRest ──

  describe('validateEncryptionAtRest()', () => {
    it('returns true for STRICT tenant with key', () => {
      auditor.registerTenantIsolation(makeRecord('t1'));
      expect(auditor.validateEncryptionAtRest('t1')).toBe(true);
    });

    it('returns false for STRICT tenant without key', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { encryptionKeyRef: undefined }));
      expect(auditor.validateEncryptionAtRest('t1')).toBe(false);
    });

    it('returns false for unregistered tenant', () => {
      expect(auditor.validateEncryptionAtRest('unknown')).toBe(false);
    });

    it('returns true for SHARED_INFRA tenant without key', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { isolationLevel: 'SHARED_INFRA', encryptionKeyRef: undefined }));
      expect(auditor.validateEncryptionAtRest('t1')).toBe(true);
    });

    it('returns false for STRICT tenant with empty key', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { encryptionKeyRef: '  ' }));
      expect(auditor.validateEncryptionAtRest('t1')).toBe(false);
    });
  });

  // ── validateNetworkIsolation ──

  describe('validateNetworkIsolation()', () => {
    it('returns true for STRICT tenant', () => {
      auditor.registerTenantIsolation(makeRecord('t1'));
      expect(auditor.validateNetworkIsolation('t1')).toBe(true);
    });

    it('returns false for SHARED_INFRA tenant', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { isolationLevel: 'SHARED_INFRA' }));
      expect(auditor.validateNetworkIsolation('t1')).toBe(false);
    });

    it('returns false for unregistered tenant', () => {
      expect(auditor.validateNetworkIsolation('unknown')).toBe(false);
    });

    it('returns true for CUSTOM tenant', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { isolationLevel: 'CUSTOM' }));
      expect(auditor.validateNetworkIsolation('t1')).toBe(true);
    });
  });

  // ── generateIsolationReport ──

  describe('generateIsolationReport()', () => {
    it('generates a report for all tenants', () => {
      auditor.registerTenantIsolation(makeRecord('t1'));
      auditor.registerTenantIsolation(makeRecord('t2'));
      const report = auditor.generateIsolationReport(['t1', 't2']);
      expect(report.totalTenants).toBe(2);
      expect(report.tenantResults).toHaveLength(2);
    });

    it('reports no violations when all tenants are valid', () => {
      auditor.registerTenantIsolation(makeRecord('t1'));
      const report = auditor.generateIsolationReport(['t1']);
      expect(report.violationsFound).toBe(0);
      expect(report.summary).toContain('pass');
    });

    it('reports violations when tenants have issues', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { encryptionKeyRef: undefined }));
      const report = auditor.generateIsolationReport(['t1']);
      expect(report.violationsFound).toBeGreaterThan(0);
    });

    it('includes generatedAtMs', () => {
      const before = Date.now();
      const report = auditor.generateIsolationReport([]);
      const after = Date.now();
      expect(report.generatedAtMs).toBeGreaterThanOrEqual(before);
      expect(report.generatedAtMs).toBeLessThanOrEqual(after);
    });

    it('marks unregistered tenant as failed', () => {
      const report = auditor.generateIsolationReport(['unknown']);
      expect(report.tenantResults[0].passed).toBe(false);
    });

    it('returns empty report for empty tenant list', () => {
      const report = auditor.generateIsolationReport([]);
      expect(report.totalTenants).toBe(0);
      expect(report.violationsFound).toBe(0);
    });

    it('includes isolation level in tenant results', () => {
      auditor.registerTenantIsolation(makeRecord('t1', { isolationLevel: 'SHARED_INFRA' }));
      const report = auditor.generateIsolationReport(['t1']);
      expect(report.tenantResults[0].isolationLevel).toBe('SHARED_INFRA');
    });
  });
});
