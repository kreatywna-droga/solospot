import { describe, it, expect } from 'vitest';
import { createBuilderDocument } from '../../BuilderDocument';
import { buildRenderGraph } from '../RenderGraph';
import { SceneComposer } from '../SceneComposer';
import { OpacityResolver } from '../OpacityResolver';
import { TransformResolver } from '../TransformResolver';

describe('SceneComposer & Resolvers', () => {
  it('should compute cumulative opacity across hierarchy', () => {
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
    const rootId = graph.rootIds[0];

    const animatedPropsMap = new Map<string, Record<string, unknown>>();
    animatedPropsMap.set(rootId, { opacity: 0.5 });

    const opacity = OpacityResolver.resolveOpacity(rootId, graph, animatedPropsMap);
    expect(opacity).toBe(0.5);
  });

  it('should compose scene with calculated transform matrices', () => {
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
    const rootId = graph.rootIds[0];

    const animatedPropsMap = new Map<string, Record<string, unknown>>();
    animatedPropsMap.set(rootId, { x: 50, y: 100, rotation: 90 });

    const scene = SceneComposer.composeScene(graph, animatedPropsMap);
    const nodeState = scene.nodes.get(rootId);

    expect(nodeState).toBeDefined();
    expect(nodeState?.bounds.x).toBe(50);
    expect(nodeState?.bounds.y).toBe(100);
    expect(nodeState?.transformMatrix[12]).toBe(50);
    expect(nodeState?.transformMatrix[13]).toBe(100);
  });
});
