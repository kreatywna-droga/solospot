/**
 * G1-222: Cross-Domain Recovery Matrix — Test Suite
 *
 * Covers recovery capability registration, failure matching,
 * coverage validation, RTO calculation, gap identification, and reporting.
 */

import { describe, it, expect } from 'vitest';
import {
  CrossDomainRecoveryMatrix,
  RecoveryCapability,
} from '../CrossDomainRecoveryMatrix';

describe('CrossDomainRecoveryMatrix', () => {
  const makeCapability = (
    id: string,
    domain: string = 'web',
    failureType: string = 'outage',
    rto: number = 300,
    rpo: number = 60,
    deps: string[] = [],
  ): RecoveryCapability => ({
    capabilityId: id,
    domain,
    failureType,
    recoveryTimeObjective: rto,
    recoveryPointObjective: rpo,
    recoveryStrategy: 'failover',
    dependencies: deps,
  });

  it('1: creates a matrix instance', () => {
    const m = new CrossDomainRecoveryMatrix();
    expect(m).toBeDefined();
  });

  it('2: registerRecoveryCapability stores a capability', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1'));
    const report = m.generateRecoveryMatrixReport();
    expect(report.totalCapabilities).toBe(1);
  });

  it('3: registerRecoveryCapability overwrites duplicate id', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'web', 'outage', 300));
    m.registerRecoveryCapability(makeCapability('c1', 'api', 'timeout', 120));
    const report = m.generateRecoveryMatrixReport();
    expect(report.totalCapabilities).toBe(1);
  });

  it('4: getRecoveryForFailure finds matching capability', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'web', 'outage'));
    const result = m.getRecoveryForFailure('web', 'outage');
    expect(result).toBeDefined();
    expect(result!.capabilityId).toBe('c1');
  });

  it('5: getRecoveryForFailure returns undefined for no match', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'web', 'outage'));
    expect(m.getRecoveryForFailure('api', 'timeout')).toBeUndefined();
  });

  it('6: getRecoveryForFailure matches domain only', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'web', 'outage'));
    expect(m.getRecoveryForFailure('web', 'different')).toBeUndefined();
  });

  it('7: validateRecoveryCoverage identifies covered scenarios', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'web', 'outage'));
    const scenarios = [
      { scenarioId: 's1', category: 'INFRASTRUCTURE', affectedDomains: ['web'] },
    ];
    const result = m.validateRecoveryCoverage(scenarios);
    expect(result.covered).toContain('s1');
    expect(result.uncovered).toHaveLength(0);
  });

  it('8: validateRecoveryCoverage identifies uncovered scenarios', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'web', 'outage'));
    const scenarios = [
      { scenarioId: 's1', category: 'INFRASTRUCTURE', affectedDomains: ['iot'] },
    ];
    const result = m.validateRecoveryCoverage(scenarios);
    expect(result.uncovered).toContain('s1');
    expect(result.covered).toHaveLength(0);
  });

  it('9: validateRecoveryCoverage handles multiple domains per scenario', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'web', 'outage'));
    const scenarios = [
      { scenarioId: 's1', category: 'INFRASTRUCTURE', affectedDomains: ['iot', 'web'] },
    ];
    const result = m.validateRecoveryCoverage(scenarios);
    expect(result.covered).toContain('s1');
  });

  it('10: calculateAggregateRto returns max RTO', () => {
    const m = new CrossDomainRecoveryMatrix();
    const caps = [
      makeCapability('c1', 'web', 'outage', 300),
      makeCapability('c2', 'api', 'timeout', 600),
      makeCapability('c3', 'data', 'corruption', 150),
    ];
    expect(m.calculateAggregateRto(caps)).toBe(600);
  });

  it('11: calculateAggregateRto returns 0 for empty array', () => {
    const m = new CrossDomainRecoveryMatrix();
    expect(m.calculateAggregateRto([])).toBe(0);
  });

  it('12: calculateAggregateRto with single capability', () => {
    const m = new CrossDomainRecoveryMatrix();
    expect(m.calculateAggregateRto([makeCapability('c1', 'web', 'outage', 450)])).toBe(450);
  });

  it('13: identifyRecoveryGaps finds missing domains', () => {
    const m = new CrossDomainRecoveryMatrix();
    const scenarios = [
      { scenarioId: 's1', category: 'INFRASTRUCTURE', severity: 'P0', affectedDomains: ['iot'] },
    ];
    const gaps = m.identifyRecoveryGaps(scenarios, []);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].missingCapability).toBe('iot');
  });

  it('14: identifyRecoveryGaps returns empty when all domains covered', () => {
    const m = new CrossDomainRecoveryMatrix();
    const scenarios = [
      { scenarioId: 's1', category: 'INFRASTRUCTURE', severity: 'P0', affectedDomains: ['web'] },
    ];
    const caps = [makeCapability('c1', 'web', 'outage')];
    const gaps = m.identifyRecoveryGaps(scenarios, caps);
    expect(gaps).toHaveLength(0);
  });

  it('15: identifyRecoveryGaps handles multiple domains per scenario', () => {
    const m = new CrossDomainRecoveryMatrix();
    const scenarios = [
      { scenarioId: 's1', category: 'INFRASTRUCTURE', severity: 'P0', affectedDomains: ['web', 'iot'] },
    ];
    const caps = [makeCapability('c1', 'web', 'outage')];
    const gaps = m.identifyRecoveryGaps(scenarios, caps);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].missingCapability).toBe('iot');
  });

  it('16: generateRecoveryMatrixReport totalCapabilities', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1'));
    m.registerRecoveryCapability(makeCapability('c2'));
    const report = m.generateRecoveryMatrixReport();
    expect(report.totalCapabilities).toBe(2);
  });

  it('17: generateRecoveryMatrixReport domainsCovered', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'web'));
    m.registerRecoveryCapability(makeCapability('c2', 'api'));
    const report = m.generateRecoveryMatrixReport();
    expect(report.domainsCovered).toContain('web');
    expect(report.domainsCovered).toContain('api');
  });

  it('18: generateRecoveryMatrixReport averageRto', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'web', 'outage', 200));
    m.registerRecoveryCapability(makeCapability('c2', 'api', 'timeout', 400));
    const report = m.generateRecoveryMatrixReport();
    expect(report.averageRto).toBe(300);
  });

  it('19: generateRecoveryMatrixReport averageRpo', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'web', 'outage', 300, 100));
    m.registerRecoveryCapability(makeCapability('c2', 'api', 'timeout', 300, 200));
    const report = m.generateRecoveryMatrixReport();
    expect(report.averageRpo).toBe(150);
  });

  it('20: generateRecoveryMatrixReport capabilitiesByDomain', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'web'));
    m.registerRecoveryCapability(makeCapability('c2', 'web'));
    m.registerRecoveryCapability(makeCapability('c3', 'api'));
    const report = m.generateRecoveryMatrixReport();
    expect(report.capabilitiesByDomain['web']).toBe(2);
    expect(report.capabilitiesByDomain['api']).toBe(1);
  });

  it('21: empty matrix report has zero totals', () => {
    const m = new CrossDomainRecoveryMatrix();
    const report = m.generateRecoveryMatrixReport();
    expect(report.totalCapabilities).toBe(0);
    expect(report.domainsCovered).toHaveLength(0);
    expect(report.averageRto).toBe(0);
    expect(report.averageRpo).toBe(0);
  });

  it('22: validateRecoveryCoverage with empty scenarios', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1'));
    const result = m.validateRecoveryCoverage([]);
    expect(result.covered).toHaveLength(0);
    expect(result.uncovered).toHaveLength(0);
  });

  it('23: validateRecoveryCoverage with empty matrix', () => {
    const m = new CrossDomainRecoveryMatrix();
    const scenarios = [
      { scenarioId: 's1', category: 'INFRASTRUCTURE', affectedDomains: ['web'] },
    ];
    const result = m.validateRecoveryCoverage(scenarios);
    expect(result.uncovered).toContain('s1');
  });

  it('24: identifyRecoveryGaps with empty scenarios', () => {
    const m = new CrossDomainRecoveryMatrix();
    const gaps = m.identifyRecoveryGaps([], [makeCapability('c1')]);
    expect(gaps).toHaveLength(0);
  });

  it('25: identifyRecoveryGaps with empty capabilities', () => {
    const m = new CrossDomainRecoveryMatrix();
    const scenarios = [
      { scenarioId: 's1', category: 'DATA', severity: 'P1', affectedDomains: ['db'] },
    ];
    const gaps = m.identifyRecoveryGaps(scenarios, []);
    expect(gaps).toHaveLength(1);
  });

  it('26: multiple capabilities for same domain', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'web', 'outage'));
    m.registerRecoveryCapability(makeCapability('c2', 'web', 'timeout'));
    const result = m.getRecoveryForFailure('web', 'timeout');
    expect(result!.capabilityId).toBe('c2');
  });

  it('27: calculateAggregateRto with equal RTOs', () => {
    const m = new CrossDomainRecoveryMatrix();
    const caps = [
      makeCapability('c1', 'web', 'outage', 300),
      makeCapability('c2', 'api', 'timeout', 300),
    ];
    expect(m.calculateAggregateRto(caps)).toBe(300);
  });

  it('28: generateRecoveryMatrixReport with single capability', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'data', 'corruption', 500, 30));
    const report = m.generateRecoveryMatrixReport();
    expect(report.totalCapabilities).toBe(1);
    expect(report.averageRto).toBe(500);
    expect(report.averageRpo).toBe(30);
  });

  it('29: validateRecoveryCoverage partial coverage', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'web', 'outage'));
    const scenarios = [
      { scenarioId: 's1', category: 'INFRASTRUCTURE', affectedDomains: ['web'] },
      { scenarioId: 's2', category: 'NETWORK', affectedDomains: ['cdn'] },
    ];
    const result = m.validateRecoveryCoverage(scenarios);
    expect(result.covered).toContain('s1');
    expect(result.uncovered).toContain('s2');
  });

  it('30: identifyRecoveryGaps includes scenario metadata', () => {
    const m = new CrossDomainRecoveryMatrix();
    const scenarios = [
      { scenarioId: 's1', category: 'SECURITY', severity: 'P0', affectedDomains: ['auth'] },
    ];
    const gaps = m.identifyRecoveryGaps(scenarios, []);
    expect(gaps[0].category).toBe('SECURITY');
    expect(gaps[0].severity).toBe('P0');
  });

  it('31: registerRecoveryCapability with dependencies', () => {
    const m = new CrossDomainRecoveryMatrix();
    m.registerRecoveryCapability(makeCapability('c1', 'web', 'outage', 300, 60, ['dns', 'lb']));
    const report = m.generateRecoveryMatrixReport();
    expect(report.totalCapabilities).toBe(1);
  });
});
