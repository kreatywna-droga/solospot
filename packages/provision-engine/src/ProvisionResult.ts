import { StageResult } from './ProvisionStage';
import { StoreConfig } from '../../runtime-core/src/RuntimeContext';

export interface ProvisionResult {
  readonly success: boolean;
  readonly correlationId: string;
  readonly storeConfig?: StoreConfig;
  readonly deploymentUrl?: string;
  readonly durationMs: number;
  readonly errors: ReadonlyArray<string>;
  readonly stageResults: ReadonlyArray<StageResult>;
  readonly metadata?: Record<string, unknown>;
}

export function createProvisionResult(
  success: boolean,
  correlationId: string,
  stageResults: ReadonlyArray<StageResult>,
  storeConfig?: StoreConfig,
  deploymentUrl?: string,
  durationMs: number = 0,
  metadata?: Record<string, unknown>
): ProvisionResult {
  return {
    success,
    correlationId,
    storeConfig,
    deploymentUrl,
    durationMs,
    errors: stageResults.flatMap(s => s.errors || []),
    stageResults,
    metadata
  };
}
