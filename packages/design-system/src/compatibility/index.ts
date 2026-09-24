/**
 * Compatibility Engine — Style Compatibility Analysis
 *
 * Provides compatibility checking between design system elements.
 */

import type { CompatibilityReport } from '../types';

/** Pairwise rule used by the engine (distinct from catalog-item CompatibilityRule). */
export interface PairwiseCompatibilityRule {
  id: string;
  sourceCategory: string;
  sourceId: string;
  targetCategory: string;
  targetId: string;
  relation: 'compatible' | 'recommended' | 'incompatible' | 'warned';
  reason: string;
  severity: 'info' | 'warning' | 'error';
}

export interface CompatibilityEngine {
  rules: PairwiseCompatibilityRule[];
  check(sourceId: string, targetId: string): PairwiseCompatibilityRule | null;
  checkAll(sourceId: string): PairwiseCompatibilityRule[];
  getCompatibilityScore(sourceId: string, targetIds: string[]): number;
  generateReport(itemId: string): CompatibilityReport;
}

export function createCompatibilityEngine(rules: PairwiseCompatibilityRule[]): CompatibilityEngine {
  return {
    rules,
    check(sourceId: string, targetId: string): PairwiseCompatibilityRule | null {
      return this.rules.find(
        (r) => r.sourceId === sourceId && r.targetId === targetId
      ) || null;
    },
    checkAll(sourceId: string): PairwiseCompatibilityRule[] {
      return this.rules.filter((r) => r.sourceId === sourceId);
    },
    getCompatibilityScore(sourceId: string, targetIds: string[]): number {
      const rules = this.checkAll(sourceId);
      if (rules.length === 0) return 100;
      const compatible = rules.filter((r) => r.relation === 'compatible' || r.relation === 'recommended').length;
      const incompatible = rules.filter((r) => r.relation === 'incompatible').length;
      const warned = rules.filter((r) => r.relation === 'warned').length;
      return Math.round(((compatible - incompatible * 2 - warned * 0.5) / rules.length) * 100);
    },
    generateReport(itemId: string): CompatibilityReport {
      const rules = this.checkAll(itemId);
      const compatible = rules.filter((r) => r.relation === 'compatible' || r.relation === 'recommended').map((r) => r.targetId);
      const incompatible = rules.filter((r) => r.relation === 'incompatible').map((r) => r.targetId);
      const warnings = rules.filter((r) => r.relation === 'warned').map((r) => ({
        type: 'suboptimal' as const,
        message: r.reason,
        relatedItemId: r.targetId,
      }));
      const score = this.getCompatibilityScore(itemId, rules.map((r) => r.targetId));
      return {
        itemId,
        checkedAgainst: rules.map((r) => r.targetId),
        compatible,
        incompatible,
        warnings,
        score,
      };
    },
  };
}

// Default compatibility rules
export const defaultCompatibilityRules: PairwiseCompatibilityRule[] = [
  {
    id: 'rule-001',
    sourceCategory: 'typography',
    sourceId: 'typography-modern-minimal',
    targetCategory: 'color-palette',
    targetId: 'mono-black-white',
    relation: 'compatible',
    reason: 'Modern minimal typography pairs well with monochrome colors',
    severity: 'info',
  },
  {
    id: 'rule-002',
    sourceCategory: 'typography',
    sourceId: 'typography-luxury-editorial',
    targetCategory: 'color-palette',
    targetId: 'luxury-gold',
    relation: 'compatible',
    reason: 'Luxury editorial typography pairs well with gold accents',
    severity: 'info',
  },
  {
    id: 'rule-003',
    sourceCategory: 'button',
    sourceId: 'buttons-luxury',
    targetCategory: 'card',
    targetId: 'cards-luxury',
    relation: 'compatible',
    reason: 'Luxury buttons pair well with luxury cards',
    severity: 'info',
  },
  {
    id: 'rule-004',
    sourceCategory: 'button',
    sourceId: 'buttons-neon',
    targetCategory: 'background',
    targetId: 'background-dark',
    relation: 'compatible',
    reason: 'Neon buttons work well on dark backgrounds',
    severity: 'info',
  },
  {
    id: 'rule-005',
    sourceCategory: 'button',
    sourceId: 'buttons-brutalist',
    targetCategory: 'radius',
    targetId: 'radius-brutalist',
    relation: 'compatible',
    reason: 'Brutalist buttons pair well with brutalist radius',
    severity: 'info',
  },
  {
    id: 'rule-006',
    sourceCategory: 'card',
    sourceId: 'cards-glass',
    targetCategory: 'background',
    targetId: 'background-gradient',
    relation: 'compatible',
    reason: 'Glass cards work well on gradient backgrounds',
    severity: 'info',
  },
  {
    id: 'rule-007',
    sourceCategory: 'typography',
    sourceId: 'typography-bold-marketing',
    targetCategory: 'button',
    targetId: 'buttons-gradient',
    relation: 'compatible',
    reason: 'Bold marketing typography pairs well with gradient buttons',
    severity: 'info',
  },
  {
    id: 'rule-008',
    sourceCategory: 'typography',
    sourceId: 'typography-editorial-classic',
    targetCategory: 'card',
    targetId: 'cards-editorial',
    relation: 'compatible',
    reason: 'Editorial classic typography pairs well with editorial cards',
    severity: 'info',
  },
  {
    id: 'rule-009',
    sourceCategory: 'color-palette',
    sourceId: 'high-contrast-white-red',
    targetCategory: 'button',
    targetId: 'buttons-neon',
    relation: 'incompatible',
    reason: 'High contrast white-red palette may cause accessibility issues with neon buttons',
    severity: 'warning',
  },
  {
    id: 'rule-010',
    sourceCategory: 'radius',
    sourceId: 'radius-sharp',
    targetCategory: 'button',
    targetId: 'buttons-rounded',
    relation: 'warned',
    reason: 'Sharp radius with rounded buttons may look inconsistent',
    severity: 'warning',
  },
];

export const compatibilityEngine = createCompatibilityEngine(defaultCompatibilityRules);

export default compatibilityEngine;
