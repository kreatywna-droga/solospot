/**
 * VisibilityResolver.ts — Sprint S10 Scene Composition
 *
 * Resolves element spatial visibility and layout bounds containment.
 * Pure DTO logic. NO DOM or Browser API dependencies.
 */

import { RenderGraph, getAncestors } from './RenderGraph';

export class VisibilityResolver {
  public static resolveVisibility(
    nodeId: string,
    graph: RenderGraph,
    computedPropsMap: Map<string, Record<string, unknown>>
  ): boolean {
    const node = graph.nodes.get(nodeId);
    if (!node) return false;

    if (!node.visible) return false;

    if (!VisibilityResolver.isLocalNodeVisible(nodeId, computedPropsMap, node.rawProps)) {
      return false;
    }

    const ancestors = getAncestors(graph, nodeId);
    for (const ancestor of ancestors) {
      if (!ancestor.visible) return false;
      if (!VisibilityResolver.isLocalNodeVisible(ancestor.id, computedPropsMap, ancestor.rawProps)) {
        return false;
      }
    }

    return true;
  }

  private static isLocalNodeVisible(
    nodeId: string,
    computedPropsMap: Map<string, Record<string, unknown>>,
    rawProps: Record<string, unknown>
  ): boolean {
    const computedProps = computedPropsMap.get(nodeId);

    const display = computedProps?.display ?? rawProps.display;
    if (display === 'none') return false;

    const visibility = computedProps?.visibility ?? rawProps.visibility;
    if (visibility === 'hidden' || visibility === 'collapse') return false;

    const opacity = computedProps?.opacity ?? rawProps.opacity;
    if (typeof opacity === 'number' && opacity < 0) return false;

    return true;
  }
}
