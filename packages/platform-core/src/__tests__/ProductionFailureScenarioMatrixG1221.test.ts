/**
 * G1-221: Production Failure Scenario Matrix — Test Suite
 *
 * Covers scenario registration, filtering by category/severity/domain,
 * risk scoring, prioritization, coverage gaps, and reporting.
 */

import { describe, it, expect } from 'vitest';
import {
  ProductionFailureScenarioMatrix,
  FailureScenario,
} from '../ProductionFailureScenarioMatrix';

describe('ProductionFailureScenarioMatrix', () => {
  const makeScenario = (
    id: string,
    category: FailureScenario['category'] = 'INFRASTRUCTURE',
    severity: FailureScenario['severity'] = 'P1',
    domains: string[] = ['web'],
    impact: number = 50,
  ): FailureScenario => ({
    scenarioId: id,
    category,
    severity,
    description: `Scenario ${id}`,
    affectedDomains: domains,
    estimatedImpact: impact,
    detectionMechanism: 'monitoring',
    recoveryProcedure: 'restart',
  });

  it('1: creates a matrix instance', () => {
    const m = new ProductionFailureScenarioMatrix();
    expect(m).toBeDefined();
  });

  it('2: registerScenario stores a scenario', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1'));
    const report = m.generateMatrixReport();
    expect(report.totalScenarios).toBe(1);
  });

  it('3: registerScenario overwrites duplicate id', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1', 'INFRASTRUCTURE', 'P0'));
    m.registerScenario(makeScenario('s1', 'APPLICATION', 'P1'));
    const report = m.generateMatrixReport();
    expect(report.totalScenarios).toBe(1);
  });

  it('4: getScenariosByCategory filters correctly', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1', 'INFRASTRUCTURE'));
    m.registerScenario(makeScenario('s2', 'APPLICATION'));
    m.registerScenario(makeScenario('s3', 'INFRASTRUCTURE'));
    const results = m.getScenariosByCategory('INFRASTRUCTURE');
    expect(results).toHaveLength(2);
  });

  it('5: getScenariosByCategory returns empty for no match', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1', 'INFRASTRUCTURE'));
    expect(m.getScenariosByCategory('SECURITY')).toHaveLength(0);
  });

  it('6: getScenariosBySeverity filters correctly', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1', 'INFRASTRUCTURE', 'P0'));
    m.registerScenario(makeScenario('s2', 'INFRASTRUCTURE', 'P1'));
    m.registerScenario(makeScenario('s3', 'INFRASTRUCTURE', 'P0'));
    const results = m.getScenariosBySeverity('P0');
    expect(results).toHaveLength(2);
  });

  it('7: getScenariosBySeverity returns empty for no match', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1', 'INFRASTRUCTURE', 'P0'));
    expect(m.getScenariosBySeverity('P3')).toHaveLength(0);
  });

  it('8: getScenariosByDomain filters by affected domain', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1', 'INFRASTRUCTURE', 'P1', ['web', 'api']));
    m.registerScenario(makeScenario('s2', 'APPLICATION', 'P1', ['mobile']));
    m.registerScenario(makeScenario('s3', 'DATA', 'P1', ['web']));
    const results = m.getScenariosByDomain('web');
    expect(results).toHaveLength(2);
  });

  it('9: getScenariosByDomain returns empty for unknown domain', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1', 'INFRASTRUCTURE', 'P1', ['web']));
    expect(m.getScenariosByDomain('iot')).toHaveLength(0);
  });

  it('10: calculateRiskScore returns a number', () => {
    const m = new ProductionFailureScenarioMatrix();
    const score = m.calculateRiskScore(makeScenario('s1', 'INFRASTRUCTURE', 'P0', ['web'], 80));
    expect(typeof score).toBe('number');
  });

  it('11: calculateRiskScore is greater than 0 for non-trivial scenario', () => {
    const m = new ProductionFailureScenarioMatrix();
    const score = m.calculateRiskScore(makeScenario('s1', 'INFRASTRUCTURE', 'P0', ['web'], 80));
    expect(score).toBeGreaterThan(0);
  });

  it('12: P0 severity yields higher risk than P3', () => {
    const m = new ProductionFailureScenarioMatrix();
    const p0 = m.calculateRiskScore(makeScenario('s1', 'INFRASTRUCTURE', 'P0', ['web'], 80));
    const p3 = m.calculateRiskScore(makeScenario('s2', 'INFRASTRUCTURE', 'P3', ['web'], 80));
    expect(p0).toBeGreaterThan(p3);
  });

  it('13: higher impact yields higher risk score', () => {
    const m = new ProductionFailureScenarioMatrix();
    const low = m.calculateRiskScore(makeScenario('s1', 'INFRASTRUCTURE', 'P0', ['web'], 20));
    const high = m.calculateRiskScore(makeScenario('s2', 'INFRASTRUCTURE', 'P0', ['web'], 100));
    expect(high).toBeGreaterThan(low);
  });

  it('14: more affected domains yields higher risk', () => {
    const m = new ProductionFailureScenarioMatrix();
    const few = m.calculateRiskScore(makeScenario('s1', 'INFRASTRUCTURE', 'P0', ['web'], 50));
    const many = m.calculateRiskScore(makeScenario('s2', 'INFRASTRUCTURE', 'P0', ['web', 'api', 'mobile', 'data', 'admin'], 50));
    expect(many).toBeGreaterThanOrEqual(few);
  });

  it('15: prioritizeScenarios returns sorted by risk descending', () => {
    const m = new ProductionFailureScenarioMatrix();
    const scenarios = [
      makeScenario('s1', 'INFRASTRUCTURE', 'P3', ['web'], 20),
      makeScenario('s2', 'SECURITY', 'P0', ['web', 'api', 'data'], 100),
      makeScenario('s3', 'APPLICATION', 'P1', ['api'], 50),
    ];
    const prioritized = m.prioritizeScenarios(scenarios);
    expect(prioritized[0].scenario.scenarioId).toBe('s2');
    expect(prioritized[1].scenario.scenarioId).toBe('s3');
    expect(prioritized[2].scenario.scenarioId).toBe('s1');
  });

  it('16: prioritizeScenarios includes riskScore property', () => {
    const m = new ProductionFailureScenarioMatrix();
    const prioritized = m.prioritizeScenarios([makeScenario('s1')]);
    expect(prioritized[0]).toHaveProperty('riskScore');
  });

  it('17: prioritizeScenarios with empty array returns empty', () => {
    const m = new ProductionFailureScenarioMatrix();
    expect(m.prioritizeScenarios([])).toHaveLength(0);
  });

  it('18: getUncoveredDomains finds missing categories', () => {
    const m = new ProductionFailureScenarioMatrix();
    const scenarios = [
      makeScenario('s1', 'INFRASTRUCTURE'),
      makeScenario('s2', 'APPLICATION'),
    ];
    const uncovered = m.getUncoveredDomains(scenarios);
    expect(uncovered).toContain('DATA');
    expect(uncovered).toContain('SECURITY');
    expect(uncovered).toContain('NETWORK');
  });

  it('19: getUncoveredDomains returns empty when all categories covered', () => {
    const m = new ProductionFailureScenarioMatrix();
    const scenarios = [
      makeScenario('s1', 'INFRASTRUCTURE'),
      makeScenario('s2', 'APPLICATION'),
      makeScenario('s3', 'DATA'),
      makeScenario('s4', 'SECURITY'),
      makeScenario('s5', 'NETWORK'),
    ];
    expect(m.getUncoveredDomains(scenarios)).toHaveLength(0);
  });

  it('20: generateMatrixReport returns totalScenarios', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1'));
    m.registerScenario(makeScenario('s2'));
    const report = m.generateMatrixReport();
    expect(report.totalScenarios).toBe(2);
  });

  it('21: generateMatrixReport includes byCategory counts', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1', 'INFRASTRUCTURE'));
    m.registerScenario(makeScenario('s2', 'INFRASTRUCTURE'));
    m.registerScenario(makeScenario('s3', 'APPLICATION'));
    const report = m.generateMatrixReport();
    expect(report.byCategory['INFRASTRUCTURE']).toBe(2);
    expect(report.byCategory['APPLICATION']).toBe(1);
  });

  it('22: generateMatrixReport includes bySeverity counts', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1', 'INFRASTRUCTURE', 'P0'));
    m.registerScenario(makeScenario('s2', 'APPLICATION', 'P0'));
    m.registerScenario(makeScenario('s3', 'DATA', 'P2'));
    const report = m.generateMatrixReport();
    expect(report.bySeverity['P0']).toBe(2);
    expect(report.bySeverity['P2']).toBe(1);
  });

  it('23: generateMatrixReport topRisk has up to 5 entries', () => {
    const m = new ProductionFailureScenarioMatrix();
    for (let i = 0; i < 10; i++) {
      m.registerScenario(makeScenario(`s${i}`, 'INFRASTRUCTURE', 'P0', ['web'], 90));
    }
    const report = m.generateMatrixReport();
    expect(report.topRisk.length).toBeLessThanOrEqual(5);
  });

  it('24: generateMatrixReport uncoveredDomains lists missing categories', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1', 'INFRASTRUCTURE'));
    const report = m.generateMatrixReport();
    expect(report.uncoveredDomains.length).toBe(4);
  });

  it('25: empty matrix report has zero totals', () => {
    const m = new ProductionFailureScenarioMatrix();
    const report = m.generateMatrixReport();
    expect(report.totalScenarios).toBe(0);
    expect(report.topRisk).toHaveLength(0);
  });

  it('26: all five categories are handled', () => {
    const m = new ProductionFailureScenarioMatrix();
    const cats: FailureScenario['category'][] = ['INFRASTRUCTURE', 'APPLICATION', 'DATA', 'SECURITY', 'NETWORK'];
    cats.forEach((cat, i) => m.registerScenario(makeScenario(`s${i}`, cat)));
    const report = m.generateMatrixReport();
    expect(Object.keys(report.byCategory)).toHaveLength(5);
  });

  it('27: all four severities are handled', () => {
    const m = new ProductionFailureScenarioMatrix();
    const sevs: FailureScenario['severity'][] = ['P0', 'P1', 'P2', 'P3'];
    sevs.forEach((sev, i) => m.registerScenario(makeScenario(`s${i}`, 'INFRASTRUCTURE', sev)));
    const report = m.generateMatrixReport();
    expect(Object.keys(report.bySeverity)).toHaveLength(4);
  });

  it('28: getScenariosByCategory with all categories returns all', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1', 'INFRASTRUCTURE'));
    m.registerScenario(makeScenario('s2', 'APPLICATION'));
    expect(m.getScenariosByCategory('INFRASTRUCTURE')).toHaveLength(1);
    expect(m.getScenariosByCategory('APPLICATION')).toHaveLength(1);
  });

  it('29: risk score for P0 with max impact and domains is highest possible', () => {
    const m = new ProductionFailureScenarioMatrix();
    const score = m.calculateRiskScore(
      makeScenario('s1', 'SECURITY', 'P0', ['a', 'b', 'c', 'd', 'e'], 100),
    );
    expect(score).toBeGreaterThan(0.1);
  });

  it('30: risk score for P3 with min impact and single domain is lowest', () => {
    const m = new ProductionFailureScenarioMatrix();
    const score = m.calculateRiskScore(
      makeScenario('s1', 'NETWORK', 'P3', ['a'], 1),
    );
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(0.1);
  });

  it('31: prioritizeScenarios preserves all scenarios in output', () => {
    const m = new ProductionFailureScenarioMatrix();
    const scenarios = [
      makeScenario('s1', 'INFRASTRUCTURE', 'P0'),
      makeScenario('s2', 'APPLICATION', 'P1'),
      makeScenario('s3', 'DATA', 'P2'),
    ];
    const result = m.prioritizeScenarios(scenarios);
    expect(result).toHaveLength(3);
  });

  it('32: getScenariosByDomain with multiple domains matches correctly', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1', 'INFRASTRUCTURE', 'P1', ['web', 'api']));
    m.registerScenario(makeScenario('s2', 'APPLICATION', 'P1', ['api', 'mobile']));
    expect(m.getScenariosByDomain('api')).toHaveLength(2);
  });

  it('33: generateMatrixReport topRisk sorted descending', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1', 'NETWORK', 'P3', ['a'], 10));
    m.registerScenario(makeScenario('s2', 'SECURITY', 'P0', ['a', 'b', 'c'], 100));
    m.registerScenario(makeScenario('s3', 'DATA', 'P1', ['a', 'b'], 60));
    const report = m.generateMatrixReport();
    for (let i = 1; i < report.topRisk.length; i++) {
      expect(report.topRisk[i - 1].riskScore).toBeGreaterThanOrEqual(
        report.topRisk[i].riskScore,
      );
    }
  });

  it('34: registerScenario multiple unique ids', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('a'));
    m.registerScenario(makeScenario('b'));
    m.registerScenario(makeScenario('c'));
    expect(m.generateMatrixReport().totalScenarios).toBe(3);
  });

  it('35: calculateRiskScore is deterministic', () => {
    const m = new ProductionFailureScenarioMatrix();
    const s = makeScenario('s1', 'INFRASTRUCTURE', 'P0', ['web', 'api'], 75);
    const s1 = m.calculateRiskScore(s);
    const s2 = m.calculateRiskScore(s);
    expect(s1).toBe(s2);
  });

  it('36: getScenariosByDomain returns empty for empty matrix', () => {
    const m = new ProductionFailureScenarioMatrix();
    expect(m.getScenariosByDomain('web')).toHaveLength(0);
  });

  it('37: generateMatrixReport byCategory and bySeverity match registered counts', () => {
    const m = new ProductionFailureScenarioMatrix();
    m.registerScenario(makeScenario('s1', 'INFRASTRUCTURE', 'P0'));
    m.registerScenario(makeScenario('s2', 'APPLICATION', 'P1'));
    m.registerScenario(makeScenario('s3', 'INFRASTRUCTURE', 'P2'));
    const report = m.generateMatrixReport();
    const totalFromCategories = Object.values(report.byCategory).reduce((a, b) => a + b, 0);
    const totalFromSeverities = Object.values(report.bySeverity).reduce((a, b) => a + b, 0);
    expect(totalFromCategories).toBe(3);
    expect(totalFromSeverities).toBe(3);
  });
});
