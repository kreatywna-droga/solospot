import { PublishContext } from '../../publish-core/src/PublishContext';
import { PublishArtifact } from '../../publish-core/src/PublishArtifact';

export interface AssetBuilder {
  build(context: PublishContext): Promise<PublishArtifact[]>;
}
