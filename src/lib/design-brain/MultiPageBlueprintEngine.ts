/**
 * MultiPageBlueprintEngine.ts — Multi-Page Blueprint & Narrative Choreography
 *
 * Generates an end-to-end multi-page website blueprint with information architecture,
 * narrative arcs per page (Opening → Identity → Proof → Story → Depth → Action),
 * Design Rhythm (alternating visual weights & contrast), and deterministic
 * Experience selection respecting WebGL concurrency & capability budgets.
 */

import type { SectionRole, SectionPlan, DesignSystem } from '../ai/SitePlanTypes';
import type { BuildIntent, PageRequirement } from './BuildIntent';
import {
  classifyExperienceIntent,
  scoreExperiencesForRole,
  type ExperienceArchetype,
  type ExperienceBriefProfile,
} from './ExperienceIntelligence';
import { getAllExperiences } from '../experience/ExperienceCatalog';

export type NarrativeStage = 'opening' | 'identity' | 'proof' | 'story' | 'depth' | 'action';

export interface BlueprintSectionPlan {
  id: string;
  role: SectionRole;
  label: string;
  templateType: string;
  narrativeStage: NarrativeStage;
  visualWeight: 'light' | 'normal' | 'heavy' | 'accent';
  headline: string;
  subheadline: string;
  ctaText?: string;
  experienceId?: string;
  experienceConfig?: Record<string, unknown>;
  fallbackMode?: 'static' | 'css_only' | 'reduced_motion';
}

export interface BlueprintPagePlan {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  purpose: PageRequirement['purpose'];
  isHome: boolean;
  sections: BlueprintSectionPlan[];
  narrativeGoal: string;
  conversionPath: {
    primaryTargetCTA: string;
    targetPageSlug?: string;
  };
}

export interface NavigationItem {
  id: string;
  label: string;
  slug: string;
  targetPageId: string;
  isPrimaryCTA?: boolean;
}

export interface SiteInformationArchitecture {
  primaryNavigation: NavigationItem[];
  footerNavigation: NavigationItem[];
  globalConversionGoal: string;
  crossPageLinks: Array<{ sourcePageId: string; targetPageId: string; context: string }>;
}

export interface MultiPageWebsiteBlueprint {
  id: string;
  intentId: string;
  brandName: string;
  industry: string;
  visualStyle: string;
  experienceArchetype: ExperienceArchetype;
  pages: BlueprintPagePlan[];
  informationArchitecture: SiteInformationArchitecture;
  designSystem: DesignSystem;
  generatedAt: string;
  validationStatus: 'VALID' | 'INVALID';
  validationErrors?: string[];
}

/**
 * Standard narrative section template by page purpose.
 */
