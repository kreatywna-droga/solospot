import { InstallationPlan } from './InstallationPlan';
import { MarketplaceTemplate } from '../../marketplace-core/src';
import { TemplateManifestData } from '../../template-package/src/TemplateManifest';

export interface ProvisioningContext {
  tenant: {
    id: string;
    name?: string;
    slug?: string;
  };
  template: {
    id: string;
    version: string;
    name: string;
  };
  theme: TemplateManifestData['themes'];
  components: TemplateManifestData['components'];
  assets: TemplateManifestData['assets'];
  pages: TemplateManifestData['pages'];
  commerce: TemplateManifestData['commerce'];
  runtime: TemplateManifestData['runtime'];
  locale: string;
  environment: 'development' | 'staging' | 'production';
  metadata: Record<string, unknown>;
}

export interface ProvisioningResult {
  success: boolean;
  tenantId: string;
  templateId: string;
  stepsCompleted: string[];
  stepsFailed: string[];
  warnings: string[];
  errors: string[];
  durationMs: number;
}

export interface ProvisioningEvent {
  type: 'PROVISIONING_STARTED' | 'THEME_PROVISIONED' | 'COMPONENTS_PROVISIONED' | 'ASSETS_PROVISIONED' | 'TEMPLATES_PROVISIONED' | 'COMMERCE_PROVISIONED' | 'PUBLISH_PREPARED' | 'PROVISIONING_COMPLETED' | 'PROVISIONING_FAILED';
  timestamp: string;
  step?: string;
  metadata?: Record<string, unknown>;
}

export interface ProvisioningEngineDeps {
  readonly loadTemplate: (id: string) => Promise<MarketplaceTemplate | null>;
  readonly loadPackageData: (id: string, version: string) => Promise<TemplateManifestData | null>;
}

export class TenantProvisioningEngine {
  private eventListeners: ((event: ProvisioningEvent) => void)[] = [];

  constructor(private readonly deps: ProvisioningEngineDeps) {}

  async provision(plan: InstallationPlan): Promise<ProvisioningResult> {
    const startTime = Date.now();
    const stepsCompleted: string[] = [];
    const stepsFailed: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    this.emit({
      type: 'PROVISIONING_STARTED',
      timestamp: new Date().toISOString(),
      metadata: { tenantId: plan.tenantId, templateId: plan.templateId }
    });

    try {
      const context = await this.buildContext(plan);
      
      await this.provisionTheme(context);
      stepsCompleted.push('theme');

      await this.provisionComponents(context);
      stepsCompleted.push('components');

      await this.provisionAssets(context);
      stepsCompleted.push('assets');

      await this.provisionPages(context);
      stepsCompleted.push('pages');

      await this.provisionCommerce(context);
      stepsCompleted.push('commerce');

      await this.preparePublish(context);
      stepsCompleted.push('publish');

      this.emit({
        type: 'PROVISIONING_COMPLETED',
        timestamp: new Date().toISOString(),
        step: 'complete',
        metadata: { stepsCompleted: stepsCompleted.length }
      });

      return {
        success: true,
        tenantId: plan.tenantId,
        templateId: plan.templateId,
        stepsCompleted,
        stepsFailed,
        warnings,
        errors,
        durationMs: Date.now() - startTime
      };
    } catch (error) {
      stepsFailed.push('unknown');
      errors.push(error instanceof Error ? error.message : String(error));

      this.emit({
        type: 'PROVISIONING_FAILED',
        timestamp: new Date().toISOString(),
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });

      return {
        success: false,
        tenantId: plan.tenantId,
        templateId: plan.templateId,
        stepsCompleted,
        stepsFailed,
        warnings,
        errors,
        durationMs: Date.now() - startTime
      };
    }
  }

  addEventListener(listener: (event: ProvisioningEvent) => void): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: (event: ProvisioningEvent) => void): void {
    this.eventListeners = this.eventListeners.filter(l => l !== listener);
  }

  private emit(event: ProvisioningEvent): void {
    for (const listener of this.eventListeners) {
      listener(event);
    }
  }

  private async buildContext(plan: InstallationPlan): Promise<ProvisioningContext> {
    const template = await this.deps.loadTemplate(plan.templateId);
    if (!template) {
      throw new Error(`Template ${plan.templateId} not found`);
    }

    const version = template.versions[0]?.version || '0.0.0';
    const packageData = await this.deps.loadPackageData(plan.templateId, version);
    if (!packageData) {
      throw new Error(`Package data for ${plan.templateId}@${version} not found`);
    }

    return {
      tenant: {
        id: plan.tenantId,
        name: plan.tenantId,
        slug: plan.tenantId
      },
      template: {
        id: plan.templateId,
        version,
        name: template.name
      },
      theme: packageData.themes,
      components: packageData.components,
      assets: packageData.assets,
      pages: packageData.pages,
      commerce: packageData.commerce,
      runtime: packageData.runtime,
      locale: 'en-US',
      environment: 'production',
      metadata: {}
    };
  }

  private async provisionTheme(context: ProvisioningContext): Promise<void> {
    this.emit({
      type: 'THEME_PROVISIONED',
      timestamp: new Date().toISOString(),
      metadata: { themeCount: Object.keys(context.theme).length }
    });
  }

  private async provisionComponents(context: ProvisioningContext): Promise<void> {
    this.emit({
      type: 'COMPONENTS_PROVISIONED',
      timestamp: new Date().toISOString(),
      metadata: { componentCount: Object.keys(context.components).length }
    });
  }

  private async provisionAssets(context: ProvisioningContext): Promise<void> {
    this.emit({
      type: 'ASSETS_PROVISIONED',
      timestamp: new Date().toISOString(),
      metadata: { assetCount: Object.keys(context.assets).length }
    });
  }

  private async provisionPages(context: ProvisioningContext): Promise<void> {
    this.emit({
      type: 'TEMPLATES_PROVISIONED',
      timestamp: new Date().toISOString(),
      metadata: { pageCount: Object.keys(context.pages).length }
    });
  }

  private async provisionCommerce(context: ProvisioningContext): Promise<void> {
    this.emit({
      type: 'COMMERCE_PROVISIONED',
      timestamp: new Date().toISOString(),
      metadata: { commerceKeys: Object.keys(context.commerce).length }
    });
  }

  private async preparePublish(context: ProvisioningContext): Promise<void> {
    this.emit({
      type: 'PUBLISH_PREPARED',
      timestamp: new Date().toISOString(),
      metadata: { tenantId: context.tenant.id }
    });
  }
}