import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';
import { ThemeManifest } from './ThemeManifest';
import { ComponentRegistry, ThemeComponent } from './ComponentRegistry';
import { TenantSecurityException } from '../../commerce-engine/src/CommerceEngine';

export class ThemeRuntime {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;

  // Tenant-isolated registries and active themes
  private readonly activeThemes = new Map<string, ThemeManifest>();
  private readonly registries = new Map<string, ComponentRegistry>();

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;

    // Register all theme events
    const themeEvents = [
      'Theme.Loaded',
      'Theme.ComponentResolved',
      'Theme.RenderStarted',
      'Theme.RenderCompleted',
      'Theme.Failed',
    ];
    for (const evt of themeEvents) {
      EventRegistry.register(evt);
    }
  }

  /**
   * Loads and initializes a theme for a tenant
   */
  public async loadTheme(tenantId: string, manifest: ThemeManifest, correlationId?: string): Promise<void> {
    const cid = correlationId || `theme_load_${Date.now()}`;
    
    // Store active theme
    this.activeThemes.set(tenantId, manifest);

    // Initialize clean registry for this tenant
    const registry = new ComponentRegistry();
    this.registries.set(tenantId, registry);

    await this.eventBus.publish({
      eventId: `evt_thm_load_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Theme.Loaded',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { themeId: manifest.id },
    });
  }

  /**
   * Get active theme manifest for a tenant
   */
  public async getThemeManifest(tenantId: string): Promise<ThemeManifest> {
    const manifest = this.activeThemes.get(tenantId);
    if (!manifest) {
      throw new Error(`No active theme loaded for tenant: '${tenantId}'`);
    }
    return manifest;
  }

  /**
   * Register a theme component for a tenant
   */
  public registerComponent(tenantId: string, componentName: string, component: ThemeComponent): void {
    const registry = this.registries.get(tenantId);
    if (!registry) {
      throw new Error(`No active theme loaded for tenant '${tenantId}'. Load theme before registering components.`);
    }
    registry.register(componentName, component);
  }

  /**
   * Renders a component using the tenant's registry
   */
  public async renderComponent(
    tenantId: string,
    componentName: string,
    props: Record<string, any>,
    correlationId?: string
  ): Promise<string> {
    const cid = correlationId || `theme_rnd_${Date.now()}`;

    await this.eventBus.publish({
      eventId: `evt_thm_rnd_start_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Theme.RenderStarted',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { componentName },
    });

    try {
      const manifest = this.activeThemes.get(tenantId);
      if (!manifest) {
        throw new Error(`No theme loaded for tenant: '${tenantId}'`);
      }

      const registry = this.registries.get(tenantId);
      if (!registry) {
        throw new Error(`No component registry found for tenant: '${tenantId}'`);
      }

      const component = registry.resolve(componentName);

      await this.eventBus.publish({
        eventId: `evt_thm_comp_res_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Theme.ComponentResolved',
        timestamp: new Date().toISOString(),
        correlationId: cid,
        tenantId,
        payload: { componentName, type: component.type },
      });

      const html = component.render(props);

      await this.eventBus.publish({
        eventId: `evt_thm_rnd_comp_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Theme.RenderCompleted',
        timestamp: new Date().toISOString(),
        correlationId: cid,
        tenantId,
        payload: { componentName },
      });

      return html;
    } catch (err: any) {
      await this.eventBus.publish({
        eventId: `evt_thm_rnd_fail_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Theme.Failed',
        timestamp: new Date().toISOString(),
        correlationId: cid,
        tenantId,
        payload: { componentName, error: err.message },
      });
      throw err;
    }
  }
}
