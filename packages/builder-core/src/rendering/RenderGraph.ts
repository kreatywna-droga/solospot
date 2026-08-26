/**
 * RenderGraph.ts — Sprint S10 Real Rendering Engine Core
 *
 * DAG representation of BuilderDocument section hierarchy for deterministic execution.
 * Pure logic, no DOM dependencies.
 */

import { BuilderDocument, SectionNode } from '../BuilderDocument';
import { RenderBoundingBox } from './RenderFrame';

export interface RenderGraphNode {
  readonly id: string;
  readonly type: string;
  readonly label: string;
  readonly parentId?: string;
  readonly childIds: ReadonlyArray<string>;
  readonly depth: number;
  readonly order: number;
  readonly rawProps: Record<string, unknown>;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly defaultBounds: RenderBoundingBox;
}

export interface RenderGraph {
  readonly rootIds: ReadonlyArray<string>;
  readonly nodes: ReadonlyMap<string, RenderGraphNode>;
  readonly executionOrder: ReadonlyArray<string>;
  readonly totalNodes: number;
}

export function buildRenderGraph(doc: BuilderDocument, pageId?: string): RenderGraph {
  const targetPage = pageId
    ? doc.pages.find((p) => p.id === pageId || p.slug === pageId)
    : doc.pages.find((p) => p.isHome) ?? doc.pages[0];

  const nodes = new Map<string, RenderGraphNode>();
  const rootIds: string[] = [];
  const executionOrder: string[] = [];

  if (!targetPage) {
    return {
      rootIds: [],
      nodes,
      executionOrder: [],
      totalNodes: 0,
    };
  }

  function traverse(
    node: SectionNode,
    parentId?: string,
    depth: number = 0
  ): void {
    const childIds: string[] = [];
    
    // Default fallback box based on props or index
    const width = typeof node.props.width === 'number' ? node.props.width : 100;
    const height = typeof node.props.height === 'number' ? node.props.height : 100;
    const x = typeof node.props.x === 'number' ? node.props.x : 0;
    const y = typeof node.props.y === 'number' ? node.props.y : 0;

    for (const child of node.children ?? []) {
      childIds.push(child.id);
    }

    const graphNode: RenderGraphNode = {
      id: node.id,
      type: node.type,
      label: node.label,
      parentId,
      childIds,
      depth,
      order: node.order,
      rawProps: { ...node.props },
      visible: node.visible !== false,
      locked: Boolean(node.locked),
      defaultBounds: { x, y, width, height },
    };

    nodes.set(node.id, graphNode);
    executionOrder.push(node.id);

    for (const child of node.children ?? []) {
      traverse(child, node.id, depth + 1);
    }
  }

  for (const rootSection of targetPage.sections) {
    rootIds.push(rootSection.id);
    traverse(rootSection, undefined, 0);
  }

  return {
    rootIds,
    nodes,
    executionOrder,
    totalNodes: nodes.size,
  };
}

export function getAncestors(graph: RenderGraph, nodeId: string): RenderGraphNode[] {
  const ancestors: RenderGraphNode[] = [];
  let current = graph.nodes.get(nodeId);

  while (current && current.parentId) {
    const parent = graph.nodes.get(current.parentId);
    if (!parent) break;
    ancestors.push(parent);
    current = parent;
  }

  return ancestors;
}
