/**
 * types.ts — HACP Web Design Intelligence Knowledge Entry Contract
 *
 * Knowledge ≠ Execution: this layer answers CO / DLACZEGO / KIEDY / JAK OCENIĆ.
 * Execution (tools, mutations, BuilderDocument, Canvas) stays in the AI/HACP layer.
 *
 * Versioned, modular, searchable — mirrors Experience Library schemaVersion discipline.
 */

export const KNOWLEDGE_SCHEMA_VERSION = '1.0.0';

export type KnowledgeDomainId =
  | '01-design-principles'
  | '02-information-architecture'
  | '03-layout-composition'
  | '04-typography'
  | '05-color-systems'
  | '06-spacing-rhythm'
  | '07-component-intelligence'
  | '08-content-design'
  | '09-industry-patterns'
  | '10-image-media'
  | '11-ux-conversion'
  | '12-responsive-design'
  | '13-accessibility'
  | '14-visual-consistency'
  | '15-anti-patterns'
  | '16-quality-assurance'
  | '17-website-blueprints'
  | '18-training-cases';

export const KNOWLEDGE_DOMAINS: ReadonlyArray<{
  id: KnowledgeDomainId;
  title: string;
  description: string;
}> = [
  { id: '01-design-principles', title: 'Design Principles', description: 'Visual hierarchy, emphasis, balance, contrast, alignment, proximity, repetition, whitespace, rhythm, flow.' },
  { id: '02-information-architecture', title: 'Information Architecture', description: 'Section purpose, when to use, content required, visual role, variants, components, verification.' },
  { id: '03-layout-composition', title: 'Layout & Composition', description: 'Containers, grids, columns, section composition, density, image/text balance, vertical rhythm.' },
  { id: '04-typography', title: 'Typography Intelligence', description: 'Font pairing, hierarchy, type scale, weight, line-height, line length, responsive type, anti-patterns.' },
  { id: '05-color-systems', title: 'Color Systems', description: 'Primary/secondary/accent/background/text/CTA roles, contrast, semantic color, brand-industry-mood derivation.' },
  { id: '06-spacing-rhythm', title: 'Spacing & Rhythm', description: 'Section spacing, padding, gaps, vertical rhythm, density — too tight vs balanced vs too empty.' },
  { id: '07-component-intelligence', title: 'Component Intelligence', description: 'When to use each component, content requirements, visual role, configuration, verification.' },
  { id: '08-content-design', title: 'Content Design', description: 'Headlines, body, cards, CTA, FAQ, nav labels — clarity, brevity, hierarchy, tone, no placeholders.' },
  { id: '09-industry-patterns', title: 'Industry Patterns', description: 'Business model, audience, goals, structure, CTA, visual direction, mistakes, tone, media per industry.' },
  { id: '10-image-media', title: 'Image & Media Direction', description: 'When images/galleries/hero/team/product are needed; aspect ratio, crop, focal point, hierarchy.' },
  { id: '11-ux-conversion', title: 'UX & Conversion', description: 'Primary/secondary CTA, user journey, nav hierarchy, trust, friction, forms, conversion paths.' },
  { id: '12-responsive-design', title: 'Responsive Design', description: 'Desktop/tablet/mobile stacking, column collapse, type scaling, spacing adaptation, mobile CTA.' },
  { id: '13-accessibility', title: 'Accessibility', description: 'Contrast, readable text, semantic hierarchy, button/link clarity, alt intent, touch targets.' },
  { id: '14-visual-consistency', title: 'Visual Consistency', description: 'Typography, colors, spacing, radius, shadows, buttons, cards, icons, section rhythm — one design direction.' },
  { id: '15-anti-patterns', title: 'Anti-Patterns', description: 'Symptom → cause → fix → verify for common web design failures.' },
  { id: '16-quality-assurance', title: 'Quality Assurance', description: 'HACP Website Quality Checklist: content, structure, design, type, color, spacing, media, UX, responsive, a11y, technical.' },
  { id: '17-website-blueprints', title: 'Website Blueprints', description: 'Goal → IA → content → components → design direction → CTA → media → QA (patterns, not rigid templates).' },
  { id: '18-training-cases', title: 'Training Cases', description: 'Brief → expected decisions, structure, content, design, media, CTA, QA, failure modes across difficulty levels.' },
];

