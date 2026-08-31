/**
 * G1-213: Autonomous Technical Debt Reduction
 *
 * Tracks, prioritizes, and reduces technical debt across the platform.
 * Provides trend analysis and reduction reporting.
 */

export type DebtCategory =
  | 'CODE_SMELL'
  | 'DUPLICATION'
  | 'COMPLEXITY'
  | 'OUTDATED_API'
  | 'MISSING_TESTS'
  | 'DOCUMENTATION';

export type DebtSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TechnicalDebtItem {
  readonly debtId: string;
  readonly category: DebtCategory;
  readonly severity: DebtSeverity;
  readonly description: string;
  readonly estimatedEffortHours: number;
  readonly impactScore: number;
}

export interface DebtItemWithStatus extends TechnicalDebtItem {
  readonly reduced: boolean;
  readonly reducedAt?: number;
}

export type DebtTrend = 'IMPROVING' | 'STABLE' | 'WORSENING';

const SEVERITY_MULTIPLIER: Record<DebtSeverity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

export class AutonomousTechnicalDebtReducer {
  private items: Map<string, DebtItemWithStatus> = new Map();
  private history: { timestamp: number; totalScore: number }[] = [];

  registerDebtItem(item: TechnicalDebtItem): DebtItemWithStatus {
    const entry: DebtItemWithStatus = { ...item, reduced: false };
    this.items.set(item.debtId, entry);
    return entry;
  }

  getItems(): DebtItemWithStatus[] {
    return [...this.items.values()];
  }

  calculateTotalDebt(items: DebtItemWithStatus[]): number {
    return items
      .filter((i) => !i.reduced)
      .reduce(
        (total, item) =>
          total + item.impactScore * SEVERITY_MULTIPLIER[item.severity],
        0,
      );
  }

  prioritizeReduction(items: DebtItemWithStatus[]): DebtItemWithStatus[] {
    return [...items]
      .filter((i) => !i.reduced)
      .sort((a, b) => {
        const ratioA = a.impactScore / Math.max(a.estimatedEffortHours, 0.1);
        const ratioB = b.impactScore / Math.max(b.estimatedEffortHours, 0.1);
        return ratioB - ratioA;
      });
  }

  markAsReduced(debtId: string): boolean {
    const item = this.items.get(debtId);
    if (!item || item.reduced) return false;
    this.items.set(debtId, { ...item, reduced: true, reducedAt: Date.now() });
    this.history.push({ timestamp: Date.now(), totalScore: this.calculateTotalDebt(this.getItems()) });
    return true;
  }

  getDebtTrend(items: DebtItemWithStatus[]): DebtTrend {
    const active = items.filter((i) => !i.reduced);
    const reduced = items.filter((i) => i.reduced);
    const activeScore = active.reduce(
      (sum, i) => sum + i.impactScore * SEVERITY_MULTIPLIER[i.severity],
      0,
    );
    const reducedScore = reduced.reduce(
      (sum, i) => sum + i.impactScore * SEVERITY_MULTIPLIER[i.severity],
      0,
    );
    if (reducedScore > activeScore) return 'IMPROVING';
    if (reducedScore === 0 && active.length > 0) return 'WORSENING';
    return 'STABLE';
  }

  getScoreHistory(): { timestamp: number; totalScore: number }[] {
    return [...this.history];
  }

  generateDebtReport(): {
    totalItems: number;
    activeItems: number;
    reducedItems: number;
    totalDebtScore: number;
    trend: DebtTrend;
    itemsByCategory: Record<DebtCategory, number>;
    itemsBySeverity: Record<DebtSeverity, number>;
    prioritizedReduction: DebtItemWithStatus[];
  } {
    const allItems = this.getItems();
    const active = allItems.filter((i) => !i.reduced);
    const reduced = allItems.filter((i) => i.reduced);

    const itemsByCategory = {} as Record<DebtCategory, number>;
    const itemsBySeverity = {} as Record<DebtSeverity, number>;

    for (const cat of ['CODE_SMELL', 'DUPLICATION', 'COMPLEXITY', 'OUTDATED_API', 'MISSING_TESTS', 'DOCUMENTATION'] as DebtCategory[]) {
      itemsByCategory[cat] = active.filter((i) => i.category === cat).length;
    }
    for (const sev of ['LOW', 'MEDIUM', 'HIGH'] as DebtSeverity[]) {
      itemsBySeverity[sev] = active.filter((i) => i.severity === sev).length;
    }

    return {
      totalItems: allItems.length,
      activeItems: active.length,
      reducedItems: reduced.length,
      totalDebtScore: this.calculateTotalDebt(allItems),
      trend: this.getDebtTrend(allItems),
      itemsByCategory,
      itemsBySeverity,
      prioritizedReduction: this.prioritizeReduction(allItems),
    };
  }
}
