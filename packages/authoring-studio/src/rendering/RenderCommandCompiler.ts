/**
 * RenderCommandCompiler.ts — Sprint S11 Render Command Compiler
 *
 * Compiles a deterministic RenderFrame (from S10 RenderingEngine) into
 * an ordered array of RendererCommand DTOs for execution by RendererBackend.
 *
 * Pure DTO compilation. Renderer does NOT interpret BuilderDocument directly.
 * NO DOM, NO React, NO window.
 */

import { Matrix3D, RenderFrame, RenderNodeState } from '../../../builder-core/src/rendering/RenderFrame';
import {
  ClearCommand,
  DrawImageCommand,
  DrawRectCommand,
  DrawTextCommand,
  Matrix2DAffine,
  RendererCommand,
} from './RendererCommand';

export interface CompilerOptions {
  readonly clearColor?: string;
  readonly defaultFont?: string;
  readonly defaultFontSize?: number;
}

/**
 * Downcasts a 4x4 3D transform matrix to a 2D affine matrix [a, b, c, d, e, f].
 */
export function matrix3DTo2DAffine(m: Matrix3D): Matrix2DAffine {
  // Matrix3D column-major layout:
  // [ m0,  m1,  m2,  m3,
  //   m4,  m5,  m6,  m7,
  //   m8,  m9,  m10, m11,
  //   m12, m13, m14, m15 ]
  return [m[0], m[1], m[4], m[5], m[12], m[13]];
}

export class RenderCommandCompiler {
  public static compile(frame: RenderFrame, options?: CompilerOptions): ReadonlyArray<RendererCommand> {
    const commands: RendererCommand[] = [];

    // 1. Initial CLEAR command
    const clearCmd: ClearCommand = {
      type: 'CLEAR',
      color: options?.clearColor,
    };
    commands.push(clearCmd);

    // 2. Sort nodes by z-order
    const sortedNodes = Array.from(frame.nodes.values()).sort((a, b) => a.order - b.order);

    // 3. Compile draw & compositing commands for each visible node
    for (const node of sortedNodes) {
      if (!node.visible || node.opacity < 0) {
        continue;
      }

      // SAVE stack state
      commands.push({ type: 'SAVE' });

      // Transform
      const transform2D = matrix3DTo2DAffine(node.transformMatrix);
      commands.push({
        type: 'SET_TRANSFORM',
        transform: transform2D,
      });

      // Opacity
      commands.push({
        type: 'SET_OPACITY',
        opacity: node.opacity,
      });

      // Blend mode
      const blendMode = typeof node.computedProps.blendMode === 'string'
        ? (node.computedProps.blendMode as string)
        : 'source-over';

      if (blendMode !== 'source-over') {
        commands.push({
          type: 'SET_BLEND_MODE',
          blendMode,
        });
      }

      // Clipping
      if (node.computedProps.clip || node.computedProps.overflow === 'hidden') {
        commands.push({
          type: 'RESTRICT_CLIP',
          bounds: { ...node.bounds },
        });
      }

      // Draw command based on node type and computed properties
      RenderCommandCompiler.compileNodeDrawCommand(node, commands, options);

      // RESTORE stack state
      commands.push({ type: 'RESTORE' });
    }

    return commands;
  }

  private static compileNodeDrawCommand(
    node: RenderNodeState,
    commands: RendererCommand[],
    options?: CompilerOptions
  ): void {
    const { computedProps, bounds, nodeId, type } = node;

    // Image node
    if (type === 'image' || typeof computedProps.src === 'string') {
      const drawImg: DrawImageCommand = {
        type: 'DRAW_IMAGE',
        nodeId,
        bounds: { ...bounds },
        src: (computedProps.src as string) ?? '',
        objectFit: (computedProps.objectFit as 'contain' | 'cover' | 'fill') ?? 'cover',
      };
      commands.push(drawImg);
      return;
    }

    // Text node
    if (type === 'text' || typeof computedProps.text === 'string') {
      const fontSize = typeof computedProps.fontSize === 'number'
        ? (computedProps.fontSize as number)
        : options?.defaultFontSize ?? 16;

      const drawTxt: DrawTextCommand = {
        type: 'DRAW_TEXT',
        nodeId,
        bounds: { ...bounds },
        text: (computedProps.text as string) ?? (computedProps.label as string) ?? '',
        fontSize,
        font: (computedProps.font as string) ?? options?.defaultFont ?? `${fontSize}px sans-serif`,
        fillStyle: (computedProps.color as string) ?? (computedProps.fillStyle as string) ?? '#f8fafc',
        align: (computedProps.align as 'left' | 'center' | 'right') ?? 'left',
        baseline: (computedProps.baseline as 'top' | 'middle' | 'bottom' | 'alphabetic') ?? 'top',
      };
      commands.push(drawTxt);
      return;
    }

    // Rect / Section / Container node
    const drawRect: DrawRectCommand = {
      type: 'DRAW_RECT',
      nodeId,
      bounds: { ...bounds },
      fillStyle: (computedProps.backgroundColor as string) ?? (computedProps.background as string) ?? (computedProps.fillStyle as string),
      strokeStyle: (computedProps.borderColor as string) ?? (computedProps.strokeStyle as string),
      strokeWidth: typeof computedProps.borderWidth === 'number' ? (computedProps.borderWidth as number) : undefined,
      cornerRadius: typeof computedProps.borderRadius === 'number' ? (computedProps.borderRadius as number) : undefined,
    };
    commands.push(drawRect);
  }
}
