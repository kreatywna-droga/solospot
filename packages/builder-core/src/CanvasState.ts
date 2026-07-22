/**
 * CanvasState — C6.1-A
 *
 * Describes the editor canvas state: selection, hover, drag, viewport simulation,
 * and zoom level.  Pure data — no DOM, no React.
 *
 * The canvas state is driven by a pure reducer (reduceCanvasState) so it can be
 * tested without a browser environment.
 */

import { BuilderCommand } from './BuilderCommands';

// ---------------------------------------------------------------------------
// Viewport simulation
// ---------------------------------------------------------------------------

export type ViewportLabel = 'MOBILE' | 'TABLET' | 'DESKTOP';

export interface ViewportSize {
  readonly width: number;
  readonly label: ViewportLabel;
}

export const VIEWPORT_PRESETS: Record<ViewportLabel, ViewportSize> = {
  MOBILE:  { width: 375,  label: 'MOBILE'  },
  TABLET:  { width: 768,  label: 'TABLET'  },
  DESKTOP: { width: 1280, label: 'DESKTOP' },
};

// ---------------------------------------------------------------------------
// Drag state
// ---------------------------------------------------------------------------

export interface DragState {
  readonly sectionId: string;
  readonly sourcePageId: string;
  readonly sourceIndex: number;
  readonly currentIndex: number;
  readonly isDragging: boolean;
}

// ---------------------------------------------------------------------------
// Resize state
// ---------------------------------------------------------------------------

export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface ResizeState {
  readonly sectionId: string;
  readonly handle: ResizeHandle;
  readonly startSize: { width: number; height: number };
  readonly currentSize: { width: number; height: number };
  readonly isResizing: boolean;
}

// ---------------------------------------------------------------------------
// Selection state
// ---------------------------------------------------------------------------

export interface SelectionState {
  readonly selectedIds: ReadonlyArray<string>;
  readonly hoveredId: string | null;
  readonly activeBreakpoint: ViewportLabel;
  readonly lockedIds: ReadonlyArray<string>;
  readonly hiddenIds: ReadonlyArray<string>;
  readonly breadcrumbs: ReadonlyArray<BreadcrumbItem>;
}

export const DEFAULT_SELECTION: SelectionState = {
  selectedIds: [],
  hoveredId: null,
  activeBreakpoint: 'DESKTOP',
  lockedIds: [],
  hiddenIds: [],
  breadcrumbs: [],
};

// ---------------------------------------------------------------------------
// Grid configuration
// ---------------------------------------------------------------------------

export interface GridConfig {
  readonly columns: number;
  readonly gutter: number;
  readonly margin: number;
  readonly snapToGrid: boolean;
  readonly showGuides: boolean;
  readonly showRulers: boolean;
}

export interface SnapResult {
  readonly x: number;
  readonly y: number;
  readonly snapped: boolean;
  readonly guides: ReadonlyArray<{ axis: 'x' | 'y'; position: number }>;
}

export interface SnapInput {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly containerWidth: number;
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: 12,
  gutter: 16,
  margin: 24,
  snapToGrid: true,
  showGuides: true,
  showRulers: false,
};

// ---------------------------------------------------------------------------
// Alignment
// ---------------------------------------------------------------------------

export type Alignment =
  | 'LEFT'
  | 'CENTER'
  | 'RIGHT'
  | 'STRETCH'
  | 'TOP'
  | 'MIDDLE'
  | 'BOTTOM'
  | 'DISTRIBUTE_HORIZONTAL'
  | 'DISTRIBUTE_VERTICAL'
  | 'EQUAL_HEIGHT'
  | 'EQUAL_WIDTH';

// ---------------------------------------------------------------------------
// Smart selection
// ---------------------------------------------------------------------------

export interface SmartHandle {
  readonly type: 'move' | 'resize' | 'delete' | 'duplicate';
  readonly position: { x: number; y: number };
  readonly cursor: string;
}

export interface BreadcrumbItem {
  readonly id: string;
  readonly type: string;
  readonly label: string;
}

// ---------------------------------------------------------------------------
// Canvas mode
// ---------------------------------------------------------------------------

/**
 * SELECT — default; click to select a section
 * INSERT — user is choosing a section to add from the component palette
 * MOVE   — drag-to-reorder active
 * PREVIEW — read-only preview, no selection chrome
 */
export type CanvasMode = 'SELECT' | 'INSERT' | 'MOVE' | 'PREVIEW';

// ---------------------------------------------------------------------------
// Canvas state
// ---------------------------------------------------------------------------

export interface CanvasState {
  readonly mode: CanvasMode;
  readonly selectedSectionId: string | null;
  readonly selectedPageId: string | null;
  readonly hoveredSectionId: string | null;
  readonly dragState: DragState | null;
  readonly resizeState: ResizeState | null;
  readonly selection: SelectionState;
  readonly grid: GridConfig;
  readonly viewport: ViewportSize;
  readonly zoom: number;                     // 0.25 – 2.0, default 1.0
  readonly isPanelOpen: boolean;             // right-side props panel
  readonly highlightedSectionId: string | null; // for preview sync
  readonly breadcrumbs: ReadonlyArray<BreadcrumbItem>;
}

// ---------------------------------------------------------------------------
// Canvas actions (exhaustive discriminated union)
// ---------------------------------------------------------------------------

