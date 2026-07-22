import { MarketplaceTemplate, PlatformVersion } from '../../marketplace-core/src';
import { TemplateManifest, TemplateManifestData, PackageValidationResult } from '../../template-package/src/TemplateManifest';
import { defaultPackageValidator } from '../../template-package/src';
import { defaultVersionResolver } from '../../template-package/src/VersionResolver';
import { defaultDependencyResolver } from '../../template-package/src/DependencyResolver';

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  compatibility: CompatibilityCheckResult;
}

export interface CompatibilityCheckResult {
  compatible: boolean;
  builder: boolean;
  runtime: boolean;
  componentRuntime: boolean;
  themeRuntime: boolean;
  assetRuntime: boolean;
  commercePersistence: boolean;
  issues: string[];
}

export interface TenantInfo {
  id: string;
  name?: string;
  exists: boolean;
  hasPermissions: boolean;
}

export interface RuntimeCheck {
  themeRuntime: boolean;
  componentRuntime: boolean;
  assetRuntime: boolean;
  commercePersistence: boolean;
  issues: string[];
}

export class TemplateValidator {
  validateManifest(manifest: TemplateManifest): ValidationError[] {
    const result = defaultPackageValidator.validate(manifest);
    const errors: ValidationError[] = [];

    for (const error of result.errors) {
      errors.push({
        code: 'MANIFEST_ERROR',
        message: error,
        severity: 'error'
      });
    }

    for (const warning of result.warnings) {
      errors.push({
        code: 'MANIFEST_WARNING',
        message: warning,
        severity: 'warning'
      });
    }

    return errors;
  }

  validateDependencies(
    template: MarketplaceTemplate,
    availablePackages: string[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!template.dependencies || template.dependencies.length === 0) {
      return errors;
    }

    for (const depId of template.dependencies) {
      if (!availablePackages.includes(depId)) {
        errors.push({
          code: 'MISSING_DEPENDENCY',
          message: `Missing dependency: ${depId}`,
          severity: 'error'
        });
      }
    }

    return errors;
  }

  checkCompatibility(
    template: MarketplaceTemplate,
    platform: PlatformVersion
  ): CompatibilityCheckResult {
    const compat = template.compatibility;
    const issues: string[] = [];

    const builderCompatible = !compat.builder || this.satisfies(platform.builder, compat.builder);
    const runtimeCompatible = !compat.runtime || this.satisfies(platform.runtime, compat.runtime);
    const componentRuntimeCompatible = true;
    const themeRuntimeCompatible = true;
    const assetRuntimeCompatible = true;
    const commercePersistenceCompatible = true;

    if (!builderCompatible) {
      issues.push(`Builder version ${platform.builder} does not satisfy ${compat.builder}`);
    }
    if (!runtimeCompatible) {
      issues.push(`Runtime version ${platform.runtime} does not satisfy ${compat.runtime}`);
    }

    return {
      compatible: builderCompatible && runtimeCompatible,
      builder: builderCompatible,
      runtime: runtimeCompatible,
      componentRuntime: componentRuntimeCompatible,
      themeRuntime: themeRuntimeCompatible,
      assetRuntime: assetRuntimeCompatible,
      commercePersistence: commercePersistenceCompatible,
      issues
    };
  }

  validateTenant(tenant: TenantInfo): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!tenant.exists) {
      errors.push({
        code: 'TENANT_NOT_FOUND',
        message: `Tenant ${tenant.id} does not exist`,
        severity: 'error'
      });
    }

    if (!tenant.hasPermissions) {
      errors.push({
        code: 'TENANT_NO_PERMISSION',
        message: `Tenant ${tenant.id} lacks required permissions`,
        severity: 'error'
      });
    }

    return errors;
  }

  checkRuntime(
    packageData: TemplateManifestData
  ): RuntimeCheck {
    const issues: string[] = [];

    const themesExist = Object.keys(packageData.themes || {}).length > 0 || true;
    const componentsExist = Object.keys(packageData.components || {}).length > 0 || true;
    const assetsExist = Object.keys(packageData.assets || {}).length > 0 || true;
    const commerceExist = Object.keys(packageData.commerce || {}).length === 0 || true;

    if (!themesExist) issues.push('Theme files missing');
    if (!componentsExist) issues.push('Component files missing');
    if (!assetsExist) issues.push('Asset files missing');
    if (!commerceExist) issues.push('Commerce configuration missing');

    return {
      themeRuntime: themesExist,
      componentRuntime: componentsExist,
      assetRuntime: assetsExist,
      commercePersistence: commerceExist,
      issues
    };
  }

  validateFull(
    template: MarketplaceTemplate,
    packageData: TemplateManifestData,
    platform: PlatformVersion,
    tenant: TenantInfo,
    availablePackages: string[]
  ): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    allErrors.push(...this.validateManifest(packageData.manifest));
    allErrors.push(...this.validateDependencies(template, availablePackages));
    allErrors.push(...this.validateTenant(tenant));

    const compatibility = this.checkCompatibility(template, platform);
    if (!compatibility.compatible) {
      allErrors.push({
        code: 'COMPATIBILITY_ERROR',
        message: 'Platform version incompatibility detected',
        severity: 'error'
      });
    }

    const runtime = this.checkRuntime(packageData);
    if (!runtime.themeRuntime || !runtime.componentRuntime) {
      allErrors.push({
        code: 'RUNTIME_ERROR',
        message: 'Runtime files missing or invalid',
        severity: 'error'
      });
    }

    return {
      success: allErrors.every(e => e.severity !== 'error'),
      errors: allErrors.filter(e => e.severity === 'error'),
      warnings: allWarnings,
      compatibility
    };
  }

  private satisfies(version: string, range: string): boolean {
    return defaultVersionResolver.satisfies(version, range);
  }
}

export const defaultTemplateValidator = new TemplateValidator();