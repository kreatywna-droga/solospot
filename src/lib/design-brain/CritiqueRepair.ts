/**
 * CritiqueRepair.ts — Design Critic (19), Repair Loop (20), Visual Regression (21)
 *
 * Repair NEVER mutates BuilderDocument here. The executor callback performs
 * HACP tool calls; this module only orchestrates verification deltas.
 * Infinite loops are impossible: maxIterations is hard-capped.
 */

import type {
  DesignCritique, CritiqueFinding, DesignIssue, QADimensions, RepairIteration,
  RepairLoopResult, VisualRegressionReport, CompositionAnalysis, ConsistencyReport,
  ContentPlan, AccessibilityReport, UXReport, BusinessGoalReport, ResponsiveAuditReport,
} from './types';
import { sortIssues, mkIssue } from './CompositionEngines';
import { emitObservability } from './Observability';
import { issueCounts } from './VisualQA';

export const CRITIC_QUESTIONS = [
  'Is there one clear focal point in the first viewport?',
  'Does typography hierarchy make the reading order obvious?',
  'Is the primary CTA unmistakable and reachable?',
  'Do colors and text meet contrast expectations?',
  'Is spacing rhythm consistent with the Design Constitution?',
  'Does every image serve a defined art-direction role?',
  'Does content sequence answer user uncertainty before selling?',
  'Is navigation sufficient for the planned journeys?',
  'Are desktop/tablet/mobile rules defined and audited?',
  'Does the design avoid recognized anti-generic patterns?',
  'Is component styling consistent (radius/shadows/buttons)?',
  'Are trust signals present for this industry and goal?',
  'Is the design differentiated for this industry (not template-swap)?',
] as const;

export interface CritiqueInput {
  executed: boolean;
  composition?: CompositionAnalysis | null;
  consistency?: ConsistencyReport | null;
  contentPlan?: ContentPlan | null;
  accessibility?: AccessibilityReport | null;
  ux?: UXReport | null;
  businessGoal?: BusinessGoalReport | null;
  responsive?: ResponsiveAuditReport | null;
  antiGenericIssues?: DesignIssue[];
  extraIssues?: DesignIssue[];
}

export function runDesignCritique(input: CritiqueInput): DesignCritique {
  emitObservability('verification', 'critic', `Running design critique executed=${input.executed}`);
  const findings: CritiqueFinding[] = [];
  const all: DesignIssue[] = [];

  const q = (question: string, ok: boolean | null, issues: DesignIssue[]) => {
    const answer: CritiqueFinding['answer'] = ok === null ? 'NOT_EXECUTED' : ok ? 'PASS' : 'ISSUE';
    findings.push({ question, answer, issues });
    all.push(...issues);
  };

  if (!input.executed) {
    for (const question of CRITIC_QUESTIONS) {
      findings.push({ question, answer: 'NOT_EXECUTED', issues: [] });
    }
    return {
      findings,
      repairable: [],
      blocked: [],
      summary: 'Critique NOT_EXECUTED — no PASS claims without evidence.',
    };
  }

  const compIssues = input.composition?.issues || [];
  const focalOk = !compIssues.some((i) => i.target === 'hero' && i.category === 'composition');
  q(CRITIC_QUESTIONS[0], focalOk, compIssues.filter((i) => i.category === 'composition'));

  const hierIssues = compIssues.filter((i) => i.category === 'hierarchy');
  q(CRITIC_QUESTIONS[1], !hierIssues.length, hierIssues);

  const ctaIssues = compIssues.filter((i) => i.category === 'ux' || i.evidence.toLowerCase().includes('cta'));
  q(CRITIC_QUESTIONS[2], !ctaIssues.some((i) => i.severity === 'BLOCKING' || i.severity === 'HIGH'), ctaIssues);

  const a11yIssues = input.accessibility?.issues || [];
  q(CRITIC_QUESTIONS[3], (input.accessibility?.contrast !== 'REPAIR_REQUIRED'), a11yIssues.filter((i) => i.category === 'contrast' || i.category === 'color'));

  const consIssues = (input.consistency?.issues || []).map((ci) => mkIssue(
    ci.severity, 'component-consistency', ci.element,
    `expected=${ci.expected} actual=${ci.actual}`, ci.repairHint, 'auto',
    `${ci.element} matches constitution`, 'set_node_styles', {},
  ));
  q(CRITIC_QUESTIONS[4], !consIssues.length, consIssues);

  const imgIssues = compIssues.filter((i) => i.category === 'imagery');
  q(CRITIC_QUESTIONS[5], !imgIssues.some((i) => i.severity === 'BLOCKING'), imgIssues);

  const uxIssues = input.ux?.issues || [];
  q(CRITIC_QUESTIONS[6], input.ux?.contentSequence !== 'REPAIR_REQUIRED', uxIssues.filter((i) => i.evidence.toLowerCase().includes('sequence')));
  q(CRITIC_QUESTIONS[7], input.ux?.navigation !== 'REPAIR_REQUIRED', uxIssues.filter((i) => i.category === 'ux' && i.target === 'navigation'));

  const respIssues = [
    ...(input.responsive?.desktop.issues || []),
    ...(input.responsive?.tablet.issues || []),
    ...(input.responsive?.mobile.issues || []),
  ];
  const responsiveExecuted = !!input.responsive
    && input.responsive.desktop.status !== 'NOT_EXECUTED';
  q(CRITIC_QUESTIONS[8], responsiveExecuted ? respIssues.length === 0 : null, respIssues);

  const anti = input.antiGenericIssues || [];
  q(CRITIC_QUESTIONS[9], !anti.length, anti);

  const contentIssues = input.contentPlan?.issues || [];
  q(CRITIC_QUESTIONS[10], !consIssues.length && !contentIssues.filter((i) => i.category === 'component-consistency').length, contentIssues.filter((i) => i.category === 'component-consistency'));

  q(CRITIC_QUESTIONS[11], (input.ux?.trust !== 'REPAIR_REQUIRED'), uxIssues.filter((i) => i.target === 'trust'));

  const antiGenericPass = (input.antiGenericIssues || []).length === 0;
  q(CRITIC_QUESTIONS[12], antiGenericPass, input.antiGenericIssues || []);

  all.push(...(input.extraIssues || []));
  const unique = sortIssues(dedupe(all));
  const repairable = unique.filter((i) => i.repairCapability === 'auto' || i.repairCapability === 'suggest');
  const blocked = unique.filter((i) => i.repairCapability === 'blocked');

  const failed = findings.filter((f) => f.answer === 'ISSUE').length;
  const skipped = findings.filter((f) => f.answer === 'NOT_EXECUTED').length;
  void skipped;

  return {
    findings,
    repairable,
    blocked,
    summary: `Critique executed: ${findings.filter((f) => f.answer === 'PASS').length} PASS, ${failed} ISSUE, ${unique.length} unique issues (${repairable.length} repairable, ${blocked.length} blocked).`,
  };
}

