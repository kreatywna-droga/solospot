import { describe, it, expect } from 'vitest';
import { OpenCodeModelDiscovery } from '../OpenCodeModelDiscovery';
import { OpenCodeModelRouter } from '../OpenCodeModelRouter';

describe('OpenCodeModelDiscovery & Router v1.0', () => {
  it('discovers models dynamically and separates free vs paid', async () => {
    const discovery = OpenCodeModelDiscovery.getInstance();
    const result = await discovery.discoverModels();

    expect(result.models.length).toBeGreaterThan(0);
    expect(result.freeModels).toBeDefined();
    expect(result.paidModels).toBeDefined();

    for (const free of result.freeModels) {
      expect(free.isFree).toBe(true);
    }
  });

  it('normalizes model attributes properly', async () => {
    const discovery = OpenCodeModelDiscovery.getInstance();
    const result = await discovery.discoverModels();

    const sample = result.models[0];
    expect(sample.id).toBeDefined();
    expect(sample.name).toBeDefined();
    expect(sample.provider).toBeDefined();
    expect(typeof sample.supportsTools).toBe('boolean');
    expect(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']).toContain(sample.status);
  });

  it('router AUTO mode resolves a capable model', async () => {
    const router = OpenCodeModelRouter.getInstance();
    const resolution = await router.resolveModel('AUTO');

    expect(resolution.mode).toBe('AUTO');
    expect(resolution.selectedModel).toBeDefined();
    expect(resolution.toolSupported).toBe(true);
  });

  it('router FREE mode enforces free models', async () => {
    const router = OpenCodeModelRouter.getInstance();
    const resolution = await router.resolveModel('FREE', undefined, false);

    expect(resolution.mode).toBe('FREE');
    if (resolution.selectedModel) {
      expect(resolution.selectedModel.isFree).toBe(true);
    }
  });

  it('router MANUAL mode selects the requested model if available', async () => {
    const router = OpenCodeModelRouter.getInstance();
    const resolution = await router.resolveModel('MANUAL', 'openai/gpt-4o-mini');

    expect(resolution.mode).toBe('MANUAL');
    expect(resolution.selectedModel.id).toBe('openai/gpt-4o-mini');
  });

  it('honestly reports limitation if free model has no tool support for mutation', async () => {
    const router = OpenCodeModelRouter.getInstance();
    const resolution = await router.resolveModel('FREE', undefined, true);

    if (!resolution.toolSupported) {
      expect(resolution.limitationMessage).toBeDefined();
      expect(resolution.limitationMessage).toContain('darmowe modele OpenCode');
    }
  });
});
