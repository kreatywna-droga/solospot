/**
 * ResponsiveIntelligence.ts — Responsive Design Engine (15) + Audit (16)
 *
 * Produces per-breakpoint rules from section roles + direction + blueprint
 * strategy; audits observed layout metrics against those rules.
 */

import type {
  ResponsivePlan, ResponsiveRule, ResponsiveTarget, ResponsiveAuditReport,
  ResponsiveAuditIssue, DesignDirection, SectionRole, QADimensionStatus,
  DesignIssue,
} from './types';
import { mkIssue } from './CompositionEngines';
import { emitObservability } from './Observability';
import type { WebsiteBlueprintDecision } from './BlueprintEngine';

export interface ResponsivePlanInput {
  sections: Array<{ role: SectionRole; hasImage?: boolean; hasGrid?: boolean; cta?: boolean }>;
  direction: DesignDirection;
  industry: string;
  blueprint?: WebsiteBlueprintDecision | null;
}

const TARGETS: ResponsiveTarget[] = ['desktop', 'tablet', 'mobile'];

const SCALES: Record<ResponsiveTarget, { type: number; space: number }> = {
  desktop: { type: 1, space: 1 },
  tablet: { type: 0.92, space: 0.85 },
  mobile: { type: 0.85, space: 0.7 },
};

export function buildResponsivePlan(input: ResponsivePlanInput): ResponsivePlan {
  emitObservability('decision', 'responsive', `Building responsive plan for ${input.sections.length} sections`);
  const nav = input.blueprint?.responsiveStrategy.navPattern || 'hamburger';
  const heroPattern = input.blueprint?.responsiveStrategy.heroPattern || 'stacked';

  const rules: ResponsiveRule[] = [];
  for (const s of input.sections) {
    for (const target of TARGETS) {
      const scale = SCALES[target];
      rules.push({
        sectionRole: s.role,
        target,
        typographyScale: target === 'desktop' ? 1 : scale.type,
        spacingScale: target === 'desktop' ? 1 : scale.space,
        gridChanges: gridChangesFor(s, target),
        stacking: stackingFor(s, target),
        ordering: orderingFor(s, target, heroPattern),
        visibility: visibilityFor(s, target),
        crop: cropFor(s, target, input.direction),
        alignment: target === 'mobile' ? 'left-or-center-hero' : 'design-default',
        ctaBehavior: ctaBehaviorFor(s, target),
        navBehavior: navBehaviorFor(target, nav),
      });
    }
  }

  return { rules };
}

function gridChangesFor(s: ResponsivePlanInput['sections'][number], t: ResponsiveTarget): string {
  if (t === 'desktop') return s.hasGrid ? 'multi-column as designed' : 'as designed';
  if (t === 'tablet') return s.hasGrid ? 'collapse to 2 columns' : 'as designed';
  return s.hasGrid ? 'stack to 1 column' : 'stack blocks';
}

function stackingFor(s: ResponsivePlanInput['sections'][number], t: ResponsiveTarget): string {
  if (t === 'desktop') return 'none (side-by-side when split)';
  if (s.role === 'hero' || s.hasImage) return t === 'tablet' ? 'optional split retained' : 'stacked (image after/below copy)';
  return 'vertical stack';
}

function orderingFor(s: ResponsivePlanInput['sections'][number], t: ResponsiveTarget, heroPattern: string): string {
  if (t === 'desktop') return 'desktop source order';
  if (s.role === 'hero') return heroPattern.includes('stack') || t === 'mobile' ? 'copy first, visual second' : 'design order';
  if (s.role === 'cta') return 'keep after proof sections';
  return 'preserve hierarchy order';
}

function visibilityFor(s: ResponsivePlanInput['sections'][number], t: ResponsiveTarget): string {
  if (t === 'desktop') return 'all';
  if (s.role === 'logos' && t === 'mobile') return 'compress or hide secondary rows';
  if (s.role === 'stats' && t === 'mobile') return '2-up or scroll';
  return 'all critical content visible';
}

function cropFor(s: ResponsivePlanInput['sections'][number], t: ResponsiveTarget, direction: DesignDirection): string {
  if (!s.hasImage) return 'n/a';
  if (t === 'desktop') return 'full composition';
  if (t === 'tablet') return 'tighten to subject';
  return direction.density === 'lean' ? 'center subject, protect text safe-area' : 'subject-focused crop';
}

