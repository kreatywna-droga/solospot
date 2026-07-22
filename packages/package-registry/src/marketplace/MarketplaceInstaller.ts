import { InstallationPlan } from './InstallationPlan';

export interface MarketplaceInstaller {
  createInstallationPlan(packageIds: ReadonlyArray<string>, coreVersion: string): Promise<InstallationPlan>;
  install(plan: InstallationPlan, tenantId: string, storeId: string): Promise<void>;
  rollback(plan: InstallationPlan, tenantId: string, storeId: string): Promise<void>;
}
