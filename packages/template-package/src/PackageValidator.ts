import { TemplateManifest, PackageValidationResult } from './TemplateManifest';
import { TemplatePackage, TemplatePackageInstance } from './TemplatePackage';

export class PackageValidator {
  private static readonly REQUIRED_FIELDS = ['id', 'version', 'name', 'type', 'author'];
  private static readonly VALID_TYPES = ['storefront', 'theme', 'component', 'page'];

  validate(manifest: TemplateManifest): PackageValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of PackageValidator.REQUIRED_FIELDS) {
      if (!(field in manifest) || !manifest[field as keyof TemplateManifest]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    if (manifest.type && !PackageValidator.VALID_TYPES.includes(manifest.type)) {
      errors.push(`Invalid type: ${manifest.type}. Must be one of: ${PackageValidator.VALID_TYPES.join(', ')}`);
    }

    if (manifest.version) {
      const semver = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
      if (!semver.test(manifest.version)) {
        errors.push(`Invalid semver: ${manifest.version}`);
      }
    }

    if (manifest.price?.amount !== undefined && manifest.price.amount < 0) {
      errors.push('Price amount cannot be negative');
    }

    if (manifest.compatibility) {
      if (manifest.compatibility.builder && !this.isValidVersionRange(manifest.compatibility.builder)) {
        warnings.push(`Builder compatibility range may be invalid: ${manifest.compatibility.builder}`);
      }
      if (manifest.compatibility.runtime && !this.isValidVersionRange(manifest.compatibility.runtime)) {
        warnings.push(`Runtime compatibility range may be invalid: ${manifest.compatibility.runtime}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  validatePackage(pkg: TemplatePackage): PackageValidationResult {
    const manifestResult = this.validate(pkg.manifest);
    return manifestResult;
  }

  validateInstance(instance: TemplatePackageInstance): PackageValidationResult {
    return instance.validate();
  }

  private isValidVersionRange(range: string): boolean {
    const semverRange = /^(\d+\.\d+\.\d+|\^?\d+\.\d+\.\d+)(?:\s*,\s*\d+\.\d+\.\d+)*$/;
    return semverRange.test(range);
  }
}

export const defaultPackageValidator = new PackageValidator();