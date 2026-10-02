/**
 * ComposableSceneRuntime.test.ts — SoloSpot Experience Runtime v3.0 Composable Layer Tests
 */

import { describe, it, expect } from 'vitest';
import { normalizeSceneConfig, getActiveCapabilityNames } from '../runtime/CapabilityEngine';
import type { ExperienceSceneConfig, SceneLayerDefinition } from '../ExperienceRuntimeTypes';
import { getExperienceById, getAllExperiences } from '../ExperienceCatalog';
import { insertExperienceIntoDocument } from '../ExperienceInsertionEngine';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';
import { classifyExperienceIntent, scoreExperienceItem } from '../../design-brain/ExperienceIntelligence';

describe('Composable Scene Runtime v3.0', () => {
  it('normalizes v3.0 scene config with deterministic z-index sorted layers', () => {
    const rawConfig: Partial<ExperienceSceneConfig> = {
      version: '3.0.0',
      layers: [
        {
          id: 'l3',
          name: 'Content Stage',
          role: 'content',
          zIndex: 3,
          visible: true,
          motion: { type: 'pulse', speed: 1.2 },
        },
        {
          id: 'l0',
          name: 'Shader BG',
          role: 'background',
          zIndex: 0,
          visible: true,
          background: { type: 'shader', opacity: 0.8 },
        },
        {
          id: 'l1',
          name: 'Particles',
          role: 'particles',
          zIndex: 1,
          visible: false,
          opacity: 0.5,
          particles: { count: 150 },
        },
      ],
    };

    const normalized = normalizeSceneConfig(rawConfig);
    expect(normalized.version).toBe('3.0.0');
    expect(normalized.layers).toBeDefined();
    expect(normalized.layers!.length).toBe(3);
    // Verified sorted by zIndex ascending
    expect(normalized.layers![0].id).toBe('l0');
    expect(normalized.layers![1].id).toBe('l1');
    expect(normalized.layers![2].id).toBe('l3');
    expect(normalized.layers![1].visible).toBe(false);
    expect(normalized.layers![1].opacity).toBe(0.5);
  });

  it('correctly extracts capabilities from composable layer stack', () => {
    const config: ExperienceSceneConfig = {
      version: '3.0.0',
      layers: [
        {
          id: 'bg-1',
          name: 'Cosmic Shader',
          role: 'background',
          zIndex: 0,
          visible: true,
          background: { type: 'shader' },
        },
        {
          id: 'pt-1',
          name: 'Star Swarm',
          role: 'particles',
          zIndex: 1,
          visible: true,
          particles: { count: 300 },
        },
        {
          id: 'sp-1',
          name: '3D Stage',
          role: 'spatial-3d',
          zIndex: 2,
          visible: true,
          scene3d: { transformStyle: 'preserve-3d' },
        },
      ],
    };

    const caps = getActiveCapabilityNames(config);
    expect(caps).toContain('Layers: 3');
    expect(caps).toContain('BG: shader');
    expect(caps).toContain('Particles: 300');
    expect(caps).toContain('Spatial 3D');
  });

  it('registers Cinematic Spatial Reveal flagship in the catalog with 5 valid layers', () => {
    const exp = getExperienceById('flagship-cinematic-spatial-reveal');
    expect(exp).toBeDefined();
    expect(exp!.name).toBe('Cinematic Spatial Reveal');
    expect(exp!.runtimeConfig?.version).toBe('3.0.0');
    expect(exp!.runtimeConfig?.layers).toHaveLength(5);

    const roles = exp!.runtimeConfig!.layers!.map(l => l.role);
    expect(roles).toEqual(['background', 'particles', 'spatial-3d', 'content', 'overlay']);

    const rootNode = exp!.createNode();
    expect(rootNode.type).toBe('section');
    expect((rootNode.props as any).experienceConfig?.layers).toHaveLength(5);
    expect(rootNode.children!.length).toBeGreaterThan(0);
  });

  it('inserts 5-layer flagship into a BuilderDocument preserving serializable schema', () => {
    const doc = createBuilderDocument({ id: 'test-doc', metadata: { storeName: 'Test', storeSlug: 'test', locale: 'pl-PL', currency: 'PLN' }, pages: [{ id: 'p1', name: 'Home', slug: '/', sections: [], seo: {}, isHome: true }] });
    const exp = getExperienceById('flagship-cinematic-spatial-reveal')!;

    const result = insertExperienceIntoDocument(doc, exp, { mode: 'add', pageId: 'p1' });
    expect(result.success).toBe(true);
    expect(result.document.pages[0].sections).toHaveLength(1);

    const section = result.document.pages[0].sections[0];
    const cfg = (section.props as any).experienceConfig;
    expect(cfg).toBeDefined();
    expect(cfg.version).toBe('3.0.0');
    expect(cfg.layers).toHaveLength(5);
    expect(cfg.layers[0].background.shader.preset).toBe('nebula');
  });

  it('HACP Experience Intelligence scores 5-layer flagship with multi-layer bonus', () => {
    const exp = getExperienceById('flagship-cinematic-spatial-reveal')!;
    const profile = classifyExperienceIntent('cinematic futuristic 3d spatial landing page with shaders and particles', 'tech');

    const result = scoreExperienceItem(exp, 'hero', profile);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.matchReasons.some(r => r.includes('Multi-layer composable architecture'))).toBe(true);
  });
});
