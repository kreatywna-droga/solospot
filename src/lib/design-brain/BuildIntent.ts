/**
 * BuildIntent.ts — Validated, Serializable Build Intent Contract
 *
 * Translates raw user briefs and requirements into a structured, validated
 * Build Intent that powers multi-page website generation, information architecture,
 * narrative choreography, and experience selection.
 *
 * Core principles:
 * - Safe inference: infer sensible defaults with confidence scores without blocking.
 * - Explicit known facts vs. inferred assumptions vs. unknown fields.
 * - Serializable, deterministic, and fully typed.
 */

import type { Industry, SitePurpose, VisualDirection } from '../ai/SitePlanTypes';
import type { ExperienceArchetype } from './ExperienceIntelligence';

export interface BusinessGoal {
  primaryGoal: string;
  primaryAction: 'book' | 'buy' | 'contact' | 'lead' | 'subscribe' | 'explore' | 'download';
  secondaryAction?: string;
  targetAudience: string;
}

export interface BrandProfile {
  name: string;
  industry: Industry;
  tagline?: string;
  tone: 'professional' | 'luxurious' | 'friendly' | 'bold' | 'innovative' | 'playful' | 'editorial' | 'technical';
  visualStyle: VisualDirection;
  mood: string;
}

export interface PageRequirement {
  id: string;
  slug: string;
  title: string;
  purpose: 'home' | 'about' | 'services' | 'products' | 'portfolio' | 'pricing' | 'contact' | 'blog' | 'custom';
  isHome: boolean;
  priority: 'primary' | 'secondary';
}

export interface MotionConstraints {
  level: 'minimal' | 'moderate' | 'high' | 'dramatic';
  respectReducedMotion: boolean;
  maxWebGLCanvasPerPage: number;
  maxParticleCount: number;
}

export interface BuildConstraints {
  contentDensity: 'lean' | 'moderate' | 'rich';
  performanceTier: 'low' | 'balanced' | 'high';
  motion: MotionConstraints;
  targetDevicePriority: 'mobile-first' | 'desktop-first' | 'responsive-balanced';
}

export interface BuildIntentInference {
  field: string;
  inferredValue: unknown;
  confidence: number;
  reason: string;
}

export interface BuildIntent {
  id: string;
  brief: string;
  businessGoal: BusinessGoal;
  brand: BrandProfile;
  pageRequirements: PageRequirement[];
  experienceArchetype: ExperienceArchetype;
  constraints: BuildConstraints;
  inferences: BuildIntentInference[];
  unknownFields: string[];
  createdAt: string;
  isValid: boolean;
  validationErrors?: string[];
}

/**
 * Keywords and heuristic mappings for intent extraction.
 */
const INDUSTRY_KEYWORDS: Array<{ match: RegExp; industry: Industry }> = [
  { match: /\b(restauracj|kawiarn|jedzen|menu|bistro|culinary|food|dining)\b/i, industry: 'restaurant' },
  { match: /\b(szkoł|kurs|edukacj|nauka|academy|school|training|course)\b/i, industry: 'education' },
  { match: /\b(siłowni|trener|fitness|gym|workout|sport|crossfit)\b/i, industry: 'fitness' },
  { match: /\b(stomatolog|dentyst|ząb|lekarz|przychodni|clinic|medical)\b/i, industry: 'dentist' },
  { match: /\b(prawnik|adwokat|kancelari|prawo|legal|lawyer|attorney)\b/i, industry: 'law' },
  { match: /\b(nieruchomośc|mieszkani|apartament|deweloper|real\s*estate)\b/i, industry: 'realestate' },
  { match: /\b(saas|aplikacj|software|platform|chmur|tech|startup|ai|b2b)\b/i, industry: 'saas' },
  { match: /\b(agencj|marketing|branding|kreatywn|studio|design|creative)\b/i, industry: 'agency' },
  { match: /\b(sklep|sprzedaż|ecommerce|shop|store|koszyk|produkty)\b/i, industry: 'ecommerce' },
  { match: /\b(salon|urod|fryzjer|kosmetyk|beauty|spa|wellness)\b/i, industry: 'beauty' },
  { match: /\b(portfolio|fotograf|twórca|artysta|filmowiec|designer)\b/i, industry: 'portfolio' },
];

