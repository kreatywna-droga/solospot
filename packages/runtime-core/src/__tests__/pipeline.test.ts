import { describe, it, expect } from 'vitest';
import { createRuntimePipeline, createPipelineBuilder, DefaultPipelineBuilder } from '../DefaultRuntimePipeline';
import { makeDeps, makeRequest } from './test-utils';

const STAGE_ORDER = ['create-runtime', 'resolve-sections', 'render-sections', 'build-result'];

describe('DefaultRuntimePipeline', () => {
  it('runs all stages in the expected order and succeeds', async () => {
    const pipeline = createRuntimePipeline(makeDeps());
    const result = await pipeline.execute(makeRequest());

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.stageResults.map((s) => s.stageName)).toEqual(STAGE_ORDER);
    expect(result.stageResults.every((s) => s.success)).toBe(true);
  });

  it('exposes the default stages via the stages property', () => {
    const pipeline = createRuntimePipeline(makeDeps());
    expect(pipeline.stages.map((s) => s.name)).toEqual(STAGE_ORDER);
  });

  it('resolves the page and renders sections into html', async () => {
    const pipeline = createRuntimePipeline(makeDeps());
    const result = await pipeline.execute(makeRequest());

    const renderStage = result.stageResults.find((s) => s.stageName === 'render-sections');
    const html = renderStage?.data as string;
    expect(typeof html).toBe('string');
    expect(html).toContain('<section');
    expect(html).toContain('Hi');
  });

  it('carries request metadata into the pipeline result', async () => {
    const pipeline = createRuntimePipeline(makeDeps());
    const result = await pipeline.execute(makeRequest({ tenantId: 't-9', storeId: 's-9', mode: 'EXPORT' }));

    expect(result.metadata?.tenantId).toBe('t-9');
    expect(result.metadata?.storeId).toBe('s-9');
    expect(result.metadata?.mode).toBe('EXPORT');
  });

  it('isolates tenant context from the request data', async () => {
    let capturedTenantId = '';
    const pipeline = createRuntimePipeline(
      makeDeps({ captureContext: (ctx) => (capturedTenantId = ctx.tenant.tenantId) })
    );
    await pipeline.execute(makeRequest({ tenantId: 'tenant-isolated' }));

    expect(capturedTenantId).toBe('tenant-isolated');
  });

  it('short-circuits and fails when createRuntime throws', async () => {
    const pipeline = createRuntimePipeline(makeDeps({ failCreateRuntime: true }));
    const result = await pipeline.execute(makeRequest());

    expect(result.success).toBe(false);
    expect(result.stageResults).toHaveLength(1);
    expect(result.stageResults[0].stageName).toBe('create-runtime');
    expect(result.stageResults[0].success).toBe(false);
    expect(result.errors.join(' ')).toContain('boom-create-runtime');
  });

  it('fails when a section type has no registered renderer', async () => {
    const pipeline = createRuntimePipeline(
      makeDeps({ sections: [{ id: 'x', type: 'unknown-type', label: 'X', props: {}, order: 0, visible: true } as never] })
    );
    const result = await pipeline.execute(makeRequest());

    expect(result.success).toBe(false);
    expect(result.stageResults.map((s) => s.stageName).slice(0, 3)).toEqual([
      'create-runtime',
      'resolve-sections',
      'render-sections',
    ]);
    expect(result.errors.join(' ')).toContain('unknown-type');
  });

  describe('builder', () => {
    it('builds a pipeline with default deps', () => {
      const pipeline = (createPipelineBuilder() as DefaultPipelineBuilder).withDeps(makeDeps()).build();
      expect(pipeline.stages.map((s) => s.name)).toEqual(STAGE_ORDER);
    });

    it('throws when building without deps', () => {
      expect(() => createPipelineBuilder().build()).toThrow();
    });

    it('appends extra stages via addStage', async () => {
      const pipeline = createRuntimePipeline(makeDeps());
      let ran = false;
      const extended = pipeline.addStage({
        name: 'post-process',
        execute: async () => {
          ran = true;
          return { success: true, durationMs: 0, stageName: 'post-process' };
        },
      });

      expect(extended.getStage('post-process')).toBeDefined();
      await extended.execute(makeRequest());
      expect(ran).toBe(true);
    });

    it('removes a stage by name', () => {
      const pipeline = createRuntimePipeline(makeDeps());
      const trimmed = pipeline.removeStage('build-result');
      expect(trimmed.getStage('build-result')).toBeUndefined();
      expect(trimmed.getStage('create-runtime')).toBeDefined();
    });
  });
});
