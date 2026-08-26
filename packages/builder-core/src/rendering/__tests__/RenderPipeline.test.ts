import { describe, it, expect } from 'vitest';
import { createBuilderDocument } from '../../BuilderDocument';
import { createRenderContext } from '../RenderContext';
import { buildRenderGraph } from '../RenderGraph';
import { RenderPipeline } from '../RenderPipeline';

describe('RenderPipeline & Caching', () => {
  it('should render frame and use cache on repeat calls', () => {
    const doc = createBuilderDocument({
      id: 'test-store',
      tenantId: 'test-store',
      metadata: {
        storeName: 'Test Store',
        storeSlug: 'test-store',
        locale: 'en',
        currency: 'USD',
      },
    });
    const graph = buildRenderGraph(doc);
    const pipeline = new RenderPipeline(10);

    const context = createRenderContext({ timestampMs: 200, frameIndex: 12 });
    const frame1 = pipeline.render(context, graph, []);
    expect(frame1.isCached).toBe(false);

    const frame2 = pipeline.render(context, graph, []);
    expect(frame2.isCached).toBe(true);
    expect(frame2.timestampMs).toBe(200);

    const stats = pipeline.getCache().getStats();
    expect(stats.hits).toBe(1);
  });
});
