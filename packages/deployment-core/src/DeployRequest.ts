import { DeploymentTarget } from './DeploymentTarget';
import { PublishArtifact } from '../../publish-core/src/PublishArtifact';
import { AssetManifest } from '../../asset-builder/src/AssetTypes';

export interface DeployRequest {
  readonly target: DeploymentTarget;
  readonly artifacts: ReadonlyArray<PublishArtifact>;
  readonly manifest: AssetManifest;
  readonly correlationId: string;
  readonly metadata?: Record<string, unknown>;
}
