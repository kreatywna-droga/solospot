/**
 * ExperienceIntelligence.test.ts — Verification of Experience Intelligence Engine
 *
 * Verifies:
 * - Deterministic intent & archetype classification from brief
 * - Multi-dimensional ranking and scoring of real catalog items
 * - Section-by-section narrative choreography
 * - Resource budgeting (WebGL scene concurrency caps)
 * - Safe enrichment of SitePlan without partial mutation
 */

import { describe, it, expect } from 'vitest';
import {
  classifyExperienceIntent,
  scoreExperienceItem,
  scoreExperiencesForRole,
  choreographPageExperiences,
  enrichPlanWithExperiences,
} from '../ExperienceIntelligence';
import { getAllExperiences, getExperienceById } from '../../experience/ExperienceCatalog';
import type { SitePlan } from '../../ai/SitePlanTypes';

describe('ExperienceIntelligence Engine (Roadmap Continuation)', () => {
  const catalog = getAllExperiences();

  it('classifies brief into cinematic-showcase archetype for luxury product briefs', () => {
    const brief = 'Stwórz nowoczesną stronę dla luksusowego zegarka kosmicznego z trójwymiarowym modelem 3D i cinematic hero';
    const profile = classifyExperienceIntent(brief, 'luxury');

    expect(profile.archetype).toBe('cinematic-showcase');
    expect(profile.mood).toBe('luxury');
    expect(profile.motionBudget).toBe('cinematic');
    expect(profile.intensity).toBe('high-impact');
  });

  it('classifies brief into kinetic-manifesto archetype for creative agency', () => {
    const brief = 'Design studio portfolio z mocną typografią kinetyczną, odważnym statementem i dynamicznymi przejściami';
    const profile = classifyExperienceIntent(brief, 'agency');

    expect(profile.archetype).toBe('kinetic-manifesto');
    expect(profile.mood).toBe('creative');
    expect(profile.preferredCategories).toContain('kinetic-typography');
  });

  it('classifies brief into interactive-playground archetype for developer SaaS', () => {
    const brief = 'Developer cloud platform with interactive particle fields, draggable canvas shaders and real-time mesh';
    const profile = classifyExperienceIntent(brief, 'saas');

    expect(profile.archetype).toBe('interactive-playground');
    expect(profile.mood).toBe('futuristic');
    expect(profile.motionBudget).toBe('interactive');
  });

  it('classifies brief into atmospheric-story archetype for brand storytelling', () => {
    const brief = 'Klimatyczna historia marki z efektem aurora borealis glow, sticky storytelling i delikatnym parallaxem';
    const profile = classifyExperienceIntent(brief, 'portfolio');

    expect(profile.archetype).toBe('atmospheric-story');
    expect(profile.motionBudget).toBe('scroll');
  });

  it('scores catalog items deterministically based on role, category, and mood', () => {
    const profile = classifyExperienceIntent('Cinematic spatial watch hero with 3d model', 'luxury');
    const cinematicHero = getExperienceById('flagship-cinematic-product-hero');
    expect(cinematicHero).toBeDefined();

    if (cinematicHero) {
      const { score, matchReasons } = scoreExperienceItem(cinematicHero, 'hero', profile);
      expect(score).toBeGreaterThanOrEqual(75);
      expect(matchReasons.length).toBeGreaterThan(0);
      expect(matchReasons.some(r => r.includes('matches section role'))).toBe(true);
    }
  });

  it('ranks top experiences for a hero section according to the brief profile', () => {
    const profile = classifyExperienceIntent('SaaS platform with interactive visual hero and modern gradients', 'saas');
    const recommendations = scoreExperiencesForRole('hero', profile, catalog, 5);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.length).toBeLessThanOrEqual(5);
    expect(recommendations[0].score).toBeGreaterThanOrEqual(recommendations[1]?.score || 0);
  });

  it('choreographs a harmonious full-page experience narrative respecting WebGL budgets', () => {
    const profile = classifyExperienceIntent('Studio agency with 3D models, kinetic typography and aurora glow', 'agency');
    const choreography = choreographPageExperiences(
      ['hero', 'about', 'features', 'testimonials', 'cta'],
      profile,
      catalog
    );

    expect(choreography.narrativeArc).toBeDefined();
    expect(choreography.hero).not.toBeNull();
    expect(choreography.sections.length).toBeGreaterThan(0);
    // Concurrency check: max concurrent WebGL scenes must not exceed budget cap of 2
    expect(choreography.motionBudgetSummary.webGlSceneCount).toBeLessThanOrEqual(2);
    expect(choreography.motionBudgetSummary.totalExperiences).toBeGreaterThan(0);
  });

  it('enriches an existing SitePlan with tailored Experience configurations', () => {
    const profile = classifyExperienceIntent('High tech futuristic AI startup with mesh gradient and particles', 'saas');
    const baseSitePlan: SitePlan = {
      purpose: 'lead-generation',
      industry: 'saas',
      visualDirection: 'futuristic',
      sections: [
        {
          id: 'sec-1',
          role: 'hero',
          label: 'Hero',
          templateType: 'hero-split',
          content: { heading: 'Next Gen AI' },
          images: [],
          styles: {},
        },
        {
          id: 'sec-2',
          role: 'features',
          label: 'Features',
          templateType: 'features-grid',
          content: { heading: 'Core Capabilities' },
          images: [],
          styles: {},
        },
        {
          id: 'sec-3',
          role: 'cta',
          label: 'CTA',
          templateType: 'cta-glow',
          content: { heading: 'Get Started' },
          images: [],
          styles: {},
        },
      ],
      designSystem: {
        primaryColor: '#7c3aed',
        secondaryColor: '#3b82f6',
        accentColor: '#10b981',
        backgroundColor: '#0a0a0e',
        surfaceColor: '#12121a',
        textColor: '#ffffff',
        headingFont: 'Space Grotesk',
        bodyFont: 'Inter',
        borderRadius: '8px',
      },
      contentStrategy: {
        toneOfVoice: 'technical',
        headlineStyle: 'bold',
        contentDensity: 'moderate',
        language: 'pl',
        useEmojis: false,
        ctaStrategy: 'direct',
      },
      assetStrategy: {
        imageStyle: 'abstract',
        imageMood: 'futuristic',
        iconStyle: 'outlined',
        useVideo: false,
      },
      experienceStrategy: {
        useParallax: false,
        useScrollReveal: true,
        useMotion: true,
        useMeshGradient: false,
        useParticles: false,
        use3D: false,
        intensity: 'moderate',
      },
      responsiveStrategy: {
        mobileNavStyle: 'hamburger',
        mobileHeroLayout: 'stacked',
        mobileTypographyScale: 0.85,
        tabletBreakpoint: 768,
        mobileBreakpoint: 480,
      },
      conversionStrategy: {
        primaryCTA: 'Start Free Trial',
        primaryCTALocation: ['hero', 'cta'],
        trustSignals: ['SOC2', 'GDPR'],
        urgencyLevel: 'none',
      },
      pages: [],
      metadata: {
        title: 'Test Plan',
        description: 'Test Description',
        language: 'pl',
        generatedAt: new Date().toISOString(),
        plannerType: 'deterministic',
      },
    };

    const enriched = enrichPlanWithExperiences(baseSitePlan, profile, catalog);

    expect(enriched.sections[0].experienceConfig).toBeDefined();
    expect(enriched.sections[0].experienceConfig?.experienceId).toBeDefined();
    expect(enriched.sections[1].experienceConfig).toBeDefined();
    expect(enriched.sections[2].experienceConfig).toBeDefined();
    expect(enriched.experienceStrategy.useMotion).toBe(true);
  });
});
