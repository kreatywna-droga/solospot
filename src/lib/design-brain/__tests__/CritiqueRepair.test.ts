import { describe, it, expect } from 'vitest';
import {
  runDesignCritique, runRepairLoop, checkVisualRegression,
  CRITIC_QUESTIONS, REPAIR_MAX_ITERATIONS_CAP, REPAIR_DEFAULT_ITERATIONS,
} from '../CritiqueRepair';
import { mkIssue } from '../CompositionEngines';
import { notExecutedQa } from '../VisualQA';
import type { DesignIssue, QADimensions } from '../types';

const cleanQa: QADimensions = {
  typography: 'PASS', composition: 'PASS', responsive: 'PASS', consistency: 'PASS',
  accessibility: 'PASS', content: 'PASS', ux: 'PASS', businessGoal: 'PASS',
  antiGeneric: 'PASS', evidence: {},
};

function openIssue(idHint: string, capability: DesignIssue['repairCapability'] = 'auto'): DesignIssue {
  const i = mkIssue('HIGH', 'spacing', idHint, `evidence-${idHint}`, 'fix it', capability, 're-audit');
  return { ...i, issueId: `fixed-${idHint}` };
}

describe('DesignCritic', () => {
  it('has exactly 13 questions', () => {
    expect(CRITIC_QUESTIONS).toHaveLength(13);
  });

  it('returns all NOT_EXECUTED when critique not executed', () => {
    const c = runDesignCritique({ executed: false });
    expect(c.findings).toHaveLength(13);
    expect(c.findings.every((f) => f.answer === 'NOT_EXECUTED')).toBe(true);
    expect(c.repairable).toHaveLength(0);
    expect(c.summary).toMatch(/NOT_EXECUTED/);
  });

  it('produces PASS/ISSUE findings when executed with composition issues', () => {
    const c = runDesignCritique({
      executed: true,
      composition: {
        hierarchy: 'weak', balance: 'balanced', alignment: 'mostly',
        visualWeight: 'even', whitespace: 'adequate', density: 'balanced',
        focalPoint: 'missing', rhythm: 'regular',
        issues: [mkIssue('BLOCKING', 'composition', 'hero', 'no focal', 'add hero', 'suggest', 'hero present')],
        recommendations: [],
      },
      antiGenericIssues: [mkIssue('MEDIUM', 'anti-generic', 'page', '3 gradients', 'reduce', 'suggest', '≤1')],
    });
    expect(c.findings.some((f) => f.answer === 'ISSUE')).toBe(true);
    expect(c.repairable.length).toBeGreaterThan(0);
    expect(c.summary).toMatch(/ISSUE/);
  });
});

describe('RepairLoop', () => {
  it('stops clean when no issues', async () => {
    const r = await runRepairLoop([], cleanQa, {});
    expect(r.stoppedReason).toBe('clean');
    expect(r.iterations).toHaveLength(0);
  });

  it('stops blocked when issues exist but no executor (no fake success)', async () => {
    const r = await runRepairLoop([openIssue('a')], notExecutedQa('start'), {});
    expect(r.stoppedReason).toBe('blocked');
    expect(r.finalIssues.length).toBe(1);
  });

  it('respects hard max-iterations cap', async () => {
    expect(REPAIR_MAX_ITERATIONS_CAP).toBeLessThanOrEqual(5);
    expect(REPAIR_DEFAULT_ITERATIONS).toBeLessThanOrEqual(REPAIR_MAX_ITERATIONS_CAP);

    let calls = 0;
    const r = await runRepairLoop(
      [openIssue('persist')],
      notExecutedQa('x'),
      {
        maxIterations: 99,
        applyRepairs: (issues) => {
          calls++;
          // never actually clears — simulates non-progress then slight change
          return { issues: issues.map((i, idx) => ({ ...i, issueId: `${i.issueId}-${idx}-${calls}` })), qa: notExecutedQa(`iter${calls}`) };
        },
      },
    );
    expect(r.maxIterations).toBe(REPAIR_MAX_ITERATIONS_CAP);
    expect(r.iterations.length).toBeLessThanOrEqual(REPAIR_MAX_ITERATIONS_CAP);
    expect(calls).toBeLessThanOrEqual(REPAIR_MAX_ITERATIONS_CAP);
    expect(['max-iterations', 'no-progress', 'blocked', 'unchanged'].includes(r.stoppedReason) || r.stoppedReason === 'no-progress').toBe(true);
  });

  it('stops no-progress when iteration unchanged', async () => {
    const start = [openIssue('same')];
    const r = await runRepairLoop(start, notExecutedQa('x'), {
      maxIterations: 3,
      applyRepairs: (issues) => ({ issues, qa: notExecutedQa('same') }),
    });
    expect(r.iterations).toHaveLength(1);
    expect(r.stoppedReason).toBe('no-progress');
  });

  it('reaches clean when executor clears issues', async () => {
    const r = await runRepairLoop(
      [openIssue('gone'), openIssue('gone2')],
      notExecutedQa('x'),
      { applyRepairs: () => ({ issues: [], qa: cleanQa }) },
    );
    expect(r.stoppedReason).toBe('clean');
    expect(r.finalIssues).toHaveLength(0);
    expect(r.iterations[0].verification).toBe('improved');
  });
});

describe('VisualRegression', () => {
  it('PASS when structure preserved and target issues resolved', () => {
    const beforeIssues = [mkIssue('HIGH', 'spacing', 's1', 'e', 'r', 'auto', 'v')];
    const report = checkVisualRegression(
      { structure: ['navbar', 'hero', 'footer'], issues: beforeIssues },
      { structure: ['navbar', 'hero', 'footer'], issues: [] },
      [beforeIssues[0].issueId],
    );
    expect(report.verdict).toBe('PASS');
    expect(report.structurePreserved).toBe(true);
    expect(report.targetImproved).toBe(true);
  });

  it('REGRESSION when structure changes', () => {
    const report = checkVisualRegression(
      { structure: ['navbar', 'hero', 'footer'], issues: [] },
      { structure: ['navbar', 'footer'], issues: [] },
      [],
    );
    expect(report.verdict).toBe('REGRESSION');
    expect(report.structurePreserved).toBe(false);
  });

  it('REGRESSION when serious unrelated issues appear', () => {
    const report = checkVisualRegression(
      { structure: ['a', 'b'], issues: [] },
      { structure: ['a', 'b'], issues: [mkIssue('BLOCKING', 'ux', 'new', 'broken', 'fix', 'auto', 'v')] },
      ['target-1'],
    );
    expect(report.unrelatedChanges.length).toBeGreaterThan(0);
    expect(report.verdict).toBe('REGRESSION');
  });
});
