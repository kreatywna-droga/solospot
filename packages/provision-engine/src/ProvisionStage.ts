import { ProvisionContext } from './ProvisionContext';

export interface StageResult {
  readonly stageName: string;
  readonly success: boolean;
  readonly durationMs: number;
  readonly errors?: ReadonlyArray<string>;
  readonly data?: Record<string, unknown>;
}

export interface ProvisionStage {
  readonly name: string;
  execute(context: ProvisionContext): Promise<ProvisionContext>;
  rollback?(context: ProvisionContext): Promise<ProvisionContext>;
  canExecute?(context: ProvisionContext): boolean;
}
