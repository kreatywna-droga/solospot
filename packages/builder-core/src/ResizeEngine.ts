// ResizeEngine.ts
// C7.4: Builder Pro — resize engine

import { BuilderDocument, SectionNode } from './BuilderDocument';
import { BuilderCommand } from './BuilderCommands';
import { GridSystem, SnapInput } from './GridSystem';
import { CanvasState, CanvasAction, reduceCanvasState, ResizeHandle, ResizeState as CanvasResizeState } from './CanvasState';

export interface ResizeCommandOptions {
  readonly document: BuilderDocument;
  readonly sectionId: string;
  readonly handle: ResizeHandle;
  readonly startSize: { width: number; height: number };
  readonly currentSize: { width: number; height: number };
}

export function createResizeCommand(options: ResizeCommandOptions): BuilderCommand {
  return {
    type: 'UPDATE_PROPS',
    pageId: '',
    sectionId: options.sectionId,
    props: {
      width: options.currentSize.width,
      height: options.currentSize.height,
    },
  };
}

export function reduceResizeState(
  state: CanvasState,
  action: CanvasAction
): CanvasState {
  return reduceCanvasState(state, action);
}

export function constrainResize(
  width: number,
  height: number,
  minSize: { width: number; height: number } = { width: 100, height: 100 },
  maxSize: { width: number; height: number } = { width: 2000, height: 2000 }
): { width: number; height: number } {
  return {
    width: Math.max(minSize.width, Math.min(maxSize.width, width)),
    height: Math.max(minSize.height, Math.min(maxSize.height, height)),
  };
}

export function applyAspectRatio(
  width: number,
  height: number,
  aspectRatio: number,
  handle: ResizeHandle
): { width: number; height: number } {
  if (handle === 'n' || handle === 's') {
    return { width, height: width / aspectRatio };
  }
  return { width: height * aspectRatio, height };
}

export function snapResizeToGrid(
  width: number,
  height: number,
  grid: GridSystem
): { width: number; height: number } {
  const snappedW = Math.round(width / grid.getConfig().gutter) * grid.getConfig().gutter;
  const snappedH = Math.round(height / grid.getConfig().gutter) * grid.getConfig().gutter;
  return { width: snappedW, height: snappedH };
}
