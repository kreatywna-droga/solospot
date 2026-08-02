// SelectionEngine.ts
// C7: Builder Pro — smart selection, breadcrumbs, parent selection
// C16.4: WEB FACTOR Studio Selection System

import { BuilderDocument, SectionNode } from './BuilderDocument';
import { SelectionState, BreadcrumbItem, CanvasAction, Rect, SelectionBox, DEFAULT_SELECTION } from './CanvasState';
import { findNode } from './SectionTree';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createInitialSelection(): SelectionState {
  return DEFAULT_SELECTION;
}

// ---------------------------------------------------------------------------
// Collect all section IDs from a page (flat list, recursive)
// ---------------------------------------------------------------------------

function collectAllSectionIds(sections: SectionNode[]): string[] {
  const ids: string[] = [];
  function walk(nodes: SectionNode[]) {
    for (const node of nodes) {
      if (!node.locked) ids.push(node.id);
      if (node.children.length > 0) walk(node.children);
    }
  }
  walk(sections);
  return ids;
}

// ---------------------------------------------------------------------------
// Get all siblings of a node (flat list at the same nesting level)
// ---------------------------------------------------------------------------

function getSiblings(
  sections: SectionNode[],
  selectedId: string
): { siblings: SectionNode[]; currentIndex: number } | null {
  // Search root level first
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].id === selectedId) {
      return { siblings: sections, currentIndex: i };
    }
    // Search children recursively
    if (sections[i].children.length > 0) {
      const result = getSiblings(sections[i].children, selectedId);
      if (result) return result;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Get first child of a container
// ---------------------------------------------------------------------------

function getFirstChild(sections: SectionNode[], parentId: string): string | null {
  const found = findNode(sections, parentId);
  if (found && found.node.children.length > 0) {
    return found.node.children[0].id;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Get parent of a node
// ---------------------------------------------------------------------------

function getParentId(sections: SectionNode[], childId: string): { parentId: string; parentNode: SectionNode } | null {
  for (const section of sections) {
    if (section.children.some(c => c.id === childId)) {
      return { parentId: section.id, parentNode: section };
    }
    const result = getParentId(section.children, childId);
    if (result) return result;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Check if a section has visible children
// ---------------------------------------------------------------------------

function hasChildren(sections: SectionNode[], id: string): boolean {
  const found = findNode(sections, id);
  return found ? found.node.children.length > 0 : false;
}

// ---------------------------------------------------------------------------
// Compute bounding rect for a section (simplified for box select)
// ---------------------------------------------------------------------------

function sectionRect(
  sections: SectionNode[],
  sectionId: string,
  sectionPositions: Map<string, Rect>
): Rect | null {
  return sectionPositions.get(sectionId) ?? null;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function reduceSelection(
  state: SelectionState,
  document: BuilderDocument,
  action: CanvasAction
): SelectionState {
  switch (action.type) {
    // --- Single/Multi Select ---
    case 'SELECT_SECTION': {
      if (!action.sectionId) {
        return {
          ...DEFAULT_SELECTION,
          activeBreakpoint: state.activeBreakpoint,
          lockedIds: state.lockedIds,
          hiddenIds: state.hiddenIds,
        };
      }

      // Skip locked sections
      if (state.lockedIds.includes(action.sectionId)) {
        return state;
      }

      // Shift+Click range selection
      if (action.shift && state.anchorId) {
        // Collect all IDs between anchor and current
        const page = document.pages.find(p => p.id === (action.pageId ?? null));
        if (page) {
          const allOrdered = collectAllSectionIds(page.sections);
          const anchorIdx = allOrdered.indexOf(state.anchorId);
          const currentIdx = allOrdered.indexOf(action.sectionId);
          if (anchorIdx >= 0 && currentIdx >= 0) {
            const start = Math.min(anchorIdx, currentIdx);
            const end = Math.max(anchorIdx, currentIdx);
            const range = allOrdered.slice(start, end + 1).filter(id => !state.lockedIds.includes(id));
            return {
              ...state,
              selectedIds: range,
              primarySelectionId: action.sectionId,
              lastClickedId: action.sectionId,
              focusId: action.sectionId,
              selectionMode: 'RANGE',
              breadcrumbs: buildBreadcrumbs(document, action.sectionId),
            };
          }
        }
      }

      // In additive mode (Ctrl+Click): toggle the section in/out of selection
      if (action.additive) {
        const alreadySelected = state.selectedIds.includes(action.sectionId);
        const ids = alreadySelected
          ? state.selectedIds.filter((id) => id !== action.sectionId)
          : [...state.selectedIds, action.sectionId];

        return {
          ...state,
          selectedIds: ids,
          primarySelectionId: ids.length > 0 ? action.sectionId : null,
          lastClickedId: action.sectionId,
          anchorId: action.sectionId,
          focusId: action.sectionId,
          selectionMode: ids.length > 1 ? 'MULTI' : 'SINGLE',
          breadcrumbs: ids.length === 1 ? buildBreadcrumbs(document, action.sectionId) : [],
        };
      }

      // Single select
      const alreadySelected = state.selectedIds.length === 1 && state.selectedIds[0] === action.sectionId;
      const ids = alreadySelected ? [] : [action.sectionId];

      return {
        ...state,
        selectedIds: ids,
        primarySelectionId: ids.length === 1 ? action.sectionId : null,
        lastClickedId: action.sectionId,
        anchorId: ids.length === 1 ? action.sectionId : null,
        focusId: ids.length === 1 ? action.sectionId : null,
        selectionMode: 'SINGLE',
        breadcrumbs: ids.length === 1 ? buildBreadcrumbs(document, action.sectionId) : [],
      };
    }

    // --- Hover ---
    case 'HOVER_SECTION':
      return { ...state, hoveredId: action.sectionId };

    // --- Select All (Ctrl+A) ---
    case 'SELECT_ALL': {
      const page = document.pages.find(p => p.id === action.pageId);
      if (!page) return state;
      const allIds = collectAllSectionIds(page.sections).filter(id => !state.lockedIds.includes(id));
      return { ...state, selectedIds: allIds, lastClickedId: null };
    }

    // --- Select Parent (Escape / ← on container) ---
    case 'SELECT_PARENT': {
      if (state.selectedIds.length === 0) return state;
      const selectedId = state.selectedIds[0];

      for (const page of document.pages) {
        // Check if selected is at root level → already at top
        const rootNode = page.sections.find(s => s.id === selectedId);
        if (rootNode) return state; // already at root level

        // Find parent
        const parentInfo = getParentId(page.sections, selectedId);
        if (parentInfo) {
          return {
            ...state,
            selectedIds: [parentInfo.parentId],
            lastClickedId: parentInfo.parentId,
            breadcrumbs: buildBreadcrumbs(document, parentInfo.parentId),
          };
        }
      }
      return state;
    }

    // --- Select First Child (→) ---
    case 'SELECT_CHILD': {
      if (state.selectedIds.length === 0) return state;
      const selectedId = state.selectedIds[0];

      for (const page of document.pages) {
        const childId = getFirstChild(page.sections, selectedId);
        if (childId) {
          return {
            ...state,
            selectedIds: [childId],
            lastClickedId: childId,
            breadcrumbs: buildBreadcrumbs(document, childId),
          };
        }
      }
      return state;
    }

    // --- Select Next Sibling (↓ / Tab) ---
    case 'SELECT_NEXT': {
      if (state.selectedIds.length === 0) return state;
      const selectedId = state.selectedIds[0];

      for (const page of document.pages) {
        const siblingInfo = getSiblings(page.sections, selectedId);
        if (siblingInfo && siblingInfo.currentIndex < siblingInfo.siblings.length - 1) {
          let nextIndex = siblingInfo.currentIndex + 1;
          // Skip locked sections
          while (nextIndex < siblingInfo.siblings.length && state.lockedIds.includes(siblingInfo.siblings[nextIndex].id)) {
            nextIndex++;
          }
          if (nextIndex < siblingInfo.siblings.length) {
            const nextId = siblingInfo.siblings[nextIndex].id;
            return {
              ...state,
              selectedIds: [nextId],
              lastClickedId: nextId,
              breadcrumbs: buildBreadcrumbs(document, nextId),
            };
          }
        }
      }
      return state;
    }

    // --- Select Previous Sibling (↑ / Shift+Tab) ---
    case 'SELECT_PREV': {
      if (state.selectedIds.length === 0) return state;
      const selectedId = state.selectedIds[0];

      for (const page of document.pages) {
        const siblingInfo = getSiblings(page.sections, selectedId);
        if (siblingInfo && siblingInfo.currentIndex > 0) {
          let prevIndex = siblingInfo.currentIndex - 1;
          // Skip locked sections
          while (prevIndex >= 0 && state.lockedIds.includes(siblingInfo.siblings[prevIndex].id)) {
            prevIndex--;
          }
          if (prevIndex >= 0) {
            const prevId = siblingInfo.siblings[prevIndex].id;
            return {
              ...state,
              selectedIds: [prevId],
              lastClickedId: prevId,
              breadcrumbs: buildBreadcrumbs(document, prevId),
            };
          }
        }
      }
      return state;
    }

    // --- Box Select ---
    case 'BOX_SELECT': {
      const page = document.pages.find(p => p.id === action.pageId);
      if (!page || !action.rect) return state;

      const selectedIds: string[] = [];
      const rect = action.rect;
      const positions = action.sectionPositions ?? new Map();

      function walk(nodes: SectionNode[]) {
        for (const node of nodes) {
          if (state.lockedIds.includes(node.id) || state.hiddenIds.includes(node.id)) continue;
          const pos = positions.get(node.id);
          if (pos) {
            // Check if section rect intersects with selection rect
            const overlapX = rect.x < pos.x + pos.width && rect.x + rect.width > pos.x;
            const overlapY = rect.y < pos.y + pos.height && rect.y + rect.height > pos.y;
            if (overlapX && overlapY) {
              selectedIds.push(node.id);
            }
          }
          if (node.children.length > 0) walk(node.children);
        }
      }
      walk(page.sections);

      return {
        ...state,
        selectedIds,
        lastClickedId: selectedIds.length === 1 ? selectedIds[0] : null,
        breadcrumbs: selectedIds.length === 1 ? buildBreadcrumbs(document, selectedIds[0]) : state.breadcrumbs,
      };
    }

    // --- Toggle Lock ---
    case 'TOGGLE_LOCK': {
      const lockedIds = state.lockedIds.includes(action.sectionId)
        ? state.lockedIds.filter((id) => id !== action.sectionId)
        : [...state.lockedIds, action.sectionId];
      return { ...state, lockedIds };
    }

    // --- Toggle Visibility ---
    case 'TOGGLE_VISIBILITY': {
      const hiddenIds = state.hiddenIds.includes(action.sectionId)
        ? state.hiddenIds.filter((id) => id !== action.sectionId)
        : [...state.hiddenIds, action.sectionId];
      return { ...state, hiddenIds };
    }

    // --- Set Breakpoint ---
    case 'SET_BREAKPOINT':
      return { ...state, activeBreakpoint: action.breakpoint };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Breadcrumb builder — full path from store → page → container → element
// ---------------------------------------------------------------------------

export function buildBreadcrumbs(
  document: BuilderDocument,
  sectionId: string
): ReadonlyArray<BreadcrumbItem> {
  // Find which page contains this section
  for (const page of document.pages) {
    const found = findNode(page.sections, sectionId);
    if (found) {
      const breadcrumbs: BreadcrumbItem[] = [];

      // 1. Page level
      breadcrumbs.push({
        id: page.id,
        type: 'page',
        label: page.name || page.slug || 'Page',
      });

      // 2. Build path from root to the selected node
      // We need to traverse the path array from findNode
      let currentSections = page.sections;
      for (let i = 0; i < found.path.length - 1; i++) {
        const idx = found.path[i];
        if (idx < currentSections.length) {
          const node = currentSections[idx];
          breadcrumbs.push({
            id: node.id,
            type: node.type,
            label: node.label || node.type,
          });
          currentSections = node.children;
        }
      }

      // 3. The selected node itself
      breadcrumbs.push({
        id: found.node.id,
        type: found.node.type,
        label: found.node.label || found.node.type,
      });

      return breadcrumbs;
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Parent selection helper (navigate up the tree)
// ---------------------------------------------------------------------------

export function selectParent(
  state: SelectionState,
  document: BuilderDocument
): SelectionState {
  if (state.selectedIds.length === 0) return state;

  const selectedId = state.selectedIds[0];

  for (const page of document.pages) {
    const parentInfo = getParentId(page.sections, selectedId);
    if (parentInfo) {
      return {
        ...state,
        selectedIds: [parentInfo.parentId],
        lastClickedId: parentInfo.parentId,
        breadcrumbs: buildBreadcrumbs(document, parentInfo.parentId),
      };
    }
  }

  return state;
}

/** Compute a selection box from start and current mouse positions */
export function computeSelectionBox(
  start: { x: number; y: number },
  current: { x: number; y: number }
): SelectionBox {
  const x = Math.min(start.x, current.x);
  const y = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);

  return {
    start,
    current,
    rect: { x, y, width, height },
    isDragging: width > 4 || height > 4, // minimum threshold
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isLocked(state: SelectionState, sectionId: string): boolean {
  return state.lockedIds.includes(sectionId);
}

export function isHidden(state: SelectionState, sectionId: string): boolean {
  return state.hiddenIds.includes(sectionId);
}

export function isSelected(state: SelectionState, sectionId: string): boolean {
  return state.selectedIds.includes(sectionId);
}

export function isLastClicked(state: SelectionState, sectionId: string): boolean {
  return state.lastClickedId === sectionId;
}

/** Check if this is a container with children */
export function isContainer(sections: SectionNode[], id: string): boolean {
  const found = findNode(sections, id);
  return found ? found.node.children.length > 0 : false;
}

/** Get the next selectable sibling */
export function getNextSiblingId(
  sections: SectionNode[],
  currentId: string,
  lockedIds: string[]
): string | null {
  const siblingInfo = getSiblings(sections, currentId);
  if (!siblingInfo) return null;

  for (let i = siblingInfo.currentIndex + 1; i < siblingInfo.siblings.length; i++) {
    const id = siblingInfo.siblings[i].id;
    if (!lockedIds.includes(id)) return id;
  }
  return null;
}

/** Get the previous selectable sibling */
export function getPrevSiblingId(
  sections: SectionNode[],
  currentId: string,
  lockedIds: string[]
): string | null {
  const siblingInfo = getSiblings(sections, currentId);
  if (!siblingInfo) return null;

  for (let i = siblingInfo.currentIndex - 1; i >= 0; i--) {
    const id = siblingInfo.siblings[i].id;
    if (!lockedIds.includes(id)) return id;
  }
  return null;
}

