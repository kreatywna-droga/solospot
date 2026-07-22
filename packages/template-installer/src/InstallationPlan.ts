import { TemplateManifest, TemplateManifestData } from '../../template-package/src';
import { MarketplaceTemplate } from '../../marketplace-core/src';

export interface InstallationStep {
  type: 'theme' | 'components' | 'assets' | 'pages' | 'commerce' | 'configuration';
  id: string;
  name: string;
  payload: unknown;
  order: number;
}

export interface InstallationPlan {
  templateId: string;
  templateVersion: string;
  tenantId: string;
  steps: InstallationStep[];
  dependencies: string[];
  validation: InstallationValidation;
  metadata: InstallationMetadata;
}

export interface InstallationValidation {
  compatibility: boolean;
  missingDependencies: string[];
  conflicts: string[];
  minPlatformVersion: string;
  issues: string[];
}

export interface InstallationMetadata {
  templateName: string;
  templateAuthor: string;
  templateDescription: string;
  estimatedTimeMs: number;
  requiredComponents: string[];
  requiredThemes: string[];
  requiredAssets: string[];
}

export class InstallationPlanBuilder {
  private templateId: string = '';
  private templateVersion: string = '';
  private tenantId: string = '';
  private template: MarketplaceTemplate | null = null;
  private packageData: TemplateManifestData | null = null;
  private steps: InstallationStep[] = [];

  withTemplate(template: MarketplaceTemplate): InstallationPlanBuilder {
    this.template = template;
    this.templateId = template.id;
    this.templateVersion = template.versions[0]?.version || '0.0.0';
    return this;
  }

  withPackageData(data: TemplateManifestData): InstallationPlanBuilder {
    this.packageData = data;
    return this;
  }

  withTenant(tenantId: string): InstallationPlanBuilder {
    this.tenantId = tenantId;
    return this;
  }

  build(): InstallationPlan {
    if (!this.template) {
      throw new Error('Template is required to build installation plan');
    }

    const steps = this.buildSteps();
    const validation = this.buildValidation();
    const metadata = this.buildMetadata();

    return {
      templateId: this.templateId,
      templateVersion: this.templateVersion,
      tenantId: this.tenantId,
      steps,
      dependencies: this.template.dependencies,
      validation,
      metadata
    };
  }

  private buildSteps(): InstallationStep[] {
    const steps: InstallationStep[] = [];
    let order = 0;

    if (this.packageData?.themes) {
      steps.push({
        type: 'theme',
        id: 'theme-install',
        name: 'Install Theme',
        payload: this.packageData.themes,
        order: order++
      });
    }

    if (this.packageData?.components) {
      steps.push({
        type: 'components',
        id: 'components-install',
        name: 'Install Components',
        payload: this.packageData.components,
        order: order++
      });
    }

    if (this.packageData?.assets) {
      steps.push({
        type: 'assets',
        id: 'assets-install',
        name: 'Install Assets',
        payload: this.packageData.assets,
        order: order++
      });
    }

    if (this.packageData?.pages) {
      steps.push({
        type: 'pages',
        id: 'pages-install',
        name: 'Install Pages',
        payload: this.packageData.pages,
        order: order++
      });
    }

    if (this.packageData?.commerce) {
      steps.push({
        type: 'commerce',
        id: 'commerce-install',
        name: 'Install Commerce',
        payload: this.packageData.commerce,
        order: order++
      });
    }

    steps.push({
      type: 'configuration',
      id: 'config-apply',
      name: 'Apply Configuration',
      payload: this.packageData?.runtime,
      order: steps.length
    });

    return steps;
  }

  private buildValidation(): InstallationValidation {
    const issues: string[] = [];
    const missingDependencies: string[] = [];
    const conflicts: string[] = [];

    if (!this.template) {
      return {
        compatibility: false,
        missingDependencies: [],
        conflicts: [],
        minPlatformVersion: '3.0.0',
        issues: ['Template is required']
      };
    }

    if (this.template.dependencies && this.template.dependencies.length > 0) {
      issues.push(`Template has ${this.template.dependencies.length} dependencies that need resolution`);
    }

    return {
      compatibility: true,
      missingDependencies,
      conflicts,
      minPlatformVersion: this.template.compatibility?.builder || '>=3.0',
      issues
    };
  }

  private buildMetadata(): InstallationMetadata {
    return {
      templateName: this.template?.name || 'Unknown',
      templateAuthor: this.template?.author?.name || 'Unknown',
      templateDescription: this.template?.description || '',
      estimatedTimeMs: this.steps.length * 500,
      requiredComponents: Object.keys(this.packageData?.components || {}),
      requiredThemes: Object.keys(this.packageData?.themes || {}),
      requiredAssets: Object.keys(this.packageData?.assets || {})
    };
  }
}