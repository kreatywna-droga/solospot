export type VersionConstraint = string; // e.g. "^1.0.0", ">=2.0.0"

export interface PackageAuthor {
  name: string;
  email?: string;
  url?: string;
}

export interface PackageDependency {
  name: string;
  versionConstraint: VersionConstraint;
  optional?: boolean;
}

export interface PackageCapability {
  id: string;
  name: string;
  description?: string;
}

export interface PackageMetadata {
  description: string;
  license?: string;
  homepage?: string;
  tags?: string[];
  createdAt?: string;
}

export interface PackageManifest {
  id: string;
  name: string;
  version: string; // SemVer
  type: 'component' | 'plugin' | 'theme' | 'tool' | 'infrastructure';
  author: PackageAuthor;
  dependencies: PackageDependency[];
  capabilities: PackageCapability[];
  metadata: PackageMetadata;
}
