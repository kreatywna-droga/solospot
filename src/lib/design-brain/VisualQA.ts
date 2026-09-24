/**
 * VisualQA.ts — Visual Audit Engine (17), Issue Classifier (18),
 * Accessibility (27), UX Audit (28).
 *
 * Pipeline: BUILD → RENDER → SCREENSHOT → ANALYZE → CLASSIFY → REPAIR
 * (REPAIR delegated to CritiqueRepair / HACP — never direct mutation here).
 *
 * NO MUTATION = NO SUCCESS: if audits were not executed, dimensions stay
 * NOT_EXECUTED — never report PASS without evidence.
 */

import type {
  VisualAuditReport, DesignIssue, DesignIssueCategory, DesignIssueSeverity,
  QADimensions, QADimensionStatus, AccessibilityReport, UXReport, CompositionAnalysis,
  ConsistencyReport, ContentPlan, ContentLayoutReport, DesignCritique,
} from './types';
import { mkIssue, sortIssues } from './CompositionEngines';
import { emitObservability } from './Observability';

// ── Issue Classifier (section 18) ──────────────────────────────────

export interface RawObservation {
  categoryHint?: string;
  severityHint?: string;
  target: string;
  evidence: string;
  repair?: string;
  repairCapability?: DesignIssue['repairCapability'];
  verificationMethod?: string;
  fixTool?: string;
  fixArgs?: Record<string, unknown>;
}

const CATEGORY_MAP: Record<string, DesignIssueCategory> = {
  typography: 'typography',
  font: 'typography',
  type: 'typography',
  spacing: 'spacing',
  padding: 'spacing',
  margin: 'spacing',
  hierarchy: 'hierarchy',
  composition: 'composition',
  layout: 'composition',
  align: 'alignment',
  alignment: 'alignment',
  color: 'color',
  contrast: 'contrast',
  image: 'imagery',
  imagery: 'imagery',
  media: 'imagery',
  component: 'component-consistency',
  consistency: 'component-consistency',
  responsive: 'responsiveness',
  mobile: 'responsiveness',
  tablet: 'responsiveness',
  density: 'visual-density',
  content: 'content',
  copy: 'content',
  ux: 'ux',
  conversion: 'ux',
  cta: 'ux',
  accessibility: 'accessibility',
  a11y: 'accessibility',
  alt: 'accessibility',
  generic: 'anti-generic',
  template: 'anti-generic',
  compatibility: 'compatibility',
  business: 'business-goal',
  goal: 'business-goal',
};

const SEVERITY_MAP: Record<string, DesignIssueSeverity> = {
  critical: 'BLOCKING',
  blocking: 'BLOCKING',
  high: 'HIGH',
  warning: 'MEDIUM',
  medium: 'MEDIUM',
  info: 'LOW',
  low: 'LOW',
};

/** Priority order: more specific category wins over broad ones. */
const CATEGORY_PRIORITY: DesignIssueCategory[] = [
  'accessibility', 'contrast', 'compatibility', 'anti-generic', 'business-goal',
  'responsiveness', 'visual-density', 'component-consistency', 'hierarchy',
  'alignment', 'imagery', 'typography', 'spacing', 'color', 'content', 'ux', 'composition',
];

export function classifyObservation(obs: RawObservation): DesignIssue {
  const catKey = (obs.categoryHint || '').toLowerCase();
  const evidenceKey = (obs.evidence || '').toLowerCase();
  const source = catKey || evidenceKey;
  let category: DesignIssueCategory = 'composition';
  for (const cand of CATEGORY_PRIORITY) {
    const key = Object.entries(CATEGORY_MAP).find(([, v]) => v === cand)?.[0];
    if (key && source.includes(key)) { category = cand; break; }
  }
  // Fallback: map-style keyword scan for keys not in priority list
  if (category === 'composition') {
    for (const [k, v] of Object.entries(CATEGORY_MAP)) {
      if (source.includes(k)) { category = v; break; }
    }
  }
  const sevKey = (obs.severityHint || '').toLowerCase();
  const severity: DesignIssueSeverity = SEVERITY_MAP[sevKey] || severityFromCategory(category, obs.evidence);

  return mkIssue(
    severity,
    category,
    obs.target,
    obs.evidence,
    obs.repair || 'Repair per design constitution and knowledge rule',
    obs.repairCapability || (severity === 'BLOCKING' ? 'suggest' : 'auto'),
    obs.verificationMethod || 're-run visual audit on same evidence surface',
    obs.fixTool,
    obs.fixArgs,
  );
}

