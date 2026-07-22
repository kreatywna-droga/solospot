import { PublishArtifact } from '../../publish-core/src/PublishArtifact';

export interface AssetOptimizer {
  optimize(artifact: PublishArtifact): Promise<PublishArtifact>;
}

export class NoOpAssetOptimizer implements AssetOptimizer {
  async optimize(artifact: PublishArtifact): Promise<PublishArtifact> {
    return artifact;
  }
}
