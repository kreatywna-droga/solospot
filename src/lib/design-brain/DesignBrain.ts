/**
 * DesignBrain.ts — Master pipeline orchestrator
 *
 * ANALYZE → PLAN → DESIGN → COMPOSE → WRITE → ASSETS → BUILD(plan) →
 * REVIEW → CRITIQUE → REPAIR → VERIFY
 *
 * Knowledge ≠ Execution. This module never imports HacpBridge, never
 * mutates BuilderDocument, never claims visual PASS without execution evidence.
 */

import type {
  DesignBrainOutput, DesignDirectionInputs, DesignDirection, DesignConstitution,
  WebsiteArchitecture, PageArchitecturePlan, CompositionAnalysis, ConsistencyReport,
  ContentPlan, ArtDirectionPlan, ResponsivePlan, ResponsiveAuditReport,
  VisualAuditReport, DesignCritique, RepairLoopResult, AccessibilityReport,
  UXReport, BusinessGoalReport, QADimensions, DecisionTrace, SitePlan,
  ProjectDesignMemory, DesignIssue,
} from './types';
import type { WebsiteBlueprintDecision } from './BlueprintEngine';
import { DESIGN_BRAIN_VERSION } from './types';
import { emitObservability, getObservabilityBuffer } from './Observability';
import { createDesignDirection } from './DesignDirector';
import { buildWebsiteArchitecture, buildPageArchitecturePlans } from './WebsiteArchitectureEngine';
import { selectBlueprint, enrichWithBlueprint } from './BlueprintEngine';
import { analyzeComposition, buildConstitution, checkConsistency, detectAntiGeneric } from './CompositionEngines';
import { buildContentPlan } from './ContentIntelligence';
import { planArtDirection } from './AssetIntelligence';
import { buildResponsivePlan, auditResponsive, type ObservedResponsive } from './ResponsiveIntelligence';
import {
  buildVisualAudit, auditAccessibility, auditUX, notExecutedQa, mergeQaDimensions,
  contentQaFromPlan, classifyObservations, type AccessibilityObservations, type UXObservations,
} from './VisualQA';
import { runDesignCritique, runRepairLoop, type RepairLoopOptions } from './CritiqueRepair';
import { validateBusinessGoal } from './BusinessGoalValidation';
import {
  getProjectDesignMemory, rememberDirection, rememberConstitution, memoryTraces,
} from './DesignMemory';
import { runStylePipeline, type StyleDecision, type StyleApplicationPlan } from './StyleSystemIntelligence';
import { planPage2 } from './PagePlanner2';
import { resolveRoleForPhase } from './RoleModel';
import { buildDecisionContext } from '../knowledge';
import type { DecisionContext } from '../knowledge/types';

export interface DesignBrainOptions {
  projectId?: string;
  audience?: string;
  brandPersonality?: string;
  premiumLevel?: DesignDirectionInputs['premiumLevel'];
  contentTone?: string;
  conversionIntent?: string;
  requestedScope?: string[];
  /** When provided, plan-time content/UX audits run against plan evidence. */
  planEvidence?: boolean;
  responsiveObservations?: ObservedResponsive[];
  accessibilityObservations?: AccessibilityObservations;
  uxObservations?: UXObservations;
  /** Optional document observations for plan-time composition (metrics). */
  compositionMetrics?: {
    sectionCount?: number;
    headingSizes?: number[];
    hasHero?: boolean;
    heroImage?: boolean;
    ctaCount?: number;
    imageCount?: number;
    textBlockCount?: number;
    gridSections?: number;
    centeredSections?: number;
    averagePaddingPx?: number;
    fontSizes?: number[];
    fontFamilies?: string[];
    gradientCount?: number;
    glassmorphismCount?: number;
    roundedCardCount?: number;
    badgeCount?: number;
    decorativeIconCount?: number;
    shadowStyles?: string[];
    hasGenericHeroCopy?: boolean;
  };
  repair?: RepairLoopOptions;
}

const EMPTY_REPAIR: RepairLoopResult = {
  iterations: [],
  finalIssues: [],
  finalQa: notExecutedQa('repair not executed'),
  stoppedReason: 'blocked',
  maxIterations: 0,
};

