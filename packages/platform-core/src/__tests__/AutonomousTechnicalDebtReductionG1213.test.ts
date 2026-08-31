/**
 * G1-213: Autonomous Technical Debt Reduction — Test Suite
 *
 * Covers registration, debt calculation, prioritization, trend analysis,
 * reduction marking, and reporting.
 */

import { describe, it, expect } from 'vitest';
import {
  AutonomousTechnicalDebtReducer,
  TechnicalDebtItem,
  DebtItemWithStatus,
  DebtCategory,
  DebtSeverity,
} from '../AutonomousTechnicalDebtReduction';

describe('AutonomousTechnicalDebtReducer', () => {
  const makeDebt = (overrides: Partial<TechnicalDebtItem> = {}): TechnicalDebtItem => ({
    debtId: `debt-${Math.random().toString(36).slice(2, 8)}`,
    category: 'CODE_SMELL',
    severity: 'MEDIUM',
    description: 'Test debt item',
    estimatedEffortHours: 5,
    impactScore: 7,
    ...overrides,
  });

  it('1: creates a reducer instance', () => {
    const r = new AutonomousTechnicalDebtReducer();
    expect(r).toBeDefined();
  });

  it('2: registerDebtItem returns a DebtItemWithStatus', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const item = r.registerDebtItem(makeDebt({ debtId: 'd1' }));
    expect(item.debtId).toBe('d1');
    expect(item.reduced).toBe(false);
  });

  it('3: registerDebtItem stores the item', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1' }));
    expect(r.getItems()).toHaveLength(1);
  });

  it('4: getItems returns all registered items', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1' }));
    r.registerDebtItem(makeDebt({ debtId: 'd2' }));
    expect(r.getItems()).toHaveLength(2);
  });

  it('5: calculateTotalDebt sums impact scores with severity multipliers', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const items: DebtItemWithStatus[] = [
      { ...makeDebt({ debtId: 'd1', impactScore: 10, severity: 'HIGH' }), reduced: false },
      { ...makeDebt({ debtId: 'd2', impactScore: 5, severity: 'LOW' }), reduced: false },
    ];
    const total = r.calculateTotalDebt(items);
    expect(total).toBe(10 * 3 + 5 * 1);
  });

  it('6: calculateTotalDebt excludes reduced items', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const items: DebtItemWithStatus[] = [
      { ...makeDebt({ debtId: 'd1', impactScore: 10, severity: 'HIGH' }), reduced: true },
      { ...makeDebt({ debtId: 'd2', impactScore: 5, severity: 'LOW' }), reduced: false },
    ];
    const total = r.calculateTotalDebt(items);
    expect(total).toBe(5);
  });

  it('7: prioritizeReduction returns items sorted by impact/effort ratio', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const items: DebtItemWithStatus[] = [
      { ...makeDebt({ debtId: 'd1', impactScore: 3, estimatedEffortHours: 10 }), reduced: false },
      { ...makeDebt({ debtId: 'd2', impactScore: 9, estimatedEffortHours: 1 }), reduced: false },
      { ...makeDebt({ debtId: 'd3', impactScore: 5, estimatedEffortHours: 2 }), reduced: false },
    ];
    const prioritized = r.prioritizeReduction(items);
    expect(prioritized[0].debtId).toBe('d2');
    expect(prioritized[1].debtId).toBe('d3');
    expect(prioritized[2].debtId).toBe('d1');
  });

  it('8: prioritizeReduction excludes reduced items', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const items: DebtItemWithStatus[] = [
      { ...makeDebt({ debtId: 'd1', impactScore: 10, estimatedEffortHours: 1 }), reduced: true },
      { ...makeDebt({ debtId: 'd2', impactScore: 5, estimatedEffortHours: 1 }), reduced: false },
    ];
    const prioritized = r.prioritizeReduction(items);
    expect(prioritized).toHaveLength(1);
    expect(prioritized[0].debtId).toBe('d2');
  });

  it('9: markAsReduced marks item as reduced', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1' }));
    const result = r.markAsReduced('d1');
    expect(result).toBe(true);
    const item = r.getItems().find((i) => i.debtId === 'd1');
    expect(item?.reduced).toBe(true);
  });

  it('10: markAsReduced records timestamp', () => {
    const before = Date.now();
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1' }));
    r.markAsReduced('d1');
    const item = r.getItems().find((i) => i.debtId === 'd1');
    expect(item?.reducedAt).toBeGreaterThanOrEqual(before);
  });

  it('11: markAsReduced returns false for unknown id', () => {
    const r = new AutonomousTechnicalDebtReducer();
    expect(r.markAsReduced('unknown')).toBe(false);
  });

  it('12: markAsReduced returns false if already reduced', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1' }));
    r.markAsReduced('d1');
    expect(r.markAsReduced('d1')).toBe(false);
  });

  it('13: getDebtTrend returns IMPROVING when reduced > active', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const items: DebtItemWithStatus[] = [
      { ...makeDebt({ impactScore: 10, severity: 'HIGH' }), reduced: true },
      { ...makeDebt({ impactScore: 2, severity: 'LOW' }), reduced: false },
    ];
    expect(r.getDebtTrend(items)).toBe('IMPROVING');
  });

  it('14: getDebtTrend returns WORSENING when no reduced and active exists', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const items: DebtItemWithStatus[] = [
      { ...makeDebt({ impactScore: 5 }), reduced: false },
    ];
    expect(r.getDebtTrend(items)).toBe('WORSENING');
  });

  it('15: getDebtTrend returns STABLE when equal', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const items: DebtItemWithStatus[] = [
      { ...makeDebt({ impactScore: 5, severity: 'MEDIUM' }), reduced: false },
      { ...makeDebt({ impactScore: 5, severity: 'MEDIUM' }), reduced: true },
    ];
    expect(r.getDebtTrend(items)).toBe('STABLE');
  });

  it('16: getDebtTrend returns STABLE for empty items', () => {
    const r = new AutonomousTechnicalDebtReducer();
    expect(r.getDebtTrend([])).toBe('STABLE');
  });

  it('17: getScoreHistory tracks reduction history', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1', impactScore: 10, severity: 'HIGH' }));
    r.markAsReduced('d1');
    const history = r.getScoreHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
  });

  it('18: generateDebtReport returns total items', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1' }));
    r.registerDebtItem(makeDebt({ debtId: 'd2' }));
    const report = r.generateDebtReport();
    expect(report.totalItems).toBe(2);
  });

  it('19: generateDebtReport counts active items', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1' }));
    r.registerDebtItem(makeDebt({ debtId: 'd2' }));
    r.markAsReduced('d1');
    const report = r.generateDebtReport();
    expect(report.activeItems).toBe(1);
    expect(report.reducedItems).toBe(1);
  });

  it('20: generateDebtReport includes total debt score', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1', impactScore: 8, severity: 'HIGH' }));
    const report = r.generateDebtReport();
    expect(report.totalDebtScore).toBe(8 * 3);
  });

  it('21: generateDebtReport includes trend', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1', impactScore: 5 }));
    const report = r.generateDebtReport();
    expect(['IMPROVING', 'STABLE', 'WORSENING']).toContain(report.trend);
  });

  it('22: generateDebtReport includes itemsByCategory', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1', category: 'CODE_SMELL' }));
    r.registerDebtItem(makeDebt({ debtId: 'd2', category: 'DUPLICATION' }));
    const report = r.generateDebtReport();
    expect(report.itemsByCategory.CODE_SMELL).toBe(1);
    expect(report.itemsByCategory.DUPLICATION).toBe(1);
  });

  it('23: generateDebtReport includes itemsBySeverity', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1', severity: 'HIGH' }));
    r.registerDebtItem(makeDebt({ debtId: 'd2', severity: 'LOW' }));
    const report = r.generateDebtReport();
    expect(report.itemsBySeverity.HIGH).toBe(1);
    expect(report.itemsBySeverity.LOW).toBe(1);
  });

  it('24: generateDebtReport includes prioritizedReduction', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1', impactScore: 3, estimatedEffortHours: 10 }));
    r.registerDebtItem(makeDebt({ debtId: 'd2', impactScore: 9, estimatedEffortHours: 1 }));
    const report = r.generateDebtReport();
    expect(report.prioritizedReduction[0].debtId).toBe('d2');
  });

  it('25: severity LOW multiplier is 1', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const items: DebtItemWithStatus[] = [
      { ...makeDebt({ impactScore: 10, severity: 'LOW' }), reduced: false },
    ];
    expect(r.calculateTotalDebt(items)).toBe(10);
  });

  it('26: severity MEDIUM multiplier is 2', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const items: DebtItemWithStatus[] = [
      { ...makeDebt({ impactScore: 10, severity: 'MEDIUM' }), reduced: false },
    ];
    expect(r.calculateTotalDebt(items)).toBe(20);
  });

  it('27: severity HIGH multiplier is 3', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const items: DebtItemWithStatus[] = [
      { ...makeDebt({ impactScore: 10, severity: 'HIGH' }), reduced: false },
    ];
    expect(r.calculateTotalDebt(items)).toBe(30);
  });

  it('28: prioritizeReduction handles zero effort hours', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const items: DebtItemWithStatus[] = [
      { ...makeDebt({ debtId: 'd1', impactScore: 10, estimatedEffortHours: 0 }), reduced: false },
    ];
    const prioritized = r.prioritizeReduction(items);
    expect(prioritized).toHaveLength(1);
  });

  it('29: getItems returns copy', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1' }));
    const items = r.getItems();
    items.pop();
    expect(r.getItems()).toHaveLength(1);
  });

  it('30: generateDebtReport with empty reducer', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const report = r.generateDebtReport();
    expect(report.totalItems).toBe(0);
    expect(report.activeItems).toBe(0);
    expect(report.reducedItems).toBe(0);
    expect(report.totalDebtScore).toBe(0);
    expect(report.trend).toBe('STABLE');
  });

  it('31: all debt categories are tracked', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const categories: DebtCategory[] = ['CODE_SMELL', 'DUPLICATION', 'COMPLEXITY', 'OUTDATED_API', 'MISSING_TESTS', 'DOCUMENTATION'];
    for (const cat of categories) {
      r.registerDebtItem(makeDebt({ debtId: `d-${cat}`, category: cat }));
    }
    const report = r.generateDebtReport();
    for (const cat of categories) {
      expect(report.itemsByCategory[cat]).toBe(1);
    }
  });

  it('32: markAsReduced then calculateTotalDebt excludes it', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1', impactScore: 10, severity: 'HIGH' }));
    r.registerDebtItem(makeDebt({ debtId: 'd2', impactScore: 5, severity: 'LOW' }));
    r.markAsReduced('d1');
    const total = r.calculateTotalDebt(r.getItems());
    expect(total).toBe(5);
  });

  it('33: all severity levels are tracked', () => {
    const r = new AutonomousTechnicalDebtReducer();
    r.registerDebtItem(makeDebt({ debtId: 'd1', severity: 'LOW' }));
    r.registerDebtItem(makeDebt({ debtId: 'd2', severity: 'MEDIUM' }));
    r.registerDebtItem(makeDebt({ debtId: 'd3', severity: 'HIGH' }));
    const report = r.generateDebtReport();
    expect(report.itemsBySeverity.LOW).toBe(1);
    expect(report.itemsBySeverity.MEDIUM).toBe(1);
    expect(report.itemsBySeverity.HIGH).toBe(1);
  });

  it('34: calculateTotalDebt with empty array returns 0', () => {
    const r = new AutonomousTechnicalDebtReducer();
    expect(r.calculateTotalDebt([])).toBe(0);
  });

  it('35: getDebtTrend with only reduced items returns IMPROVING', () => {
    const r = new AutonomousTechnicalDebtReducer();
    const items: DebtItemWithStatus[] = [
      { ...makeDebt({ impactScore: 5 }), reduced: true },
    ];
    expect(r.getDebtTrend(items)).toBe('IMPROVING');
  });
});
