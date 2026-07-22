import { ProvisionEngine, ProvisionEngineEvent } from './ProvisionEngine';
import { ProvisionRequest } from './ProvisionRequest';
import { ProvisionResult, createProvisionResult } from './ProvisionResult';
import { ProvisionPipeline } from './ProvisionPipeline';
import { createProvisionContext, extendProvisionContext } from './ProvisionContext';
import { PublishEngine } from '../../publish-engine/src/PublishEngine';
import { createPublishRequest } from '../../publish-core/src/PublishRequest';
import { StoreConfig } from '../../runtime-core/src/RuntimeContext';

export class DefaultProvisionEngine implements ProvisionEngine {
  private readonly pipeline: ProvisionPipeline;
  private readonly publishEngine: PublishEngine;
  private readonly provisionedConfigs = new Map<string, StoreConfig>();
  private readonly onEvent?: (event: ProvisionEngineEvent) => void;

  constructor(params: {
    pipeline: ProvisionPipeline;
    publishEngine: PublishEngine;
    onEvent?: (event: ProvisionEngineEvent) => void;
  }) {
    this.pipeline = params.pipeline;
    this.publishEngine = params.publishEngine;
    this.onEvent = params.onEvent;
  }

  /**
   * Allows external components (like the PublishEngine's loadStoreConfig dependency)
   * to resolve store configurations currently in-flight during the provisioning process.
   */
  getProvisionedConfig(storeId: string): StoreConfig | undefined {
    return this.provisionedConfigs.get(storeId);
  }

  async provision(request: ProvisionRequest): Promise<ProvisionResult> {
    const startOverall = Date.now();
    
    this.onEvent?.({
      type: 'ProvisionStarted',
      tenantId: request.tenantId,
      correlationId: request.correlationId,
      timestamp: new Date().toISOString()
    });

    const result = await this.pipeline.execute(request);
    
    if (!result.success || !result.storeConfig) {
      // Loop through stage results to find the failure
      const failedStage = result.stageResults.find(r => !r.success);
      
      this.onEvent?.({
        type: 'ProvisionFailed',
        tenantId: request.tenantId,
        correlationId: request.correlationId,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startOverall,
        stage: failedStage?.stageName || 'pipeline',
        error: result.errors.join(', ')
      });
      
      return result;
    }

    // Emit success events for pipeline stages
    for (const stageRes of result.stageResults) {
      if (stageRes.success) {
        const eventTypeMap: Record<string, ProvisionEngineEvent['type']> = {
          tenant: 'TenantCreated',
          template: 'TemplateInstalled',
          packages: 'PackagesInstalled',
          'store-config': 'StoreConfigGenerated'
        };
        const type = eventTypeMap[stageRes.stageName];
        if (type) {
          this.onEvent?.({
            type,
            tenantId: request.tenantId,
            correlationId: request.correlationId,
            timestamp: new Date().toISOString(),
            durationMs: stageRes.durationMs
          });
        }
      }
    }

    // Temporarily cache the storeConfig so that PublishEngine's loadStoreConfig call can resolve it
    this.provisionedConfigs.set(request.storeId, result.storeConfig);

    try {
      this.onEvent?.({
        type: 'PublishStarted',
        tenantId: request.tenantId,
        correlationId: request.correlationId,
        timestamp: new Date().toISOString()
      });

      const publishRequest = createPublishRequest({
        tenantId: request.tenantId,
        storeId: request.storeId,
        mode: request.mode === 'LIVE' ? 'LIVE' : 'PREVIEW',
        correlationId: request.correlationId,
        metadata: {
          ...request.metadata,
          storeConfig: result.storeConfig
        }
      });

      const publishResult = await this.publishEngine.publish(publishRequest);

      if (!publishResult.success) {
        // Rollback all executed stages in reverse LIFO order
        let currentContext = createProvisionContext(request);
        currentContext = extendProvisionContext(currentContext, {
          storeConfig: result.storeConfig,
          installedPackages: request.initialPackages,
          metadata: result.metadata || {}
        });

        for (let i = this.pipeline.stages.length - 1; i >= 0; i--) {
          const stage = this.pipeline.stages[i];
          if (stage.rollback) {
            try {
              currentContext = await stage.rollback(currentContext);
            } catch (rollbackErr) {
              // Non-blocking rollback error tracking
            }
          }
        }

        const publishErrors = publishResult.errors || ['Publishing failed during provisioning'];
        
        this.onEvent?.({
          type: 'ProvisionFailed',
          tenantId: request.tenantId,
          correlationId: request.correlationId,
          timestamp: new Date().toISOString(),
          durationMs: Date.now() - startOverall,
          stage: 'publish',
          error: publishErrors.join(', ')
        });

        return createProvisionResult(
          false,
          request.correlationId,
          [
            ...result.stageResults,
            {
              stageName: 'publish-integration',
              success: false,
              durationMs: 0,
              errors: publishErrors
            }
          ],
          undefined,
          undefined,
          result.durationMs,
          result.metadata
        );
      }

      // Successful publish events
      this.onEvent?.({
        type: 'AssetsBuilt',
        tenantId: request.tenantId,
        correlationId: request.correlationId,
        timestamp: new Date().toISOString()
      });

      this.onEvent?.({
        type: 'DeploymentCompleted',
        tenantId: request.tenantId,
        correlationId: request.correlationId,
        timestamp: new Date().toISOString()
      });

      const overallDuration = Date.now() - startOverall;
      this.onEvent?.({
        type: 'ProvisionCompleted',
        tenantId: request.tenantId,
        correlationId: request.correlationId,
        timestamp: new Date().toISOString(),
        durationMs: overallDuration
      });

      // Successful Provision & Publish Flow
      return createProvisionResult(
        true,
        request.correlationId,
        result.stageResults,
        result.storeConfig,
        publishResult.deploymentUrl,
        result.durationMs,
        {
          ...result.metadata,
          publishReport: publishResult.metadata?.publishReport
        }
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      
      this.onEvent?.({
        type: 'ProvisionFailed',
        tenantId: request.tenantId,
        correlationId: request.correlationId,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startOverall,
        stage: 'publish',
        error: errMsg
      });
      
      throw err;
    } finally {
      // Clean up cache
      this.provisionedConfigs.delete(request.storeId);
    }
  }
}
