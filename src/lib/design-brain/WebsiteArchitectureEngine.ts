/**
 * WebsiteArchitectureEngine.ts — Site-as-system intelligence (section 3)
 *
 * Determines pages, navigation, hierarchy, journeys, conversion paths
 * from industry + business goal + audience + scope — never hardcoded
 * for a single industry.
 */

import type {
  WebsiteArchitecture, WebsitePage, PageType, UserJourney, PageArchitecturePlan,
} from './types';
import { emitObservability } from './Observability';

interface ArchInput {
  industry: string;
  businessGoal: string;
  audience: string;
  requestedScope?: string[];
  contentAvailable?: string[];
}

interface PageRecipe {
  type: PageType;
  name: string;
  slug: string;
  goal: string;
  when: (i: ArchInput) => boolean;
}

const PAGE_RECIPES: PageRecipe[] = [
  { type: 'home', name: 'Strona główna', slug: '/', goal: 'Orientacja + konwersja', when: () => true },
  { type: 'about', name: 'O nas', slug: '/o-nas', goal: 'Zaufanie i wiarygodność',
    when: (i) => ['dentist', 'clinic', 'law', 'agency', 'realestate', 'professional-services'].includes(i.industry) || i.businessGoal !== 'landing-page' },
  { type: 'services', name: 'Usługi', slug: '/uslugi', goal: 'Prezentacja oferty',
    when: (i) => ['dentist', 'clinic', 'law', 'agency', 'salon', 'gym', 'fitness', 'beauty', 'professional-services', 'construction', 'automotive'].includes(i.industry) },
  { type: 'products', name: 'Produkty', slug: '/produkty', goal: 'Discovery produktowe',
    when: (i) => ['ecommerce', 'saas', 'technology'].includes(i.industry) },
  { type: 'portfolio', name: 'Portfolio', slug: '/portfolio', goal: 'Demonstracja kompetencji',
    when: (i) => ['agency', 'portfolio', 'architecture', 'creative-studio', 'photography'].includes(i.industry) },
  { type: 'team', name: 'Zespół', slug: '/zespol', goal: 'Ludzie budują zaufanie',
    when: (i) => ['dentist', 'clinic', 'law', 'agency', 'professional-services'].includes(i.industry) },
  { type: 'testimonials', name: 'Opinie', slug: '/opinie', goal: 'Social proof',
    when: (i) => ['dentist', 'clinic', 'restaurant', 'hotel', 'realestate', 'fitness', 'beauty'].includes(i.industry) },
  { type: 'pricing', name: 'Cennik', slug: '/cennik', goal: 'Kwalifikacja leadu',
    when: (i) => ['saas', 'fitness', 'beauty', 'agency', 'technology'].includes(i.industry) },
  { type: 'faq', name: 'FAQ', slug: '/faq', goal: 'Redukcja obiekcji',
    when: (i) => i.businessGoal === 'booking' || i.businessGoal === 'lead-generation' },
  { type: 'blog', name: 'Blog', slug: '/blog', goal: 'SEO + edukacja',
    when: (i) => ['saas', 'technology', 'education', 'finance', 'professional-services'].includes(i.industry) },
  { type: 'booking', name: 'Rezerwacja', slug: '/rezerwacja', goal: 'Bezpośrednia konwersja',
    when: (i) => i.businessGoal === 'booking' },
  { type: 'contact', name: 'Kontakt', slug: '/kontakt', goal: 'Kanał kontaktowy',
    when: (i) => i.businessGoal !== 'landing-page' && i.businessGoal !== 'ecommerce' },
  { type: 'gallery', name: 'Galeria', slug: '/galeria', goal: 'Prezentacja wizualna',
    when: (i) => ['restaurant', 'hotel', 'realestate', 'architecture', 'beauty', 'portfolio'].includes(i.industry) },
  { type: 'locations', name: 'Lokalizacje', slug: '/lokalizacje', goal: 'Znalezienie placówki',
    when: (i) => ['restaurant', 'hotel', 'clinic', 'dentist'].includes(i.industry) },
];

