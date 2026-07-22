// ThemeProvider.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, getThemeProvider, resetThemeProvider } from './ThemeProvider';
import { ThemeResolver } from './ThemeResolver';
import { TenantSecurityException } from '../../commerce-engine/src/CommerceEngine';

describe('ThemeProvider', () => {
  let themeResolver: ThemeResolver;
  let provider: ThemeProvider;

  beforeEach(() => {
    themeResolver = new ThemeResolver();
    provider = new ThemeProvider(themeResolver);
  });

  describe('getThemeForTenant', () => {
    it('should return default theme for tenant without custom theme', async () => {
      const theme = await provider.getThemeForTenant('new-tenant');
      
      expect(theme.id).toBe('default');
      expect(theme.settings).toBeDefined();
      expect(theme.settings!.primaryColor).toBe('#8b5cf6');
    });

    it('should return custom theme for tenant with registered theme', async () => {
      provider.registerTenantTheme('custom-tenant', 'ocean-theme', {
        primaryColor: '#0066ff',
      });

      const theme = await provider.getThemeForTenant('custom-tenant');
      
      expect(theme.id).toBe('ocean-theme');
      expect(theme.settings!.primaryColor).toBe('#0066ff');
    });

    it('should maintain tenant isolation for themes', async () => {
      provider.registerTenantTheme('tenant-a', 'theme-a');
      provider.registerTenantTheme('tenant-b', 'theme-b');

      const themeA = await provider.getThemeForTenant('tenant-a');
      const themeB = await provider.getThemeForTenant('tenant-b');

      expect(themeA.id).toBe('theme-a');
      expect(themeB.id).toBe('theme-b');
    });
  });

  describe('getPackagesForTenant', () => {
    it('should return default packages for all tenants', async () => {
      const packages = await provider.getPackagesForTenant('any-tenant');
      
      expect(packages).toContain('commerce');
      expect(packages).toContain('theme');
    });

    it('should include tenant-specific packages', async () => {
      provider.registerTenantPackages('premium-tenant', ['analytics', 'seo']);
      
      const packages = await provider.getPackagesForTenant('premium-tenant');
      
      expect(packages).toContain('commerce');
      expect(packages).toContain('theme');
      expect(packages).toContain('analytics');
      expect(packages).toContain('seo');
    });
  });

  describe('getConfigurationForTenant', () => {
    it('should return default configuration', async () => {
      const config = await provider.getConfigurationForTenant('test-tenant');
      
      expect(config.siteName).toBe('test-tenant-store');
      expect(config.locale).toBe('pl_PL');
      expect(config.currency).toBe('PLN');
    });

    it('should merge custom configuration', async () => {
      provider.registerTenantConfig('custom-config-tenant', {
        siteName: 'My Custom Store',
        customSetting: 'value',
      });

      const config = await provider.getConfigurationForTenant('custom-config-tenant');
      
      expect(config.siteName).toBe('My Custom Store');
      expect(config.locale).toBe('pl_PL'); // default preserved
      expect(config.customSetting).toBe('value');
    });
  });

  describe('clearAll', () => {
    it('should clear all tenant-specific configurations', async () => {
      provider.registerTenantTheme('temp-tenant', 'temp-theme');
      provider.clearAll();

      const theme = await provider.getThemeForTenant('temp-tenant');
      expect(theme.id).toBe('default'); // Falls back to default
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance from getThemeProvider', () => {
      const instance1 = getThemeProvider(themeResolver);
      const instance2 = getThemeProvider(themeResolver);
      
      expect(instance1).toBe(instance2);
      
      resetThemeProvider();
    });
  });
});

describe('ThemeProvider with ThemeResolver integration', () => {
  it('should work with ThemeResolver for theme resolution', async () => {
    const themeResolver = new ThemeResolver();
    const provider = new ThemeProvider(themeResolver);

    // Register a custom theme
    const customTheme = {
      id: 'custom-theme',
      name: 'Custom Theme',
      version: '1.0.0',
      author: 'Test Author',
      tokens: {
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial',
        borderRadius: '8px',
      },
      layouts: ['custom-layout'],
      components: {
        header: { name: 'CustomHeader', type: 'layout' as const },
      },
    };

    themeResolver.registerTheme(customTheme, 'tenant-123');
    provider.registerTenantTheme('tenant-123', 'custom-theme');

    // Resolve theme through provider
    const themeConfig = await provider.getThemeForTenant('tenant-123');
    const resolvedTheme = await themeResolver.resolveTheme('tenant-123', themeConfig.id);

    expect(resolvedTheme.id).toBe('custom-theme');
    expect(resolvedTheme.tokens.primaryColor).toBe('#ff0000');
  });

  it('should enforce tenant isolation through ThemeResolver', async () => {
    const themeResolver = new ThemeResolver();
    const provider = new ThemeProvider(themeResolver);

    // Register tenant-specific theme
    const tenantTheme = {
      id: 'tenant-only-theme',
      name: 'Tenant Theme',
      version: '1.0.0',
      author: 'Tenant Author',
      tokens: {
        primaryColor: '#123456',
        secondaryColor: '#654321',
        backgroundColor: '#f0f0f0',
        fontFamily: 'Roboto',
        borderRadius: '2px',
      },
      layouts: ['tenant-layout'],
      components: {},
    };

    themeResolver.registerTheme(tenantTheme, 'owner-tenant');
    provider.registerTenantTheme('owner-tenant', 'tenant-only-theme');

    // Should work for owner tenant
    const themeConfig = await provider.getThemeForTenant('owner-tenant');
    const resolved = await themeResolver.resolveTheme('owner-tenant', themeConfig.id);
    expect(resolved.id).toBe('tenant-only-theme');

    // Should fail for different tenant
    await expect(
      themeResolver.resolveTheme('other-tenant', 'tenant-only-theme')
    ).rejects.toThrow(TenantSecurityException);
  });
});