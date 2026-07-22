import { ProvisionStage } from '../ProvisionStage';
import { ProvisionContext, extendProvisionContext } from '../ProvisionContext';
import { MarketplaceInstaller } from '../../../package-registry/src';

export class PackageStage implements ProvisionStage {
  readonly name = 'packages';
  private readonly installer?: MarketplaceInstaller;

  constructor(installer?: MarketplaceInstaller) {
    this.installer = installer;
  }

  async execute(context: ProvisionContext): Promise<ProvisionContext> {
    const requestedPackages = context.request.initialPackages;
    
    if (this.installer) {
      const coreVersion = (context.request.metadata?.coreVersion as string) || '1.0.0';
      const plan = await this.installer.createInstallationPlan(requestedPackages, coreVersion);
      await this.installer.install(plan, context.request.tenantId, context.request.storeId);

      const installed = plan.steps.map(s => s.packageId);

      return extendProvisionContext(context, {
        installedPackages: installed,
        metadata: {
          ...context.metadata,
          capabilities: plan.capabilities,
          installationPlan: plan
        }
      });
    }

    const capabilitiesMap: Record<string, string> = {
      stripe: 'payments',
      paypal: 'payments',
      posthog: 'analytics',
      ga4: 'analytics',
      fedex: 'shipping',
      dhl: 'shipping',
      yoast: 'seo',
      hubspot: 'crm'
    };

    const resolvedCapabilities = new Set<string>();
    const installed: string[] = [];

    for (const pkg of requestedPackages) {
      installed.push(pkg);
      const cap = capabilitiesMap[pkg.toLowerCase()];
      if (cap) {
        resolvedCapabilities.add(cap);
      }
    }

    return extendProvisionContext(context, {
      installedPackages: installed,
      metadata: {
        ...context.metadata,
        capabilities: Array.from(resolvedCapabilities)
      }
    });
  }

  async rollback(context: ProvisionContext): Promise<ProvisionContext> {
    if (this.installer && context.metadata?.installationPlan) {
      await this.installer.rollback(
        context.metadata.installationPlan as any,
        context.request.tenantId,
        context.request.storeId
      );
    }

    return extendProvisionContext(context, {
      installedPackages: [],
      metadata: {
        ...context.metadata,
        capabilities: undefined,
        installationPlan: undefined
      }
    });
  }
}
