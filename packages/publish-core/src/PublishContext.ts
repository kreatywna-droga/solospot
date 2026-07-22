import { StoreConfig } from '../../runtime-core/src/RuntimeContext';
import { PublishRequest } from './PublishRequest';
import { PublishArtifact } from './PublishArtifact';

export interface PublishContext {
  readonly request: PublishRequest;
  readonly storeConfig?: StoreConfig;
  readonly artifacts: ReadonlyArray<PublishArtifact>;
  readonly manifest?: Record<string, unknown>;
  readonly deploymentUrl?: string;
  readonly metadata: Record<string, unknown>;
}

export function createPublishContext(
  request: PublishRequest,
  storeConfig?: StoreConfig,
  initialMetadata?: Record<string, unknown>
): PublishContext {
  return {
    request,
    storeConfig,
    artifacts: [],
    metadata: initialMetadata || {},
  };
}

export function extendPublishContext(
  context: PublishContext,
  updates: Partial<Omit<PublishContext, 'request'>>
): PublishContext {
  return {
    ...context,
    ...updates,
    metadata: {
      ...context.metadata,
      ...updates.metadata,
    },
  };
}
