import { WorkspacePackageInfo, WorkspaceValidator, GovernanceViolation } from '../workspace/WorkspaceValidator';
import { PackagePolicy, DEFAULT_MONOREPO_POLICY } from '../policies/PolicyEngine';

export interface GovernanceAnalysisResult {
  totalPackagesCount: number;
  compliantPackagesCount: number;
  violations: GovernanceViolation[];
}

export class GovernanceAnalyzer {
  public static analyzeWorkspace(
    packages: WorkspacePackageInfo[],
    policy: PackagePolicy = DEFAULT_MONOREPO_POLICY
  ): GovernanceAnalysisResult {
    const violations: GovernanceViolation[] = [];
    const nonCompliantPackages = new Set<string>();

    for (const pkg of packages) {
      const pkgViolations = WorkspaceValidator.validatePackageManifest(pkg, policy);
      if (pkgViolations.length > 0) {
        nonCompliantPackages.add(pkg.path);
        violations.push(...pkgViolations);
      }
    }

    const totalPackagesCount = packages.length;
    const compliantPackagesCount = totalPackagesCount - nonCompliantPackages.size;

    return {
      totalPackagesCount,
      compliantPackagesCount,
      violations,
    };
  }
}
