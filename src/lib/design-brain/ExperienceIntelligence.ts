/**
 * ExperienceIntelligence.ts — Experience Classification, Recommendation & Narrative Choreography
 *
 * Part of SoloSpot Design Brain + Creative Experience Engine Integration.
 *
 * Bridges natural-language brief signals, industry archetypes, and brand visual DNA
 * with the 268-preset Creative Experience catalog (WebGL 3D, liquid gradients,
 * kinetic typography, sticky parallax stories, particle systems).
 *
 * Invariant: Produces deterministic, validated recommendations and enriched SitePlans.
 * Never performs direct UI mutation; strictly outputs pure data & BuilderCommands.
 */

import type {
  ExperienceItem,
  ExperienceMood,
  ExperienceMotionLevel,
  ExperienceType,
} from '../experience/ExperienceTypes';
import type { ExperienceSceneConfig } from '../experience/ExperienceRuntimeTypes';
import { getAllExperiences } from '../experience/ExperienceCatalog';
import type { SectionRole, SitePlan, SectionPlan } from '../ai/SitePlanTypes';
import type { DesignDirection } from './types';

export type ExperienceArchetype =
  | 'cinematic-showcase'
  | 'kinetic-manifesto'
  | 'atmospheric-story'
  | 'interactive-playground'
  | 'minimal-editorial'
  | 'high-impact-commerce'
  | 'liquid-spatial'
  | 'classic-balanced';

export interface ExperienceBriefProfile {
  archetype: ExperienceArchetype;
  mood: ExperienceMood;
  motionBudget: ExperienceMotionLevel;
  intensity: 'subtle' | 'moderate' | 'high-impact';
  preferredCategories: string[];
  targetAudience: string;
  brandPersonality: string;
  keywords: string[];
}

export interface ExperienceRecommendation {
  experienceId: string;
  name: string;
  category: string;
  type: ExperienceType;
  role: SectionRole;
  score: number;
  matchReasons: string[];
  motionLevel: ExperienceMotionLevel;
  mood?: ExperienceMood;
  runtimeConfig: ExperienceSceneConfig | Record<string, unknown>;
}

export interface ExperienceChoreographyPlan {
  narrativeArc: string;
  hero: ExperienceRecommendation | null;
  sections: Array<{
    role: SectionRole;
    experience: ExperienceRecommendation;
  }>;
  ambientBackground?: ExperienceRecommendation;
  motionBudgetSummary: {
    maxConcurrentWebGL: number;
    webGlSceneCount: number;
    scrollDriverCount: number;
    totalExperiences: number;
  };
}

/**
 * Keyword and intent classification rules for Experience archetype & mood.
 */
const ARCHETYPE_KEYWORDS: Record<ExperienceArchetype, string[]> = {
  'cinematic-showcase': ['cinematic', 'film', 'product', '3d', 'luxury', 'futuristic', 'premium', 'luksus', 'kino', 'space', 'spatial'],
  'kinetic-manifesto': ['kinetic', 'typography', 'manifesto', 'bold', 'statement', 'agencja', 'agency', 'creative', 'tekst', 'slogan', 'dynamic'],
  'atmospheric-story': ['story', 'narrative', 'aurora', 'glow', 'sticky', 'parallax', 'historia', 'klimat', 'atmosphere', 'fog', 'ambient'],
  'interactive-playground': ['interactive', 'cursor', 'particles', 'drag', 'orbit', 'gra', 'interakcja', 'mesh', 'shader', 'canvas', 'playful'],
  'minimal-editorial': ['minimal', 'editorial', 'clean', 'simple', 'prosty', 'architektura', 'elegancja', 'subtelny', 'monochrome', 'black and white'],
  'high-impact-commerce': ['shop', 'store', 'sklep', 'ecommerce', 'drop', 'sale', 'kup', 'cart', 'kolekcja', 'collection', 'produkt'],
  'liquid-spatial': ['liquid', 'wave', 'fluid', 'płynny', 'gradient', 'mesh', 'spatial', 'hologram', 'glassmorphism', 'futurystyczny'],
  'classic-balanced': ['corporate', 'business', 'law', 'clinic', 'dentist', 'firmowy', 'biznes', 'tradycyjny', 'standard'],
};