const PURPOSE_TO_ACTION: Record<SitePurpose, BusinessGoal['primaryAction']> = {
  'booking': 'book',
  'ecommerce': 'buy',
  'lead-generation': 'contact',
  'portfolio': 'explore',
  'informational': 'explore',
  'landing-page': 'lead',
  'blog': 'subscribe',
  'community': 'explore',
};

/**
 * Derives a complete BuildIntent from raw user brief and optional partial overrides.
 */
export function createBuildIntent(
  brief: string,
  overrides: Partial<BuildIntent> = {}
): BuildIntent {
  const normalizedBrief = brief.trim();
  const inferences: BuildIntentInference[] = [];
  const unknownFields: string[] = [];

  // 1. Detect Industry
  let detectedIndustry: Industry = 'saas';
  let industryConfidence = 0.5;
  for (const item of INDUSTRY_KEYWORDS) {
    if (item.match.test(normalizedBrief)) {
      detectedIndustry = item.industry;
      industryConfidence = 0.9;
      break;
    }
  }
  inferences.push({
    field: 'brand.industry',
    inferredValue: detectedIndustry,
    confidence: industryConfidence,
    reason: industryConfidence > 0.5 ? 'Wykryto słowa kluczowe branży w briefie' : 'Domyślna branża technologiczna',
  });

  // 2. Detect Visual Style & Tone
  let visualStyle: VisualDirection = 'professional';
  let tone: BrandProfile['tone'] = 'professional';
  if (/luksus|ekskluzywn|premium|elegancj/i.test(normalizedBrief)) {
    visualStyle = 'luxury';
    tone = 'luxurious';
  } else if (/minimal|prosty|clean|subteln/i.test(normalizedBrief)) {
    visualStyle = 'minimal';
    tone = 'editorial';
  } else if (/nowoczesn|future|innowacj|tech|cyber|ai/i.test(normalizedBrief)) {
    visualStyle = 'futuristic';
    tone = 'innovative';
  } else if (/odważn|dynamiczn|energi|bold/i.test(normalizedBrief)) {
    visualStyle = 'bold';
    tone = 'bold';
  } else if (/kreatywn|art|twórcz|design/i.test(normalizedBrief)) {
    visualStyle = 'creative';
    tone = 'playful';
  }

  // 3. Detect Brand Name
  let brandName = 'SoloSpot Project';
  const quoteMatch = normalizedBrief.match(/["'„]([A-Za-z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\-]{2,40})["'”]/);
  if (quoteMatch && quoteMatch[1]) {
    brandName = quoteMatch[1].trim();
  } else {
    const nameMatch = normalizedBrief.match(/(?:dla|nazwa|marka|brand|firmy)\s+["']?([A-Z0-9a-ząćęłńóśźż\s\-]{2,30})["']?/i);
    if (nameMatch && nameMatch[1]) {
      brandName = nameMatch[1].trim();
    } else if (normalizedBrief.length > 0 && normalizedBrief.length <= 40 && !normalizedBrief.includes('.')) {
      brandName = normalizedBrief;
    }
  }

  // 4. Primary Action & Goal
  let primaryAction: BusinessGoal['primaryAction'] = 'contact';
  if (/kup|sklep|zamów|ceny|ecommerce|zamówienie/i.test(normalizedBrief)) {
    primaryAction = 'buy';
  } else if (/rezerwacj|umów|wizyt|book|termin/i.test(normalizedBrief)) {
    primaryAction = 'book';
  } else if (/zapisz|newsletter|subskryb/i.test(normalizedBrief)) {
    primaryAction = 'subscribe';
  } else if (/wypróbuj|demo|rozpocznij|darmowy|trial/i.test(normalizedBrief)) {
    primaryAction = 'lead';
  }

  // 5. Experience Archetype
  let experienceArchetype: ExperienceArchetype = 'classic-balanced';
  if (detectedIndustry === 'agency' || visualStyle === 'creative') {
    experienceArchetype = 'kinetic-manifesto';
  } else if (visualStyle === 'luxury') {
    experienceArchetype = 'cinematic-showcase';
  } else if (detectedIndustry === 'portfolio' || visualStyle === 'minimal') {
    experienceArchetype = 'minimal-editorial';
  } else if (detectedIndustry === 'ecommerce' || detectedIndustry === 'restaurant') {
    experienceArchetype = 'high-impact-commerce';
  } else if (visualStyle === 'futuristic') {
    experienceArchetype = 'interactive-playground';
  }

  // 6. Page Requirements (Multi-Page determination)
  const isMultiPageRequested = /wielostronicow|wiele\s*stron|podstron|multi-page|kilka\s*stron|o\s*nas.*kontakt/i.test(normalizedBrief);
  const pageRequirements: PageRequirement[] = [
    {
      id: 'page-home',
      slug: '',
      title: 'Strona Główna',
      purpose: 'home',
      isHome: true,
      priority: 'primary',
    },
  ];

  if (isMultiPageRequested || detectedIndustry === 'agency' || detectedIndustry === 'saas' || detectedIndustry === 'realestate') {
    pageRequirements.push(
      {
        id: 'page-about',
        slug: 'o-nas',
        title: 'O Nas',
        purpose: 'about',
        isHome: false,
        priority: 'secondary',
      },
      {
        id: 'page-services',
        slug: detectedIndustry === 'ecommerce' ? 'produkty' : 'oferta',
        title: detectedIndustry === 'ecommerce' ? 'Produkty' : 'Oferta',
        purpose: detectedIndustry === 'ecommerce' ? 'products' : 'services',
        isHome: false,
        priority: 'secondary',
      },
      {
        id: 'page-contact',
        slug: 'kontakt',
        title: 'Kontakt',
        purpose: 'contact',
        isHome: false,
        priority: 'primary',
      }
    );
  }

  // 7. Motion & WebGL constraints
  const motionLevel: MotionConstraints['level'] =
    visualStyle === 'minimal' ? 'minimal' :
    visualStyle === 'luxury' || visualStyle === 'futuristic' ? 'high' : 'moderate';

  const defaultConstraints: BuildConstraints = {
    contentDensity: 'moderate',
    performanceTier: 'high',
    motion: {
      level: motionLevel,
      respectReducedMotion: true,
      maxWebGLCanvasPerPage: 2,
      maxParticleCount: 1500,
    },
    targetDevicePriority: 'responsive-balanced',
  };

  const validationErrors: string[] = [];
  if (normalizedBrief.length === 0 && !overrides.brief) {
    validationErrors.push('Brief strony nie może być pusty.');
  }

  const intent: BuildIntent = {
    id: `intent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    brief: normalizedBrief,
    businessGoal: {
      primaryGoal: `Pozyskiwanie klientów i budowa wizerunku dla ${brandName}`,
      primaryAction,
      targetAudience: `Odbiorcy poszukujący usług z sektora ${detectedIndustry}`,
      ...overrides.businessGoal,
    },
    brand: {
      name: brandName,
      industry: detectedIndustry,
      tone,
      visualStyle,
      mood: `${tone} ${visualStyle}`,
      ...overrides.brand,
    },
    pageRequirements: overrides.pageRequirements || pageRequirements,
    experienceArchetype: overrides.experienceArchetype || experienceArchetype,
    constraints: {
      ...defaultConstraints,
      ...overrides.constraints,
    },
    inferences,
    unknownFields,
    createdAt: new Date().toISOString(),
    isValid: validationErrors.length === 0,
    validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
  };

  return intent;
}

/**
 * Validates a BuildIntent for completeness and consistency.
 */
export function validateBuildIntent(intent: BuildIntent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!intent.brief || intent.brief.trim().length === 0) {
    errors.push('Brak treści briefu użytkownika.');
  }
  if (!intent.brand?.name) {
    errors.push('Brak nazwy marki/projektu.');
  }
  if (!intent.pageRequirements || intent.pageRequirements.length === 0) {
    errors.push('Wymagana jest co najmniej jedna strona (strona główna).');
  }
  const homePages = (intent.pageRequirements || []).filter((p) => p.isHome);
  if (homePages.length !== 1) {
    errors.push(`Strona główna musi występować dokładnie raz (znaleziono: ${homePages.length}).`);
  }
  const slugs = (intent.pageRequirements || []).map((p) => p.slug);
  const uniqueSlugs = new Set(slugs);
  if (uniqueSlugs.size !== slugs.length) {
    errors.push('Slugi podstron muszą być unikalne.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
