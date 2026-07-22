import { describe, it, expect } from 'vitest';
import { InMemoryPackageRegistry } from '../src/PackageRegistry';
import { PackageManifest } from '../src/PackageManifest';

describe('PackageRegistry Contract & Implementation', () => {
  it('should successfully register and retrieve packages', async () => {
    const registry = new InMemoryPackageRegistry();

    const manifest: PackageManifest = {
      id: 'pkg-stripe',
      name: 'Stripe Payment Capability',
      version: '1.0.0',
      type: 'payment',
      dependencies: {},
      capabilities: ['payments'],
      compatibility: { coreVersion: '^1.0.0' },
      author: 'Google Antigravity',
      license: 'MIT'
    };

    const encoder = new TextEncoder();
    const content = encoder.encode('stripe implementation');

    await registry.register(manifest, content);

    // Retrieve exact version
    const retrieved = await registry.getPackage('pkg-stripe', '1.0.0');
    expect(retrieved).toBeDefined();
    expect(retrieved?.manifest.id).toBe('pkg-stripe');
    expect(retrieved?.manifest.version).toBe('1.0.0');
    expect(new TextDecoder().decode(retrieved?.content)).toBe('stripe implementation');

    // Retrieve latest version
    const latest = await registry.getPackage('pkg-stripe');
    expect(latest).toBeDefined();
    expect(latest?.manifest.version).toBe('1.0.0');
  });

  it('should throw error when registering duplicate versions of a package', async () => {
    const registry = new InMemoryPackageRegistry();

    const manifest: PackageManifest = {
      id: 'pkg-theme-apparel',
      name: 'Apparel Store Theme',
      version: '2.0.1',
      type: 'theme',
      dependencies: {},
      capabilities: ['theme'],
      compatibility: { coreVersion: '^1.0.0' },
      author: 'Google Antigravity',
      license: 'MIT'
    };

    const content = new Uint8Array([1, 2, 3]);

    await registry.register(manifest, content);
    await expect(registry.register(manifest, content)).rejects.toThrow('already registered');
  });

  it('should list and filter packages correctly', async () => {
    const registry = new InMemoryPackageRegistry();

    const manifest1: PackageManifest = {
      id: 'pkg-payment-stripe',
      name: 'Stripe',
      version: '1.0.0',
      type: 'payment',
      dependencies: {},
      capabilities: ['payments'],
      compatibility: { coreVersion: '^1.0.0' },
      author: 'Google Antigravity',
      license: 'MIT'
    };

    const manifest2: PackageManifest = {
      id: 'pkg-theme-classic',
      name: 'Classic Storefront Theme',
      version: '1.0.0',
      type: 'theme',
      dependencies: {},
      capabilities: ['theme'],
      compatibility: { coreVersion: '^1.0.0' },
      author: 'Google Antigravity',
      license: 'MIT'
    };

    await registry.register(manifest1, new Uint8Array());
    await registry.register(manifest2, new Uint8Array());

    // Filter by type
    const payments = await registry.listPackages({ type: 'payment' });
    expect(payments.length).toBe(1);
    expect(payments[0].id).toBe('pkg-payment-stripe');

    // Filter by capability
    const themes = await registry.listPackages({ capability: 'theme' });
    expect(themes.length).toBe(1);
    expect(themes[0].id).toBe('pkg-theme-classic');
  });
});