export type CanvasAction =
  | { readonly type: 'SELECT_SECTION';   sectionId: string | null; pageId?: string | null; additive?: boolean }
  | { readonly type: 'HOVER_SECTION';    sectionId: string | null }
  | { readonly type: 'HIGHLIGHT_SECTION';sectionId: string | null }
  | { readonly type: 'BEGIN_DRAG';       sectionId: string; sourcePageId: string; sourceIndex: number }
  | { readonly type: 'UPDATE_DRAG';      currentIndex: number }
  | { readonly type: 'END_DRAG';         committed: boolean }
  | { readonly type: 'BEGIN_RESIZE';     sectionId: string; handle: ResizeHandle; startSize: { width: number; height: number } }
  | { readonly type: 'UPDATE_RESIZE';    currentSize: { width: number; height: number } }
  | { readonly type: 'END_RESIZE';      committed: boolean }
  | { readonly type: 'SET_MODE';         mode: CanvasMode }
  | { readonly type: 'SET_VIEWPORT';     viewport: ViewportSize }
  | { readonly type: 'SET_GRID';         grid: Partial<GridConfig> }
  | { readonly type: 'ALIGN_SECTIONS';   sectionIds: ReadonlyArray<string>; alignment: Alignment }
  | { readonly type: 'TOGGLE_LOCK';      sectionId: string }
  | { readonly type: 'TOGGLE_VISIBILITY';sectionId: string }
  | { readonly type: 'SET_BREAKPOINT';   breakpoint: ViewportLabel }
  | { readonly type: 'SET_RESPONSIVE_PROP'; sectionId: string; propName: string; value: any; breakpoint: ViewportLabel }
  | { readonly type: 'SET_ZOOM';         zoom: number }
  | { readonly type: 'TOGGLE_PANEL' }
  | { readonly type: 'OPEN_PANEL' }
  | { readonly type: 'CLOSE_PANEL' };

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createCanvasState(overrides?: Partial<CanvasState>): CanvasState {
  return {
    mode: 'SELECT',
    selectedSectionId: null,
    selectedPageId: null,
    hoveredSectionId: null,
    dragState: null,
    resizeState: null,
    selection: DEFAULT_SELECTION,
    grid: DEFAULT_GRID_CONFIG,
    viewport: VIEWPORT_PRESETS.DESKTOP,
    zoom: 1.0,
    isPanelOpen: false,
    highlightedSectionId: null,
    breadcrumbs: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Pure reducer — no side effects, safe to test without DOM
// ---------------------------------------------------------------------------

export function reduceCanvasState(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'SELECT_SECTION':
      return {
        ...state,
        selectedSectionId: action.sectionId,
        selectedPageId: action.pageId ?? state.selectedPageId,
        isPanelOpen: action.sectionId !== null,
      };

    case 'HOVER_SECTION':
      return { ...state, hoveredSectionId: action.sectionId };

    case 'HIGHLIGHT_SECTION':
      return { ...state, highlightedSectionId: action.sectionId };

    case 'BEGIN_DRAG':
      return {
        ...state,
        mode: 'MOVE',
        dragState: {
          sectionId: action.sectionId,
          sourcePageId: action.sourcePageId,
          sourceIndex: action.sourceIndex,
          currentIndex: action.sourceIndex,
          isDragging: true,
        },
      };

    case 'UPDATE_DRAG':
      if (!state.dragState) return state;
      return {
        ...state,
        dragState: { ...state.dragState, currentIndex: action.currentIndex },
      };

    case 'END_DRAG':
      return {
        ...state,
        mode: 'SELECT',
        dragState: null,
      };

    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'SET_VIEWPORT':
      return { ...state, viewport: action.viewport };

    case 'SET_ZOOM': {
      const clamped = Math.min(2.0, Math.max(0.25, action.zoom));
      return { ...state, zoom: clamped };
    }

    case 'TOGGLE_PANEL':
      return { ...state, isPanelOpen: !state.isPanelOpen };

    case 'OPEN_PANEL':
      return { ...state, isPanelOpen: true };

    case 'CLOSE_PANEL':
      return { ...state, isPanelOpen: false };

    case 'BEGIN_RESIZE':
      return {
        ...state,
        mode: 'MOVE',
        resizeState: {
          sectionId: action.sectionId,
          handle: action.handle,
          startSize: action.startSize,
          currentSize: action.startSize,
          isResizing: true,
        } as ResizeState,
      };

    case 'UPDATE_RESIZE':
      if (!state.resizeState) return state;
      return {
        ...state,
        resizeState: { ...state.resizeState, currentSize: action.currentSize } as ResizeState,
      };

    case 'END_RESIZE':
      return {
        ...state,
        mode: 'SELECT',
        resizeState: null,
      };

    case 'SET_GRID':
      return {
        ...state,
        grid: { ...state.grid, ...action.grid },
      };

    case 'ALIGN_SECTIONS': {
      const locked = action.sectionIds.filter((id) => !state.selection.lockedIds.includes(id));
      return {
        ...state,
        selection: { ...state.selection, selectedIds: locked },
      };
    }

    case 'TOGGLE_LOCK': {
      const lockedIds = state.selection.lockedIds.includes(action.sectionId)
        ? state.selection.lockedIds.filter((id) => id !== action.sectionId)
        : [...state.selection.lockedIds, action.sectionId];
      return {
        ...state,
        selection: { ...state.selection, lockedIds },
      };
    }

    case 'TOGGLE_VISIBILITY': {
      const hiddenIds = state.selection.hiddenIds.includes(action.sectionId)
        ? state.selection.hiddenIds.filter((id) => id !== action.sectionId)
        : [...state.selection.hiddenIds, action.sectionId];
      return {
        ...state,
        selection: { ...state.selection, hiddenIds },
      };
    }

    case 'SET_BREAKPOINT':
      return {
        ...state,
        selection: { ...state.selection, activeBreakpoint: action.breakpoint },
        viewport: VIEWPORT_PRESETS[action.breakpoint],
      };

    case 'SET_RESPONSIVE_PROP':
      return state;

    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}