const PAGE_SECTION_TEMPLATES: Record<PageRequirement['purpose'], Array<{ role: SectionRole; stage: NarrativeStage; weight: 'light' | 'normal' | 'heavy' | 'accent' }>> = {
  home: [
    { role: 'navbar', stage: 'opening', weight: 'normal' },
    { role: 'hero', stage: 'opening', weight: 'heavy' },
    { role: 'logos', stage: 'proof', weight: 'light' },
    { role: 'features', stage: 'identity', weight: 'normal' },
    { role: 'services', stage: 'story', weight: 'accent' },
    { role: 'stats', stage: 'proof', weight: 'light' },
    { role: 'testimonials', stage: 'proof', weight: 'normal' },
    { role: 'cta', stage: 'action', weight: 'heavy' },
    { role: 'footer', stage: 'action', weight: 'normal' },
  ],
  about: [
    { role: 'navbar', stage: 'opening', weight: 'normal' },
    { role: 'hero', stage: 'opening', weight: 'heavy' },
    { role: 'about', stage: 'story', weight: 'normal' },
    { role: 'team', stage: 'identity', weight: 'normal' },
    { role: 'stats', stage: 'proof', weight: 'light' },
    { role: 'cta', stage: 'action', weight: 'heavy' },
    { role: 'footer', stage: 'action', weight: 'normal' },
  ],
  services: [
    { role: 'navbar', stage: 'opening', weight: 'normal' },
    { role: 'hero', stage: 'opening', weight: 'heavy' },
    { role: 'services', stage: 'identity', weight: 'normal' },
    { role: 'features', stage: 'story', weight: 'normal' },
    { role: 'pricing', stage: 'depth', weight: 'accent' },
    { role: 'faq', stage: 'depth', weight: 'light' },
    { role: 'cta', stage: 'action', weight: 'heavy' },
    { role: 'footer', stage: 'action', weight: 'normal' },
  ],
  products: [
    { role: 'navbar', stage: 'opening', weight: 'normal' },
    { role: 'hero', stage: 'opening', weight: 'heavy' },
    { role: 'products', stage: 'identity', weight: 'heavy' },
    { role: 'gallery', stage: 'story', weight: 'accent' },
    { role: 'testimonials', stage: 'proof', weight: 'normal' },
    { role: 'cta', stage: 'action', weight: 'heavy' },
    { role: 'footer', stage: 'action', weight: 'normal' },
  ],
  portfolio: [
    { role: 'navbar', stage: 'opening', weight: 'normal' },
    { role: 'hero', stage: 'opening', weight: 'heavy' },
    { role: 'gallery', stage: 'identity', weight: 'heavy' },
    { role: 'portfolio', stage: 'story', weight: 'accent' },
    { role: 'testimonials', stage: 'proof', weight: 'normal' },
    { role: 'cta', stage: 'action', weight: 'heavy' },
    { role: 'footer', stage: 'action', weight: 'normal' },
  ],
  pricing: [
    { role: 'navbar', stage: 'opening', weight: 'normal' },
    { role: 'hero', stage: 'opening', weight: 'heavy' },
    { role: 'pricing', stage: 'depth', weight: 'heavy' },
    { role: 'faq', stage: 'depth', weight: 'light' },
    { role: 'cta', stage: 'action', weight: 'accent' },
    { role: 'footer', stage: 'action', weight: 'normal' },
  ],
  contact: [
    { role: 'navbar', stage: 'opening', weight: 'normal' },
    { role: 'hero', stage: 'opening', weight: 'normal' },
    { role: 'contact', stage: 'action', weight: 'heavy' },
    { role: 'faq', stage: 'depth', weight: 'light' },
    { role: 'footer', stage: 'action', weight: 'normal' },
  ],
  blog: [
    { role: 'navbar', stage: 'opening', weight: 'normal' },
    { role: 'hero', stage: 'opening', weight: 'normal' },
    { role: 'blog', stage: 'story', weight: 'heavy' },
    { role: 'newsletter', stage: 'action', weight: 'accent' },
    { role: 'footer', stage: 'action', weight: 'normal' },
  ],
  custom: [
    { role: 'navbar', stage: 'opening', weight: 'normal' },
    { role: 'hero', stage: 'opening', weight: 'heavy' },
    { role: 'content', stage: 'story', weight: 'normal' },
    { role: 'cta', stage: 'action', weight: 'heavy' },
    { role: 'footer', stage: 'action', weight: 'normal' },
  ],
};

/**
 * Color palette palettes tailored to visual direction.
 */
const PALETTES_BY_STYLE: Record<string, Partial<DesignSystem>> = {
  luxury: {
    primaryColor: '#D4AF37',
    secondaryColor: '#AA7C11',
    accentColor: '#F3E5AB',
    backgroundColor: '#0A0A0B',
    surfaceColor: '#141416',
    textColor: '#F7F7F7',
    headingFont: 'Playfair Display',
    bodyFont: 'Plus Jakarta Sans',
    borderRadius: '4px',
  },
  futuristic: {
    primaryColor: '#6366F1',
    secondaryColor: '#8B5CF6',
    accentColor: '#06B6D4',
    backgroundColor: '#030712',
    surfaceColor: '#0F172A',
    textColor: '#F8FAFC',
    headingFont: 'Space Grotesk',
    bodyFont: 'Inter',
    borderRadius: '16px',
  },
  minimal: {
    primaryColor: '#18181B',
    secondaryColor: '#3F3F46',
    accentColor: '#71717A',
    backgroundColor: '#FAFAFA',
    surfaceColor: '#FFFFFF',
    textColor: '#09090B',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    borderRadius: '8px',
  },
  creative: {
    primaryColor: '#EC4899',
    secondaryColor: '#8B5CF6',
    accentColor: '#3B82F6',
    backgroundColor: '#090D16',
    surfaceColor: '#111827',
    textColor: '#F9FAFB',
    headingFont: 'Outfit',
    bodyFont: 'Plus Jakarta Sans',
    borderRadius: '20px',
  },
  bold: {
    primaryColor: '#EF4444',
    secondaryColor: '#F97316',
    accentColor: '#FBBF24',
    backgroundColor: '#0B0F19',
    surfaceColor: '#1E293B',
    textColor: '#FFFFFF',
    headingFont: 'Cabinet Grotesk',
    bodyFont: 'Inter',
    borderRadius: '12px',
  },
  professional: {
    primaryColor: '#2563EB',
    secondaryColor: '#1D4ED8',
    accentColor: '#38BDF8',
    backgroundColor: '#0F172A',
    surfaceColor: '#1E293B',
    textColor: '#F8FAFC',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    borderRadius: '10px',
  },
};

/**
 * Builds an end-to-end multi-page website blueprint from a validated BuildIntent.
 */
