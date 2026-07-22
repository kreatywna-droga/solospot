// TemplateRuntime.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplateRuntime, SectionRenderer } from './TemplateRuntime';
import { ThemeRuntime } from './ThemeRuntime';
import { RendererEngine } from './RendererEngine';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { SimpleAssetResolver } from '../../asset-manager-core/src/AssetResolver';
import { LocalAssetStorage } from '../../asset-manager-core/src/providers/LocalAssetStorage';
import { AssetReference } from '../../asset-manager-core/src/AssetReference';
import { RuntimeSection, RuntimePage } from '../../runtime-core/src/RuntimeSection';

describe('TemplateRuntime', () => {
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let themeRuntime: ThemeRuntime;
  let rendererEngine: RendererEngine;
  let storage: LocalAssetStorage;
  let assets: SimpleAssetResolver;
  let templateRuntime: TemplateRuntime;
  let uploadedAssets: Map<string, any>;

  beforeEach(async () => {
    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);
    themeRuntime = new ThemeRuntime({ eventBus, logger });
    rendererEngine = new RendererEngine({ themeRuntime });
    storage = new LocalAssetStorage({ basePath: 'test' });
    
    uploadedAssets = new Map<string, any>();
    const mockLibrary = {
      getById: async (id: string) => uploadedAssets.get(id),
    };
    
    assets = new SimpleAssetResolver(storage, mockLibrary as any);
    
    await themeRuntime.loadTheme('tenant-1', {
      id: 'default',
      name: 'Default',
      version: '1.0.0',
      author: 'Test',
      tokens: {
        primaryColor: '#8b5cf6',
        secondaryColor: '#d946ef',
        backgroundColor: '#050508',
        fontFamily: 'Inter',
        borderRadius: '4px',
      },
      layouts: ['default'],
      components: {},
    });
    
    templateRuntime = new TemplateRuntime({
      eventBus,
      logger,
      themeRuntime,
      rendererEngine,
      assets,
    });
  });

  describe('default section renderers', () => {
    it('should render Header section', async () => {
      const section: RuntimeSection = {
        id: 'sec_header',
        type: 'Header',
        label: 'Header',
        props: { title: 'My Shop' },
        order: 0,
        visible: true,
      };

      const result = await templateRuntime.renderSection(section, {
        tenantId: 'tenant-1',
        themeId: 'default',
        tokens: {} as any,
        locale: 'pl_PL',
        currency: 'PLN',
        assets,
      });

      expect(result).toContain('<header>');
      expect(result).toContain('My Shop');
    });

    it('should render Footer section', async () => {
      const section: RuntimeSection = {
        id: 'sec_footer',
        type: 'Footer',
        label: 'Footer',
        props: { copyright: '© 2026 My Shop' },
        order: 10,
        visible: true,
      };

      const result = await templateRuntime.renderSection(section, {
        tenantId: 'tenant-1',
        themeId: 'default',
        tokens: {} as any,
        locale: 'pl_PL',
        currency: 'PLN',
        assets,
      });

      expect(result).toContain('<footer>');
      expect(result).toContain('© 2026 My Shop');
    });

    it('should render Hero section with image asset reference', async () => {
      const imageFile = new File(['test'], 'hero.png', { type: 'image/png' });
      const uploadResult = await storage.upload(imageFile, { contentType: 'image/png' });
      (uploadedAssets as any).set('asset_123', {
        id: 'asset_123',
        type: 'image',
        storageKey: uploadResult.storageKey,
      });

      const section: RuntimeSection = {
        id: 'sec_hero',
        type: 'Hero',
        label: 'Hero',
        props: {
          heading: 'Welcome',
          text: 'Shop now',
          image: { id: 'asset_123', type: 'image', storageKey: uploadResult.storageKey },
        },
        order: 1,
        visible: true,
      };

      const result = await templateRuntime.renderSection(section, {
        tenantId: 'tenant-1',
        themeId: 'default',
        tokens: {} as any,
        locale: 'pl_PL',
        currency: 'PLN',
        assets,
      });

      expect(result).toContain('Welcome');
      expect(result).toContain('Shop now');
      expect(result).toContain('<img');
    });

    it('should render ProductGrid section with limit', async () => {
      const section: RuntimeSection = {
        id: 'sec_products',
        type: 'ProductGrid',
        label: 'Products',
        props: { limit: 12 },
        order: 2,
        visible: true,
      };

      const result = await templateRuntime.renderSection(section, {
        tenantId: 'tenant-1',
        themeId: 'default',
        tokens: {} as any,
        locale: 'pl_PL',
        currency: 'PLN',
        assets,
      });

      expect(result).toContain('product-grid');
      expect(result).toContain('limit: 12');
    });

    it('should render FeatureList section', async () => {
      const section: RuntimeSection = {
        id: 'sec_features',
        type: 'FeatureList',
        label: 'Features',
        props: { items: ['Fast', 'Secure', 'Global'] },
        order: 3,
        visible: true,
      };

      const result = await templateRuntime.renderSection(section, {
        tenantId: 'tenant-1',
        themeId: 'default',
        tokens: {} as any,
        locale: 'pl_PL',
        currency: 'PLN',
        assets,
      });

      expect(result).toContain('<ul>');
      expect(result).toContain('Fast');
      expect(result).toContain('Secure');
      expect(result).toContain('Global');
    });

    it('should render ContactForm section', async () => {
      const section: RuntimeSection = {
        id: 'sec_contact',
        type: 'ContactForm',
        label: 'Contact',
        props: { email: 'support@example.com' },
        order: 4,
        visible: true,
      };

      const result = await templateRuntime.renderSection(section, {
        tenantId: 'tenant-1',
        themeId: 'default',
        tokens: {} as any,
        locale: 'pl_PL',
        currency: 'PLN',
        assets,
      });

      expect(result).toContain('support@example.com');
    });
  });

  describe('custom section renderers', () => {
    it('should allow registering custom section renderer', async () => {
      const customRenderer: SectionRenderer = {
        type: 'CustomBanner',
        render: async () => '<div class="custom-banner">Custom</div>',
      };

      templateRuntime.registerSectionRenderer(customRenderer);

      const section: RuntimeSection = {
        id: 'sec_custom',
        type: 'CustomBanner',
        label: 'Custom',
        props: {},
        order: 1,
        visible: true,
      };

      const result = await templateRuntime.renderSection(section, {
        tenantId: 'tenant-1',
        themeId: 'default',
        tokens: {} as any,
        locale: 'pl_PL',
        currency: 'PLN',
        assets,
      });

      expect(result).toBe('<div class="custom-banner">Custom</div>');
    });
  });

  describe('page rendering', () => {
    it('should render a full page with multiple sections', async () => {
      const page: RuntimePage = {
        id: 'page_home',
        slug: '',
        name: 'Home',
        sections: [
          {
            id: 'sec_header',
            type: 'Header',
            label: 'Header',
            props: { title: 'My Shop' },
            order: 0,
            visible: true,
          },
          {
            id: 'sec_hero',
            type: 'Hero',
            label: 'Hero',
            props: { heading: 'Welcome', text: 'Shop now' },
            order: 1,
            visible: true,
          },
          {
            id: 'sec_footer',
            type: 'Footer',
            label: 'Footer',
            props: { copyright: '© 2026' },
            order: 10,
            visible: true,
          },
        ],
      };

      const layoutTemplate = `
<!DOCTYPE html>
<html>
<head><title>{{page_title}}</title></head>
<body>
  <!-- slot:sec_header -->
  <main>
    <!-- slot:sec_hero -->
  </main>
  <!-- slot:sec_footer -->
</body>
</html>
      `.trim();

      const html = await templateRuntime.renderPage('tenant-1', 'default', page, layoutTemplate);
      expect(html).toContain('My Shop');
      expect(html).toContain('Welcome');
      expect(html).toContain('Shop now');
      expect(html).toContain('© 2026');
    });

    it('should skip invisible sections', async () => {
      const page: RuntimePage = {
        id: 'page_home',
        slug: '',
        name: 'Home',
        sections: [
          {
            id: 'sec_header',
            type: 'Header',
            label: 'Header',
            props: { title: 'Visible Header' },
            order: 0,
            visible: true,
          },
          {
            id: 'sec_hidden',
            type: 'Hero',
            label: 'Hidden Hero',
            props: { heading: 'Hidden' },
            order: 1,
            visible: false,
          },
        ],
      };

      const layoutTemplate = `
<!DOCTYPE html>
<html>
<body>
  <!-- slot:sec_header -->
  <!-- slot:sec_hidden -->
</body>
</html>
      `.trim();

      const html = await templateRuntime.renderPage('tenant-1', 'default', page, layoutTemplate);
      expect(html).toContain('Visible Header');
      expect(html).not.toContain('Hidden');
    });
  });

  describe('events', () => {
    it('should publish template events during rendering', async () => {
      const page: RuntimePage = {
        id: 'page_home',
        slug: '',
        name: 'Home',
        sections: [
          {
            id: 'sec_header',
            type: 'Header',
            label: 'Header',
            props: { title: 'Event Test' },
            order: 0,
            visible: true,
          },
        ],
      };

      const layoutTemplate = `
<!DOCTYPE html>
<html>
<body>
  <!-- slot:sec_header -->
</body>
</html>
      `.trim();

      const publishSpy = vi.spyOn(eventBus, 'publish');
      await templateRuntime.renderPage('tenant-1', 'default', page, layoutTemplate);

      const eventTypes = publishSpy.mock.calls.map((call) => call[0].eventType);
      expect(eventTypes).toContain('Template.RenderStarted');
      expect(eventTypes).toContain('Template.SectionRendered');
      expect(eventTypes).toContain('Template.PageRendered');
    });
  });
});