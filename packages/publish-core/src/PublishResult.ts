import { StageResult } from './PublishStage';

export interface PublishResult {
  readonly success: boolean;
  readonly correlationId: string;
  readonly deploymentUrl?: string;
  readonly artifactsCount: number;
  readonly errors: ReadonlyArray<string>;
  readonly stageResults: ReadonlyArray<StageResult>;
  readonly metadata?: Record<string, unknown>;
}

export function createPublishResult(
  success: boolean,
  correlationId: string,
  stageResults: StageResult[],
  deploymentUrl?: string,
  artifactsCount: number = 0,
  metadata?: Record<string, unknown>
): PublishResult {
  return {
    success,
    correlationId,
    deploymentUrl,
    artifactsCount,
    errors: stageResults.flatMap(s => s.errors || []),
    stageResults,
    metadata,
  };
}