export function buildWebsiteArchitecture(input: ArchInput): WebsiteArchitecture {
  emitObservability('decision', 'website-architecture', `Building architecture for ${input.industry} goal=${input.businessGoal}`);

  const scope = input.requestedScope?.map((s) => s.toLowerCase());
  let pages = PAGE_RECIPES.filter((r) => r.when(input)).map((r, idx) => ({
    id: `page-${r.type}`,
    type: r.type,
    name: r.name,
    slug: r.slug,
    purpose: r.goal,
    order: idx,
  }));

  // Honor explicit requested scope when provided (still keep home+contact floor)
  if (scope?.length) {
    const floor = new Set(['home', 'contact']);
    pages = pages.filter((p) => floor.has(p.type) || scope.includes(p.type) || scope.includes(p.name.toLowerCase()));
    // Add any requested types not yet present
    for (const s of scope) {
      const recipe = PAGE_RECIPES.find((r) => r.type === s || r.name.toLowerCase() === s || r.slug === `/${s}`);
      if (recipe && !pages.some((p) => p.type === recipe.type)) {
        pages.push({ id: `page-${recipe.type}`, type: recipe.type, name: recipe.name, slug: recipe.slug, purpose: recipe.goal, order: pages.length });
      }
    }
  }

  // Landing page: single page only
  if (input.businessGoal === 'landing-page') {
    pages = pages.filter((p) => p.type === 'home');
  }

  pages = pages.map((p, i) => ({ ...p, order: i }));

  const primary = pages.filter((p) => p.type !== 'contact').map((p) => p.id);
  const footer = pages.map((p) => p.id);

  const hierarchy: Record<string, string[]> = {};
  for (const p of pages) {
    if (p.type === 'home') hierarchy[p.id] = pages.filter((x) => x.id !== p.id).map((x) => x.id);
  }

  const journeys = buildJourneys(input, pages);
  const conversionPaths = buildConversionPaths(input, pages);
  const contentHierarchy: Record<string, string[]> = {};
  for (const p of pages) {
    contentHierarchy[p.id] = defaultContentSequence(p.type, input.businessGoal);
  }
  const relationships = pages
    .filter((p) => p.type !== 'home')
    .map((p) => ({ from: 'page-home', to: p.id, reason: `primary nav → ${p.purpose}` }));

  const arch: WebsiteArchitecture = {
    pages,
    navigation: { primary, footer },
    hierarchy,
    userJourneys: journeys,
    conversionPaths,
    contentHierarchy,
    relationships,
  };
  emitObservability('decision', 'website-architecture', `pages=${pages.length} journeys=${journeys.length} paths=${conversionPaths.length}`);
  return arch;
}

function buildJourneys(input: ArchInput, pages: WebsitePage[]): UserJourney[] {
  const journeys: UserJourney[] = [];
  const has = (t: PageType) => pages.some((p) => p.type === t);

  if (input.businessGoal === 'booking' && has('booking')) {
    journeys.push({ id: 'j-book', name: 'Rezerwacja wizyty', entryPage: 'page-home', steps: ['page-home', 'page-booking'], conversionGoal: 'booking' });
  }
  if (has('services')) {
    journeys.push({ id: 'j-services', name: 'Odkrycie usług', entryPage: 'page-home', steps: ['page-home', 'page-services', ...(has('contact') ? ['page-contact'] : [])], conversionGoal: input.businessGoal });
  }
  if (has('products')) {
    journeys.push({ id: 'j-products', name: 'Discovery produktu', entryPage: 'page-home', steps: ['page-home', 'page-products'], conversionGoal: 'product-view' });
  }
  if (has('portfolio')) {
    journeys.push({ id: 'j-portfolio', name: 'Ocena realizacji', entryPage: 'page-home', steps: ['page-home', 'page-portfolio', ...(has('contact') ? ['page-contact'] : [])], conversionGoal: 'contact' });
  }
  if (has('contact')) {
    journeys.push({ id: 'j-contact', name: 'Kontakt', entryPage: 'page-home', steps: ['page-home', 'page-contact'], conversionGoal: 'contact' });
  }
  return journeys;
}

