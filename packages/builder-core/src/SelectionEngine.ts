// SelectionEngine.ts
// C7: Builder Pro — smart selection, breadcrumbs, parent selection

import { BuilderDocument, SectionNode } from './BuilderDocument';
import { SelectionState, BreadcrumbItem, CanvasAction, DEFAULT_SELECTION } from './CanvasState';
import { findNode } from './SectionTree';

export function createInitialSelection(): SelectionState {
  return DEFAULT_SELECTION;
}

export function reduceSelection(
  state: SelectionState,
  document: BuilderDocument,
  action: CanvasAction
): SelectionState {
  switch (action.type) {
    case 'SELECT_SECTION': {
      if (!action.sectionId) {
        return { ...DEFAULT_SELECTION, activeBreakpoint: state.activeBreakpoint };
      }

      const alreadySelected = state.selectedIds.includes(action.sectionId);
      const ids = action.additive
        ? alreadySelected
          ? state.selectedIds.filter((id) => id !== action.sectionId)
          : [...state.selectedIds, action.sectionId]
        : alreadySelected
          ? []
          : [action.sectionId];

      const breadcrumbs = buildBreadcrumbs(document, action.sectionId);

      return { ...state, selectedIds: ids, breadcrumbs };
    }

    case 'HOVER_SECTION':
      return { ...state, hoveredId: action.sectionId };

    case 'TOGGLE_LOCK': {
      const lockedIds = state.lockedIds.includes(action.sectionId)
        ? state.lockedIds.filter((id) => id !== action.sectionId)
        : [...state.lockedIds, action.sectionId];
      return { ...state, lockedIds };
    }

    case 'TOGGLE_VISIBILITY': {
      const hiddenIds = state.hiddenIds.includes(action.sectionId)
        ? state.hiddenIds.filter((id) => id !== action.sectionId)
        : [...state.hiddenIds, action.sectionId];
      return { ...state, hiddenIds };
    }

    case 'SET_BREAKPOINT':
      return { ...state, activeBreakpoint: action.breakpoint };

    default:
      return state;
  }
}

export function buildBreadcrumbs(document: BuilderDocument, sectionId: string): ReadonlyArray<BreadcrumbItem> {
  for (const page of document.pages) {
    const found = findNode(page.sections, sectionId);
    if (found) {
      const breadcrumbs: BreadcrumbItem[] = [
        {
          id: document.id,
          type: 'document',
          label: document.metadata.storeName || 'Store',
        },
      ];

      const node = found.node;
      breadcrumbs.push({
        id: node.id,
        type: node.type,
        label: node.label || node.type,
      });

      return breadcrumbs;
    }
  }
  return [];
}

export function selectParent(
  state: SelectionState,
  document: BuilderDocument
): SelectionState {
  if (state.selectedIds.length === 0) return state;

  const selectedId = state.selectedIds[0];

  for (const page of document.pages) {
    const found = findNode(page.sections, selectedId);
    if (found && found.path.length > 0) {
      return {
        ...state,
        selectedIds: [found.node.id],
        breadcrumbs: buildBreadcrumbs(document, found.node.id),
      };
    }
  }

  return state;
}

export function isLocked(state: SelectionState, sectionId: string): boolean {
  return state.lockedIds.includes(sectionId);
}

export function isHidden(state: SelectionState, sectionId: string): boolean {
  return state.hiddenIds.includes(sectionId);
}
