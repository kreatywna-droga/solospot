/**
 * SelectionModel.ts — Sprint S22 Selection & Interaction Domain Model
 *
 * Headless DTOs for Selection state, modes, handles, marquee box, and interaction types.
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export type SelectionMode = 'none' | 'single' | 'multi' | 'marquee';

export type TransformHandleType =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'rotate';

export interface MarqueeBox {
  readonly startX: number;
  readonly startY: number;
  readonly currentX: number;
  readonly currentY: number;
}

export interface SelectionState {
  readonly selectedNodeIds: ReadonlyArray<string>;
  readonly primarySelectedId: string | null;
  readonly activeHandle: TransformHandleType | null;
  readonly mode: SelectionMode;
  readonly marquee: MarqueeBox | null;
}

export const DEFAULT_SELECTION_STATE: SelectionState = {
  selectedNodeIds: [],
  primarySelectedId: null,
  activeHandle: null,
  mode: 'none',
  marquee: null,
};

export function createSelectionState(params?: {
  selectedNodeIds?: ReadonlyArray<string> | string[];
  primarySelectedId?: string | null;
  activeHandle?: TransformHandleType | null;
  mode?: SelectionMode;
  marquee?: MarqueeBox | null;
}): SelectionState {
  const ids = params?.selectedNodeIds ?? [];
  const primary = params?.primarySelectedId ?? (ids.length > 0 ? ids[0] : null);
  let mode: SelectionMode = params?.mode ?? 'none';

  if (!params?.mode) {
    if (ids.length === 1) mode = 'single';
    else if (ids.length > 1) mode = 'multi';
    else if (params?.marquee) mode = 'marquee';
    else mode = 'none';
  }

  return {
    selectedNodeIds: ids,
    primarySelectedId: primary,
    activeHandle: params?.activeHandle ?? null,
    mode,
    marquee: params?.marquee ?? null,
  };
}
