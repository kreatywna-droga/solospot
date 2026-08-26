/**
 * SceneComposer.ts — Sprint S10 Scene Composition
 *
 * Composes document hierarchy + evaluated properties into RenderNodeStates.
 * Pure functional DTO generator. NO DOM or React dependencies.
 */

import { RenderBoundingBox, RenderNodeState } from './RenderFrame';
import { RenderGraph } from './RenderGraph';
import { LayerComposer } from './LayerComposer';
import { OpacityResolver } from './OpacityResolver';
import { TransformResolver } from './TransformResolver';
import { VisibilityResolver } from './VisibilityResolver';

export interface ComposedScene {
  readonly nodes: Map<string, RenderNodeState>;
  readonly nodeOrder: string[];
}

export class SceneComposer {
  public static composeScene(
    graph: RenderGraph,
    animatedPropsMap: Map<string, Record<string, unknown>>,
    previousNodesMap?: Map<string, RenderNodeState>
  ): ComposedScene {
    const nodes = new Map<string, RenderNodeState>();
    const nodeOrder = LayerComposer.computeLayerOrder(graph, animatedPropsMap);

    for (const nodeId of graph.executionOrder) {
      const graphNode = graph.nodes.get(nodeId);
      if (!graphNode) continue;

      const animatedProps = animatedPropsMap.get(nodeId) ?? {};
      const computedProps = {
        ...graphNode.rawProps,
        ...animatedProps,
      };

      const opacity = OpacityResolver.resolveOpacity(nodeId, graph, animatedPropsMap);
      const visible = VisibilityResolver.resolveVisibility(nodeId, graph, animatedPropsMap);
      const transformMatrix = TransformResolver.resolveTransformMatrix(nodeId, graph, animatedPropsMap);

      // Resolve computed bounding box
      const width = typeof computedProps.width === 'number' ? computedProps.width : graphNode.defaultBounds.width;
      const height = typeof computedProps.height === 'number' ? computedProps.height : graphNode.defaultBounds.height;
      const x = transformMatrix[12];
      const y = transformMatrix[13];

      const bounds: RenderBoundingBox = {
        x,
        y,
        width,
        height,
      };

      // Check dirty status against previous frame
      let isDirty = true;
      if (previousNodesMap && previousNodesMap.has(nodeId)) {
        const prev = previousNodesMap.get(nodeId)!;
        isDirty =
          prev.opacity !== opacity ||
          prev.visible !== visible ||
          prev.bounds.x !== bounds.x ||
          prev.bounds.y !== bounds.y ||
          prev.bounds.width !== bounds.width ||
          prev.bounds.height !== bounds.height ||
          JSON.stringify(prev.computedProps) !== JSON.stringify(computedProps);
      }

      const nodeState: RenderNodeState = {
        nodeId,
        parentId: graphNode.parentId,
        type: graphNode.type,
        order: graphNode.order,
        computedProps,
        transformMatrix,
        opacity,
        visible,
        bounds,
        isDirty,
      };

      nodes.set(nodeId, nodeState);
    }

    return {
      nodes,
      nodeOrder,
    };
  }
}
