/**
 * BlueprintEngine.ts — Website Blueprint Engine (section 9)
 *
 * Blueprint = SYSTEM OF DECISIONS, not a ready-made template.
 * 20 industries, each with its OWN decisions (not a copy-paste).
 */

import type { DesignDirection, WebsiteArchitecture, PageArchitecturePlan } from './types';
import { emitObservability } from './Observability';

export interface WebsiteBlueprintDecision {
  id: string;
  industry: string;
  audience: string;
  businessGoal: string;
  pageTypes: string[];
  recommendedSections: string[];
  contentStrategy: {
    tone: string;
    headlineApproach: string;
    density: 'lean' | 'moderate' | 'rich';
    proofStyle: string;
  };
  visualDirection: {
    style: string;
    paletteHint: string;
    typographyHint: string;
    imageryHint: string;
    motionHint: string;
  };
  conversionStrategy: {
    primaryCTA: string;
    ctaPlacements: string[];
    trustDevices: string[];
    objectionHandlers: string[];
  };
  responsiveStrategy: {
    mobilePriority: string;
    navPattern: string;
    heroPattern: string;
  };
  assetStrategy: {
    heroSubject: string;
    supportingSubjects: string[];
    iconTone: string;
  };
  antiPatterns: string[];
  differentiation: string;
}

