/**
 * PageBuilderInteractionEngine.ts — Sprint G1-55 Visual Page Builder & Section Editing System (Night Shift Level 17)
 *
 * Implements a pure TypeScript, headless interaction engine for visual page building, section selection/editing,
 * block manipulation, responsive breakpoint switching, and product catalog bindings in WEB FACTOR Authoring Studio.
 *
 * Bridges PageSectionBlockCompositionEngine (G1-54) into an interactive builder model.
 * Obeying all SSOT invariants, single-commit HistoryStack transaction boundaries, and zero-mutation preview semantics.
 *
 * NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorNode, VectorConstraintEdge } from '../vector/VectorDomainModel';
import { VectorDocumentSnapshot, VectorWorkspaceState } from '../vector/VectorWorkspaceController';
import {
  PageSectionBlockCompositionEngine,
  PageCompositionDocument,
  PageSectionDTO,
  BlockNodeDTO,
  PageSectionType,
  BlockType,
  ResponsiveBreakpoint,
  ResponsiveLayoutConfig,
  EcommerceProductBindingDTO,
  ProjectType
} from './PageSectionBlockCompositionEngine';
import { VectorWorkflowOrchestrator } from '../vector/VectorWorkflowOrchestrator';
import { WorkflowExecutionResult } from '../vector/VectorDeterministicWorkflowEngine';

// ---------------------------------------------------------------------------
// DTOs & Types
// ---------------------------------------------------------------------------

export interface PageBuilderInteractionState {
  readonly composition: PageCompositionDocument;
  readonly selectedSectionId?: string;
  readonly selectedBlockId?: string;
  readonly activeBreakpoint: ResponsiveBreakpoint;
  readonly isPreviewing: boolean;
}

export interface BuilderExecutionResult {
  readonly success: boolean;
  readonly workspaceState: VectorWorkspaceState;
  readonly interactionState: PageBuilderInteractionState;
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class PageBuilderInteractionEngine {
  /**
   * Initializes a new interactive visual page builder session.
   */
  public static createPageSession(
    workspaceState: VectorWorkspaceState,
    title: string,
    projectType: ProjectType = 'website'
  ): { workspaceState: VectorWorkspaceState; interactionState: PageBuilderInteractionState } {
    const composition = PageSectionBlockCompositionEngine.createPageComposition(title, projectType);
    const interactionState: PageBuilderInteractionState = {
      composition,
      selectedSectionId: undefined,
      selectedBlockId: undefined,
      activeBreakpoint: 'desktop',
      isPreviewing: false
    };

    return {
      workspaceState,
      interactionState
    };
  }

  /**
   * Selects a section in the page composition.
   */
  public static selectSection(
    interactionState: PageBuilderInteractionState,
    sectionId?: string
  ): PageBuilderInteractionState {
    if (!interactionState || !interactionState.composition) return interactionState;

    const validSection = sectionId
      ? interactionState.composition.sections.find(s => s.id === sectionId)
      : undefined;

    return {
      ...interactionState,
      selectedSectionId: validSection ? validSection.id : undefined,
      selectedBlockId: undefined
    };
  }

  /**
   * Selects a block within a section.
   */
  public static selectBlock(
    interactionState: PageBuilderInteractionState,
    sectionId: string,
    blockId?: string
  ): PageBuilderInteractionState {
    if (!interactionState || !interactionState.composition) return interactionState;

    const section = interactionState.composition.sections.find(s => s.id === sectionId);
    if (!section) return interactionState;

    const findBlock = (blocks: ReadonlyArray<BlockNodeDTO>, bId: string): BlockNodeDTO | undefined => {
      for (const b of blocks) {
        if (b.id === bId) return b;
        if (b.children && b.children.length > 0) {
          const found = findBlock(b.children, bId);
          if (found) return found;
        }
      }
      return undefined;
    };

    const validBlock = blockId ? findBlock(section.blocks, blockId) : undefined;

    return {
      ...interactionState,
      selectedSectionId: sectionId,
      selectedBlockId: validBlock ? validBlock.id : undefined
    };
  }

  /**
   * Switches the active responsive preview breakpoint context (desktop | tablet | mobile).
   */
  public static switchPreviewBreakpoint(
    interactionState: PageBuilderInteractionState,
    breakpoint: ResponsiveBreakpoint
  ): PageBuilderInteractionState {
    if (!interactionState) return interactionState;
    return {
      ...interactionState,
      activeBreakpoint: breakpoint
    };
  }

  /**
   * Inserts a section into the composition and synchronizes SSOT workspace state via transaction.
   */
  public static insertSection(
    workspaceState: VectorWorkspaceState,
    interactionState: PageBuilderInteractionState,
    sectionType: PageSectionType,
    presetId?: string,
    insertIndex?: number
  ): BuilderExecutionResult {
    try {
      const updatedComp = PageSectionBlockCompositionEngine.addSection(
        interactionState.composition,
        sectionType,
        presetId,
        insertIndex
      );

      const nextSnapshot = PageSectionBlockCompositionEngine.toVectorDocumentSnapshot(updatedComp);
      const newSection = updatedComp.sections[typeof insertIndex === 'number' ? insertIndex : updatedComp.sections.length - 1];

      const res = VectorWorkflowOrchestrator.executeAddPageSectionTransaction(workspaceState, sectionType, presetId);
      if (!res.success || !res.state) {
        return {
          success: false,
          workspaceState,
          interactionState,
          error: (typeof res.error === 'string' ? res.error : res.error?.message) || 'Failed'
        };
      }

      // Synchronize workspace snapshot with section composition SSOT
      const syncedState: VectorWorkspaceState = {
        ...res.state,
        snapshot: nextSnapshot
      };

      const nextInteractionState: PageBuilderInteractionState = {
        ...interactionState,
        composition: updatedComp,
        selectedSectionId: newSection?.id || undefined,
        selectedBlockId: undefined
      };

      return {
        success: true,
        workspaceState: syncedState,
        interactionState: nextInteractionState
      };
    } catch (err: any) {
      return {
        success: false,
        workspaceState,
        interactionState,
        error: err?.message || 'Section insertion error'
      };
    }
  }

  /**
   * Deletes a section from the page composition.
   */
  public static deleteSection(
    workspaceState: VectorWorkspaceState,
    interactionState: PageBuilderInteractionState,
    sectionId: string
  ): BuilderExecutionResult {
    try {
      const updatedComp = PageSectionBlockCompositionEngine.removeSection(interactionState.composition, sectionId);
      const nextSnapshot = PageSectionBlockCompositionEngine.toVectorDocumentSnapshot(updatedComp);

      const res = VectorWorkflowOrchestrator.executeRemovePageSectionTransaction(workspaceState, sectionId);
      if (!res.success || !res.state) {
        return {
          success: false,
          workspaceState,
          interactionState,
          error: (typeof res.error === 'string' ? res.error : res.error?.message) || 'Failed'
        };
      }

      const syncedState: VectorWorkspaceState = {
        ...res.state,
        snapshot: nextSnapshot
      };

      const nextInteractionState: PageBuilderInteractionState = {
        ...interactionState,
        composition: updatedComp,
        selectedSectionId: undefined,
        selectedBlockId: undefined
      };

      return {
        success: true,
        workspaceState: syncedState,
        interactionState: nextInteractionState
      };
    } catch (err: any) {
      return {
        success: false,
        workspaceState,
        interactionState,
        error: err?.message || 'Section deletion error'
      };
    }
  }

  /**
   * Reorders a section to a target index.
   */
  public static reorderSection(
    workspaceState: VectorWorkspaceState,
    interactionState: PageBuilderInteractionState,
    sectionId: string,
    targetIndex: number
  ): BuilderExecutionResult {
    try {
      const updatedComp = PageSectionBlockCompositionEngine.reorderSections(
        interactionState.composition,
        sectionId,
        targetIndex
      );
      const nextSnapshot = PageSectionBlockCompositionEngine.toVectorDocumentSnapshot(updatedComp);

      const nextHistoryStack = workspaceState.historyStack.push(nextSnapshot, `Reorder Section (${sectionId})`);
      const syncedState: VectorWorkspaceState = {
        snapshot: nextSnapshot,
        historyStack: nextHistoryStack
      };

      return {
        success: true,
        workspaceState: syncedState,
        interactionState: {
          ...interactionState,
          composition: updatedComp,
          selectedSectionId: sectionId
        }
      };
    } catch (err: any) {
      return {
        success: false,
        workspaceState,
        interactionState,
        error: err?.message || 'Section reorder error'
      };
    }
  }

  /**
   * Duplicates an existing section in the composition.
   */
  public static duplicateSection(
    workspaceState: VectorWorkspaceState,
    interactionState: PageBuilderInteractionState,
    sectionId: string
  ): BuilderExecutionResult {
    try {
      const section = interactionState.composition.sections.find(s => s.id === sectionId);
      if (!section) {
        return { success: false, workspaceState, interactionState, error: `Section ${sectionId} not found` };
      }

      const copyId = `sec_${section.type}_copy_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const duplicatedSection: PageSectionDTO = {
        ...JSON.parse(JSON.stringify(section)),
        id: copyId,
        title: `${section.title} (Copy)`
      };

      const currIdx = interactionState.composition.sections.findIndex(s => s.id === sectionId);
      const nextSections = [...interactionState.composition.sections];
      nextSections.splice(currIdx + 1, 0, duplicatedSection);

      const updatedComp: PageCompositionDocument = {
        ...interactionState.composition,
        sections: nextSections,
        updatedAt: Date.now()
      };

      const nextSnapshot = PageSectionBlockCompositionEngine.toVectorDocumentSnapshot(updatedComp);
      const nextHistoryStack = workspaceState.historyStack.push(nextSnapshot, `Duplicate Section (${sectionId})`);

      return {
        success: true,
        workspaceState: { snapshot: nextSnapshot, historyStack: nextHistoryStack },
        interactionState: {
          ...interactionState,
          composition: updatedComp,
          selectedSectionId: copyId
        }
      };
    } catch (err: any) {
      return { success: false, workspaceState, interactionState, error: err?.message || 'Duplicate section error' };
    }
  }

  /**
   * Inserts a block into a section or container block.
   */
  public static insertBlock(
    workspaceState: VectorWorkspaceState,
    interactionState: PageBuilderInteractionState,
    sectionId: string,
    block: BlockNodeDTO,
    parentBlockId?: string
  ): BuilderExecutionResult {
    try {
      const updatedComp = PageSectionBlockCompositionEngine.insertBlock(
        interactionState.composition,
        sectionId,
        block,
        parentBlockId
      );
      const nextSnapshot = PageSectionBlockCompositionEngine.toVectorDocumentSnapshot(updatedComp);
      const nextHistoryStack = workspaceState.historyStack.push(nextSnapshot, `Insert Block (${block.type})`);

      return {
        success: true,
        workspaceState: { snapshot: nextSnapshot, historyStack: nextHistoryStack },
        interactionState: {
          ...interactionState,
          composition: updatedComp,
          selectedSectionId: sectionId,
          selectedBlockId: block.id
        }
      };
    } catch (err: any) {
      return { success: false, workspaceState, interactionState, error: err?.message || 'Insert block error' };
    }
  }

  /**
   * Deletes a block from a section.
   */
  public static deleteBlock(
    workspaceState: VectorWorkspaceState,
    interactionState: PageBuilderInteractionState,
    sectionId: string,
    blockId: string
  ): BuilderExecutionResult {
    try {
      const updatedComp = PageSectionBlockCompositionEngine.removeBlock(
        interactionState.composition,
        sectionId,
        blockId
      );
      const nextSnapshot = PageSectionBlockCompositionEngine.toVectorDocumentSnapshot(updatedComp);
      const nextHistoryStack = workspaceState.historyStack.push(nextSnapshot, `Delete Block (${blockId})`);

      return {
        success: true,
        workspaceState: { snapshot: nextSnapshot, historyStack: nextHistoryStack },
        interactionState: {
          ...interactionState,
          composition: updatedComp,
          selectedSectionId: sectionId,
          selectedBlockId: undefined
        }
      };
    } catch (err: any) {
      return { success: false, workspaceState, interactionState, error: err?.message || 'Delete block error' };
    }
  }

  /**
   * Updates block content or style properties.
   */
  public static updateBlockContent(
    workspaceState: VectorWorkspaceState,
    interactionState: PageBuilderInteractionState,
    sectionId: string,
    blockId: string,
    contentPatch: Partial<BlockNodeDTO>
  ): BuilderExecutionResult {
    try {
      const updatedComp = PageSectionBlockCompositionEngine.updateBlockContent(
        interactionState.composition,
        sectionId,
        blockId,
        contentPatch
      );
      const nextSnapshot = PageSectionBlockCompositionEngine.toVectorDocumentSnapshot(updatedComp);
      const nextHistoryStack = workspaceState.historyStack.push(nextSnapshot, `Update Block (${blockId})`);

      return {
        success: true,
        workspaceState: { snapshot: nextSnapshot, historyStack: nextHistoryStack },
        interactionState: {
          ...interactionState,
          composition: updatedComp,
          selectedSectionId: sectionId,
          selectedBlockId: blockId
        }
      };
    } catch (err: any) {
      return { success: false, workspaceState, interactionState, error: err?.message || 'Update block content error' };
    }
  }

  /**
   * Updates responsive section layout settings for active breakpoint context.
   */
  public static updateSectionLayout(
    workspaceState: VectorWorkspaceState,
    interactionState: PageBuilderInteractionState,
    sectionId: string,
    breakpoint: ResponsiveBreakpoint,
    layoutConfig: Partial<ResponsiveLayoutConfig>
  ): BuilderExecutionResult {
    try {
      const updatedComp = PageSectionBlockCompositionEngine.setResponsiveLayout(
        interactionState.composition,
        sectionId,
        breakpoint,
        layoutConfig
      );
      const nextSnapshot = PageSectionBlockCompositionEngine.toVectorDocumentSnapshot(updatedComp);
      const nextHistoryStack = workspaceState.historyStack.push(nextSnapshot, `Update Section Layout (${breakpoint})`);

      return {
        success: true,
        workspaceState: { snapshot: nextSnapshot, historyStack: nextHistoryStack },
        interactionState: {
          ...interactionState,
          composition: updatedComp,
          selectedSectionId: sectionId
        }
      };
    } catch (err: any) {
      return { success: false, workspaceState, interactionState, error: err?.message || 'Update section layout error' };
    }
  }

  /**
   * Binds an ecommerce product DTO to a block node.
   */
  public static bindEcommerceProduct(
    workspaceState: VectorWorkspaceState,
    interactionState: PageBuilderInteractionState,
    sectionId: string,
    blockId: string,
    productBinding: EcommerceProductBindingDTO
  ): BuilderExecutionResult {
    return this.updateBlockContent(workspaceState, interactionState, sectionId, blockId, { productBinding });
  }

  /**
   * Computes optimistic preview snapshot without mutating SSOT or HistoryStack (0 HistoryStack entries).
   */
  public static previewCurrentComposition(
    workspaceState: VectorWorkspaceState,
    interactionState: PageBuilderInteractionState
  ): VectorDocumentSnapshot {
    if (!interactionState || !interactionState.composition) {
      return workspaceState.snapshot;
    }
    return PageSectionBlockCompositionEngine.toVectorDocumentSnapshot(interactionState.composition);
  }

  /**
   * Exports full semantic HTML string for live preview and publishing.
   */
  public static exportCompositionHtml(interactionState: PageBuilderInteractionState): string {
    if (!interactionState || !interactionState.composition) {
      return '<main class="web-factor-page-empty"></main>';
    }
    return PageSectionBlockCompositionEngine.exportToHtmlString(interactionState.composition);
  }
}
