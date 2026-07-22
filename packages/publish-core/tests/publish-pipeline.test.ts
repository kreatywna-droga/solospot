import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoreConfig } from '../../runtime-core/src/RuntimeContext';
import { 
  createPublishRequest,
  DefaultPublishPipeline,
  DefaultPublishPipelineBuilder,
  PublishStage,
  PublishContext,
  extendPublishContext,
  createPublishPipeline
} from '../src';

const mockStoreConfig: StoreConfig = {
  storeId: 'store-123',
  storeName: 'Test Shop',
  branding: {
    primaryColor: '#7c3aed',
    secondaryColor: '#ec4899',
    font: 'Inter',
  },
  publicationStatus: 'PUBLISHED',
  pages: [
    { id: 'page-home', slug: '', name: 'Strona główna', sections: [] },
    { id: 'page-about', slug: 'about', name: 'O nas', sections: [] }
  ]
};

describe('PublishPipeline Execution Flow', () => {
  let loadConfigMock: any;

  beforeEach(() => {
    loadConfigMock = vi.fn().mockResolvedValue(mockStoreConfig);
  });

  it('should successfully run the full default pipeline', async () => {
    const pipeline = createPublishPipeline({ loadStoreConfig: loadConfigMock });
    const request = createPublishRequest({
      tenantId: 'tenant-abc',
      storeId: 'store-123',
      mode: 'LIVE'
    });

    const result = await pipeline.execute(request);

    expect(result.success).toBe(true);
    expect(result.correlationId).toBe(request.correlationId);
    expect(result.deploymentUrl).toBe('https://store.solospot.pl/tenant-abc/store-123');
    expect(result.artifactsCount).toBe(5); // index.html, about/index.html, main.css, main.js, manifest.json
    expect(result.stageResults.length).toBe(6);
    
    // Check stages execution sequence
    expect(result.stageResults[0].stageName).toBe('validate');
    expect(result.stageResults[1].stageName).toBe('commerce-resolve');
    expect(result.stageResults[2].stageName).toBe('runtime-compile');
    expect(result.stageResults[3].stageName).toBe('asset-build');
    expect(result.stageResults[4].stageName).toBe('manifest-build');
    expect(result.stageResults[5].stageName).toBe('deploy');

    expect(loadConfigMock).toHaveBeenCalledWith('tenant-abc', 'store-123');
  });

  it('should adjust deploymentUrl according to mode', async () => {
    const pipeline = createPublishPipeline({ loadStoreConfig: loadConfigMock });
    
    const requestPreview = createPublishRequest({
      tenantId: 'tenant-abc',
      storeId: 'store-123',
      mode: 'PREVIEW'
    });
    const resultPreview = await pipeline.execute(requestPreview);
    expect(resultPreview.deploymentUrl).toBe('https://preview.solospot.pl/tenant-abc/store-123');

    const requestExport = createPublishRequest({
      tenantId: 'tenant-abc',
      storeId: 'store-123',
      mode: 'EXPORT_STATIC'
    });
    const resultExport = await pipeline.execute(requestExport);
    // DeployStage generates standard URLs or we could refine, it outputs preview/store url
    expect(resultExport.success).toBe(true);
  });

  it('should halt execution and rollback in reverse order when a stage fails', async () => {
    const rollbackOrder: string[] = [];
    const executionOrder: string[] = [];

    const stage1: PublishStage = {
      name: 'stage-1',
      execute: async (ctx) => {
        executionOrder.push('stage-1');
        return extendPublishContext(ctx, { metadata: { ...ctx.metadata, s1: 'done' } });
      },
      rollback: async (ctx) => {
        rollbackOrder.push('stage-1');
        return ctx;
      }
    };

    const stage2: PublishStage = {
      name: 'stage-2',
      execute: async (ctx) => {
        executionOrder.push('stage-2');
        return extendPublishContext(ctx, { metadata: { ...ctx.metadata, s2: 'done' } });
      },
      rollback: async (ctx) => {
        rollbackOrder.push('stage-2');
        return ctx;
      }
    };

    const stage3: PublishStage = {
      name: 'stage-3',
      execute: async () => {
        executionOrder.push('stage-3');
        throw new Error('Failure in stage-3');
      },
      rollback: async (ctx) => {
        rollbackOrder.push('stage-3');
        return ctx;
      }
    };

    const stage4: PublishStage = {
      name: 'stage-4',
      execute: async (ctx) => {
        executionOrder.push('stage-4');
        return ctx;
      },
      rollback: async (ctx) => {
        rollbackOrder.push('stage-4');
        return ctx;
      }
    };

    const pipeline = new DefaultPublishPipelineBuilder()
      .withDeps({ loadStoreConfig: loadConfigMock })
      .withStage(stage1)
      .withStage(stage2)
      .withStage(stage3)
      .withStage(stage4)
      .build();

    const request = createPublishRequest({ tenantId: 'tenant-abc', storeId: 'store-123' });
    const result = await pipeline.execute(request);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toBe('Failure in stage-3');
    
    // Verify execution stopped at stage 3
    expect(executionOrder).toEqual(['stage-1', 'stage-2', 'stage-3']);
    // Verify rollback called in reverse order for executed stages
    expect(rollbackOrder).toEqual(['stage-3', 'stage-2', 'stage-1']);
  });

  it('should skip stages where canExecute returns false', async () => {
    const runFlags: string[] = [];
    const conditionalStage: PublishStage = {
      name: 'conditional-stage',
      execute: async (ctx) => {
        runFlags.push('ran');
        return ctx;
      },
      canExecute: (ctx) => ctx.request.mode === 'EXPORT_STATIC'
    };

    const pipeline = new DefaultPublishPipelineBuilder()
      .withDeps({ loadStoreConfig: loadConfigMock })
      .withStage(conditionalStage)
      .build();

    // Try with LIVE mode (should skip)
    const reqLive = createPublishRequest({ tenantId: 't', storeId: 's', mode: 'LIVE' });
    const resLive = await pipeline.execute(reqLive);
    expect(resLive.success).toBe(true);
    expect(runFlags).toEqual([]);
    expect(resLive.stageResults[0].data).toEqual({ skipped: true });

    // Try with EXPORT_STATIC mode (should run)
    const reqExport = createPublishRequest({ tenantId: 't', storeId: 's', mode: 'EXPORT_STATIC' });
    const resExport = await pipeline.execute(reqExport);
    expect(resExport.success).toBe(true);
    expect(runFlags).toEqual(['ran']);
  });

  it('should support stage adding, removing, and fetching', () => {
    const pipeline = createPublishPipeline({ loadStoreConfig: loadConfigMock });
    expect(pipeline.stages.length).toBe(6);

    const testStage: PublishStage = {
      name: 'test-extra',
      execute: async (ctx) => ctx
    };

    const extendedPipeline = pipeline.addStage(testStage);
    expect(extendedPipeline.stages.length).toBe(7);
    expect(extendedPipeline.getStage('test-extra')).toBe(testStage);

    const reducedPipeline = extendedPipeline.removeStage('runtime-compile');
    expect(reducedPipeline.stages.length).toBe(6);
    expect(reducedPipeline.getStage('runtime-compile')).toBeUndefined();
  });
});