export function buildMultiPageWebsiteBlueprint(intent: BuildIntent): MultiPageWebsiteBlueprint {
  const expProfile: ExperienceBriefProfile = classifyExperienceIntent(
    intent.brief,
    intent.brand.visualStyle
  );

  const styleDefaults = PALETTES_BY_STYLE[intent.brand.visualStyle] || PALETTES_BY_STYLE.professional;
  const designSystem: DesignSystem = {
    primaryColor: styleDefaults.primaryColor || '#2563EB',
    secondaryColor: styleDefaults.secondaryColor || '#1D4ED8',
    accentColor: styleDefaults.accentColor || '#38BDF8',
    backgroundColor: styleDefaults.backgroundColor || '#0F172A',
    surfaceColor: styleDefaults.surfaceColor || '#1E293B',
    textColor: styleDefaults.textColor || '#F8FAFC',
    headingFont: styleDefaults.headingFont || 'Inter',
    bodyFont: styleDefaults.bodyFont || 'Inter',
    borderRadius: styleDefaults.borderRadius || '12px',
  };

  // Build Information Architecture navigation
  const primaryNavigation: NavigationItem[] = intent.pageRequirements.map((p) => ({
    id: `nav_${p.id}`,
    label: p.title,
    slug: p.slug,
    targetPageId: p.id,
    isPrimaryCTA: p.purpose === 'contact' || p.purpose === 'pricing',
  }));

  const footerNavigation: NavigationItem[] = intent.pageRequirements.map((p) => ({
    id: `foot_${p.id}`,
    label: p.title,
    slug: p.slug,
    targetPageId: p.id,
  }));

  const pages: BlueprintPagePlan[] = [];

  for (const pageReq of intent.pageRequirements) {
    const rawTemplates = PAGE_SECTION_TEMPLATES[pageReq.purpose] || PAGE_SECTION_TEMPLATES.custom;
    const sections: BlueprintSectionPlan[] = [];

    // Track active WebGL count for this page to enforce concurrency budget
    let webGlCount = 0;
    const maxWebGl = intent.constraints.motion.maxWebGLCanvasPerPage || 2;

    for (let i = 0; i < rawTemplates.length; i++) {
      const t = rawTemplates[i];
      const sectionId = `${pageReq.id}_${t.role}_${i}`;

      // Query candidate experiences for role
      const candidateExps = scoreExperiencesForRole(t.role, expProfile);
      let chosenExp: { experienceId: string; config: Record<string, unknown> } | undefined;

      if (candidateExps.length > 0 && t.role !== 'navbar' && t.role !== 'footer') {
        const top = candidateExps[0];
        const allExperiences = getAllExperiences();
        const regEntry = allExperiences.find((e) => e.id === top.experienceId);
        const isWebGL = (regEntry?.category || '').includes('shader') || (regEntry?.category || '').includes('3d') || (regEntry?.category || '').includes('particle');

        if (!isWebGL || webGlCount < maxWebGl) {
          chosenExp = {
            experienceId: top.experienceId,
            config: (top.runtimeConfig as Record<string, unknown>) || {},
          };
          if (isWebGL) webGlCount++;
        }
      }

      const headline = generateSectionHeadline(t.role, pageReq.title, intent.brand.name, intent.brand.industry);
      const subheadline = generateSectionSubheadline(t.role, intent.brand.name, intent.brand.industry);

      sections.push({
        id: sectionId,
        role: t.role,
        label: `${t.role.toUpperCase()} — ${pageReq.title}`,
        templateType: t.role === 'features' ? 'feature-grid' : t.role === 'services' ? 'feature-grid' : t.role === 'products' ? 'product-grid' : t.role,
        narrativeStage: t.stage,
        visualWeight: t.weight,
        headline,
        subheadline,
        ctaText: t.role === 'hero' || t.role === 'cta' ? intent.businessGoal.primaryGoal : undefined,
        experienceId: chosenExp?.experienceId,
        experienceConfig: chosenExp?.config,
        fallbackMode: intent.constraints.motion.respectReducedMotion ? 'reduced_motion' : 'static',
      });
    }

    pages.push({
      id: pageReq.id,
      slug: pageReq.slug,
      name: pageReq.title,
      title: `${pageReq.title} | ${intent.brand.name}`,
      description: `Oficjalna strona ${intent.brand.name} - ${pageReq.title}. ${intent.brand.tagline || ''}`,
      purpose: pageReq.purpose,
      isHome: pageReq.isHome,
      sections,
      narrativeGoal: `Poprowadź użytkownika przez ${pageReq.title} ku akcji: ${intent.businessGoal.primaryAction}`,
      conversionPath: {
        primaryTargetCTA: intent.businessGoal.primaryAction,
        targetPageSlug: intent.pageRequirements.find((p) => p.purpose === 'contact')?.slug || 'kontakt',
      },
    });
  }

  const blueprint: MultiPageWebsiteBlueprint = {
    id: `bp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    intentId: intent.id,
    brandName: intent.brand.name,
    industry: intent.brand.industry,
    visualStyle: intent.brand.visualStyle,
    experienceArchetype: intent.experienceArchetype,
    pages,
    informationArchitecture: {
      primaryNavigation,
      footerNavigation,
      globalConversionGoal: intent.businessGoal.primaryGoal,
      crossPageLinks: pages.map((p) => ({
        sourcePageId: p.id,
        targetPageId: pages.find((target) => target.purpose === 'contact')?.id || pages[0].id,
        context: `CTA footer link to contact from ${p.name}`,
      })),
    },
    designSystem,
    generatedAt: new Date().toISOString(),
    validationStatus: 'VALID',
  };

  const validation = validateMultiPageBlueprint(blueprint);
  blueprint.validationStatus = validation.valid ? 'VALID' : 'INVALID';
  blueprint.validationErrors = validation.errors.length > 0 ? validation.errors : undefined;

  return blueprint;
}

/**
 * Validates the generated MultiPageWebsiteBlueprint.
 */
export function validateMultiPageBlueprint(
  blueprint: MultiPageWebsiteBlueprint
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!blueprint.pages || blueprint.pages.length === 0) {
    errors.push('Blueprint nie zawiera żadnych stron.');
  }

  const homePages = (blueprint.pages || []).filter((p) => p.isHome);
  if (homePages.length !== 1) {
    errors.push(`Blueprint musi zawierać dokładnie jedną stronę główną (isHome: true). Znaleziono: ${homePages.length}.`);
  }

  const pageIds = new Set<string>();
  const slugs = new Set<string>();

  for (const page of blueprint.pages || []) {
    if (pageIds.has(page.id)) {
      errors.push(`Zduplikowane ID strony w Blueprint: ${page.id}`);
    }
    pageIds.add(page.id);

    if (slugs.has(page.slug)) {
      errors.push(`Zduplikowany slug strony w Blueprint: "${page.slug}"`);
    }
    slugs.add(page.slug);

    if (!page.sections || page.sections.length === 0) {
      errors.push(`Strona "${page.name}" (${page.id}) nie posiada żadnych sekcji.`);
    }

    const sectionIds = new Set<string>();
    for (const sec of page.sections || []) {
      if (sectionIds.has(sec.id)) {
        errors.push(`Zduplikowane ID sekcji "${sec.id}" na stronie "${page.name}".`);
      }
      sectionIds.add(sec.id);
    }
  }

  // Verify navigation references exist
  for (const nav of blueprint.informationArchitecture.primaryNavigation) {
    if (!pageIds.has(nav.targetPageId)) {
      errors.push(`Element nawigacji "${nav.label}" odwołuje się do nieistniejącej strony ${nav.targetPageId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function generateSectionHeadline(role: SectionRole, pageTitle: string, brandName: string, industry: string): string {
  switch (role) {
    case 'hero':
      return pageTitle === 'Strona Główna'
        ? `Poznaj nową jakość z ${brandName}`
        : `${pageTitle} — ${brandName}`;
    case 'features':
      return 'Dlaczego warto nas wybrać';
    case 'services':
      return 'Kompleksowa oferta dopasowana do Ciebie';
    case 'about':
      return `Nasza pasja i doświadczenie w branży ${industry}`;
    case 'products':
      return 'Bestsellery i nowości';
    case 'testimonials':
      return 'Zaufali nam liderzy i klienci';
    case 'stats':
      return 'Liczby, które mówią same za siebie';
    case 'pricing':
      return 'Przejrzyste pakiety i warunki';
    case 'faq':
      return 'Często zadawane pytania';
    case 'contact':
      return 'Skontaktuj się z naszym zespołem';
    case 'gallery':
    case 'portfolio':
      return 'Nasze wybrane realizacje';
    case 'team':
      return 'Poznaj ludzi stojących za sukcesem';
    case 'cta':
      return 'Zrób kolejny krok razem z nami';
    default:
      return `${brandName} — ${role}`;
  }
}

function generateSectionSubheadline(role: SectionRole, brandName: string, industry: string): string {
  switch (role) {
    case 'hero':
      return `Tworzymy innowacyjne rozwiązania w sektorze ${industry}. Przekonaj się, jak możemy pomóc Twojej marce.`;
    case 'features':
      return 'Najwyższe standardy, nowoczesne podejście i pełne wsparcie na każdym etapie.';
    case 'services':
      return 'Zobacz, w czym możemy pomóc. Dedykowane rozwiązania dla najbardziej wymagających.';
    case 'testimonials':
      return 'Przeczytaj autentyczne opinie osób i firm, które z nami współpracują.';
    case 'cta':
      return 'Umów bezpłatną konsultację lub rozpocznij współpracę już dziś.';
    default:
      return `Profesjonalne podejście ${brandName} w każdym detalu.`;
  }
}
