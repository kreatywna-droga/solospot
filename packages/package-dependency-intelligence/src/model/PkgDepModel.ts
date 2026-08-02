export interface PackageNode {
  name: string;
  version: string;
  path: string;
  dependencies: string[];
  devDependencies: string[];
}

export interface PackageDependency {
  sourcePackage: string;
  targetPackage: string;
  type: 'prod' | 'dev' | 'peer';
}

export interface DependencyCycle {
  cyclePath: string[];
}

export type DependencyIssueType = 'cycle' | 'orphan' | 'high_coupling' | 'unregistered';

export interface DependencyIssue {
  id: string;
  issueType: DependencyIssueType;
  severity: 'warning' | 'error' | 'critical';
  message: string;
  packageName?: string;
}

export interface DependencyGraph {
  nodes: Map<string, PackageNode>;
  dependencies: PackageDependency[];
}

export interface DependencyAssessment {
  totalPackages: number;
  cycleCount: number;
  orphanCount: number;
  highCouplingCount: number;
}
