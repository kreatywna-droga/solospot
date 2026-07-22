// ThemeProvider.ts
// Implements TenantCompositionDetailsProvider for theme management
// This is the bridge between tenant data and the theme runtime system

import { TenantCompositionDetailsProvider } from '../../runtime-composition/src/RuntimeCompositionEngine';
import { ThemeResolver } from '../../theme-runtime/src/ThemeResolver';
import { ThemeManifest } from '../../theme-runtime/src/ThemeManifest';

/**
 * Default theme configuration for tenants without custom themes
 */
const DEFAULT_THEME: ThemeManifest = {
  id: 'default',
  name: 'WEB FACTOR Default',
  version: '1.0.0',
  author: 'WEB FACTOR',
  tokens: {
    primaryColor: '#8b5cf6',
    secondaryColor: '#d946ef',
    backgroundColor: '#050508',
    fontFamily: 'Inter',
    borderRadius: '4px',
  },
  layouts: ['default'],
  components: {
    header: { name: 'Header', type: 'layout' },
    footer: { name: 'Footer', type: 'layout' },
    main: { name: 'MainContent', type: 'layout' },
  },
};

/**
 * Theme configuration per tenant (in production, this would come from database)
 * For now, we maintain an in-memory registry that can be extended
 */
const TENANT_THEME_REGISTRY: Map<string, { id: string; settings?: Record<string, any> }> = new Map();

/**
 * ThemeProvider implements TenantCompositionDetailsProvider
 * It provides theme data for runtime composition based on tenant configuration
 */
export class ThemeProvider implements TenantCompositionDetailsProvider {
  private readonly themeResolver: ThemeResolver;
  private readonly packageRegistry: Map<string, string[]>;
  private readonly configRegistry: Map<string, Record<string, any>>;

  constructor(themeResolver: ThemeResolver) {
    this.themeResolver = themeResolver;
    this.packageRegistry = new Map();
    this.configRegistry = new Map();

    // Register default theme
    this.themeResolver.registerTheme(DEFAULT_THEME);
  }

  /**
   * Get packages configured for a tenant
   * In production, this would query the database
   */
  async getPackagesForTenant(tenantId: string): Promise<string[]> {
    // Default packages for all tenants
    const defaultPackages = ['commerce', 'theme'];
    
    // Check for tenant-specific packages
    const tenantPackages = this.packageRegistry.get(tenantId);
    if (tenantPackages) {
      return [...defaultPackages, ...tenantPackages];
    }
    
    return defaultPackages;
  }

  /**
   * Get theme configuration for a tenant
   * This is the core method that enables theme runtime engine
   */
  async getThemeForTenant(tenantId: string): Promise<{ id: string; settings?: Record<string, any> }> {
    // Check if tenant has a custom theme configured
    const tenantTheme = TENANT_THEME_REGISTRY.get(tenantId);
    if (tenantTheme) {
      return tenantTheme;
    }

    // Return default theme for tenants without custom configuration
    return {
      id: DEFAULT_THEME.id,
      settings: {
        primaryColor: DEFAULT_THEME.tokens.primaryColor,
        secondaryColor: DEFAULT_THEME.tokens.secondaryColor,
      },
    };
  }

  /**
   * Get configuration for a tenant
   * Merges global defaults with tenant-specific overrides
   */
  async getConfigurationForTenant(tenantId: string): Promise<Record<string, any>> {
    const tenantConfig = this.configRegistry.get(tenantId) || {};
    
    return {
      siteName: `${tenantId}-store`,
      locale: 'pl_PL',
      currency: 'PLN',
      ...tenantConfig,
    };
  }

  /**
   * Register a custom theme for a tenant
   * This enables tenant-specific theme customization
   */
  public registerTenantTheme(tenantId: string, themeId: string, settings?: Record<string, any>): void {
    TENANT_THEME_REGISTRY.set(tenantId, { id: themeId, settings });
  }

  /**
   * Register additional packages for a tenant
   */
  public registerTenantPackages(tenantId: string, packages: string[]): void {
    const existing = this.packageRegistry.get(tenantId) || [];
    this.packageRegistry.set(tenantId, [...existing, ...packages]);
  }

  /**
   * Register custom configuration for a tenant
   */
  public registerTenantConfig(tenantId: string, config: Record<string, any>): void {
    const existing = this.configRegistry.get(tenantId) || {};
    this.configRegistry.set(tenantId, { ...existing, ...config });
  }

  /**
   * Clear all tenant-specific configurations
   * Useful for testing
   */
  public clearAll(): void {
    TENANT_THEME_REGISTRY.clear();
    this.packageRegistry.clear();
    this.configRegistry.clear();
  }
}

/**
 * Singleton instance for the application
 * Prevents multiple initializations
 */
let themeProviderInstance: ThemeProvider | null = null;

/**
 * Get or create the ThemeProvider singleton
 */
export function getThemeProvider(themeResolver: ThemeResolver): ThemeProvider {
  if (!themeProviderInstance) {
    themeProviderInstance = new ThemeProvider(themeResolver);
  }
  return themeProviderInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetThemeProvider(): void {
  themeProviderInstance = null;
}