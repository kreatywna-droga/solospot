import { PipelineDeps } from '../DefaultRuntimePipeline';
import { createDefaultSectionRegistry } from '../DefaultSectionRegistry';
import { RuntimeContext, StoreConfig, TenantInfo, RuntimeTheme } from '../RuntimeContext';
import { createPipelineRequest, PipelineRequest } from '../PipelineRequest';
import { createRuntimePage, createRuntimeSection, RuntimeSection } from '../RuntimeSection';
import { createSuccessResult } from '../RuntimeResult';
import { RuntimeEngine, RuntimeInstance } from '../RuntimeEngine';
import { OutputModeStrategy } from '../OutputModes';

const DEFAULT_THEME: RuntimeTheme = {
  primaryColor: '#7c3aed',
  secondaryColor: '#ec4899',
  font: 'Inter',
};

export function makeSections(): RuntimeSection[] {
  return [
    createRuntimeSection('s1', 'hero', 'Hero', { title: 'Hi' }, 0, true),
    createRuntimeSection('s2', 'footer', 'Footer', {}, 1, true),
  ];
}

export function makeTenant(tenantId: string, storeId: string): TenantInfo {
  return {
    tenantId,
    slug: 'tenant',
    domains: { primary: 'example.com' },
    plan: { tier: 'FREE', limits: {} },
    capabilities: [],
    metadata: { locale: 'pl', currency: 'PLN' },
  };
}

export function makeConfig(storeId: string, sections: RuntimeSection[]): StoreConfig {
  return {
    storeId,
    storeName: 'Test Store',
    publicationStatus: 'PUBLISHED',
    branding: { primaryColor: '#7c3aed', secondaryColor: '#ec4899', font: 'Inter' },
    pages: [createRuntimePage('page-home', 'home', 'Strona główna', sections)],
  };
}

export interface MakeDepsOptions {
  sections?: RuntimeSection[];
  failCreateRuntime?: boolean;
  outputModeStrategy?: OutputModeStrategy;
  captureContext?: (context: RuntimeContext) => void;
}

export function makeDeps(opts: MakeDepsOptions = {}): PipelineDeps {
  const sections = opts.sections ?? makeSections();

  const runtimeEngine: RuntimeEngine = {
    createRuntime: async (ctx): Promise<RuntimeInstance> => {
      if (opts.failCreateRuntime) {
        throw new Error('boom-create-runtime');
      }
      return {
        tenantId: ctx.tenant.tenantId,
        id: 'rt',
        lifecycle: 'ACTIVE',
        modules: new Map(),
        renderer: { renderView: async () => '' },
      };
    },
    render: async () => createSuccessResult('', '', '', '', createRuntimePage('', '', ''), [], DEFAULT_THEME),
    dispose: async () => undefined,
    resolveCapability: () => null,
    getActiveInstance: () => undefined,
  };

  return {
    runtimeEngine,
    sectionRegistry: createDefaultSectionRegistry(),
    createRuntimeContext: (request: PipelineRequest): RuntimeContext => {
      const context: RuntimeContext = {
        mode: request.mode,
        tenant: makeTenant(request.tenantId, request.storeId),
        config: makeConfig(request.storeId, sections),
        correlationId: request.correlationId,
        timestamp: new Date().toISOString(),
      };
      opts.captureContext?.(context);
      return context;
    },
    buildRuntimeResult: (params) =>
      createSuccessResult(
        params.request.storeId,
        params.request.tenantId,
        params.request.slug,
        '1.0.0',
        params.page,
        params.sections,
        params.theme,
        { mode: params.request.mode, renderedAt: new Date().toISOString() }
      ),
    outputModeStrategy: opts.outputModeStrategy,
  };
}

export function makeRequest(overrides: Partial<Parameters<typeof createPipelineRequest>[0]> = {}) {
  return createPipelineRequest({
    tenantId: 'tenant-1',
    storeId: 'store-1',
    slug: 'home',
    viewName: 'home',
    mode: 'LIVE',
    ...overrides,
  });
}
