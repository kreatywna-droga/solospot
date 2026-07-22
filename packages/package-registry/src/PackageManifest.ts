import { PackageType } from './PackageType';

export interface PackageManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string; // semver
  readonly type: PackageType;
  readonly dependencies: Record<string, string>; // packageId -> semver constraint
  readonly capabilities: ReadonlyArray<string>; // capability tags
  readonly compatibility: {
    readonly coreVersion: string;
  };
  readonly author: string;
  readonly license: string;
  readonly signature?: string;
  readonly hash?: string;
  readonly deprecated?: boolean;
  readonly deprecatedSince?: string;
  readonly replacement?: string;
  readonly removalVersion?: string;
  readonly migrations?: ReadonlyArray<{
    readonly from: string;
    readonly to: string;
    readonly description: string;
  }>;
}
