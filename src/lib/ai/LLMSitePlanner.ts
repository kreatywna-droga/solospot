/**
 * LLMSitePlanner.ts — LLM-Driven Site Plan Generator
 *
 * Replaces the deterministic keyword-based planner with real AI design.
 * The LLM understands the user's brief, inspects builder capabilities,
 * and creates a coherent SitePlan including:
 * - Section structure and order
 * - Design system (colors, fonts, spacing)
 * - Content strategy (tone, headlines, CTAs)
 * - Asset strategy (image queries, mood, style)
 * - Experience strategy (motion, parallax, effects)
 * - Responsive strategy
 * - Conversion strategy
 *
 * Falls back to deterministic planner if LLM fails or is unavailable.
 */

import type { AIProvider, AICopilotRequest, AICopilotResponse } from './AIProviderTypes';
import { AIProviderRegistry } from './AIProviderRegistry';
import { ToolSurfaceSelector } from './ToolSurfaceSelector';
import type {
  SitePlan,
  SectionPlan,
  DesignSystem,
  Industry,
  SitePurpose,
  VisualDirection,
  ContentStrategy,
  AssetStrategy,
  ExperienceStrategy,
  ResponsiveStrategy,
  ConversionStrategy,
} from './SitePlanTypes';
import { DEFAULT_DESIGN_SYSTEM } from './SitePlanTypes';
import { generateSitePlan as generateDeterministicPlan } from './SitePlanPlanner';
import { runDesignBrain, summarizeDesignBrain } from '../design-brain';

/**
 * Soft-attach Design Brain decisions onto a SitePlan without mutating
 * execution paths (DECISION-042–045: Design Brain never executes).
 * Failures never block planning.
 */
async function attachDesignBrainDecisions(brief: string, plan: SitePlan): Promise<SitePlan> {
  try {
    const brain = await runDesignBrain(brief, { projectId: 'autonomous-generation' });
    const summary = summarizeDesignBrain(brain);
    const enriched: SitePlan = {
      ...plan,
      visualDirection: brain.sitePlan.visualDirection || plan.visualDirection,
      designSystem: { ...plan.designSystem, ...brain.sitePlan.designSystem },
      contentStrategy: {
        ...plan.contentStrategy,
        toneOfVoice: brain.sitePlan.contentStrategy?.toneOfVoice || plan.contentStrategy.toneOfVoice,
        contentDensity: brain.sitePlan.contentStrategy?.contentDensity || plan.contentStrategy.contentDensity,
      },
      conversionStrategy: {
        ...plan.conversionStrategy,
        primaryCTA: brain.sitePlan.conversionStrategy?.primaryCTA || plan.conversionStrategy.primaryCTA,
        primaryCTALocation:
          brain.sitePlan.conversionStrategy?.primaryCTALocation?.length
            ? brain.sitePlan.conversionStrategy.primaryCTALocation
            : plan.conversionStrategy.primaryCTALocation,
        trustSignals:
          brain.sitePlan.conversionStrategy?.trustSignals?.length
            ? brain.sitePlan.conversionStrategy.trustSignals
            : plan.conversionStrategy.trustSignals,
      },
      responsiveStrategy: {
        ...plan.responsiveStrategy,
        ...brain.sitePlan.responsiveStrategy,
      },
      assetStrategy: {
        ...plan.assetStrategy,
        ...brain.sitePlan.assetStrategy,
      },
      experienceStrategy: {
        ...plan.experienceStrategy,
        ...brain.sitePlan.experienceStrategy,
      },
      metadata: {
        ...plan.metadata,
        designBrain: summary,
        designBrainVersion: brain.version,
        designBrainStatus: brain.status,
      },
    };
    console.log('[DesignBrain]', summary);
    return enriched;
  } catch (error) {
    console.warn('[DesignBrain] soft-fail attaching decisions:', error);
    return plan;
  }
}

// ── Planner Configuration ──────────────────────────────────────────

