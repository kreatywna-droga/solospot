/**
 * ContentIntelligence.ts — Content Design Engine (11) + Content↔Layout (12)
 */

import type {
  ContentBlock, ContentFunction, ContentPlan, ContentLayoutIssue,
  ContentLayoutReport, DesignIssue, SectionRole, DesignDirection,
} from './types';
import { mkIssue } from './CompositionEngines';
import { emitObservability } from './Observability';

interface ContentInput {
  sectionRole: SectionRole;
  heading?: string;
  subheading?: string;
  description?: string;
  cta?: string;
  items?: Array<{ label: string; description?: string }>;
  direction: DesignDirection;
}

const FUNCTION_BY_ROLE: Partial<Record<SectionRole, ContentFunction>> = {
  hero: 'value-explanation',
  features: 'information',
  about: 'context',
  testimonials: 'proof',
  faq: 'objection-handling',
  cta: 'next-action',
  contact: 'next-action',
  pricing: 'objection-handling',
  navbar: 'navigation',
  footer: 'navigation',
  team: 'uncertainty-reduction',
  stats: 'proof',
  logos: 'proof',
};

const MAX_BY_FUNCTION: Record<ContentFunction, number> = {
  'value-explanation': 80,
  context: 320,
  'next-action': 40,
  'uncertainty-reduction': 60,
  proof: 200,
  navigation: 24,
  'objection-handling': 400,
  information: 400,
  engagement: 120,
};

export function planSectionContent(input: ContentInput): { blocks: ContentBlock[]; issues: DesignIssue[] } {
  const blocks: ContentBlock[] = [];
  const issues: DesignIssue[] = [];
  const fn = FUNCTION_BY_ROLE[input.sectionRole] || 'information';
  const maxLength = MAX_BY_FUNCTION[fn];

  if (input.heading) {
    blocks.push({ id: `${input.sectionRole}-headline`, function: fn, text: input.heading, maxLength: input.sectionRole === 'hero' ? 80 : 60, sectionRole: input.sectionRole });
    if (input.sectionRole === 'hero' && input.heading.length > 80) {
      issues.push(mkIssue('MEDIUM', 'content', `${input.sectionRole}-headline`, `Hero headline ${input.heading.length} chars (>80)`, 'Shorten to concrete outcome ≤80 chars', 'auto', 'headline ≤80 chars', 'update_node_props', {}));
    }
  }
  if (input.subheading) {
    blocks.push({ id: `${input.sectionRole}-sub`, function: 'context', text: input.subheading, maxLength: 160, sectionRole: input.sectionRole });
    if (input.subheading.length > 160) {
      issues.push(mkIssue('LOW', 'content', `${input.sectionRole}-sub`, 'Subheading too long', 'Trim to one breath (≤160)', 'auto', '≤160 chars', 'update_node_props', {}));
    }
  }
  if (input.description) {
    blocks.push({ id: `${input.sectionRole}-desc`, function: 'context', text: input.description, maxLength, sectionRole: input.sectionRole });
  }
  if (input.cta) {
    blocks.push({ id: `${input.sectionRole}-cta`, function: 'next-action', text: input.cta, maxLength: 40, sectionRole: input.sectionRole });
    if (input.cta.length > 40) {
      issues.push(mkIssue('LOW', 'content', `${input.sectionRole}-cta`, 'CTA label too long', 'Use verb + object ≤40 chars', 'auto', 'CTA ≤40', 'update_node_props', {}));
    }
  }
  (input.items || []).forEach((item, i) => {
    blocks.push({ id: `${input.sectionRole}-item-${i}`, function: 'information', text: item.label, maxLength: 60, sectionRole: input.sectionRole });
    if (item.description) {
      blocks.push({ id: `${input.sectionRole}-item-desc-${i}`, function: 'context', text: item.description, maxLength: 160, sectionRole: input.sectionRole });
    }
  });

  return { blocks, issues };
}

