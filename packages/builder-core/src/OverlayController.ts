/**
 * OverlayController — C16.4 Selection Overlay Controller
 *
 * Pure logic for computing overlay state from SelectionState + DOM measurements.
 * No React, no DOM access — all inputs are explicit parameters.
 *
 * Responsibilities:
 *   - Compute OverlayRect from a selected section's DOM element
 *   - Compute toolbar position relative to the bounding box
 *   - Determine which resize handles are active
 *   - Compute hover highlight rect
 *   - Handle viewport transformations (zoom, scroll, device preview)
 *
 * Usage:
 *   const overlay = OverlayController.computeOverlayRect(domElement, viewport);
 *   const toolbarPos = OverlayController.computeToolbarPosition(overlayRect);
 *   const handles = OverlayController.getActiveHandles(overlayRect, isLocked);
 */

import type { SectionNode } from './BuilderDocument';
import type {
  SelectionState,
  ViewportSize,
  BreadcrumbItem,
} from './CanvasState';
import type { OverlayRect, OverlayViewport } from './OverlayRect';
import { createOverlayRect } from './OverlayRect';
import type {
  HandleType,
  ToolbarAction,
  ToolbarActionType,
  ToolbarPositionResult,
  OverlayConfig,
} from './OverlayConstants';
import {
  HANDLE_POSITIONS,
  DEFAULT_OVERLAY_CONFIG,
} from './OverlayConstants';
import type { BuilderDocument } from './BuilderDocument';
import { buildBreadcrumbs } from './SelectionEngine';

// ---------------------------------------------------------------------------
// Overlay state — complete snapshot for UI rendering
// ---------------------------------------------------------------------------

export interface OverlayState {
  /** Bounding rect for the selected element */
  readonly boundingRect: OverlayRect | null;
  /** Position for the quick toolbar */
  readonly toolbarPosition: ToolbarPositionResult | null;
  /** Active resize handles */
  readonly activeHandles: HandleType[];
  /** Hover highlight rect (separate from selection) */
  readonly hoverRect: OverlayRect | null;
  /** Whether the overlay is visible */
  readonly visible: boolean;
  /** Breadcrumbs for the selected section */
  readonly breadcrumbs: ReadonlyArray<BreadcrumbItem>;
  /** Currently selected section data (for inspector) */
  readonly selectedSection: SectionNode | null;
  /** Currently hovered section data */
  readonly hoveredSection: SectionNode | null;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createEmptyOverlayState(): OverlayState {
  return {
    boundingRect: null,
    toolbarPosition: null,
    activeHandles: [],
    hoverRect: null,
    visible: false,
    breadcrumbs: [],
    selectedSection: null,
    hoveredSection: null,
  };
}

// ---------------------------------------------------------------------------
// OverlayController — pure static methods
// ---------------------------------------------------------------------------

export class OverlayController {
  // -----------------------------------------------------------------------
  // Compute overlay state from selection + hover
  // -----------------------------------------------------------------------

  static computeOverlayState(params: {
    selection: SelectionState;
    document: BuilderDocument;
    viewport: OverlayViewport;
    config?: Partial<OverlayConfig>;
    getElementRect?: (sectionId: string) => { x: number; y: number; width: number; height: number } | null;
  }): OverlayState {
    const {
      selection,
      document,
      viewport,
      config = {},
      getElementRect,
    } = params;

    const mergedConfig: OverlayConfig = { ...DEFAULT_OVERLAY_CONFIG, ...config };
    const selectedId = selection.selectedIds.length === 1
      ? selection.selectedIds[0]
      : null;

    // If no element rect provider, return empty state
    if (!getElementRect) {
      return createEmptyOverlayState();
    }

    // --- Selection rect ---
    let boundingRect: OverlayRect | null = null;
    let toolbarPosition: ToolbarPositionResult | null = null;
    let activeHandles: HandleType[] = [];
    let selectedSection: SectionNode | null = null;
    let breadcrumbs: ReadonlyArray<BreadcrumbItem> = [];

    if (selectedId) {
      const rect = getElementRect(selectedId);
      if (rect) {
        boundingRect = createOverlayRect({
          ...rect,
          viewport,
          zIndex: mergedConfig.zIndex,
        });

        toolbarPosition = this.computeToolbarPosition(boundingRect, mergedConfig);
        activeHandles = this.computeActiveHandles(selection.lockedIds.includes(selectedId), mergedConfig);
        breadcrumbs = buildBreadcrumbs(document, selectedId);
        selectedSection = this.findSectionById(document, selectedId);
      }
    }

    // --- Hover rect ---
    let hoverRect: OverlayRect | null = null;
    let hoveredSection: SectionNode | null = null;

    if (selection.hoveredId && selection.hoveredId !== selectedId) {
      const rect = getElementRect(selection.hoveredId);
      if (rect) {
        hoverRect = createOverlayRect({
          ...rect,
          viewport,
          zIndex: mergedConfig.zIndex - 1,
        });
        hoveredSection = this.findSectionById(document, selection.hoveredId);
      }
    }

    const visible = boundingRect !== null || hoverRect !== null;

    return {
      boundingRect,
      toolbarPosition,
      activeHandles,
      hoverRect,
      visible,
      breadcrumbs,
      selectedSection,
      hoveredSection,
    };
  }

