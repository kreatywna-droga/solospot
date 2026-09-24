/**
 * PagePlanner2.ts — Knowledge + Design Brain enriched SitePlan planner
 *
 * Wraps existing deterministic SitePlanPlanner (SSOT for section templates)
 * and overlays Design Brain decisions: direction, architecture, blueprint,
 * style system, responsive strategy, conversion CTA.
 *
 * Does NOT replace SitePlanPlanner — composes on top of it.
 */

import type {
  SitePlan, SectionPlan, DesignSystem, VisualDirection, SectionRole,
} from '../ai/SitePlanTypes';
import { generateSitePlan } from '../ai/SitePlanPlanner';
import type {
  DesignDirection, WebsiteArchitecture, PageArchitecturePlan, DesignConstitution,
  ResponsivePlan, DecisionTrace, ContentPlan,
} from './types';
import type { WebsiteBlueprintDecision } from './BlueprintEngine';
import type { StyleDecision, StyleApplicationPlan } from './StyleSystemIntelligence';
import { emitObservability } from './Observability';

export interface PagePlanner2Input {
  brief: string;
  direction: DesignDirection;
  architecture?: WebsiteArchitecture | null;
  pagePlans?: PageArchitecturePlan[];
  constitution?: DesignConstitution | null;
  styleApplication?: StyleApplicationPlan | null;
  styleDecision?: StyleDecision | null;
  responsivePlan?: ResponsivePlan | null;
  blueprint?: WebsiteBlueprintDecision | null;
  contentPlan?: ContentPlan | null;
  traces?: DecisionTrace[];
}

const VALID_VISUAL: VisualDirection[] = [
  'premium', 'minimal', 'luxury', 'friendly', 'playful', 'editorial', 'technical',
  'corporate', 'bold', 'futuristic', 'warm', 'elegant', 'creative', 'professional',
];

export function toVisualDirection(style: string): VisualDirection {
  const s = style.toLowerCase();
  for (const v of VALID_VISUAL) {
    if (s.includes(v)) return v;
  }
  return 'professional';
}

/** Map SectionRole name used in architecture sequences to plan roles. */
function coerceRole(token: string): SectionRole | null {
  const t = token.toLowerCase().replace(/-/g, '');
  const map: Record<string, SectionRole> = {
    navbar: 'navbar', navigation: 'navbar', header: 'navbar',
    hero: 'hero',
    features: 'features', valueprops: 'features', benefits: 'features',
    services: 'services', servicelist: 'services', programs: 'services', offerings: 'services',
    about: 'about', story: 'about', philosophy: 'about', values: 'about', approach: 'about',
    testimonials: 'testimonials', reviews: 'testimonials', opinions: 'testimonials',
    cta: 'cta', bookingcta: 'cta', reservation: 'cta',
    pricing: 'pricing', tiers: 'pricing', comparison: 'pricing',
    faq: 'faq', faqlist: 'faq',
    contact: 'contact', contactform: 'contact', form: 'contact', mapinfo: 'contact',
    footer: 'footer',
    gallery: 'gallery', casestgrid: 'gallery', listings: 'products',
    team: 'team', doctors: 'team', trainers: 'team', agents: 'team',
    stats: 'stats', trust: 'stats', results: 'stats',
    logos: 'logos', press: 'logos',
    newsletter: 'newsletter',
    portfolio: 'portfolio', work: 'portfolio', projects: 'portfolio',
    products: 'products', featureproducts: 'products', featuredproducts: 'products',
    blog: 'blog', journal: 'blog', insights: 'blog', articles: 'blog',
    content: 'content',
  };
  if (map[t]) return map[t];
  if ((Object.values(map) as string[]).includes(t)) return t as SectionRole;
  return null;
}

function applyDesignSystem(plan: SitePlan, input: PagePlanner2Input): void {
  const patch: Partial<DesignSystem> = {};
  if (input.styleApplication) {
    patch.headingFont = input.styleApplication.constitutionPatch.typography.headingFont;
    patch.bodyFont = input.styleApplication.constitutionPatch.typography.bodyFont;
    patch.primaryColor = input.styleApplication.constitutionPatch.colors.primary;
    patch.secondaryColor = input.styleApplication.constitutionPatch.colors.secondary;
    patch.backgroundColor = input.styleApplication.constitutionPatch.colors.background;
    patch.textColor = input.styleApplication.constitutionPatch.colors.text;
    patch.borderRadius = input.styleApplication.constitutionPatch.radius.button;
  } else if (input.constitution) {
    patch.headingFont = input.constitution.typography.headingFont;
    patch.bodyFont = input.constitution.typography.bodyFont;
    patch.primaryColor = input.constitution.colors.primary;
    patch.secondaryColor = input.constitution.colors.secondary;
    patch.backgroundColor = input.constitution.colors.background;
    patch.textColor = input.constitution.colors.text;
    patch.borderRadius = input.constitution.radius.button;
  }
  plan.designSystem = { ...plan.designSystem, ...patch };
}

