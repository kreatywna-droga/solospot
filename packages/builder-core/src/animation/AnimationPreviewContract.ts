/**
 * AnimationPreviewContract.ts — PM34 Serializable Preview Message Contract
 *
 * Defines pure, JSON-serializable message types for browser environmental signals
 * sent from preview runtime to builder-core.
 * NO DOM objects, NO HTMLElement, NO window, NO document, NO Event instances.
 */

export type PreviewTriggerMessageType =
  | 'SCROLL_EVENT'
  | 'HOVER_EVENT'
  | 'CLICK_EVENT'
  | 'INTERSECTION_EVENT'
  | 'VIEWPORT_RESIZE_EVENT';

export interface BasePreviewTriggerMessage {
  type: PreviewTriggerMessageType;
  timestamp: number;
}

export interface ScrollPreviewMessage extends BasePreviewTriggerMessage {
  type: 'SCROLL_EVENT';
  scrollY: number;
  scrollX?: number;
  progress?: number;
}

export interface HoverPreviewMessage extends BasePreviewTriggerMessage {
  type: 'HOVER_EVENT';
  hoveredNodeIds: string[];
  activeHoverNodeId?: string;
  isHovered: boolean;
  targetNodeId?: string;
}

export interface ClickPreviewMessage extends BasePreviewTriggerMessage {
  type: 'CLICK_EVENT';
  clickedNodeId: string;
  isClicked: boolean;
}

export interface IntersectionPreviewMessage extends BasePreviewTriggerMessage {
  type: 'INTERSECTION_EVENT';
  targetNodeId: string;
  visibilityRatio: number;
}

export interface ViewportResizePreviewMessage extends BasePreviewTriggerMessage {
  type: 'VIEWPORT_RESIZE_EVENT';
  width: number;
  height: number;
}

export type PreviewTriggerMessage =
  | ScrollPreviewMessage
  | HoverPreviewMessage
  | ClickPreviewMessage
  | IntersectionPreviewMessage
  | ViewportResizePreviewMessage;

// Message Factory Helpers

export function createScrollMessage(
  scrollY: number,
  progress: number = 0,
  timestamp: number = Date.now()
): ScrollPreviewMessage {
  return {
    type: 'SCROLL_EVENT',
    scrollY,
    progress,
    timestamp,
  };
}

export function createHoverMessage(
  targetNodeId: string,
  isHovered: boolean,
  timestamp: number = Date.now()
): HoverPreviewMessage {
  return {
    type: 'HOVER_EVENT',
    hoveredNodeIds: isHovered ? [targetNodeId] : [],
    activeHoverNodeId: isHovered ? targetNodeId : undefined,
    isHovered,
    targetNodeId,
    timestamp,
  };
}

export function createClickMessage(
  clickedNodeId: string,
  timestamp: number = Date.now()
): ClickPreviewMessage {
  return {
    type: 'CLICK_EVENT',
    clickedNodeId,
    isClicked: true,
    timestamp,
  };
}

export function createIntersectionMessage(
  targetNodeId: string,
  visibilityRatio: number,
  timestamp: number = Date.now()
): IntersectionPreviewMessage {
  return {
    type: 'INTERSECTION_EVENT',
    targetNodeId,
    visibilityRatio,
    timestamp,
  };
}

export function createViewportResizeMessage(
  width: number,
  height: number,
  timestamp: number = Date.now()
): ViewportResizePreviewMessage {
  return {
    type: 'VIEWPORT_RESIZE_EVENT',
    width,
    height,
    timestamp,
  };
}
