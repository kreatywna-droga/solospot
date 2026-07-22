import { MarketplaceInstaller } from './MarketplaceInstaller';
import { InstallationPlan } from './InstallationPlan';
import { PackageRegistry } from '../PackageRegistry';
import { DependencyValidator } from './DependencyValidator';
import { CompatibilityValidator } from './CompatibilityValidator';

export class DefaultMarketplaceInstaller implements MarketplaceInstaller {
  private readonly installedStores = new Set<string>();

  constructor(private readonly registry: PackageRegistry) {}

  async createInstallationPlan(packageIds: ReadonlyArray<string>, coreVersion: string): Promise<InstallationPlan> {
    const steps: { packageId: string; manifest: any; content: Uint8Array }[] = [];
    const resolvedManifests: any[] = [];
    
    // Resolve all requested packages and their dependencies recursively
    const queue = [...packageIds];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) {
        continue;
      }
      visited.add(id);

      const entry = await this.registry.getPackage(id, 'latest');
      if (!entry) {
        throw new Error(`Package '${id}' not found in registry`);
      }

      // Check compatibility
      const compat = CompatibilityValidator.validate(entry.manifest, {
        coreVersion,
        platformVersion: '1.0.0'
      });
      if (!compat.compatible) {
        throw new Error(`Package '${id}' is incompatible: ${compat.reasons.join(', ')}`);
      }

      resolvedManifests.push(entry.manifest);
      steps.push({
        packageId: id,
        manifest: entry.manifest,
        content: entry.content
      });

      // Add dependencies to queue
      for (const depId of Object.keys(entry.manifest.dependencies)) {
        if (!visited.has(depId)) {
          queue.push(depId);
        }
      }
    }

    // Validate the complete dependency graph
    const depValidator = new DependencyValidator(this.registry);
    const report = await depValidator.validate(resolvedManifests);
    if (!report.valid) {
      throw new Error(`Dependency validation failed: ${report.errors.join(', ')}`);
    }

    // Determine unique capabilities
    const capabilities = Array.from(
      new Set(resolvedManifests.flatMap(m => m.capabilities))
    );

    return {
      steps,
      capabilities,
      warnings: [],
      migrationRequired: false
    };
  }

  async install(plan: InstallationPlan, tenantId: string, storeId: string): Promise<void> {
    const key = `${tenantId}:${storeId}`;
    if (this.installedStores.has(key)) {
      // Simulate idempotent skip or update
      return;
    }
    this.installedStores.add(key);
  }

  async rollback(plan: InstallationPlan, tenantId: string, storeId: string): Promise<void> {
    const key = `${tenantId}:${storeId}`;
    this.installedStores.delete(key);
  }

  isInstalled(tenantId: string, storeId: string): boolean {
    return this.installedStores.has(`${tenantId}:${storeId}`);
  }
}
