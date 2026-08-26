/**
 * VectorClipboardEngine.ts — Sprint G1-29 Vector In-Memory Pure TS Clipboard Engine
 *
 * Provides pure TS clipboard DTO payload creation and spatial offset pasting with
 * deep recursive ID remapping for nested groups and collision prevention.
 */

import { VectorNode, ShapeGroupNode } from './VectorDomainModel';

export interface VectorClipboardPayload {
  version: number;
  schema: 'vector_clipboard';
  copiedAt: number;
  shapes: VectorNode[];
}

export class VectorClipboardEngine {
  private static globalClipboardBuffer: VectorClipboardPayload | null = null;
  private static pasteCounter: number = 0;

  /**
   * Serializes selected nodes into a portable VectorClipboardPayload DTO.
   */
  public static copyShapes(nodes: ReadonlyArray<VectorNode>): VectorClipboardPayload | null {
    if (!nodes || nodes.length === 0) return null;

    const payload: VectorClipboardPayload = {
      version: 1,
      schema: 'vector_clipboard',
      copiedAt: Date.now(),
      shapes: JSON.parse(JSON.stringify(nodes)),
    };

    VectorClipboardEngine.globalClipboardBuffer = payload;
    VectorClipboardEngine.pasteCounter = 0;
    return payload;
  }

  /**
   * Pastes a ClipboardPayload with spatial offset and deep recursive ID remapping.
   */
  public static pasteShapes(
    payload: VectorClipboardPayload | null = VectorClipboardEngine.globalClipboardBuffer,
    baseOffsetX: number = 20,
    baseOffsetY: number = 20
  ): { pastedNodes: VectorNode[]; newSelectedIds: string[] } | null {
    const activePayload = payload || VectorClipboardEngine.globalClipboardBuffer;
    if (!activePayload || !activePayload.shapes || activePayload.shapes.length === 0) {
      return null;
    }

    VectorClipboardEngine.pasteCounter++;
    const step = ((VectorClipboardEngine.pasteCounter - 1) % 10) + 1;
    const cumulativeOffsetX = baseOffsetX * step;
    const cumulativeOffsetY = baseOffsetY * step;

    const pastedNodes: VectorNode[] = [];
    const newSelectedIds: string[] = [];

    for (const shape of activePayload.shapes) {
      const clonedShape = VectorClipboardEngine.remapNodeIdsRecursively(shape);

      const offsetShape: VectorNode = {
        ...clonedShape,
        transform: {
          ...clonedShape.transform,
          x: clonedShape.transform.x + cumulativeOffsetX,
          y: clonedShape.transform.y + cumulativeOffsetY,
        },
      } as VectorNode;

      pastedNodes.push(offsetShape);
      newSelectedIds.push(offsetShape.id);
    }

    return {
      pastedNodes,
      newSelectedIds,
    };
  }

  /**
   * Deeply remaps all node IDs recursively for shapes and group children.
   */
  public static remapNodeIdsRecursively(node: VectorNode): VectorNode {
    const freshId = `shape_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    if (node.type === 'group') {
      const groupNode = node as ShapeGroupNode;
      const remappedChildren = groupNode.children.map(child =>
        VectorClipboardEngine.remapNodeIdsRecursively(child)
      );

      return {
        ...groupNode,
        id: freshId,
        children: remappedChildren,
      };
    }

    return {
      ...node,
      id: freshId,
    };
  }

  /**
   * Gets current global clipboard buffer.
   */
  public static getBuffer(): VectorClipboardPayload | null {
    return VectorClipboardEngine.globalClipboardBuffer;
  }

  /**
   * Clears in-memory clipboard buffer.
   */
  public static clearBuffer(): void {
    VectorClipboardEngine.globalClipboardBuffer = null;
    VectorClipboardEngine.pasteCounter = 0;
  }

  /**
   * Resets spatial offset paste counter back to 0.
   */
  public static resetPasteCount(): void {
    VectorClipboardEngine.pasteCounter = 0;
  }
}
