import { RuntimePipeline, PipelineBuilder } from './RuntimePipeline';
import { PipelineStage, PipelineResult, StageResult, createPipelineResult, createStageResult, PipelineContext } from './PipelineStage';
import { PipelineRequest } from './PipelineRequest';
import { RuntimeEngine, TenantContext } from './RuntimeEngine';
import { RuntimeResult } from './RuntimeResult';
import { SectionRegistry } from './SectionRegistry';
import { RuntimeSection, RuntimePage } from './RuntimeSection';
import { RuntimeTheme, StoreRuntimeSnapshot } from './RuntimeContext';
import { RuntimeMode } from './RuntimeMode';
import { RuntimeContext } from './RuntimeContext';
import { OutputModeStrategy, createOutputModeStrategy } from './OutputModes';
import { RuntimeCache } from './RuntimeCache';

// ---------------------------------------------------------------------------
// Extended PipelineDeps — all new deps are OPTIONAL (backward compatible)
// ---------------------------------------------------------------------------

export interface AccessValidationResult {
  readonly allowed: boolean;
  readonly reason?: string;
}

export interface PipelineLegacyFallback {
  (
    request: PipelineRequest,
    context: PipelineContext,
    errors: ReadonlyArray<string>
  ): Promise<RuntimeResult | null>;
}

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

  // ---- Optional Sprint 6 Step 5 deps (activates stages) ----
  cache?: RuntimeCache;
  buildCacheKey?: (request: PipelineRequest) => string;
  validateAccess?: (request: PipelineRequest, context: PipelineContext) => Promise<AccessValidationResult>;
  compositionEngine?: {
    compose(tenantContext: TenantContext, correlationId?: string): Promise<StoreRuntimeSnapshot>;
  };
  buildTenantContext?: (request: PipelineRequest) => Promise<TenantContext | null>;
  createComposedRuntimeContext?: (snapshot: StoreRuntimeSnapshot, request: PipelineRequest) => RuntimeContext;
  legacyFallback?: PipelineLegacyFallback;
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

// ---------------------------------------------------------------------------
// Helper: create the default (core) pipeline stages
// ---------------------------------------------------------------------------

function createCoreStages(deps: PipelineDeps): PipelineStage[] {
  return [
    {
      name: 'create-runtime',
      execute: async (_, context: PipelineContext) => {
        const start = Date.now();
        const runtime = await deps.runtimeEngine.createRuntime(context.runtimeContext);
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
        const html = await renderSectionsInternal(deps, sections, theme, context);
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

        const result = deps.buildRuntimeResult({ request, page, sections, theme, html });
        context.metadata.result = result;
        return createStageResult('build-result', true, Date.now() - start, undefined, result);
      },
    },
  ];
}

async function renderSectionsInternal(
  deps: PipelineDeps,
  sections: RuntimeSection[],
  theme: RuntimeTheme,
  context: PipelineContext
): Promise<string> {
  const strategy = getStrategy(context, deps.outputModeStrategy);
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
      if (!strategy.shouldIncludeInOutput(section)) return '';
      const html = await deps.sectionRegistry.renderSection(section, theme, renderContext);
      return strategy.wrapSection(section, html);
    })
  );

  return strategy.assemblePage(rendered.join('\n'));
}

// ---------------------------------------------------------------------------
// Shared execute() implementation
// ---------------------------------------------------------------------------

interface ExecuteState {
  context: PipelineContext;
  stageResults: StageResult[];
  data: unknown;
}