function buildConversionPaths(input: ArchInput, pages: WebsitePage[]): string[] {
  const paths: string[] = [];
  const has = (t: PageType) => pages.some((p) => p.type === t);
  switch (input.businessGoal) {
    case 'booking':
      paths.push('hero CTA → booking', 'services → booking', 'faq → booking');
      break;
    case 'lead-generation':
      paths.push('hero CTA → contact', 'services → contact', 'about → contact');
      if (has('pricing')) paths.push('pricing → contact');
      break;
    case 'ecommerce':
      paths.push('hero → products', 'products → product-detail', 'cart → checkout');
      break;
    case 'portfolio':
      paths.push('hero → portfolio', 'portfolio → contact');
      break;
    default:
      paths.push('hero CTA → primary action', 'footer → contact');
  }
  return paths;
}

function defaultContentSequence(pageType: PageType, goal: string): string[] {
  switch (pageType) {
    case 'home':
      return ['hero', 'value-props', 'services-summary', 'trust', 'social-proof', 'cta', 'footer'];
    case 'services':
      return ['hero', 'service-list', 'process', 'proof', 'cta', 'footer'];
    case 'about':
      return ['hero', 'story', 'values', 'team', 'cta', 'footer'];
    case 'contact':
      return ['hero', 'contact-form', 'map-info', 'faq', 'footer'];
    case 'portfolio':
      return ['hero', 'case-grid', 'case-detail-link', 'cta', 'footer'];
    case 'pricing':
      return ['hero', 'tiers', 'comparison', 'faq', 'cta', 'footer'];
    case 'faq':
      return ['hero', 'faq-list', 'cta', 'footer'];
    case 'booking':
      return ['hero', 'availability', 'form', 'trust', 'footer'];
    default:
      return goal === 'landing-page' ? ['hero', 'benefits', 'proof', 'cta', 'footer'] : ['hero', 'content', 'cta', 'footer'];
  }
}

// ── Information Architecture (section 4) ────────────────────────────

export function buildPageArchitecturePlans(
  arch: WebsiteArchitecture,
  input: { industry: string; businessGoal: string; primaryCTA: string; trustSignals: string[] },
): PageArchitecturePlan[] {
  emitObservability('decision', 'information-architecture', `Planning ${arch.pages.length} page architectures`);

  return arch.pages.map((page) => {
    const sequence = arch.contentHierarchy[page.id] || ['hero', 'content', 'cta'];
    const plan: PageArchitecturePlan = {
      pageId: page.id,
      primaryGoal: page.purpose,
      secondaryGoals: secondaryGoalsFor(page.type, input.businessGoal),
      primaryCTA: ctaForPage(page.type, input.primaryCTA),
      supportingContent: sequence.filter((s) => s !== 'hero' && s !== 'footer'),
      trustSignals: input.trustSignals,
      objections: objectionsFor(page.type, input.industry),
      informationSequence: sequence,
    };
    return plan;
  });
}

function secondaryGoalsFor(type: PageType, goal: string): string[] {
  switch (type) {
    case 'home': return ['pokazać różnicę', 'zbudować zaufanie', 'prowadzić do konwersji'];
    case 'about': return ['ludzka twarz firmy', 'wiarygodność', 'kultura'];
    case 'services': return ['wyjaśnić proces', 'kwalifikować lead', 'odróżnić ofertę'];
    case 'faq': return ['usunąć obiekcje', 'odciążyć obsługę', 'SEO'];
    case 'contact': return ['zebrać dane', 'ustawić oczekiwania', 'szybki odzew'];
    default: return ['wsparcie celu głównego', goal];
  }
}

function ctaForPage(type: PageType, primary: string): string {
  switch (type) {
    case 'booking': return 'Wybierz termin';
    case 'contact': return 'Wyślij wiadomość';
    case 'pricing': return 'Wybierz plan';
    case 'products': return 'Zobacz produkt';
    case 'portfolio': return 'Porozmawiajmy o projekcie';
    default: return primary;
  }
}

function objectionsFor(type: PageType, industry: string): string[] {
  const common = ['Czy to dla mnie?', 'Ile to kosztuje?', 'Czy mogę zaufać?'];
  if (type === 'services') return [...common, 'Jak wygląda proces?', 'Jak długo to trwa?'];
  if (type === 'contact') return ['Jak szybko odpowiadają?', 'Czy muszę podawać wszystkie dane?'];
  if (['dentist', 'clinic'].includes(industry)) return ['Czy będzie boleć?', 'Jakie są koszty?', 'Czy mają doświadczenie?'];
  return common;
}