const INDUSTRY_MOOD_MAP: Record<string, ExperienceMood> = {
  saas: 'futuristic',
  tech: 'futuristic',
  agency: 'creative',
  creative: 'creative',
  luxury: 'luxury',
  realestate: 'elegant',
  portfolio: 'editorial',
  ecommerce: 'vibrant',
  restaurant: 'creative',
  clinic: 'minimal',
  dentist: 'minimal',
  gym: 'bold',
  fitness: 'bold',
  law: 'corporate',
  salon: 'elegant',
  beauty: 'luxury',
};

/**
 * Maps SectionRole to compatible Experience category preferences.
 */
const ROLE_CATEGORY_PREFERENCES: Record<SectionRole, string[]> = {
  hero: ['cinematic-heroes', 'kinetic-typography', 'atmospheric-hero', 'interactive-3d', 'hero'],
  about: ['sticky-stories', 'editorial-manifesto', 'parallax-narrative', 'interactive-showcases'],
  features: ['interactive-showcases', 'card-matrices', 'orbit-displays', 'feature-matrices'],
  testimonials: ['floating-cards', 'marquee-ticker', 'minimal-quotes'],
  cta: ['aurora-glow', 'liquid-portal', 'high-impact-cta', 'mesh-gradient'],
  gallery: ['interactive-showcases', '3d-carousel', 'parallax-grid'],
  services: ['interactive-showcases', 'card-matrices'],
  portfolio: ['interactive-showcases', 'parallax-grid', 'editorial-manifesto'],
  products: ['cinematic-product', 'interactive-showcases', '3d-orbit'],
  pricing: ['card-matrices', 'minimal-cards'],
  faq: ['minimal-cards', 'accordion'],
  contact: ['minimal-cards', 'ambient-form'],
  footer: ['minimal-footer'],
  navbar: ['minimal-nav'],
  team: ['card-matrices'],
  stats: ['kinetic-ticker', 'card-matrices'],
  logos: ['marquee-ticker'],
  newsletter: ['ambient-form'],
  blog: ['editorial-grid'],
  content: ['editorial-manifesto'],
};

/**
 * 1. Classify brief into a structured Experience profile.
 */
export function classifyExperienceIntent(
  brief: string,
  industry = 'general',
  direction?: DesignDirection
): ExperienceBriefProfile {
  const lowerBrief = (brief || '').toLowerCase();
  const lowerInd = (industry || 'general').toLowerCase();

  // Determine Archetype
  let bestArchetype: ExperienceArchetype = 'classic-balanced';
  let maxMatches = 0;

  for (const [archetype, keywords] of Object.entries(ARCHETYPE_KEYWORDS)) {
    const matches = keywords.filter(kw => lowerBrief.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestArchetype = archetype as ExperienceArchetype;
    }
  }

  // Fallbacks if brief is short
  if (maxMatches === 0) {
    if (['saas', 'tech'].includes(lowerInd)) bestArchetype = 'interactive-playground';
    else if (['agency', 'creative'].includes(lowerInd)) bestArchetype = 'kinetic-manifesto';
    else if (['luxury', 'beauty'].includes(lowerInd)) bestArchetype = 'cinematic-showcase';
    else if (['ecommerce'].includes(lowerInd)) bestArchetype = 'high-impact-commerce';
    else if (['portfolio'].includes(lowerInd)) bestArchetype = 'atmospheric-story';
    else bestArchetype = 'classic-balanced';
  }

  // Determine Mood
  const mood: ExperienceMood =
    (direction?.mood as ExperienceMood) ||
    INDUSTRY_MOOD_MAP[lowerInd] ||
    (bestArchetype === 'cinematic-showcase' ? 'cinematic' :
     bestArchetype === 'kinetic-manifesto' ? 'creative' :
     bestArchetype === 'atmospheric-story' ? 'dark' :
     bestArchetype === 'interactive-playground' ? 'futuristic' : 'modern');

  // Determine Motion Budget
  let motionBudget: ExperienceMotionLevel = 'animated';
  if (direction?.motionCharacter === 'cinematic' || bestArchetype === 'cinematic-showcase') {
    motionBudget = 'cinematic';
  } else if (direction?.motionCharacter === 'subtle' || bestArchetype === 'minimal-editorial' || ['law', 'clinic'].includes(lowerInd)) {
    motionBudget = 'subtle';
  } else if (bestArchetype === 'interactive-playground') {
    motionBudget = 'interactive';
  } else if (bestArchetype === 'atmospheric-story') {
    motionBudget = 'scroll';
  }

  // Preferred Categories
  const preferredCategories = [
    ...(bestArchetype === 'cinematic-showcase' ? ['cinematic-heroes', '3d-scenes', 'atmospheric-hero'] : []),
    ...(bestArchetype === 'kinetic-manifesto' ? ['kinetic-typography', 'editorial-manifesto'] : []),
    ...(bestArchetype === 'atmospheric-story' ? ['sticky-stories', 'parallax-narrative', 'aurora-glow'] : []),
    ...(bestArchetype === 'interactive-playground' ? ['interactive-showcases', 'particle-fields', 'mesh-gradient'] : []),
    ...(bestArchetype === 'liquid-spatial' ? ['liquid-shaders', 'mesh-gradient', '3d-scenes'] : []),
  ];

  return {
    archetype: bestArchetype,
    mood,
    motionBudget,
    intensity: motionBudget === 'cinematic' || motionBudget === 'interactive' ? 'high-impact' : 'moderate',
    preferredCategories,
    targetAudience: 'modern consumers',
    brandPersonality: direction?.visualStyle || 'contemporary',
    keywords: ARCHETYPE_KEYWORDS[bestArchetype],
  };
}