function severityFromCategory(category: DesignIssueCategory, evidence: string): DesignIssueSeverity {
  const e = evidence.toLowerCase();
  if (e.includes('missing') || e.includes('empty') || e.includes('broken')) return 'HIGH';
  if (category === 'accessibility' || category === 'contrast') return 'HIGH';
  if (category === 'anti-generic' || category === 'visual-density') return 'MEDIUM';
  return 'MEDIUM';
}

export function classifyObservations(obs: RawObservation[]): DesignIssue[] {
  return sortIssues(obs.map(classifyObservation));
}

// ── Visual Audit Engine (section 17) ───────────────────────────────

export interface VisualAuditInput {
  executed: boolean;
  evidence: string[];
  composition?: CompositionAnalysis | null;
  consistency?: ConsistencyReport | null;
  contentPlan?: ContentPlan | null;
  contentLayout?: ContentLayoutReport | null;
  responsiveIssues?: DesignIssue[];
  accessibilityIssues?: DesignIssue[];
  uxIssues?: DesignIssue[];
  antiGenericIssues?: DesignIssue[];
  extraIssues?: DesignIssue[];
}

export function buildVisualAudit(input: VisualAuditInput): VisualAuditReport {
  emitObservability('verification', 'visual-audit', `Building visual audit executed=${input.executed}`);

  const empty = (): DesignIssue[] => [];
  const categories: Record<DesignIssueCategory, DesignIssue[]> = {
    typography: empty(), spacing: empty(), hierarchy: empty(), composition: empty(),
    alignment: empty(), color: empty(), contrast: empty(), imagery: empty(),
    'component-consistency': empty(), responsiveness: empty(), 'visual-density': empty(),
    content: empty(), ux: empty(), accessibility: empty(), 'anti-generic': empty(),
    compatibility: empty(), 'business-goal': empty(),
  };

  const add = (issues: DesignIssue[]) => {
    for (const i of issues) {
      (categories[i.category] ||= []).push(i);
    }
  };

  if (input.executed) {
    add(input.composition?.issues || []);
    add((input.consistency?.issues || []).map((ci) => mkIssue(
      ci.severity,
      ci.element.toLowerCase().includes('font') ? 'typography' : 'component-consistency',
      ci.element,
      `expected=${ci.expected} actual=${ci.actual}`,
      ci.repairHint,
      ci.severity === 'BLOCKING' ? 'suggest' : 'auto',
      `observed ${ci.element} matches constitution`,
      'set_node_styles',
      {},
    )));
    add(input.contentPlan?.issues || []);
    add((input.contentLayout?.issues || []).map((cl) => mkIssue(
      cl.type === 'cta-buried' ? 'HIGH' : 'MEDIUM',
      'content',
      cl.target,
      cl.evidence,
      cl.suggestion,
      'suggest',
      'content fits layout without reflow issues',
      'update_node_props',
      {},
    )));
    add(input.responsiveIssues || []);
    add(input.accessibilityIssues || []);
    add(input.uxIssues || []);
    add(input.antiGenericIssues || []);
    add(input.extraIssues || []);
  }

  const allIssues = sortIssues(Object.values(categories).flat());
  const qa = deriveVisualQa(input.executed, allIssues, input);

  return {
    timestamp: new Date().toISOString(),
    categories,
    allIssues,
    qa,
    executed: input.executed,
    evidence: input.evidence,
  };
}

