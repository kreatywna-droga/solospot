/**
 * OpacityResolver.ts — Sprint S10 Scene Composition
 *
 * Computes cumulative opacity across parent-child element hierarchies.
 * Pure logic. NO DOM dependencies.
 */

import { RenderGraph, getAncestors } from './RenderGraph';

export class OpacityResolver {
  public static resolveOpacity(
    nodeId: string,
    graph: RenderGraph,
    computedPropsMap: Map<string, Record<string, unknown>>
  ): number {
    const node = graph.nodes.get(nodeId);
    if (!node) return 1.0;

    let totalOpacity = OpacityResolver.getNodeLocalOpacity(nodeId, computedPropsMap, node.rawProps);

    const ancestors = getAncestors(graph, nodeId);
    for (const ancestor of ancestors) {
      const ancestorOpacity = OpacityResolver.getNodeLocalOpacity(ancestor.id, computedPropsMap, ancestor.rawProps);
      totalOpacity *= ancestorOpacity;
    }

    return Math.max(0, Math.min(1, totalOpacity));
  }

  private static getNodeLocalOpacity(
    nodeId: string,
    computedPropsMap: Map<string, Record<string, unknown>>,
    rawProps: Record<string, unknown>
  ): number {
    const computedProps = computedPropsMap.get(nodeId);
    if (computedProps && typeof computedProps.opacity === 'number') {
      return computedProps.opacity;
    }
    if (typeof rawProps.opacity === 'number') {
      return rawProps.opacity;
    }
    return 1.0;
  }
}