export interface LLMPlannerConfig {
  maxRetries: number;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}

const DEFAULT_PLANNER_CONFIG: LLMPlannerConfig = {
  maxRetries: 2,
  temperature: 0.3,
  maxTokens: 4000,
  timeoutMs: 30000,
};

// ── Planner Result ─────────────────────────────────────────────────

export interface LLMPlannerResult {
  plan: SitePlan;
  plannerType: 'llm' | 'deterministic';
  modelUsed: string;
  reasoning?: string;
  durationMs: number;
  retries: number;
}

// ── Valid Section Roles ────────────────────────────────────────────

const VALID_SECTION_ROLES = new Set([
  'hero', 'features', 'about', 'testimonials', 'cta', 'pricing',
  'faq', 'contact', 'footer', 'navbar', 'gallery', 'team',
  'stats', 'logos', 'newsletter', 'services', 'portfolio',
  'products', 'blog', 'content',
]);

const VALID_NODE_TYPES = new Set([
  'heading', 'text', 'button', 'image', 'icon', 'divider',
  'spacer', 'grid', 'container',
]);

const VALID_VISUAL_DIRECTIONS = new Set<VisualDirection>([
  'premium', 'minimal', 'luxury', 'friendly', 'playful', 'editorial',
  'technical', 'corporate', 'bold', 'futuristic', 'warm', 'elegant',
  'creative', 'professional',
]);

const VALID_INDUSTRIES = new Set<Industry>([
  'restaurant', 'school', 'gym', 'dentist', 'law', 'realestate',
  'saas', 'agency', 'portfolio', 'ecommerce', 'nonprofit', 'clinic',
  'salon', 'tech', 'education', 'fitness', 'beauty', 'other',
]);

const VALID_PURPOSES = new Set<SitePurpose>([
  'lead-generation', 'portfolio', 'informational', 'booking',
  'ecommerce', 'landing-page', 'blog', 'community',
]);

// ── System Prompt ──────────────────────────────────────────────────