async function runStages(
  stages: PipelineStage[],
  request: PipelineRequest,
  deps: PipelineDeps
): Promise<{ state: ExecuteState; failed: boolean; cacheHit: boolean }> {
  const stageResults: StageResult[] = [];
  let failed = false;
  let data: unknown;
  let cacheHit = false;

  const context: PipelineContext = {
    request,
    runtimeContext: deps.createRuntimeContext(request),
    mode: request.mode,
    storeConfig: {},
    packages: new Map(),
    capabilities: new Map(),
    theme: null,
    sections: [],
    metadata: {},
  };

  // cache-check stage — short-circuit when hit
  if (deps.cache && deps.buildCacheKey && !request.noCache) {
    const ttl = deps.cache.getTTL(request.mode);
    if (ttl > 0) {
      const key = deps.buildCacheKey(request);
      const cached = deps.cache.get<unknown>(key);
      if (cached !== undefined) {
        context.metadata.fromCache = true;
        context.metadata.cacheKey = key;
        return { state: { context, stageResults, data: cached }, failed: false, cacheHit: true };
      }
    }
  }

  for (const stage of stages) {
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
          failed = true;
        }
      }
    } catch (err) {
      const duration = Date.now() - stageStart;
      const errorMsg = err instanceof Error ? err.message : String(err);
      stageResults.push(createStageResult(stage.name, false, duration, [errorMsg]));
      failed = true;

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

  // data = result produced by build-result stage, if any
  const result = context.metadata.result as RuntimeResult | undefined;
  if (result) {
    data = result;
  }

  return { state: { context, stageResults, data }, failed, cacheHit };
}

async function runPipelineWithFallback(
  stages: PipelineStage[],
  request: PipelineRequest,
  deps: PipelineDeps,
  mode: RuntimeMode
): Promise<PipelineResult> {
  const { state, failed, cacheHit } = await runStages(stages, request, deps);

  if (cacheHit) {
    return createPipelineResult(true, state.data, state.stageResults, {
      correlationId: request.correlationId,
      mode: request.mode,
      tenantId: request.tenantId,
      storeId: request.storeId,
      fromCache: true,
    });
  }

  // legacy-fallback: if a stage failed and a fallback is provided, try it.
  if (failed && deps.legacyFallback) {
    const errors = state.stageResults.flatMap((s) => s.errors || []);
    try {
      const legacyResult = await deps.legacyFallback(request, state.context, errors);
      if (legacyResult) {
        state.stageResults.push(createStageResult(
          'legacy-fallback',
          true,
          0,
          undefined,
          { fallback: true, errors: state.stageResults.length }
        ));
        return createPipelineResult(true, legacyResult, state.stageResults, {
          correlationId: request.correlationId,
          mode: request.mode,
          tenantId: request.tenantId,
          storeId: request.storeId,
          fallback: true,
        });
      }
    } catch (fallbackErr) {
      state.stageResults.push(createStageResult(
        'legacy-fallback',
        false,
        0,
        [fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)]
      ));
      return createPipelineResult(false, state.data, state.stageResults, {
        correlationId: request.correlationId,
        mode: request.mode,
        tenantId: request.tenantId,
        storeId: request.storeId,
      });
    }
  }

  return createPipelineResult(!failed, state.data, state.stageResults, {
    correlationId: request.correlationId,
    mode: request.mode,
    tenantId: request.tenantId,
    storeId: request.storeId,
  });
}

// ---------------------------------------------------------------------------
// Full stage assembly (backward compatible)
// ---------------------------------------------------------------------------