function deriveVisualQa(executed: boolean, issues: DesignIssue[], input: VisualAuditInput): QADimensions {
  if (!executed) {
    return {
      typography: 'NOT_EXECUTED', composition: 'NOT_EXECUTED', responsive: 'NOT_EXECUTED',
      consistency: 'NOT_EXECUTED', accessibility: 'NOT_EXECUTED', content: 'NOT_EXECUTED',
      ux: 'NOT_EXECUTED', businessGoal: 'NOT_EXECUTED', antiGeneric: 'NOT_EXECUTED',
      evidence: { note: ['visual audit not executed — no PASS claim'] },
    };
  }
  const byCat = (cats: DesignIssueCategory[]): QADimensionStatus => {
    const hits = issues.filter((i) => cats.includes(i.category));
    if (hits.length > 0) return 'REPAIR_REQUIRED';
    return 'PASS';
  };
  const has = (v: QADimensionStatus | undefined) => v === 'PASS' ? 'PASS' : v === undefined || v === 'NOT_EXECUTED' ? 'NOT_EXECUTED' : v;

  return {
    typography: byCat(['typography', 'hierarchy']),
    composition: byCat(['composition', 'alignment', 'spacing', 'visual-density', 'hierarchy']),
    responsive: has(input.responsiveIssues ? (input.responsiveIssues.length ? 'REPAIR_REQUIRED' : 'PASS') : undefined),
    consistency: has(input.consistency ? (input.consistency.overall === 'PASS' ? 'PASS' : input.consistency.overall === 'BLOCKED' ? 'REPAIR_REQUIRED' : 'REPAIR_REQUIRED') : undefined),
    accessibility: has(input.accessibilityIssues ? (input.accessibilityIssues.length ? 'REPAIR_REQUIRED' : 'PASS') : undefined),
    content: byCat(['content']),
    ux: has(input.uxIssues ? (input.uxIssues.length ? 'REPAIR_REQUIRED' : 'PASS') : undefined),
    businessGoal: 'NOT_EXECUTED',
    antiGeneric: has(input.antiGenericIssues ? (input.antiGenericIssues.length ? 'REPAIR_REQUIRED' : 'PASS') : undefined),
    evidence: {
      visualAudit: input.evidence.length ? input.evidence : ['executed without captured evidence strings'],
      issues: issues.map((i) => i.issueId),
    },
  };
}

export function notExecutedQa(note: string): QADimensions {
  return {
    typography: 'NOT_EXECUTED', composition: 'NOT_EXECUTED', responsive: 'NOT_EXECUTED',
    consistency: 'NOT_EXECUTED', accessibility: 'NOT_EXECUTED', content: 'NOT_EXECUTED',
    ux: 'NOT_EXECUTED', businessGoal: 'NOT_EXECUTED', antiGeneric: 'NOT_EXECUTED',
    evidence: { note: [note] },
  };
}

// ── Accessibility Audit (section 27) ───────────────────────────────

export interface AccessibilityObservations {
  executed: boolean;
  contrastFailures?: number;
  bodyTextTooSmall?: boolean;
  headingOrderSkips?: boolean;
  buttonsWithoutLabel?: boolean;
  imagesWithoutAltIntent?: boolean;
  targetsBelow44?: boolean;
  skipOrKeyboardTraps?: boolean;
  landmarksMissing?: boolean;
}

