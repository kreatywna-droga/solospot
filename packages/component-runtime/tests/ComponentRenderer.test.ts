// ComponentRenderer.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentRenderer } from '../src/ComponentRenderer';
import { ComponentRegistry } from '../src/ComponentRegistry';
import { ComponentResolver } from '../src/ComponentResolver';
import { ComponentRenderContext } from '../src/ComponentTypes';

describe('ComponentRenderer', () => {
  let registry: ComponentRegistry;
  let resolver: ComponentResolver;
  let renderer: ComponentRenderer;

  beforeEach(() => {
    registry = new ComponentRegistry();
    resolver = new ComponentResolver(registry);
    renderer = new ComponentRenderer(resolver);
  });

  it('should render a simple component', async () => {
    const mockComponent = () => '<span>Hello</span>';
    const manifest = {
      id: 'simple-text',
      version: '1.0.0',
      category: 'atom' as const,
      displayName: 'Simple Text',
      propsSchema: {
        text: { type: 'string' as const, required: true },
      },
      runtime: { loader: async () => ({ default: mockComponent }) },
    };

    registry.register({ manifest, loadedAt: new Date().toISOString() });

    const context: ComponentRenderContext = {
      tenantId: 'tenant-1',
      theme: {
        primaryColor: '#000',
        secondaryColor: '#fff',
        fontFamily: 'sans',
        backgroundColor: '#fff',
        borderRadius: '0',
      },
      assets: {
        resolve: async () => 'http://localhost/assets/test.png',
      },
      locale: 'pl_PL',
      currency: 'PLN',
      runtimeMode: 'preview',
    };

    const html = await renderer.render('simple-text', { text: 'Hello' }, context);
    expect(html).toContain('Hello');
  });

  it('should normalize props', async () => {
    const mockComponent = (props: any) => `<div>${JSON.stringify(props)}</div>`;
    const manifest = {
      id: 'props-test',
      version: '1.0.0',
      category: 'atom' as const,
      displayName: 'Props Test',
      propsSchema: {
        title: { type: 'string' as const, default: 'default' },
        count: { type: 'number' as const, default: 0 },
        active: { type: 'boolean' as const, default: false },
      },
      runtime: { loader: async () => ({ default: mockComponent }) },
    };

    registry.register({ manifest, loadedAt: new Date().toISOString() });

    const context: ComponentRenderContext = {
      tenantId: 'tenant-1',
      theme: {
        primaryColor: '#000',
        secondaryColor: '#fff',
        fontFamily: 'sans',
        backgroundColor: '#fff',
        borderRadius: '0',
      },
      assets: { resolve: async () => '' },
      locale: 'pl_PL',
      currency: 'PLN',
      runtimeMode: 'preview',
    };

    const html = await renderer.render('props-test', { title: 'Test', count: 5, active: true }, context);
    expect(html).toContain('&quot;title&quot;:&quot;Test&quot;');
    expect(html).toContain('&quot;count&quot;:5');
    expect(html).toContain('&quot;active&quot;:true');
  });

  it('should throw for missing component', async () => {
    const context: ComponentRenderContext = {
      tenantId: 'tenant-1',
      theme: {
        primaryColor: '#000',
        secondaryColor: '#fff',
        fontFamily: 'sans',
        backgroundColor: '#fff',
        borderRadius: '0',
      },
      assets: { resolve: async () => '' },
      locale: 'pl_PL',
      currency: 'PLN',
      runtimeMode: 'preview',
    };

    await expect(renderer.render('missing', {}, context)).rejects.toThrow('Component not found in registry');
  });
});
