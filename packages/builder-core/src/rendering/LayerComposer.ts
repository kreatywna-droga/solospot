/**
 * LayerComposer.ts — Sprint S10 Scene Composition
 *
 * Computes layer ordering and stacking contexts for deterministic render order.
 * Pure DTO logic. NO DOM dependencies.
 */

import { RenderGraph, RenderGraphNode } from './RenderGraph';

export class LayerComposer {
  public static computeLayerOrder(
    graph: RenderGraph,
    computedPropsMap: Map<string, Record<string, unknown>>
  ): string[] {
    const nodes = Array.from(graph.nodes.values());

    nodes.sort((a, b) => {
      // 1. Stacking depth / depth in tree
      if (a.depth !== b.depth) {
        return a.depth - b.depth;
      }

      // 2. Explicit zIndex
      const zIndexA = LayerComposer.getNodeZIndex(a, computedPropsMap);
      const zIndexB = LayerComposer.getNodeZIndex(b, computedPropsMap);
      if (zIndexA !== zIndexB) {
        return zIndexA - zIndexB;
      }

      // 3. Sibling order
      return a.order - b.order;
    });

    return nodes.map((n) => n.id);
  }

  private static getNodeZIndex(
    node: RenderGraphNode,
    computedPropsMap: Map<string, Record<string, unknown>>
  ): number {
    const computed = computedPropsMap.get(node.id);
    if (computed && typeof computed.zIndex === 'number') {
      return computed.zIndex;
    }
    if (typeof node.rawProps.zIndex === 'number') {
      return node.rawProps.zIndex as number;
    }
    return 0;
  }
}
