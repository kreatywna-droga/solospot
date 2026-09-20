import { describe, it, expect } from 'vitest';
import { normalizeSceneConfig, getActiveCapabilityNames } from '../runtime/CapabilityEngine';
import { FLAGSHIP_EXPERIENCES } from '../ExperienceDefinitions/flagship-experiences';
import { insertExperienceToCanvas, type InsertionContext } from '../ExperienceInsertionEngine';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';

describe('Experience Runtime Engine v1.0 — Architecture & Contract Tests', () => {
  it('normalizes undefined config to a safe default config', () => {
    const config = normalizeSceneConfig(undefined);
    expect(config.version).toBe('1.0.0');
    expect(config.motion?.type).toBe('none');
    expect(config.pointer?.type).toBe('none');
    expect(config.background?.type).toBe('none');
    expect(config.scene3d?.transformStyle).toBe('preserve-3d');
    expect(config.reducedMotionFallback).toBe(true);
  });

  it('merges custom capability overrides correctly', () => {
    const custom = normalizeSceneConfig({
      pointer: { type: 'spotlight', radius: 450, color: 'rgba(255,0,0,0.5)' },
      background: { type: 'aurora', colors: ['#ff0000', '#00ff00'] },
      motion: { type: 'wave', speed: 1.5 },
      carousel: { itemCount: 5, autoplay: true },
    });

    expect(custom.pointer?.type).toBe('spotlight');
    expect(custom.pointer?.radius).toBe(450);
    expect(custom.pointer?.color).toBe('rgba(255,0,0,0.5)');
    expect(custom.background?.type).toBe('aurora');
    expect(custom.motion?.type).toBe('wave');
    expect(custom.motion?.speed).toBe(1.5);
    expect(custom.carousel?.itemCount).toBe(5);
    expect(custom.carousel?.autoplay).toBe(true);
  });

  it('computes active capability names for UI badges', () => {
    const config = normalizeSceneConfig({
      background: { type: 'mesh-gradient' },
      pointer: { type: 'tilt' },
      motion: { type: 'float' },
      scene3d: { transformStyle: 'preserve-3d' },
      effects: ['glass'],
    });

    const badges = getActiveCapabilityNames(config);
    expect(badges).toContain('Background: mesh-gradient');
    expect(badges).toContain('Pointer: tilt');
    expect(badges).toContain('Motion: float');
    expect(badges).toContain('3D Space');
    expect(badges).toContain('Effect: glass');
  });

  it('verifies all 10 flagship experiences define complete runtimeConfig', () => {
    expect(FLAGSHIP_EXPERIENCES.length).toBe(10);

    for (const flagship of FLAGSHIP_EXPERIENCES) {
      expect(flagship.runtimeConfig).toBeDefined();
      expect(flagship.runtimeConfig?.version).toBe('1.0.0');
    }
  });

  it('validates Flagship 1: Cinematic Product Hero runtime requirements', () => {
    const hero = FLAGSHIP_EXPERIENCES.find(f => f.id === 'flagship-cinematic-product-hero')!;
    expect(hero).toBeDefined();
    expect(hero.runtimeConfig?.background?.type).toBe('video');
    expect(hero.runtimeConfig?.background?.videoUrl).toContain('mp4');
    expect(hero.runtimeConfig?.pointer?.type).toBe('spotlight');
    expect(hero.runtimeConfig?.scene3d?.perspective).toBe(1200);
  });

  it('validates Flagship 2: Mirror Hall runtime requirements', () => {
    const mirror = FLAGSHIP_EXPERIENCES.find(f => f.id === 'flagship-mirror-hall')!;
    expect(mirror).toBeDefined();
    expect(mirror.runtimeConfig?.background?.type).toBe('ambient-blobs');
    expect(mirror.runtimeConfig?.scene3d?.reflection).toBe(true);
    expect(mirror.runtimeConfig?.pointer?.type).toBe('tilt');
    expect(mirror.runtimeConfig?.carousel?.itemCount).toBe(3);
  });

  it('validates Flagship 3: Glass Wave runtime requirements', () => {
    const glass = FLAGSHIP_EXPERIENCES.find(f => f.id === 'flagship-glass-wave')!;
    expect(glass).toBeDefined();
    expect(glass.runtimeConfig?.background?.type).toBe('mesh-gradient');
    expect(glass.runtimeConfig?.motion?.type).toBe('wave');
    expect(glass.runtimeConfig?.effects).toContain('glass');
  });

  it('validates Flagship 4: Gradient World runtime requirements', () => {
    const grad = FLAGSHIP_EXPERIENCES.find(f => f.id === 'flagship-gradient-world')!;
    expect(grad).toBeDefined();
    expect(grad.runtimeConfig?.background?.type).toBe('aurora');
    expect(grad.runtimeConfig?.pointer?.type).toBe('spotlight');
    expect(grad.runtimeConfig?.motion?.type).toBe('breathe');
  });

  it('validates Flagship 5: Sticky Story runtime requirements', () => {
    const sticky = FLAGSHIP_EXPERIENCES.find(f => f.id === 'flagship-sticky-story')!;
    expect(sticky).toBeDefined();
    expect(sticky.runtimeConfig?.scroll?.type).toBe('sticky-story');
    expect(sticky.runtimeConfig?.scroll?.steps).toBe(3);
  });

  it('validates Flagship 6: Horizontal Showcase runtime requirements', () => {
    const horiz = FLAGSHIP_EXPERIENCES.find(f => f.id === 'flagship-horizontal-showcase')!;
    expect(horiz).toBeDefined();
    expect(horiz.runtimeConfig?.scroll?.type).toBe('horizontal-showcase');
    expect(horiz.runtimeConfig?.scroll?.steps).toBe(4);
  });

  it('validates Flagship 7: Parallax Depth runtime requirements', () => {
    const parallax = FLAGSHIP_EXPERIENCES.find(f => f.id === 'flagship-parallax-depth')!;
    expect(parallax).toBeDefined();
    expect(parallax.runtimeConfig?.pointer?.type).toBe('parallax');
    expect(parallax.runtimeConfig?.pointer?.strength).toBe(1.5);
    expect(parallax.runtimeConfig?.background?.type).toBe('aurora');
  });

  it('validates Flagship 8: Interactive Bento runtime requirements', () => {
    const bento = FLAGSHIP_EXPERIENCES.find(f => f.id === 'flagship-interactive-bento')!;
    expect(bento).toBeDefined();
    expect(bento.runtimeConfig?.pointer?.type).toBe('spotlight');
    expect(bento.runtimeConfig?.background?.type).toBe('mesh-gradient');
    expect(bento.runtimeConfig?.effects).toContain('glow-border');
  });

  it('validates Flagship 9: Product Reveal runtime requirements', () => {
    const reveal = FLAGSHIP_EXPERIENCES.find(f => f.id === 'flagship-product-reveal')!;
    expect(reveal).toBeDefined();
    expect(reveal.runtimeConfig?.background?.type).toBe('glowing-orb');
    expect(reveal.runtimeConfig?.pointer?.type).toBe('spotlight');
    expect(reveal.runtimeConfig?.scene3d?.reflection).toBe(true);
  });

  it('validates Flagship 10: Perspective 3D Scene runtime requirements', () => {
    const p3d = FLAGSHIP_EXPERIENCES.find(f => f.id === 'flagship-perspective-3d-scene')!;
    expect(p3d).toBeDefined();
    expect(p3d.runtimeConfig?.scene3d?.perspective).toBe(1400);
    expect(p3d.runtimeConfig?.pointer?.type).toBe('tilt');
    expect(p3d.runtimeConfig?.motion?.type).toBe('orbit');
  });

  it('ensures createNode() attaches experienceConfig into props and metadata', () => {
    for (const flagship of FLAGSHIP_EXPERIENCES) {
      const node = flagship.createNode();
      expect(node.props?.experienceConfig).toBeDefined();
      expect((node.props?.experienceConfig as any).version).toBe('1.0.0');
    }
  });

  it('preserves experienceConfig during ExperienceInsertionEngine insertion', () => {
    const doc = createBuilderDocument({ id: 'test-store' });
    const dispatchedCommands: any[] = [];

    const ctx: InsertionContext = {
      document: doc,
      pageId: doc.pages[0].id,
      dispatch: (cmd) => {
        dispatchedCommands.push(cmd);
      },
    };

    const flagship = FLAGSHIP_EXPERIENCES[0];
    const res = insertExperienceToCanvas(flagship, ctx, 'add');

    expect(res.success).toBe(true);
    const insertCmd = dispatchedCommands.find(c => c.type === 'INSERT_NODE' || c.type === 'INSERT_SECTION');
    expect(insertCmd).toBeDefined();
    expect(insertCmd.node.props.experienceConfig).toBeDefined();
    expect(insertCmd.node.props.experienceConfig.background.type).toBe('video');
  });
});
