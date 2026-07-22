import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DemoPreview } from '../src/DemoPreview';
import { PreviewRuntime, PreviewRuntimeResult } from '../../theme-runtime/src/PreviewRuntime';
import { TemplateManifestData } from '../../template-package/src/TemplateManifest';

describe('DemoPreview', () => {
  let mockPreviewRuntime: PreviewRuntime;
  let demoPreview: DemoPreview;

  beforeEach(() => {
    mockPreviewRuntime = {
      renderPage: () => Promise.resolve({ html: '<div>Demo</div>', renderTimeMs: 15 } as PreviewRuntimeResult),
      renderSection: () => Promise.resolve({ html: '<section>Demo</section>', renderTimeMs: 5 } as PreviewRuntimeResult),
      updateSession: vi.fn()
    } as unknown as PreviewRuntime;

    demoPreview = new DemoPreview(mockPreviewRuntime);
  });

  describe('load template', () => {
    it('should load template into demo runtime', async () => {
      const pkg: TemplateManifestData = {
        manifest: {
          id: 'demo-template',
          name: 'Demo Store',
          version: '1.0.0',
          type: 'storefront',
          description: 'Demo store',
          author: { name: 'Test Author' },
          license: 'MIT',
          price: null,
          tags: [],
          previewUrl: '',
          screenshots: [],
          compatibility: {},
          dependencies: [],
          commerceFeatures: [],
          uiCapabilities: []
        },
        pages: { home: { id: 'home', slug: '/', name: 'Home', sections: [] } },
        sections: {},
        components: {},
        themes: {},
        assets: {},
        commerce: {},
        runtime: {}
      };

      await demoPreview.loadTemplate(pkg);

      expect(mockPreviewRuntime.updateSession).toHaveBeenCalled();
    });
  });

  describe('render', () => {
    it('should render demo page', async () => {
      const pkg: TemplateManifestData = {
        manifest: { id: 'test', name: 'Test', version: '1.0.0', type: 'storefront', description: '', author: { name: 'A' }, license: 'MIT', price: null, tags: [], previewUrl: '', screenshots: [], compatibility: {}, dependencies: [], commerceFeatures: [], uiCapabilities: [] },
        pages: {},
        sections: {},
        components: {},
        themes: {},
        assets: {},
        commerce: {},
        runtime: {}
      };

      await demoPreview.loadTemplate(pkg);
      const result = await demoPreview.render();

      expect(result.html).toBe('<div>Demo</div>');
    });
  });

  describe('access runtime', () => {
    it('should expose preview runtime', () => {
      const runtime = demoPreview.getRuntime();
      expect(runtime).toBeDefined();
    });
  });
});