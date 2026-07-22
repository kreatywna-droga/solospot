import { PublishPipeline, PublishPipelineBuilder } from './PublishPipeline';
import { PublishRequest } from './PublishRequest';
import { PublishResult, createPublishResult } from './PublishResult';
import { PublishStage, StageResult } from './PublishStage';
import { PublishContext, createPublishContext, extendPublishContext } from './PublishContext';
import { PublishArtifact } from './PublishArtifact';
import { StoreConfig, RuntimeProduct } from '../../runtime-core/src/RuntimeContext';
import { RuntimePage } from '../../runtime-core/src/RuntimeSection';

export interface PublishPipelineDeps {
  readonly loadStoreConfig: (tenantId: string, storeId: string) => Promise<StoreConfig>;
  /**
   * C9.5/C9→C10: resolves live commerce products for a tenant and maps them
   * to RuntimeProduct[]. Injected by publish-engine so publish-core stays
   * decoupled from commerce-persistence / Supabase.
   */
  readonly resolveCommerceData?: (tenantId: string) => Promise<RuntimeProduct[]>;
  /**
   * Real page renderer (TemplateRuntime). Injected by publish-engine. When
   * omitted, RuntimeStage falls back to a minimal placeholder (legacy).
   */
  readonly renderPage?: (config: StoreConfig, page: RuntimePage) => Promise<string>;
}

export class ValidateStage implements PublishStage {
  readonly name = 'validate';
  private readonly loadStoreConfig: (tenantId: string, storeId: string) => Promise<StoreConfig>;

  constructor(loadStoreConfig: (tenantId: string, storeId: string) => Promise<StoreConfig>) {
    this.loadStoreConfig = loadStoreConfig;
  }