function buildSystemPrompt(availableTools: string[]): string {
  return `You are the design and planning intelligence of SoloSpot, a visual website builder.

Your task: Given a user's website brief in natural language, create a complete, coherent website design plan.

## YOUR ROLE
You are a senior web designer and strategist. You understand:
- Visual hierarchy and composition
- User experience and conversion optimization
- Typography and color theory
- Content strategy and copywriting
- Responsive design principles
- Industry-specific design patterns

## AVAILABLE BUILDER CAPABILITIES
You can use these tools to build the website:
${availableTools.map(t => `- ${t}`).join('\n')}

Supported section types: hero, product-grid, feature-grid, testimonials, newsletter, footer, navbar, content, container
Supported node types: text, heading, image, button, video, icon, svg, divider, spacer, container, grid

## DESIGN SYSTEM FIRST
Before defining sections, define a complete design system. Every section will use these tokens. Do NOT generate random colors/fonts per section.

Typography hierarchy (use these exact patterns):
- H1: 48-72px, bold/900, lineHeight 1.05-1.15, letterSpacing -0.02em
- H2: 36-48px, semibold/700, lineHeight 1.15-1.25
- H3: 24-36px, medium/600, lineHeight 1.2-1.3
- Body: 16-18px, regular/400, lineHeight 1.5-1.7
- Small/Caption: 12-14px, regular/400
- CTA: 14-18px, medium/600, uppercase, letterSpacing 0.05em

Color system (5-7 colors max):
- primary: brand main color
- secondary: brand supporting color
- accent: highlight/CTA color
- background: page background
- surface: card/section background
- text: main text color
- muted: secondary text color

Spacing:
- Section padding: 80-120px vertical (desktop), 40-60px (mobile)
- Gap between sections: 0 (inline) or 80-120px (separate)
- Card padding: 24-32px
- Element gap: 16-24px

## DESIGN PRINCIPLES
1. Every design decision must be grounded in the user's brief, industry, audience, and visual direction.
2. Do NOT use generic templates. Design specifically for this brief.
3. Content must be meaningful — no lorem ipsum. Use realistic Polish content.
4. Asset queries must be specific semantic descriptions, not URLs.
5. Experience effects must be appropriate — premium does NOT mean particles everywhere.
6. The plan must be executable with the available builder tools.

## VISUAL DIRECTION INTERPRETATION
When the user says:
- "premium/luxury" → elegant typography, muted palette, generous whitespace, subtle motion
- "minimal" → clean lines, limited colors, maximum whitespace, typography-driven
- "friendly/playful" → rounded shapes, warm colors, approachable language
- "editorial" → magazine-style layouts, strong typography, image-driven
- "technical/corporate" → structured grids, blue/gray palettes, data-driven content
- "bold" → strong contrast, large type, vivid accents
- "futuristic" → dark themes, neon accents, geometric shapes
- "warm" → earth tones, soft textures, personal language
- "elegant" → refined palette, serif fonts, subtle animations
- "creative" → unconventional layouts, unexpected color combinations

## OUTPUT FORMAT
Respond with a SINGLE valid JSON object (no markdown, no explanation outside the JSON) matching this exact schema:

{
  "purpose": "<site purpose>",
  "industry": "<industry>",
  "visualDirection": "<visual direction>",
  "designSystem": {
    "primaryColor": "<hex color>",
    "secondaryColor": "<hex color>",
    "accentColor": "<hex color>",
    "backgroundColor": "<hex color>",
    "surfaceColor": "<hex color>",
    "textColor": "<hex color>",
    "headingFont": "<Google Fonts name>",
    "bodyFont": "<Google Fonts name>",
    "borderRadius": "<value like 8px or 12px>"
  },
  "contentStrategy": {
    "toneOfVoice": "<description of tone>",
    "headlineStyle": "<bold/editorial/minimal/playful/etc>",
    "contentDensity": "lean|moderate|rich",
    "language": "pl",
    "useEmojis": false,
    "ctaStrategy": "<description of CTA approach>"
  },
  "assetStrategy": {
    "heroImageQuery": "<semantic image description>",
    "imageStyle": "photography|illustration|abstract|none",
    "imageMood": "<mood description>",
    "iconStyle": "outlined|filled|gradient",
    "useVideo": false
  },
  "experienceStrategy": {
    "useParallax": false,
    "useScrollReveal": true,
    "useMotion": true,
    "useMeshGradient": false,
    "useParticles": false,
    "use3D": false,
    "intensity": "none|subtle|moderate|bold"
  },
  "responsiveStrategy": {
    "mobileNavStyle": "hamburger|stacked|hidden",
    "mobileHeroLayout": "stacked|split|minimal",
    "mobileTypographyScale": 0.85,
    "tabletBreakpoint": 768,
    "mobileBreakpoint": 480
  },
  "conversionStrategy": {
    "primaryCTA": "<main call to action text>",
    "primaryCTALocation": ["<section roles where CTA appears>"],
    "secondaryCTA": "<optional secondary CTA>",
    "trustSignals": ["<list of trust elements>"],
    "urgencyLevel": "none|subtle|moderate"
  },
  "sections": [
    {
      "id": "<unique kebab-case id>",
      "role": "<section role from valid list>",
      "label": "<human-readable Polish label>",
      "templateType": "<builder section type: hero|feature-grid|content|testimonials|cta|footer|navbar|newsletter|product-grid|stats|logos|gallery|pricing|faq>",
      "content": {
        "heading": "<Polish heading>",
        "subheading": "<Polish subheading>",
        "description": "<Polish description paragraph>",
        "cta": "<Polish CTA text>",
        "items": [{"label": "<item label>", "description": "<item description>"}]
      },
      "images": [{"id": "<unique id>", "role": "hero|feature|team|product|background|icon", "query": "<semantic search query>"}],
      "styles": {},
      "nodes": [
        {
          "id": "<unique id>",
          "type": "<node type>",
          "props": {"text": "<content>"},
          "styles": {}
        }
      ]
    }
  ],
  "pages": [{"id": "page-home", "name": "Strona główna", "purpose": "<purpose>", "sections": ["<section ids>"]}],
  "metadata": {
    "title": "<site title>",
    "description": "<meta description>",
    "language": "pl",
    "generatedAt": "<ISO timestamp>"
  }
}

## IMPORTANT RULES
1. Generate 6-12 sections depending on what the brief requires.
2. Every section must have a unique id (kebab-case).
3. Every section must have real Polish content — no placeholders.
4. Design system colors must form a coherent palette.
5. Font choices must match the visual direction.
6. Asset queries must be descriptive enough for image search.
7. Experience effects must be justified by the visual direction.
8. CTA placements must align with conversion strategy.
9. Mobile strategy must be explicitly defined.
10. The JSON must be parseable — no trailing commas, no comments.`;
}

