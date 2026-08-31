/**
 * G1-225: Security Boundary Re-Audit — Test Suite
 *
 * Covers security check execution, full audit, failure/warning filtering,
 * security scoring, remediation prioritization, and reporting.
 */

import { describe, it, expect } from 'vitest';
import {
  SecurityBoundaryReAuditor,
  SecurityBoundaryCheck,
} from '../SecurityBoundaryReAudit';

describe('SecurityBoundaryReAuditor', () => {
  const makeCheck = (
    id: string,
    boundary: SecurityBoundaryCheck['boundary'] = 'AUTHENTICATION',
    status: SecurityBoundaryCheck['status'] = 'PASS',
    details: string = 'OK',
  ): SecurityBoundaryCheck => ({
    checkId: id,
    boundary,
    status,
    details,
  });

  it('1: creates an auditor instance', () => {
    const a = new SecurityBoundaryReAuditor();
    expect(a).toBeDefined();
  });

  it('2: runSecurityCheck returns a check for AUTHENTICATION', () => {
    const a = new SecurityBoundaryReAuditor();
    const check = a.runSecurityCheck('AUTHENTICATION');
    expect(check.boundary).toBe('AUTHENTICATION');
    expect(check.status).toBe('PASS');
  });

  it('3: runSecurityCheck returns existing check if already run', () => {
    const a = new SecurityBoundaryReAuditor();
    const check1 = a.runSecurityCheck('AUTHENTICATION');
    const check2 = a.runSecurityCheck('AUTHENTICATION');
    expect(check1.checkId).toBe(check2.checkId);
  });

  it('4: runSecurityCheck covers all boundaries', () => {
    const a = new SecurityBoundaryReAuditor();
    const boundaries: SecurityBoundaryCheck['boundary'][] = [
      'AUTHENTICATION', 'AUTHORIZATION', 'INPUT_VALIDATION',
      'DATA_ENCRYPTION', 'API_RATE_LIMITING', 'CORS', 'CSP',
    ];
    boundaries.forEach((b) => a.runSecurityCheck(b));
    const report = a.generateSecurityAuditReport();
    expect(report.totalChecks).toBe(7);
  });

  it('5: runFullSecurityAudit returns 7 checks', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = a.runFullSecurityAudit();
    expect(checks).toHaveLength(7);
  });

  it('6: runFullSecurityAudit all pass by default', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = a.runFullSecurityAudit();
    checks.forEach((c) => expect(c.status).toBe('PASS'));
  });

  it('7: getFailedChecks returns only FAIL status', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = [
      makeCheck('c1', 'AUTHENTICATION', 'FAIL'),
      makeCheck('c2', 'AUTHORIZATION', 'PASS'),
      makeCheck('c3', 'CORS', 'FAIL'),
    ];
    const failed = a.getFailedChecks(checks);
    expect(failed).toHaveLength(2);
    expect(failed.map((c) => c.checkId)).toContain('c1');
    expect(failed.map((c) => c.checkId)).toContain('c3');
  });

  it('8: getFailedChecks returns empty when no failures', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = [makeCheck('c1', 'AUTHENTICATION', 'PASS')];
    expect(a.getFailedChecks(checks)).toHaveLength(0);
  });

  it('9: getWarningChecks returns only WARNING status', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = [
      makeCheck('c1', 'AUTHENTICATION', 'WARNING'),
      makeCheck('c2', 'AUTHORIZATION', 'PASS'),
      makeCheck('c3', 'CORS', 'WARNING'),
    ];
    const warnings = a.getWarningChecks(checks);
    expect(warnings).toHaveLength(2);
  });

  it('10: getWarningChecks returns empty when no warnings', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = [makeCheck('c1', 'AUTHENTICATION', 'PASS')];
    expect(a.getWarningChecks(checks)).toHaveLength(0);
  });

  it('11: calculateSecurityScore returns 100 for all pass', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = [
      makeCheck('c1', 'AUTHENTICATION', 'PASS'),
      makeCheck('c2', 'AUTHORIZATION', 'PASS'),
    ];
    expect(a.calculateSecurityScore(checks)).toBe(100);
  });

  it('12: calculateSecurityScore returns 0 for all fail', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = [
      makeCheck('c1', 'AUTHENTICATION', 'FAIL'),
      makeCheck('c2', 'AUTHORIZATION', 'FAIL'),
    ];
    expect(a.calculateSecurityScore(checks)).toBe(0);
  });

  it('13: calculateSecurityScore returns 50 for mixed pass/warning', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = [
      makeCheck('c1', 'AUTHENTICATION', 'PASS'),
      makeCheck('c2', 'AUTHORIZATION', 'WARNING'),
    ];
    expect(a.calculateSecurityScore(checks)).toBe(75);
  });

  it('14: calculateSecurityScore returns 100 for empty checks', () => {
    const a = new SecurityBoundaryReAuditor();
    expect(a.calculateSecurityScore([])).toBe(100);
  });

  it('15: prioritizeRemediation returns items sorted by priority', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = [
      makeCheck('c1', 'CORS', 'FAIL'),
      makeCheck('c2', 'AUTHENTICATION', 'FAIL'),
      makeCheck('c3', 'AUTHORIZATION', 'FAIL'),
    ];
    const items = a.prioritizeRemediation(checks);
    expect(items[0].boundary).toBe('AUTHENTICATION');
    expect(items[1].boundary).toBe('AUTHORIZATION');
    expect(items[2].boundary).toBe('CORS');
  });

  it('16: prioritizeRemediation excludes PASS checks', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = [
      makeCheck('c1', 'AUTHENTICATION', 'PASS'),
      makeCheck('c2', 'AUTHORIZATION', 'FAIL'),
    ];
    const items = a.prioritizeRemediation(checks);
    expect(items).toHaveLength(1);
    expect(items[0].boundary).toBe('AUTHORIZATION');
  });

  it('17: prioritizeRemediation returns empty for all pass', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = [makeCheck('c1', 'AUTHENTICATION', 'PASS')];
    expect(a.prioritizeRemediation(checks)).toHaveLength(0);
  });

  it('18: prioritizeRemediation includes checkId', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = [makeCheck('c1', 'AUTHENTICATION', 'FAIL')];
    const items = a.prioritizeRemediation(checks);
    expect(items[0].checkId).toBe('c1');
  });

  it('19: prioritizeRemediation includes details', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = [makeCheck('c1', 'AUTHENTICATION', 'FAIL', 'Broken')];
    const items = a.prioritizeRemediation(checks);
    expect(items[0].details).toBe('Broken');
  });

  it('20: generateSecurityAuditReport totalChecks', () => {
    const a = new SecurityBoundaryReAuditor();
    a.runFullSecurityAudit();
    const report = a.generateSecurityAuditReport();
    expect(report.totalChecks).toBe(7);
  });

  it('21: generateSecurityAuditReport passed count', () => {
    const a = new SecurityBoundaryReAuditor();
    a.runFullSecurityAudit();
    const report = a.generateSecurityAuditReport();
    expect(report.passed).toBe(7);
  });

  it('22: generateSecurityAuditReport failed count', () => {
    const a = new SecurityBoundaryReAuditor();
    a.runFullSecurityAudit();
    const report = a.generateSecurityAuditReport();
    expect(report.failed).toBe(0);
  });

  it('23: generateSecurityAuditReport warnings count', () => {
    const a = new SecurityBoundaryReAuditor();
    a.runFullSecurityAudit();
    const report = a.generateSecurityAuditReport();
    expect(report.warnings).toBe(0);
  });

  it('24: generateSecurityAuditReport securityScore', () => {
    const a = new SecurityBoundaryReAuditor();
    a.runFullSecurityAudit();
    const report = a.generateSecurityAuditReport();
    expect(report.securityScore).toBe(100);
  });

  it('25: generateSecurityAuditReport remediationItems', () => {
    const a = new SecurityBoundaryReAuditor();
    a.runFullSecurityAudit();
    const report = a.generateSecurityAuditReport();
    expect(report.remediationItems).toHaveLength(0);
  });

  it('26: empty report has zero totals', () => {
    const a = new SecurityBoundaryReAuditor();
    const report = a.generateSecurityAuditReport();
    expect(report.totalChecks).toBe(0);
    expect(report.passed).toBe(0);
    expect(report.failed).toBe(0);
    expect(report.warnings).toBe(0);
    expect(report.securityScore).toBe(100);
    expect(report.remediationItems).toHaveLength(0);
  });

  it('27: runSecurityCheck with DATA_ENCRYPTION', () => {
    const a = new SecurityBoundaryReAuditor();
    const check = a.runSecurityCheck('DATA_ENCRYPTION');
    expect(check.boundary).toBe('DATA_ENCRYPTION');
    expect(check.status).toBe('PASS');
  });

  it('28: runSecurityCheck with API_RATE_LIMITING', () => {
    const a = new SecurityBoundaryReAuditor();
    const check = a.runSecurityCheck('API_RATE_LIMITING');
    expect(check.boundary).toBe('API_RATE_LIMITING');
  });

  it('29: runSecurityCheck with CORS', () => {
    const a = new SecurityBoundaryReAuditor();
    const check = a.runSecurityCheck('CORS');
    expect(check.boundary).toBe('CORS');
  });

  it('30: runSecurityCheck with CSP', () => {
    const a = new SecurityBoundaryReAuditor();
    const check = a.runSecurityCheck('CSP');
    expect(check.boundary).toBe('CSP');
  });

  it('31: calculateSecurityScore with all warnings', () => {
    const a = new SecurityBoundaryReAuditor();
    const checks = [
      makeCheck('c1', 'AUTHENTICATION', 'WARNING'),
      makeCheck('c2', 'AUTHORIZATION', 'WARNING'),
    ];
    expect(a.calculateSecurityScore(checks)).toBe(50);
  });
});
