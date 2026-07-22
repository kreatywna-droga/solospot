// ComponentManifest.test.ts
import { describe, it, expect } from 'vitest';
import { ComponentManifestLoader } from '../src/ComponentManifest';

describe('ComponentManifestLoader', () => {
  const loader = new ComponentManifestLoader();

  it('should load a valid manifest', async () => {
    const manifest = await loader.load({
      id: 'test-button',
      version: '1.0.0',
      category: 'atom',
      displayName: 'Test Button',
      description: 'A test button',
      propsSchema: {
        label: { type: 'string', required: true },
        disabled: { type: 'boolean', default: false },
      },
      runtime: {
        loader: async () => ({ default: () => null }),
      },
      capabilities: ['clickable'],
    });

    expect(manifest.id).toBe('test-button');
    expect(manifest.category).toBe('atom');
    expect(manifest.loadedAt).toBeDefined();
  });

  it('should reject invalid manifest', async () => {
    await expect(
      loader.load({
        id: '',
        version: '1.0.0',
        category: 'atom',
        displayName: 'Test',
        propsSchema: {},
        runtime: { loader: async () => ({ default: () => null }) },
      } as any)
    ).rejects.toThrow();
  });

  it('should validate manifest schema', () => {
    const valid = {
      id: 'valid',
      version: '1.0.0',
      category: 'widget' as const,
      displayName: 'Valid',
      propsSchema: {},
      runtime: { loader: async () => ({ default: () => null }) },
    };

    expect(loader.validate(valid)).toBe(true);
  });
});
