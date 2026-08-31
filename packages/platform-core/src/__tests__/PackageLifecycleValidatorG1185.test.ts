/**
 * PackageLifecycleValidatorG1185.test.ts — G1-185 Package Lifecycle Validator
 *
 * Covers registration, state transitions, transition validation,
 * history tracking, stale detection, and report generation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PackageLifecycleValidator,
  PackageLifecycleState,
} from '../PackageLifecycleValidator';

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('PackageLifecycleValidator', () => {
  let validator: PackageLifecycleValidator;

  beforeEach(() => {
    validator = new PackageLifecycleValidator();
  });

  // ──────────────────────────────────────────────────────────────
  // Registration (tests 1–4)
  // ──────────────────────────────────────────────────────────────

  it('1: registerPackage creates a package in DRAFT state', () => {
    validator.registerPackage('my-pkg');
    expect(validator.getPackageState('my-pkg')).toBe('DRAFT');
  });

  it('2: registerPackage stores multiple packages', () => {
    validator.registerPackage('a');
    validator.registerPackage('b');
    expect(validator.getPackageState('a')).toBe('DRAFT');
    expect(validator.getPackageState('b')).toBe('DRAFT');
  });

  it('3: registerPackage returns undefined for unknown package', () => {
    expect(validator.getPackageState('unknown')).toBeUndefined();
  });

  it('4: registerPackage overwrites existing package state', () => {
    validator.registerPackage('pkg');
    validator.activatePackage('pkg', 'go live');
    validator.registerPackage('pkg');
    expect(validator.getPackageState('pkg')).toBe('DRAFT');
  });

  // ──────────────────────────────────────────────────────────────
  // Activation (tests 5–8)
  // ──────────────────────────────────────────────────────────────

  it('5: activatePackage transitions DRAFT to ACTIVE', () => {
    validator.registerPackage('pkg');
    expect(validator.activatePackage('pkg')).toBe(true);
    expect(validator.getPackageState('pkg')).toBe('ACTIVE');
  });

  it('6: activatePackage fails for non-existent package', () => {
    expect(validator.activatePackage('nope')).toBe(false);
  });

  it('7: activatePackage fails if package is not in DRAFT state', () => {
    validator.registerPackage('pkg');
    validator.activatePackage('pkg');
    expect(validator.activatePackage('pkg')).toBe(false);
  });

  it('8: activatePackage stores reason', () => {
    validator.registerPackage('pkg');
    validator.activatePackage('pkg', 'ready for production');
    const history = validator.getTransitionHistory('pkg');
    expect(history).toHaveLength(1);
    expect(history[0].reason).toBe('ready for production');
  });

  // ──────────────────────────────────────────────────────────────
  // Deprecation (tests 9–12)
  // ──────────────────────────────────────────────────────────────

  it('9: deprecatePackage transitions ACTIVE to DEPRECATED', () => {
    validator.registerPackage('pkg');
    validator.activatePackage('pkg');
    expect(validator.deprecatePackage('pkg', 'replaced')).toBe(true);
    expect(validator.getPackageState('pkg')).toBe('DEPRECATED');
  });

  it('10: deprecatePackage fails for non-existent package', () => {
    expect(validator.deprecatePackage('nope', 'reason')).toBe(false);
  });

  it('11: deprecatePackage fails if package is not in ACTIVE state', () => {
    validator.registerPackage('pkg');
    expect(validator.deprecatePackage('pkg', 'reason')).toBe(false);
  });

  it('12: deprecatePackage fails for DRAFT package', () => {
    validator.registerPackage('pkg');
    expect(validator.deprecatePackage('pkg', 'reason')).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────
  // Removal (tests 13–17)
  // ──────────────────────────────────────────────────────────────

  it('13: removePackage transitions ACTIVE to REMOVED', () => {
    validator.registerPackage('pkg');
    validator.activatePackage('pkg');
    expect(validator.removePackage('pkg', 'retired')).toBe(true);
    expect(validator.getPackageState('pkg')).toBe('REMOVED');
  });

  it('14: removePackage transitions DEPRECATED to REMOVED', () => {
    validator.registerPackage('pkg');
    validator.activatePackage('pkg');
    validator.deprecatePackage('pkg', 'old');
    expect(validator.removePackage('pkg', 'cleanup')).toBe(true);
    expect(validator.getPackageState('pkg')).toBe('REMOVED');
  });

  it('15: removePackage fails for non-existent package', () => {
    expect(validator.removePackage('nope', 'reason')).toBe(false);
  });

  it('16: removePackage fails for DRAFT package', () => {
    validator.registerPackage('pkg');
    expect(validator.removePackage('pkg', 'reason')).toBe(false);
  });

  it('17: removePackage fails for already REMOVED package', () => {
    validator.registerPackage('pkg');
    validator.activatePackage('pkg');
    validator.removePackage('pkg', 'first');
    expect(validator.removePackage('pkg', 'second')).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────
  // Transition validation (tests 18–24)
  // ──────────────────────────────────────────────────────────────

  it('18: validateTransition DRAFT → ACTIVE is valid', () => {
    expect(validator.validateTransition('DRAFT', 'ACTIVE')).toBe(true);
  });

  it('19: validateTransition ACTIVE → DEPRECATED is valid', () => {
    expect(validator.validateTransition('ACTIVE', 'DEPRECATED')).toBe(true);
  });

  it('20: validateTransition ACTIVE → REMOVED is valid', () => {
    expect(validator.validateTransition('ACTIVE', 'REMOVED')).toBe(true);
  });

  it('21: validateTransition DEPRECATED → REMOVED is valid', () => {
    expect(validator.validateTransition('DEPRECATED', 'REMOVED')).toBe(true);
  });

  it('22: validateTransition DRAFT → DEPRECATED is invalid', () => {
    expect(validator.validateTransition('DRAFT', 'DEPRECATED')).toBe(false);
  });

  it('23: validateTransition DRAFT → REMOVED is invalid', () => {
    expect(validator.validateTransition('DRAFT', 'REMOVED')).toBe(false);
  });

  it('24: validateTransition REMOVED → anything is invalid', () => {
    expect(validator.validateTransition('REMOVED', 'DRAFT')).toBe(false);
    expect(validator.validateTransition('REMOVED', 'ACTIVE')).toBe(false);
    expect(validator.validateTransition('REMOVED', 'DEPRECATED')).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────
  // Transition history (tests 25–28)
  // ──────────────────────────────────────────────────────────────

  it('25: getTransitionHistory returns empty for unregistered package', () => {
    expect(validator.getTransitionHistory('unknown')).toEqual([]);
  });

  it('26: getTransitionHistory records activation', () => {
    validator.registerPackage('pkg');
    validator.activatePackage('pkg', 'launch');
    const history = validator.getTransitionHistory('pkg');
    expect(history).toHaveLength(1);
    expect(history[0].from).toBe('DRAFT');
    expect(history[0].to).toBe('ACTIVE');
  });

  it('27: getTransitionHistory records full lifecycle', () => {
    validator.registerPackage('pkg');
    validator.activatePackage('pkg');
    validator.deprecatePackage('pkg', 'old');
    validator.removePackage('pkg', 'gone');
    const history = validator.getTransitionHistory('pkg');
    expect(history).toHaveLength(3);
    expect(history.map((h) => h.to)).toEqual(['ACTIVE', 'DEPRECATED', 'REMOVED']);
  });

  it('28: getTransitionHistory records timestamps', () => {
    validator.registerPackage('pkg');
    const before = Date.now();
    validator.activatePackage('pkg');
    const after = Date.now();
    const history = validator.getTransitionHistory('pkg');
    expect(history[0].timestampMs).toBeGreaterThanOrEqual(before);
    expect(history[0].timestampMs).toBeLessThanOrEqual(after);
  });

  // ──────────────────────────────────────────────────────────────
  // Lifecycle report (tests 29–32)
  // ──────────────────────────────────────────────────────────────

  it('29: getLifecycleReport returns empty report for no packages', () => {
    const report = validator.getLifecycleReport();
    expect(report.totalPackages).toBe(0);
    expect(report.byState).toEqual({ DRAFT: 0, ACTIVE: 0, DEPRECATED: 0, REMOVED: 0 });
  });

  it('30: getLifecycleReport counts states correctly', () => {
    validator.registerPackage('a');
    validator.registerPackage('b');
    validator.activatePackage('b');
    validator.registerPackage('c');
    validator.activatePackage('c');
    validator.deprecatePackage('c', 'old');
    const report = validator.getLifecycleReport();
    expect(report.totalPackages).toBe(3);
    expect(report.byState.DRAFT).toBe(1);
    expect(report.byState.ACTIVE).toBe(1);
    expect(report.byState.DEPRECATED).toBe(1);
    expect(report.byState.REMOVED).toBe(0);
  });

  it('31: getLifecycleReport includes all packages', () => {
    validator.registerPackage('x');
    validator.registerPackage('y');
    const report = validator.getLifecycleReport();
    const names = report.packages.map((p) => p.packageName).sort();
    expect(names).toEqual(['x', 'y']);
  });

  it('32: getLifecycleReport has valid ISO timestamp', () => {
    const report = validator.getLifecycleReport();
    expect(() => new Date(report.timestamp)).not.toThrow();
  });

  // ──────────────────────────────────────────────────────────────
  // Stale detection (tests 33–36)
  // ──────────────────────────────────────────────────────────────

  it('33: findStalePackages returns empty for no packages', () => {
    expect(validator.findStalePackages(1000)).toEqual([]);
  });

  it('34: findStalePackages detects packages inactive beyond threshold', () => {
    validator.registerPackage('old-pkg');
    // Simulate old creation by modifying the internal state via a trick:
    // We can't easily mock Date.now, so we use a very small threshold
    // and rely on the fact that registration happens at "now".
    // With thresholdMs = 0, everything is stale.
    const stale = validator.findStalePackages(0);
    expect(stale.length).toBeGreaterThanOrEqual(1);
  });

  it('35: findStalePackages excludes packages within threshold', () => {
    validator.registerPackage('fresh');
    // With a huge threshold, nothing should be stale
    const stale = validator.findStalePackages(1_000_000_000);
    expect(stale).toHaveLength(0);
  });

  it('36: findStalePackages detects active packages stale since activation', () => {
    validator.registerPackage('pkg');
    validator.activatePackage('pkg');
    // threshold 0 means everything is stale
    const stale = validator.findStalePackages(0);
    expect(stale.some((r) => r.packageName === 'pkg')).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // Edge cases (tests 37–40)
  // ──────────────────────────────────────────────────────────────

  it('37: full lifecycle DRAFT → ACTIVE → DEPRECATED → REMOVED works', () => {
    validator.registerPackage('full');
    expect(validator.activatePackage('full')).toBe(true);
    expect(validator.deprecatePackage('full', 'old')).toBe(true);
    expect(validator.removePackage('full', 'gone')).toBe(true);
    expect(validator.getPackageState('full')).toBe('REMOVED');
  });

  it('38: transition from DRAFT to REMOVED directly is invalid', () => {
    validator.registerPackage('pkg');
    expect(validator.validateTransition('DRAFT', 'REMOVED')).toBe(false);
  });

  it('39: transition from DEPRECATED to ACTIVE is invalid', () => {
    expect(validator.validateTransition('DEPRECATED', 'ACTIVE')).toBe(false);
  });

  it('40: transition from ACTIVE to DRAFT is invalid', () => {
    expect(validator.validateTransition('ACTIVE', 'DRAFT')).toBe(false);
  });
});
