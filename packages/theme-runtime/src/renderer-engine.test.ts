import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import { ThemeRuntime } from './ThemeRuntime';
import { RendererEngine, StorefrontRenderContext } from './RendererEngine';
import { ThemeManifest } from './ThemeManifest';

describe('Renderer Engine', () => {
  let runtime: ThemeRuntime;
  let renderer: RendererEngine;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;

  const sampleTheme: ThemeManifest = {
    id: 'theme_classic',
    name: 'Classic Theme',
    version: '2.0.0',
    author: 'Designers Inc',
    tokens: {
      primaryColor: '#EF4444', // Red
      secondaryColor: '#F59E0B', // Orange
      backgroundColor: '#FFFFFF',
      fontFamily: 'Roboto, sans-serif',
      borderRadius: '4px',
    },
    layouts: ['default'],
    components: {
      header: { name: 'Header', type: 'atom' },
      footer: { name: 'Footer', type: 'atom' },
      buggy: { name: 'Buggy', type: 'widget' },
    },
  };

  const sampleContext: StorefrontRenderContext = {
    tenantId: 'tenant-test-shop',
    shopName: 'My Sweet Shop',
    locale: 'pl_PL',
    currency: 'PLN',
    themeId: 'theme_classic',
    tokens: sampleTheme.tokens,
    page: {
      title: 'Awesome Home Page',
      type: 'home',
      data: {},
    },
  };

  const sampleTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>{{page_title}} - {{shopName}}</title>
  <!-- tokens_styles -->
</head>
<body>
  <!-- slot:header -->
  <main>Welcome to the main content.</main>
  <!-- slot:footer -->
</body>
</html>
  `.trim();

  beforeEach(async () => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();

    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);

    runtime = new ThemeRuntime({ eventBus, logger });
    renderer = new RendererEngine({ themeRuntime: runtime });

    // Load active theme
    await runtime.loadTheme(sampleContext.tenantId, sampleTheme);
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('Should replace page variables and slot components in happy path', async () => {
    // Register components
    runtime.registerComponent(sampleContext.tenantId, 'header', {
      name: 'Header',
      type: 'atom',
      render: (props) => `<header><h1>${props.message}</h1></header>`,
    });

    runtime.registerComponent(sampleContext.tenantId, 'footer', {
      name: 'Footer',
      type: 'atom',
      render: () => `<footer>All rights reserved.</footer>`,
    });

    const slots = {
      header: { componentName: 'header', props: { message: 'Sweet Shop' } },
      footer: { componentName: 'footer', props: {} },
    };

    const output = await renderer.renderPage(sampleContext, sampleTemplate, slots);

    // Verify variable substitutions
    expect(output).toContain('<title>Awesome Home Page - My Sweet Shop</title>');
    expect(output).toContain('<style id="theme-tokens">');
    expect(output).toContain('--primary-color: #EF4444');

    // Verify component slot replacements
    expect(output).toContain('<header><h1>Sweet Shop</h1></header>');
    expect(output).toContain('<footer>All rights reserved.</footer>');
  });

  it('Should handle Widget Error Boundary when a component fails to render without crashing the entire page', async () => {
    runtime.registerComponent(sampleContext.tenantId, 'buggy', {
      name: 'Buggy',
      type: 'widget',
      render: () => {
        throw new Error('Database connection failed inside component render');
      },
    });

    runtime.registerComponent(sampleContext.tenantId, 'footer', {
      name: 'Footer',
      type: 'atom',
      render: () => `<footer>All rights reserved.</footer>`,
    });

    const slots = {
      header: { componentName: 'buggy', props: {} }, // Will fail
      footer: { componentName: 'footer', props: {} },
    };

    const output = await renderer.renderPage(sampleContext, sampleTemplate, slots);

    // Page still renders
    expect(output).toContain('<title>Awesome Home Page - My Sweet Shop</title>');
    expect(output).toContain('<footer>All rights reserved.</footer>');

    // Buggy slot contains error wrapper
    expect(output).toContain('class="widget-error"');
    expect(output).toContain('Widget Render Error: Database connection failed inside component render');
  });

  it('Should handle empty slots by replacing them with empty HTML comments', async () => {
    const output = await renderer.renderPage(sampleContext, sampleTemplate, {});
    expect(output).toContain('<!-- slot:header empty -->');
    expect(output).toContain('<!-- slot:footer empty -->');
  });

  it('Should fail validation if context has invalid schema', async () => {
    const invalidContext = {
      ...sampleContext,
      tenantId: '', // invalid
    };

    await expect(
      renderer.renderPage(invalidContext as any, sampleTemplate, {})
    ).rejects.toThrow();
  });
});
