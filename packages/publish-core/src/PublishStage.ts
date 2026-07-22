import { PublishContext } from './PublishContext';

export interface StageResult {
  readonly stageName: string;
  readonly success: boolean;
  readonly durationMs: number;
  readonly errors?: ReadonlyArray<string>;
  readonly data?: unknown;
}

export interface PublishStage {
  readonly name: string;
  execute(context: PublishContext): Promise<PublishContext>;
  canExecute?(context: PublishContext): boolean;
  rollback?(context: PublishContext): Promise<PublishContext>;
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
