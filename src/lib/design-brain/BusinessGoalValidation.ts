/**
 * BusinessGoalValidation.ts — Business Goal Validation (29)
 *
 * Evidence-based: a goal is PASS only when plan/audit evidence supports it.
 */

import type {
  BusinessGoalReport, QADimensionStatus, DesignIssue, WebsiteArchitecture,
  ContentPlan, UXReport, CompositionAnalysis, DesignDirection,
} from './types';
import { mkIssue } from './CompositionEngines';
import { emitObservability } from './Observability';

export interface BusinessGoalInput {
  goal: string;
  executed: boolean;
  architecture?: WebsiteArchitecture | null;
  contentPlan?: ContentPlan | null;
  ux?: UXReport | null;
  composition?: CompositionAnalysis | null;
  direction?: DesignDirection | null;
  primaryCTA?: string;
}

export function validateBusinessGoal(input: BusinessGoalInput): BusinessGoalReport {
  emitObservability('verification', 'business-goal', `Validate goal=${input.goal} executed=${input.executed}`);
  const evidence: string[] = [];
  const gaps: DesignIssue[] = [];

  if (!input.executed) {
    return {
      goal: input.goal,
      realized: 'NOT_EXECUTED',
      supportingEvidence: [],
      gaps: [mkIssue('HIGH', 'business-goal', 'goal', `Goal "${input.goal}" not validated — audits not executed`, 'Run plan+visual audits before claiming goal realization', 'suggest', 'businessGoal dimension executed', undefined, {})],
    };
  }

  let realized: QADimensionStatus = 'PASS';

  const cta = input.primaryCTA || input.contentPlan?.ctaPlacement;
  if (input.goal === 'booking' || input.goal === 'lead-generation') {
    const hasHeroCta = Array.isArray(input.contentPlan?.ctaPlacement)
      && input.contentPlan!.ctaPlacement.some((p) => p === 'hero' || p === 'navbar');
    if (hasHeroCta) evidence.push('primary CTA present in hero/navbar plan');
    else {
      gaps.push(mkIssue('HIGH', 'business-goal', 'cta', 'No CTA planned in hero/navbar', 'Place primary CTA in first viewport', 'auto', 'CTA in hero', 'update_node_props', {}));
      realized = 'REPAIR_REQUIRED';
    }
    if (input.ux && input.ux.ctaClarity === 'REPAIR_REQUIRED') {
      gaps.push(...input.ux.issues.filter((i) => i.target === 'cta'));
      realized = 'REPAIR_REQUIRED';
    }
    if (input.ux && input.ux.trust === 'REPAIR_REQUIRED') {
      gaps.push(...input.ux.issues.filter((i) => i.target === 'trust'));
      realized = 'REPAIR_REQUIRED';
    }
    const paths = input.architecture?.conversionPaths || [];
    if (paths.length) evidence.push(`conversion paths: ${paths.slice(0, 3).join(' | ')}`);
    else {
      gaps.push(mkIssue('MEDIUM', 'business-goal', 'journeys', 'No conversion paths planned', 'Define hero→action path in architecture', 'auto', '≥1 conversion path', 'insert_section', {}));
      realized = realized === 'PASS' ? 'REPAIR_REQUIRED' : realized;
    }
  }

  if (input.goal === 'ecommerce') {
    const hasProducts = input.architecture?.pages.some((p) => p.type === 'products');
    if (hasProducts) evidence.push('products page present');
    else {
      gaps.push(mkIssue('HIGH', 'business-goal', 'architecture', 'No products page in architecture', 'Add products page', 'auto', 'products page exists', 'insert_section', {}));
      realized = 'REPAIR_REQUIRED';
    }
    const cartPath = input.architecture?.conversionPaths.some((p) => p.includes('cart') || p.includes('checkout'));
    if (cartPath) evidence.push('cart/checkout path planned');
    else {
      gaps.push(mkIssue('MEDIUM', 'business-goal', 'journeys', 'No cart/checkout path', 'Add purchase conversion path', 'suggest', 'checkout path planned', 'insert_section', {}));
      realized = 'REPAIR_REQUIRED';
    }
  }

  if (input.goal === 'portfolio') {
    const hasPortfolio = input.architecture?.pages.some((p) => p.type === 'portfolio');
    if (hasPortfolio) evidence.push('portfolio page present');
    else {
      gaps.push(mkIssue('HIGH', 'business-goal', 'architecture', 'No portfolio page', 'Add portfolio/work page', 'auto', 'portfolio page exists', 'insert_section', {}));
      realized = 'REPAIR_REQUIRED';
    }
    const workFirst = (input.contentPlan?.headlineHierarchy || []).length > 0;
    if (workFirst) evidence.push('headline hierarchy planned');
  }

  if (input.goal === 'landing-page') {
    const pages = input.architecture?.pages.length ?? 0;
    evidence.push(`landing pages=${pages}`);
    if (pages > 1) {
      gaps.push(mkIssue('MEDIUM', 'business-goal', 'architecture', `Landing goal but ${pages} pages planned`, 'Collapse to single page', 'suggest', 'single page', 'remove_node', {}));
      realized = 'REPAIR_REQUIRED';
    }
  }

  if (input.goal === 'informational' || input.goal === 'blog') {
    const hasContent = input.architecture?.pages.some((p) => p.type === 'blog' || p.type === 'about' || p.type === 'faq');
    if (hasContent) evidence.push('informational pages present');
    else {
      gaps.push(mkIssue('LOW', 'business-goal', 'architecture', 'Limited informational surface', 'Add about/FAQ/blog as fits scope', 'suggest', 'information page present', 'insert_section', {}));
    }
  }

  if (input.composition && input.composition.issues.some((i) => i.evidence.toLowerCase().includes('no cta'))) {
    gaps.push(...input.composition.issues.filter((i) => i.category === 'ux'));
    realized = 'REPAIR_REQUIRED';
    evidence.push('composition reports CTA problems');
  }

  if (input.direction?.compositionRules.some((r) => r.startsWith('Conversion pattern:'))) {
    evidence.push('conversion composition rule present in direction');
  }

  if (typeof cta === 'string' && cta) evidence.push(`cta=${cta}`);
  if (Array.isArray(cta) && cta.length) evidence.push(`cta placements=${cta.join(',')}`);

  if (evidence.length === 0 && gaps.length === 0) {
    realized = 'REPAIR_REQUIRED';
    gaps.push(mkIssue('MEDIUM', 'business-goal', 'goal', 'No supporting evidence collected for goal', 'Collect plan/audit evidence', 'suggest', '≥1 evidence item', undefined, {}));
  }

  return { goal: input.goal, realized, supportingEvidence: evidence, gaps };
}
