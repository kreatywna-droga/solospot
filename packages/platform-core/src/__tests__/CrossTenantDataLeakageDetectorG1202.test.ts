/**
 * CrossTenantDataLeakageDetectorG1202.test.ts — G1-202 Cross-Tenant Data Leakage Detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CrossTenantDataLeakageDetector,
  TenantDataRecord,
  QueryResult,
} from '../CrossTenantDataLeakageDetector';

function makeRecord(tenantId: string, recordId: string, category = 'users'): TenantDataRecord {
  return { tenantId, recordId, category, payload: {} };
}

function makeQueryResult(tenantId: string, queryId: string): QueryResult {
  return { tenantId, queryId, rows: [] };
}

describe('CrossTenantDataLeakageDetector', () => {
  let detector: CrossTenantDataLeakageDetector;

  beforeEach(() => {
    detector = new CrossTenantDataLeakageDetector();
  });

  // ── scanForLeakage ──

  describe('scanForLeakage()', () => {
    it('returns empty when no cross-tenant data exists', () => {
      const map = new Map<string, TenantDataRecord[]>([
        ['t1', [makeRecord('t1', 'r1'), makeRecord('t1', 'r2')]],
        ['t2', [makeRecord('t2', 'r3'), makeRecord('t2', 'r4')]],
      ]);
      const incidents = detector.scanForLeakage(map);
      expect(incidents).toHaveLength(0);
    });

    it('detects cross-tenant data in tenant datasets', () => {
      const map = new Map<string, TenantDataRecord[]>([
        ['t1', [makeRecord('t1', 'r1'), makeRecord('t2', 'r-leak')]],
        ['t2', [makeRecord('t2', 'r3')]],
      ]);
      const incidents = detector.scanForLeakage(map);
      expect(incidents.length).toBeGreaterThan(0);
    });

    it('returns empty for single tenant', () => {
      const map = new Map<string, TenantDataRecord[]>([
        ['t1', [makeRecord('t1', 'r1')]],
      ]);
      const incidents = detector.scanForLeakage(map);
      expect(incidents).toHaveLength(0);
    });

    it('returns empty for empty map', () => {
      const incidents = detector.scanForLeakage(new Map());
      expect(incidents).toHaveLength(0);
    });

    it('stores detected incidents internally', () => {
      const map = new Map<string, TenantDataRecord[]>([
        ['t1', [makeRecord('t2', 'r-leak')]],
        ['t2', []],
      ]);
      detector.scanForLeakage(map);
      expect(detector.getActiveIncidents().length).toBeGreaterThan(0);
    });
  });

  // ── detectRecordLeakage ──

  describe('detectRecordLeakage()', () => {
    it('returns empty when all records belong to correct tenant', () => {
      const records = [makeRecord('t1', 'r1'), makeRecord('t1', 'r2')];
      const incidents = detector.detectRecordLeakage(records, 't1');
      expect(incidents).toHaveLength(0);
    });

    it('detects records from wrong tenant', () => {
      const records = [makeRecord('t1', 'r1'), makeRecord('t2', 'r-leak')];
      const incidents = detector.detectRecordLeakage(records, 't1');
      expect(incidents.length).toBeGreaterThan(0);
      expect(incidents[0].sourceTenantId).toBe('t2');
      expect(incidents[0].targetTenantId).toBe('t1');
    });

    it('returns empty for empty records', () => {
      const incidents = detector.detectRecordLeakage([], 't1');
      expect(incidents).toHaveLength(0);
    });

    it('sets severity to HIGH', () => {
      const records = [makeRecord('t2', 'r-leak')];
      const incidents = detector.detectRecordLeakage(records, 't1');
      expect(incidents[0].severity).toBe('HIGH');
    });

    it('assigns incident IDs', () => {
      const records = [makeRecord('t2', 'r-leak')];
      const incidents = detector.detectRecordLeakage(records, 't1');
      expect(incidents[0].incidentId).toMatch(/^inc-/);
    });

    it('preserves data category', () => {
      const records = [makeRecord('t2', 'r-leak', 'financial')];
      const incidents = detector.detectRecordLeakage(records, 't1');
      expect(incidents[0].dataCategory).toBe('financial');
    });
  });

  // ── detectQueryLeakage ──

  describe('detectQueryLeakage()', () => {
    it('returns empty when all results match expected tenant', () => {
      const results = [makeQueryResult('t1', 'q1'), makeQueryResult('t1', 'q2')];
      const incidents = detector.detectQueryLeakage(results, 't1');
      expect(incidents).toHaveLength(0);
    });

    it('detects results from wrong tenant', () => {
      const results = [makeQueryResult('t2', 'q-leak')];
      const incidents = detector.detectQueryLeakage(results, 't1');
      expect(incidents).toHaveLength(1);
      expect(incidents[0].sourceTenantId).toBe('t1');
      expect(incidents[0].targetTenantId).toBe('t2');
    });

    it('returns empty for empty results', () => {
      const incidents = detector.detectQueryLeakage([], 't1');
      expect(incidents).toHaveLength(0);
    });

    it('sets severity to CRITICAL', () => {
      const results = [makeQueryResult('t2', 'q-leak')];
      const incidents = detector.detectQueryLeakage(results, 't1');
      expect(incidents[0].severity).toBe('CRITICAL');
    });

    it('sets data category to query_result', () => {
      const results = [makeQueryResult('t2', 'q-leak')];
      const incidents = detector.detectQueryLeakage(results, 't1');
      expect(incidents[0].dataCategory).toBe('query_result');
    });

    it('detects multiple leaked results', () => {
      const results = [makeQueryResult('t2', 'q1'), makeQueryResult('t2', 'q2')];
      const incidents = detector.detectQueryLeakage(results, 't1');
      expect(incidents).toHaveLength(2);
    });
  });

  // ── classifySeverity ──

  describe('classifySeverity()', () => {
    it('returns CRITICAL for credentials', () => {
      const inc = { incidentId: 'i1', sourceTenantId: 't1', targetTenantId: 't2', dataCategory: 'credentials', severity: 'LOW' as const, detectedAtMs: 1000 };
      expect(detector.classifySeverity(inc)).toBe('CRITICAL');
    });

    it('returns CRITICAL for pii', () => {
      const inc = { incidentId: 'i1', sourceTenantId: 't1', targetTenantId: 't2', dataCategory: 'pii', severity: 'LOW' as const, detectedAtMs: 1000 };
      expect(detector.classifySeverity(inc)).toBe('CRITICAL');
    });

    it('returns HIGH for financial', () => {
      const inc = { incidentId: 'i1', sourceTenantId: 't1', targetTenantId: 't2', dataCategory: 'financial', severity: 'LOW' as const, detectedAtMs: 1000 };
      expect(detector.classifySeverity(inc)).toBe('HIGH');
    });

    it('returns CRITICAL for query_result', () => {
      const inc = { incidentId: 'i1', sourceTenantId: 't1', targetTenantId: 't2', dataCategory: 'query_result', severity: 'LOW' as const, detectedAtMs: 1000 };
      expect(detector.classifySeverity(inc)).toBe('CRITICAL');
    });

    it('returns original severity for other categories', () => {
      const inc = { incidentId: 'i1', sourceTenantId: 't1', targetTenantId: 't2', dataCategory: 'general', severity: 'MEDIUM' as const, detectedAtMs: 1000 };
      expect(detector.classifySeverity(inc)).toBe('MEDIUM');
    });
  });

  // ── getActiveIncidents / resolveIncident ──

  describe('getActiveIncidents()', () => {
    it('returns all unresolved incidents', () => {
      detector.detectQueryLeakage([makeQueryResult('t2', 'q1')], 't1');
      expect(detector.getActiveIncidents()).toHaveLength(1);
    });

    it('returns empty when all incidents resolved', () => {
      detector.detectQueryLeakage([makeQueryResult('t2', 'q1')], 't1');
      const active = detector.getActiveIncidents();
      detector.resolveIncident(active[0].incidentId);
      expect(detector.getActiveIncidents()).toHaveLength(0);
    });

    it('returns empty when no incidents', () => {
      expect(detector.getActiveIncidents()).toHaveLength(0);
    });
  });

  describe('resolveIncident()', () => {
    it('resolves an active incident', () => {
      detector.detectQueryLeakage([makeQueryResult('t2', 'q1')], 't1');
      const active = detector.getActiveIncidents();
      expect(detector.resolveIncident(active[0].incidentId)).toBe(true);
    });

    it('returns false for unknown incident', () => {
      expect(detector.resolveIncident('unknown')).toBe(false);
    });

    it('returns false when already resolved', () => {
      detector.detectQueryLeakage([makeQueryResult('t2', 'q1')], 't1');
      const active = detector.getActiveIncidents();
      detector.resolveIncident(active[0].incidentId);
      expect(detector.resolveIncident(active[0].incidentId)).toBe(false);
    });
  });

  // ── generateLeakageReport ──

  describe('generateLeakageReport()', () => {
    it('generates a report with correct counts', () => {
      detector.detectQueryLeakage([makeQueryResult('t2', 'q1')], 't1');
      const report = detector.generateLeakageReport();
      expect(report.totalIncidents).toBe(1);
      expect(report.activeIncidents).toBe(1);
      expect(report.resolvedIncidents).toBe(0);
    });

    it('includes generatedAtMs', () => {
      const before = Date.now();
      const report = detector.generateLeakageReport();
      const after = Date.now();
      expect(report.generatedAtMs).toBeGreaterThanOrEqual(before);
      expect(report.generatedAtMs).toBeLessThanOrEqual(after);
    });

    it('returns empty report when no incidents', () => {
      const report = detector.generateLeakageReport();
      expect(report.totalIncidents).toBe(0);
      expect(report.summary).toContain('No active');
    });

    it('includes incidents array', () => {
      detector.detectQueryLeakage([makeQueryResult('t2', 'q1')], 't1');
      const report = detector.generateLeakageReport();
      expect(report.incidents).toHaveLength(1);
    });

    it('reports resolved incidents', () => {
      detector.detectQueryLeakage([makeQueryResult('t2', 'q1')], 't1');
      const active = detector.getActiveIncidents();
      detector.resolveIncident(active[0].incidentId);
      const report = detector.generateLeakageReport();
      expect(report.resolvedIncidents).toBe(1);
      expect(report.activeIncidents).toBe(0);
    });

    it('summary reflects active incidents', () => {
      detector.detectQueryLeakage([makeQueryResult('t2', 'q1')], 't1');
      const report = detector.generateLeakageReport();
      expect(report.summary).toContain('1 active');
    });
  });
});
