/**
 * SceneRenderingBridge.ts — Sprint S19 Rendering Integration (ETAP 4)
 *
 * Extends rendering pipeline:
 * BuilderDocument → Scene Graph → SceneRenderingBridge → RendererCommand[] → CanvasRenderer
 *
 * S19 solely structures and provides inputs to the existing renderer.
 * Converts composited Scene Graph tree into lightweight RendererCommand DTOs.
 * Zero 2nd renderer!
 */

import {
  ApplyFilterCommand,
  ApplyShadowCommand,
  ClearCommand,
  ClearEffectsCommand,
  DrawEllipseCommand,
  DrawImageCommand,
  DrawLineCommand,
  DrawPathCommand,
  DrawPolygonCommand,
  DrawRectCommand,
  DrawTextCommand,
  RendererCommand,
  RestrictClipCommand,
  SetBlendModeCommand,
  SetOpacityCommand,
  SetTransformCommand,
} from '../rendering/RendererCommand';
import { CompositedLayerNode, SceneCompositor } from './SceneCompositor';
import { Scene } from './SceneGraphModel';
import { Camera } from '../camera/CameraModel';
import { CoordinateSystems } from '../camera/CoordinateSystems';

export class SceneRenderingBridge {
  /**
   * Compiles Scene Graph state into a deterministic sequence of RendererCommands.
   */
  public static compileSceneToCommands(
    scene: Scene,
    camera?: Camera,
    clearColor: string = '#0F172A'
  ): RendererCommand[] {
    const commands: RendererCommand[] = [];

    // 1. Initial Clear Screen
    commands.push({
      type: 'CLEAR',
      color: clearColor,
    } as ClearCommand);

    const cameraMatrix = camera ? CoordinateSystems.computeCameraMatrix(camera) : undefined;

    // 2. Traverses scene graph in z-order
    const compositedNodes = SceneCompositor.traverseCompositedScene(scene);

    for (const node of compositedNodes) {
      if (!node.effectiveVisibility) continue;

      // Group nodes don't directly render geometry, but manage state scopes for children
      if (node.type === 'group') continue;

      // Save state context
      commands.push({ type: 'SAVE' });

      // Apply 2D Matrix Transform (incorporating Camera view matrix if present)
      const renderMatrix = cameraMatrix
        ? SceneCompositor.multiplyMatrices(cameraMatrix, node.worldMatrix)
        : node.worldMatrix;

      commands.push({
        type: 'SET_TRANSFORM',
        transform: renderMatrix,
      } as SetTransformCommand);

      // Apply Inherited Cumulative Opacity
      commands.push({
        type: 'SET_OPACITY',
        opacity: node.effectiveOpacity,
      } as SetOpacityCommand);

      // Apply Layer Blend Mode
      commands.push({
        type: 'SET_BLEND_MODE',
        blendMode: node.blendMode,
      } as SetBlendModeCommand);

      // Apply Clipping Group Mask if active
      if (node.isClipped) {
        commands.push({
          type: 'RESTRICT_CLIP',
          bounds: node.worldBounds,
        } as RestrictClipCommand);
      }

      let hasEffects = false;

      // Apply Evaluated Filter Effects (Blur, Brightness, Contrast, Saturation, Hue, Opacity)
      if (node.evaluatedFilterString) {
        commands.push({
          type: 'APPLY_FILTER',
          filterString: node.evaluatedFilterString,
        } as ApplyFilterCommand);
        hasEffects = true;
      }

      // Apply Evaluated Shadow / Glow Effect
      if (node.evaluatedShadow) {
        commands.push({
          type: 'APPLY_SHADOW',
          color: node.evaluatedShadow.color,
          blur: node.evaluatedShadow.blur,
          offsetX: node.evaluatedShadow.offsetX,
          offsetY: node.evaluatedShadow.offsetY,
          inner: node.evaluatedShadow.inner,
        } as ApplyShadowCommand);
        hasEffects = true;
      }

      // Render Primitive Geometry / Node Content
      const drawCmd = this.compileNodeDrawCommand(node);
      if (drawCmd) {
        commands.push(drawCmd);
      }

      // Clear effect settings before restoring
      if (hasEffects) {
        commands.push({ type: 'CLEAR_EFFECTS' } as ClearEffectsCommand);
      }

      // Restore state context
      commands.push({ type: 'RESTORE' });
    }

    return commands;
  }

