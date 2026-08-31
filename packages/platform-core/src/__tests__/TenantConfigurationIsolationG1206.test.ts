/**
 * TenantConfigurationIsolationG1206.test.ts — G1-206 Tenant Configuration Isolation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TenantConfigurationIsolator,
  TenantConfig,
} from '../TenantConfigurationIsolation';

describe('TenantConfigurationIsolator', () => {
  let isolator: TenantConfigurationIsolator;

  beforeEach(() => {
    isolator = new TenantConfigurationIsolator();
  });

  // ── setConfig ──

  describe('setConfig()', () => {
    it('sets a tenant-scoped config', () => {
      const cfg = isolator.setConfig('t1', 'theme', 'dark');
      expect(cfg.tenantId).toBe('t1');
      expect(cfg.configKey).toBe('theme');
      expect(cfg.configValue).toBe('dark');
      expect(cfg.scope).toBe('TENANT');
    });

    it('overwrites existing config with same key and scope', () => {
      isolator.setConfig('t1', 'theme', 'dark');
      isolator.setConfig('t1', 'theme', 'light');
      const all = isolator.getAllConfigs('t1');
      const themeConfigs = all.filter((c) => c.configKey === 'theme');
      expect(themeConfigs).toHaveLength(1);
      expect(themeConfigs[0].configValue).toBe('light');
    });

    it('throws on empty tenantId', () => {
      expect(() => isolator.setConfig('', 'k', 'v')).toThrow('tenantId must be a non-empty string');
    });

    it('throws on empty configKey', () => {
      expect(() => isolator.setConfig('t1', '', 'v')).toThrow('configKey must be a non-empty string');
    });

    it('trims whitespace from tenantId and key', () => {
      const cfg = isolator.setConfig('  t1  ', '  theme  ', 'dark');
      expect(cfg.tenantId).toBe('t1');
      expect(cfg.configKey).toBe('theme');
    });

    it('sets updatedAtMs to current time', () => {
      const before = Date.now();
      const cfg = isolator.setConfig('t1', 'k', 'v');
      const after = Date.now();
      expect(cfg.updatedAtMs).toBeGreaterThanOrEqual(before);
      expect(cfg.updatedAtMs).toBeLessThanOrEqual(after);
    });

    it('allows setting global-scoped config', () => {
      const cfg = isolator.setConfig('global', 'maxUploads', '10', 'GLOBAL');
      expect(cfg.scope).toBe('GLOBAL');
    });
  });

  // ── getConfig ──

  describe('getConfig()', () => {
    it('returns tenant-scoped config', () => {
      isolator.setConfig('t1', 'theme', 'dark');
      const cfg = isolator.getConfig('t1', 'theme');
      expect(cfg).toBeDefined();
      expect(cfg!.configValue).toBe('dark');
    });

    it('falls back to global config when tenant config missing', () => {
      isolator.setConfig('global', 'maxUploads', '10', 'GLOBAL');
      const cfg = isolator.getConfig('t1', 'maxUploads');
      expect(cfg).toBeDefined();
      expect(cfg!.configValue).toBe('10');
      expect(cfg!.scope).toBe('GLOBAL');
    });

    it('prefers tenant config over global config', () => {
      isolator.setConfig('global', 'theme', 'dark', 'GLOBAL');
      isolator.setConfig('t1', 'theme', 'light');
      const cfg = isolator.getConfig('t1', 'theme');
      expect(cfg!.configValue).toBe('light');
    });

    it('returns undefined for missing config', () => {
      const cfg = isolator.getConfig('t1', 'nonexistent');
      expect(cfg).toBeUndefined();
    });

    it('returns undefined for empty tenantId', () => {
      isolator.setConfig('t1', 'k', 'v');
      expect(isolator.getConfig('', 'k')).toBeUndefined();
    });

    it('returns undefined for empty key', () => {
      isolator.setConfig('t1', 'k', 'v');
      expect(isolator.getConfig('t1', '')).toBeUndefined();
    });

    it('does not leak tenant config to another tenant', () => {
      isolator.setConfig('t1', 'secret', 'abc');
      const cfg = isolator.getConfig('t2', 'secret');
      expect(cfg).toBeUndefined();
    });
  });

  // ── getAllConfigs ──

  describe('getAllConfigs()', () => {
    it('returns all configs for a tenant plus global configs', () => {
      isolator.setConfig('t1', 'theme', 'dark');
      isolator.setConfig('t1', 'lang', 'en');
      isolator.setConfig('global', 'version', '1.0', 'GLOBAL');

      const configs = isolator.getAllConfigs('t1');
      expect(configs).toHaveLength(3);
    });

    it('returns only global configs when tenant has none', () => {
      isolator.setConfig('global', 'version', '1.0', 'GLOBAL');
      const configs = isolator.getAllConfigs('unknown');
      expect(configs).toHaveLength(1);
      expect(configs[0].scope).toBe('GLOBAL');
    });

    it('returns empty array for unknown tenant with no global configs', () => {
      const configs = isolator.getAllConfigs('unknown');
      expect(configs).toHaveLength(0);
    });

    it('returns empty array for empty tenantId', () => {
      isolator.setConfig('t1', 'k', 'v');
      expect(isolator.getAllConfigs('')).toHaveLength(0);
    });

    it('does not include another tenant configs', () => {
      isolator.setConfig('t1', 'theme', 'dark');
      isolator.setConfig('t2', 'theme', 'light');
      const configs = isolator.getAllConfigs('t1');
      expect(configs.every((c) => c.tenantId === 't1' || c.scope === 'GLOBAL')).toBe(true);
    });
  });

  // ── detectCrossTenantConfigLeakage ──

  describe('detectCrossTenantConfigLeakage()', () => {
    it('returns empty array when no leakage', () => {
      isolator.setConfig('t1', 'theme', 'dark');
      isolator.setConfig('t2', 'theme', 'light');
      const leakage = isolator.detectCrossTenantConfigLeakage();
      expect(leakage).toHaveLength(0);
    });

    it('detects leakage when same key same value across tenants', () => {
      const configs: TenantConfig[] = [
        { tenantId: 't1', configKey: 'apiUrl', configValue: 'http://shared', scope: 'TENANT', updatedAtMs: 0 },
        { tenantId: 't2', configKey: 'apiUrl', configValue: 'http://shared', scope: 'TENANT', updatedAtMs: 0 },
      ];
      const leakage = isolator.detectCrossTenantConfigLeakage(configs);
      expect(leakage.length).toBeGreaterThan(0);
    });

    it('detects global coexisting with tenant-scoped', () => {
      const configs: TenantConfig[] = [
        { tenantId: 'global', configKey: 'limit', configValue: '10', scope: 'GLOBAL', updatedAtMs: 0 },
        { tenantId: 't1', configKey: 'limit', configValue: '5', scope: 'TENANT', updatedAtMs: 0 },
      ];
      const leakage = isolator.detectCrossTenantConfigLeakage(configs);
      expect(leakage.length).toBeGreaterThan(0);
    });

    it('returns empty for isolated configs', () => {
      const configs: TenantConfig[] = [
        { tenantId: 't1', configKey: 'a', configValue: '1', scope: 'TENANT', updatedAtMs: 0 },
        { tenantId: 't2', configKey: 'b', configValue: '2', scope: 'TENANT', updatedAtMs: 0 },
      ];
      const leakage = isolator.detectCrossTenantConfigLeakage(configs);
      expect(leakage).toHaveLength(0);
    });

    it('handles empty input array', () => {
      const leakage = isolator.detectCrossTenantConfigLeakage([]);
      expect(leakage).toHaveLength(0);
    });

    it('uses internal configs when no argument passed', () => {
      isolator.setConfig('t1', 'apiUrl', 'http://shared');
      isolator.setConfig('t2', 'apiUrl', 'http://shared');
      const leakage = isolator.detectCrossTenantConfigLeakage();
      expect(leakage.length).toBeGreaterThan(0);
    });

    it('includes reason in leakage record', () => {
      const configs: TenantConfig[] = [
        { tenantId: 't1', configKey: 'apiUrl', configValue: 'http://shared', scope: 'TENANT', updatedAtMs: 0 },
        { tenantId: 't2', configKey: 'apiUrl', configValue: 'http://shared', scope: 'TENANT', updatedAtMs: 0 },
      ];
      const leakage = isolator.detectCrossTenantConfigLeakage(configs);
      expect(leakage[0].reason).toContain('apiUrl');
    });
  });

  // ── validateConfigIsolation ──

  describe('validateConfigIsolation()', () => {
    it('returns true when tenants have different values for same key', () => {
      isolator.setConfig('t1', 'theme', 'dark');
      isolator.setConfig('t2', 'theme', 'light');
      expect(isolator.validateConfigIsolation('t1', 't2')).toBe(true);
    });

    it('returns true when tenants have unique keys', () => {
      isolator.setConfig('t1', 'theme', 'dark');
      isolator.setConfig('t2', 'lang', 'en');
      expect(isolator.validateConfigIsolation('t1', 't2')).toBe(true);
    });

    it('returns false when tenants share same key with same value', () => {
      isolator.setConfig('t1', 'apiUrl', 'http://shared');
      isolator.setConfig('t2', 'apiUrl', 'http://shared');
      expect(isolator.validateConfigIsolation('t1', 't2')).toBe(false);
    });

    it('returns true for same tenant', () => {
      isolator.setConfig('t1', 'theme', 'dark');
      expect(isolator.validateConfigIsolation('t1', 't1')).toBe(true);
    });

    it('returns true when one tenant has no configs', () => {
      isolator.setConfig('t1', 'theme', 'dark');
      expect(isolator.validateConfigIsolation('t1', 't2')).toBe(true);
    });
  });

  // ── generateConfigIsolationReport ──

  describe('generateConfigIsolationReport()', () => {
    it('generates report with no configs', () => {
      const report = isolator.generateConfigIsolationReport();
      expect(report.totalConfigs).toBe(0);
      expect(report.isolationValid).toBe(true);
      expect(report.leakageDetected).toHaveLength(0);
    });

    it('generates report with valid isolation', () => {
      isolator.setConfig('t1', 'theme', 'dark');
      isolator.setConfig('t2', 'theme', 'light');
      const report = isolator.generateConfigIsolationReport();
      expect(report.isolationValid).toBe(true);
      expect(report.tenantScopedCount).toBe(2);
    });

    it('generates report with leakage detection', () => {
      isolator.setConfig('t1', 'theme', 'dark');
      isolator.setConfig('t2', 'theme', 'dark');
      const report = isolator.generateConfigIsolationReport();
      expect(report.isolationValid).toBe(false);
      expect(report.violations.length).toBeGreaterThan(0);
    });

    it('counts global and tenant configs correctly', () => {
      isolator.setConfig('t1', 'a', '1');
      isolator.setConfig('t2', 'b', '2');
      isolator.setConfig('global', 'c', '3', 'GLOBAL');
      const report = isolator.generateConfigIsolationReport();
      expect(report.totalConfigs).toBe(3);
      expect(report.tenantScopedCount).toBe(2);
      expect(report.globalScopedCount).toBe(1);
    });

    it('includes generatedAtMs timestamp', () => {
      const before = Date.now();
      const report = isolator.generateConfigIsolationReport();
      const after = Date.now();
      expect(report.generatedAtMs).toBeGreaterThanOrEqual(before);
      expect(report.generatedAtMs).toBeLessThanOrEqual(after);
    });

    it('reports violations with reasons', () => {
      isolator.setConfig('t1', 'x', 'shared');
      isolator.setConfig('t2', 'x', 'shared');
      const report = isolator.generateConfigIsolationReport();
      expect(report.violations.some((v) => v.includes('x'))).toBe(true);
    });
  });

  // ── edge cases ──

  describe('edge cases', () => {
    it('handles special characters in configKey', () => {
      const cfg = isolator.setConfig('t1', 'key/with spaces & symbols', 'value');
      expect(cfg.configKey).toBe('key/with spaces & symbols');
    });

    it('handles very long config values', () => {
      const longValue = 'x'.repeat(10000);
      const cfg = isolator.setConfig('t1', 'bigData', longValue);
      expect(cfg.configValue).toBe(longValue);
    });

    it('handles multiple tenants with isolated configs', () => {
      for (let i = 0; i < 20; i++) {
        isolator.setConfig(`t${i}`, 'theme', `color${i}`);
      }
      for (let i = 0; i < 20; i++) {
        for (let j = i + 1; j < 20; j++) {
          expect(isolator.validateConfigIsolation(`t${i}`, `t${j}`)).toBe(true);
        }
      }
    });

    it('clear removes all configs', () => {
      isolator.setConfig('t1', 'a', '1');
      isolator.setConfig('t2', 'b', '2');
      isolator.clear();
      expect(isolator.getAllConfigsRaw()).toHaveLength(0);
    });
  });
});