function dedupe(issues: DesignIssue[]): DesignIssue[] {
  const seen = new Map<string, DesignIssue>();
  for (const i of issues) {
    const key = `${i.category}|${i.target}|${i.evidence.slice(0, 80)}`;
    if (!seen.has(key)) seen.set(key, i);
  }
  return [...seen.values()];
}

// ── Repair Loop (section 20) ───────────────────────────────────────

export interface RepairLoopOptions {
  maxIterations?: number;
  /** Apply repairs via HACP (injected). Return post-repair issue set + QA. */
  applyRepairs?: (issues: DesignIssue[]) =>
    | Promise<{ issues: DesignIssue[]; qa: QADimensions }>
    | { issues: DesignIssue[]; qa: QADimensions };
}

export const REPAIR_MAX_ITERATIONS_CAP = 5;
export const REPAIR_DEFAULT_ITERATIONS = 3;

export async function runRepairLoop(
  initialIssues: DesignIssue[],
  initialQa: QADimensions,
  options: RepairLoopOptions = {},
): Promise<RepairLoopResult> {
  const maxIterations = Math.max(1, Math.min(
    options.maxIterations ?? REPAIR_DEFAULT_ITERATIONS,
    REPAIR_MAX_ITERATIONS_CAP,
  ));
  emitObservability('repair', 'repair-loop', `Start issues=${initialIssues.length} max=${maxIterations}`);

  const iterations: RepairIteration[] = [];
  let currentIssues = sortIssues(initialIssues);
  let currentQa = initialQa;
  let stoppedReason: RepairLoopResult['stoppedReason'] = 'max-iterations';

  if (currentIssues.length === 0 || !hasRepairable(currentIssues)) {
    return {
      iterations,
      finalIssues: currentIssues,
      finalQa: currentQa,
      stoppedReason: currentIssues.length === 0 ? 'clean' : 'blocked',
      maxIterations,
    };
  }

  if (!options.applyRepairs) {
    return {
      iterations,
      finalIssues: currentIssues,
      finalQa: currentQa,
      stoppedReason: 'blocked',
      maxIterations,
    };
  }

  for (let i = 1; i <= maxIterations; i++) {
    const beforeCount = currentIssues.length;
    const beforeQa = currentQa;
    const repairable = currentIssues.filter((x) => x.repairCapability !== 'blocked');

    const result = await options.applyRepairs(repairable);
    const afterIssues = sortIssues(result.issues);
    const afterQa = result.qa;
    const afterCount = afterIssues.length;

    let verification: RepairIteration['verification'];
    if (afterCount < beforeCount || improvedQa(beforeQa, afterQa)) verification = 'improved';
    else if (afterCount > beforeCount || regressedQa(beforeQa, afterQa)) verification = 'regressed';
    else verification = 'unchanged';

    iterations.push({
      iteration: i,
      before: { issueCount: beforeCount, qa: beforeQa },
      changes: repairable.filter((r) => !afterIssues.some((a) => a.issueId === r.issueId)),
      after: { issueCount: afterCount, qa: afterQa },
      verification,
    });

    currentIssues = afterIssues;
    currentQa = afterQa;

    if (currentIssues.length === 0) { stoppedReason = 'clean'; break; }
    if (verification === 'unchanged') {
      stoppedReason = i === 1 ? 'no-progress' : 'no-progress';
      break;
    }
    if (verification === 'regressed' && i >= 2) {
      stoppedReason = 'blocked';
      break;
    }
    if (!hasRepairable(currentIssues)) {
      stoppedReason = 'blocked';
      break;
    }
    if (i === maxIterations) stoppedReason = 'max-iterations';
  }

  emitObservability('repair', 'repair-loop', `Stop reason=${stoppedReason} final=${currentIssues.length}`);
  return {
    iterations,
    finalIssues: currentIssues,
    finalQa: currentQa,
    stoppedReason,
    maxIterations,
  };
}

