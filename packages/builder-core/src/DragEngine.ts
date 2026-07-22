// DragEngine.ts
// C7.3: Builder Pro — drag & drop engine

import { BuilderDocument, SectionNode } from './BuilderDocument';
import { BuilderCommand } from './BuilderCommands';
import { GridSystem, SnapInput } from './GridSystem';
import { CanvasState, CanvasAction, reduceCanvasState, createCanvasState, ResizeHandle, Alignment, SnapResult } from './CanvasState';

export interface DragCommandOptions {
  readonly document: BuilderDocument;
  readonly draggedIds: readonly string[];
  readonly sourcePageId: string;
  readonly sourceIndex: number;
  readonly targetPageId: string;
  readonly targetIndex: number;
}

export function createDragCommand(options: DragCommandOptions): BuilderCommand {
  return {
    type: 'MOVE_SECTION',
    pageId: options.targetPageId,
    fromIndex: options.sourceIndex,
    toIndex: options.targetIndex,
  };
}

export interface DragState {
  readonly isDragging: boolean;
  readonly draggedIds: readonly string[];
  readonly sourcePageId: string;
  readonly targetPageId: string;
  readonly targetIndex: number;
  readonly offset: { x: number; y: number };
}

export function reduceDragState(
  state: CanvasState,
  action: CanvasAction,
  grid: GridSystem
): CanvasState {
  return reduceCanvasState(state, action);
}

export function computeDropTarget(
  sections: SectionNode[],
  pointerY: number,
  sectionHeights: Map<string, number>,
  sectionGaps: number = 8
): number {
  let currentY = 0;
  for (let i = 0; i < sections.length; i++) {
    const height = sectionHeights.get(sections[i].id) ?? 0;
    if (pointerY < currentY + height / 2) {
      return i;
    }
    currentY += height + sectionGaps;
  }
  return sections.length;
}

export function snapDragToGrid(
  x: number,
  y: number,
  width: number,
  height: number,
  containerWidth: number,
  grid: GridSystem
): { x: number; y: number } {
  const result = grid.snap({ x, y, width, height, containerWidth });
  return { x: result.x, y: result.y };
}
