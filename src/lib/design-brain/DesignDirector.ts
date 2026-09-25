/**
 * DesignDirector.ts — Brief → DesignDirection (section 2)
 *
 * Transforms user intent into a coherent, structured design decision.
 * Output is a typed DesignDirection consumed by Page Planner and Builder —
 * NOT free text stuffed into a prompt.
 */

import type {
  DesignDirection,
  DesignDirectionInputs,
  DecisionTrace,
  VisualDNA,
  AntiPattern,
  VisualLanguage,
} from './types';
import { emitObservability } from './Observability';

let traceCounter = 0;
function trace(
  why: string, what: string, where: string, how: string, verify: string,
  source: DecisionTrace['source'], extra?: Partial<DecisionTrace>,
): DecisionTrace {
  return {
    decisionId: `dd-${++traceCounter}-${Date.now().toString(36)}`,
    why, what, where, how, verify, source,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

const STYLE_ARCHETYPES: Record<string, Partial<DesignDirection> & { moodDefault: string }> = {
  luxury: {
    moodDefault: 'refined opulent exclusive',
    typographyDirection: 'editorial serif display + clean sans body, high contrast weights',
    colorDirection: 'deep neutrals + single metallic/warm accent, generous negative space',
    spacingDirection: 'generous macro-spacing, tight micro-rhythm, large section padding',
    radiusDirection: 'subtle (4–8px) or sharp — never playful round',
    shadowDirection: 'soft layered depth or none; no heavy drop shadows',
    imageDirection: 'high-contrast editorial photography, controlled crop, warm grade',
    iconDirection: 'thin line icons, minimal fill',
    motionDirection: 'subtle fade/slide, slow easing, no bounce',
    density: 'lean',
    compositionRules: [
      'One dominant focal point per viewport',
      'Asymmetric editorial layout preferred over centered stacks',
      'Whitespace is a luxury material — protect it',
    ],
  },
  premium: {
    moodDefault: 'confident polished trustworthy',
    typographyDirection: 'geometric/humanist sans display + readable body, clear weight contrast',
    colorDirection: 'restrained palette, one strong brand accent for CTA only',
    spacingDirection: 'comfortable section rhythm (80–120px), consistent 8px grid',
    radiusDirection: 'moderate (8–12px)',
    shadowDirection: 'soft elevation, single light source',
    imageDirection: 'professional photography with natural light, consistent grade',
    iconDirection: 'outlined icons, consistent stroke',
    motionDirection: 'subtle scroll reveal, 200–400ms ease-out',
    density: 'moderate',
    compositionRules: [
      'Clear Z-pattern or F-pattern reading flow',
      'Primary CTA always visually dominant',
      'Max 2 type families',
    ],
  },
  minimal: {
    moodDefault: 'calm focused honest',
    typographyDirection: 'single sans family, scale does the hierarchy work',
    colorDirection: 'near-monochrome + one accent; rely on contrast not color count',
    spacingDirection: 'extra breathing room, large padding, few borders',
    radiusDirection: 'small (4–6px) or none',
    shadowDirection: 'none or hairline border instead of shadow',
    imageDirection: 'sparse, intentional imagery; product/subject over decoration',
    iconDirection: 'ultra-thin or none',
    motionDirection: 'almost none; instant response',
    density: 'lean',
    compositionRules: [
      'Every element must justify its presence',
      'Remove before adding',
      'Left-aligned or simple grid — no decorative centering',
    ],
  },
  friendly: {
    moodDefault: 'warm approachable human',
    typographyDirection: 'rounded or humanist sans, generous x-height',
    colorDirection: 'warm secondary tones, soft neutrals, inviting CTA color',
    spacingDirection: 'comfortable, slightly looser than corporate',
    radiusDirection: 'rounded (12–20px)',
    shadowDirection: 'soft ambient',
    imageDirection: 'authentic people/lifestyle photography, natural expressions',
    iconDirection: 'filled or duotone, soft corners',
    motionDirection: 'gentle bounce/spring on interactions only',
    density: 'moderate',
    compositionRules: [
      'Faces and people build trust — feature them',
      'Avoid clinical coldness',
      'One clear action per section',
    ],
  },
  playful: {
    moodDefault: 'energetic fun spontaneous',
    typographyDirection: 'expressive display + clean body; weight/size contrast for energy',
    colorDirection: 'bold multi-accent used sparingly against calm base',
    spacingDirection: 'dynamic, intentional breaks from rhythm',
    radiusDirection: 'organic/blob or generous round (16–24px)',
    shadowDirection: 'offset colored shadows or none',
    imageDirection: 'illustration or highly styled photography',
    iconDirection: 'filled, colorful, characterful',
    motionDirection: 'bouncy, expressive micro-interactions',
    density: 'moderate',
    compositionRules: [
      'Controlled chaos — break grid only with purpose',
      'Avoid stacking more than 2 loud elements',
    ],
  },
  editorial: {
    moodDefault: 'authoritative cultured narrative',
    typographyDirection: 'serif display headlines + sans body, magazine-scale type',
    colorDirection: 'ink + paper + one signature accent',
    spacingDirection: 'column-driven, literary line length (60–75ch)',
    radiusDirection: 'sharp or none',
    shadowDirection: 'none — hierarchy via type and rule lines',
    imageDirection: 'photojournalistic, full-bleed or strong crop',
    iconDirection: 'minimal or none',
    motionDirection: 'page-turn-like reveals, restrained',
    density: 'rich',
    compositionRules: [
      'Multi-column layouts where content allows',
      'Pull quotes and rules create rhythm',
      'Headlines can be very large — they are the design',
    ],
  },
  corporate: {
    moodDefault: 'stable professional reliable',
    typographyDirection: 'neutral sans, conservative scale',
    colorDirection: 'navy/blue family + gray + single action color',
    spacingDirection: 'regular grid, predictable rhythm',
    radiusDirection: 'small (4–8px)',
    shadowDirection: 'subtle or none',
    imageDirection: 'professional/stock-consistent, diverse teams, offices',
    iconDirection: 'outlined, monochrome',
    motionDirection: 'minimal, functional',
    density: 'moderate',
    compositionRules: [
      'Consistency over surprise',
      'Information density acceptable — decision-makers scan',
      'Trust signals prominent',
    ],
  },
  futuristic: {
    moodDefault: 'innovative sharp cutting-edge',
    typographyDirection: 'tech/geometric sans, tight tracking on display',
    colorDirection: 'dark base + electric accent (cyan/violet), high contrast',
    spacingDirection: 'structured, data-like precision',
    radiusDirection: 'sharp or slight (0–8px)',
    shadowDirection: 'glow/outer neon rather than drop shadow',
    imageDirection: 'abstract tech, 3D, generative — or crisp UI mockups',
    iconDirection: 'linear technical',
    motionDirection: 'scan/reveal/glitch accents used sparingly',
    density: 'moderate',
    compositionRules: [
      'Dark canvas with focused light elements',
      'Avoid clutter — future implies clarity',
      'Motion must feel engineered, not decorative',
    ],
  },
  warm: {
    moodDefault: 'cozy inviting organic',
    typographyDirection: 'humanist sans or soft serif',
    colorDirection: 'earth tones, cream backgrounds, terracotta/olive accents',
    spacingDirection: 'soft, comfortable, slightly irregular ok',
    radiusDirection: 'rounded (12–16px)',
    shadowDirection: 'very soft warm shadows',
    imageDirection: 'natural light, textures, handmade feel',
    iconDirection: 'soft filled or hand-drawn line',
    motionDirection: 'slow gentle fades',
    density: 'moderate',
    compositionRules: [
      'Texture and warmth over clinical precision',
      'Organic shapes for accents',
    ],
  },
  bold: {
    moodDefault: 'loud confident unapologetic',
    typographyDirection: 'oversized display type as primary graphic element',
    colorDirection: 'high-saturation blocks, stark contrast pairs',
    spacingDirection: 'tight where type is huge; large breaks between zones',
    radiusDirection: 'none or extreme — no timid middle',
    shadowDirection: 'hard offset or none',
    imageDirection: 'high-contrast, graphic, possibly duotone',
    iconDirection: 'chunky filled or none',
    motionDirection: 'snappy, immediate',
    density: 'moderate',
    compositionRules: [
      'Type is the hero — minimize competing imagery',
      'One bold move per screen, not three',
    ],
  },
  creative: {
    moodDefault: 'expressive original artistic',
    typographyDirection: 'pairing with personality (display + neutral body)',
    colorDirection: 'distinctive palette with intentional accent logic',
    spacingDirection: 'varied rhythm, intentional asymmetry',
    radiusDirection: 'varied by component role',
    shadowDirection: 'light, used for layering not decoration',
    imageDirection: 'art-directed, unique crop or treatment',
    iconDirection: 'cohesive custom-feeling set',
    motionDirection: 'expressive but purposeful',
    density: 'moderate',
    compositionRules: [
      'Show craft — details reward close looking',
      'Consistency still rules; creativity within a system',
    ],
  },
  elegant: {
    moodDefault: 'graceful refined quiet luxury',
    typographyDirection: 'high-contrast serif or refined sans, generous leading',
    colorDirection: 'muted palette + jewel or champagne accent',
    spacingDirection: 'very generous, symmetrical or classical balance',
    radiusDirection: 'subtle or none',
    shadowDirection: 'barely-there',
    imageDirection: 'soft-focus or studio, tonal harmony',
    iconDirection: 'hairline',
    motionDirection: 'slow graceful easing',
    density: 'lean',
    compositionRules: [
      'Classical balance (rule of thirds, golden section)',
      'Restraint is the luxury signal',
    ],
  },
  technical: {
    moodDefault: 'precise transparent engineered',
    typographyDirection: 'mono or grotesque for labels; clean sans body; tabular figures',
    colorDirection: 'neutral base + status/semantic colors used functionally',
    spacingDirection: 'strict grid, consistent gutters',
    radiusDirection: 'small (4px)',
    shadowDirection: 'none; use borders',
    imageDirection: 'diagrams, screenshots, data viz over lifestyle',
    iconDirection: 'stroke technical',
    motionDirection: 'functional transitions only',
    density: 'rich',
    compositionRules: [
      'Data and docs scanability first',
      'Labels and hierarchy over decoration',
    ],
  },
  professional: {
    moodDefault: 'competent dependable clear',
    typographyDirection: 'neutral sans, clear H1–H4 scale',
    colorDirection: 'restrained brand palette, one CTA color',
    spacingDirection: 'consistent 8px grid, 64–96px sections',
    radiusDirection: 'moderate (8px)',
    shadowDirection: 'subtle elevation',
    imageDirection: 'relevant, non-distracting photography or illustration',
    iconDirection: 'outlined consistent set',
    motionDirection: 'subtle, never blocking content',
    density: 'moderate',
    compositionRules: [
      'Clarity over cleverness',
      'Primary action always visible',
      'Max 2 fonts, 1 accent',
    ],
  },
};

const INDUSTRY_STYLE_HINTS: Record<string, keyof typeof STYLE_ARCHETYPES> = {
  dentist: 'premium', clinic: 'premium', medical: 'professional',
  law: 'corporate', finance: 'corporate', realestate: 'premium',
  restaurant: 'warm', hotel: 'luxury', beauty: 'elegant',
  fitness: 'bold', agency: 'creative', portfolio: 'creative',
  saas: 'minimal', tech: 'futuristic', education: 'friendly',
  ecommerce: 'premium', architecture: 'minimal', construction: 'corporate',
  automotive: 'bold', 'professional-services': 'corporate',
  'creative-studio': 'creative',
};

const GOAL_CONVERSION_HINTS: Record<string, string> = {
  booking: 'appointment scheduling with trust + availability signals',
  'lead-generation': 'low-friction contact/quote with proof stacking',
  ecommerce: 'product discovery → add-to-cart with scarcity/review cues',
  portfolio: 'case-study depth with clear contact off-ramp',
  informational: 'content clarity with newsletter/secondary conversion',
  'landing-page': 'single-minded conversion, everything else removed',
};

export function createDesignDirection(
  inputs: DesignDirectionInputs,
  knowledgeHints?: { visualDirection?: string; toneOfVoice?: string; primaryCta?: string },
): DesignDirection {
  emitObservability('decision', 'design-director', `Creating direction for ${inputs.industry} / ${inputs.visualStyle}`);

  const styleKey = resolveStyleKey(inputs, knowledgeHints);
  const archetype = STYLE_ARCHETYPES[styleKey] || STYLE_ARCHETYPES.professional;

  const traces: DecisionTrace[] = [];
  traces.push(trace(
    `${inputs.premiumLevel} ${inputs.industry} positioning with ${inputs.conversionIntent} intent`,
    `visualStyle=${styleKey}`,
    'DesignDirection.visualStyle',
    'select archetype from industry+brief+mood signals',
    'direction consumed by PagePlanner + Constitution builder',
    knowledgeHints?.visualDirection ? 'knowledge' : 'heuristic',
    knowledgeHints?.visualDirection ? { rule: knowledgeHints.visualDirection } : undefined,
  ));

  if (knowledgeHints?.toneOfVoice) {
    traces.push(trace(
      'Industry content tone from knowledge pattern',
      `contentTone→${knowledgeHints.toneOfVoice}`,
      'DesignDirection.mood',
      'merge knowledge tone with archetype mood',
      'tone appears in ContentStrategy',
      'knowledge',
      { rule: knowledgeHints.toneOfVoice },
    ));
  }

  const conversionRule = GOAL_CONVERSION_HINTS[inputs.businessGoal];
  const compositionRules = [...(archetype.compositionRules || [])];
  if (conversionRule) {
    compositionRules.push(`Conversion pattern: ${conversionRule}`);
    traces.push(trace(
      `Business goal ${inputs.businessGoal}`,
      conversionRule,
      'DesignDirection.compositionRules',
      'map goal → composition/conversion rule',
      'primary CTA present in plan',
      'heuristic',
    ));
  }

  if (inputs.premiumLevel === 'luxury') {
    compositionRules.push('Reduce element count; luxury is edit-driven');
  }

  const direction: DesignDirection = {
    visualStyle: styleKey,
    mood: `${archetype.moodDefault} ${inputs.mood}`.trim(),
    typographyDirection: archetype.typographyDirection!,
    colorDirection: archetype.colorDirection!,
    spacingDirection: archetype.spacingDirection!,
    radiusDirection: archetype.radiusDirection!,
    shadowDirection: archetype.shadowDirection!,
    imageDirection: archetype.imageDirection!,
    iconDirection: archetype.iconDirection!,
    motionDirection: archetype.motionDirection!,
    density: archetype.density!,
    contrast: archetype.contrast || 'medium',
    geometry: archetype.geometry || 'mixed',
    typographyCharacter: archetype.typographyCharacter || 'humanist',
    layoutCharacter: archetype.layoutCharacter || 'grid',
    imageCharacter: archetype.imageCharacter || 'product',
    decorationLevel: archetype.decorationLevel || 'restrained',
    motionCharacter: archetype.motionCharacter || 'subtle',
    compositionRules,
    sourceTrace: traces,
  };

  emitObservability('decision', 'design-director', `Direction=${styleKey} density=${direction.density} rules=${compositionRules.length}`);
  return direction;
}

function resolveStyleKey(
  inputs: DesignDirectionInputs,
  hints?: { visualStyle?: string; visualDirection?: string },
): string {
  const explicit = (inputsVisualStyle(inputs) || hints?.visualStyle || hints?.visualDirection || '').toLowerCase();
  for (const key of Object.keys(STYLE_ARCHETYPES)) {
    if (explicit.includes(key)) return key;
  }
  const industryKey = INDUSTRY_STYLE_HINTS[inputs.industry.toLowerCase()];
  if (industryKey) return industryKey;
  if (inputs.premiumLevel === 'luxury') return 'luxury';
  if (inputs.premiumLevel === 'premium') return 'premium';
  return 'professional';
}

function inputsVisualStyle(inputs: DesignDirectionInputs): string {
  return inputs.visualStyle || '';
}

export const DESIGN_STYLE_ARCHETYPES = Object.keys(STYLE_ARCHETYPES);
