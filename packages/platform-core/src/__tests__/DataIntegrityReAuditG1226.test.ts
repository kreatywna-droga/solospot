/**
 * G1-226: Data Integrity Re-Audit — Test Suite
 *
 * Covers integrity checks, full audit, corrupted/orphaned detection,
 * score calculation, remediation suggestions, and report generation.
 */

import { describe, it, expect } from 'vitest';
import {
  DataIntegrityReAuditor,
  DataIntegrityCheck,
  DataInput,
} from '../DataIntegrityReAudit';

describe('DataIntegrityReAuditor', () => {
  const validUserInput: DataInput = {
    dataType: 'USER_DATA',
    recordCount: 100,
    validRecords: 100,
    corruptedRecords: 0,
    orphanedRecords: 0,
    inconsistentRecords: 0,
  };

  const corruptedOrderInput: DataInput = {
    dataType: 'ORDER_DATA',
    recordCount: 50,
    validRecords: 45,
    corruptedRecords: 5,
    orphanedRecords: 0,
    inconsistentRecords: 0,
  };

  const orphanedProductInput: DataInput = {
    dataType: 'PRODUCT_DATA',
    recordCount: 200,
    validRecords: 190,
    corruptedRecords: 0,
    orphanedRecords: 10,
    inconsistentRecords: 0,
  };

  const inconsistentPaymentInput: DataInput = {
    dataType: 'PAYMENT_DATA',
    recordCount: 75,
    validRecords: 70,
    corruptedRecords: 0,
    orphanedRecords: 0,
    inconsistentRecords: 5,
  };

  const validAuditLogInput: DataInput = {
    dataType: 'AUDIT_LOG',
    recordCount: 500,
    validRecords: 500,
    corruptedRecords: 0,
    orphanedRecords: 0,
    inconsistentRecords: 0,
  };

  it('1: creates an auditor instance', () => {
    const auditor = new DataIntegrityReAuditor();
    expect(auditor).toBeDefined();
  });

  it('2: runIntegrityCheck returns VALID for clean data', () => {
    const auditor = new DataIntegrityReAuditor();
    const check = auditor.runIntegrityCheck('USER_DATA', validUserInput);
    expect(check.integrityStatus).toBe('VALID');
  });

  it('3: runIntegrityCheck returns CORRUPTED for corrupted data', () => {
    const auditor = new DataIntegrityReAuditor();
    const check = auditor.runIntegrityCheck('ORDER_DATA', corruptedOrderInput);
    expect(check.integrityStatus).toBe('CORRUPTED');
  });

  it('4: runIntegrityCheck returns ORPHANED for orphaned records', () => {
    const auditor = new DataIntegrityReAuditor();
    const check = auditor.runIntegrityCheck('PRODUCT_DATA', orphanedProductInput);
    expect(check.integrityStatus).toBe('ORPHANED');
  });

  it('5: runIntegrityCheck returns INCONSISTENT for inconsistent records', () => {
    const auditor = new DataIntegrityReAuditor();
    const check = auditor.runIntegrityCheck('PAYMENT_DATA', inconsistentPaymentInput);
    expect(check.integrityStatus).toBe('INCONSISTENT');
  });

  it('6: runIntegrityCheck generates a checkId', () => {
    const auditor = new DataIntegrityReAuditor();
    const check = auditor.runIntegrityCheck('USER_DATA', validUserInput);
    expect(check.checkId).toBeDefined();
    expect(check.checkId.length).toBeGreaterThan(0);
  });

  it('7: runIntegrityCheck details describe the issue', () => {
    const auditor = new DataIntegrityReAuditor();
    const check = auditor.runIntegrityCheck('ORDER_DATA', corruptedOrderInput);
    expect(check.details).toContain('corrupted');
  });

  it('8: runFullIntegrityAudit checks all data types', () => {
    const auditor = new DataIntegrityReAuditor();
    const inputs: DataInput[] = [validUserInput, corruptedOrderInput, orphanedProductInput];
    const checks = auditor.runFullIntegrityAudit(inputs);
    expect(checks).toHaveLength(3);
  });

  it('9: runFullIntegrityAudit returns correct statuses', () => {
    const auditor = new DataIntegrityReAuditor();
    const inputs: DataInput[] = [validUserInput, corruptedOrderInput, orphanedProductInput];
    const checks = auditor.runFullIntegrityAudit(inputs);
    expect(checks[0].integrityStatus).toBe('VALID');
    expect(checks[1].integrityStatus).toBe('CORRUPTED');
    expect(checks[2].integrityStatus).toBe('ORPHANED');
  });

  it('10: getCorruptedRecords filters only corrupted checks', () => {
    const auditor = new DataIntegrityReAuditor();
    const checks: DataIntegrityCheck[] = [
      { checkId: 'c1', dataType: 'USER_DATA', integrityStatus: 'VALID', details: '' },
      { checkId: 'c2', dataType: 'ORDER_DATA', integrityStatus: 'CORRUPTED', details: '' },
      { checkId: 'c3', dataType: 'PRODUCT_DATA', integrityStatus: 'ORPHANED', details: '' },
    ];
    const corrupted = auditor.getCorruptedRecords(checks);
    expect(corrupted).toHaveLength(1);
    expect(corrupted[0].checkId).toBe('c2');
  });

  it('11: getOrphanedRecords filters only orphaned checks', () => {
    const auditor = new DataIntegrityReAuditor();
    const checks: DataIntegrityCheck[] = [
      { checkId: 'c1', dataType: 'USER_DATA', integrityStatus: 'VALID', details: '' },
      { checkId: 'c2', dataType: 'ORDER_DATA', integrityStatus: 'ORPHANED', details: '' },
      { checkId: 'c3', dataType: 'PRODUCT_DATA', integrityStatus: 'CORRUPTED', details: '' },
    ];
    const orphaned = auditor.getOrphanedRecords(checks);
    expect(orphaned).toHaveLength(1);
    expect(orphaned[0].checkId).toBe('c2');
  });

  it('12: calculateIntegrityScore returns 100 for all valid', () => {
    const auditor = new DataIntegrityReAuditor();
    const checks: DataIntegrityCheck[] = [
      { checkId: 'c1', dataType: 'USER_DATA', integrityStatus: 'VALID', details: '' },
      { checkId: 'c2', dataType: 'ORDER_DATA', integrityStatus: 'VALID', details: '' },
    ];
    expect(auditor.calculateIntegrityScore(checks)).toBe(100);
  });

  it('13: calculateIntegrityScore returns 0 for all corrupted', () => {
    const auditor = new DataIntegrityReAuditor();
    const checks: DataIntegrityCheck[] = [
      { checkId: 'c1', dataType: 'USER_DATA', integrityStatus: 'CORRUPTED', details: '' },
      { checkId: 'c2', dataType: 'ORDER_DATA', integrityStatus: 'CORRUPTED', details: '' },
    ];
    expect(auditor.calculateIntegrityScore(checks)).toBe(0);
  });

  it('14: calculateIntegrityScore handles empty array', () => {
    const auditor = new DataIntegrityReAuditor();
    expect(auditor.calculateIntegrityScore([])).toBe(100);
  });

  it('15: calculateIntegrityScore returns 50 for half valid', () => {
    const auditor = new DataIntegrityReAuditor();
    const checks: DataIntegrityCheck[] = [
      { checkId: 'c1', dataType: 'USER_DATA', integrityStatus: 'VALID', details: '' },
      { checkId: 'c2', dataType: 'ORDER_DATA', integrityStatus: 'CORRUPTED', details: '' },
    ];
    expect(auditor.calculateIntegrityScore(checks)).toBe(50);
  });

  it('16: suggestRemediation returns restore suggestion for corrupted', () => {
    const auditor = new DataIntegrityReAuditor();
    const checks: DataIntegrityCheck[] = [
      { checkId: 'c1', dataType: 'USER_DATA', integrityStatus: 'CORRUPTED', details: '' },
    ];
    const suggestions = auditor.suggestRemediation(checks);
    expect(suggestions.some((s) => s.includes('corrupted'))).toBe(true);
  });

  it('17: suggestRemediation returns reassociate for orphaned', () => {
    const auditor = new DataIntegrityReAuditor();
    const checks: DataIntegrityCheck[] = [
      { checkId: 'c1', dataType: 'PRODUCT_DATA', integrityStatus: 'ORPHANED', details: '' },
    ];
    const suggestions = auditor.suggestRemediation(checks);
    expect(suggestions.some((s) => s.includes('orphaned'))).toBe(true);
  });

  it('18: suggestRemediation returns reconcile for inconsistent', () => {
    const auditor = new DataIntegrityReAuditor();
    const checks: DataIntegrityCheck[] = [
      { checkId: 'c1', dataType: 'PAYMENT_DATA', integrityStatus: 'INCONSISTENT', details: '' },
    ];
    const suggestions = auditor.suggestRemediation(checks);
    expect(suggestions.some((s) => s.includes('inconsistent'))).toBe(true);
  });

  it('19: suggestRemediation returns no-remediation for all valid', () => {
    const auditor = new DataIntegrityReAuditor();
    const checks: DataIntegrityCheck[] = [
      { checkId: 'c1', dataType: 'USER_DATA', integrityStatus: 'VALID', details: '' },
    ];
    const suggestions = auditor.suggestRemediation(checks);
    expect(suggestions.some((s) => s.includes('No remediation'))).toBe(true);
  });

  it('20: generateIntegrityReport returns correct structure', () => {
    const auditor = new DataIntegrityReAuditor();
    const report = auditor.generateIntegrityReport([validUserInput]);
    expect(report).toHaveProperty('totalChecks');
    expect(report).toHaveProperty('validCount');
    expect(report).toHaveProperty('corruptedCount');
    expect(report).toHaveProperty('orphanedCount');
    expect(report).toHaveProperty('inconsistentCount');
    expect(report).toHaveProperty('integrityScore');
    expect(report).toHaveProperty('checks');
    expect(report).toHaveProperty('recommendations');
    expect(report).toHaveProperty('timestamp');
  });

  it('21: generateIntegrityReport timestamp is recent', () => {
    const auditor = new DataIntegrityReAuditor();
    const before = Date.now();
    const report = auditor.generateIntegrityReport([validUserInput]);
    const after = Date.now();
    expect(report.timestamp).toBeGreaterThanOrEqual(before);
    expect(report.timestamp).toBeLessThanOrEqual(after);
  });

  it('22: generateIntegrityReport correct counts for mixed data', () => {
    const auditor = new DataIntegrityReAuditor();
    const report = auditor.generateIntegrityReport([validUserInput, corruptedOrderInput]);
    expect(report.totalChecks).toBe(2);
    expect(report.validCount).toBe(1);
    expect(report.corruptedCount).toBe(1);
  });

  it('23: generateIntegrityReport integrityScore calculated correctly', () => {
    const auditor = new DataIntegrityReAuditor();
    const report = auditor.generateIntegrityReport([validUserInput, corruptedOrderInput]);
    expect(report.integrityScore).toBe(50);
  });

  it('24: getAuditHistory returns history', () => {
    const auditor = new DataIntegrityReAuditor();
    auditor.generateIntegrityReport([validUserInput]);
    const history = auditor.getAuditHistory();
    expect(history).toHaveLength(1);
  });

  it('25: multiple reports accumulate in history', () => {
    const auditor = new DataIntegrityReAuditor();
    auditor.generateIntegrityReport([validUserInput]);
    auditor.generateIntegrityReport([corruptedOrderInput]);
    expect(auditor.getAuditHistory()).toHaveLength(2);
  });

  it('26: getAuditHistory returns a copy', () => {
    const auditor = new DataIntegrityReAuditor();
    auditor.generateIntegrityReport([validUserInput]);
    const history = auditor.getAuditHistory();
    history.pop();
    expect(auditor.getAuditHistory()).toHaveLength(1);
  });

  it('27: runFullIntegrityAudit with empty array returns empty', () => {
    const auditor = new DataIntegrityReAuditor();
    const checks = auditor.runFullIntegrityAudit([]);
    expect(checks).toHaveLength(0);
  });

  it('28: checkId increments across calls', () => {
    const auditor = new DataIntegrityReAuditor();
    const c1 = auditor.runIntegrityCheck('USER_DATA', validUserInput);
    const c2 = auditor.runIntegrityCheck('USER_DATA', validUserInput);
    expect(c1.checkId).not.toBe(c2.checkId);
  });

  it('29: getCorruptedRecords returns empty when none corrupted', () => {
    const auditor = new DataIntegrityReAuditor();
    const checks: DataIntegrityCheck[] = [
      { checkId: 'c1', dataType: 'USER_DATA', integrityStatus: 'VALID', details: '' },
    ];
    expect(auditor.getCorruptedRecords(checks)).toHaveLength(0);
  });

  it('30: getOrphanedRecords returns empty when none orphaned', () => {
    const auditor = new DataIntegrityReAuditor();
    const checks: DataIntegrityCheck[] = [
      { checkId: 'c1', dataType: 'USER_DATA', integrityStatus: 'VALID', details: '' },
    ];
    expect(auditor.getOrphanedRecords(checks)).toHaveLength(0);
  });

  it('31: generateIntegrityReport with all data types covers full spectrum', () => {
    const auditor = new DataIntegrityReAuditor();
    const allInputs: DataInput[] = [
      validUserInput,
      corruptedOrderInput,
      orphanedProductInput,
      inconsistentPaymentInput,
      validAuditLogInput,
    ];
    const report = auditor.generateIntegrityReport(allInputs);
    expect(report.totalChecks).toBe(5);
    expect(report.validCount).toBe(2);
    expect(report.corruptedCount).toBe(1);
    expect(report.orphanedCount).toBe(1);
    expect(report.inconsistentCount).toBe(1);
  });

  it('32: calculateIntegrityScore rounds correctly', () => {
    const auditor = new DataIntegrityReAuditor();
    const checks: DataIntegrityCheck[] = [
      { checkId: 'c1', dataType: 'USER_DATA', integrityStatus: 'VALID', details: '' },
      { checkId: 'c2', dataType: 'ORDER_DATA', integrityStatus: 'VALID', details: '' },
      { checkId: 'c3', dataType: 'PRODUCT_DATA', integrityStatus: 'CORRUPTED', details: '' },
    ];
    expect(auditor.calculateIntegrityScore(checks)).toBe(67);
  });

  it('33: checks array in report contains all check objects', () => {
    const auditor = new DataIntegrityReAuditor();
    const report = auditor.generateIntegrityReport([validUserInput, corruptedOrderInput]);
    for (const check of report.checks) {
      expect(check).toHaveProperty('checkId');
      expect(check).toHaveProperty('dataType');
      expect(check).toHaveProperty('integrityStatus');
      expect(check).toHaveProperty('details');
    }
  });

  it('34: suggestRemediation returns multiple suggestions for mixed issues', () => {
    const auditor = new DataIntegrityReAuditor();
    const checks: DataIntegrityCheck[] = [
      { checkId: 'c1', dataType: 'USER_DATA', integrityStatus: 'CORRUPTED', details: '' },
      { checkId: 'c2', dataType: 'ORDER_DATA', integrityStatus: 'ORPHANED', details: '' },
    ];
    const suggestions = auditor.suggestRemediation(checks);
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
  });

  it('35: runIntegrityCheck for AUDIT_LOG data type', () => {
    const auditor = new DataIntegrityReAuditor();
    const check = auditor.runIntegrityCheck('AUDIT_LOG', validAuditLogInput);
    expect(check.dataType).toBe('AUDIT_LOG');
    expect(check.integrityStatus).toBe('VALID');
  });
});