/**
 * 2. Deterministic scoring of an Experience item for a specific role and profile.
 */
export function scoreExperienceItem(
  item: ExperienceItem,
  role: SectionRole,
  profile: ExperienceBriefProfile
): { score: number; matchReasons: string[] } {
  let score = 50; // base baseline
  const matchReasons: string[] = [];

  // Role category match
  const preferredForRole = ROLE_CATEGORY_PREFERENCES[role] || [];
  const catMatch = preferredForRole.some(cat =>
    item.category.toLowerCase().includes(cat.toLowerCase()) ||
    cat.toLowerCase().includes(item.category.toLowerCase()) ||
    item.id.toLowerCase().includes(cat.toLowerCase())
  );
  if (catMatch) {
    score += 25;
    matchReasons.push(`Category "${item.category}" matches section role ${role}`);
  }

  // Archetype category preference match
  if (profile.preferredCategories.some(cat => item.category.toLowerCase().includes(cat) || item.id.includes(cat))) {
    score += 15;
    matchReasons.push(`Matches brief archetype "${profile.archetype}"`);
  }

  // Mood match
  if (item.mood === profile.mood) {
    score += 15;
    matchReasons.push(`Mood alignment: ${item.mood}`);
  } else if (item.tags?.includes(profile.mood)) {
    score += 10;
    matchReasons.push(`Tag mood alignment: ${profile.mood}`);
  }

  // Motion budget compatibility
  const motionScorePenalty = (itemMotion: string, budget: string) => {
    if (budget === 'subtle' && (itemMotion === 'cinematic' || itemMotion === 'interactive')) return -20;
    if (budget === 'static' && itemMotion !== 'static') return -30;
    if (budget === 'cinematic' && (itemMotion === 'cinematic' || itemMotion === 'scroll')) return 10;
    return 0;
  };

  const mPen = motionScorePenalty(item.motionLevel || 'subtle', profile.motionBudget);
  score += mPen;
  if (mPen > 0) matchReasons.push(`Optimal motion budget: ${item.motionLevel}`);

  // Flagship bonus (flagships are meticulously tuned)
  if (item.id.startsWith('flagship-')) {
    score += 10;
    matchReasons.push('Flagship verified tier');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    matchReasons,
  };
}

/**
 * 3. Find and rank top experiences for a specific section role.
 */
