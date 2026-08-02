export type PackageCategory = 'infrastructure' | 'ui' | 'sdk' | 'tooling' | 'core';

export interface NamingPolicy {
  requiredScope: string; // e.g. "@web-factor"
  enforceKebabCase: boolean;
}

export interface VersionPolicy {
  requireSemVer: boolean;
  enforcePrivateFlag: boolean;
}

export interface ExportPolicy {
  requireIndexTs: boolean;
  requireTypesDeclaration: boolean;
}

export interface DependencyPolicy {
  disallowWildcardDependencies: boolean;
}

export interface PackagePolicy {
  id: string;
  name: string;
  category: PackageCategory;
  naming: NamingPolicy;
  versioning: VersionPolicy;
  exports: ExportPolicy;
  dependencies: DependencyPolicy;
}

export const DEFAULT_MONOREPO_POLICY: PackagePolicy = {
  id: 'pol-web-factor-standard',
  name: 'WEB FACTOR Standard Monorepo Policy',
  category: 'infrastructure',
  naming: {
    requiredScope: '@web-factor',
    enforceKebabCase: true,
  },
  versioning: {
    requireSemVer: true,
    enforcePrivateFlag: true,
  },
  exports: {
    requireIndexTs: true,
    requireTypesDeclaration: true,
  },
  dependencies: {
    disallowWildcardDependencies: false,
  },
};