export function auditAccessibility(o: AccessibilityObservations): AccessibilityReport {
  emitObservability('verification', 'accessibility', `Accessibility audit executed=${o.executed}`);
  const issues: DesignIssue[] = [];
  const st = (fail: boolean | undefined): QADimensionStatus => {
    if (!o.executed) return 'NOT_EXECUTED';
    return fail ? 'REPAIR_REQUIRED' : 'PASS';
  };

  if (o.executed) {
    if (o.contrastFailures) {
      issues.push(mkIssue('HIGH', 'contrast', 'page', `${o.contrastFailures} contrast failures (<4.5:1)`, 'Adjust text/surface colors to meet WCAG AA', 'auto', 'contrast ratio ≥4.5:1', 'update_theme', {}));
    }
    if (o.bodyTextTooSmall) {
      issues.push(mkIssue('HIGH', 'typography', 'body', 'Body text below 16px', 'Set body ≥16px', 'auto', 'body ≥16px', 'set_node_styles', {}));
    }
    if (o.headingOrderSkips) {
      issues.push(mkIssue('MEDIUM', 'accessibility', 'headings', 'Heading levels skipped', 'Restore H1→H2→H3 order', 'auto', 'no skipped heading levels', 'update_node_props', {}));
    }
    if (o.buttonsWithoutLabel) {
      issues.push(mkIssue('HIGH', 'accessibility', 'buttons', 'Button/icon without accessible label', 'Add aria-label or visible text', 'auto', 'all controls labeled', 'update_node_props', {}));
    }
    if (o.imagesWithoutAltIntent) {
      issues.push(mkIssue('MEDIUM', 'accessibility', 'images', 'Images missing alt intent', 'Describe purpose of each image', 'suggest', 'alt/intent documented', 'update_node_props', {}));
    }
    if (o.targetsBelow44) {
      issues.push(mkIssue('HIGH', 'accessibility', 'touch', 'Touch targets <44px', 'Enlarge hit areas', 'auto', 'targets ≥44px', 'set_node_styles', {}));
    }
    if (o.skipOrKeyboardTraps) {
      issues.push(mkIssue('BLOCKING', 'accessibility', 'keyboard', 'Keyboard trap or unreachable control', 'Fix focus order and key handlers', 'blocked', 'keyboard reaches all controls', 'update_node_props', {}));
    }
    if (o.landmarksMissing) {
      issues.push(mkIssue('LOW', 'accessibility', 'semantics', 'Missing landmarks/semantic roles', 'Add header/nav/main/footer roles', 'suggest', 'landmarks present', 'update_node_props', {}));
    }
  }

  return {
    contrast: st(o.contrastFailures === undefined ? undefined : o.contrastFailures > 0),
    readableTypography: st(o.bodyTextTooSmall),
    headingHierarchy: st(o.headingOrderSkips),
    buttonClarity: st(o.buttonsWithoutLabel),
    imageAlt: st(o.imagesWithoutAltIntent),
    targetSize: st(o.targetsBelow44),
    keyboard: st(o.skipOrKeyboardTraps),
    semantic: st(o.landmarksMissing),
    issues: sortIssues(issues),
  };
}

// ── UX Audit (section 28) ──────────────────────────────────────────

export interface UXObservations {
  executed: boolean;
  navUnclear?: boolean;
  hierarchyWeak?: boolean;
  hardToDiscover?: boolean;
  ctaUnclear?: boolean;
  frictionPoints?: number;
  badContentSequence?: boolean;
  formIssues?: boolean;
  trustMissing?: boolean;
  mobileUsabilityBroken?: boolean;
}

