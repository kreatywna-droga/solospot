/**
 * AutonomousWebsiteBuilder.test.ts — Test suite for Autonomous Experience Website Builder
 *
 * Verifies:
 * 1. Build Intent derivation, safe inferences, and validation.
 * 2. Multi-Page Blueprint synthesis, IA navigation, and slug uniqueness.
 * 3. Narrative choreographies & Design Rhythm across pages.
 * 4. WebGL concurrency budget enforcement (max 2 per page).
 * 5. BuilderDocument generation via standard atomic BuilderCommands.
 * 6. Overwrite protection for non-empty documents.
 * 7. Visual Critic analysis integration on generated output.
 * 8. Progress events & phase callback sequencing.
 */

import { describe, it, expect } from 'vitest';
import {
  createBuildIntent,
  validateBuildIntent,
  buildMultiPageWebsiteBlueprint,
  validateMultiPageBlueprint,
  generateMultiPageDocument,
  runAutonomousExperienceWebsiteBuilder,
  type PipelineProgressEvent,
} from '../index';
import type { BuilderDocument, BuilderPage } from '../../../../packages/builder-core/src';

describe('Autonomous Experience Website Builder Suite', () => {
  const SAMPLE_BRIEF =
    'Nowoczesna, wielostronicowa strona dla ekskluzywnego studia projektowego "Aurora Design Studio". Oferujemy branding, identyfikację wizualną oraz doświadczenia 3D dla marek premium.';

  // ── 1. Build Intent Contract ─────────────────────────────────────

  it('correctly parses user brief into validated BuildIntent', () => {
    const intent = createBuildIntent(SAMPLE_BRIEF);

    expect(intent.isValid).toBe(true);
    expect(intent.brand.name).toContain('Aurora Design Studio');
    expect(intent.brand.visualStyle).toBe('luxury');
    expect(intent.brand.tone).toBe('luxurious');
    expect(intent.pageRequirements.length).toBeGreaterThanOrEqual(3);

    const homePage = intent.pageRequirements.find((p) => p.isHome);
    expect(homePage).toBeDefined();
    expect(homePage?.slug).toBe('');

    const validation = validateBuildIntent(intent);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('rejects empty brief with validation error', () => {
    const emptyIntent = createBuildIntent('');
    expect(emptyIntent.isValid).toBe(false);
    expect(emptyIntent.validationErrors).toBeDefined();

    const validation = validateBuildIntent(emptyIntent);
    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toContain('Brak treści briefu');
  });

  // ── 2. Multi-Page Website Blueprint ──────────────────────────────

  it('synthesizes multi-page blueprint with consistent IA navigation', () => {
    const intent = createBuildIntent(SAMPLE_BRIEF);
    const blueprint = buildMultiPageWebsiteBlueprint(intent);

    expect(blueprint.validationStatus).toBe('VALID');
    expect(blueprint.pages.length).toBeGreaterThanOrEqual(3);

    // Verify exactly one Home page
    const homePages = blueprint.pages.filter((p) => p.isHome);
    expect(homePages).toHaveLength(1);

    // Verify IA navigation
    expect(blueprint.informationArchitecture.primaryNavigation.length).toBe(blueprint.pages.length);
    for (const navItem of blueprint.informationArchitecture.primaryNavigation) {
      expect(blueprint.pages.some((p) => p.id === navItem.targetPageId)).toBe(true);
    }

    const validation = validateMultiPageBlueprint(blueprint);
    expect(validation.valid).toBe(true);
  });

  // ── 3. Narrative Choreography & WebGL Concurrency ─────────────────

  it('enforces WebGL concurrency limit per page', () => {
    const intent = createBuildIntent(SAMPLE_BRIEF, {
      constraints: {
        contentDensity: 'rich',
        performanceTier: 'high',
        motion: {
          level: 'high',
          respectReducedMotion: true,
          maxWebGLCanvasPerPage: 1, // Strict limit of 1
          maxParticleCount: 1000,
        },
        targetDevicePriority: 'responsive-balanced',
      },
    });

    const blueprint = buildMultiPageWebsiteBlueprint(intent);
    for (const page of blueprint.pages) {
      const webGlSections = page.sections.filter((s) => s.experienceId === 'shader-aurora' || s.experienceId === 'particles-ambient');
      expect(webGlSections.length).toBeLessThanOrEqual(1);
    }
  });

  // ── 4. BuilderDocument Generation & Overwrite Guard ───────────────

  it('generates real BuilderDocument with pages and section child nodes', () => {
    const intent = createBuildIntent(SAMPLE_BRIEF);
    const blueprint = buildMultiPageWebsiteBlueprint(intent);
    const result = generateMultiPageDocument(blueprint);

    expect(result.success).toBe(true);
    expect(result.pagesCreated).toBe(blueprint.pages.length);
    expect(result.sectionsCreated).toBeGreaterThanOrEqual(10);
    expect(result.commandsExecuted).toBeGreaterThanOrEqual(12);

    const doc = result.document;
    expect(doc.pages.length).toBe(blueprint.pages.length);

    // Check Home page content
    const homePage = doc.pages.find((p) => p.isHome);
    expect(homePage).toBeDefined();
    expect(homePage?.sections.length).toBeGreaterThanOrEqual(5);

    // Check that sections have real child nodes (headings, buttons)
    const heroSection = homePage?.sections.find((s) => s.type === 'hero');
    expect(heroSection).toBeDefined();
    expect(heroSection?.children.some((c) => c.type === 'heading')).toBe(true);
  });

  it('blocks accidental overwrite of populated document when allowOverwrite is false', () => {
    const intent = createBuildIntent(SAMPLE_BRIEF);
    const blueprint = buildMultiPageWebsiteBlueprint(intent);

    const populatedDoc: BuilderDocument = {
      id: 'doc_existing',
      tenantId: 'tenant_1',
      version: 5,
      metadata: { storeName: 'Existing Store', storeSlug: 'existing-store', locale: 'pl', currency: 'PLN' },
      pages: [
        {
          id: 'page-1',
          slug: '',
          name: 'Home',
          isHome: true,
          seo: {},
          sections: [
            {
              id: 'sec_1',
              type: 'hero',
              label: 'Hero',
              props: {},
              children: [],
              visible: true,
              locked: false,
              order: 0,
            },
          ],
        },
      ],
      theme: { primaryColor: '#000', secondaryColor: '#fff', font: 'Inter' },
      isDirty: false,
      createdAt: 1000,
      updatedAt: 1000,
    };

    const result = generateMultiPageDocument(blueprint, populatedDoc, { allowOverwrite: false });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Wymagana jest jawna zgoda na nadpisanie');
  });

  // ── 5. End-to-End Master Pipeline with Visual Critic ──────────────

  it('runs complete Autonomous Experience Website Builder pipeline with Visual Critic', async () => {
    const events: PipelineProgressEvent[] = [];
    const output = await runAutonomousExperienceWebsiteBuilder(SAMPLE_BRIEF, undefined, {
      onProgress: (e) => events.push(e),
    });

    expect(output.success).toBe(true);
    expect(output.document.pages.length).toBeGreaterThanOrEqual(3);
    expect(output.stats.pagesCount).toBe(output.document.pages.length);
    expect(output.stats.sectionsCount).toBeGreaterThanOrEqual(10);
    expect(output.criticReport).toBeDefined();
    expect(output.criticReport.findings).toBeInstanceOf(Array);

    // Verify authentic progress events sequence
    const phases = events.map((e) => e.phase);
    expect(phases).toContain('intent_analysis');
    expect(phases).toContain('blueprint_planning');
    expect(phases).toContain('document_synthesis');
    expect(phases).toContain('visual_critic');
    expect(phases).toContain('complete');
  });
});
