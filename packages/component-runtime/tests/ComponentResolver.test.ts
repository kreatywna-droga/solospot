// ComponentResolver.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentResolver } from '../src/ComponentResolver';
import { ComponentRegistry } from '../src/ComponentRegistry';
import { ComponentRegistration } from '../src/ComponentTypes';

describe('ComponentResolver', () => {
  let registry: ComponentRegistry;
  let resolver: ComponentResolver;

  beforeEach(() => {
    registry = new ComponentRegistry();
    resolver = new ComponentResolver(registry);
  });

  it('should resolve and cache a component', async () => {
    const mockComponent = () => null;
    const manifest = {
      id: 'test-widget',
      version: '1.0.0',
      category: 'widget' as const,
      displayName: 'Test Widget',
      propsSchema: {},
      runtime: {
        loader: async () => ({ default: mockComponent }),
      },
    };

    const registration: ComponentRegistration = {
      manifest,
      loadedAt: new Date().toISOString(),
    };

    registry.register(registration);

    const resolved = await resolver.resolve('test-widget');
    expect(resolved.component).toBe(mockComponent);
    expect(resolved.manifest.id).toBe('test-widget');
  });

  it('should throw for unknown component', async () => {
    await expect(resolver.resolve('unknown')).rejects.toThrow('Component not found in registry');
  });

  it('should support tenant isolation', async () => {
    const manifestA = {
      id: 'widget-a',
      version: '1.0.0',
      category: 'widget' as const,
      displayName: 'Widget A',
      propsSchema: {},
      runtime: { loader: async () => ({ default: () => null }) },
    };

    registry.register({ manifest: manifestA, loadedAt: new Date().toISOString() }, 'tenant-1');

    await expect(resolver.resolve('widget-a', 'tenant-1')).resolves.toBeDefined();
    await expect(resolver.resolve('widget-a', 'tenant-2')).rejects.toThrow('Component not found in registry');
  });

  it('should resolve multiple components', async () => {
    const manifests = ['a', 'b', 'c'].map((id) => ({
      id,
      version: '1.0.0',
      category: 'widget' as const,
      displayName: id,
      propsSchema: {},
      runtime: { loader: async () => ({ default: () => null }) },
    }));

    manifests.forEach((m) => {
      registry.register({ manifest: m, loadedAt: new Date().toISOString() });
    });

    const results = await resolver.resolveAll(['a', 'b', 'c']);
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.manifest.id).sort()).toEqual(['a', 'b', 'c']);
  });
});
