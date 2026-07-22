import { marketplaceProvider } from '@/lib/marketplace/MarketplaceProvider';
import { PackageManifest } from '../../package-registry/src/PackageManifest';
import { UpgradePlanner, UpgradePlan } from '../../package-registry/src/marketplace/UpgradePlanner';
import { AdminContext } from './AdminContext';

export interface PackageManager {
  listPackages(ctx: AdminContext): Promise<ReadonlyArray<PackageManifest>>;
  installPackage(ctx: AdminContext, tenantId: string, storeId: string, packageId: string): Promise<void>;
  uninstallPackage(ctx: AdminContext, tenantId: string, storeId: string, packageId: string): Promise<void>;
  checkUpgrade(ctx: AdminContext, packageId: string, currentVersion: string, targetVersion: string): Promise<UpgradePlan>;
}

export class DefaultPackageManager implements PackageManager {
  private checkPermission(ctx: AdminContext, action: string) {
    if (ctx.role === 'OWNER' || ctx.role === 'ADMIN') {
      return;
    }
    if (ctx.role === 'OPERATOR' && ['listPackages', 'checkUpgrade'].includes(action)) {
      return;
    }
    if (ctx.role === 'SUPPORT' && ['listPackages'].includes(action)) {
      return;
    }
    throw new Error(`InsufficientPermissions: Role '${ctx.role}' does not have permission to execute action '${action}'`);
  }

  async listPackages(ctx: AdminContext): Promise<ReadonlyArray<PackageManifest>> {
    this.checkPermission(ctx, 'listPackages');
    return marketplaceProvider.registry.listPackages();
  }

  async installPackage(ctx: AdminContext, tenantId: string, storeId: string, packageId: string): Promise<void> {
    this.checkPermission(ctx, 'installPackage');
    const entry = await marketplaceProvider.registry.getPackage(packageId);
    if (!entry) {
      throw new Error(`Package '${packageId}' not found`);
    }
    const plan = await marketplaceProvider.installer.createInstallationPlan([packageId], '1.0.0');
    await marketplaceProvider.installer.install(plan, tenantId, storeId);
  }

  async uninstallPackage(ctx: AdminContext, tenantId: string, storeId: string, packageId: string): Promise<void> {
    this.checkPermission(ctx, 'uninstallPackage');
    const plan = await marketplaceProvider.installer.createInstallationPlan([packageId], '1.0.0');
    await marketplaceProvider.installer.rollback(plan, tenantId, storeId);
  }

  async checkUpgrade(ctx: AdminContext, packageId: string, currentVersion: string, targetVersion: string): Promise<UpgradePlan> {
    this.checkPermission(ctx, 'checkUpgrade');
    const currentEntry = await marketplaceProvider.registry.getPackage(packageId, currentVersion);
    const targetEntry = await marketplaceProvider.registry.getPackage(packageId, targetVersion);
    if (!currentEntry || !targetEntry) {
      throw new Error(`Cannot plan upgrade: package version(s) not found in registry`);
    }
    return UpgradePlanner.planUpgrade(currentEntry.manifest, targetEntry.manifest, '1.0.0');
  }
}
