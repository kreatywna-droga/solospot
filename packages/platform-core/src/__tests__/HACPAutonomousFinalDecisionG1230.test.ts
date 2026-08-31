/**
 * G1-230: HACP Autonomous Final Decision — Test Suite
 *
 * Covers decision logic, analysis, evolution need, rationale generation,
 * success criteria validation, and final report generation.
 */

import { describe, it, expect } from 'vitest';
import {
  HACPAutonomousFinalDecision,
  FinalDecisionInput,
  FinalDecision,
} from '../HACPAutonomousFinalDecision';

describe('HACPAutonomousFinalDecision', () => {
  const productionReadyInput: FinalDecisionInput = {
    totalTasksExecuted: 55,
    totalTestsPassing: 500,
    totalTestsFailing: 0,
    tsErrors: 0,
    scopeViolations: 0,
    architecturalBoundaryCompliance: 95,
    fakeIntegrations: 0,
    overallPlatformScore: 92,
    decisionDriftEvents: 1,
    recoveryActionsExecuted: 3,
  };

  const needsOptimizationInput: FinalDecisionInput = {
    totalTasksExecuted: 50,
    totalTestsPassing: 450,
    totalTestsFailing: 10,
    tsErrors: 0,
    scopeViolations: 0,
    architecturalBoundaryCompliance: 88,
    fakeIntegrations: 2,
    overallPlatformScore: 78,
    decisionDriftEvents: 1,
    recoveryActionsExecuted: 2,
  };

  const needsHardeningInput: FinalDecisionInput = {
    totalTasksExecuted: 40,
    totalTestsPassing: 300,
    totalTestsFailing: 50,
    tsErrors: 5,
    scopeViolations: 0,
    architecturalBoundaryCompliance: 60,
    fakeIntegrations: 5,
    overallPlatformScore: 55,
    decisionDriftEvents: 2,
    recoveryActionsExecuted: 1,
  };

  const hasViolationsInput: FinalDecisionInput = {
    totalTasksExecuted: 50,
    totalTestsPassing: 480,
    totalTestsFailing: 0,
    tsErrors: 0,
    scopeViolations: 2,
    architecturalBoundaryCompliance: 85,
    fakeIntegrations: 0,
    overallPlatformScore: 82,
    decisionDriftEvents: 1,
    recoveryActionsExecuted: 2,
  };

  const tooMuchDriftInput: FinalDecisionInput = {
    totalTasksExecuted: 50,
    totalTestsPassing: 470,
    totalTestsFailing: 5,
    tsErrors: 1,
    scopeViolations: 0,
    architecturalBoundaryCompliance: 80,
    fakeIntegrations: 1,
    overallPlatformScore: 75,
    decisionDriftEvents: 6,
    recoveryActionsExecuted: 1,
  };

  it('1: creates a decision engine instance', () => {
    const engine = new HACPAutonomousFinalDecision();
    expect(engine).toBeDefined();
  });

  it('2: makeDecision returns CONTROLLED_STOP for production-ready input', () => {
    const engine = new HACPAutonomousFinalDecision();
    expect(engine.makeDecision(productionReadyInput)).toBe('CONTROLLED_STOP');
  });

  it('3: makeDecision returns CONTINUE for optimization-needed input', () => {
    const engine = new HACPAutonomousFinalDecision();
    expect(engine.makeDecision(needsOptimizationInput)).toBe('CONTINUE');
  });

  it('4: makeDecision returns HARDEN for low-score input', () => {
    const engine = new HACPAutonomousFinalDecision();
    expect(engine.makeDecision(needsHardeningInput)).toBe('HARDEN');
  });

  it('5: makeDecision returns REFACTOR for scope violations', () => {
    const engine = new HACPAutonomousFinalDecision();
    expect(engine.makeDecision(hasViolationsInput)).toBe('REFACTOR');
  });

  it('6: makeDecision returns DEFER for excessive drift', () => {
    const engine = new HACPAutonomousFinalDecision();
    expect(engine.makeDecision(tooMuchDriftInput)).toBe('DEFER');
  });

  it('7: CONTROLLED_STOP requires score >= 90, tsErrors == 0, scopeViolations == 0', () => {
    const engine = new HACPAutonomousFinalDecision();
    const input: FinalDecisionInput = {
      ...productionReadyInput,
      overallPlatformScore: 89,
    };
    expect(engine.makeDecision(input)).not.toBe('CONTROLLED_STOP');
  });

  it('8: makeDecision does not return CONTROLLED_STOP with tsErrors > 0', () => {
    const engine = new HACPAutonomousFinalDecision();
    const input: FinalDecisionInput = { ...productionReadyInput, tsErrors: 1 };
    expect(engine.makeDecision(input)).not.toBe('CONTROLLED_STOP');
  });

  it('9: makeDecision does not return CONTROLLED_STOP with scopeViolations > 0', () => {
    const engine = new HACPAutonomousFinalDecision();
    const input: FinalDecisionInput = { ...productionReadyInput, scopeViolations: 1 };
    expect(engine.makeDecision(input)).not.toBe('CONTROLLED_STOP');
  });

  it('10: analyzeDecisionInput returns a DecisionAnalysis', () => {
    const engine = new HACPAutonomousFinalDecision();
    const analysis = engine.analyzeDecisionInput(productionReadyInput);
    expect(analysis).toHaveProperty('decision');
    expect(analysis).toHaveProperty('rationale');
    expect(analysis).toHaveProperty('score');
    expect(analysis).toHaveProperty('metrics');
  });

  it('11: analyzeDecisionInput metrics include testPassRate', () => {
    const engine = new HACPAutonomousFinalDecision();
    const analysis = engine.analyzeDecisionInput(needsOptimizationInput);
    expect(analysis.metrics.testPassRate).toBeCloseTo(97.83, 1);
  });

  it('12: analyzeDecisionInput metrics include architecturalCompliance', () => {
    const engine = new HACPAutonomousFinalDecision();
    const analysis = engine.analyzeDecisionInput(needsOptimizationInput);
    expect(analysis.metrics.architecturalCompliance).toBe(88);
  });

  it('13: analyzeDecisionInput overallHealth EXCELLENT for score >= 90', () => {
    const engine = new HACPAutonomousFinalDecision();
    const analysis = engine.analyzeDecisionInput(productionReadyInput);
    expect(analysis.metrics.overallHealth).toBe('EXCELLENT');
  });

  it('14: analyzeDecisionInput overallHealth GOOD for score >= 75', () => {
    const engine = new HACPAutonomousFinalDecision();
    const analysis = engine.analyzeDecisionInput(needsOptimizationInput);
    expect(analysis.metrics.overallHealth).toBe('GOOD');
  });

  it('15: analyzeDecisionInput overallHealth FAIR for score >= 50', () => {
    const engine = new HACPAutonomousFinalDecision();
    const analysis = engine.analyzeDecisionInput(needsHardeningInput);
    expect(analysis.metrics.overallHealth).toBe('FAIR');
  });

  it('16: analyzeDecisionInput overallHealth POOR for score < 50', () => {
    const engine = new HACPAutonomousFinalDecision();
    const input: FinalDecisionInput = { ...needsHardeningInput, overallPlatformScore: 40 };
    const analysis = engine.analyzeDecisionInput(input);
    expect(analysis.metrics.overallHealth).toBe('POOR');
  });

  it('17: evaluateEvolutionNeed returns true when gaps exist', () => {
    const engine = new HACPAutonomousFinalDecision();
    expect(engine.evaluateEvolutionNeed(needsOptimizationInput)).toBe(true);
  });

  it('18: evaluateEvolutionNeed returns false when no issues', () => {
    const engine = new HACPAutonomousFinalDecision();
    const input: FinalDecisionInput = {
      ...productionReadyInput,
      overallPlatformScore: 96,
      fakeIntegrations: 0,
    };
    expect(engine.evaluateEvolutionNeed(input)).toBe(false);
  });

  it('19: evaluateEvolutionNeed returns false with excessive drift', () => {
    const engine = new HACPAutonomousFinalDecision();
    expect(engine.evaluateEvolutionNeed(tooMuchDriftInput)).toBe(false);
  });

  it('20: generateDecisionRationale returns non-empty string for CONTROLLED_STOP', () => {
    const engine = new HACPAutonomousFinalDecision();
    const rationale = engine.generateDecisionRationale(productionReadyInput, 'CONTROLLED_STOP');
    expect(rationale.length).toBeGreaterThan(0);
  });

  it('21: generateDecisionRationale includes score for CONTROLLED_STOP', () => {
    const engine = new HACPAutonomousFinalDecision();
    const rationale = engine.generateDecisionRationale(productionReadyInput, 'CONTROLLED_STOP');
    expect(rationale).toContain('92');
  });

  it('22: generateDecisionRationale mentions zero errors for CONTROLLED_STOP', () => {
    const engine = new HACPAutonomousFinalDecision();
    const rationale = engine.generateDecisionRationale(productionReadyInput, 'CONTROLLED_STOP');
    expect(rationale).toContain('Zero');
  });

  it('23: generateDecisionRationale returns string for CONTINUE', () => {
    const engine = new HACPAutonomousFinalDecision();
    const rationale = engine.generateDecisionRationale(needsOptimizationInput, 'CONTINUE');
    expect(rationale.length).toBeGreaterThan(0);
  });

  it('24: generateDecisionRationale mentions fake integrations for CONTINUE', () => {
    const engine = new HACPAutonomousFinalDecision();
    const rationale = engine.generateDecisionRationale(needsOptimizationInput, 'CONTINUE');
    expect(rationale).toContain('fake integration');
  });

  it('25: generateDecisionRationale returns string for HARDEN', () => {
    const engine = new HACPAutonomousFinalDecision();
    const rationale = engine.generateDecisionRationale(needsHardeningInput, 'HARDEN');
    expect(rationale.length).toBeGreaterThan(0);
  });

  it('26: generateDecisionRationale mentions critical gaps for HARDEN', () => {
    const engine = new HACPAutonomousFinalDecision();
    const rationale = engine.generateDecisionRationale(needsHardeningInput, 'HARDEN');
    expect(rationale).toContain('critical');
  });

  it('27: generateDecisionRationale returns string for REFACTOR', () => {
    const engine = new HACPAutonomousFinalDecision();
    const rationale = engine.generateDecisionRationale(hasViolationsInput, 'REFACTOR');
    expect(rationale.length).toBeGreaterThan(0);
  });

  it('28: generateDecisionRationale mentions scope violations for REFACTOR', () => {
    const engine = new HACPAutonomousFinalDecision();
    const rationale = engine.generateDecisionRationale(hasViolationsInput, 'REFACTOR');
    expect(rationale).toContain('scope violation');
  });

  it('29: generateDecisionRationale returns string for DEFER', () => {
    const engine = new HACPAutonomousFinalDecision();
    const rationale = engine.generateDecisionRationale(tooMuchDriftInput, 'DEFER');
    expect(rationale.length).toBeGreaterThan(0);
  });

  it('30: generateDecisionRationale mentions drift for DEFER', () => {
    const engine = new HACPAutonomousFinalDecision();
    const rationale = engine.generateDecisionRationale(tooMuchDriftInput, 'DEFER');
    expect(rationale).toContain('drift');
  });

  it('31: generateDecisionRationale returns string for MERGE', () => {
    const engine = new HACPAutonomousFinalDecision();
    const rationale = engine.generateDecisionRationale(productionReadyInput, 'MERGE');
    expect(rationale.length).toBeGreaterThan(0);
  });

  it('32: validateSuccessCriteria returns all criteria', () => {
    const engine = new HACPAutonomousFinalDecision();
    const criteria = engine.validateSuccessCriteria(productionReadyInput);
    expect(criteria).toHaveProperty('allTestsPassing');
    expect(criteria).toHaveProperty('zeroTsErrors');
    expect(criteria).toHaveProperty('zeroScopeViolations');
    expect(criteria).toHaveProperty('highArchitecturalCompliance');
    expect(criteria).toHaveProperty('noFakeIntegrations');
    expect(criteria).toHaveProperty('highPlatformScore');
    expect(criteria).toHaveProperty('controlledDecisionDrift');
    expect(criteria).toHaveProperty('allTasksExecuted');
    expect(criteria).toHaveProperty('recoveryActionsSufficient');
  });

  it('33: validateSuccessCriteria all pass for production-ready input', () => {
    const engine = new HACPAutonomousFinalDecision();
    const criteria = engine.validateSuccessCriteria(productionReadyInput);
    expect(Object.values(criteria).every(Boolean)).toBe(true);
  });

  it('34: validateSuccessCriteria fails when tests failing', () => {
    const engine = new HACPAutonomousFinalDecision();
    const criteria = engine.validateSuccessCriteria(needsHardeningInput);
    expect(criteria.allTestsPassing).toBe(false);
  });

  it('35: validateSuccessCriteria fails when tsErrors > 0', () => {
    const engine = new HACPAutonomousFinalDecision();
    const criteria = engine.validateSuccessCriteria(needsHardeningInput);
    expect(criteria.zeroTsErrors).toBe(false);
  });

  it('36: validateSuccessCriteria fails when scopeViolations > 0', () => {
    const engine = new HACPAutonomousFinalDecision();
    const input: FinalDecisionInput = { ...needsHardeningInput, scopeViolations: 2 };
    const criteria = engine.validateSuccessCriteria(input);
    expect(criteria.zeroScopeViolations).toBe(false);
  });

  it('37: validateSuccessCriteria fails when compliance < 90', () => {
    const engine = new HACPAutonomousFinalDecision();
    const criteria = engine.validateSuccessCriteria(needsHardeningInput);
    expect(criteria.highArchitecturalCompliance).toBe(false);
  });

  it('38: validateSuccessCriteria fails when fakeIntegrations > 0', () => {
    const engine = new HACPAutonomousFinalDecision();
    const criteria = engine.validateSuccessCriteria(needsOptimizationInput);
    expect(criteria.noFakeIntegrations).toBe(false);
  });

  it('39: validateSuccessCriteria fails when score < 85', () => {
    const engine = new HACPAutonomousFinalDecision();
    const criteria = engine.validateSuccessCriteria(needsOptimizationInput);
    expect(criteria.highPlatformScore).toBe(false);
  });

  it('40: validateSuccessCriteria fails when drift > 2', () => {
    const engine = new HACPAutonomousFinalDecision();
    const criteria = engine.validateSuccessCriteria(tooMuchDriftInput);
    expect(criteria.controlledDecisionDrift).toBe(false);
  });

  it('41: validateSuccessCriteria fails when tasks < 50', () => {
    const engine = new HACPAutonomousFinalDecision();
    const input: FinalDecisionInput = { ...productionReadyInput, totalTasksExecuted: 49 };
    const criteria = engine.validateSuccessCriteria(input);
    expect(criteria.allTasksExecuted).toBe(false);
  });

  it('42: generateFinalReport returns correct structure', () => {
    const engine = new HACPAutonomousFinalDecision();
    const report = engine.generateFinalReport(productionReadyInput);
    expect(report).toHaveProperty('decision');
    expect(report).toHaveProperty('rationale');
    expect(report).toHaveProperty('input');
    expect(report).toHaveProperty('analysis');
    expect(report).toHaveProperty('successCriteriaMet');
    expect(report).toHaveProperty('successCriteriaDetails');
    expect(report).toHaveProperty('timestamp');
  });

  it('43: generateFinalReport decision matches makeDecision', () => {
    const engine = new HACPAutonomousFinalDecision();
    const report = engine.generateFinalReport(productionReadyInput);
    expect(report.decision).toBe('CONTROLLED_STOP');
  });

  it('44: generateFinalReport successCriteriaMet is boolean', () => {
    const engine = new HACPAutonomousFinalDecision();
    const report = engine.generateFinalReport(productionReadyInput);
    expect(typeof report.successCriteriaMet).toBe('boolean');
  });

  it('45: generateFinalReport successCriteriaDetails has 9 entries', () => {
    const engine = new HACPAutonomousFinalDecision();
    const report = engine.generateFinalReport(productionReadyInput);
    expect(report.successCriteriaDetails).toHaveLength(9);
  });

  it('46: generateFinalReport timestamp is recent', () => {
    const engine = new HACPAutonomousFinalDecision();
    const before = Date.now();
    const report = engine.generateFinalReport(productionReadyInput);
    const after = Date.now();
    expect(report.timestamp).toBeGreaterThanOrEqual(before);
    expect(report.timestamp).toBeLessThanOrEqual(after);
  });

  it('47: generateFinalReport input is stored', () => {
    const engine = new HACPAutonomousFinalDecision();
    const report = engine.generateFinalReport(productionReadyInput);
    expect(report.input).toBe(productionReadyInput);
  });

  it('48: getDecisionHistory returns reports', () => {
    const engine = new HACPAutonomousFinalDecision();
    engine.generateFinalReport(productionReadyInput);
    expect(engine.getDecisionHistory()).toHaveLength(1);
  });

  it('49: multiple reports accumulate in history', () => {
    const engine = new HACPAutonomousFinalDecision();
    engine.generateFinalReport(productionReadyInput);
    engine.generateFinalReport(needsOptimizationInput);
    expect(engine.getDecisionHistory()).toHaveLength(2);
  });

  it('50: getDecisionHistory returns a copy', () => {
    const engine = new HACPAutonomousFinalDecision();
    engine.generateFinalReport(productionReadyInput);
    const history = engine.getDecisionHistory();
    history.pop();
    expect(engine.getDecisionHistory()).toHaveLength(1);
  });

  it('51: makeDecision returns CONTINUE when score >= 70 and tsErrors == 0', () => {
    const engine = new HACPAutonomousFinalDecision();
    const input: FinalDecisionInput = { ...needsOptimizationInput };
    expect(engine.makeDecision(input)).toBe('CONTINUE');
  });

  it('52: analyzeDecisionInput score matches input score', () => {
    const engine = new HACPAutonomousFinalDecision();
    const analysis = engine.analyzeDecisionInput(productionReadyInput);
    expect(analysis.score).toBe(92);
  });

  it('53: generateFinalReport rationale is non-empty', () => {
    const engine = new HACPAutonomousFinalDecision();
    const report = engine.generateFinalReport(needsOptimizationInput);
    expect(report.rationale.length).toBeGreaterThan(0);
  });

  it('54: generateFinalReport analysis has matching decision', () => {
    const engine = new HACPAutonomousFinalDecision();
    const report = engine.generateFinalReport(needsOptimizationInput);
    expect(report.analysis.decision).toBe(report.decision);
  });

  it('55: generateFinalReport successCriteriaDetails contain PASS/FAIL', () => {
    const engine = new HACPAutonomousFinalDecision();
    const report = engine.generateFinalReport(productionReadyInput);
    for (const detail of report.successCriteriaDetails) {
      expect(detail).toMatch(/PASS|FAIL/);
    }
  });

  it('56: HARDEN triggered when score < 70 even with zero tsErrors', () => {
    const engine = new HACPAutonomousFinalDecision();
    const input: FinalDecisionInput = {
      ...needsHardeningInput,
      tsErrors: 0,
      scopeViolations: 0,
      overallPlatformScore: 65,
    };
    expect(engine.makeDecision(input)).toBe('HARDEN');
  });

  it('57: REFACTOR triggered when scopeViolations > 0 and score >= 70', () => {
    const engine = new HACPAutonomousFinalDecision();
    const input: FinalDecisionInput = {
      ...needsOptimizationInput,
      scopeViolations: 1,
      overallPlatformScore: 75,
      tsErrors: 0,
    };
    expect(engine.makeDecision(input)).toBe('REFACTOR');
  });

  it('58: DEFER triggered when driftEvents > 3 and other conditions not met', () => {
    const engine = new HACPAutonomousFinalDecision();
    const input: FinalDecisionInput = {
      ...needsOptimizationInput,
      decisionDriftEvents: 4,
      tsErrors: 1,
      overallPlatformScore: 72,
    };
    expect(engine.makeDecision(input)).toBe('DEFER');
  });

  it('59: validateSuccessCriteria with zero tests does not pass allTestsPassing', () => {
    const engine = new HACPAutonomousFinalDecision();
    const input: FinalDecisionInput = {
      ...productionReadyInput,
      totalTestsPassing: 0,
      totalTestsFailing: 0,
    };
    const criteria = engine.validateSuccessCriteria(input);
    expect(criteria.allTestsPassing).toBe(false);
  });

  it('60: evaluateEvolutionNeed returns true when fakeIntegrations > 0', () => {
    const engine = new HACPAutonomousFinalDecision();
    const input: FinalDecisionInput = { ...productionReadyInput, fakeIntegrations: 1, overallPlatformScore: 88 };
    expect(engine.evaluateEvolutionNeed(input)).toBe(true);
  });
});