export function auditUX(o: UXObservations): UXReport {
  emitObservability('verification', 'ux-audit', `UX audit executed=${o.executed}`);
  const issues: DesignIssue[] = [];
  const st = (fail: boolean | undefined): QADimensionStatus => {
    if (!o.executed) return 'NOT_EXECUTED';
    return fail ? 'REPAIR_REQUIRED' : 'PASS';
  };

  if (o.executed) {
    if (o.navUnclear) issues.push(mkIssue('HIGH', 'ux', 'navigation', 'Navigation unclear or incomplete', 'Simplify primary nav to user jobs', 'suggest', 'all primary tasks reachable ≤2 clicks', 'configure_navigation', {}));
    if (o.hierarchyWeak) issues.push(mkIssue('HIGH', 'ux', 'hierarchy', 'Weak visual hierarchy', 'Strengthen H1/CTA dominance', 'auto', 'one dominant focal point', 'set_node_styles', {}));
    if (o.hardToDiscover) issues.push(mkIssue('MEDIUM', 'ux', 'discoverability', 'Key content hard to discover', 'Surface proof and services earlier', 'suggest', 'key content above mid-page', 'insert_section', {}));
    if (o.ctaUnclear) issues.push(mkIssue('HIGH', 'ux', 'cta', 'Primary CTA unclear', 'Use verb + outcome label, single primary', 'auto', 'one obvious primary CTA', 'update_node_props', {}));
    if (o.frictionPoints) issues.push(mkIssue('MEDIUM', 'ux', 'flow', `${o.frictionPoints} friction points in journey`, 'Remove unnecessary steps/fields', 'suggest', 'journey ≤ planned steps', 'update_node_props', {}));
    if (o.badContentSequence) issues.push(mkIssue('MEDIUM', 'ux', 'sequence', 'Content sequence does not reduce uncertainty', 'Reorder: problem → solution → proof → action', 'suggest', 'sequence matches PageArchitecturePlan', 'move_node', {}));
    if (o.formIssues) issues.push(mkIssue('MEDIUM', 'ux', 'forms', 'Form friction (too many fields / unclear labels)', 'Minimize fields, clear labels and errors', 'auto', 'form ≤ necessary fields', 'update_node_props', {}));
    if (o.trustMissing) issues.push(mkIssue('HIGH', 'ux', 'trust', 'Missing trust signals for industry', 'Add reviews/credentials/guarantees', 'suggest', '≥2 trust signals present', 'insert_section', {}));
    if (o.mobileUsabilityBroken) issues.push(mkIssue('HIGH', 'ux', 'mobile-ux', 'Mobile usability broken', 'Fix tap targets, sticky CTA, nav', 'auto', 'mobile path completes', 'set_node_styles', {}));
  }

  return {
    navigation: st(o.navUnclear),
    hierarchy: st(o.hierarchyWeak),
    discoverability: st(o.hardToDiscover),
    ctaClarity: st(o.ctaUnclear),
    friction: st(o.frictionPoints === undefined ? undefined : o.frictionPoints > 0),
    contentSequence: st(o.badContentSequence),
    forms: st(o.formIssues),
    trust: st(o.trustMissing),
    mobileUsability: st(o.mobileUsabilityBroken),
    issues: sortIssues(issues),
  };
}

// ── Merge QA dimensions (no single score) ──────────────────────────

export function mergeQaDimensions(parts: Array<Partial<QADimensions> | QADimensions>): QADimensions {
  const keys: Array<Exclude<keyof QADimensions, 'evidence'>> = [
    'typography', 'composition', 'responsive', 'consistency', 'accessibility',
    'content', 'ux', 'businessGoal', 'antiGeneric',
  ];
  const out = notExecutedQa('merged');
  out.evidence = {};
  for (const k of keys) {
    let best: QADimensionStatus = 'NOT_EXECUTED';
    for (const p of parts) {
      const v = p[k] as QADimensionStatus | undefined;
      if (!v || v === 'NOT_EXECUTED') continue;
      if (v === 'BLOCKED' || v === 'REPAIR_REQUIRED') { best = v; break; }
      if (v === 'PASS' && best === 'NOT_EXECUTED') best = 'PASS';
    }
    out[k] = best;
  }
  for (const p of parts) {
    if (p.evidence) {
      for (const [k, v] of Object.entries(p.evidence)) {
        out.evidence[k] = [...(out.evidence[k] || []), ...v];
      }
    }
  }
  return out;
}

/** Count issues per severity for critic/repair (not a quality score). */
export function issueCounts(issues: DesignIssue[]): Record<DesignIssueSeverity, number> {
  return {
    BLOCKING: issues.filter((i) => i.severity === 'BLOCKING').length,
    HIGH: issues.filter((i) => i.severity === 'HIGH').length,
    MEDIUM: issues.filter((i) => i.severity === 'MEDIUM').length,
    LOW: issues.filter((i) => i.severity === 'LOW').length,
  };
}

/** Helper for tests/orchestrators: content dimension from content plan alone. */
export function contentQaFromPlan(plan: ContentPlan | null | undefined, executed: boolean): QADimensionStatus {
  if (!executed || !plan) return 'NOT_EXECUTED';
  if (plan.issues.some((i) => i.severity === 'BLOCKING' || i.severity === 'HIGH')) return 'REPAIR_REQUIRED';
  if (plan.issues.length) return 'REPAIR_REQUIRED';
  return 'PASS';
}

export type { DesignCritique };
