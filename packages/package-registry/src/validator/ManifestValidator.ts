import { PackageManifest } from '../manifest/PackageManifestModel';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export class ManifestValidator {
  public static readonly SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  public static validateSemver(version: string): boolean {
    return ManifestValidator.SEMVER_REGEX.test(version);
  }

  public static validateManifest(manifest: Partial<PackageManifest>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields check
    if (!manifest.id || typeof manifest.id !== 'string' || manifest.id.trim() === '') {
      errors.push({ field: 'id', message: 'Package ID is required.', code: 'MISSING_ID' });
    }

    if (!manifest.name || typeof manifest.name !== 'string' || manifest.name.trim() === '') {
      errors.push({ field: 'name', message: 'Package name is required.', code: 'MISSING_NAME' });
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      errors.push({ field: 'version', message: 'Package version is required.', code: 'MISSING_VERSION' });
    } else if (!ManifestValidator.validateSemver(manifest.version)) {
      errors.push({ field: 'version', message: `Invalid SemVer version string: '${manifest.version}'.`, code: 'INVALID_SEMVER' });
    }

    if (!manifest.type) {
      errors.push({ field: 'type', message: 'Package type is required.', code: 'MISSING_TYPE' });
    }

    if (!manifest.author || !manifest.author.name) {
      errors.push({ field: 'author', message: 'Package author name is required.', code: 'MISSING_AUTHOR' });
    }

    if (!manifest.metadata || !manifest.metadata.description) {
      warnings.push({ field: 'metadata.description', message: 'Package description is recommended.' });
    }

    // Dependencies check
    if (manifest.dependencies) {
      for (const dep of manifest.dependencies) {
        if (!dep.name || !dep.versionConstraint) {
          errors.push({ field: 'dependencies', message: 'Dependency must have name and versionConstraint.', code: 'INVALID_DEPENDENCY' });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public static validateRegistry(manifests: PackageManifest[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const seenIds = new Set<string>();

    for (const m of manifests) {
      const singleRes = ManifestValidator.validateManifest(m);
      errors.push(...singleRes.errors);
      warnings.push(...singleRes.warnings);

      if (seenIds.has(m.id)) {
        errors.push({ field: 'id', message: `Duplicate package ID detected: '${m.id}'.`, code: 'DUPLICATE_ID' });
      } else {
        seenIds.add(m.id);
      }
    }

    // Check missing dependencies
    for (const m of manifests) {
      if (m.dependencies) {
        for (const dep of m.dependencies) {
          if (!dep.optional && !seenIds.has(dep.name)) {
            warnings.push({ field: 'dependencies', message: `Package '${m.id}' depends on '${dep.name}' which is not registered in manifests.` });
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
