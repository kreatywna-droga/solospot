import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTenantTheme, getTenantThemeById } from '@/lib/tenant/TenantTheme';

describe('Tenant Isolation', () => {
  it('getTenantTheme returns correct theme for fashion-demo', () => {
    const theme = getTenantTheme('fashion-demo');
    expect(theme).toBeDefined();
    expect(theme.slug).toBe('fashion-demo');
    expect(theme.name).toBe('Fashion Demo Store');
    expect(theme.colors.primary).toBe('#7c3aed');
  });

  it('getTenantThemeById returns correct theme for demo-fashion tenantId', () => {
    const theme = getTenantThemeById('demo-fashion');
    expect(theme).toBeDefined();
    expect(theme.tenantId).toBe('demo-fashion');
    expect(theme.name).toBe('Fashion Demo Store');
  });

  it('getTenantThemeById returns correct theme for demo-beauty tenantId', () => {
    const theme = getTenantThemeById('demo-beauty');
    expect(theme).toBeDefined();
    expect(theme.tenantId).toBe('demo-beauty');
    expect(theme.name).toBe('Beauty Demo Store');
  });

  it('Unknown tenant slug returns default theme', () => {
    const theme = getTenantTheme('unknown-tenant');
    expect(theme.slug).toBe('default');
    expect(theme.name).toBe('SoloSpot');
  });

  it('Undefined tenant slug returns default theme', () => {
    const theme = getTenantTheme(undefined);
    expect(theme.slug).toBe('default');
    expect(theme.name).toBe('SoloSpot');
  });

  it('Undefined tenantId returns default theme', () => {
    const theme = getTenantThemeById(undefined);
    expect(theme.slug).toBe('default');
    expect(theme.name).toBe('SoloSpot');
  });
});