const BLUEPRINTS: WebsiteBlueprintDecision[] = [
  {
    id: 'BP-dental-clinic', industry: 'dentist', audience: 'pacjenci szukający bezpiecznego leczenia',
    businessGoal: 'booking',
    pageTypes: ['home', 'services', 'about', 'team', 'faq', 'contact', 'booking'],
    recommendedSections: ['navbar', 'hero', 'services', 'about', 'team', 'testimonials', 'faq', 'cta', 'contact', 'footer'],
    contentStrategy: { tone: 'professional-warm reassuring', headlineApproach: 'outcome + comfort, never procedure-first', density: 'moderate', proofStyle: 'before/after + patient quotes + credentials' },
    visualDirection: { style: 'premium', paletteHint: 'clean teal/blue trust + soft white', typographyHint: 'humanist sans, open counters', imageryHint: 'clinic interior, smiling team, subtle smile results', motionHint: 'subtle fade only — never playful' },
    conversionStrategy: { primaryCTA: 'Umów wizytę', ctaPlacements: ['navbar', 'hero', 'mid-page', 'footer'], trustDevices: ['certyfikaty', 'lata doświadczenia', 'opinie pacjentów', 'technologia'], objectionHandlers: ['Czy będzie boleć?', 'Ile kosztuje?', 'Czy mają doświadczenie?'] },
    responsiveStrategy: { mobilePriority: 'CTA + telefon sticky', navPattern: 'hamburger', heroPattern: 'stacked' },
    assetStrategy: { heroSubject: 'nowoczesny gabinet / uśmiech', supportingSubjects: ['zespół', 'sprzęt', 'efekty'], iconTone: 'soft outlined medical' },
    antiPatterns: ['straszne zdjęcia zabiegów', 'agresywna sprzedaż', 'zimny kliniczny only', 'gradient neon'],
    differentiation: 'Comfort-first dental: every section answers a fear before selling a procedure.',
  },
  {
    id: 'BP-medical-clinic', industry: 'clinic', audience: 'pacjenci i rodziny',
    businessGoal: 'booking',
    pageTypes: ['home', 'services', 'about', 'team', 'contact', 'booking'],
    recommendedSections: ['navbar', 'hero', 'services', 'doctors', 'about', 'testimonials', 'cta', 'contact', 'footer'],
    contentStrategy: { tone: 'authoritative caring', headlineApproach: 'health outcome + accessibility', density: 'moderate', proofStyle: 'specializations + insurance + reviews' },
    visualDirection: { style: 'professional', paletteHint: 'medical blue + clean white', typographyHint: 'clear sans, high readability', imageryHint: 'doctors, facility, care moments', motionHint: 'minimal' },
    conversionStrategy: { primaryCTA: 'Umów wizytę', ctaPlacements: ['navbar', 'hero', 'footer'], trustDevices: ['specjaliści', 'NFZ/ubezpieczenia', 'nowoczesny sprzęt'], objectionHandlers: ['Czy przyjmują bez skierowania?', 'Jakie specjalizacje?'] },
    responsiveStrategy: { mobilePriority: 'phone + booking', navPattern: 'hamburger', heroPattern: 'stacked' },
    assetStrategy: { heroSubject: 'zespół medyczny / gabinet', supportingSubjects: ['lekarze', 'diagnostyka'], iconTone: 'clean line medical' },
    antiPatterns: ['stockowe uśmiechy bez kontekstu', 'przeładowane menu usług'],
    differentiation: 'Care pathway clarity: patients see exactly which door to enter.',
  },
  {
    id: 'BP-saas', industry: 'saas', audience: 'ops/managers evaluating tools',
    businessGoal: 'lead-generation',
    pageTypes: ['home', 'products', 'pricing', 'blog', 'contact'],
    recommendedSections: ['navbar', 'hero', 'features', 'how-it-works', 'pricing', 'testimonials', 'faq', 'cta', 'footer'],
    contentStrategy: { tone: 'confident concise', headlineApproach: 'pain → outcome in ≤10 words', density: 'lean', proofStyle: 'logos + metrics + case snippets' },
    visualDirection: { style: 'minimal', paletteHint: 'calm base + one electric accent', typographyHint: 'geometric sans, tight display', imageryHint: 'product UI screenshots, not people stock', motionHint: 'functional micro-interactions' },
    conversionStrategy: { primaryCTA: 'Wypróbuj za darmo', ctaPlacements: ['navbar', 'hero', 'pricing', 'footer'], trustDevices: ['security badges', 'integrations', 'trial terms'], objectionHandlers: ['Ile to kosztuje?', 'Czy jest free trial?', 'Jak migracja?'] },
    responsiveStrategy: { mobilePriority: 'pricing + trial CTA', navPattern: 'hamburger', heroPattern: 'stacked screenshot' },
    assetStrategy: { heroSubject: 'product dashboard', supportingSubjects: ['feature close-ups', 'workflow'], iconTone: 'linear tech' },
    antiPatterns: ['abstract 3D blobs without meaning', 'jargon walls', '10 feature badges in hero'],
    differentiation: 'Show the product working; never sell the category.',
  },
  {
    id: 'BP-agency', industry: 'agency', audience: 'marketing directors / founders',
    businessGoal: 'lead-generation',
    pageTypes: ['home', 'services', 'portfolio', 'about', 'contact'],
    recommendedSections: ['navbar', 'hero', 'services', 'work', 'process', 'about', 'testimonials', 'cta', 'footer'],
    contentStrategy: { tone: 'bold peer-to-peer', headlineApproach: 'point of view, not service list', density: 'moderate', proofStyle: 'case studies with results' },
    visualDirection: { style: 'creative', paletteHint: 'distinctive brand accent on calm base', typographyHint: 'display with personality + neutral body', imageryHint: 'own work first, lifestyle second', motionHint: 'expressive but purposeful' },
    conversionStrategy: { primaryCTA: 'Zobacz realizacje', ctaPlacements: ['navbar', 'hero', 'after-work', 'footer'], trustDevices: ['nagrody', 'proces', 'wyniki klientów'], objectionHandlers: ['Jak wygląda współpraca?', 'Ile to trwa?', 'Dla jakiej wielkości firm?'] },
    responsiveStrategy: { mobilePriority: 'work + contact', navPattern: 'hamburger', heroPattern: 'type-led' },
    assetStrategy: { heroSubject: 'signature project visual', supportingSubjects: ['case imagery', 'team in action'], iconTone: 'custom-feel' },
    antiPatterns: ['generic "we are creative"', 'stock handshake photos', 'rainbow gradients'],
    differentiation: 'The portfolio IS the pitch; copy frames it, never replaces it.',
  },
  {
    id: 'BP-portfolio', industry: 'portfolio', audience: 'clients evaluating craft',
    businessGoal: 'portfolio',
    pageTypes: ['home', 'portfolio', 'about', 'contact'],
    recommendedSections: ['navbar', 'hero', 'work', 'about', 'skills', 'cta', 'footer'],
    contentStrategy: { tone: 'personal confident', headlineApproach: 'role + craft statement', density: 'lean', proofStyle: 'selected projects with role/context' },
    visualDirection: { style: 'creative', paletteHint: 'neutral frame so work pops', typographyHint: 'one strong display + clean body', imageryHint: 'project imagery dominant', motionHint: 'subtle project reveals' },
    conversionStrategy: { primaryCTA: 'Porozmawiajmy', ctaPlacements: ['hero', 'after-work', 'footer'], trustDevices: ['proces', 'zakres', 'kontakt'], objectionHandlers: ['Czy mają czas?', 'Jakie branże?'] },
    responsiveStrategy: { mobilePriority: 'work grid + contact', navPattern: 'minimal', heroPattern: 'type-led' },
    assetStrategy: { heroSubject: 'best project cover', supportingSubjects: ['project details'], iconTone: 'minimal' },
    antiPatterns: ['template-looking grid', 'auto-playing showreels without control'],
    differentiation: 'Edit ruthlessly: 6 great projects beat 30 average ones.',
  },
  {
    id: 'BP-architecture', industry: 'architecture', audience: 'developers / private clients',
    businessGoal: 'lead-generation',
    pageTypes: ['home', 'portfolio', 'about', 'contact'],
    recommendedSections: ['navbar', 'hero', 'projects', 'philosophy', 'about', 'press', 'cta', 'footer'],
    contentStrategy: { tone: 'measured intellectual', headlineApproach: 'spatial idea, not slogan', density: 'lean', proofStyle: 'projects + publications + awards' },
    visualDirection: { style: 'minimal', paletteHint: 'concrete neutrals + one material accent', typographyHint: 'grotesque or refined serif', imageryHint: 'architectural photography, strong perspective', motionHint: 'slow cinematic' },
    conversionStrategy: { primaryCTA: 'Omów projekt', ctaPlacements: ['hero', 'after-projects', 'footer'], trustDevices: ['realizacje', 'publikacje', 'nagrody'], objectionHandlers: ['Jaki zakres?', 'Gdzie działają?'] },
    responsiveStrategy: { mobilePriority: 'project imagery + contact', navPattern: 'minimal overlay', heroPattern: 'full-bleed image' },
    assetStrategy: { heroSubject: 'signature building photo', supportingSubjects: ['details', 'plans/mood'], iconTone: 'hairline technical' },
    antiPatterns: ['dark moody cliché without context', 'wall of awards logos in hero'],
    differentiation: 'Space and light are the brand; UI stays out of the way.',
  },
  {
    id: 'BP-restaurant', industry: 'restaurant', audience: 'goście szukający doświadczenia',
    businessGoal: 'booking',
    pageTypes: ['home', 'services', 'gallery', 'contact', 'booking'],
    recommendedSections: ['navbar', 'hero', 'menu-highlights', 'story', 'gallery', 'reviews', 'reservation', 'footer'],
    contentStrategy: { tone: 'appetizing inviting', headlineApproach: 'sensory + place', density: 'moderate', proofStyle: 'reviews + press + chef story' },
    visualDirection: { style: 'warm', paletteHint: 'appetite-warm reds/earth + cream', typographyHint: 'characterful display + readable body', imageryHint: 'food close-ups, interior, people dining', motionHint: 'gentle' },
    conversionStrategy: { primaryCTA: 'Zarezerwuj stolik', ctaPlacements: ['navbar', 'hero', 'footer'], trustDevices: ['opinie', 'nagrody kulinarnie', 'menu sezonowe'], objectionHandlers: ['Jakie menu?', 'Czy jest parking?', 'Dla dzieci?'] },
    responsiveStrategy: { mobilePriority: 'menu + booking', navPattern: 'hamburger', heroPattern: 'full-bleed food' },
    assetStrategy: { heroSubject: 'signature dish or interior glow', supportingSubjects: ['dishes', 'team', 'space'], iconTone: 'hand-drawn warm' },
    antiPatterns: ['dark unreadable menu text', 'generic stock food', '10 CTAs'],
    differentiation: 'Taste and atmosphere first; reservation is the natural next step.',
  },
  {
    id: 'BP-hotel', industry: 'hotel', audience: 'travelers comparing stays',
    businessGoal: 'booking',
    pageTypes: ['home', 'gallery', 'locations', 'faq', 'contact', 'booking'],
    recommendedSections: ['navbar', 'hero', 'rooms', 'amenities', 'gallery', 'location', 'reviews', 'booking-cta', 'footer'],
    contentStrategy: { tone: 'aspirational hospitable', headlineApproach: 'place + feeling', density: 'moderate', proofStyle: 'guest ratings + photos + amenities' },
    visualDirection: { style: 'luxury', paletteHint: 'deep neutrals + gold/champagne accent', typographyHint: 'elegant serif display + clean sans', imageryHint: 'rooms, views, lifestyle moments', motionHint: 'slow graceful' },
    conversionStrategy: { primaryCTA: 'Sprawdź dostępność', ctaPlacements: ['navbar', 'hero', 'rooms', 'footer'], trustDevices: ['oceny gości', 'ulepszenia', 'lokalizacja'], objectionHandlers: ['Jaka cena?', 'Czy jest śniadanie?', 'Jak dojechać?'] },
    responsiveStrategy: { mobilePriority: 'booking widget sticky', navPattern: 'overlay hamburger', heroPattern: 'full-bleed' },
    assetStrategy: { heroSubject: 'hero room/view', supportingSubjects: ['rooms', 'amenities', 'location'], iconTone: 'refined line' },
    antiPatterns: ['cluttered booking forms above fold', 'tiny unreadable room specs'],
    differentiation: 'Sell the morning light and the view, not the bed count.',
  },
  {
    id: 'BP-real-estate', industry: 'realestate', audience: 'kupujący / wynajmujący',
    businessGoal: 'lead-generation',
    pageTypes: ['home', 'products', 'about', 'contact'],
    recommendedSections: ['navbar', 'hero', 'listings', 'why-us', 'agents', 'testimonials', 'cta', 'footer'],
    contentStrategy: { tone: 'professional aspirational', headlineApproach: 'location/lifestyle + action', density: 'rich', proofStyle: 'listings data + agent trust + sold stats' },
    visualDirection: { style: 'premium', paletteHint: 'navy/gold or clean white + brand accent', typographyHint: 'refined sans', imageryHint: 'property photography, bright interiors', motionHint: 'subtle listing reveals' },
    conversionStrategy: { primaryCTA: 'Zobacz oferty', ctaPlacements: ['navbar', 'hero', 'listings', 'footer'], trustDevices: ['liczba transakcji', 'opinie', 'ekskluzywne oferty'], objectionHandlers: ['Jakie prowizje?', 'Czy pomagają z kredytem?'] },
    responsiveStrategy: { mobilePriority: 'search + contact agent', navPattern: 'hamburger', heroPattern: 'search-led' },
    assetStrategy: { heroSubject: 'premium property exterior/interior', supportingSubjects: ['listing photos', 'agents'], iconTone: 'clean line' },
    antiPatterns: ['dark moody property photos', 'form walls before value'],
    differentiation: 'Lead with lifestyle of the property; data supports, doesn\'t lead.',
  },
  {
    id: 'BP-law', industry: 'law', audience: 'klienci w sprawach prawnych',
    businessGoal: 'lead-generation',
    pageTypes: ['home', 'services', 'about', 'team', 'contact'],
    recommendedSections: ['navbar', 'hero', 'practice-areas', 'about', 'team', 'insights', 'cta', 'footer'],
    contentStrategy: { tone: 'authoritative discreet', headlineApproach: 'problem solved, not jargon', density: 'moderate', proofStyle: 'experience years + cases + credentials' },
    visualDirection: { style: 'corporate', paletteHint: 'navy/charcoal + restrained gold or burgundy', typographyHint: 'serif display for gravitas + sans body', imageryHint: 'professional portraits, library/office', motionHint: 'minimal' },
    conversionStrategy: { primaryCTA: 'Skonsultuj sprawę', ctaPlacements: ['navbar', 'hero', 'footer'], trustDevices: ['lata praktyki', 'specjalizacje', 'rekomendacje'], objectionHandlers: ['Czy pierwsza konsultacja jest płatna?', 'Jakie sprawy prowadzą?'] },
    responsiveStrategy: { mobilePriority: 'phone + consult form', navPattern: 'hamburger', heroPattern: 'type-led' },
    assetStrategy: { heroSubject: 'professional portrait or office', supportingSubjects: ['team', 'practice icons'], iconTone: 'conservative line' },
    antiPatterns: ['gavel stock cliché as only visual', 'unreadable dense legal walls in hero'],
    differentiation: 'Translate law into human stakes; credibility through specifics.',
  },
  {
    id: 'BP-finance', industry: 'finance', audience: 'klienci szukający doradztwa',
    businessGoal: 'lead-generation',
    pageTypes: ['home', 'services', 'about', 'faq', 'contact'],
    recommendedSections: ['navbar', 'hero', 'services', 'how-we-help', 'trust', 'faq', 'cta', 'footer'],
    contentStrategy: { tone: 'clear trustworthy', headlineApproach: 'security + growth outcome', density: 'moderate', proofStyle: 'regulatory + years + client outcomes' },
    visualDirection: { style: 'corporate', paletteHint: 'deep green/navy + gold accent', typographyHint: 'clean sans, tabular numbers', imageryHint: 'professional, charts over lifestyle', motionHint: 'minimal' },
    conversionStrategy: { primaryCTA: 'Umów konsultację', ctaPlacements: ['navbar', 'hero', 'footer'], trustDevices: ['regulacje', 'doświadczenie', 'bezpieczeństwo danych'], objectionHandlers: ['Jakie ryzyko?', 'Jakie opłaty?', 'Kto zarządza?'] },
    responsiveStrategy: { mobilePriority: 'consult CTA', navPattern: 'hamburger', heroPattern: 'stacked' },
    assetStrategy: { heroSubject: 'advisory meeting / abstract trust visual', supportingSubjects: ['team', 'process'], iconTone: 'precise line' },
    antiPatterns: ['guaranteed-returns claims', 'complex jargon hero', 'neon fintech cliché for traditional services'],
    differentiation: 'Clarity is the product: plain language about money.',
  },
  {
    id: 'BP-fitness', industry: 'fitness', audience: 'osoby chcące zmienić nawyki',
    businessGoal: 'lead-generation',
    pageTypes: ['home', 'services', 'pricing', 'contact'],
    recommendedSections: ['navbar', 'hero', 'programs', 'trainers', 'results', 'pricing', 'cta', 'footer'],
    contentStrategy: { tone: 'energizing direct', headlineApproach: 'transformation + action', density: 'moderate', proofStyle: 'before/after + member stories' },
    visualDirection: { style: 'bold', paletteHint: 'high-energy accent on dark or vivid base', typographyHint: 'heavy display + clean body', imageryHint: 'real training moments, sweat, community', motionHint: 'snappy' },
    conversionStrategy: { primaryCTA: 'Zacznij trening', ctaPlacements: ['navbar', 'hero', 'pricing', 'footer'], trustDevices: ['trenerzy', 'wyniki', 'plan treningowy'], objectionHandlers: ['Czy jest plan dla początkujących?', 'Ile kosztuje karnet?'] },
    responsiveStrategy: { mobilePriority: 'pricing + trial', navPattern: 'hamburger', heroPattern: 'image-led' },
    assetStrategy: { heroSubject: 'dynamic training shot', supportingSubjects: ['trainers', 'facility', 'results'], iconTone: 'bold filled' },
    antiPatterns: ['unattainable body ideals only', '10 badge overlays', 'unreadable thin type on photos'],
    differentiation: 'Progress for real people; community as product.',
  },
  {
    id: 'BP-beauty', industry: 'beauty', audience: 'klientki szukające zabiegów',
    businessGoal: 'booking',
    pageTypes: ['home', 'services', 'gallery', 'booking', 'contact'],
    recommendedSections: ['navbar', 'hero', 'services', 'gallery', 'about', 'reviews', 'booking', 'footer'],
    contentStrategy: { tone: 'warm confident', headlineApproach: 'feeling after service', density: 'moderate', proofStyle: 'gallery results + reviews' },
    visualDirection: { style: 'elegant', paletteHint: 'blush/neutral + metallic or soft accent', typographyHint: 'refined serif or elegant sans', imageryHint: 'results gallery, soft portraits', motionHint: 'gentle' },
    conversionStrategy: { primaryCTA: 'Zarezerwuj termin', ctaPlacements: ['navbar', 'hero', 'services', 'footer'], trustDevices: ['portfolio zabiegów', 'opinie', 'produkty'], objectionHandlers: ['Ile trwa zabieg?', 'Czy boli?', 'Cena?'] },
    responsiveStrategy: { mobilePriority: 'booking + gallery', navPattern: 'hamburger', heroPattern: 'image-led' },
    assetStrategy: { heroSubject: 'signature treatment / result', supportingSubjects: ['gallery', 'interior'], iconTone: 'delicate line' },
    antiPatterns: ['heavy retouching without disclosure', 'rainbow salon clichés', 'tiny booking text'],
    differentiation: 'Results gallery does the selling; booking is frictionless.',
  },
  {
    id: 'BP-automotive', industry: 'automotive', audience: 'kierowcy / floty',
    businessGoal: 'lead-generation',
    pageTypes: ['home', 'services', 'products', 'contact'],
    recommendedSections: ['navbar', 'hero', 'services', 'why-us', 'gallery', 'cta', 'footer'],
    contentStrategy: { tone: 'direct competent', headlineApproach: 'problem → fix speed/quality', density: 'moderate', proofStyle: 'certifications + turnaround + reviews' },
    visualDirection: { style: 'bold', paletteHint: 'dark base + performance accent', typographyHint: 'strong grotesque', imageryHint: 'vehicles, workshop precision', motionHint: 'mechanical smooth' },
    conversionStrategy: { primaryCTA: 'Umów serwis', ctaPlacements: ['navbar', 'hero', 'footer'], trustDevices: ['certyfikaty', 'gwarancja', 'czas naprawy'], objectionHandlers: ['Ile kosztuje?', 'Jak długo?', 'Czy części oryginalne?'] },
    responsiveStrategy: { mobilePriority: 'phone + booking', navPattern: 'hamburger', heroPattern: 'image-led' },
    assetStrategy: { heroSubject: 'vehicle or workshop hero', supportingSubjects: ['services', 'team'], iconTone: 'technical filled' },
    antiPatterns: ['generic car stock unrelated to service', 'dark unreadable specs'],
    differentiation: 'Precision and speed made visible.',
  },
  {
    id: 'BP-construction', industry: 'construction', audience: 'inwestorzy / klienci prywatni',
    businessGoal: 'lead-generation',
    pageTypes: ['home', 'services', 'portfolio', 'about', 'contact'],
    recommendedSections: ['navbar', 'hero', 'services', 'projects', 'process', 'about', 'cta', 'footer'],
    contentStrategy: { tone: 'solid reliable', headlineApproach: 'build quality + timeline trust', density: 'moderate', proofStyle: 'projects + safety + timelines' },
    visualDirection: { style: 'corporate', paletteHint: 'industrial neutrals + safety accent', typographyHint: 'sturdy sans', imageryHint: 'real projects, stages of build', motionHint: 'minimal' },
    conversionStrategy: { primaryCTA: 'Zapytaj o wycenę', ctaPlacements: ['navbar', 'hero', 'footer'], trustDevices: ['realizacje', 'terminowość', 'certyfikaty'], objectionHandlers: ['Jaki zakres?', 'Ile trwa?', 'Jak wyceniacie?'] },
    responsiveStrategy: { mobilePriority: 'quote form + portfolio', navPattern: 'hamburger', heroPattern: 'image-led' },
    assetStrategy: { heroSubject: 'completed project', supportingSubjects: ['process', 'team', 'site'], iconTone: 'solid line' },
    antiPatterns: ['empty hardhat stock', 'no project evidence'],
    differentiation: 'Show the build, not just the promise.',
  },
  {
    id: 'BP-ecommerce', industry: 'ecommerce', audience: 'kupujący online',
    businessGoal: 'ecommerce',
    pageTypes: ['home', 'products', 'about', 'contact'],
    recommendedSections: ['navbar', 'hero', 'featured-products', 'value-props', 'reviews', 'newsletter', 'footer'],
    contentStrategy: { tone: 'benefit-driven', headlineApproach: 'category desire + proof', density: 'moderate', proofStyle: 'reviews + shipping/return trust' },
    visualDirection: { style: 'premium', paletteHint: 'product-led palette, CTA contrast', typographyHint: 'clean sans, price legibility', imageryHint: 'product photography consistent set', motionHint: 'subtle product reveals' },
    conversionStrategy: { primaryCTA: 'Kup teraz', ctaPlacements: ['navbar', 'hero', 'product cards', 'footer'], trustDevices: ['zwroty', 'dostawa', 'opinie', 'bezpieczeństwo płatności'], objectionHandlers: ['Zwrot?', 'Dostawa?', 'Rozmiar/jakość?'] },
    responsiveStrategy: { mobilePriority: 'product grid + cart', navPattern: 'hamburger', heroPattern: 'product-led' },
    assetStrategy: { heroSubject: 'hero product/lifestyle', supportingSubjects: ['product angles', 'details'], iconTone: 'minimal commerce' },
    antiPatterns: ['cluttered promo banners', 'low-contrast sale text', 'autoplay video hero'],
    differentiation: 'Product is hero; every pixel serves add-to-cart confidence.',
  },
  {
    id: 'BP-education', industry: 'education', audience: 'uczniowie / rodzice / kursanci',
    businessGoal: 'lead-generation',
    pageTypes: ['home', 'services', 'about', 'faq', 'contact'],
    recommendedSections: ['navbar', 'hero', 'programs', 'about', 'results', 'testimonials', 'cta', 'footer'],
    contentStrategy: { tone: 'encouraging clear', headlineApproach: 'growth outcome', density: 'moderate', proofStyle: 'results + accreditation + stories' },
    visualDirection: { style: 'friendly', paletteHint: 'optimistic blues/greens + warm accent', typographyHint: 'readable humanist sans', imageryHint: 'learning moments, diverse learners', motionHint: 'gentle' },
    conversionStrategy: { primaryCTA: 'Zapisz się', ctaPlacements: ['navbar', 'hero', 'programs', 'footer'], trustDevices: ['certyfikaty', 'wyniki', 'kadra'], objectionHandlers: ['Poziom startowy?', 'Ile trwa?', 'Cena?'] },
    responsiveStrategy: { mobilePriority: 'program list + signup', navPattern: 'hamburger', heroPattern: 'stacked' },
    assetStrategy: { heroSubject: 'learners in action', supportingSubjects: ['teachers', 'campus'], iconTone: 'friendly line' },
    antiPatterns: ['generic graduation stock', 'dense syllabus walls'],
    differentiation: 'Outcome stories over institutional boasting.',
  },
  {
    id: 'BP-technology', industry: 'technology', audience: 'technical buyers',
    businessGoal: 'lead-generation',
    pageTypes: ['home', 'products', 'blog', 'contact'],
    recommendedSections: ['navbar', 'hero', 'capabilities', 'architecture', 'use-cases', 'cta', 'footer'],
    contentStrategy: { tone: 'precise transparent', headlineApproach: 'capability + differentiation', density: 'rich', proofStyle: 'benchmarks + docs + case data' },
    visualDirection: { style: 'futuristic', paletteHint: 'dark canvas + electric accent', typographyHint: 'tech grotesque + mono labels', imageryHint: 'diagrams, UI, data viz', motionHint: 'engineered reveals' },
    conversionStrategy: { primaryCTA: 'Dowiedz się więcej', ctaPlacements: ['navbar', 'hero', 'footer'], trustDevices: ['docs', 'status', 'security'], objectionHandlers: ['Integration?', 'Pricing model?', 'Lock-in?'] },
    responsiveStrategy: { mobilePriority: 'docs + contact', navPattern: 'hamburger', heroPattern: 'type-led' },
    assetStrategy: { heroSubject: 'product/architecture visual', supportingSubjects: ['use-case diagrams'], iconTone: 'technical linear' },
    antiPatterns: ['hype words without substance', 'decorative circuit boards'],
    differentiation: 'Show how it works; respect technical literacy.',
  },
  {
    id: 'BP-professional-services', industry: 'professional-services', audience: 'klienci B2B',
    businessGoal: 'lead-generation',
    pageTypes: ['home', 'services', 'about', 'team', 'contact'],
    recommendedSections: ['navbar', 'hero', 'services', 'approach', 'about', 'testimonials', 'cta', 'footer'],
    contentStrategy: { tone: 'expert approachable', headlineApproach: 'client problem solved', density: 'moderate', proofStyle: 'expertise + process + outcomes' },
    visualDirection: { style: 'corporate', paletteHint: 'stable neutrals + action accent', typographyHint: 'neutral sans hierarchy', imageryHint: 'team, working moments, not handshakes', motionHint: 'minimal' },
    conversionStrategy: { primaryCTA: 'Umów rozmowę', ctaPlacements: ['navbar', 'hero', 'footer'], trustDevices: ['specjalizacje', 'proces', 'referencje'], objectionHandlers: ['Jak wygląda onboarding?', 'Stawki?'] },
    responsiveStrategy: { mobilePriority: 'contact + services', navPattern: 'hamburger', heroPattern: 'stacked' },
    assetStrategy: { heroSubject: 'team/collaboration', supportingSubjects: ['people', 'process'], iconTone: 'clean line' },
    antiPatterns: ['stock handshakes', 'vague "solutions" copy'],
    differentiation: 'Named experts and a visible process beat slogans.',
  },
  {
    id: 'BP-creative-studio', industry: 'creative-studio', audience: 'marki szukające partnera kreatywnego',
    businessGoal: 'portfolio',
    pageTypes: ['home', 'portfolio', 'services', 'about', 'contact'],
    recommendedSections: ['navbar', 'hero', 'work', 'services', 'studio', 'journal', 'cta', 'footer'],
    contentStrategy: { tone: 'cultured opinionated', headlineApproach: 'POV statement', density: 'lean', proofStyle: 'work + press + collaborations' },
    visualDirection: { style: 'creative', paletteHint: 'signature 1–2 colors only', typographyHint: 'display type as graphic', imageryHint: 'own work dominant', motionHint: 'editorial reveals' },
    conversionStrategy: { primaryCTA: 'Zacznijmy projekt', ctaPlacements: ['hero', 'after-work', 'footer'], trustDevices: ['nagrody', 'proces', 'klienci'], objectionHandlers: ['Budżety?', 'Timeline?'] },
    responsiveStrategy: { mobilePriority: 'work + contact', navPattern: 'minimal', heroPattern: 'type or image-led' },
    assetStrategy: { heroSubject: 'signature piece', supportingSubjects: ['project details', 'studio life'], iconTone: 'custom' },
    antiPatterns: ['generic agency template feel', 'too many case thumbnails'],
    differentiation: 'Taste made legible; the site is a portfolio piece itself.',
  },
];

