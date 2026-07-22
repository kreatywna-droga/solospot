import { PipelineContext } from './PipelineContext';
import { PipelineStage, PipelineResult } from './PipelineStage';
import { PipelineRequest } from './PipelineRequest';

export interface RuntimePipeline {
  readonly name: string;
  readonly stages: PipelineStage[];
  
  execute(request: PipelineRequest): Promise<PipelineResult>;
  
  addStage(stage: PipelineStage): RuntimePipeline;
  
  removeStage(stageName: string): RuntimePipeline;
  
  getStage(stageName: string): PipelineStage | undefined;
}

export interface PipelineBuilder {
  withStage(stage: PipelineStage): PipelineBuilder;
  
  build(): RuntimePipeline;
}