function applyDirection(plan: SitePlan, input: PagePlanner2Input): void {
  plan.visualDirection = toVisualDirection(input.direction.visualStyle);
  plan.contentStrategy = {
    ...plan.contentStrategy,
    contentDensity: input.direction.density,
  };
  plan.experienceStrategy = {
    ...plan.experienceStrategy,
    useScrollReveal: !input.direction.motionDirection.toLowerCase().includes('almost none'),
    intensity: input.direction.density === 'lean' ? 'subtle' : input.direction.density === 'rich' ? 'moderate' : 'subtle',
  };
  if (input.blueprint) {
    plan.assetStrategy = {
      ...plan.assetStrategy,
      imageMood: input.direction.mood.slice(0, 60),
      heroImageQuery: input.blueprint.assetStrategy.heroSubject,
      iconStyle: input.blueprint.assetStrategy.iconTone.includes('filled') ? 'filled' : 'outlined',
    };
    plan.conversionStrategy = {
      ...plan.conversionStrategy,
      primaryCTA: input.blueprint.conversionStrategy.primaryCTA,
      primaryCTALocation: input.blueprint.conversionStrategy.ctaPlacements,
      trustSignals: input.blueprint.conversionStrategy.trustDevices,
    };
  }
}

function applyResponsive(plan: SitePlan, input: PagePlanner2Input): void {
  const bp = input.blueprint;
  plan.responsiveStrategy = {
    ...plan.responsiveStrategy,
    mobileNavStyle: bp?.responsiveStrategy.navPattern === 'minimal' ? 'hidden'
      : bp?.responsiveStrategy.navPattern === 'stacked' ? 'stacked' : 'hamburger',
    mobileHeroLayout: bp?.responsiveStrategy.heroPattern.includes('stack') || !bp ? 'stacked'
      : bp.responsiveStrategy.heroPattern.includes('split') ? 'split' : 'minimal',
    mobileTypographyScale: input.responsivePlan
      ? input.responsivePlan.rules.find((r) => r.target === 'mobile')?.typographyScale ?? 0.85
      : plan.responsiveStrategy.mobileTypographyScale,
  };
}

/**
 * Overlay architecture-derived multi-page nav labels + missing sections
 * from blueprint recommendedSections (only if role maps cleanly).
 */
function applyArchitectureSections(plan: SitePlan, input: PagePlanner2Input): void {
  if (!input.architecture) return;

  const present = new Set(plan.sections.map((s) => s.role));
  const wanted: SectionRole[] = [];
  if (input.blueprint) {
    for (const token of input.blueprint.recommendedSections) {
      const role = coerceRole(token);
      if (role && !present.has(role) && role !== 'navbar' && role !== 'footer' && role !== 'hero') {
        wanted.push(role);
      }
    }
  } else if (input.architecture.contentHierarchy['page-home']) {
    for (const token of input.architecture.contentHierarchy['page-home']) {
      const role = coerceRole(token);
      if (role && !present.has(role) && role !== 'navbar' && role !== 'footer') wanted.push(role);
    }
  }

  // Insert before CTA/footer when possible
  const insertAt = Math.max(0, plan.sections.findIndex((s) => s.role === 'cta'));
  let offset = 0;
  for (const role of wanted) {
    const section: SectionPlan = {
      id: `${role}-bp`,
      role,
      label: roleLabel(role),
      templateType: roleTemplate(role),
      content: {
        heading: roleHeading(role, plan.industry),
        items: roleItems(role, plan.industry),
        cta: plan.conversionStrategy.primaryCTA,
      },
      images: [],
      styles: {},
    };
    plan.sections.splice(insertAt + offset, 0, section);
    offset += 1;
  }

  // Navbar labels from primary navigation page names
  const nav = plan.sections.find((s) => s.role === 'navbar');
  if (nav) {
    const pageLabels = input.architecture.pages
      .filter((p) => input.architecture!.navigation.primary.includes(p.id))
      .map((p) => p.name);
    if (pageLabels.length >= 2) {
      nav.content.items = pageLabels.map((label) => ({ label }));
    }
  }

  // Multi-page plan listing (orchestrator still builds home first)
  plan.pages = input.architecture.pages.map((p) => ({
    id: p.id,
    name: p.name,
    purpose: p.purpose,
    sections: (input.architecture!.contentHierarchy[p.id] || [])
      .map(coerceRole)
      .filter((r): r is SectionRole => r !== null)
      .map((r) => plan.sections.find((s) => s.role === r)?.id)
      .filter((id): id is string => !!id),
  }));
  if (!plan.pages.length) {
    plan.pages = [{
      id: 'page-home',
      name: 'Strona główna',
      purpose: plan.purpose,
      sections: plan.sections.map((s) => s.id),
    }];
  }
}