export function buildContentPlan(
  sections: Array<{ role: SectionRole; content: { heading?: string; subheading?: string; description?: string; cta?: string; items?: Array<{ label: string; description?: string }> } }>,
  direction: DesignDirection,
): ContentPlan {
  emitObservability('decision', 'content', `Planning content for ${sections.length} sections`);
  const allBlocks: ContentBlock[] = [];
  const issues: DesignIssue[] = [];
  const headlineHierarchy: string[] = [];
  const ctaPlacement: string[] = [];

  for (const s of sections) {
    const { blocks, issues: local } = planSectionContent({
      sectionRole: s.role,
      heading: s.content.heading,
      subheading: s.content.subheading,
      description: s.content.description,
      cta: s.content.cta,
      items: s.content.items,
      direction,
    });
    allBlocks.push(...blocks);
    issues.push(...local);
    if (s.content.heading) headlineHierarchy.push(`${s.role}:${s.content.heading.slice(0, 40)}`);
    if (s.content.cta) ctaPlacement.push(s.role);
  }

  // CTA buried check — only meaningful when the page has at least one CTA
  if (ctaPlacement.length === 0) {
    issues.push(mkIssue('HIGH', 'content', 'cta', 'Primary CTA not in hero or navbar — buried', 'Promote CTA into hero', 'auto', 'CTA present in first viewport', 'update_node_props', {}));
  } else if (!ctaPlacement.includes('hero') && !ctaPlacement.includes('navbar')) {
    issues.push(mkIssue('HIGH', 'content', 'cta', 'Primary CTA not in hero or navbar — buried', 'Promote CTA into hero', 'auto', 'CTA present in first viewport', 'update_node_props', {}));
  }

  return { blocks: allBlocks, headlineHierarchy, ctaPlacement, issues };
}

// ── Content ↔ Layout Coordination (section 12) ──────────────────────

export function coordinateContentLayout(
  blocks: ContentBlock[],
  layout: { availableLineChars: number; containerHeightPx: number; estimatedTextHeightPx: number; sectionRole: SectionRole },
): ContentLayoutReport {
  const issues: ContentLayoutIssue[] = [];

  for (const b of blocks) {
    if (b.text.length > b.maxLength * 1.5) {
      issues.push({
        type: 'text-too-long',
        target: b.id,
        evidence: `${b.text.length} chars > ${Math.round(b.maxLength * 1.5)} soft max for ${b.function}`,
        suggestion: 'Split or trim; layout will reflow poorly past soft max',
      });
    } else if (b.function === 'next-action' && b.text.length < 3) {
      issues.push({ type: 'text-too-short', target: b.id, evidence: 'CTA nearly empty', suggestion: 'Add verb-driven CTA label' });
    }
    if (b.function === 'value-explanation' && b.text.length > layout.availableLineChars * 3) {
      issues.push({
        type: 'poor-line-length',
        target: b.id,
        evidence: `Headline wraps >3 lines at ~${layout.availableLineChars} chars/line`,
        suggestion: 'Shorten headline or increase container width',
      });
    }
  }

  if (layout.estimatedTextHeightPx > layout.containerHeightPx * 1.2) {
    issues.push({
      type: 'bad-wrapping',
      target: layout.sectionRole,
      evidence: `Estimated text height ${layout.estimatedTextHeightPx}px exceeds container ${layout.containerHeightPx}px`,
      suggestion: 'Increase section height or reduce copy density (CONTENT ↔ LAYOUT reflow)',
    });
  }

  const ctaHidden = blocks.filter((b) => b.function === 'next-action').every((b) => b.text.length === 0);
  if (ctaHidden && blocks.length > 6) {
    issues.push({ type: 'cta-buried', target: layout.sectionRole, evidence: 'No CTA among dense content', suggestion: 'Add CTA block or move existing CTA higher' });
  }

  const needsReflow = issues.some((i) => i.type === 'text-too-long' || i.type === 'bad-wrapping' || i.type === 'poor-line-length');
  return { issues, needsReflow };
}
