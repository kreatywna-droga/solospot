/**
 * TenantConfigurationIsolation — G1-206
 *
 * Ensures tenant-scoped configurations are fully isolated between tenants.
 * Detects cross-tenant configuration leakage and validates isolation boundaries.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TenantConfig {
  readonly tenantId: string;
  readonly configKey: string;
  readonly configValue: string;
  readonly scope: 'TENANT' | 'GLOBAL';
  readonly updatedAtMs: number;
}

export interface ConfigLeakageRecord {
  readonly leakingConfig: TenantConfig;
  readonly accessedByTenant: string;
  readonly reason: string;
}

export interface ConfigIsolationReport {
  readonly generatedAtMs: number;
  readonly totalConfigs: number;
  readonly tenantScopedCount: number;
  readonly globalScopedCount: number;
  readonly leakageDetected: ConfigLeakageRecord[];
  readonly isolationValid: boolean;
  readonly violations: string[];
}

// ---------------------------------------------------------------------------
// TenantConfigurationIsolator
// ---------------------------------------------------------------------------

export class TenantConfigurationIsolator {
  private configs: TenantConfig[] = [];

  setConfig(tenantId: string, key: string, value: string, scope: 'TENANT' | 'GLOBAL' = 'TENANT'): TenantConfig {
    if (!tenantId || !tenantId.trim()) {
      throw new Error('tenantId must be a non-empty string');
    }
    if (!key || !key.trim()) {
      throw new Error('configKey must be a non-empty string');
    }

    const now = Date.now();
    const existing = this.configs.find(
      (c) => c.tenantId === tenantId && c.configKey === key && c.scope === scope,
    );

    if (existing) {
      this.configs = this.configs.filter(
        (c) => !(c.tenantId === tenantId && c.configKey === key && c.scope === scope),
      );
    }

    const config: TenantConfig = {
      tenantId: tenantId.trim(),
      configKey: key.trim(),
      configValue: value,
      scope,
      updatedAtMs: now,
    };

    this.configs.push(config);
    return config;
  }

  getConfig(tenantId: string, key: string): TenantConfig | undefined {
    if (!tenantId || !key) return undefined;

    const globalConfig = this.configs.find(
      (c) => c.configKey === key && c.scope === 'GLOBAL',
    );
    const tenantConfig = this.configs.find(
      (c) => c.tenantId === tenantId && c.configKey === key && c.scope === 'TENANT',
    );

    return tenantConfig ?? globalConfig;
  }

  getAllConfigs(tenantId: string): TenantConfig[] {
    if (!tenantId) return [];

    return this.configs.filter(
      (c) => c.tenantId === tenantId || c.scope === 'GLOBAL',
    );
  }

  detectCrossTenantConfigLeakage(configs?: TenantConfig[]): ConfigLeakageRecord[] {
    const target = configs ?? this.configs;
    const leakage: ConfigLeakageRecord[] = [];

    const tenantConfigs = target.filter((c) => c.scope === 'TENANT');
    const globalConfigs = target.filter((c) => c.scope === 'GLOBAL');

    for (const tenantConfig of tenantConfigs) {
      for (const other of tenantConfigs) {
        if (
          tenantConfig.tenantId !== other.tenantId &&
          tenantConfig.configKey === other.configKey &&
          tenantConfig.configValue === other.configValue
        ) {
          leakage.push({
            leakingConfig: other,
            accessedByTenant: tenantConfig.tenantId,
            reason: `Config key "${other.configKey}" has identical values across tenants ${tenantConfig.tenantId} and ${other.tenantId} — possible data leakage`,
          });
        }
      }
    }

    for (const g of globalConfigs) {
      const tenantsWithKey = tenantConfigs.filter(
        (tc) => tc.configKey === g.configKey && tc.tenantId !== g.tenantId,
      );
      for (const tc of tenantsWithKey) {
        leakage.push({
          leakingConfig: tc,
          accessedByTenant: tc.tenantId,
          reason: `Global config "${g.configKey}" coexists with tenant-scoped config for tenant ${tc.tenantId}`,
        });
      }
    }

    return leakage;
  }

  validateConfigIsolation(tenantA: string, tenantB: string): boolean {
    if (tenantA === tenantB) return true;

    const configsA = this.configs.filter((c) => c.tenantId === tenantA && c.scope === 'TENANT');
    const configsB = this.configs.filter((c) => c.tenantId === tenantB && c.scope === 'TENANT');

    const keysA = new Set(configsA.map((c) => c.configKey));
    const keysB = new Set(configsB.map((c) => c.configKey));

    for (const key of keysA) {
      if (keysB.has(key)) {
        const valA = configsA.find((c) => c.configKey === key)?.configValue;
        const valB = configsB.find((c) => c.configKey === key)?.configValue;
        if (valA === valB) {
          return false;
        }
      }
    }

    return true;
  }

  generateConfigIsolationReport(): ConfigIsolationReport {
    const leakage = this.detectCrossTenantConfigLeakage();
    const tenantScoped = this.configs.filter((c) => c.scope === 'TENANT');
    const globalScoped = this.configs.filter((c) => c.scope === 'GLOBAL');

    const violations: string[] = [];
    for (const l of leakage) {
      violations.push(l.reason);
    }

    return {
      generatedAtMs: Date.now(),
      totalConfigs: this.configs.length,
      tenantScopedCount: tenantScoped.length,
      globalScopedCount: globalScoped.length,
      leakageDetected: leakage,
      isolationValid: leakage.length === 0,
      violations,
    };
  }

  getAllConfigsRaw(): TenantConfig[] {
    return [...this.configs];
  }

  clear(): void {
    this.configs = [];
  }
}
