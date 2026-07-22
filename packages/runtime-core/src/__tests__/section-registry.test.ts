import { describe, it, expect } from 'vitest';
import { createDefaultSectionRegistry } from '../DefaultSectionRegistry';
import { createSectionRegistry, SectionRenderContext } from '../SectionRegistry';
import { createRuntimeSection } from '../RuntimeSection';
import { RuntimeTheme } from '../RuntimeContext';

const THEME: RuntimeTheme = { primaryColor: '#111', secondaryColor: '#222', font: 'Inter' };

function renderContext(): SectionRenderContext {
  return { storeName: 's', tenantId: 't', storeId: 's', mode: 'LIVE', locale: 'pl', currency: 'PLN' };
}

describe('DefaultSectionRegistry', () => {
  it('registers the 12 built-in section renderers', () => {
    const registry = createDefaultSectionRegistry();
    const expected = [
      'hero', 'navbar', 'gallery', 'product-grid', 'category-grid',
      'testimonials', 'newsletter', 'footer', 'content', 'feature-grid',
      'stats', 'contact',
    ];
    for (const type of expected) {
      expect(registry.has(type)).toBe(true);
      expect(registry.get(type)).toBeDefined();
    }
    expect(registry.getAll()).toHaveLength(12);
  });

  it('renders a registered section to a string', async () => {
    const registry = createDefaultSectionRegistry();
    const html = await registry.renderSection(
      createRuntimeSection('s1', 'hero', 'Hero', { title: 'Witaj' }),
      THEME,
      renderContext()
    );
    expect(typeof html).toBe('string');
    expect(html).toContain('Witaj');
  });

  it('throws for an unregistered section type', async () => {
    const registry = createDefaultSectionRegistry();
    await expect(
      registry.renderSection(createRuntimeSection('x', 'nope', 'N'), THEME, renderContext())
    ).rejects.toThrow(/No renderer registered/);
  });

  it('supports register/unregister of custom renderers', () => {
    const registry = createSectionRegistry();
    expect(registry.has('custom')).toBe(false);
    registry.register({ type: 'custom', render: async () => '<div>c</div>' });
    expect(registry.has('custom')).toBe(true);
    expect(registry.unregister('custom')).toBe(true);
    expect(registry.has('custom')).toBe(false);
  });

  it('validates sections via renderer.validate', async () => {
    const registry = createSectionRegistry().register({
      type: 'guarded',
      render: async () => '<div>ok</div>',
      validate: (props) => ({ valid: !!props.title, errors: props.title ? [] : ['title required'] }),
    });
    expect(registry.validateSection(createRuntimeSection('a', 'guarded', 'G', {}))).toEqual({
      valid: false,
      errors: ['title required'],
    });
    expect(registry.validateSection(createRuntimeSection('a', 'guarded', 'G', { title: 'x' }))).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('per-tenant isolation: registries do not share state', async () => {
    const a = createSectionRegistry().register({ type: 'p', render: async () => '<div>A</div>' });
    const b = createSectionRegistry();
    expect(a.has('p')).toBe(true);
    expect(b.has('p')).toBe(false);
  });

  it('keeps the registry free of engine dependencies', () => {
    const registry = createDefaultSectionRegistry();
    expect((registry as { runtimeEngine?: unknown }).runtimeEngine).toBeUndefined();
  });
});
