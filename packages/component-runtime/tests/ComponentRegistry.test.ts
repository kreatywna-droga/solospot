// ComponentRegistry.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentRegistry } from '../src/ComponentRegistry';
import { ComponentRegistration, ComponentManifest } from '../src/ComponentTypes';

const createManifest = (id: string): ComponentManifest => ({
  id,
  version: '1.0.0',
  category: 'widget',
  displayName: id,
  propsSchema: {},
  runtime: { loader: async () => ({ default: () => null }) },
});

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = new ComponentRegistry();
  });

  it('should register and resolve a component', () => {
    const manifest = createManifest('button');
    const registration: ComponentRegistration = {
      manifest,
      loadedAt: new Date().toISOString(),
    };

    registry.register(registration);
    expect(registry.has('button')).toBe(true);

    const resolved = registry.resolve('button');
    expect(resolved).toBeDefined();
    expect(resolved?.manifest.id).toBe('button');
  });

  it('should support tenant isolation', () => {
    const manifestA = createManifest('widget-a');
    const manifestB = createManifest('widget-b');

    registry.register({ manifest: manifestA, loadedAt: new Date().toISOString() }, 'tenant-1');
    registry.register({ manifest: manifestB, loadedAt: new Date().toISOString() }, 'tenant-2');

    expect(registry.has('widget-a', 'tenant-1')).toBe(true);
    expect(registry.has('widget-a', 'tenant-2')).toBe(false);
    expect(registry.has('widget-b', 'tenant-1')).toBe(false);
    expect(registry.has('widget-b', 'tenant-2')).toBe(true);
  });

  it('should list components for a tenant', () => {
    registry.register({ manifest: createManifest('a'), loadedAt: new Date().toISOString() }, 'tenant-1');
    registry.register({ manifest: createManifest('b'), loadedAt: new Date().toISOString() }, 'tenant-1');
    registry.register({ manifest: createManifest('c'), loadedAt: new Date().toISOString() }, 'tenant-2');

    const tenant1Components = registry.list('tenant-1');
    expect(tenant1Components).toHaveLength(2);
    expect(tenant1Components.map((r) => r.manifest.id).sort()).toEqual(['a', 'b']);
  });

  it('should remove a component', () => {
    registry.register({ manifest: createManifest('x'), loadedAt: new Date().toISOString() }, 'tenant-1');
    expect(registry.has('x', 'tenant-1')).toBe(true);

    registry.remove('x', 'tenant-1');
    expect(registry.has('x', 'tenant-1')).toBe(false);
  });

  it('should clear tenant scope', () => {
    registry.register({ manifest: createManifest('a'), loadedAt: new Date().toISOString() }, 'tenant-1');
    registry.register({ manifest: createManifest('b'), loadedAt: new Date().toISOString() }, 'tenant-1');

    registry.clear('tenant-1');
    expect(registry.list('tenant-1')).toHaveLength(0);
  });

  it('should clear all components', () => {
    registry.register({ manifest: createManifest('a'), loadedAt: new Date().toISOString() }, 'tenant-1');
    registry.register({ manifest: createManifest('b'), loadedAt: new Date().toISOString() });

    registry.clear();
    expect(registry.list()).toHaveLength(0);
    expect(registry.list('tenant-1')).toHaveLength(0);
  });
});
