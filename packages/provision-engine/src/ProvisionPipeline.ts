import { ProvisionStage } from './ProvisionStage';
import { ProvisionRequest } from './ProvisionRequest';
import { ProvisionResult } from './ProvisionResult';

export interface ProvisionPipeline {
  readonly name: string;
  readonly stages: ReadonlyArray<ProvisionStage>;
  execute(request: ProvisionRequest): Promise<ProvisionResult>;
  addStage(stage: ProvisionStage): ProvisionPipeline;
  removeStage(stageName: string): ProvisionPipeline;
  getStage(stageName: string): ProvisionStage | undefined;
}

export interface ProvisionPipelineBuilder {
  withStage(stage: ProvisionStage): ProvisionPipelineBuilder;
  withName(name: string): ProvisionPipelineBuilder;
  build(): ProvisionPipeline;
}
