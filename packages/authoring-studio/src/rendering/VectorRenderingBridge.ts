/**
 * VectorRenderingBridge.ts — Sprint S18 Vector Rendering Bridge (ETAP 5)
 *
 * Bridges VectorNode DTOs into standard RendererCommand DTOs for execution
 * by RenderingEngine & CanvasRenderer.
 *
 * Zero 2nd renderer, zero DOM renderer in domain model. Pure TS DTO compiler.
 */

import { VectorNode, PolygonNode, RectangleNode, LineNode, PathNode, ShapeGroupNode } from '../vector/VectorDomainModel';
import { VectorGeometry } from '../vector/VectorGeometry';
import {
  RendererCommand,
  DrawRectCommand,
  DrawEllipseCommand,
  DrawPolygonCommand,
  DrawLineCommand,
  DrawPathCommand,
  Matrix2DAffine,
} from './RendererCommand';

export class VectorRenderingBridge {
  /**
   * Compiles a VectorNode DTO into an array of RendererCommand objects.
   */
  public static buildRenderCommands(node: VectorNode): RendererCommand[] {
    if (!node || !node.visible || node.opacity <= 0 || !node.transform) {
      return [];
    }

    const commands: RendererCommand[] = [];

    // SAVE stack state
    commands.push({ type: 'SAVE' });

    // Transform
    const transform2D: Matrix2DAffine = [
      node.transform.scaleX,
      0,
      0,
      node.transform.scaleY,
      node.transform.x,
      node.transform.y,
    ];
    commands.push({ type: 'SET_TRANSFORM', transform: transform2D });

    // Opacity
    if (node.opacity < 1) {
      commands.push({ type: 'SET_OPACITY', opacity: node.opacity });
    }

    // Specific shape draw command
    switch (node.type) {
      case 'rectangle': {
        const rectNode = node as RectangleNode;
        const cornerRadius = typeof rectNode.cornerRadius === 'number'
          ? rectNode.cornerRadius
          : rectNode.cornerRadius[0];

        const cmd: DrawRectCommand = {
          type: 'DRAW_RECT',
          nodeId: rectNode.id,
          bounds: { x: 0, y: 0, width: rectNode.transform.width, height: rectNode.transform.height },
          fillStyle: rectNode.fill?.color,
          strokeStyle: rectNode.stroke?.color,
          strokeWidth: rectNode.stroke?.width,
          cornerRadius,
        };
        commands.push(cmd);
        break;
      }

      case 'ellipse': {
        const cmd: DrawEllipseCommand = {
          type: 'DRAW_ELLIPSE',
          nodeId: node.id,
          bounds: { x: 0, y: 0, width: node.transform.width, height: node.transform.height },
          fillStyle: node.fill?.color,
          strokeStyle: node.stroke?.color,
          strokeWidth: node.stroke?.width,
        };
        commands.push(cmd);
        break;
      }

      case 'polygon': {
        const polyNode = node as PolygonNode;
        const radius = Math.min(polyNode.transform.width, polyNode.transform.height) / 2;
        const center = { x: polyNode.transform.width / 2, y: polyNode.transform.height / 2 };
        const points = VectorGeometry.polygonGeometry(polyNode.sides, radius, center, polyNode.starRatio);

        const cmd: DrawPolygonCommand = {
          type: 'DRAW_POLYGON',
          nodeId: polyNode.id,
          bounds: { x: 0, y: 0, width: polyNode.transform.width, height: polyNode.transform.height },
          points,
          fillStyle: polyNode.fill?.color,
          strokeStyle: polyNode.stroke?.color,
          strokeWidth: polyNode.stroke?.width,
        };
        commands.push(cmd);
        break;
      }

      case 'line': {
        const lineNode = node as LineNode;
        const cmd: DrawLineCommand = {
          type: 'DRAW_LINE',
          nodeId: lineNode.id,
          x1: lineNode.x1 - lineNode.transform.x,
          y1: lineNode.y1 - lineNode.transform.y,
          x2: lineNode.x2 - lineNode.transform.x,
          y2: lineNode.y2 - lineNode.transform.y,
          strokeStyle: lineNode.stroke?.color,
          strokeWidth: lineNode.stroke?.width,
          lineCap: lineNode.stroke?.lineCap,
        };
        commands.push(cmd);
        break;
      }

      case 'path': {
        const pathNode = node as PathNode;
        const cmd: DrawPathCommand = {
          type: 'DRAW_PATH',
          nodeId: pathNode.id,
          bounds: { x: 0, y: 0, width: pathNode.transform.width, height: pathNode.transform.height },
          d: pathNode.d,
          fillStyle: pathNode.fill?.color,
          strokeStyle: pathNode.stroke?.color,
          strokeWidth: pathNode.stroke?.width,
        };
        commands.push(cmd);
        break;
      }

      case 'group': {
        const groupNode = node as ShapeGroupNode;
        for (const child of groupNode.children) {
          const childCmds = VectorRenderingBridge.buildRenderCommands(child);
          commands.push(...childCmds);
        }
        break;
      }
    }

    // RESTORE stack state
    commands.push({ type: 'RESTORE' });

    return commands;
  }
}