function buildStages(deps: PipelineDeps): PipelineStage[] {
  const stages: PipelineStage[] = [];

  // cache-check stage (runs before everything)
  if (deps.cache && deps.buildCacheKey) {
    stages.push({
      name: 'cache-check',
      canExecute: (context) => !context.request.noCache && deps.cache!.getTTL(context.request.mode) > 0,
      execute: async (_, context) => {
        const start = Date.now();
        const key = deps.buildCacheKey!(context.request);
        const cached = deps.cache!.get<unknown>(key);
        if (cached !== undefined) {
          context.metadata.fromCache = true;
          context.metadata.cacheKey = key;
          context.metadata.cachedResult = cached;
          return createStageResult('cache-check', true, Date.now() - start, undefined, { hit: true, key });
        }
        return createStageResult('cache-check', true, Date.now() - start, undefined, { hit: false, key });
      },
    });
  }

  // validate-access stage
  if (deps.validateAccess) {
    stages.push({
      name: 'validate-access',
      canExecute: (context) => context.mode === 'LIVE',
      execute: async (_, context) => {
        const start = Date.now();
        const res = await deps.validateAccess!(context.request, context);
        if (!res.allowed) {
          // Throw → pipeline short-circuits to legacy-fallback
          throw new Error(res.reason || 'Access denied');
        }
        return createStageResult('validate-access', true, Date.now() - start, undefined, res);
      },
    });
  }

  // runtime-composition stage
  if (deps.compositionEngine && deps.buildTenantContext && deps.createComposedRuntimeContext) {
    stages.push({
      name: 'runtime-composition',
      execute: async (_, context) => {
        const start = Date.now();
        const tenantContext = await deps.buildTenantContext!(context.request);
        if (!tenantContext) {
          // Throw → pipeline short-circuits to legacy-fallback
          throw new Error(`Tenant not found for slug: ${context.request.slug}`);
        }
        const snapshot = await deps.compositionEngine!.compose(tenantContext, context.request.correlationId);
        context.runtimeContext = deps.createComposedRuntimeContext!(snapshot, context.request);
        context.metadata.snapshot = snapshot;
        return createStageResult('runtime-composition', true, Date.now() - start, undefined, { tenantId: tenantContext.tenantId });
      },
    });
  }

  // core stages
  stages.push(...createCoreStages(deps));

  // cache-write stage
  if (deps.cache && deps.buildCacheKey) {
    stages.push({
      name: 'cache-write',
      canExecute: (context) =>
        !context.request.noCache &&
        deps.cache!.getTTL(context.request.mode) > 0 &&
        !!context.metadata.result &&
        context.metadata.fromCache !== true,
      execute: async (_, context) => {
        const start = Date.now();
        const key = deps.buildCacheKey!(context.request);
        deps.cache!.set(key, context.metadata.result, deps.cache!.getTTL(context.request.mode));
        return createStageResult('cache-write', true, Date.now() - start, undefined, { key });
      },
    });
  }

  return stages;
}

// ---------------------------------------------------------------------------
// DefaultRuntimePipeline
// ---------------------------------------------------------------------------

export class DefaultRuntimePipeline implements RuntimePipeline {
  readonly name: string;
  stages: PipelineStage[];

  private readonly deps: PipelineDeps;

  constructor(name: string, deps: PipelineDeps) {
    this.name = name;
    this.deps = deps;
    this.stages = buildStages(deps);
  }

  async execute(request: PipelineRequest): Promise<PipelineResult> {
    return runPipelineWithFallback(this.stages, request, this.deps, request.mode);
  }

  addStage(stage: PipelineStage): RuntimePipeline {
    return new ExtendedPipeline(this.name, this.deps, [...this.stages, stage]);
  }

  removeStage(stageName: string): RuntimePipeline {
    return new ExtendedPipeline(this.name, this.deps, this.stages.filter((s) => s.name !== stageName));
  }

  getStage(stageName: string): PipelineStage | undefined {
    return this.stages.find((s) => s.name === stageName);
  }
}

// ---------------------------------------------------------------------------
// ExtendedPipeline
// ---------------------------------------------------------------------------

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
    return runPipelineWithFallback(this.stages, request, this.deps, request.mode);
  }

  addStage(stage: PipelineStage): RuntimePipeline {
    return new ExtendedPipeline(this.name, this.deps, [...this.stages, stage]);
  }

  removeStage(stageName: string): RuntimePipeline {
    return new ExtendedPipeline(this.name, this.deps, this.stages.filter((s) => s.name !== stageName));
  }

  getStage(stageName: string): PipelineStage | undefined {
    return this.stages.find((s) => s.name === stageName);
  }
}

// ---------------------------------------------------------------------------
// Builder + factory
// ---------------------------------------------------------------------------

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