// ── Brief Context Builder ──────────────────────────────────────────

function buildBriefContext(brief: string): string {
  return `## USER BRIEF
"${brief}"

## YOUR TASK
Analyze this brief and create a complete website design plan.

Consider:
1. What industry/domain is this?
2. What is the primary purpose?
3. What visual direction fits?
4. What sections are needed and in what order?
5. What content should each section have?
6. What design system reflects this brand?
7. What assets are needed?
8. What experience/motion is appropriate?
9. What conversion strategy works?
10. How should it adapt to mobile?

Respond with the complete JSON plan.`;
}

// ── Validation ─────────────────────────────────────────────────────

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateSitePlan(plan: any): ValidationResult {
  const errors: string[] = [];

  if (!plan || typeof plan !== 'object') {
    return { valid: false, errors: ['Plan is not an object'] };
  }

  // Required top-level fields
  if (!plan.purpose || !VALID_PURPOSES.has(plan.purpose)) {
    errors.push(`Invalid purpose: ${plan.purpose}`);
  }
  if (!plan.industry || !VALID_INDUSTRIES.has(plan.industry)) {
    errors.push(`Invalid industry: ${plan.industry}`);
  }
  if (!plan.visualDirection || !VALID_VISUAL_DIRECTIONS.has(plan.visualDirection)) {
    errors.push(`Invalid visualDirection: ${plan.visualDirection}`);
  }

  // Design system
  if (!plan.designSystem || typeof plan.designSystem !== 'object') {
    errors.push('Missing or invalid designSystem');
  } else {
    const ds = plan.designSystem;
    for (const field of ['primaryColor', 'secondaryColor', 'backgroundColor', 'textColor', 'headingFont', 'bodyFont']) {
      if (!ds[field] || typeof ds[field] !== 'string') {
        errors.push(`designSystem.${field} is required and must be a string`);
      }
    }
  }

  // Sections
  if (!Array.isArray(plan.sections) || plan.sections.length === 0) {
    errors.push('sections must be a non-empty array');
  } else {
    for (let i = 0; i < plan.sections.length; i++) {
      const sec = plan.sections[i];
      if (!sec.id || typeof sec.id !== 'string') {
        errors.push(`sections[${i}].id is required`);
      }
      if (!sec.role || !VALID_SECTION_ROLES.has(sec.role)) {
        errors.push(`sections[${i}].role invalid: ${sec.role}`);
      }
      if (!sec.label || typeof sec.label !== 'string') {
        errors.push(`sections[${i}].label is required`);
      }
      if (!sec.templateType || typeof sec.templateType !== 'string') {
        errors.push(`sections[${i}].templateType is required`);
      }
      if (!sec.content || typeof sec.content !== 'object') {
        errors.push(`sections[${i}].content is required`);
      }
      if (!Array.isArray(sec.images)) {
        errors.push(`sections[${i}].images must be an array`);
      }
      if (sec.nodes && !Array.isArray(sec.nodes)) {
        errors.push(`sections[${i}].nodes must be an array if present`);
      }
      if (sec.nodes) {
        for (let j = 0; j < sec.nodes.length; j++) {
          const node = sec.nodes[j];
          if (!node.type || !VALID_NODE_TYPES.has(node.type)) {
            errors.push(`sections[${i}].nodes[${j}].type invalid: ${node.type}`);
          }
        }
      }
    }
  }

  // Strategies (optional but validate if present)
  if (plan.contentStrategy && typeof plan.contentStrategy !== 'object') {
    errors.push('contentStrategy must be an object');
  }
  if (plan.assetStrategy && typeof plan.assetStrategy !== 'object') {
    errors.push('assetStrategy must be an object');
  }
  if (plan.experienceStrategy && typeof plan.experienceStrategy !== 'object') {
    errors.push('experienceStrategy must be an object');
  }

  // Metadata
  if (!plan.metadata || typeof plan.metadata !== 'object') {
    errors.push('metadata is required');
  } else {
    if (!plan.metadata.title) errors.push('metadata.title is required');
  }

  return { valid: errors.length === 0, errors };
}

