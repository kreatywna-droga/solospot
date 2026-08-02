import { PackagePolicy, DEFAULT_MONOREPO_POLICY } from '../policies/PolicyEngine';

export interface WorkspacePackageInfo {
  name: string;
  path: string;
  version: string;
  isPrivate?: boolean;
  main?: string;
  types?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface GovernanceViolation {
  packagePath: string;
  policyId: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export class WorkspaceValidator {
  public static validatePackageName(name: string, policy: PackagePolicy = DEFAULT_MONOREPO_POLICY): boolean {
    if (!policy.naming.requiredScope) return true;
    return name.startsWith(`${policy.naming.requiredScope}/`);
  }

  public static validatePackageManifest(
    pkg: WorkspacePackageInfo,
    policy: PackagePolicy = DEFAULT_MONOREPO_POLICY
  ): GovernanceViolation[] {
    const violations: GovernanceViolation[] = [];

    // Naming scope check
    if (!WorkspaceValidator.validatePackageName(pkg.name, policy)) {
      violations.push({
        packagePath: pkg.path,
        policyId: policy.id,
        severity: 'error',
        message: `Package name '${pkg.name}' does not use required scope '${policy.naming.requiredScope}'.`,
      });
    }

    // Manifest completeness
    if (policy.exports.requireTypesDeclaration && (!pkg.types || pkg.types !== './src/index.ts')) {
      violations.push({
        packagePath: pkg.path,
        policyId: policy.id,
        severity: 'warning',
        message: `Package '${pkg.name}' is missing standard 'types' field in package.json.`,
      });
    }

    if (policy.versioning.enforcePrivateFlag && pkg.isPrivate !== true) {
      violations.push({
        packagePath: pkg.path,
        policyId: policy.id,
        severity: 'warning',
        message: `Package '${pkg.name}' is missing 'private: true' flag.`,
      });
    }

    return violations;
  }
}
