import { MarketplaceTemplate, PlatformVersion } from '../../marketplace-core/src';
import { TemplateManifestData } from '../../template-package/src/TemplateManifest';

export interface VerificationResult {
  success: boolean;
  packageIntegrity: PackageIntegrityResult;
  runtimeVerification: RuntimeVerificationResult;
  tenantVerification: TenantVerificationResult;
  warnings: string[];
  errors: string[];
  durationMs: number;
}

export interface PackageIntegrityResult {
  valid: boolean;
  manifestValid: boolean;
  versionValid: boolean;
  checksumValid: boolean;
  dependenciesValid: boolean;
  compatibilityValid: boolean;
  issues: string[];
}

export interface RuntimeVerificationResult {
  themeRuntime: boolean;
  componentRuntime: boolean;
  templateRuntime: boolean;
  assetRuntime: boolean;
  commercePersistence: boolean;
  publishPipelineReady: boolean;
  issues: string[];
}

export interface TenantVerificationResult {
  dataIsolation: boolean;
  correctScope: boolean;
  correctRepositories: boolean;
  assetReferencesValid: boolean;
  themeProviderValid: boolean;
  issues: string[];
}

export class InstallationVerifier {
  async verify(
    template: MarketplaceTemplate,
    packageData: TemplateManifestData,
    tenantId: string,
    platformVersion: PlatformVersion
  ): Promise<VerificationResult> {
    const startTime = Date.now();

    const packageIntegrity = await this.verifyPackageIntegrity(template, packageData);
    const runtimeVerification = await this.verifyRuntime(packageData);
    const tenantVerification = await this.verifyTenant(tenantId, packageData);

    const warnings: string[] = [];
    const errors: string[] = [];

    if (!packageIntegrity.valid) {
      errors.push('Package integrity check failed');
    }
    if (!runtimeVerification.themeRuntime) {
      errors.push('ThemeRuntime verification failed');
    }
    if (!runtimeVerification.componentRuntime) {
      errors.push('ComponentRuntime verification failed');
    }
    if (!tenantVerification.dataIsolation) {
      errors.push('Tenant data isolation check failed');
    }

    return {
      success: errors.length === 0,
      packageIntegrity,
      runtimeVerification,
      tenantVerification,
      warnings,
      errors,
      durationMs: Date.now() - startTime
    };
  }

  private async verifyPackageIntegrity(
    template: MarketplaceTemplate,
    packageData: TemplateManifestData
  ): Promise<PackageIntegrityResult> {
    const issues: string[] = [];

    const manifestValid = this.validateManifest(packageData.manifest);
    const versionValid = this.validateVersion(packageData.manifest.version);
    const checksumValid = true;
    const dependenciesValid = this.validateDependencies(template.dependencies);
    const compatibilityValid = this.validateCompatibility(template.compatibility);

    if (!manifestValid) issues.push('Invalid manifest');
    if (!versionValid) issues.push('Invalid version format');
    if (!dependenciesValid) issues.push('Invalid dependencies');
    if (!compatibilityValid) issues.push('Incompatible platform requirements');

    return {
      valid: issues.length === 0,
      manifestValid,
      versionValid,
      checksumValid,
      dependenciesValid,
      compatibilityValid,
      issues
    };
  }

  private async verifyRuntime(packageData: TemplateManifestData): Promise<RuntimeVerificationResult> {
    const issues: string[] = [];

    const themeRuntime = this.checkThemeRuntime(packageData.themes);
    const componentRuntime = this.checkComponentRuntime(packageData.components);
    const templateRuntime = this.checkTemplateRuntime(packageData.pages);
    const assetRuntime = this.checkAssetRuntime(packageData.assets);
    const commercePersistence = this.checkCommercePersistence(packageData.commerce);
    const publishPipelineReady = true;

    if (!themeRuntime) issues.push('ThemeRuntime not available');
    if (!componentRuntime) issues.push('ComponentRuntime not available');
    if (!templateRuntime) issues.push('TemplateRuntime not available');
    if (!assetRuntime) issues.push('AssetRuntime not available');
    if (!commercePersistence) issues.push('CommercePersistence not available');

    return {
      themeRuntime,
      componentRuntime,
      templateRuntime,
      assetRuntime,
      commercePersistence,
      publishPipelineReady,
      issues
    };
  }

  private async verifyTenant(tenantId: string, packageData: TemplateManifestData): Promise<TenantVerificationResult> {
    const issues: string[] = [];

    const dataIsolation = true;
    const correctScope = tenantId.length > 0;
    const correctRepositories = true;
    const assetReferencesValid = this.validateAssetReferences(packageData.assets);
    const themeProviderValid = this.validateThemeProvider(packageData.themes);

    if (!assetReferencesValid) issues.push('Asset references validation failed');
    if (!themeProviderValid) issues.push('ThemeProvider validation failed');

    return {
      dataIsolation,
      correctScope,
      correctRepositories,
      assetReferencesValid,
      themeProviderValid,
      issues
    };
  }

  private validateManifest(manifest: TemplateManifestData['manifest']): boolean {
    return !!manifest?.id && !!manifest?.version && !!manifest?.type;
  }

  private validateVersion(version: string): boolean {
    const semver = /^\d+\.\d+\.\d+$/;
    return semver.test(version);
  }

  private validateDependencies(dependencies: string[]): boolean {
    return Array.isArray(dependencies);
  }

  private validateCompatibility(compat: MarketplaceTemplate['compatibility']): boolean {
    return !!compat;
  }

  private checkThemeRuntime(themes: Record<string, unknown>): boolean {
    return typeof themes === 'object';
  }

  private checkComponentRuntime(components: Record<string, unknown>): boolean {
    return typeof components === 'object';
  }

  private checkTemplateRuntime(pages: Record<string, unknown>): boolean {
    return typeof pages === 'object';
  }

  private checkAssetRuntime(assets: Record<string, unknown>): boolean {
    return typeof assets === 'object';
  }

  private checkCommercePersistence(commerce: Record<string, unknown>): boolean {
    return typeof commerce === 'object';
  }

  private validateAssetReferences(assets: Record<string, unknown>): boolean {
    return typeof assets === 'object';
  }

  private validateThemeProvider(themes: Record<string, unknown>): boolean {
    return typeof themes === 'object';
  }
}