// ── Plan Normalization ─────────────────────────────────────────────

function normalizePlan(raw: any, brief: string): SitePlan {
  const now = new Date().toISOString();

  // Ensure design system has all required fields with defaults
  const ds: DesignSystem = {
    primaryColor: raw.designSystem?.primaryColor || DEFAULT_DESIGN_SYSTEM.primaryColor,
    secondaryColor: raw.designSystem?.secondaryColor || DEFAULT_DESIGN_SYSTEM.secondaryColor,
    accentColor: raw.designSystem?.accentColor || DEFAULT_DESIGN_SYSTEM.accentColor,
    backgroundColor: raw.designSystem?.backgroundColor || DEFAULT_DESIGN_SYSTEM.backgroundColor,
    surfaceColor: raw.designSystem?.surfaceColor || DEFAULT_DESIGN_SYSTEM.surfaceColor,
    textColor: raw.designSystem?.textColor || DEFAULT_DESIGN_SYSTEM.textColor,
    headingFont: raw.designSystem?.headingFont || DEFAULT_DESIGN_SYSTEM.headingFont,
    bodyFont: raw.designSystem?.bodyFont || DEFAULT_DESIGN_SYSTEM.bodyFont,
    borderRadius: raw.designSystem?.borderRadius || DEFAULT_DESIGN_SYSTEM.borderRadius,
  };

  // Normalize sections
  const sections: SectionPlan[] = (raw.sections || []).map((sec: any, i: number) => ({
    id: sec.id || `sec-${i}`,
    role: VALID_SECTION_ROLES.has(sec.role) ? sec.role : 'content',
    label: sec.label || `Sekcja ${i + 1}`,
    templateType: sec.templateType || 'content',
    content: {
      heading: sec.content?.heading || '',
      subheading: sec.content?.subheading || '',
      description: sec.content?.description || '',
      cta: sec.content?.cta || '',
      items: Array.isArray(sec.content?.items) ? sec.content.items : [],
    },
    images: Array.isArray(sec.images) ? sec.images : [],
    styles: sec.styles && typeof sec.styles === 'object' ? sec.styles : {},
    nodes: Array.isArray(sec.nodes) ? sec.nodes : undefined,
    experienceConfig: sec.experienceConfig || undefined,
  }));

  // Normalize strategies
  const contentStrategy: ContentStrategy = {
    toneOfVoice: raw.contentStrategy?.toneOfVoice || 'professional',
    headlineStyle: raw.contentStrategy?.headlineStyle || 'bold',
    contentDensity: raw.contentStrategy?.contentDensity || 'moderate',
    language: raw.contentStrategy?.language || 'pl',
    useEmojis: raw.contentStrategy?.useEmojis || false,
    ctaStrategy: raw.contentStrategy?.ctaStrategy || 'primary-action',
  };

  const assetStrategy: AssetStrategy = {
    heroImageQuery: raw.assetStrategy?.heroImageQuery,
    imageStyle: raw.assetStrategy?.imageStyle || 'photography',
    imageMood: raw.assetStrategy?.imageMood || 'professional',
    iconStyle: raw.assetStrategy?.iconStyle || 'outlined',
    useVideo: raw.assetStrategy?.useVideo || false,
  };

  const experienceStrategy: ExperienceStrategy = {
    useParallax: raw.experienceStrategy?.useParallax || false,
    useScrollReveal: raw.experienceStrategy?.useScrollReveal ?? true,
    useMotion: raw.experienceStrategy?.useMotion ?? true,
    useMeshGradient: raw.experienceStrategy?.useMeshGradient || false,
    useParticles: raw.experienceStrategy?.useParticles || false,
    use3D: raw.experienceStrategy?.use3D || false,
    intensity: raw.experienceStrategy?.intensity || 'subtle',
  };

  const responsiveStrategy: ResponsiveStrategy = {
    mobileNavStyle: raw.responsiveStrategy?.mobileNavStyle || 'hamburger',
    mobileHeroLayout: raw.responsiveStrategy?.mobileHeroLayout || 'stacked',
    mobileTypographyScale: raw.responsiveStrategy?.mobileTypographyScale || 0.85,
    tabletBreakpoint: raw.responsiveStrategy?.tabletBreakpoint || 768,
    mobileBreakpoint: raw.responsiveStrategy?.mobileBreakpoint || 480,
  };

  const conversionStrategy: ConversionStrategy = {
    primaryCTA: raw.conversionStrategy?.primaryCTA || 'Dowiedz się więcej',
    primaryCTALocation: Array.isArray(raw.conversionStrategy?.primaryCTALocation)
      ? raw.conversionStrategy.primaryCTALocation
      : ['hero', 'footer'],
    secondaryCTA: raw.conversionStrategy?.secondaryCTA,
    trustSignals: Array.isArray(raw.conversionStrategy?.trustSignals)
      ? raw.conversionStrategy.trustSignals
      : [],
    urgencyLevel: raw.conversionStrategy?.urgencyLevel || 'none',
  };

  // Pages
  const pageSections = sections.map((s: SectionPlan) => s.id);
  const pages = Array.isArray(raw.pages) && raw.pages.length > 0
    ? raw.pages.map((p: any) => ({
        id: p.id || 'page-home',
        name: p.name || 'Strona główna',
        purpose: p.purpose || raw.purpose || 'informational',
        sections: Array.isArray(p.sections) ? p.sections : pageSections,
      }))
    : [{ id: 'page-home', name: 'Strona główna', purpose: raw.purpose || 'informational', sections: pageSections }];

  return {
    purpose: VALID_PURPOSES.has(raw.purpose) ? raw.purpose : 'informational',
    industry: VALID_INDUSTRIES.has(raw.industry) ? raw.industry : 'other',
    visualDirection: VALID_VISUAL_DIRECTIONS.has(raw.visualDirection) ? raw.visualDirection : 'professional',
    designSystem: ds,
    contentStrategy,
    assetStrategy,
    experienceStrategy,
    responsiveStrategy,
    conversionStrategy,
    sections,
    pages,
    metadata: {
      title: raw.metadata?.title || brief.slice(0, 60),
      description: raw.metadata?.description || brief.slice(0, 160),
      language: raw.metadata?.language || 'pl',
      generatedAt: raw.metadata?.generatedAt || now,
      plannerType: 'llm',
    },
  };
}

