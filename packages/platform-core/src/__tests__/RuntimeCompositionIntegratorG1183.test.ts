/**
 * RuntimeCompositionIntegratorG1183.test.ts — G1-183 Runtime Composition Integrator
 *
 * Covers capability registration, retrieval, health checks, versioning,
 * manifest export, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RuntimeCompositionIntegrator,
  RuntimeCapabilityBinding,
  CompositionManifest,
} from '../RuntimeCompositionIntegrator';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeBinding(overrides: Partial<RuntimeCapabilityBinding> = {}): RuntimeCapabilityBinding {
  return {
    capabilityId: 'test-capability',
    version: '1.0.0',
    runtimeEndpoint: 'https://runtime.example.com/test',
    healthCheck: 'https://runtime.example.com/health/test',
    enabled: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('RuntimeCompositionIntegrator', () => {
  let integrator: RuntimeCompositionIntegrator;

  beforeEach(() => {
    integrator = new RuntimeCompositionIntegrator();
  });

  // ──────────────────────────────────────────────────────────────
  // Registration (tests 1–6)
  // ──────────────────────────────────────────────────────────────

  it('1: registerCapability stores a capability', () => {
    integrator.registerCapability(makeBinding());
    expect(integrator.getCapability('test-capability')).toBeDefined();
  });

  it('2: registerCapability stores the correct binding data', () => {
    const binding = makeBinding({ version: '2.3.1', runtimeEndpoint: 'https://ep.test/v2' });
    integrator.registerCapability(binding);
    const stored = integrator.getCapability('test-capability');
    expect(stored?.version).toBe('2.3.1');
    expect(stored?.runtimeEndpoint).toBe('https://ep.test/v2');
  });

  it('3: registerCapability overwrites existing binding with same id', () => {
    integrator.registerCapability(makeBinding({ version: '1.0.0' }));
    integrator.registerCapability(makeBinding({ version: '2.0.0' }));
    expect(integrator.getCapability('test-capability')?.version).toBe('2.0.0');
  });

  it('4: registerCapability stores multiple distinct capabilities', () => {
    integrator.registerCapability(makeBinding({ capabilityId: 'cap-a' }));
    integrator.registerCapability(makeBinding({ capabilityId: 'cap-b' }));
    expect(integrator.getCapability('cap-a')).toBeDefined();
    expect(integrator.getCapability('cap-b')).toBeDefined();
  });

  it('5: registerCapability with disabled capability', () => {
    integrator.registerCapability(makeBinding({ enabled: false }));
    expect(integrator.getCapability('test-capability')?.enabled).toBe(false);
  });

  it('6: registerCapability preserves all binding fields', () => {
    const binding = makeBinding({
      capabilityId: 'full-cap',
      version: '3.1.0',
      runtimeEndpoint: 'https://full.example.com',
      healthCheck: 'https://full.example.com/health',
      enabled: true,
    });
    integrator.registerCapability(binding);
    const stored = integrator.getCapability('full-cap');
    expect(stored).toEqual(binding);
  });

  // ──────────────────────────────────────────────────────────────
  // Unregistration (tests 7–10)
  // ──────────────────────────────────────────────────────────────

  it('7: unregisterCapability removes an existing capability', () => {
    integrator.registerCapability(makeBinding());
    expect(integrator.unregisterCapability('test-capability')).toBe(true);
    expect(integrator.getCapability('test-capability')).toBeUndefined();
  });

  it('8: unregisterCapability returns false for non-existent id', () => {
    expect(integrator.unregisterCapability('nonexistent')).toBe(false);
  });

  it('9: unregisterCapability does not affect other capabilities', () => {
    integrator.registerCapability(makeBinding({ capabilityId: 'a' }));
    integrator.registerCapability(makeBinding({ capabilityId: 'b' }));
    integrator.unregisterCapability('a');
    expect(integrator.getCapability('b')).toBeDefined();
  });

  it('10: unregisterCapability on empty registry returns false', () => {
    expect(integrator.unregisterCapability('any')).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────
  // Get capability (tests 11–14)
  // ──────────────────────────────────────────────────────────────

  it('11: getCapability returns undefined for unregistered id', () => {
    expect(integrator.getCapability('unknown')).toBeUndefined();
  });

  it('12: getCapability returns correct binding for registered id', () => {
    const binding = makeBinding({ capabilityId: 'specific' });
    integrator.registerCapability(binding);
    expect(integrator.getCapability('specific')).toEqual(binding);
  });

  it('13: getCapability returns same object reference for same id', () => {
    integrator.registerCapability(makeBinding({ capabilityId: 'ref' }));
    const a = integrator.getCapability('ref');
    const b = integrator.getCapability('ref');
    expect(a).toBe(b);
  });

  it('14: getCapability after unregister returns undefined', () => {
    integrator.registerCapability(makeBinding({ capabilityId: 'temp' }));
    integrator.unregisterCapability('temp');
    expect(integrator.getCapability('temp')).toBeUndefined();
  });

  // ──────────────────────────────────────────────────────────────
  // List active capabilities (tests 15–19)
  // ──────────────────────────────────────────────────────────────

  it('15: listActiveCapabilities returns empty array when registry is empty', () => {
    expect(integrator.listActiveCapabilities()).toEqual([]);
  });

  it('16: listActiveCapabilities includes enabled capabilities', () => {
    integrator.registerCapability(makeBinding({ capabilityId: 'active1', enabled: true }));
    const active = integrator.listActiveCapabilities();
    expect(active).toHaveLength(1);
    expect(active[0].capabilityId).toBe('active1');
  });

  it('17: listActiveCapabilities excludes disabled capabilities', () => {
    integrator.registerCapability(makeBinding({ capabilityId: 'disabled1', enabled: false }));
    expect(integrator.listActiveCapabilities()).toHaveLength(0);
  });

  it('18: listActiveCapabilities returns mix of enabled and disabled correctly', () => {
    integrator.registerCapability(makeBinding({ capabilityId: 'on', enabled: true }));
    integrator.registerCapability(makeBinding({ capabilityId: 'off', enabled: false }));
    integrator.registerCapability(makeBinding({ capabilityId: 'on2', enabled: true }));
    const active = integrator.listActiveCapabilities();
    expect(active).toHaveLength(2);
    expect(active.map((b) => b.capabilityId).sort()).toEqual(['on', 'on2']);
  });

  it('19: listActiveCapabilities reflects state changes after re-registration', () => {
    integrator.registerCapability(makeBinding({ capabilityId: 'toggle', enabled: false }));
    expect(integrator.listActiveCapabilities()).toHaveLength(0);
    integrator.registerCapability(makeBinding({ capabilityId: 'toggle', enabled: true }));
    expect(integrator.listActiveCapabilities()).toHaveLength(1);
  });

  // ──────────────────────────────────────────────────────────────
  // Health validation (tests 20–23)
  // ──────────────────────────────────────────────────────────────

  it('20: validateCapabilityHealth returns true for registered capability', () => {
    integrator.registerCapability(makeBinding());
    expect(integrator.validateCapabilityHealth('test-capability')).toBe(true);
  });

  it('21: validateCapabilityHealth returns false for unregistered capability', () => {
    expect(integrator.validateCapabilityHealth('nonexistent')).toBe(false);
  });

  it('22: validateCapabilityHealth returns true even for disabled capability', () => {
    integrator.registerCapability(makeBinding({ enabled: false }));
    expect(integrator.validateCapabilityHealth('test-capability')).toBe(true);
  });

  it('23: validateCapabilityHealth returns false after unregister', () => {
    integrator.registerCapability(makeBinding());
    integrator.unregisterCapability('test-capability');
    expect(integrator.validateCapabilityHealth('test-capability')).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────
  // Version management (tests 24–27)
  // ──────────────────────────────────────────────────────────────

  it('24: getCapabilityVersion returns version for registered capability', () => {
    integrator.registerCapability(makeBinding({ version: '1.2.3' }));
    expect(integrator.getCapabilityVersion('test-capability')).toBe('1.2.3');
  });

  it('25: getCapabilityVersion returns undefined for unregistered capability', () => {
    expect(integrator.getCapabilityVersion('nope')).toBeUndefined();
  });

  it('26: upgradeCapability updates version of existing capability', () => {
    integrator.registerCapability(makeBinding({ version: '1.0.0' }));
    const result = integrator.upgradeCapability('test-capability', '2.0.0');
    expect(result).toBe(true);
    expect(integrator.getCapabilityVersion('test-capability')).toBe('2.0.0');
  });

  it('27: upgradeCapability returns false for non-existent capability', () => {
    expect(integrator.upgradeCapability('nonexistent', '1.0.0')).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────
  // Manifest export (tests 28–32)
  // ──────────────────────────────────────────────────────────────

  it('28: exportCompositionManifest returns empty manifest for empty registry', () => {
    const manifest = integrator.exportCompositionManifest();
    expect(manifest.totalCapabilities).toBe(0);
    expect(manifest.activeCapabilities).toBe(0);
    expect(manifest.capabilities).toEqual([]);
  });

  it('29: exportCompositionManifest includes total count', () => {
    integrator.registerCapability(makeBinding({ capabilityId: 'a' }));
    integrator.registerCapability(makeBinding({ capabilityId: 'b' }));
    const manifest = integrator.exportCompositionManifest();
    expect(manifest.totalCapabilities).toBe(2);
  });

  it('30: exportCompositionManifest counts active capabilities correctly', () => {
    integrator.registerCapability(makeBinding({ capabilityId: 'a', enabled: true }));
    integrator.registerCapability(makeBinding({ capabilityId: 'b', enabled: false }));
    integrator.registerCapability(makeBinding({ capabilityId: 'c', enabled: true }));
    const manifest = integrator.exportCompositionManifest();
    expect(manifest.activeCapabilities).toBe(2);
  });

  it('31: exportCompositionManifest includes all capability bindings', () => {
    integrator.registerCapability(makeBinding({ capabilityId: 'x' }));
    integrator.registerCapability(makeBinding({ capabilityId: 'y' }));
    const manifest = integrator.exportCompositionManifest();
    const ids = manifest.capabilities.map((c) => c.capabilityId).sort();
    expect(ids).toEqual(['x', 'y']);
  });

  it('32: exportCompositionManifest has valid ISO timestamp', () => {
    integrator.registerCapability(makeBinding());
    const manifest = integrator.exportCompositionManifest();
    expect(() => new Date(manifest.timestamp)).not.toThrow();
    expect(new Date(manifest.timestamp).getTime()).not.toBeNaN();
  });

  // ──────────────────────────────────────────────────────────────
  // Edge cases (tests 33–36)
  // ──────────────────────────────────────────────────────────────

  it('33: upgradeCapability preserves other binding fields', () => {
    integrator.registerCapability(makeBinding({
      capabilityId: 'pres',
      runtimeEndpoint: 'https://ep.test',
      healthCheck: 'https://hc.test',
      enabled: false,
    }));
    integrator.upgradeCapability('pres', '9.9.9');
    const cap = integrator.getCapability('pres')!;
    expect(cap.version).toBe('9.9.9');
    expect(cap.runtimeEndpoint).toBe('https://ep.test');
    expect(cap.healthCheck).toBe('https://hc.test');
    expect(cap.enabled).toBe(false);
  });

  it('34: unregisterCapability returns true for capability registered as disabled', () => {
    integrator.registerCapability(makeBinding({ capabilityId: 'off', enabled: false }));
    expect(integrator.unregisterCapability('off')).toBe(true);
  });

  it('35: manifest after mixed register/unregister operations is consistent', () => {
    integrator.registerCapability(makeBinding({ capabilityId: 'a', enabled: true }));
    integrator.registerCapability(makeBinding({ capabilityId: 'b', enabled: false }));
    integrator.registerCapability(makeBinding({ capabilityId: 'c', enabled: true }));
    integrator.unregisterCapability('b');
    const manifest = integrator.exportCompositionManifest();
        expect(manifest.totalCapabilities).toBe(2);
    expect(manifest.activeCapabilities).toBe(2);
  });

  it('36: listActiveCapabilities returns empty after all capabilities unregistered', () => {
    integrator.registerCapability(makeBinding({ capabilityId: 'a' }));
    integrator.registerCapability(makeBinding({ capabilityId: 'b' }));
    integrator.unregisterCapability('a');
    integrator.unregisterCapability('b');
    expect(integrator.listActiveCapabilities()).toEqual([]);
  });
});


