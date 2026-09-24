/**
 * DesignBrainPlanIntegration.test.ts
 *
 * Proves Design Brain decisions are soft-attached to SitePlan via
 * generateLLMSitePlan without breaking Knowledge baseline or claiming
 * execution (Knowledge ≠ Execution; Design Brain never executes).
 */
import { describe, expect, it } from 'vitest';
import { generateLLMSitePlan } from '../LLMSitePlanner';
import { generateSitePlan } from '../SitePlanPlanner';
import { runDesignBrain, summarizeDesignBrain } from '../../design-brain';

const DENTIST_BRIEF =
  'Zbuduj profesjonalną stronę dla nowoczesnego gabinetu dentystycznego specjalizującego się w implantologii i stomatologii estetycznej. Głównym celem strony jest zachęcenie pacjenta do umówienia wizyty.';

describe('DesignBrain ↔ SitePlan integration', () => {
  it('generateLLMSitePlan attaches designBrain provenance (soft)', async () => {
    const { plan } = await generateLLMSitePlan(DENTIST_BRIEF);
    expect(plan.metadata.designBrain).toBeTruthy();
    expect(plan.metadata.designBrainStatus).toMatch(/COMPLETE|PARTIAL|BLOCKED|CLARIFY|FAILED/);
    expect(plan.metadata.designBrainVersion).toBe('1.0.0');
    // Knowledge baseline preserved
    expect(plan.metadata.knowledge?.schemaVersion).toBe('1.0.0');
    expect(plan.metadata.knowledge?.blueprintId).toBe('BP-dental-clinic');
    expect(plan.metadata.plannerType).toBe('deterministic');
  }, 30000);

  it('attach does not claim execution or mutate via HacpBridge', async () => {
    const { plan } = await generateLLMSitePlan(DENTIST_BRIEF);
    const serialized = JSON.stringify(plan);
    expect(serialized).not.toContain('batch_execute');
    expect(serialized).not.toContain('Wykonano');
    // summary is provenance only — no execution claims in plannerType/phase wording
    expect(plan.metadata.designBrain).toContain('[DesignBrain]');
    expect(String(plan.metadata.designBrain)).not.toMatch(/Wykonano|batch_execute|mutated=true/i);
  }, 30000);

  it('runDesignBrain produces structured decisions for dental brief', async () => {
    const brain = await runDesignBrain(DENTIST_BRIEF, { projectId: 'integration-test' });
    expect(brain.status).toMatch(/COMPLETE|PARTIAL/);
    expect(brain.direction.visualStyle).toBeTruthy();
    expect(brain.architecture.pages.length).toBeGreaterThanOrEqual(1);
    expect(brain.sitePlan.sections.length).toBeGreaterThanOrEqual(3);
    const summary = summarizeDesignBrain(brain);
    expect(summary).toContain('[DesignBrain]');
    expect(summary).toContain('status=');
    expect(brain.qa.typography).not.toBe('NOT_EXECUTED');
  }, 30000);

  it('deterministic planner still works standalone (knowledge SSOT)', () => {
    const plan = generateSitePlan(DENTIST_BRIEF);
    expect(plan.metadata.knowledge?.blueprintId).toBe('BP-dental-clinic');
    expect(plan.metadata.designBrain).toBeUndefined();
  });
});
