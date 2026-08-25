/**
 * PageBuilderCanvasRuntimeAdapter.ts — Sprint G1-56 Canvas Runtime & UI Integration Adapter (Night Shift Level 18)
 *
 * Implements a pure TypeScript, headless canvas runtime & UI integration bridge for Authoring Studio.
 * Connects PageBuilderInteractionEngine (G1-55) & PageSectionBlockCompositionEngine (G1-54) to canvas render surfaces,
 * responsive viewport preview scaling (desktop: 1200px, tablet: 768px, mobile: 375px), visual selection overlays,
 * and workspace HistoryStack transaction boundaries.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot, createVectorWorkspaceState } from '../vector/VectorWorkspaceController';
import {
  PageBuilderInteractionEngine,
  PageBuilderInteractionState,
  BuilderExecutionResult
} from './PageBuilderInteractionEngine';
import {
  PageSectionBlockCompositionEngine,
  PageSectionDTO,
  BlockNodeDTO,
  PageSectionType,
  BlockType,
  ResponsiveBreakpoint,
  EcommerceProductBindingDTO,
  ProjectType
} from './PageSectionBlockCompositionEngine';
import { VectorRenderingBridge } from '../rendering/VectorRenderingBridge';

// ---------------------------------------------------------------------------
// DTOs & Types
// ---------------------------------------------------------------------------

export interface CanvasRuntimeOverlayDTO {
  readonly sectionId?: string;
  readonly blockId?: string;
  readonly boundingBox: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly handleLabels: ReadonlyArray<string>;
}

export interface CanvasRuntimeSession {
  readonly workspaceState: VectorWorkspaceState;
  readonly interactionState: PageBuilderInteractionState;
  readonly viewportWidthPx: number;
  readonly activeOverlay?: CanvasRuntimeOverlayDTO;
}

export interface UIAdapterExecutionResult {
  readonly success: boolean;
  readonly session: CanvasRuntimeSession;
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class PageBuilderCanvasRuntimeAdapter {
  private static readonly BREAKPOINT_WIDTHS: Record<ResponsiveBreakpoint, number> = {
    desktop: 1200,
    tablet: 768,
    mobile: 375
  };

  /**
   * Initializes a new canvas runtime session for visual page building.
   */
  public static initCanvasRuntimeSession(
    workspaceState: VectorWorkspaceState,
    title: string,
    projectType: ProjectType = 'website',
    initialBreakpoint: ResponsiveBreakpoint = 'desktop'
  ): CanvasRuntimeSession {
    const { workspaceState: ws, interactionState: ix } = PageBuilderInteractionEngine.createPageSession(
      workspaceState,
      title,
      projectType
    );

    const viewportWidthPx = this.BREAKPOINT_WIDTHS[initialBreakpoint] || 1200;
    const activeOverlay = this.renderInteractiveSectionOverlay(ix);

    return {
      workspaceState: ws,
      interactionState: ix,
      viewportWidthPx,
      activeOverlay
    };
  }

  /**
   * Synchronizes composition SSOT snapshot with canvas viewport width settings.
   */
  public static syncSnapshotToCanvasRenderSurface(session: CanvasRuntimeSession): VectorDocumentSnapshot {
    if (!session || !session.interactionState) {
      return { nodes: [], selectedIds: [], constraintEdges: [] };
    }
    return PageSectionBlockCompositionEngine.toVectorDocumentSnapshot(session.interactionState.composition);
  }

  /**
   * Computes selection bounding box and handle overlays for section and block editing.
   */
  public static renderInteractiveSectionOverlay(interactionState: PageBuilderInteractionState): CanvasRuntimeOverlayDTO | undefined {
    if (!interactionState || !interactionState.composition) return undefined;

    const { selectedSectionId, selectedBlockId, composition } = interactionState;
    if (!selectedSectionId) return undefined;

    const sectionIndex = composition.sections.findIndex(s => s.id === selectedSectionId);
    if (sectionIndex === -1) return undefined;

    const yPos = sectionIndex * 432;
    const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'drag-reorder', 'duplicate', 'delete'];

    if (selectedBlockId) {
      return {
        sectionId: selectedSectionId,
        blockId: selectedBlockId,
        boundingBox: { x: 40, y: yPos + 30, width: 1120, height: 60 },
        handleLabels: ['edit-text', 'style-props', 'delete-block']
      };
    }

    return {
      sectionId: selectedSectionId,
      boundingBox: { x: 0, y: yPos, width: 1200, height: 400 },
      handleLabels: handles
    };
  }

  /**
   * Dispatches a section insertion user action from visual UI.
   */
  public static dispatchUISectionInsert(
    session: CanvasRuntimeSession,
    sectionType: PageSectionType,
    presetId?: string,
    insertIndex?: number
  ): UIAdapterExecutionResult {
    try {
      const res = PageBuilderInteractionEngine.insertSection(
        session.workspaceState,
        session.interactionState,
        sectionType,
        presetId,
        insertIndex
      );

      if (!res.success) {
        return { success: false, session, error: res.error || 'Section insertion failed' };
      }

      const overlay = this.renderInteractiveSectionOverlay(res.interactionState);
      return {
        success: true,
        session: {
          workspaceState: res.workspaceState,
          interactionState: res.interactionState,
          viewportWidthPx: session.viewportWidthPx,
          activeOverlay: overlay
        }
      };
    } catch (err: any) {
      return { success: false, session, error: err?.message || 'Section insert error' };
    }
  }

  /**
   * Dispatches section selection user action from visual UI.
   */
  public static dispatchUISectionSelect(
    session: CanvasRuntimeSession,
    sectionId?: string
  ): CanvasRuntimeSession {
    if (!session) return session;
    const nextIx = PageBuilderInteractionEngine.selectSection(session.interactionState, sectionId);
    const overlay = this.renderInteractiveSectionOverlay(nextIx);
    return {
      ...session,
      interactionState: nextIx,
      activeOverlay: overlay
    };
  }

  /**
   * Dispatches section reordering user action from visual UI.
   */
  public static dispatchUISectionReorder(
    session: CanvasRuntimeSession,
    sectionId: string,
    targetIndex: number
  ): UIAdapterExecutionResult {
    try {
      const res = PageBuilderInteractionEngine.reorderSection(
        session.workspaceState,
        session.interactionState,
        sectionId,
        targetIndex
      );
      if (!res.success) return { success: false, session, error: res.error };

      const overlay = this.renderInteractiveSectionOverlay(res.interactionState);
      return {
        success: true,
        session: {
          ...session,
          workspaceState: res.workspaceState,
          interactionState: res.interactionState,
          activeOverlay: overlay
        }
      };
    } catch (err: any) {
      return { success: false, session, error: err?.message || 'Section reorder error' };
    }
  }

  /**
   * Dispatches section duplication user action from visual UI.
   */
  public static dispatchUISectionDuplicate(
    session: CanvasRuntimeSession,
    sectionId: string
  ): UIAdapterExecutionResult {
    try {
      const res = PageBuilderInteractionEngine.duplicateSection(
        session.workspaceState,
        session.interactionState,
        sectionId
      );
      if (!res.success) return { success: false, session, error: res.error };

      const overlay = this.renderInteractiveSectionOverlay(res.interactionState);
      return {
        success: true,
        session: {
          ...session,
          workspaceState: res.workspaceState,
          interactionState: res.interactionState,
          activeOverlay: overlay
        }
      };
    } catch (err: any) {
      return { success: false, session, error: err?.message || 'Section duplicate error' };
    }
  }

  /**
   * Dispatches section deletion user action from visual UI.
   */
  public static dispatchUISectionDelete(
    session: CanvasRuntimeSession,
    sectionId: string
  ): UIAdapterExecutionResult {
    try {
      const res = PageBuilderInteractionEngine.deleteSection(
        session.workspaceState,
        session.interactionState,
        sectionId
      );
      if (!res.success) return { success: false, session, error: res.error };

      return {
        success: true,
        session: {
          ...session,
          workspaceState: res.workspaceState,
          interactionState: res.interactionState,
          activeOverlay: undefined
        }
      };
    } catch (err: any) {
      return { success: false, session, error: err?.message || 'Section delete error' };
    }
  }

  /**
   * Dispatches block selection user action from visual UI.
   */
  public static dispatchUIBlockSelect(
    session: CanvasRuntimeSession,
    sectionId: string,
    blockId?: string
  ): CanvasRuntimeSession {
    if (!session) return session;
    const nextIx = PageBuilderInteractionEngine.selectBlock(session.interactionState, sectionId, blockId);
    const overlay = this.renderInteractiveSectionOverlay(nextIx);
    return {
      ...session,
      interactionState: nextIx,
      activeOverlay: overlay
    };
  }

  /**
   * Dispatches block content update user action from visual UI.
   */
  public static dispatchUIBlockContentUpdate(
    session: CanvasRuntimeSession,
    sectionId: string,
    blockId: string,
    patch: Partial<BlockNodeDTO>
  ): UIAdapterExecutionResult {
    try {
      const res = PageBuilderInteractionEngine.updateBlockContent(
        session.workspaceState,
        session.interactionState,
        sectionId,
        blockId,
        patch
      );
      if (!res.success) return { success: false, session, error: res.error };

      const overlay = this.renderInteractiveSectionOverlay(res.interactionState);
      return {
        success: true,
        session: {
          ...session,
          workspaceState: res.workspaceState,
          interactionState: res.interactionState,
          activeOverlay: overlay
        }
      };
    } catch (err: any) {
      return { success: false, session, error: err?.message || 'Block update error' };
    }
  }

  /**
   * Dispatches responsive breakpoint preview switch user action from visual UI.
   */
  public static dispatchUIBreakpointSwitch(
    session: CanvasRuntimeSession,
    breakpoint: ResponsiveBreakpoint
  ): CanvasRuntimeSession {
    if (!session) return session;
    const nextIx = PageBuilderInteractionEngine.switchPreviewBreakpoint(session.interactionState, breakpoint);
    const nextWidth = this.BREAKPOINT_WIDTHS[breakpoint] || 1200;

    return {
      ...session,
      interactionState: nextIx,
      viewportWidthPx: nextWidth
    };
  }

  /**
   * Dispatches ecommerce product binding user action from visual UI.
   */
  public static dispatchUIEcommerceProductBind(
    session: CanvasRuntimeSession,
    sectionId: string,
    blockId: string,
    productBinding: EcommerceProductBindingDTO
  ): UIAdapterExecutionResult {
    return this.dispatchUIBlockContentUpdate(session, sectionId, blockId, { productBinding });
  }

  /**
   * Exports full production HTML page markup string for preview and publishing.
   */
  public static exportCanvasPreviewHtml(session: CanvasRuntimeSession): string {
    if (!session || !session.interactionState) {
      return '<main class="web-factor-page-empty"></main>';
    }
    return PageBuilderInteractionEngine.exportCompositionHtml(session.interactionState);
  }
}
