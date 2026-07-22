import { PublishEngine, PublishEngineEvent, PublishReport } from './PublishEngine';
import { PublishEngineDeps } from './PublishEngineDeps';
import { PublishRequest } from '../../publish-core/src/PublishRequest';
import { PublishResult, createPublishResult } from '../../publish-core/src/PublishResult';
import { PublishStage } from '../../publish-core/src/PublishStage';
import { PublishContext, extendPublishContext } from '../../publish-core/src/PublishContext';
import { PublishArtifact } from '../../publish-core/src/PublishArtifact';
import { StoreConfig } from '../../runtime-core/src/RuntimeContext';
import { AssetPipeline } from '../../asset-builder/src/AssetPipeline';
import { DeploymentRegistry } from '../../deployment-core/src/DeploymentRegistry';
import { DeploymentTarget } from '../../deployment-core/src/DeploymentTarget';
import { 
  DefaultPublishPipelineBuilder,
  CommerceStage,
  ManifestStage 
} from '../../publish-core/src/DefaultPublishPipeline';

// Integrated Validate Stage
export class IntegratedValidateStage implements PublishStage {
  readonly name = 'validate';
  constructor(
    private readonly loadStoreConfig: (tenantId: string, storeId: string) => Promise<StoreConfig>,
    private readonly resolveCommerceData?: (tenantId: string) => Promise<import('../../runtime-core/src/RuntimeContext').RuntimeProduct[]>
  ) {}

  async execute(context: PublishContext): Promise<PublishContext> {
    const { tenantId, storeId } = context.request;
    if (!tenantId || !storeId) {
      throw new Error('Validation failed: Missing tenantId or storeId');
    }
    const storeConfig = await this.loadStoreConfig(tenantId, storeId);

    return extendPublishContext(context, { storeConfig });
  }

  async rollback(context: PublishContext): Promise<PublishContext> {
    return extendPublishContext(context, { storeConfig: undefined });
  }
}

// Integrated Runtime Stage
export class IntegratedRuntimeStage implements PublishStage {
  readonly name = 'runtime-compile';
  constructor(
    private readonly renderPage?: (config: StoreConfig, page: import('../../runtime-core/src/RuntimeSection').RuntimePage) => Promise<string>,
    private readonly onEvent?: (event: PublishEngineEvent) => void
  ) {}

  async execute(context: PublishContext): Promise<PublishContext> {
    if (!context.storeConfig) {
      throw new Error('Runtime stage failed: Store config not loaded');
    }

    const pages = context.storeConfig.pages || [];
    const newArtifacts: PublishArtifact[] = [];

    for (const page of pages) {
      const html = this.renderPage
        ? await this.renderPage(context.storeConfig, page)
        : `<html><head><title>${page.name}</title></head><body><h1>${page.name}</h1></body></html>`;
      
      const encoder = new TextEncoder();
      const content = encoder.encode(html);
      newArtifacts.push({
        path: page.slug === '' ? 'index.html' : `${page.slug}/index.html`,
        contentType: 'text/html',
        content,
        size: content.byteLength,
        hash: `hash_page_${page.id}`
      });
    }

    const nextContext = extendPublishContext(context, {
      artifacts: [...context.artifacts, ...newArtifacts],
      metadata: {
        ...context.metadata,
        pagesCount: pages.length
      }
    });

    this.onEvent?.({
      type: 'RuntimeCompleted',
      correlationId: context.request.correlationId,
      timestamp: new Date().toISOString(),
      metadata: { pagesCount: pages.length }
    });

    return nextContext;
  }

  async rollback(context: PublishContext): Promise<PublishContext> {
    return extendPublishContext(context, {
      artifacts: context.artifacts.filter(a => a.contentType !== 'text/html')
    });
  }
}

// Integrated Asset Stage
export class IntegratedAssetStage implements PublishStage {
  readonly name = 'asset-build';
  constructor(
    private readonly assetPipeline: AssetPipeline,
    private readonly onEvent?: (event: PublishEngineEvent) => void
  ) {}

  async execute(context: PublishContext): Promise<PublishContext> {
    const processedArtifacts = await this.assetPipeline.process(context);

    const manifestArtifact = processedArtifacts.find(a => a.path === 'manifest.json');
    let manifestObj: any = undefined;
    if (manifestArtifact) {
      const decoder = new TextDecoder();
      manifestObj = JSON.parse(decoder.decode(manifestArtifact.content as Uint8Array));
    }

    const buildId = manifestObj?.buildId || Date.now().toString();

    const nextContext = extendPublishContext(context, {
      artifacts: processedArtifacts,
      manifest: manifestObj,
      metadata: {
        ...context.metadata,
        buildId
      }
    });

    this.onEvent?.({
      type: 'AssetsBuilt',
      correlationId: context.request.correlationId,
      timestamp: new Date().toISOString(),
      metadata: { 
        artifactsCount: processedArtifacts.length,
        buildId
      }
    });

    return nextContext;
  }

