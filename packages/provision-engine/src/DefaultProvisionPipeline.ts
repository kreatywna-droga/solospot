import { ProvisionPipeline, ProvisionPipelineBuilder } from './ProvisionPipeline';
import { ProvisionRequest } from './ProvisionRequest';
import { ProvisionResult, createProvisionResult } from './ProvisionResult';
import { ProvisionStage, StageResult } from './ProvisionStage';
import { ProvisionContext, createProvisionContext, extendProvisionContext } from './ProvisionContext';

export class DefaultProvisionPipeline implements ProvisionPipeline {
  readonly name: string;
  readonly stages: ReadonlyArray<ProvisionStage>;

  constructor(name = 'default-provision-pipeline', stages: ProvisionStage[] = []) {
    this.name = name;
    this.stages = stages;
  }

  async execute(request: ProvisionRequest): Promise<ProvisionResult> {
    let currentContext = createProvisionContext(request);
    const executedStages: ProvisionStage[] = [];
    const stageResults: StageResult[] = [];
    let success = true;
    const startOverall = Date.now();

    for (const stage of this.stages) {
      if (stage.canExecute && !stage.canExecute(currentContext)) {
        stageResults.push({
          stageName: stage.name,
          success: true,
          durationMs: 0,
          errors: [],
          data: { skipped: true }
        });
        continue;
      }

      const start = Date.now();
      executedStages.push(stage);

      try {
        currentContext = await stage.execute(currentContext);
        stageResults.push({
          stageName: stage.name,
          success: true,
          durationMs: Date.now() - start
        });
      } catch (err) {
        success = false;
        const durationMs = Date.now() - start;
        const errMsg = err instanceof Error ? err.message : String(err);

        stageResults.push({
          stageName: stage.name,
          success: false,
          durationMs,
          errors: [errMsg]
        });

        // Rollback executed stages in reverse order
        for (let i = executedStages.length - 1; i >= 0; i--) {
          const rollbackStage = executedStages[i];
          if (rollbackStage.rollback) {
            try {
              currentContext = await rollbackStage.rollback(currentContext);
            } catch (rollbackErr) {
              const rollbackErrMsg = rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);
              currentContext = extendProvisionContext(currentContext, {
                metadata: {
                  ...currentContext.metadata,
                  [`rollback_error_${rollbackStage.name}`]: rollbackErrMsg
                }
              });
            }
          }
        }
        break; // Stop execution
      }
    }

    const durationMs = Date.now() - startOverall;

    return createProvisionResult(
      success,
      request.correlationId,
      stageResults,
      success ? currentContext.storeConfig : undefined,
      success ? currentContext.deploymentUrl : undefined,
      durationMs,
      currentContext.metadata
    );
  }

  addStage(stage: ProvisionStage): ProvisionPipeline {
    return new DefaultProvisionPipeline(this.name, [...this.stages, stage]);
  }

  removeStage(stageName: string): ProvisionPipeline {
    return new DefaultProvisionPipeline(this.name, this.stages.filter(s => s.name !== stageName));
  }

  getStage(stageName: string): ProvisionStage | undefined {
    return this.stages.find(s => s.name === stageName);
  }
}

export class DefaultProvisionPipelineBuilder implements ProvisionPipelineBuilder {
  private stages: ProvisionStage[] = [];
  private pipelineName = 'default-provision-pipeline';

  withStage(stage: ProvisionStage): ProvisionPipelineBuilder {
    this.stages.push(stage);
    return this;
  }

  withName(name: string): ProvisionPipelineBuilder {
    this.pipelineName = name;
    return this;
  }

  build(): ProvisionPipeline {
    return new DefaultProvisionPipeline(this.pipelineName, this.stages);
  }
}

export function createProvisionPipelineBuilder(): ProvisionPipelineBuilder {
  return new DefaultProvisionPipelineBuilder();
}