function roleLabel(role: SectionRole): string {
  const labels: Record<SectionRole, string> = {
    hero: 'Sekcja hero', features: 'Funkcje / Atuty', about: 'O nas',
    testimonials: 'Opinie', cta: 'Wezwanie do działania', pricing: 'Cennik',
    faq: 'FAQ', contact: 'Kontakt', footer: 'Stopka', navbar: 'Nawigacja',
    gallery: 'Galeria', team: 'Zespół', stats: 'Statystyki', logos: 'Logotypy',
    newsletter: 'Newsletter', services: 'Usługi', portfolio: 'Portfolio',
    products: 'Produkty', blog: 'Blog', content: 'Treść',
  };
  return labels[role];
}

function roleTemplate(role: SectionRole): string {
  const t: Partial<Record<SectionRole, string>> = {
    features: 'feature-grid', services: 'feature-grid', products: 'product-grid',
    portfolio: 'gallery', gallery: 'gallery', about: 'content', contact: 'content',
    team: 'content', content: 'content',
  };
  return t[role] || role;
}

function roleHeading(role: SectionRole, industry: string): string {
  const heads: Partial<Record<SectionRole, string>> = {
    services: 'Nasze usługi', features: 'Dlaczego my?', about: 'O nas',
    team: 'Nasz zespół', gallery: 'Galeria', portfolio: 'Nasze realizacje',
    products: 'Produkty', faq: 'Najczęstsze pytania', contact: 'Kontakt',
    pricing: 'Cennik', testimonials: 'Opinie', stats: 'W liczbach',
    blog: 'Aktualności', newsletter: 'Bądź na bieżąco',
  };
  return heads[role] || `${role} — ${industry}`;
}

function roleItems(role: SectionRole, industry: string): Array<{ label: string; description?: string }> | undefined {
  if (role === 'stats') {
    return [
      { label: 'Doświadczenie', description: `Lata na rynku — ${industry}` },
      { label: 'Klienci', description: 'Zaufanie osób i firm' },
      { label: 'Jakość', description: 'Standardy i certyfikaty' },
    ];
  }
  if (role === 'faq') {
    return [
      { label: 'Czy to dla mnie?', description: 'Sprawdź, czy oferta odpowiada na Twoją potrzebę.' },
      { label: 'Ile to kosztuje?', description: 'Przejrzyste warunki i wycena.' },
      { label: 'Jak zacząć?', description: 'Prosty pierwszy krok bez zobowiązań.' },
    ];
  }
  if (role === 'services') {
    return [
      { label: 'Usługa główna', description: `Core oferty ${industry}` },
      { label: 'Wsparcie', description: 'Pomoc na każdym etapie' },
      { label: 'Rozwój', description: 'Skalowalne rozwiązania' },
    ];
  }
  return undefined;
}

export function planPage2(input: PagePlanner2Input): SitePlan {
  emitObservability('decision', 'page-planner-2', `Planning enriched SitePlan for ${input.direction.visualStyle}`);

  const plan = generateSitePlan(input.brief);
  applyDirection(plan, input);
  applyDesignSystem(plan, input);
  applyResponsive(plan, input);
  applyArchitectureSections(plan, input);

  // Page architecture CTA overrides for home
  const homePlan = input.pagePlans?.find((p) => p.pageId === 'page-home');
  if (homePlan) {
    const hero = plan.sections.find((s) => s.role === 'hero');
    if (hero) hero.content.cta = homePlan.primaryCTA || hero.content.cta;
    const nav = plan.sections.find((s) => s.role === 'navbar');
    if (nav) nav.content.cta = homePlan.primaryCTA || nav.content.cta;
    const cta = plan.sections.find((s) => s.role === 'cta');
    if (cta && !cta.content.cta) cta.content.cta = homePlan.primaryCTA;
  }

  // Content plan overlay: headline length discipline already in ContentPlan issues;
  // apply planned CTA labels onto cta-bearing sections when provided.
  if (input.contentPlan) {
    const ctaBlock = input.contentPlan.blocks.find((b) => b.function === 'next-action');
    if (ctaBlock) {
      for (const s of plan.sections) {
        if (s.role === 'hero' || s.role === 'cta' || s.role === 'navbar') {
          s.content.cta = ctaBlock.text;
        }
      }
    }
  }

  plan.metadata = {
    ...plan.metadata,
    plannerType: 'deterministic',
    knowledge: plan.metadata.knowledge,
  };

  // Attach design-brain provenance without breaking SitePlan consumers
  plan.metadata = {
    ...plan.metadata,
    designBrain: {
      version: '1.0.0',
      visualStyle: input.direction.visualStyle,
      density: input.direction.density,
      blueprintId: input.blueprint?.id ?? null,
      architecturePages: input.architecture?.pages.length ?? 1,
      stylePackId: input.styleDecision?.stylePack?.id ?? null,
      traceCount: input.traces?.length ?? 0,
      sectionCount: plan.sections.length,
    },
  };

  emitObservability('decision', 'page-planner-2', `sections=${plan.sections.length} pages=${plan.pages.length}`);
  return plan;
}
