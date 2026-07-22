import { PublishRequest } from './PublishRequest';
import { PublishResult } from './PublishResult';
import { PublishStage } from './PublishStage';

export interface PublishPipeline {
  readonly name: string;
  readonly stages: ReadonlyArray<PublishStage>;
  
  execute(request: PublishRequest): Promise<PublishResult>;
  
  addStage(stage: PublishStage): PublishPipeline;
  
  removeStage(stageName: string): PublishPipeline;
  
  getStage(stageName: string): PublishStage | undefined;
}

export interface PublishPipelineBuilder {
  withStage(stage: PublishStage): PublishPipelineBuilder;
  
  withName(name: string): PublishPipelineBuilder;
  
  build(): PublishPipeline;
}