  async rollback(context: PublishContext): Promise<PublishContext> {
    return extendPublishContext(context, {
      artifacts: []
    });
  }
}

// Integrated Deploy Stage
export class IntegratedDeployStage implements PublishStage {
  readonly name = 'deploy';
  private lastUsedProvider?: any;
  private lastDeployRequest?: any;

  constructor(
    private readonly deploymentRegistry: DeploymentRegistry,
    private readonly resolveDeploymentTarget: (tenantId: string, storeId: string, mode: string) => Promise<DeploymentTarget>,
    private readonly onEvent?: (event: PublishEngineEvent) => void
  ) {}

  async execute(context: PublishContext): Promise<PublishContext> {
    const { tenantId, storeId, mode } = context.request;
    const target = await this.resolveDeploymentTarget(tenantId, storeId, mode);
    const provider = this.deploymentRegistry.resolve(target);

    this.onEvent?.({
      type: 'DeploymentStarted',
      correlationId: context.request.correlationId,
      timestamp: new Date().toISOString(),
      metadata: { providerType: provider.type, targetDestination: target.destination }
    });

    const deployRequest = {
      target,
      artifacts: context.artifacts,
      manifest: context.manifest as any,
      correlationId: context.request.correlationId,
      metadata: context.metadata
    };

    this.lastUsedProvider = provider;
    this.lastDeployRequest = deployRequest;

    const deployResult = await provider.deploy(deployRequest);
    if (!deployResult.success) {
      throw new Error(`Deployment failed: ${deployResult.errors.join('; ')}`);
    }

    this.onEvent?.({
      type: 'DeploymentCompleted',
      correlationId: context.request.correlationId,
      timestamp: new Date().toISOString(),
      metadata: { url: deployResult.url, durationMs: deployResult.durationMs }
    });

    context.metadata.providerType = provider.type;

    return extendPublishContext(context, {
      deploymentUrl: deployResult.url
    });
  }

  async rollback(context: PublishContext): Promise<PublishContext> {
    if (this.lastUsedProvider && this.lastUsedProvider.rollback && this.lastDeployRequest) {
      await this.lastUsedProvider.rollback(this.lastDeployRequest);
    }
    return extendPublishContext(context, {
      deploymentUrl: undefined
    });
  }
}

export class DefaultPublishEngine implements PublishEngine {
  constructor(private readonly deps: PublishEngineDeps) {}

  async publish(request: PublishRequest): Promise<PublishResult> {
    const startTime = Date.now();

    this.deps.onEvent?.({
      type: 'PublishStarted',
      correlationId: request.correlationId,
      timestamp: new Date().toISOString()
    });

    // 1. Assemble integrated stages using DefaultPublishPipelineBuilder
    const pipeline = new DefaultPublishPipelineBuilder()
      .withDeps({ 
        loadStoreConfig: this.deps.loadStoreConfig,
        resolveCommerceData: this.deps.resolveCommerceData,
        renderPage: this.deps.renderPage
      })
      .withStage(new IntegratedValidateStage(this.deps.loadStoreConfig, this.deps.resolveCommerceData))
      .withStage(new CommerceStage(this.deps.resolveCommerceData))
      .withStage(new IntegratedRuntimeStage(this.deps.renderPage, this.deps.onEvent))
      .withStage(new IntegratedAssetStage(this.deps.assetPipeline, this.deps.onEvent))
      .withStage(new IntegratedDeployStage(this.deps.deploymentRegistry, this.deps.resolveDeploymentTarget, this.deps.onEvent))
      .build();

    // 2. Execute pipeline
    const result = await pipeline.execute(request);
    const durationMs = Date.now() - startTime;

    // 3. Extract metadata details
    const pagesCount = result.metadata?.pagesCount || 0;
    const providerType = (result.metadata?.providerType as string) || 'unknown';
    const buildId = (result.metadata?.buildId as string) || `build_${Date.now()}`;

    // 4. Generate PublishReport
    const report: PublishReport = {
      buildId,
      correlationId: request.correlationId,
      pagesCount: Number(pagesCount),
      artifactsCount: result.artifactsCount,
      durationMs,
      providerType,
      deploymentUrl: result.deploymentUrl,
      status: result.success ? 'SUCCESS' : 'FAILED',
      error: result.errors[0]
    };

    const finalMetadata = {
      ...result.metadata,
      publishReport: report
    };

    // 5. Emit final event
    if (result.success) {
      this.deps.onEvent?.({
        type: 'PublishCompleted',
        correlationId: request.correlationId,
        timestamp: new Date().toISOString(),
        metadata: { report }
      });
    } else {
      this.deps.onEvent?.({
        type: 'PublishFailed',
        correlationId: request.correlationId,
        timestamp: new Date().toISOString(),
        error: result.errors[0],
        metadata: { report }
      });
    }

    return createPublishResult(
      result.success,
      result.correlationId,
      result.stageResults as any,
      result.deploymentUrl,
      result.artifactsCount,
      finalMetadata
    );
  }
}