  // -----------------------------------------------------------------------
  // Compute bounding rect from a raw element position
  // -----------------------------------------------------------------------

  static computeOverlayRect(params: {
    x: number;
    y: number;
    width: number;
    height: number;
    viewport: OverlayViewport;
    zIndex?: number;
  }): OverlayRect {
    return createOverlayRect({
      x: params.x,
      y: params.y,
      width: params.width,
      height: params.height,
      viewport: params.viewport,
      zIndex: params.zIndex ?? DEFAULT_OVERLAY_CONFIG.zIndex,
    });
  }

  // -----------------------------------------------------------------------
  // Toolbar position computation
  // -----------------------------------------------------------------------

  static computeToolbarPosition(
    rect: OverlayRect,
    config: OverlayConfig
  ): ToolbarPositionResult {
    const toolbarY = rect.y + config.toolbarOffsetY;

    // Default: centered above the element
    // For elements near the top of viewport, show below
    const threshold = 60; // px from top
    const nearTop = rect.y < threshold;

    if (nearTop) {
      // Show below the element
      return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height + 8,
        position: 'bottom',
      };
    }

    return {
      x: rect.x + rect.width / 2,
      y: toolbarY,
      position: 'top',
    };
  }

  // -----------------------------------------------------------------------
  // Active handles
  // -----------------------------------------------------------------------

  static computeActiveHandles(
    locked: boolean,
    config: OverlayConfig
  ): HandleType[] {
    if (locked || !config.showResizeHandles) return [];
    return [...HANDLE_POSITIONS];
  }

  // -----------------------------------------------------------------------
  // Hover rect (pure, just wraps element rect in OverlayRect)
  // -----------------------------------------------------------------------

  static computeHoverRect(params: {
    x: number;
    y: number;
    width: number;
    height: number;
    viewport: OverlayViewport;
  }): OverlayRect {
    return createOverlayRect({
      x: params.x,
      y: params.y,
      width: params.width,
      height: params.height,
      viewport: params.viewport,
      zIndex: DEFAULT_OVERLAY_CONFIG.zIndex - 1,
    });
  }

  // -----------------------------------------------------------------------
  // Toolbar action → BuilderCommand mapping
  // -----------------------------------------------------------------------

  static actionToCommand(
    action: ToolbarAction,
    document: BuilderDocument
  ): Record<string, unknown> {
    const { type, sectionId, pageId } = action;

    switch (type) {
      case 'MOVE_UP': {
        const page = document.pages.find(p => p.id === pageId);
        if (!page) return {};
        const idx = page.sections.findIndex(s => s.id === sectionId);
        if (idx <= 0) return {};
        return {
          type: 'MOVE_SECTION',
          pageId,
          fromIndex: idx,
          toIndex: idx - 1,
        };
      }
      case 'MOVE_DOWN': {
        const page = document.pages.find(p => p.id === pageId);
        if (!page) return {};
        const idx = page.sections.findIndex(s => s.id === sectionId);
        if (idx < 0 || idx >= page.sections.length - 1) return {};
        return {
          type: 'MOVE_SECTION',
          pageId,
          fromIndex: idx,
          toIndex: idx + 1,
        };
      }
      case 'DUPLICATE':
        return { type: 'DUPLICATE_SECTION', pageId, sectionId };
      case 'DELETE':
        return { type: 'REMOVE_SECTION', pageId, sectionId };
      case 'LOCK':
        return { type: 'TOGGLE_LOCK', pageId, sectionId };
      case 'UNLOCK':
        return { type: 'TOGGLE_LOCK', pageId, sectionId };
      case 'HIDE':
        return { type: 'TOGGLE_VISIBILITY', pageId, sectionId };
      case 'SHOW':
        return { type: 'TOGGLE_VISIBILITY', pageId, sectionId };
      case 'EDIT_TEXT':
        return {};
      default:
        return {};
    }
  }

  // -----------------------------------------------------------------------
  // Helper: find a section node by id anywhere in the document tree
  // -----------------------------------------------------------------------

  static findSectionById(
    document: BuilderDocument,
    sectionId: string
  ): SectionNode | null {
    for (const page of document.pages) {
      const found = this.findInSections(page.sections, sectionId);
      if (found) return found;
    }
    return null;
  }

  private static findInSections(
    sections: SectionNode[],
    sectionId: string
  ): SectionNode | null {
    for (const section of sections) {
      if (section.id === sectionId) return section;
      if (section.children.length > 0) {
        const found = this.findInSections(section.children, sectionId);
        if (found) return found;
      }
    }
    return null;
  }
}

