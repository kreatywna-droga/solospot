import { InstallationPlan, InstallationPlanBuilder, InstallationStep } from './InstallationPlan';
import { MarketplaceTemplate, PlatformVersion } from '../../marketplace-core/src/entities';
import { TemplateManifestData } from '../../template-package/src/TemplateManifest';
import { InstallationReport, InstallationReportBuilder } from './InstallationReport';

export interface TemplateInstallerDeps {
  readonly loadTemplate: (id: string) => Promise<MarketplaceTemplate | null>;
  readonly loadPackageData: (id: string, version: string) => Promise<TemplateManifestData | null>;
  readonly resolveDependencies: (dependencies: string[]) => Promise<string[]>;
  readonly checkCompatibility: (template: MarketplaceTemplate, platformVersion: PlatformVersion) => Promise<boolean>;
}

export interface InstallResult {
  success: boolean;
  report: InstallationReport;
}

export class TemplateInstallerEngine {
  constructor(private readonly deps: TemplateInstallerDeps) {}

  async install(templateId: string, tenantId: string, platformVersion?: PlatformVersion): Promise<InstallResult> {
    const reportBuilder = new InstallationReportBuilder()
      .withId(`install-${tenantId}-${Date.now()}`)
      .withTemplate(templateId, '')
      .withTenant(tenantId)
      .setStatus('running');

    const template = await this.deps.loadTemplate(templateId);
    if (!template) {
      const report = reportBuilder
        .markStepFailed('template-load', `Template ${templateId} not found`)
        .fail();
      return { success: false, report };
    }

    const version = template.versions[0]?.version || '0.0.0';
    const packageData = await this.deps.loadPackageData(templateId, version);
    if (!packageData) {
      const report = reportBuilder
        .withTemplate(templateId, version)
        .markStepFailed('package-load', `Package data not found for ${templateId}@${version}`)
        .fail();
      return { success: false, report };
    }

    const plan = new InstallationPlanBuilder()
      .withTemplate(template)
      .withPackageData(packageData)
      .withTenant(tenantId)
      .build();

    const compatibility = await this.deps.checkCompatibility(template, platformVersion || this.getDefaultPlatformVersion());
    if (!compatibility) {
      const report = reportBuilder
        .withTemplate(templateId, version)
        .addCompatibilityIssue('Platform version incompatibility detected')
        .fail();
      return { success: false, report };
    }

    const resolvedDeps = await this.deps.resolveDependencies(plan.dependencies);

    for (const step of plan.steps) {
      try {
        await this.executeStep(step);
        reportBuilder.markStepCompleted(step.id);
      } catch (error) {
        const report = reportBuilder
          .markStepFailed(step.id, error instanceof Error ? error.message : String(error))
          .fail();
        return { success: false, report };
      }
    }

    const report = reportBuilder.complete();
    return { success: true, report };
  }

  private async executeStep(step: InstallationStep): Promise<void> {
    switch (step.type) {
      case 'theme':
        await this.installTheme(step.payload as Record<string, unknown>);
        break;
      case 'components':
        await this.installComponents(step.payload as Record<string, unknown>);
        break;
      case 'assets':
        await this.installAssets(step.payload as Record<string, unknown>);
        break;
      case 'pages':
        await this.installPages(step.payload as Record<string, unknown>);
        break;
      case 'commerce':
        await this.installCommerce(step.payload as Record<string, unknown>);
        break;
      case 'configuration':
        await this.applyConfiguration(step.payload as Record<string, unknown>);
        break;
    }
  }

  private async installTheme(themeData: Record<string, unknown>): Promise<void> {
  }

  private async installComponents(componentData: Record<string, unknown>): Promise<void> {
  }

  private async installAssets(assetData: Record<string, unknown>): Promise<void> {
  }

  private async installPages(pageData: Record<string, unknown>): Promise<void> {
  }

  private async installCommerce(commerceData: Record<string, unknown>): Promise<void> {
  }

  private async applyConfiguration(configData: Record<string, unknown>): Promise<void> {
  }

  private getDefaultPlatformVersion(): PlatformVersion {
    return {
      builder: '>=3.0',
      runtime: '>=3.0',
      componentApi: '>=1.0',
      themeApi: '>=1.0',
      commerceApi: '>=1.0'
    };
  }
}