export function getBlueprints(): readonly WebsiteBlueprintDecision[] {
  return BLUEPRINTS;
}

export function selectBlueprint(industry: string, businessGoal?: string): WebsiteBlueprintDecision | null {
  emitObservability('retrieval', 'blueprint', `Selecting blueprint for industry=${industry}`);
  const lower = industry.toLowerCase();
  const byIndustry = BLUEPRINTS.find((b) => b.industry === lower
    || b.industry.includes(lower) || lower.includes(b.industry));
  if (byIndustry) return byIndustry;
  // Alias map
  const aliases: Record<string, string> = {
    salon: 'beauty', gym: 'fitness', school: 'education', tech: 'technology',
    agency: 'agency', portfolio: 'portfolio', realestate: 'real-estate',
    clinic: 'medical-clinic', dentist: 'dental-clinic',
  };
  const alias = aliases[lower];
  if (alias) {
    const found = BLUEPRINTS.find((b) => b.id === `BP-${alias}` || b.industry === alias);
    if (found) return found;
  }
  if (businessGoal === 'ecommerce') return BLUEPRINTS.find((b) => b.industry === 'ecommerce') ?? null;
  return null;
}

/** Apply blueprint decisions onto architecture enrichment (not a template clone). */
export function enrichWithBlueprint(
  blueprint: WebsiteBlueprintDecision,
  architecture: WebsiteArchitecture,
  direction: DesignDirection,
): { pagePlansHints: Map<string, PageArchitecturePlan['primaryCTA']>; directionPatch: Partial<DesignDirection> } {
  const ctaHints = new Map<string, string>();
  for (const p of architecture.pages) {
    ctaHints.set(p.id, blueprint.conversionStrategy.primaryCTA);
  }
  return {
    pagePlansHints: ctaHints,
    directionPatch: {
      visualStyle: direction.visualStyle || blueprint.visualDirection.style,
      density: blueprint.contentStrategy.density,
      compositionRules: [
        ...direction.compositionRules,
        `Blueprint ${blueprint.id}: ${blueprint.differentiation}`,
      ],
    },
  };
}