  /**
   * Compiles individual composited layer node props into appropriate draw command.
   */
  private static compileNodeDrawCommand(node: CompositedLayerNode): RendererCommand | null {
    const props = node.props ?? {};
    const localBounds = {
      x: 0,
      y: 0,
      width: node.worldBounds.width || 100,
      height: node.worldBounds.height || 100,
    };

    switch (node.type) {
      case 'rectangle':
      case 'container':
      case 'section':
        return {
          type: 'DRAW_RECT',
          nodeId: node.layerId,
          bounds: localBounds,
          fillStyle: (props.fill as any)?.color ?? '#3B82F6',
          strokeStyle: (props.stroke as any)?.color ?? '#1E40AF',
          strokeWidth: (props.stroke as any)?.width ?? 0,
          cornerRadius: (props.cornerRadius as number) ?? 0,
        } as DrawRectCommand;

      case 'ellipse':
        return {
          type: 'DRAW_ELLIPSE',
          nodeId: node.layerId,
          bounds: localBounds,
          fillStyle: (props.fill as any)?.color ?? '#EC4899',
          strokeStyle: (props.stroke as any)?.color ?? '#BE185D',
          strokeWidth: (props.stroke as any)?.width ?? 0,
        } as DrawEllipseCommand;

      case 'polygon':
        return {
          type: 'DRAW_POLYGON',
          nodeId: node.layerId,
          bounds: localBounds,
          points: (props.points as Array<{ x: number; y: number }>) ?? [
            { x: localBounds.width / 2, y: 0 },
            { x: localBounds.width, y: localBounds.height },
            { x: 0, y: localBounds.height },
          ],
          fillStyle: (props.fill as any)?.color ?? '#8B5CF6',
          strokeStyle: (props.stroke as any)?.color ?? '#6D28D9',
          strokeWidth: (props.stroke as any)?.width ?? 0,
        } as DrawPolygonCommand;

      case 'line':
        return {
          type: 'DRAW_LINE',
          nodeId: node.layerId,
          x1: 0,
          y1: 0,
          x2: localBounds.width,
          y2: localBounds.height,
          strokeStyle: (props.stroke as any)?.color ?? '#10B981',
          strokeWidth: (props.stroke as any)?.width ?? 2,
        } as DrawLineCommand;

      case 'path':
        return {
          type: 'DRAW_PATH',
          nodeId: node.layerId,
          bounds: localBounds,
          d: (props.d as string) ?? 'M 0 0 L 100 0 L 50 100 Z',
          fillStyle: (props.fill as any)?.color ?? '#F59E0B',
          strokeStyle: (props.stroke as any)?.color ?? '#D97706',
          strokeWidth: (props.stroke as any)?.width ?? 1,
        } as DrawPathCommand;

      case 'text':
        return {
          type: 'DRAW_TEXT',
          nodeId: node.layerId,
          text: (props.text as string) ?? node.name,
          bounds: localBounds,
          font: (props.font as string) ?? '16px Inter, sans-serif',
          fontSize: (props.fontSize as number) ?? 16,
          fillStyle: (props.fillStyle as string) ?? '#F8FAFC',
          align: (props.align as any) ?? 'left',
          baseline: (props.baseline as any) ?? 'top',
        } as DrawTextCommand;

      case 'image':
      case 'media':
        return {
          type: 'DRAW_IMAGE',
          nodeId: node.layerId,
          src: (props.src as string) ?? '',
          bounds: localBounds,
        } as DrawImageCommand;

      default:
        // Default fallback draw rect for custom nodes
        return {
          type: 'DRAW_RECT',
          nodeId: node.layerId,
          bounds: localBounds,
          fillStyle: '#64748B',
        } as DrawRectCommand;
    }
  }
}