function ctaBehaviorFor(s: ResponsivePlanInput['sections'][number], t: ResponsiveTarget): string {
  if (!s.cta && s.role !== 'hero' && s.role !== 'navbar' && s.role !== 'cta' && s.role !== 'footer') return 'n/a';
  if (t === 'mobile') return 'full-width reachable; sticky only if blueprint requires';
  if (t === 'tablet') return 'inline primary + secondary';
  return 'inline primary';
}

function navBehaviorFor(t: ResponsiveTarget, nav: string): string {
  if (t === 'desktop') return 'inline';
  return nav;
}

// ── Responsive Audit (section 16) ──────────────────────────────────

export interface ObservedResponsive {
  target: ResponsiveTarget;
  overflowX?: boolean;
  fontTooSmall?: boolean;
  tapTargetsTooSmall?: boolean;
  heroBroken?: boolean;
  ctaOffscreen?: boolean;
  navBroken?: boolean;
  horizontalScroll?: boolean;
  textClipped?: boolean;
  gridBroken?: boolean;
}

export function auditResponsive(observations: ObservedResponsive[]): ResponsiveAuditReport {
  emitObservability('verification', 'responsive-audit', `Auditing ${observations.length} breakpoint observations`);

  const byTarget: Record<ResponsiveTarget, ResponsiveAuditIssue[]> = { desktop: [], tablet: [], mobile: [] };

  for (const o of observations) {
    const push = (
      severity: DesignIssue['severity'],
      evidence: string,
      repair: string,
      capability: DesignIssue['repairCapability'],
      verification: string,
      fixTool?: string,
      fixArgs?: Record<string, unknown>,
    ) => {
      byTarget[o.target].push({
        ...mkIssue(severity, 'responsiveness', `${o.target}`, evidence, repair, capability, verification, fixTool, fixArgs),
        target: o.target,
      });
    };

    if (o.overflowX || o.horizontalScroll) {
      push('HIGH', `${o.target}: horizontal overflow/scroll detected`, 'Constrain widths, allow wrap, fix min-width children', 'auto', 'no horizontal scrollbar at breakpoint', 'set_node_styles', {});
    }
    if (o.fontTooSmall) {
      push('HIGH', `${o.target}: body/CTA text below readable size`, 'Apply responsive type scale (≥16px body)', 'auto', 'body ≥16px at breakpoint', 'set_node_styles', {});
    }
    if (o.tapTargetsTooSmall) {
      push('HIGH', `${o.target}: tap targets <44px`, 'Increase button/link hit area to 44px+', 'auto', 'touch targets ≥44px', 'set_node_styles', {});
    }
    if (o.heroBroken) {
      push('MEDIUM', `${o.target}: hero layout broken (overlap/crop)`, 'Switch hero to breakpoint stacking rule', 'suggest', 'hero stacks without overlap', 'set_node_styles', {});
    }
    if (o.ctaOffscreen) {
      push('HIGH', `${o.target}: primary CTA not reachable`, 'Keep primary CTA in flow or sticky per plan', 'auto', 'CTA visible in first 2 viewports', 'update_node_props', {});
    }
    if (o.navBroken) {
      push('MEDIUM', `${o.target}: navigation unusable`, 'Apply hamburger/overlay nav pattern', 'auto', 'nav opens and reaches all primary pages', 'configure_navigation', {});
    }
    if (o.textClipped) {
      push('MEDIUM', `${o.target}: text clipped or overlapping`, 'Fix line-height/overflow and container height', 'auto', 'no clipped text', 'set_node_styles', {});
    }
    if (o.gridBroken) {
      push('MEDIUM', `${o.target}: grid collapses incorrectly`, 'Force single/2-column collapse rules', 'auto', 'grid stacks per ResponsivePlan', 'set_node_styles', {});
    }
  }

  const status = (t: ResponsiveTarget): QADimensionStatus => {
    const issues = byTarget[t];
    if (observations.length === 0) return 'NOT_EXECUTED';
    if (issues.some((i) => i.severity === 'BLOCKING' || i.severity === 'HIGH')) return 'REPAIR_REQUIRED';
    if (issues.length > 0) return 'REPAIR_REQUIRED';
    return 'PASS';
  };

  const executed = observations.length > 0;
  return {
    desktop: { status: executed ? status('desktop') : 'NOT_EXECUTED', issues: byTarget.desktop },
    tablet: { status: executed ? status('tablet') : 'NOT_EXECUTED', issues: byTarget.tablet },
    mobile: { status: executed ? status('mobile') : 'NOT_EXECUTED', issues: byTarget.mobile },
  };
}
