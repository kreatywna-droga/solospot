import { PublishRequest } from '../../publish-core/src/PublishRequest';
import { PublishResult } from '../../publish-core/src/PublishResult';

export type PublishEngineEventType =
  | 'PublishStarted'
  | 'RuntimeCompleted'
  | 'AssetsBuilt'
  | 'DeploymentStarted'
  | 'DeploymentCompleted'
  | 'PublishCompleted'
  | 'PublishFailed';

export interface PublishEngineEvent {
  readonly type: PublishEngineEventType;
  readonly correlationId: string;
  readonly timestamp: string;
  readonly metadata?: Record<string, unknown>;
  readonly error?: string;
}

export interface PublishReport {
  readonly buildId: string;
  readonly correlationId: string;
  readonly pagesCount: number;
  readonly artifactsCount: number;
  readonly durationMs: number;
  readonly providerType: string;
  readonly deploymentUrl?: string;
  readonly status: 'SUCCESS' | 'FAILED';
  readonly error?: string;
}

export interface PublishEngine {
  publish(request: PublishRequest): Promise<PublishResult>;
}