  async execute(context: PublishContext): Promise<PublishContext> {
    const { tenantId, storeId } = context.request;
    if (!tenantId || !storeId) {
      throw new Error('Validation failed: Missing tenantId or storeId in request');
    }

    try {
      const storeConfig = await this.loadStoreConfig(tenantId, storeId);
      return extendPublishContext(context, { storeConfig });
    } catch (err) {
      throw new Error(`Validation failed: Config could not be loaded. ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async rollback(context: PublishContext): Promise<PublishContext> {
    return extendPublishContext(context, { storeConfig: undefined });
  }
}

export class CommerceStage implements PublishStage {
  readonly name = 'commerce-resolve';
  private readonly resolveCommerceData?: (tenantId: string) => Promise<RuntimeProduct[]>;

  constructor(resolveCommerceData?: (tenantId: string) => Promise<RuntimeProduct[]>) {
    this.resolveCommerceData = resolveCommerceData;
  }

  async execute(context: PublishContext): Promise<PublishContext> {
    if (!context.storeConfig) {
      throw new Error('Commerce resolution failed: Store config is not resolved');
    }
    if (!this.resolveCommerceData) {
      // No commerce resolver wired — keep config as-is (backward compatible).
      return context;
    }

    const products = await this.resolveCommerceData(context.request.tenantId);
    const enrichedConfig: StoreConfig = {
      ...context.storeConfig,
      products,
    };

    return extendPublishContext(context, { storeConfig: enrichedConfig });
  }

  async rollback(context: PublishContext): Promise<PublishContext> {
    return context;
  }
}

export class RuntimeStage implements PublishStage {
  readonly name = 'runtime-compile';
  private readonly renderPage?: (config: StoreConfig, page: RuntimePage) => Promise<string>;

  constructor(renderPage?: (config: StoreConfig, page: RuntimePage) => Promise<string>) {
    this.renderPage = renderPage;
  }

  async execute(context: PublishContext): Promise<PublishContext> {
    if (!context.storeConfig) {
      throw new Error('Runtime compilation failed: Store config is not resolved');
    }

    const pages = context.storeConfig.pages || [];
    const newArtifacts: PublishArtifact[] = await Promise.all(pages.map(async page => {
      const htmlContent = this.renderPage
        ? await this.renderPage(context.storeConfig!, page)
        : this.placeholderHtml(page);
      const encoder = new TextEncoder();
      const contentBytes = encoder.encode(htmlContent);
      return {
        path: page.slug === '' ? 'index.html' : `${page.slug}/index.html`,
        contentType: 'text/html',
        content: contentBytes,
        size: contentBytes.byteLength,
        hash: `hash_${page.slug || 'home'}_${Date.now()}`
      };
    }));

    return extendPublishContext(context, {
      artifacts: [...context.artifacts, ...newArtifacts]
    });
  }

  private placeholderHtml(page: RuntimePage): string {
    return `<html><head><title>${page.name || 'Store Page'}</title></head><body><div id="root">Rendered content for ${page.slug || 'home'}</div></body></html>`;
  }

  async rollback(context: PublishContext): Promise<PublishContext> {
    const filteredArtifacts = context.artifacts.filter(a => !a.path.endsWith('.html'));
    return extendPublishContext(context, { artifacts: filteredArtifacts });
  }
}

export class AssetStage implements PublishStage {
  readonly name = 'asset-build';

  async execute(context: PublishContext): Promise<PublishContext> {
    const cssContent = `/* Web Factor Generated CSS for ${context.request.storeId} */\nbody { font-family: sans-serif; }`;
    const jsContent = `// Web Factor Generated JS for ${context.request.storeId}\nconsole.log("Store loaded");`;

    const encoder = new TextEncoder();
    const cssBytes = encoder.encode(cssContent);
    const jsBytes = encoder.encode(jsContent);

    const assetArtifacts: PublishArtifact[] = [
      {
        path: 'assets/main.css',
        contentType: 'text/css',
        content: cssBytes,
        size: cssBytes.byteLength,
        hash: `hash_css_${Date.now()}`
      },
      {
        path: 'assets/main.js',
        contentType: 'application/javascript',
        content: jsBytes,
        size: jsBytes.byteLength,
        hash: `hash_js_${Date.now()}`
      }
    ];

    return extendPublishContext(context, {
      artifacts: [...context.artifacts, ...assetArtifacts]
    });
  }

  async rollback(context: PublishContext): Promise<PublishContext> {
    const filteredArtifacts = context.artifacts.filter(a => !a.path.startsWith('assets/'));
    return extendPublishContext(context, { artifacts: filteredArtifacts });
  }
}

export class ManifestStage implements PublishStage {
  readonly name = 'manifest-build';

  async execute(context: PublishContext): Promise<PublishContext> {
    const pages = context.storeConfig?.pages || [];
    const assets = context.artifacts.filter(a => a.contentType !== 'text/html');
    
    const manifestObj = {
      storeId: context.request.storeId,
      tenantId: context.request.tenantId,
      mode: context.request.mode,
      timestamp: new Date().toISOString(),
      pages: pages.map(p => ({ id: p.id, slug: p.slug, name: p.name })),
      assets: assets.filter(a => a.path !== 'manifest.json').map(a => ({ path: a.path, type: a.contentType, size: a.size })),
      files: context.artifacts.map(a => ({
        path: a.path,
        size: a.size,
        contentType: a.contentType,
        hash: a.hash
      }))
    };

    const manifestContent = JSON.stringify(manifestObj, null, 2);
    const encoder = new TextEncoder();
    const manifestBytes = encoder.encode(manifestContent);

    const manifestArtifact: PublishArtifact = {
      path: 'manifest.json',
      contentType: 'application/json',
      content: manifestBytes,
      size: manifestBytes.byteLength,
      hash: `hash_manifest_${Date.now()}`
    };

    return extendPublishContext(context, {
      manifest: manifestObj,
      artifacts: [...context.artifacts, manifestArtifact]
    });
  }

  async rollback(context: PublishContext): Promise<PublishContext> {
    const filteredArtifacts = context.artifacts.filter(a => a.path !== 'manifest.json');
    return extendPublishContext(context, {
      manifest: undefined,
      artifacts: filteredArtifacts
    });
  }
}

export class DeployStage implements PublishStage {
  readonly name = 'deploy';

  async execute(context: PublishContext): Promise<PublishContext> {
    const subDomain = context.request.mode === 'PREVIEW' ? 'preview' : 'store';
    const deploymentUrl = `https://${subDomain}.solospot.pl/${context.request.tenantId}/${context.request.storeId}`;
    
    return extendPublishContext(context, { deploymentUrl });
  }

  async rollback(context: PublishContext): Promise<PublishContext> {
    return extendPublishContext(context, { deploymentUrl: undefined });
  }
}

export class DefaultPublishPipeline implements PublishPipeline {
  readonly name: string;
  readonly stages: ReadonlyArray<PublishStage>;
  private readonly deps: PublishPipelineDeps;

  constructor(name: string, deps: PublishPipelineDeps, stages?: ReadonlyArray<PublishStage>) {
    this.name = name;
    this.deps = deps;
    
    if (stages) {
      this.stages = stages;
    } else {
      this.stages = [
        new ValidateStage(deps.loadStoreConfig),
        new CommerceStage(deps.resolveCommerceData),
        new RuntimeStage(deps.renderPage),
        new AssetStage(),
        new ManifestStage(),
        new DeployStage()
      ];
    }
  }

  async execute(request: PublishRequest): Promise<PublishResult> {
    const stageResults: StageResult[] = [];
    const executedStages: PublishStage[] = [];
    let currentContext = createPublishContext(request);
    let success = true;

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
          durationMs: Date.now() - start,
          data: { artifactsCount: currentContext.artifacts.length }
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
              currentContext = extendPublishContext(currentContext, {
                metadata: {
                  ...currentContext.metadata,
                  [`rollback_error_${rollbackStage.name}`]: rollbackErrMsg
                }
              });
            }
          }
        }
        break; // Stop executing remaining stages
      }
    }

    return createPublishResult(
      success,
      request.correlationId,
      stageResults,
      success ? currentContext.deploymentUrl : undefined,
      currentContext.artifacts.length,
      currentContext.metadata
    );
  }

  addStage(stage: PublishStage): PublishPipeline {
    return new DefaultPublishPipeline(this.name, this.deps, [...this.stages, stage]);
  }

  removeStage(stageName: string): PublishPipeline {
    return new DefaultPublishPipeline(this.name, this.deps, this.stages.filter(s => s.name !== stageName));
  }

  getStage(stageName: string): PublishStage | undefined {
    return this.stages.find(s => s.name === stageName);
  }
}

export class DefaultPublishPipelineBuilder implements PublishPipelineBuilder {
  private stages: PublishStage[] = [];
  private pipelineName = 'default-publish-pipeline';
  private deps: PublishPipelineDeps | null = null;

  withStage(stage: PublishStage): PublishPipelineBuilder {
    this.stages.push(stage);
    return this;
  }

  withDeps(deps: PublishPipelineDeps): PublishPipelineBuilder {
    this.deps = deps;
    return this;
  }

  withName(name: string): PublishPipelineBuilder {
    this.pipelineName = name;
    return this;
  }

  build(): PublishPipeline {
    if (!this.deps) {
      throw new Error('Pipeline dependencies (deps) are required to build PublishPipeline');
    }
    
    if (this.stages.length > 0) {
      return new DefaultPublishPipeline(this.pipelineName, this.deps, this.stages);
    }
    
    return new DefaultPublishPipeline(this.pipelineName, this.deps);
  }
}

export function createPublishPipeline(deps: PublishPipelineDeps, name = 'default-publish-pipeline'): PublishPipeline {
  return new DefaultPublishPipeline(name, deps);
}

export function createPublishPipelineBuilder(): PublishPipelineBuilder {
  return new DefaultPublishPipelineBuilder();
}
