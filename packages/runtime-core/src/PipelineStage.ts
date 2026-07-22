export type { PipelineContext } from './PipelineContext';
import { PipelineContext } from './PipelineContext';

export interface PipelineStage<Input = unknown, Output = unknown> {
  readonly name: string;
  readonly execute: (input: Input, context: PipelineContext) => Promise<Output>;
  readonly canExecute?: (context: PipelineContext) => boolean;
  readonly rollback?: (output: Output, context: PipelineContext) => Promise<void>;
}

export interface PipelineResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly errors: ReadonlyArray<string>;
  readonly stageResults: ReadonlyArray<StageResult>;
  readonly metadata?: Record<string, unknown>;
}

export interface StageResult {
  readonly stageName: string;
  readonly success: boolean;
  readonly durationMs: number;
  readonly errors?: ReadonlyArray<string>;
  readonly data?: unknown;
}

export function createPipelineResult<T>(
  success: boolean,
  data: T | undefined,
  stageResults: StageResult[],
  metadata?: Record<string, unknown>
): PipelineResult<T> {
  return {
    success,
    data,
    errors: stageResults.flatMap(s => s.errors || []),
    stageResults,
    metadata,
  };
}

export function createStageResult(
  stageName: string,
  success: boolean,
  durationMs: number,
  errors?: string[],
  data?: unknown
): StageResult {
  return { stageName, success, durationMs, errors, data };
}