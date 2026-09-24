import { describe, it, expect } from 'vitest';
import {
  classifyObservation, buildVisualAudit, auditAccessibility, auditUX,
  mergeQaDimensions, notExecutedQa, contentQaFromPlan, issueCounts,
} from '../VisualQA';
import { mkIssue } from '../CompositionEngines';

describe('VisualQA — issue classifier', () => {
  it('maps category and severity hints', () => {
    const issue = classifyObservation({
      categoryHint: 'typography contrast',
      severityHint: 'high',
      target: 'hero',
      evidence: 'text contrast fail',
      repair: 'fix colors',
    });
    expect(issue.category).toBe('contrast');
    expect(issue.severity).toBe('HIGH');
    expect(issue.issueId).toMatch(/^di-/);
  });

  it('derives severity from evidence when hint missing', () => {
    const issue = classifyObservation({
      target: 'x', evidence: 'element missing on page',
    });
    expect(issue.severity).toBe('HIGH');
  });
});

describe('VisualQA — audit builder', () => {
  it('when not executed: all dimensions NOT_EXECUTED (no fake PASS)', () => {
    const audit = buildVisualAudit({ executed: false, evidence: [] });
    expect(audit.executed).toBe(false);
    expect(audit.qa.composition).toBe('NOT_EXECUTED');
    expect(audit.qa.accessibility).toBe('NOT_EXECUTED');
    expect(audit.qa.evidence.note?.[0]).toMatch(/not executed/i);
  });

  it('when executed with composition issues: REPAIR_REQUIRED not PASS', () => {
    const audit = buildVisualAudit({
      executed: true,
      evidence: ['plan sections=8'],
      composition: {
        hierarchy: 'weak', balance: 'balanced', alignment: 'mostly',
        visualWeight: 'even', whitespace: 'adequate', density: 'balanced',
        focalPoint: 'ambiguous', rhythm: 'regular',
        issues: [mkIssue('HIGH', 'hierarchy', 'hero', 'heading small', 'increase', 'auto', '≥40px')],
        recommendations: [],
      },
    });
    expect(audit.qa.composition).toBe('REPAIR_REQUIRED');
    expect(audit.qa.typography).toBe('REPAIR_REQUIRED');
  });

  it('when executed clean: composition PASS with evidence list', () => {
    const audit = buildVisualAudit({ executed: true, evidence: ['ok'] });
    expect(audit.qa.composition).toBe('PASS');
    expect(audit.qa.evidence.visualAudit).toEqual(['ok']);
  });
});

describe('VisualQA — accessibility & UX', () => {
  it('accessibility NOT_EXECUTED without observations', () => {
    const r = auditAccessibility({ executed: false });
    expect(r.contrast).toBe('NOT_EXECUTED');
    expect(r.issues).toHaveLength(0);
  });

  it('accessibility flags contrast and keyboard traps', () => {
    const r = auditAccessibility({
      executed: true, contrastFailures: 3, skipOrKeyboardTraps: true,
    });
    expect(r.contrast).toBe('REPAIR_REQUIRED');
    expect(r.keyboard).toBe('REPAIR_REQUIRED');
    expect(r.issues.some((i) => i.severity === 'BLOCKING')).toBe(true);
  });

  it('UX NOT_EXECUTED without observations; flags unclear CTA when executed', () => {
    expect(auditUX({ executed: false }).ctaClarity).toBe('NOT_EXECUTED');
    const r = auditUX({ executed: true, ctaUnclear: true, trustMissing: true });
    expect(r.ctaClarity).toBe('REPAIR_REQUIRED');
    expect(r.trust).toBe('REPAIR_REQUIRED');
  });
});

describe('VisualQA — merge & helpers', () => {
  it('merge prefers BLOCKED > REPAIR_REQUIRED > PASS > NOT_EXECUTED', () => {
    const merged = mergeQaDimensions([
      { ...notExecutedQa('a'), composition: 'PASS' },
      { ...notExecutedQa('b'), composition: 'REPAIR_REQUIRED' },
    ]);
    expect(merged.composition).toBe('REPAIR_REQUIRED');
    expect(merged.responsive).toBe('NOT_EXECUTED');
  });

  it('contentQaFromPlan honest about missing plan', () => {
    expect(contentQaFromPlan(null, true)).toBe('NOT_EXECUTED');
    expect(contentQaFromPlan(null, false)).toBe('NOT_EXECUTED');
  });

  it('issueCounts aggregates severities', () => {
    const c = issueCounts([
      mkIssue('BLOCKING', 'ux', 't', 'e', 'r', 'auto', 'v'),
      mkIssue('LOW', 'ux', 't', 'e', 'r', 'auto', 'v'),
    ]);
    expect(c.BLOCKING).toBe(1);
    expect(c.LOW).toBe(1);
  });
});
