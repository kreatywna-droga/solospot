import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPackageRegistry } from '../../package-registry/src/PackageRegistry';
import { DefaultMarketplaceInstaller } from '../../package-registry/src/marketplace/DefaultMarketplaceInstaller';
import { PackageManifest } from '../../package-registry/src/PackageManifest';
import { PackageStage } from '../src/stages/PackageStage';
import { createProvisionRequest } from '../src/ProvisionRequest';
import { createProvisionContext } from '../src/ProvisionContext';
import { DefaultProvisionPipelineBuilder } from '../src/DefaultProvisionPipeline';
import { DefaultProvisionEngine } from '../src/DefaultProvisionEngine';
import { ValidateStage } from '../src/stages/ValidateStage';
import { TenantStage } from '../src/stages/TenantStage';
import { TemplateStage } from '../src/stages/TemplateStage';
import { StoreConfigStage } from '../src/stages/StoreConfigStage';
import { PublishEngineBuilder } from '../../publish-engine/src';

describe('Provision Engine — Marketplace Installer Integration (C2.3)', () => {
  let registry: InMemoryPackageRegistry;
  let installer: DefaultMarketplaceInstaller;

  beforeEach(async () => {
    registry = new InMemoryPackageRegistry();
    installer = new DefaultMarketplaceInstaller(registry);

    // Register basic test packages
    const pkgStripe: PackageManifest = {
      id: 'pkg-stripe',
      name: 'Stripe Gateway',
      version: '1.0.0',
      type: 'payment',
      dependencies: { 'pkg-auth': '^1.0.0' },
      capabilities: ['payments'],
      compatibility: { coreVersion: '^1.0.0' },
      author: 'Google Antigravity',
      license: 'MIT'
    };

    const pkgAuth: PackageManifest = {
      id: 'pkg-auth',
      name: 'Auth Provider',
      version: '1.0.0',
      type: 'integration',
      dependencies: {},
      capabilities: ['auth'],
      compatibility: { coreVersion: '^1.0.0' },
      author: 'Google Antigravity',
      license: 'MIT'
    };

    const pkgConflictStripe: PackageManifest = {
      id: 'pkg-conflict-stripe',
      name: 'Alternate Stripe Gateway',
      version: '1.0.0',
      type: 'payment',
      dependencies: {},
      capabilities: ['payments'],
      compatibility: { coreVersion: '^1.0.0' },
      author: 'Third Party',
      license: 'MIT'
    };

    const pkgThemeA: PackageManifest = {
      id: 'theme-a',
      name: 'Theme A',
      version: '1.0.0',
      type: 'theme',
      dependencies: {},
      capabilities: ['theme'],
      compatibility: { coreVersion: '^1.0.0' },
      author: 'Designer A',
      license: 'MIT'
    };

    const pkgThemeB: PackageManifest = {
      id: 'theme-b',
      name: 'Theme B',
      version: '1.0.0',
      type: 'theme',
      dependencies: {},
      capabilities: ['theme'],
      compatibility: { coreVersion: '^1.0.0' },
      author: 'Designer B',
      license: 'MIT'
    };

    await registry.register(pkgStripe, new Uint8Array());
    await registry.register(pkgAuth, new Uint8Array());
    await registry.register(pkgConflictStripe, new Uint8Array());
    await registry.register(pkgThemeA, new Uint8Array());
    await registry.register(pkgThemeB, new Uint8Array());
  });

  it('should successfully install package and recursively resolve dependencies', async () => {
    const stage = new PackageStage(installer);

    const context = createProvisionContext(
      createProvisionRequest({
        tenantId: 'tenant-1',
        storeId: 'store-1',
        storeName: 'Test Store',
        templateId: 'default',
        initialPackages: ['pkg-stripe'],
        metadata: { coreVersion: '1.0.0' }
      })
    );

    const resultCtx = await stage.execute(context);
    expect(resultCtx.installedPackages).toContain('pkg-stripe');
    expect(resultCtx.installedPackages).toContain('pkg-auth'); // pulled automatically as dependency
    expect(resultCtx.metadata.capabilities).toContain('payments');
    expect(resultCtx.metadata.capabilities).toContain('auth');

    expect(installer.isInstalled('tenant-1', 'store-1')).toBe(true);

    // Rollback check
    const rolledBackCtx = await stage.rollback(resultCtx);
    expect(rolledBackCtx.installedPackages.length).toBe(0);
    expect(installer.isInstalled('tenant-1', 'store-1')).toBe(false);
  });

  it('should fail validation and provisioning when encountering missing dependencies', async () => {
    const stage = new PackageStage(installer);

    const context = createProvisionContext(
      createProvisionRequest({
        tenantId: 'tenant-1',
        storeId: 'store-1',
        storeName: 'Test Store',
        templateId: 'default',
        initialPackages: ['pkg-with-missing-deps'], // this does not exist in registry
        metadata: { coreVersion: '1.0.0' }
      })
    );

    await expect(stage.execute(context)).rejects.toThrow('not found in registry');
  });

  it('should fail and reject installation on capability conflict (e.g. multiple themes)', async () => {
    const stage = new PackageStage(installer);

    const context = createProvisionContext(
      createProvisionRequest({
        tenantId: 'tenant-1',
        storeId: 'store-1',
        storeName: 'Test Store',
        templateId: 'default',
        initialPackages: ['theme-a', 'theme-b'], // conflicting exclusive theme capabilities
        metadata: { coreVersion: '1.0.0' }
      })
    );

    await expect(stage.execute(context)).rejects.toThrow('Capability conflict for \'theme\'');
  });

  it('should support idempotent execution within the installer', async () => {
    const plan = await installer.createInstallationPlan(['pkg-auth'], '1.0.0');
    
    // First install: OK
    await installer.install(plan, 'tenant-idem', 'store-idem');
    expect(installer.isInstalled('tenant-idem', 'store-idem')).toBe(true);

    // Second install: should not throw, skips gracefully
    await expect(installer.install(plan, 'tenant-idem', 'store-idem')).resolves.not.toThrow();
  });
});
