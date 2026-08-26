/**
 * RenderCommandExecutor.ts — Sprint S11 Render Command Executor
 *
 * Dispatches compiled RendererCommand DTOs to a RendererBackend instance.
 * Pure orchestration logic. NO DOM, NO React, NO window.
 */

import { RenderFrame } from '../../../builder-core/src/rendering/RenderFrame';
import { RendererBackend } from './RendererBackend';
import { RendererCommand } from './RendererCommand';
import { CompilerOptions, RenderCommandCompiler } from './RenderCommandCompiler';

export class RenderCommandExecutor {
  public static executeCommands(
    backend: RendererBackend,
    commands: ReadonlyArray<RendererCommand>,
    frameIndex: number = 0,
    timestampMs: number = 0
  ): void {
    backend.beginFrame(frameIndex, timestampMs);
    backend.executeCommands(commands);
    backend.endFrame();
  }

  public static executeFrame(
    backend: RendererBackend,
    frame: RenderFrame,
    compilerOptions?: CompilerOptions
  ): ReadonlyArray<RendererCommand> {
    const commands = RenderCommandCompiler.compile(frame, compilerOptions);
    RenderCommandExecutor.executeCommands(backend, commands, frame.frameIndex, frame.timestampMs);
    return commands;
  }
}
