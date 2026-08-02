/**
 * OverlayConstants — C16.4 Selection Overlay
 *
 * Shared types and constants for the selection overlay system.
 * Pure data — no React, no DOM.
 *
 * HandleType maps to the 8 standard resize handles.
 * ToolbarAction defines which actions the QuickToolbar can emit.
 * OverlayConfig controls visual and behavioral settings.
 */

import type { ViewportLabel } from './CanvasState';

// ---------------------------------------------------------------------------
// Handle types — 8 cardinal + intercardinal positions
// ---------------------------------------------------------------------------

export type HandleType =
  | 'NW' | 'N' | 'NE'
  | 'E'
  | 'SE' | 'S' | 'SW'
  | 'W';

export const HANDLE_POSITIONS: HandleType[] = [
  'NW', 'N', 'NE',
  'E',
  'SE', 'S', 'SW',
  'W',
];

/** Cursor for each handle type */
export const HANDLE_CURSOR: Record<HandleType, string> = {
  NW: 'nwse-resize',
  N:  'ns-resize',
  NE: 'nesw-resize',
  E:  'ew-resize',
  SE: 'nwse-resize',
  S:  'ns-resize',
  SW: 'nesw-resize',
  W:  'ew-resize',
};

/** Returns handles that should be visible based on config */
export function getActiveHandles(
  locked: boolean,
  config: OverlayConfig
): HandleType[] {
  if (locked || !config.showResizeHandles) return [];
  return HANDLE_POSITIONS;
}

// ---------------------------------------------------------------------------
// Toolbar actions
// ---------------------------------------------------------------------------

export type ToolbarActionType =
  | 'MOVE_UP'
  | 'MOVE_DOWN'
  | 'DUPLICATE'
  | 'DELETE'
  | 'LOCK'
  | 'UNLOCK'
  | 'HIDE'
  | 'SHOW'
  | 'EDIT_TEXT';

export interface ToolbarAction {
  readonly type: ToolbarActionType;
  readonly sectionId: string;
  readonly pageId: string;
}

/** Label for each action type (for tooltip / aria) */
export const TOOLBAR_ACTION_LABEL: Record<ToolbarActionType, string> = {
  MOVE_UP:    'Przesuń w górę',
  MOVE_DOWN:  'Przesuń w dół',
  DUPLICATE:  'Duplikuj',
  DELETE:     'Usuń',
  LOCK:       'Zablokuj',
  UNLOCK:     'Odblokuj',
  HIDE:       'Ukryj',
  SHOW:       'Pokaż',
  EDIT_TEXT:  'Edytuj tekst',
};

// ---------------------------------------------------------------------------
// Overlay config
// ---------------------------------------------------------------------------

export interface OverlayConfig {
  /** Border color for selected elements */
  selectionColor: string;
  /** Border color for hovered elements */
  hoverColor: string;
  /** Border width in px for selected elements */
  selectionBorderWidth: number;
  /** Border width in px for hovered elements */
  hoverBorderWidth: number;
  /** Border style */
  selectionBorderStyle: 'solid' | 'dashed';
  /** Show resize handles */
  showResizeHandles: boolean;
  /** Handle size in px */
  handleSize: number;
  /** Handle border color */
  handleBorderColor: string;
  /** Handle background color */
  handleBackgroundColor: string;
  /** Quick toolbar offset from top of bounding box */
  toolbarOffsetY: number;
  /** Whether to show the quick toolbar */
  showQuickToolbar: boolean;
  /** Z-index for overlay */
  zIndex: number;
  /** Animation duration in ms */
  animationDuration: number;
  /** Whether overlay responds to zoom */
  scaleWithZoom: boolean;
}

export const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
  selectionColor: '#7c3aed',       // violet-600
  hoverColor: '#7c3aed66',         // violet-600 at 40%
  selectionBorderWidth: 2,
  hoverBorderWidth: 1,
  selectionBorderStyle: 'solid',
  showResizeHandles: true,
  handleSize: 10,
  handleBorderColor: '#ffffff',
  handleBackgroundColor: '#7c3aed',
  toolbarOffsetY: -36,
  showQuickToolbar: true,
  zIndex: 100,
  animationDuration: 150,
  scaleWithZoom: true,
};

// ---------------------------------------------------------------------------
// Toolbar position modes
// ---------------------------------------------------------------------------

export type ToolbarPosition = 'top' | 'bottom' | 'left' | 'right';

export interface ToolbarPositionResult {
  readonly x: number;
  readonly y: number;
  readonly position: ToolbarPosition;
}