function hasRepairable(issues: DesignIssue[]): boolean {
  return issues.some((i) => i.repairCapability === 'auto' || i.repairCapability === 'suggest');
}

const QA_ORDER: Record<string, number> = {
  NOT_EXECUTED: -1, PASS: 0, REPAIR_REQUIRED: 1, BLOCKED: 2,
};

function improvedQa(before: QADimensions, after: QADimensions): boolean {
  const keys = (['typography', 'composition', 'responsive', 'consistency', 'accessibility', 'content', 'ux', 'businessGoal', 'antiGeneric'] as const);
  let improved = false;
  for (const k of keys) {
    if (QA_ORDER[after[k]] < QA_ORDER[before[k]]) improved = true;
    if (QA_ORDER[after[k]] > QA_ORDER[before[k]]) return false;
  }
  return improved;
}

function regressedQa(before: QADimensions, after: QADimensions): boolean {
  const keys = (['typography', 'composition', 'responsive', 'consistency', 'accessibility', 'content', 'ux', 'businessGoal', 'antiGeneric'] as const);
  for (const k of keys) {
    if (QA_ORDER[after[k]] > QA_ORDER[before[k]]) return true;
  }
  return false;
}

// ── Visual Regression (section 21) ─────────────────────────────────

export function checkVisualRegression(
  before: { structure: string[]; issues: DesignIssue[] },
  after: { structure: string[]; issues: DesignIssue[] },
  targetIssueIds: string[],
): VisualRegressionReport {
  emitObservability('verification', 'visual-regression', `Compare structure ${before.structure.length}→${after.structure.length}`);

  const beforeSet = new Set(before.structure);
  const afterSet = new Set(after.structure);
  const structurePreserved =
    before.structure.length === after.structure.length
    && before.structure.every((s) => afterSet.has(s))
    && after.structure.every((s) => beforeSet.has(s));

  const targetSet = new Set(targetIssueIds);
  const targetImproved = after.issues.filter((i) => targetSet.has(i.issueId)).length
    < before.issues.filter((i) => targetSet.has(i.issueId)).length
    || (targetIssueIds.length > 0 && after.issues.filter((i) => targetSet.has(i.issueId)).length === 0);

  const beforeKeys = new Set(before.issues.map(issueKey));
  const unrelatedChanges = after.issues.filter((i) => !beforeKeys.has(issueKey(i)) && !targetSet.has(i.issueId));

  const structureBroke = !structurePreserved;
  const introducedSerious = unrelatedChanges.some((i) => i.severity === 'BLOCKING' || i.severity === 'HIGH');

  return {
    structureBefore: before.structure,
    structureAfter: after.structure,
    structurePreserved,
    targetImproved: targetIssueIds.length === 0 ? after.issues.length <= before.issues.length : targetImproved,
    unrelatedChanges,
    verdict: structureBroke || introducedSerious ? 'REGRESSION' : 'PASS',
  };
}

function issueKey(i: DesignIssue): string {
  return `${i.category}|${i.target}|${i.evidence.slice(0, 60)}`;
}

export function summarizeCounts(issues: DesignIssue[]): string {
  const c = issueCounts(issues);
  return `BLOCKING=${c.BLOCKING} HIGH=${c.HIGH} MEDIUM=${c.MEDIUM} LOW=${c.LOW}`;
}
