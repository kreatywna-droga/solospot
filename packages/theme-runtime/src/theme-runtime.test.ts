import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import { ThemeRuntime } from './ThemeRuntime';
import { ThemeResolver, ThemeNotFoundException } from './ThemeResolver';
import { ComponentNotFoundException, ThemeComponent } from './ComponentRegistry';
import { ThemeManifest } from './ThemeManifest';
import { TenantSecurityException } from '../../commerce-engine/src/CommerceEngine';

describe('Theme Runtime Engine', () => {
  let runtime: ThemeRuntime;
  let resolver: ThemeResolver;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;

  const sampleManifest: ThemeManifest = {
    id: 'theme_modern',
    name: 'Modern Theme',
    version: '1.0.0',
    author: 'Designers Team',
    tokens: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      backgroundColor: '#F3F4F6',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '8px',
    },
    layouts: ['default', 'home'],
    components: {
      header: { name: 'HeaderComponent', type: 'atom' },
      productcard: { name: 'ProductCardComponent', type: 'widget' },
    },
  };

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();

    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);

    runtime = new ThemeRuntime({ eventBus, logger });
    resolver = new ThemeResolver();
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('Should load manifest, register components and render layout successfully', async () => {
    const tenantId = 'tenant-shop-xyz';
    const spyPublish = vi.spyOn(eventBus, 'publish');

    // 1. Load theme
    await runtime.loadTheme(tenantId, sampleManifest);
    const loadedManifest = await runtime.getThemeManifest(tenantId);
    expect(loadedManifest.id).toBe('theme_modern');

    expect(spyPublish).toHaveBeenCalled();
    expect(spyPublish.mock.calls[0][0].eventType).toBe('Theme.Loaded');

    // 2. Register mock header component
    const headerComponent: ThemeComponent = {
      name: 'HeaderComponent',
      type: 'atom',
      render: (props) => `<header><h1>${props.title}</h1></header>`,
    };
    runtime.registerComponent(tenantId, 'header', headerComponent);

    // 3. Render component
    const html = await runtime.renderComponent(tenantId, 'header', { title: 'Welcome to WEB FACTOR' });
    expect(html).toBe('<header><h1>Welcome to WEB FACTOR</h1></header>');

    // Verify events: RenderStarted -> ComponentResolved -> RenderCompleted
    const startCall = spyPublish.mock.calls.find((c) => c[0].eventType === 'Theme.RenderStarted');
    const resolvedCall = spyPublish.mock.calls.find((c) => c[0].eventType === 'Theme.ComponentResolved');
    const completedCall = spyPublish.mock.calls.find((c) => c[0].eventType === 'Theme.RenderCompleted');

    expect(startCall).toBeDefined();
    expect(resolvedCall).toBeDefined();
    expect(completedCall).toBeDefined();
  });

  it('Should throw ComponentNotFoundException and publish Theme.Failed if component does not exist', async () => {
    const tenantId = 'tenant-shop-xyz';
    await runtime.loadTheme(tenantId, sampleManifest);

    const spyPublish = vi.spyOn(eventBus, 'publish');

    await expect(
      runtime.renderComponent(tenantId, 'nonexistent_footer', {})
    ).rejects.toThrow(ComponentNotFoundException);

    const failedCall = spyPublish.mock.calls.find((c) => c[0].eventType === 'Theme.Failed');
    expect(failedCall).toBeDefined();
    expect(failedCall?.[0].payload.error).toContain('Theme component not found');
  });

  it('Should enforce tenant isolation at ThemeRuntime level', async () => {
    const tenantA = 'tenant-a';
    const tenantB = 'tenant-b';

    await runtime.loadTheme(tenantA, sampleManifest);

    // Tenant B attempts to render a component on Tenant A's theme -> fails because no theme is loaded for Tenant B
    await expect(
      runtime.renderComponent(tenantB, 'header', {})
    ).rejects.toThrow(/No theme loaded for tenant/);

    // Let's load the theme for Tenant B too, but register the header component only on Tenant A
    await runtime.loadTheme(tenantB, sampleManifest);
    runtime.registerComponent(tenantA, 'header', {
      name: 'HeaderComponent',
      type: 'atom',
      render: () => '<header>Tenant A</header>',
    });

    // Tenant B attempts to render 'header' component -> throws ComponentNotFoundException because registries are isolated
    await expect(
      runtime.renderComponent(tenantB, 'header', {})
    ).rejects.toThrow(ComponentNotFoundException);
  });

  it('Should resolve theme using ThemeResolver and enforce tenant isolation during resolution', async () => {
    const tenantA = 'tenant-a';
    const tenantB = 'tenant-b';

    // 1. Register global theme
    resolver.registerTheme(sampleManifest); // no tenant -> public
    const resolvedGlobal = await resolver.resolveTheme(tenantB, 'theme_modern');
    expect(resolvedGlobal.id).toBe('theme_modern');

    // 2. Register custom theme scoped to Tenant A
    const customManifest: ThemeManifest = {
      ...sampleManifest,
      id: 'theme_custom_a',
      name: 'Custom Theme A',
    };
    resolver.registerTheme(customManifest, tenantA);

    // Tenant A resolves its custom theme successfully
    const resolvedCustom = await resolver.resolveTheme(tenantA, 'theme_custom_a');
    expect(resolvedCustom.name).toBe('Custom Theme A');

    // Tenant B attempts to resolve Tenant A's custom theme -> throws TenantSecurityException
    await expect(
      resolver.resolveTheme(tenantB, 'theme_custom_a')
    ).rejects.toThrow(TenantSecurityException);

    // Resolving a non-existent theme throws ThemeNotFoundException
    await expect(
      resolver.resolveTheme(tenantA, 'theme_missing')
    ).rejects.toThrow(ThemeNotFoundException);
  });
});
