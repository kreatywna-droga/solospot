import { describe, it, expect, beforeEach } from 'vitest';
import { MarketplaceCatalog } from '../src/MarketplaceCatalog';
import { MarketplaceSearchEngine } from '../../marketplace-core/src/MarketplaceSearchEngine';
import { ProductPage } from '../src/ProductPage';
import { DemoPreview } from '../src/DemoPreview';
import { InstallWizard } from '../src/InstallWizard';
import { PreviewRuntime, PreviewRuntimeResult } from '../../theme-runtime/src/PreviewRuntime';
import { TemplateInstallerEngine } from '../../template-installer/src/TemplateInstallerEngine';
import { TemplateManifestData } from '../../template-package/src/TemplateManifest';
import { MarketplaceTemplate } from '../../marketplace-core/src/entities';

describe('C10.5.9 Marketplace Experience Golden Flow', () => {
  describe('Marketplace → Preview → Install → Live Store', () => {
    it('should complete full marketplace experience flow', async () => {
      const searchEngine = new MarketplaceSearchEngine();
      const catalog = new MarketplaceCatalog(searchEngine);

      const template: MarketplaceTemplate = {
        id: 'flow-test', slug: 'flow-test', name: 'Flow Test Store', description: 'Test',
        author: { id: 'a1', name: 'Author' }, license: 'MIT', price: null,
        tags: ['storefront'], categories: ['retail'], dependencies: [],
        screenshots: ['https://example.com/screenshot.png'], previewUrl: 'https://example.com',
        compatibility: {}, ratings: [], versions: [{ id: 'v1', version: '1.0.0', publishedAt: '', author: { id: '', name: '' }, isStable: true, downloads: 0 }],
        createdAt: '', updatedAt: ''
      };

      searchEngine.addTemplate(template);

      const results = await catalog.search({ query: 'flow' });
      expect(results.total).toBe(1);

      const productPage = new ProductPage({ builder: '3.0.0', runtime: '3.0.0', componentApi: '1.0.0', themeApi: '1.0.0', commerceApi: '1.0.0' });
      const productData = productPage.getProductPage(template);
      expect(productData.template.id).toBe('flow-test');

      const mockPreviewRuntime = {
        renderPage: () => Promise.resolve({ html: '<div>Flow Test Store</div>', renderTimeMs: 10 } as PreviewRuntimeResult),
        renderSection: () => Promise.resolve({ html: '<section>Test</section>', renderTimeMs: 5 } as PreviewRuntimeResult),
        updateSession: () => {}
      } as unknown as PreviewRuntime;

      const demoPreview = new DemoPreview(mockPreviewRuntime);
      const pkg: TemplateManifestData = {
        manifest: { id: 'flow-test', name: 'Flow Test', version: '1.0.0', type: 'storefront', description: '', author: { name: 'A' }, license: 'MIT', price: null, tags: [], previewUrl: '', screenshots: [], compatibility: {}, dependencies: [], commerceFeatures: [], uiCapabilities: [] },
        pages: {}, sections: {}, components: {}, themes: {}, assets: {}, commerce: {}, runtime: {}
      };

      await demoPreview.loadTemplate(pkg);
      const preview = await demoPreview.render();
      expect(preview.html).toBe('<div>Flow Test Store</div>');

      const mockInstaller = {
        createPlan: () => ({ templateId: 'flow-test', tenantId: 't1', steps: [] }),
        provisionTenant: () => Promise.resolve({ success: true, tenantId: 't1', theme: 'theme-1', components: [], assets: [], pages: [], issues: [] })
      } as unknown as TemplateInstallerEngine;

      const wizard = new InstallWizard(mockInstaller);
      const progress = await wizard.install(template, pkg, 't1');

      expect(progress.completed).toBe(true);
    });
  });

  describe('Cross-module integration', () => {
    it('should maintain consistency between catalog and product page', async () => {
      const searchEngine = new MarketplaceSearchEngine();
      const catalog = new MarketplaceCatalog(searchEngine);

      const template: MarketplaceTemplate = {
        id: 'consistency-test', slug: 'consistency-test', name: 'Consistency Test', description: 'Desc',
        author: { id: 'a1', name: 'Author' }, license: 'MIT', price: null,
        tags: ['test'], categories: [], dependencies: [], screenshots: [], previewUrl: '',
        compatibility: {}, ratings: [], versions: [{ id: 'v1', version: '1.0.0', publishedAt: '', author: { id: '', name: '' }, isStable: true, downloads: 0 }],
        createdAt: '', updatedAt: ''
      };

      searchEngine.addTemplate(template);

      const searchResults = await catalog.search({ query: 'consistency' });
      const productPage = new ProductPage({ builder: '3.0.0', runtime: '3.0.0', componentApi: '1.0.0', themeApi: '1.0.0', commerceApi: '1.0.0' });
      const productData = productPage.getProductPage(template);

      expect(searchResults.templates[0].id).toBe(productData.template.id);
    });
  });
});