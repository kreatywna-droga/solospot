/**
 * PreviewRenderingAdapter.ts — Sprint S10 Preview Integration
 *
 * Bridge connecting RenderingEngine frame outputs with Preview Runtime (PM38),
 * Timeline (PM36-40), Inspector (PM35), and Assets (PM42) via public message DTOs.
 * NO DOM, NO React. Pure DTO serializer and channel adapter.
 */

import { RenderFrame, RenderNodeState } from './RenderFrame';

export interface PreviewFrameMessage {
  readonly type: 'RENDER_FRAME_UPDATE';
  readonly frameIndex: number;
  readonly timestampMs: number;
  readonly renderTimeMs: number;
  readonly nodeCount: number;
  readonly dirtyRegionCount: number;
  readonly nodeStates: Record<string, {
    readonly id: string;
    readonly type: string;
    readonly computedProps: Record<string, unknown>;
    readonly opacity: number;
    readonly visible: boolean;
    readonly bounds: { x: number; y: number; width: number; height: number };
  }>;
}

export interface InspectorNodeDetailDTO {
  readonly nodeId: string;
  readonly type: string;
  readonly opacity: number;
  readonly visible: boolean;
  readonly bounds: { x: number; y: number; width: number; height: number };
  readonly props: Record<string, unknown>;
}

export class PreviewRenderingAdapter {
  public static createPreviewFrameMessage(frame: RenderFrame): PreviewFrameMessage {
    const nodeStates: PreviewFrameMessage['nodeStates'] = {};

    for (const [id, state] of frame.nodes.entries()) {
      nodeStates[id] = {
        id: state.nodeId,
        type: state.type,
        computedProps: state.computedProps,
        opacity: state.opacity,
        visible: state.visible,
        bounds: state.bounds,
      };
    }

    return {
      type: 'RENDER_FRAME_UPDATE',
      frameIndex: frame.frameIndex,
      timestampMs: frame.timestampMs,
      renderTimeMs: frame.renderTimeMs,
      nodeCount: frame.nodes.size,
      dirtyRegionCount: frame.dirtyRegions.length,
      nodeStates,
    };
  }

  public static getNodeInspectorDetail(
    frame: RenderFrame,
    nodeId: string
  ): InspectorNodeDetailDTO | undefined {
    const node = frame.nodes.get(nodeId);
    if (!node) return undefined;

    return {
      nodeId: node.nodeId,
      type: node.type,
      opacity: node.opacity,
      visible: node.visible,
      bounds: node.bounds,
      props: node.computedProps,
    };
  }
}
