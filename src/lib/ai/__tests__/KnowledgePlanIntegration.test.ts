import { describe, expect, it } from 'vitest';
import { buildDecisionContext } from '../../knowledge';
import { generateSitePlan } from '../SitePlanPlanner';

const DENTIST_BRIEF =
  'Zbuduj profesjonalną stronę dla nowoczesnego gabinetu dentystycznego specjalizującego się w implantologii i stomatologii estetycznej. Głównym celem strony jest zachęcenie pacjenta do umówienia wizyty.';

describe('SitePlanPlanner + Knowledge integration', () => {
  it('dental decision context drives knowledge-informed plan metadata', () => {
    const plan = generateSitePlan(DENTIST_BRIEF);
    const meta = plan.metadata.knowledge;
    expect(meta).toBeTruthy();
    expect(meta!.schemaVersion).toBe('1.0.0');
    expect(meta!.industryPatternId).toBeTruthy();
    expect(String(meta!.industryPatternId!.toLowerCase())).toContain('dental');
    expect(meta!.blueprintId).toBe('BP-dental-clinic');
    expect(meta!.qaCheckCount).toBeGreaterThanOrEqual(8);
    expect(meta!.antiPatternCount).toBeGreaterThanOrEqual(4);
    expect(meta!.retrievalLog.length).toBeGreaterThan(0);
    expect(meta!.entryIds.length).toBeGreaterThan(0);
    expect(meta!.entryIds.length).toBeLessThanOrEqual(12);
  });

  it('plan uses knowledge CTA / content density when pattern provides them', () => {
    const plan = generateSitePlan(DENTIST_BRIEF);
    expect(plan.conversionStrategy.primaryCTA).toMatch(/wizyt/i);
    expect(['lean', 'moderate', 'rich']).toContain(plan.contentStrategy.contentDensity);
    expect(['dental', 'dentist']).toContain(plan.industry);
    expect(plan.sections.length).toBeGreaterThanOrEqual(4);
    expect(plan.metadata.plannerType).toBe('deterministic');
  });

  it('plan remains deterministic and does not claim execution (knowledge ≠ execution)', () => {
    const plan = generateSitePlan(DENTIST_BRIEF);
    const serialized = JSON.stringify(plan);
    expect(serialized).not.toContain('batch_execute');
    expect(serialized).not.toContain('Wykonano');
    expect(plan.metadata.knowledge?.retrievalLog.every((l) => typeof l === 'string')).toBe(true);
  });

  it('retrieval context for dentist matches plan metadata (no fake knowledge)', () => {
    const ctx = buildDecisionContext(DENTIST_BRIEF, 'dental', 'booking');
    const plan = generateSitePlan(DENTIST_BRIEF);
    expect(plan.metadata.knowledge!.industryPatternId).toBe(ctx.industryPattern?.id);
    expect(plan.metadata.knowledge!.blueprintId).toBe(ctx.blueprint?.id);
  });

  it('non-dental brief still plans with null-safe knowledge (or matching other pattern)', () => {
    const plan = generateSitePlan('Strona portfolio fotografa ślubnego — galeria i kontakt.');
    expect(plan.sections.length).toBeGreaterThan(0);
    if (plan.metadata.knowledge) {
      expect(plan.metadata.knowledge.schemaVersion).toBe('1.0.0');
    }
  });
});