// ── JSON Extraction ────────────────────────────────────────────────

function extractJSON(text: string): any | null {
  // Try direct parse
  try {
    return JSON.parse(text);
  } catch {
    // continue
  }

  // Try extracting from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch {
      // continue
    }
  }

  // Try finding JSON object boundaries
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {
      // continue
    }
  }

  return null;
}

// ── Main LLM Planner ──────────────────────────────────────────────

export async function generateLLMSitePlan(
  brief: string,
  config: Partial<LLMPlannerConfig> = {}
): Promise<LLMPlannerResult> {
  const cfg = { ...DEFAULT_PLANNER_CONFIG, ...config };
  const startTime = Date.now();

  // Check if AI provider is available
  const registry = AIProviderRegistry.getInstance();
  const provider = registry.getActiveProvider();

  if (!provider || !provider.isConfigured()) {
    console.log('[LLMSitePlanner] No AI provider available, falling back to deterministic planner');
    const basePlan = generateDeterministicPlan(brief);
    const plan = await attachDesignBrainDecisions(brief, basePlan);
    return {
      plan,
      plannerType: 'deterministic',
      modelUsed: 'none',
      durationMs: Date.now() - startTime,
      retries: 0,
    };
  }

  // DUAL-PATH UNIFICATION GATE: planner may only see the SITE_GENERATION
  // Tool Surface — never the full BUILDER_TOOL_DEFINITIONS (batch_execute etc.).
  const availableTools = ToolSurfaceSelector.getToolNamesForIntent('SITE_GENERATION');

  // Build messages
  const systemPrompt = buildSystemPrompt(availableTools);
  const briefContext = buildBriefContext(brief);

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: briefContext },
  ];

  let lastError = '';
  let retries = 0;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    retries = attempt;

    try {
      const request: AICopilotRequest = {
        prompt: briefContext,
        messages,
        builderContext: {
          storeId: 'ai-planner',
          tenantId: 'ai-planner',
          pageId: 'page-home',
          selectedNodeId: undefined,
          selectedNodeType: undefined,
          selectedNodeLabel: undefined,
          viewport: 'DESKTOP',
          documentNodeCount: 0,
          pageName: 'Strona główna',
          availableCapabilitiesCount: 18,
        },
        tools: [],
        routerMode: 'AUTO',
      };

      const response: AICopilotResponse = await provider.generateWithTools(request);

      if (response.status !== 'SUCCESS' || !response.message) {
        lastError = response.error || response.message || 'Unknown error';
        console.warn(`[LLMSitePlanner] Attempt ${attempt + 1} failed:`, lastError);
        continue;
      }

      // Extract JSON from response
      const rawPlan = extractJSON(response.message);
      if (!rawPlan) {
        lastError = 'Could not extract valid JSON from LLM response';
        console.warn(`[LLMSitePlanner] Attempt ${attempt + 1}: ${lastError}`);
        continue;
      }

      // Validate
      const validation = validateSitePlan(rawPlan);
      if (!validation.valid) {
        lastError = `Validation errors: ${validation.errors.join('; ')}`;
        console.warn(`[LLMSitePlanner] Attempt ${attempt + 1} validation failed:`, validation.errors);
        continue;
      }

      // Normalize and return
      const basePlan = normalizePlan(rawPlan, brief);
      const plan = await attachDesignBrainDecisions(brief, basePlan);
      return {
        plan,
        plannerType: 'llm',
        modelUsed: response.model || 'unknown',
        reasoning: response.message.slice(0, 500),
        durationMs: Date.now() - startTime,
        retries: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`[LLMSitePlanner] Attempt ${attempt + 1} exception:`, lastError);
    }
  }

  // All retries exhausted — fall back to deterministic
  console.log(`[LLMSitePlanner] All ${cfg.maxRetries + 1} attempts failed, falling back to deterministic planner. Last error: ${lastError}`);
  const basePlan = generateDeterministicPlan(brief);
  const plan = await attachDesignBrainDecisions(brief, basePlan);
  return {
    plan,
    plannerType: 'deterministic',
    modelUsed: 'deterministic-fallback',
    durationMs: Date.now() - startTime,
    retries,
  };
}
