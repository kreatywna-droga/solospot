import { createHash } from 'crypto';
import { TenantContext } from '../../platform-core/src/tenant';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import { PackageResolver, PackageManifest } from './PackageResolver';
import { CapabilityResolver } from './CapabilityResolver';
import { ThemeResolver } from './ThemeResolver';
import { RuntimeSnapshot, RuntimeSnapshotSchema, deepFreeze } from './RuntimeSnapshot';

export interface TenantCompositionDetailsProvider {
  getPackagesForTenant(tenantId: string): Promise<string[]>;
  getThemeForTenant(tenantId: string): Promise<{ id: string; settings?: Record<string, any> }>;
  getConfigurationForTenant(tenantId: string): Promise<Record<string, any>>;
}

export class RuntimeCompositionEngine {
  private readonly packageResolver: PackageResolver;
  private readonly capabilityResolver: CapabilityResolver;
  private readonly themeResolver: ThemeResolver;
  private readonly detailsProvider: TenantCompositionDetailsProvider;
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;
  private readonly schemaVersion = '1.0.0';

  constructor(options: {
    packageResolver: PackageResolver;
    capabilityResolver: CapabilityResolver;
    themeResolver: ThemeResolver;
    detailsProvider: TenantCompositionDetailsProvider;
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
  }) {
    this.packageResolver = options.packageResolver;
    this.capabilityResolver = options.capabilityResolver;
    this.themeResolver = options.themeResolver;
    this.detailsProvider = options.detailsProvider;
    this.eventBus = options.eventBus;
    this.logger = options.logger;

    // Register custom composition events dynamically
    const compositionEvents = [
      'RuntimeComposition.Started',
      'Package.Resolved',
      'Capability.Enabled',
      'Theme.Loaded',
      'RuntimeSnapshot.Created',
      'RuntimeComposition.Completed',
    ];
    for (const evt of compositionEvents) {
      EventRegistry.register(evt);
    }
  }

  /**
   * Orchestrates the dynamic composition process and returns a validated, frozen RuntimeSnapshot.
   */
  public async compose(
    tenantContext: TenantContext,
    correlationId?: string
  ): Promise<RuntimeSnapshot> {
    const cid = correlationId || `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tenantId = tenantContext.tenantId;

    this.logger.info({
      message: `Starting runtime composition for tenant: ${tenantId}`,
      correlationId: cid,
      tenantId,
    });

    // Event 1: RuntimeComposition.Started
    await this.eventBus.publish({
      eventId: `evt_comp_start_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'RuntimeComposition.Started',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { tenantId },
    });

    // Step 1: Package Resolution
    const requestedPackages = await this.detailsProvider.getPackagesForTenant(tenantId);
    const resolvedPackages = this.packageResolver.resolve(requestedPackages);

    for (const pkg of resolvedPackages) {
      await this.eventBus.publish({
        eventId: `evt_pkg_resolved_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Package.Resolved',
        timestamp: new Date().toISOString(),
        correlationId: cid,
        tenantId,
        payload: { packageId: pkg.id, version: pkg.version },
      });
    }

    // Step 2: Capability Resolution
    const { capabilities, mapping } = this.capabilityResolver.resolve(resolvedPackages);

    for (const cap of capabilities) {
      await this.eventBus.publish({
        eventId: `evt_cap_enabled_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Capability.Enabled',
        timestamp: new Date().toISOString(),
        correlationId: cid,
        tenantId,
        payload: { capabilityName: cap },
      });
    }

    // Step 3: Theme Resolution
    const tenantTheme = await this.detailsProvider.getThemeForTenant(tenantId);
    const resolvedTheme = this.themeResolver.resolve(tenantTheme.id, tenantTheme.settings);

    await this.eventBus.publish({
      eventId: `evt_theme_loaded_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Theme.Loaded',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { themeId: resolvedTheme.id, version: resolvedTheme.version },
    });

    // Step 4: Configuration Merge
    // Precedence: 1. Global config defaults, 2. Package defaults, 3. Tenant configurations
    const globalConfig = ConfigurationManager.getInstance().get();
    const packageConfigs: Record<string, any> = {};
    for (const pkg of resolvedPackages) {
      if (pkg.configurationDefaults) {
        packageConfigs[pkg.id] = pkg.configurationDefaults;
      }
    }

    const tenantConfig = await this.detailsProvider.getConfigurationForTenant(tenantId);
    const configuration = {
      global: {
        limits: globalConfig.limits,
        features: globalConfig.features,
      },
      packages: packageConfigs,
      tenant: tenantConfig,
    };

    // Step 5: Hash & Snapshot creation
    const composedAt = new Date().toISOString();
    const packageInfos = resolvedPackages.map((p) => ({
      id: p.id,
      version: p.version,
      priority: p.priority,
    }));

    const runtimeHash = this.calculateHash({
      tenantId,
      engineVersion: globalConfig.version,
      packages: packageInfos,
      capabilities,
      theme: resolvedTheme,
      configuration,
    });

    const rawSnapshot: RuntimeSnapshot = {
      tenantId,
      engineVersion: globalConfig.version,
      schemaVersion: this.schemaVersion,
      packages: packageInfos,
      capabilities,
      theme: resolvedTheme,
      configuration,
      runtimeHash,
      composedAt,
    };

    // Step 6: Validate & Freeze
    const parsed = RuntimeSnapshotSchema.safeParse(rawSnapshot);
    if (!parsed.success) {
      const errMsg = `RuntimeSnapshot schema validation failed: ${JSON.stringify(parsed.error.format())}`;
      this.logger.error({
        message: errMsg,
        correlationId: cid,
        tenantId,
      });
      throw new Error(errMsg);
    }

    const snapshot = deepFreeze(parsed.data as RuntimeSnapshot);

    await this.eventBus.publish({
      eventId: `evt_snapshot_created_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'RuntimeSnapshot.Created',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { runtimeHash },
    });

    // Event 6: RuntimeComposition.Completed
    await this.eventBus.publish({
      eventId: `evt_comp_done_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'RuntimeComposition.Completed',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { tenantId, runtimeHash },
    });

    this.logger.info({
      message: `Completed runtime composition for tenant: ${tenantId}. Hash: ${runtimeHash}`,
      correlationId: cid,
      tenantId,
    });

    return snapshot;
  }

  /**
   * Deterministically calculates SHA-256 for snapshot.
   */
  private calculateHash(data: {
    tenantId: string;
    engineVersion: string;
    packages: { id: string; version: string; priority: number }[];
    capabilities: string[];
    theme: { id: string; version: string; settings: Record<string, any> };
    configuration: Record<string, any>;
  }): string {
    const sortedPackages = [...data.packages].sort((a, b) => a.id.localeCompare(b.id));
    const sortedCapabilities = [...data.capabilities].sort();

    const sortObjectKeys = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
      }
      return Object.keys(obj)
        .sort()
        .reduce((acc: any, key) => {
          acc[key] = sortObjectKeys(obj[key]);
          return acc;
        }, {});
    };

    const payload = {
      tenantId: data.tenantId,
      engineVersion: data.engineVersion,
      packages: sortedPackages,
      capabilities: sortedCapabilities,
      theme: {
        id: data.theme.id,
        version: data.theme.version,
        settings: sortObjectKeys(data.theme.settings),
      },
      configuration: sortObjectKeys(data.configuration),
    };

    const jsonString = JSON.stringify(payload);
    return createHash('sha256').update(jsonString).digest('hex');
  }
}