export function scoreExperiencesForRole(
  role: SectionRole,
  profile: ExperienceBriefProfile,
  catalog?: ExperienceItem[],
  limit = 5
): ExperienceRecommendation[] {
  const items = catalog || getAllExperiences();
  const scored: ExperienceRecommendation[] = [];

  for (const item of items) {
    const { score, matchReasons } = scoreExperienceItem(item, role, profile);
    if (score >= 40) {
      scored.push({
        experienceId: item.id,
        name: item.name,
        category: item.category,
        type: item.type,
        role,
        score,
        matchReasons,
        motionLevel: item.motionLevel || 'subtle',
        mood: item.mood,
        runtimeConfig: item.runtimeConfig || {},
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * 4. Choreograph a whole-page experience narrative.
 * Ensures non-conflicting performance (e.g. at most 1 heavy WebGL scene active per viewport).
 */
export function choreographPageExperiences(
  roles: SectionRole[],
  profile: ExperienceBriefProfile,
  catalog?: ExperienceItem[]
): ExperienceChoreographyPlan {
  const items = catalog || getAllExperiences();
  const heroRecs = scoreExperiencesForRole('hero', profile, items, 3);
  const hero = heroRecs[0] || null;

  const sectionRecs: Array<{ role: SectionRole; experience: ExperienceRecommendation }> = [];
  let webGlSceneCount = (hero?.category.includes('3d') || hero?.experienceId.includes('3d')) ? 1 : 0;
  let scrollDriverCount = (hero?.motionLevel === 'scroll') ? 1 : 0;

  for (const role of roles) {
    if (role === 'hero' || role === 'navbar' || role === 'footer') continue;

    const candidates = scoreExperiencesForRole(role, profile, items, 5);
    // Find best candidate that respects resource budget (do not overload with 5 WebGL canvases)
    const picked = candidates.find(c => {
      const is3D = c.category.includes('3d') || c.experienceId.includes('3d') || (c.runtimeConfig as any)?.scene3d;
      if (is3D && webGlSceneCount >= 2) return false;
      return true;
    }) || candidates[0];

    if (picked) {
      sectionRecs.push({ role, experience: picked });
      if (picked.category.includes('3d') || picked.experienceId.includes('3d')) webGlSceneCount++;
      if (picked.motionLevel === 'scroll') scrollDriverCount++;
    }
  }

  // Find ambient background if suitable
  const ambientCandidate = items.find(i =>
    (i.category === 'backgrounds' || i.type === 'background') &&
    (i.mood === profile.mood || i.id.includes('aurora') || i.id.includes('gradient'))
  );

  const ambientBackground: ExperienceRecommendation | undefined = ambientCandidate ? {
    experienceId: ambientCandidate.id,
    name: ambientCandidate.name,
    category: ambientCandidate.category,
    type: ambientCandidate.type,
    role: 'hero',
    score: 85,
    matchReasons: ['Ambient atmospheric foundation'],
    motionLevel: ambientCandidate.motionLevel || 'subtle',
    mood: ambientCandidate.mood,
    runtimeConfig: ambientCandidate.runtimeConfig || {},
  } : undefined;

  const narrativeArc = `Hook (${hero?.name || 'Hero'}) → Explore (${sectionRecs.map(s => s.experience.name).slice(0, 3).join(', ')}) → Climax CTA`;

  return {
    narrativeArc,
    hero,
    sections: sectionRecs,
    ambientBackground,
    motionBudgetSummary: {
      maxConcurrentWebGL: 2,
      webGlSceneCount,
      scrollDriverCount,
      totalExperiences: (hero ? 1 : 0) + sectionRecs.length,
    },
  };
}

/**
 * 5. Enriches an existing SitePlan with choreographed Experience configurations.
 */
export function enrichPlanWithExperiences(
  sitePlan: SitePlan,
  profile: ExperienceBriefProfile,
  catalog?: ExperienceItem[]
): SitePlan {
  const roles = sitePlan.sections.map(s => s.role);
  const choreography = choreographPageExperiences(roles, profile, catalog);

  const enrichedSections: SectionPlan[] = sitePlan.sections.map(sec => {
    if (sec.role === 'hero' && choreography.hero) {
      return {
        ...sec,
        experienceConfig: {
          ...choreography.hero.runtimeConfig,
          experienceId: choreography.hero.experienceId,
          experienceName: choreography.hero.name,
          motionLevel: choreography.hero.motionLevel,
        },
      };
    }

    const matched = choreography.sections.find(cs => cs.role === sec.role);
    if (matched) {
      return {
        ...sec,
        experienceConfig: {
          ...matched.experience.runtimeConfig,
          experienceId: matched.experience.experienceId,
          experienceName: matched.experience.name,
          motionLevel: matched.experience.motionLevel,
        },
      };
    }

    return sec;
  });

  return {
    ...sitePlan,
    sections: enrichedSections,
    experienceStrategy: {
      useParallax: choreography.motionBudgetSummary.scrollDriverCount > 0,
      useScrollReveal: true,
      useMotion: profile.motionBudget !== 'static',
      useMeshGradient: profile.archetype === 'liquid-spatial' || profile.archetype === 'atmospheric-story',
      useParticles: profile.archetype === 'interactive-playground',
      use3D: choreography.motionBudgetSummary.webGlSceneCount > 0,
      intensity: profile.intensity === 'high-impact' ? 'bold' : profile.intensity === 'moderate' ? 'moderate' : 'subtle',
    },
  };
}
