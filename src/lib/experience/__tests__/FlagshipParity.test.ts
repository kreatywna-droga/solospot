import { describe, it, expect } from 'vitest';
import { FLAGSHIP_EXPERIENCES } from '../ExperienceDefinitions/flagship-experiences';
import { getExperienceById, getAllExperiences } from '../ExperienceCatalog';
import { validateExperienceItem } from '../ExperienceCompatibility';
import { insertExperienceIntoDocument } from '../ExperienceInsertionEngine';
import { createBuilderDocument } from '../../../../packages/builder-core/src';

describe('SoloSpot Flagship Experiences v3.0 Parity & Schema Test', () => {
  const EXPECTED_FLAGSHIP_IDS = [
    'flagship-cinematic-product-hero',
    'flagship-mirror-hall',
    'flagship-glass-wave',
    'flagship-gradient-world',
    'flagship-sticky-story',
    'flagship-horizontal-showcase',
    'flagship-parallax-depth',
    'flagship-interactive-bento',
    'flagship-product-reveal',
    'flagship-perspective-3d-scene',
  ];

  it('contains exactly 10 flagship experiences', () => {
    expect(FLAGSHIP_EXPERIENCES.length).toBe(10);
  });

  it('registers all 10 flagship experiences in the central ExperienceCatalog', () => {
    const all = getAllExperiences();
    for (const id of EXPECTED_FLAGSHIP_IDS) {
      const found = getExperienceById(id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(id);
      expect(found?.badge?.startsWith('Flagship')).toBe(true);
      expect(all.some(e => e.id === id)).toBe(true);
    }
  });

  it('verifies all flagships conform strictly to ExperienceItem schema v2.0.0', () => {
    for (const exp of FLAGSHIP_EXPERIENCES) {
      expect(validateExperienceItem(exp)).toBe(true);
      expect(exp.schemaVersion).toBe('2.0.0');
      expect(exp.source).toBe('builtin');
      expect(exp.name.trim().length).toBeGreaterThan(0);
      expect(exp.description.trim().length).toBeGreaterThan(15);
      expect(Array.isArray(exp.tags)).toBe(true);
      expect(exp.tags.length).toBeGreaterThanOrEqual(3);
      expect(exp.capabilities).toBeDefined();
    }
  });

  it('creates rich BuilderNode trees with section root and multiple children', () => {
    for (const exp of FLAGSHIP_EXPERIENCES) {
      const root = exp.createNode();
      expect(root).toBeDefined();
      expect(root.type).toBe('section');
      expect(root.id).toBeDefined();
      expect(root.children).toBeDefined();
      expect(root.children!.length).toBeGreaterThan(0);
    }
  });

  it('generates fresh unique IDs on each invocation of createNode()', () => {
    for (const exp of FLAGSHIP_EXPERIENCES) {
      const nodeA = exp.createNode();
      const nodeB = exp.createNode();
      expect(nodeA.id).not.toBe(nodeB.id);
      expect(nodeA.children![0].id).not.toBe(nodeB.children![0].id);
    }
  });

  it('verifies specific flagship capabilities and architectural features', () => {
    // 1. Cinematic Product Hero
    const hero = getExperienceById('flagship-cinematic-product-hero')!;
    expect(hero).toBeDefined();
    expect(hero.capabilities?.backgroundVideo || hero.capabilities?.videoBackground).toBe(true);
    const heroNode = hero.createNode();
    expect(heroNode.props?.backgroundVideo || heroNode.props?.backgroundVideoUrl).toBeDefined();

    // 2. Mirror Hall
    const mirror = getExperienceById('flagship-mirror-hall')!;
    expect(mirror).toBeDefined();
    expect(mirror.capabilities?.perspective3d).toBe(true);
    const mirrorNode = mirror.createNode();
    expect(mirrorNode.children?.length).toBeGreaterThan(0);

    // 3. Glass Wave
    const glass = getExperienceById('flagship-glass-wave')!;
    expect(glass).toBeDefined();
    expect(glass.capabilities?.glassmorphism).toBe(true);

    // 4. Gradient World
    const grad = getExperienceById('flagship-gradient-world')!;
    expect(grad).toBeDefined();
    expect(grad.capabilities?.gradient).toBe(true);

    // 8. Bento
    const bento = getExperienceById('flagship-interactive-bento')!;
    expect(bento).toBeDefined();
    expect(bento.capabilities?.customLayout).toBe(true);

    // 10. Perspective 3D Scene
    const perspective = getExperienceById('flagship-perspective-3d-scene')!;
    expect(perspective).toBeDefined();
    expect(perspective.capabilities?.perspective3d).toBe(true);
  });

  it('seamlessly inserts flagship experiences into a BuilderDocument using ExperienceInsertionEngine', () => {
    const doc = createBuilderDocument({
      id: 'test-store',
      metadata: {
        storeName: 'Test Store',
        storeSlug: 'test-store',
        locale: 'pl',
        currency: 'PLN',
      },
    });
    const flagship = FLAGSHIP_EXPERIENCES[0];

    const result = insertExperienceIntoDocument(doc, flagship, { mode: 'add' });
    expect(result.success).toBe(true);
    expect(result.document.pages[0].sections.length).toBe(1);
    expect(result.document.pages[0].sections[0].type).toBe('section');
    expect(result.document.pages[0].sections[0].children!.length).toBeGreaterThan(0);
  });
});
