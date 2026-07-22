import { RuntimePipeline, PipelineBuilder } from './RuntimePipeline';
import { PipelineStage, PipelineResult, StageResult, createPipelineResult, createStageResult, PipelineContext } from './PipelineStage';
import { PipelineRequest } from './PipelineRequest';
import { RuntimeEngine } from './RuntimeEngine';
import { RuntimeResult } from './RuntimeResult';
import { SectionRegistry } from './SectionRegistry';
import { RuntimeSection, RuntimePage } from './RuntimeSection';
import { RuntimeTheme } from './RuntimeContext';
import { RuntimeMode } from './RuntimeMode';
import { RuntimeContext } from './RuntimeContext';
import { OutputModeStrategy, createOutputModeStrategy } from './OutputModes';

export interface PipelineDeps {
  runtimeEngine: RuntimeEngine;
  sectionRegistry: SectionRegistry;
  createRuntimeContext: (request: PipelineRequest) => RuntimeContext;
  buildRuntimeResult: (params: {
    request: PipelineRequest;
    page: RuntimePage;
    sections: RuntimeSection[];
    theme: RuntimeTheme;
    html: string;
  }) => RuntimeResult;
  outputModeStrategy?: OutputModeStrategy;
}

function getTheme(context: PipelineContext): RuntimeTheme {
  const config = context.runtimeContext.config as unknown as { theme?: RuntimeTheme };
  return config.theme || { primaryColor: '#7c3aed', secondaryColor: '#ec4899', font: 'Inter' };
}

function getSections(context: PipelineContext): RuntimeSection[] {
  const config = context.runtimeContext.config as unknown as { pages?: RuntimePage[] };
  const page = config.pages?.[0];
  return [...(page?.sections || [])];
}

function getStrategy(context: PipelineContext, depsStrategy?: OutputModeStrategy): OutputModeStrategy {
  return depsStrategy || createOutputModeStrategy(context.mode);
}

export class DefaultRuntimePipeline implements RuntimePipeline {
  readonly name: string;
  stages: PipelineStage[];
  
  private readonly deps: PipelineDeps;

  constructor(name: string, deps: PipelineDeps) {
    this.name = name;
    this.deps = deps;
    
    const stages: PipelineStage[] = [
      {
        name: 'create-runtime',
        execute: async (_, context: PipelineContext) => {
          const start = Date.now();
          const runtime = await this.deps.runtimeEngine.createRuntime(context.runtimeContext);
          context.metadata.runtime = runtime;
          return createStageResult('create-runtime', true, Date.now() - start, undefined, runtime);
        },
      },
      {
        name: 'resolve-sections',
        execute: async (_, context: PipelineContext) => {
          const start = Date.now();
          const sections = getSections(context);
          const page: RuntimePage = {
            id: `page-${context.request.slug || 'home'}`,
            slug: context.request.slug || '',
            name: context.request.slug === '' ? 'Strona główna' : `Strona ${context.request.slug}`,
            sections,
          };
          context.metadata.page = page;
          context.metadata.sections = sections;
          return createStageResult('resolve-sections', true, Date.now() - start, undefined, { page, sections });
        },
      },
      {
        name: 'render-sections',
        execute: async (_, context: PipelineContext) => {
          const start = Date.now();
          const sections = getSections(context);
          const theme = getTheme(context);
          const html = await this.renderSections(sections, theme, context);
          context.metadata.renderedHtml = html;
          return createStageResult('render-sections', true, Date.now() - start, undefined, html);
        },
      },
      {
        name: 'build-result',
        execute: async (_, context: PipelineContext) => {
          const start = Date.now();
          const request = context.request;
          const page = context.metadata.page as RuntimePage;
          const sections = context.metadata.sections as RuntimeSection[];
          const theme = getTheme(context);
          const html = context.metadata.renderedHtml as string;
          
          const result = this.deps.buildRuntimeResult({ request, page, sections, theme, html });
          context.metadata.result = result;
          return createStageResult('build-result', true, Date.now() - start, undefined, result);
        },
      },
    ];
    
    this.stages = stages;
  }

  async execute(request: PipelineRequest): Promise<PipelineResult> {
    const stageResults: StageResult[] = [];
    let success = true;
    let data: unknown;

    const context: PipelineContext = {
      request,
      runtimeContext: this.deps.createRuntimeContext(request),
      mode: request.mode,
      storeConfig: {},
      packages: new Map(),
      capabilities: new Map(),
      theme: null,
      sections: [],
      metadata: {},
    };

    for (const stage of this.stages) {
      const stageStart = Date.now();
      
      if (stage.canExecute && !stage.canExecute(context)) {
        stageResults.push(createStageResult(stage.name, true, 0, undefined, { skipped: true }));
        continue;
      }

      try {
        const result = await stage.execute(undefined, context);
        if (result && typeof result === 'object' && 'success' in result) {
          const stageResult = result as StageResult;
          stageResults.push(stageResult);
          if (!stageResult.success) {
            success = false;
          }
        }
      } catch (err) {
        const duration = Date.now() - stageStart;
        const errorMsg = err instanceof Error ? err.message : String(err);
        stageResults.push(createStageResult(stage.name, false, duration, [errorMsg]));
        success = false;
        
        if (stage.rollback && context.metadata.lastOutput) {
          try {
            await stage.rollback(context.metadata.lastOutput, context);
          } catch {
            // rollback error ignored
          }
        }
        break;
      }
    }

    return createPipelineResult(success, data, stageResults, {
      correlationId: request.correlationId,
      mode: request.mode,
      tenantId: request.tenantId,
      storeId: request.storeId,
    });
  }