/** Uniform knowledge entry format (gate KNOWLEDGE ENTRY FORMAT). */
export interface KnowledgeEntry {
  id: string;
  domain: KnowledgeDomainId;
  title: string;
  rule: string;
  why: string;
  whenToUse: string;
  whenNotToUse: string;
  goodExample: string;
  badExample: string;
  antiPattern?: string;
  executionHint?: string;
  verification: string;
  relatedRules?: string[];
  /** Free-form tags for retrieval (industry, purpose, section role, mood…). */
  tags?: string[];
  schemaVersion?: string;
}

/** Industry pattern entry (domain 09) — pattern, not rigid template. */
export interface IndustryPattern {
  id: string;
  industry: string;
  businessModel: string;
  targetAudience: string;
  commonGoals: string[];
  commonContent: string[];
  commonPageStructure: string[];
  usefulSections: string[];
  commonCta: string[];
  visualDirection: string;
  commonMistakes: string[];
  contentTone: string;
  mediaNeeds: string[];
  tags?: string[];
  schemaVersion?: string;
}

/** QA checklist item (domain 16). */
export interface QaCheck {
  id: string;
  category:
    | 'CONTENT'
    | 'STRUCTURE'
    | 'DESIGN'
    | 'TYPOGRAPHY'
    | 'COLOR'
    | 'SPACING'
    | 'MEDIA'
    | 'UX'
    | 'RESPONSIVE'
    | 'ACCESSIBILITY'
    | 'TECHNICAL';
  question: string;
  failSignal: string;
  fixHint: string;
  tags?: string[];
  schemaVersion?: string;
}

/** Training case (domain 18). */
export interface TrainingCase {
  id: string;
  level: 1 | 2 | 3 | 4 | 5;
  brief: string;
  business: string;
  audience: string;
  goal: string;
  expectedDecisions: string[];
  expectedStructure: string[];
  contentRequirements: string[];
  designDirection: string;
  mediaNeeds: string[];
  cta: string;
  qualityChecks: string[];
  commonFailureModes: string[];
  tags?: string[];
  schemaVersion?: string;
}

/** Blueprint (domain 17). */
export interface WebsiteBlueprint {
  id: string;
  name: string;
  businessGoal: string;
  informationArchitecture: string[];
  content: string[];
  components: string[];
  designDirection: string;
  cta: string;
  media: string[];
  qa: string[];
  tags?: string[];
  schemaVersion?: string;
}

/** Brief signals extracted before retrieval. */
export interface BriefSignals {
  brief: string;
  industry: string;
  purpose: string;
  specializations: string[];
  audience?: string;
  goal?: string;
  visualDirection?: string;
}

/** Retrieved decision context — what the planner/orchestrator may consume. */
export interface DecisionContext {
  schemaVersion: string;
  retrievedAt: string;
  brief: string;
  industry: string;
  purpose: string;
  entryIds: string[];
  entries: KnowledgeEntry[];
  industryPattern?: IndustryPattern;
  blueprint?: WebsiteBlueprint;
  qaChecks: QaCheck[];
  antiPatterns: KnowledgeEntry[];
  designHints: {
    toneOfVoice: string;
    contentDensity: 'lean' | 'moderate' | 'rich';
    visualDirection: string;
    primaryCta: string;
    trustSignals: string[];
    recommendedSections: string[];
    mediaNeeds: string[];
  };
  /** Honest retrieval log — empty means nothing retrieved (no fake knowledge claim). */
  retrievalLog: string[];
}
