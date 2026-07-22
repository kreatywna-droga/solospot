import { PackageManifest } from '../PackageManifest';

export interface InstallationPlan {
  readonly steps: ReadonlyArray<{
    readonly packageId: string;
    readonly manifest: PackageManifest;
    readonly content: Uint8Array;
  }>;
  readonly capabilities: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
  readonly migrationRequired: boolean;
}