  addStage(stage: PipelineStage): RuntimePipeline {
    return new ExtendedPipeline(this.name, this.deps, [...this.stages, stage]);
  }

  removeStage(stageName: string): RuntimePipeline {
    return new ExtendedPipeline(this.name, this.deps, this.stages.filter(s => s.name !== stageName));
  }

  getStage(stageName: string): PipelineStage | undefined {
    return this.stages.find(s => s.name === stageName);
  }

  private async renderSections(sections: RuntimeSection[], theme: RuntimeTheme, context: PipelineContext): Promise<string> {
    const strategy = getStrategy(context, this.deps.outputModeStrategy);
    const renderContext = {
      storeName: context.request.storeId,
      tenantId: context.request.tenantId,
      storeId: context.request.storeId,
      mode: context.mode,
      locale: context.request.locale,
      currency: context.request.currency,
      products: (context.runtimeContext.config as { products?: Array<{ id: string; name: string; price: number; currency: string; images: string[]; description?: string }> }).products,
      navigation: (context.runtimeContext.config as { navigation?: Array<{ label: string; href: string; children?: Array<{ label: string; href: string }> }> }).navigation,
    };

    const rendered = await Promise.all(
      sections.map(async (section) => {
        const html = await this.deps.sectionRegistry.renderSection(section, theme, renderContext);
        return strategy.wrapSection(section, html);
      })
    );

    return strategy.assemblePage(rendered.join('\n'));
  }
}

class ExtendedPipeline implements RuntimePipeline {
  readonly name: string;
  stages: PipelineStage[];
  
  private readonly deps: PipelineDeps;

  constructor(name: string, deps: PipelineDeps, stages: PipelineStage[]) {
    this.name = name;
    this.deps = deps;
    this.stages = stages;
  }

  async execute(request: PipelineRequest): Promise<PipelineResult> {
    const stageResults: StageResult[] = [];
    let success = true;
    let data: unknown;

    const context: PipelineContext = {
      request,
      runtimeContext: this.deps.createRuntimeContext(request),
      mode: request.mode,
      storeConfig: {},
      packages: new Map(),
      capabilities: new Map(),
      theme: null,
      sections: [],
      metadata: {},
    };

    for (const stage of this.stages) {
      const stageStart = Date.now();
      
      if (stage.canExecute && !stage.canExecute(context)) {
        stageResults.push(createStageResult(stage.name, true, 0, undefined, { skipped: true }));
        continue;
      }

      try {
        const result = await stage.execute(undefined, context);
        if (result && typeof result === 'object' && 'success' in result) {
          const stageResult = result as StageResult;
          stageResults.push(stageResult);
          if (!stageResult.success) {
            success = false;
          }
        }
      } catch (err) {
        const duration = Date.now() - stageStart;
        const errorMsg = err instanceof Error ? err.message : String(err);
        stageResults.push(createStageResult(stage.name, false, duration, [errorMsg]));
        success = false;
        
        if (stage.rollback && context.metadata.lastOutput) {
          try {
            await stage.rollback(context.metadata.lastOutput, context);
          } catch {
            // rollback error ignored
          }
        }
        break;
      }
    }

    return createPipelineResult(success, data, stageResults, {
      correlationId: request.correlationId,
      mode: request.mode,
      tenantId: request.tenantId,
      storeId: request.storeId,
    });
  }

  addStage(stage: PipelineStage): RuntimePipeline {
    return new ExtendedPipeline(this.name, this.deps, [...this.stages, stage]);
  }

  removeStage(stageName: string): RuntimePipeline {
    return new ExtendedPipeline(this.name, this.deps, this.stages.filter(s => s.name !== stageName));
  }

  getStage(stageName: string): PipelineStage | undefined {
    return this.stages.find(s => s.name === stageName);
  }
}

export class DefaultPipelineBuilder implements PipelineBuilder {
  private stages: PipelineStage[] = [];
  private pipelineName = 'default-pipeline';
  private deps: PipelineDeps | null = null;

  withStage(stage: PipelineStage): PipelineBuilder {
    this.stages.push(stage);
    return this;
  }

  withDeps(deps: PipelineDeps): PipelineBuilder {
    this.deps = deps;
    return this;
  }

  withName(name: string): PipelineBuilder {
    this.pipelineName = name;
    return this;
  }

  build(): RuntimePipeline {
    if (!this.deps) {
      throw new Error('Pipeline dependencies (deps) are required to build RuntimePipeline');
    }
    
    const pipeline = new DefaultRuntimePipeline(this.pipelineName, this.deps);
    
    if (this.stages.length > 0) {
      return new ExtendedPipeline(this.pipelineName, this.deps, [...pipeline.stages, ...this.stages]);
    }
    
    return pipeline;
  }
}

export function createRuntimePipeline(deps: PipelineDeps, name = 'default-pipeline'): RuntimePipeline {
  return new DefaultRuntimePipeline(name, deps);
}

export function createPipelineBuilder(): PipelineBuilder {
  return new DefaultPipelineBuilder();
}