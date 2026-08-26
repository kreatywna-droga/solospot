/**
 * RendererBackend.ts — Sprint S11 Visual Rendering Backend
 *
 * Core interface contract for all visual rendering backends (Canvas2D, WebGL, Mock).
 * NO DOM, NO React, NO window. Pure TS interface.
 */

import { RendererCapabilities } from './RendererCapabilities';
import { RendererCommand } from './RendererCommand';
import { RendererState } from './RendererState';
import { RendererSurface } from './RendererSurface';

export interface RendererBackend {
  readonly capabilities: RendererCapabilities;
  readonly isInitialized: boolean;

  initialize(surface: RendererSurface): void;
  beginFrame(frameIndex: number, timestampMs: number): void;
  executeCommands(commands: ReadonlyArray<RendererCommand>): void;
  endFrame(): void;
  getState(): RendererState;
  destroy(): void;
}