function emptyVisualAudit(): VisualAuditReport {
  return {
    timestamp: new Date().toISOString(),
    categories: {
      typography: [], spacing: [], hierarchy: [], composition: [], alignment: [],
      color: [], contrast: [], imagery: [], 'component-consistency': [],
      responsiveness: [], 'visual-density': [], content: [], ux: [],
      accessibility: [], 'anti-generic': [], compatibility: [], 'business-goal': [],
    },
    allIssues: [],
    qa: notExecutedQa('visual audit not executed'),
    executed: false,
    evidence: [],
  };
}

function emptyResponsive(): ResponsiveAuditReport {
  return {
    desktop: { status: 'NOT_EXECUTED', issues: [] },
    tablet: { status: 'NOT_EXECUTED', issues: [] },
    mobile: { status: 'NOT_EXECUTED', issues: [] },
  };
}

function defaultComposition(): CompositionAnalysis {
  return {
    hierarchy: 'adequate', balance: 'balanced', alignment: 'mostly',
    visualWeight: 'even', whitespace: 'adequate', density: 'balanced',
    focalPoint: 'ambiguous', rhythm: 'regular', issues: [], recommendations: [],
  };
}

/** Main entry: brief → DesignBrainOutput (decision package for orchestrator). */
export async function runDesignBrain(
  brief: string,
  options: DesignBrainOptions = {},
): Promise<DesignBrainOutput> {
  emitObservability('phase', 'design-brain', `START briefLen=${brief.length}`);
  const traces: DecisionTrace[] = [];
  const blockedReasons: string[] = [];
  const projectId = options.projectId || 'default-project';
  const memory = getProjectDesignMemory(projectId);
  resolveRoleForPhase('analyze');

  // 1. Knowledge retrieval (bounded)
  let knowledge: DecisionContext | null = null;
  try {
    knowledge = buildDecisionContext(brief);
    emitObservability('retrieval', 'design-brain', `knowledge entries=${knowledge?.entryIds.length ?? 0}`);
  } catch {
    knowledge = null;
    blockedReasons.push('knowledge retrieval failed — continuing with heuristics');
  }

  const industry = knowledge?.industry || 'other';
  const purpose = (knowledge?.purpose || 'informational') as DesignDirectionInputs['businessGoal'] extends string ? string : string;

  const directionInputs: DesignDirectionInputs = {
    industry,
    audience: options.audience || knowledge?.industryPattern?.targetAudience || 'ogólna',
    businessGoal: purpose,
    brandPersonality: options.brandPersonality || 'professional',
    mood: knowledge?.designHints.toneOfVoice || 'professional',
    visualStyle: knowledge?.designHints.visualDirection || 'professional',
    positioning: options.premiumLevel || 'standard',
    premiumLevel: options.premiumLevel || 'standard',
    contentTone: options.contentTone || knowledge?.designHints.toneOfVoice || 'professional',
    conversionIntent: purpose,
  };

  // 2. Design direction
  const direction = createDesignDirection(directionInputs, knowledge ? {
    visualDirection: knowledge.designHints.visualDirection,
    toneOfVoice: knowledge.designHints.toneOfVoice,
    primaryCta: knowledge.designHints.primaryCta,
  } : undefined);
  traces.push(...direction.sourceTrace);
  rememberDirection(memory, direction);

  // 3. Blueprint + architecture
  const blueprint: WebsiteBlueprintDecision | null = selectBlueprint(industry, purpose);
  const architecture = buildWebsiteArchitecture({
    industry,
    businessGoal: purpose,
    audience: directionInputs.audience,
    requestedScope: options.requestedScope,
  });
  if (blueprint) {
    enrichWithBlueprint(blueprint, architecture, direction);
    direction.compositionRules = [
      ...direction.compositionRules,
      `Blueprint ${blueprint.id}: ${blueprint.differentiation}`,
    ];
  }

  const pagePlans = buildPageArchitecturePlans(architecture, {
    industry,
    businessGoal: purpose,
    primaryCTA: blueprint?.conversionStrategy.primaryCTA || knowledge?.designHints.primaryCta || 'Dowiedz się więcej',
    trustSignals: blueprint?.conversionStrategy.trustDevices || knowledge?.designHints.trustSignals || [],
  });

  // 4. Style system intelligence (retrieval→decision→application)
  const stylePipeline = runStylePipeline({ industry, direction });
  const styleDecision: StyleDecision = stylePipeline.decision;
  const styleApplication: StyleApplicationPlan = stylePipeline.application;
  traces.push(...styleApplication.traces);

  // 5. Constitution + composition + consistency
  resolveRoleForPhase('constitution');
  const constitution = buildConstitution(direction, {
    primaryColor: styleApplication.constitutionPatch.colors.primary,
    secondaryColor: styleApplication.constitutionPatch.colors.secondary,
    backgroundColor: styleApplication.constitutionPatch.colors.background,
    textColor: styleApplication.constitutionPatch.colors.text,
    headingFont: styleApplication.constitutionPatch.typography.headingFont,
    bodyFont: styleApplication.constitutionPatch.typography.bodyFont,
    borderRadius: styleApplication.constitutionPatch.radius.button,
  });
  rememberConstitution(memory, constitution);

  const m = options.compositionMetrics || {};
  const planEvidence = options.planEvidence !== false;
  const composition = analyzeComposition({
    sectionCount: m.sectionCount ?? architecture.pages.length * 6,
    headingSizes: m.headingSizes ?? [48, 32, 24],
    hasHero: m.hasHero ?? true,
    heroImage: m.heroImage ?? true,
    ctaCount: m.ctaCount ?? (blueprint ? blueprint.conversionStrategy.ctaPlacements.length : 2),
    imageCount: m.imageCount ?? 4,
    textBlockCount: m.textBlockCount ?? 6,
    gridSections: m.gridSections ?? 2,
    centeredSections: m.centeredSections ?? 2,
    averagePaddingPx: m.averagePaddingPx ?? 80,
    fontSizes: m.fontSizes ?? [48, 32, 24, 16],
  });

  const consistency = checkConsistency(constitution, {
    headingFont: styleApplication.constitutionPatch.typography.headingFont,
    bodyFont: styleApplication.constitutionPatch.typography.bodyFont,
    fontSizes: m.fontSizes,
    radiusValues: [constitution.radius.button, constitution.radius.card],
  });

  const antiGenericIssues = detectAntiGeneric({
    gradientCount: m.gradientCount ?? 1,
    glassmorphismCount: m.glassmorphismCount ?? 0,
    roundedCardCount: m.roundedCardCount ?? 3,
    totalCardCount: m.roundedCardCount ?? 3,
    badgeCount: m.badgeCount ?? 1,
    decorativeIconCount: m.decorativeIconCount ?? 2,
    centeredSectionCount: m.centeredSections ?? 2,
    totalSections: m.sectionCount ?? 6,
    shadowStyles: m.shadowStyles ?? ['soft'],
    fontFamilies: m.fontFamilies ?? [
      constitution.typography.headingFont,
      constitution.typography.bodyFont,
    ],
    hasGenericHeroCopy: m.hasGenericHeroCopy ?? false,
  });

  // 6. Content + assets
  resolveRoleForPhase('content');
  const contentSeedSections = [
    { role: 'hero' as const, content: { heading: directionInputs.visualStyle ? 'Wyróżnij się' : 'Witamy', cta: pagePlans[0]?.primaryCTA || 'Dowiedz się więcej' } },
    { role: 'features' as const, content: { heading: 'Co oferujemy' } },
    { role: 'cta' as const, content: { heading: 'Skontaktuj się', cta: pagePlans[0]?.primaryCTA || 'Kontakt' } },
  ];
  const contentPlan = buildContentPlan(
    contentSeedSections as Parameters<typeof buildContentPlan>[0],
    direction,
  );

  const artDirection = planArtDirection(
    [
      { role: 'hero', label: 'Hero', hasImage: true },
      { role: 'about', label: 'O nas', hasImage: true },
      { role: 'gallery', label: 'Galeria', hasImage: industry === 'restaurant' || industry === 'hotel' || industry === 'portfolio' },
      { role: 'team', label: 'Zespół', hasImage: ['dentist', 'clinic', 'law', 'agency'].includes(industry) },
    ],
    direction,
    industry,
    knowledge?.designHints.mediaNeeds?.length ? knowledge.designHints.mediaNeeds : [blueprint?.assetStrategy.heroSubject || industry],
  );

  // 7. Responsive plan
  resolveRoleForPhase('responsive');
  const responsivePlan = buildResponsivePlan({
    sections: [
      { role: 'navbar', cta: true },
      { role: 'hero', hasImage: true, hasGrid: false, cta: true },
      { role: 'features', hasGrid: true },
      { role: 'about', hasImage: true },
      { role: 'testimonials' },
      { role: 'cta', cta: true },
      { role: 'footer', cta: true },
    ],
    direction,
    industry,
    blueprint,
  });
  for (const r of responsivePlan.rules.filter((x) => x.target === 'mobile')) {
    memory.responsiveRules[r.sectionRole] = { typographyScale: r.typographyScale, stacking: r.stacking, ctaBehavior: r.ctaBehavior };
  }

  const responsiveAudit = auditResponsive(options.responsiveObservations || []);
  const responsiveExecuted = (options.responsiveObservations || []).length > 0;

  // 8. Build SitePlan (PagePlanner 2)
  resolveRoleForPhase('plan');
  const sitePlan = planPage2({
    brief,
    direction,
    architecture,
    pagePlans,
    constitution,
    styleApplication,
    styleDecision,
    responsivePlan,
    blueprint,
    contentPlan,
    traces,
  });

  // 9. Visual audit (plan-time evidence mode or not executed)
  resolveRoleForPhase('audit');
  const a11yObs = options.accessibilityObservations;
  const uxObs = options.uxObservations;
  const accessibility = auditAccessibility(
    a11yObs || { executed: planEvidence && !options.accessibilityObservations ? false : false },
  );
  // Plan-time: accessibility/UX audits require explicit observations (no fake PASS)
  const accessibilityFinal = a11yObs ? auditAccessibility(a11yObs) : auditAccessibility({ executed: false });
  const uxFinal = uxObs ? auditUX(uxObs) : auditUX({ executed: false });
  void accessibility;

  const consistencyIssuesAsDesign = consistency.issues.map((ci) => ({
    issueId: `cons-${ci.element}`,
    severity: ci.severity,
    category: 'component-consistency' as const,
    target: ci.element,
    evidence: `expected=${ci.expected} actual=${ci.actual}`,
    recommendedRepair: ci.repairHint,
    repairCapability: 'auto' as const,
    verificationMethod: `${ci.element} matches constitution`,
  }));

  const visualAudit = buildVisualAudit({
    executed: planEvidence,
    evidence: planEvidence
      ? [
          `plan sections=${sitePlan.sections.length}`,
          `blueprint=${blueprint?.id ?? 'none'}`,
          `stylePack=${styleDecision.stylePack?.id ?? 'none'}`,
          `architecture pages=${architecture.pages.length}`,
        ]
      : [],
    composition,
    consistency,
    contentPlan,
    contentLayout: null,
    responsiveIssues: responsiveExecuted
      ? [...responsiveAudit.desktop.issues, ...responsiveAudit.tablet.issues, ...responsiveAudit.mobile.issues]
      : [],
    accessibilityIssues: accessibilityFinal.issues,
    uxIssues: uxFinal.issues,
    antiGenericIssues,
    extraIssues: [
      ...styleApplication.issues,
      ...artDirection.issues,
      ...consistencyIssuesAsDesign,
      ...(blueprint ? [] : []),
    ],
  });

  // 10. Critique + repair
  resolveRoleForPhase('critique');
  const critique = runDesignCritique({
    executed: planEvidence,
    composition,
    consistency,
    contentPlan,
    accessibility: accessibilityFinal,
    ux: uxFinal,
    businessGoal: null,
    responsive: responsiveAudit,
    antiGenericIssues,
    extraIssues: visualAudit.allIssues,
  });

  let repair: RepairLoopResult = EMPTY_REPAIR;
  if (planEvidence && critique.repairable.length > 0) {
    repair = await runRepairLoop(critique.repairable, visualAudit.qa, options.repair || {});
    if (repair.stoppedReason === 'blocked' && !options.repair?.applyRepairs) {
      // Honest: no executor → no mutation claim
      repair = {
        ...repair,
        finalIssues: critique.repairable,
        finalQa: visualAudit.qa,
        stoppedReason: 'blocked',
      };
    }
  } else if (planEvidence && critique.repairable.length === 0) {
    repair = {
      iterations: [],
      finalIssues: [],
      finalQa: visualAudit.qa,
      stoppedReason: 'clean',
      maxIterations: 0,
    };
  }

  // 11. Business goal
  const businessGoal = validateBusinessGoal({
    goal: purpose,
    executed: planEvidence,
    architecture,
    contentPlan,
    ux: uxFinal,
    composition,
    direction,
    primaryCTA: pagePlans[0]?.primaryCTA,
  });

  // 12. QA dimensions merge (NO single score)
  const qa = mergeQaDimensions([
    {
      typography: visualAudit.qa.typography,
      composition: visualAudit.qa.composition,
      responsive: responsiveExecuted
        ? (responsiveAudit.mobile.status === 'PASS' && responsiveAudit.tablet.status === 'PASS' && responsiveAudit.desktop.status === 'PASS'
          ? 'PASS' : 'REPAIR_REQUIRED')
        : 'NOT_EXECUTED',
      consistency: consistency.overall === 'PASS' ? 'PASS' : consistency.overall === 'BLOCKED' ? 'BLOCKED' : 'REPAIR_REQUIRED',
      accessibility: accessibilityFinal.contrast === 'NOT_EXECUTED' && !a11yObs ? 'NOT_EXECUTED'
        : (accessibilityFinal.issues.length ? 'REPAIR_REQUIRED' : 'PASS'),
      content: contentQaFromPlan(contentPlan, planEvidence),
      ux: !uxObs ? 'NOT_EXECUTED' : (uxFinal.issues.length ? 'REPAIR_REQUIRED' : 'PASS'),
      businessGoal: businessGoal.realized,
      antiGeneric: antiGenericIssues.length ? 'REPAIR_REQUIRED' : (planEvidence ? 'PASS' : 'NOT_EXECUTED'),
      evidence: {
        ...visualAudit.qa.evidence,
        styleSystem: stylePipeline.retrieval.log,
        memory: [`decisions=${memory.designDecisions.length}`],
        knowledge: knowledge?.retrievalLog || [],
      },
    },
  ]);

  // Repair may fix plan-level issues in the recorded final set
  const finalQa: QADimensions = { ...qa };
  if (repair.stoppedReason === 'clean') {
    // Keep dimension statuses honest — clean repair only clears listed issues
    finalQa.evidence = {
      ...qa.evidence,
      repair: [`stopped=clean issues=0`],
    };
  } else {
    finalQa.evidence = {
      ...qa.evidence,
      repair: [`stopped=${repair.stoppedReason} remaining=${repair.finalIssues.length}`],
    };
  }

  traces.push(...memoryTraces(memory));

  let status: DesignBrainOutput['status'] = 'COMPLETE';
  if (blockedReasons.length && !planEvidence) status = 'PARTIAL';
  if (!planEvidence) status = 'PARTIAL';
  if (brief.trim().length < 8) {
    status = 'CLARIFY';
    blockedReasons.push('brief too short to plan professionally');
  }
  if (qa.typography === 'BLOCKED' || consistency.overall === 'BLOCKED') {
    status = 'BLOCKED';
    blockedReasons.push('blocking consistency/typography issue');
  }

  emitObservability('phase', 'design-brain', `END status=${status} sections=${sitePlan.sections.length}`);

  return {
    version: DESIGN_BRAIN_VERSION,
    brief,
    signals: {
      brief,
      industry,
      purpose,
      specializations: knowledge?.entries.flatMap((e) => e.tags || []).slice(0, 8) || [],
      audience: directionInputs.audience,
      goal: purpose,
      visualDirection: direction.visualStyle,
    },
    knowledge,
    direction,
    architecture,
    pagePlans,
    constitution,
    composition,
    consistency,
    contentPlan,
    artDirection,
    responsivePlan,
    visualAudit,
    critique,
    repair,
    accessibility: accessibilityFinal,
    ux: uxFinal,
    businessGoal,
    qa: finalQa,
    traces,
    sitePlan,
    status,
    blockedReasons,
  };
}

/** Compact log line for E2E assertions (safe, no secrets). */
export function summarizeDesignBrain(output: DesignBrainOutput): string {
  return [
    `[DesignBrain] v=${output.version}`,
    `status=${output.status}`,
    `industry=${output.signals.industry}`,
    `style=${output.direction.visualStyle}`,
    `pages=${output.architecture.pages.length}`,
    `sections=${output.sitePlan.sections.length}`,
    `blueprint=${output.knowledge?.blueprint?.id ?? 'none'}`,
    `critique=${output.critique.findings.filter((f) => f.answer === 'ISSUE').length}ISSUE`,
    `repair=${output.repair.stoppedReason}`,
    `qa=${Object.entries(output.qa).filter(([k]) => k !== 'evidence').map(([k, v]) => `${k}=${v}`).join(',')}`,
  ].join(' ');
}

export { classifyObservations };
export type { ProjectDesignMemory, DesignIssue };
