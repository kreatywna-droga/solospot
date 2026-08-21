/**
 * VectorRenderingBridge.ts — Sprint S18 Vector Rendering Bridge (ETAP 5) / G1-36 Fidelity
 *
 * Bridges VectorNode DTOs into standard RendererCommand DTOs for execution
 * by RenderingEngine & CanvasRenderer.
 *
 * Zero 2nd renderer, zero DOM renderer in domain model. Pure TS DTO compiler.
 *
 * G1-36 (VectorRenderingBridge Transform & Stroke Fidelity):
 * - Full affine transform matrix: translate + rotate-about-center + scale + skew
 *   (mirrors VectorSvgExporter.getTransformAttribute semantics).
 * - Stroke fidelity: dashArray, dashOffset, lineJoin, miterLimit, lineCap, stroke opacity.
 * - Fill fidelity: gradient references (linear/radial) + fill opacity + node opacity.
 * - Null-safety: corrupted nodes degrade gracefully (never throw).
 * - Groups remain opacity/visibility containers; children carry their own ABSOLUTE
 *   transforms (matches VectorSvgExporter + VectorRenderingBridge contract).
 */

import { VectorNode, PolygonNode, RectangleNode, LineNode, PathNode, ShapeGroupNode, VectorFill, VectorTransform } from '../vector/VectorDomainModel';
import { VectorGeometry } from '../vector/VectorGeometry';
import { VectorViewportState } from '../vector/VectorViewportController';
import {
  RendererCommand,
  DrawRectCommand,
  DrawEllipseCommand,
  DrawPolygonCommand,
  DrawLineCommand,
  DrawPathCommand,
  Matrix2DAffine,
  GradientFillDTO,
} from './RendererCommand';

const DEFAULT_TRANSFORM: VectorTransform = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotationDeg: 0,
  scaleX: 1,
  scaleY: 1,
  skewX: 0,
  skewY: 0,
};

export class VectorRenderingBridge {
  /**
   * Compiles a VectorNode DTO into an array of RendererCommand objects.
   * Optionally applies viewport transform (zoom & pan) to compiled commands.
   */
  public static buildRenderCommands(
    node: VectorNode,
    viewportState?: VectorViewportState
  ): RendererCommand[] {
    if (!node || typeof node !== 'object' || !node.transform) {
      return [];
    }
    if (node.visible === false || (typeof node.opacity === 'number' && node.opacity <= 0)) {
      return [];
    }

    const commands: RendererCommand[] = [];

    commands.push({ type: 'SAVE' });

    const transform = VectorRenderingBridge.buildAffineTransform(node.transform, viewportState);
    commands.push({ type: 'SET_TRANSFORM', transform });

    if (typeof node.opacity === 'number' && node.opacity < 1) {
      commands.push({ type: 'SET_OPACITY', opacity: node.opacity });
    }

    switch (node.type) {
      case 'rectangle': {
        const rectNode = node as RectangleNode;
        const cornerRadius = typeof rectNode.cornerRadius === 'number'
          ? rectNode.cornerRadius
          : Array.isArray(rectNode.cornerRadius)
            ? rectNode.cornerRadius[0] ?? 0
            : 0;

        const cmd: DrawRectCommand = {
          type: 'DRAW_RECT',
          nodeId: rectNode.id,
          bounds: { x: 0, y: 0, width: rectNode.transform.width, height: rectNode.transform.height },
          ...VectorRenderingBridge.fillFields(rectNode.fill),
          ...VectorRenderingBridge.strokeFields(rectNode.stroke),
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
          ...VectorRenderingBridge.fillFields(node.fill),
          ...VectorRenderingBridge.strokeFields(node.stroke),
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
          ...VectorRenderingBridge.fillFields(polyNode.fill),
          ...VectorRenderingBridge.strokeFields(polyNode.stroke),
        };
        commands.push(cmd);
        break;
      }

      case 'line': {
        const lineNode = node as LineNode;
        const cmd: DrawLineCommand = {
          type: 'DRAW_LINE',
          nodeId: lineNode.id,
          x1: (lineNode.x1 ?? 0) - (lineNode.transform.x || 0),
          y1: (lineNode.y1 ?? 0) - (lineNode.transform.y || 0),
          x2: (lineNode.x2 ?? 0) - (lineNode.transform.x || 0),
          y2: (lineNode.y2 ?? 0) - (lineNode.transform.y || 0),
          ...VectorRenderingBridge.strokeFields(lineNode.stroke),
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
          d: pathNode.d || '',
          ...VectorRenderingBridge.fillFields(pathNode.fill),
          ...VectorRenderingBridge.strokeFields(pathNode.stroke),
        };
        commands.push(cmd);
        break;
      }

      case 'group': {
        const groupNode = node as ShapeGroupNode;
        if (Array.isArray(groupNode.children)) {
          for (const child of groupNode.children) {
            const childCmds = VectorRenderingBridge.buildRenderCommands(child, viewportState);
            commands.push(...childCmds);
          }
        }
        break;
      }
    }

    commands.push({ type: 'RESTORE' });

    return commands;
  }

  /**
   * Builds the full affine matrix matching VectorSvgExporter transform semantics:
   * translate(x,y) → rotate(deg, cx, cy) → scale(sx, sy) → skewX(deg) → skewY(deg).
   * If viewportState is provided, composes with viewport transform: T_viewport · T_node.
   */
  public static buildAffineTransform(
    transform?: Partial<VectorTransform>,
    viewportState?: VectorViewportState
  ): Matrix2DAffine {
    const t: VectorTransform = { ...DEFAULT_TRANSFORM, ...transform };

    const x = typeof t.x === 'number' && Number.isFinite(t.x) ? t.x : 0;
    const y = typeof t.y === 'number' && Number.isFinite(t.y) ? t.y : 0;
    const width = typeof t.width === 'number' && Number.isFinite(t.width) ? t.width : 0;
    const height = typeof t.height === 'number' && Number.isFinite(t.height) ? t.height : 0;
    const rotationDeg = typeof t.rotationDeg === 'number' && Number.isFinite(t.rotationDeg) ? t.rotationDeg : 0;
    const scaleX = typeof t.scaleX === 'number' && Number.isFinite(t.scaleX) ? t.scaleX : 1;
    const scaleY = typeof t.scaleY === 'number' && Number.isFinite(t.scaleY) ? t.scaleY : 1;
    const skewX = typeof t.skewX === 'number' && Number.isFinite(t.skewX) ? t.skewX : 0;
    const skewY = typeof t.skewY === 'number' && Number.isFinite(t.skewY) ? t.skewY : 0;

    // Rotation about the node center (cx, cy) — same as SVG exporter rotate(deg cx cy).
    const cx = width / 2;
    const cy = height / 2;
    const rad = (rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Skew matrices.
    const radSkewX = (skewX * Math.PI) / 180;
    const radSkewY = (skewY * Math.PI) / 180;
    const tanX = Math.tan(radSkewX);
    const tanY = Math.tan(radSkewY);

    // Compose: T(x,y) · T(cx,cy) · R(θ) · T(-cx,-cy) · S(sx,sy) · Kx(skewX) · Ky(skewY)
    // Derived affine (a,b,c,d,e,f):
    let a = scaleX * cos * (1 + tanX * tanY) - scaleY * sin * tanY;
    let b = scaleX * sin * (1 + tanX * tanY) + scaleY * cos * tanY;
    let c = scaleX * cos * tanX - scaleY * sin;
    let d = scaleX * sin * tanX + scaleY * cos;

    let e = x + cx - cos * cx + sin * cy;
    let f = y + cy - sin * cx - cos * cy;

    // Compose with Viewport Camera transform (zoom & pan) if present:
    if (viewportState && (viewportState.zoom !== 1 || viewportState.panX !== 0 || viewportState.panY !== 0)) {
      const z = viewportState.zoom;
      const px = viewportState.panX;
      const py = viewportState.panY;

      a = a * z;
      b = b * z;
      c = c * z;
      d = d * z;
      e = e * z + px;
      f = f * z + py;
    }

    return [a, b, c, d, e, f];
  }

  /**
   * Builds fill fidelity fields (color / gradient reference / fill opacity).
   */
  private static fillFields(fill?: VectorFill): {
    fillStyle?: string;
    fillGradient?: GradientFillDTO;
    fillOpacity?: number;
  } {
    if (!fill || fill.type === 'none') {
      return { fillStyle: undefined };
    }

    const fields: { fillStyle?: string; fillGradient?: GradientFillDTO; fillOpacity?: number } = {};

    if (fill.type === 'solid') {
      fields.fillStyle = fill.color || '#000000';
    } else if (fill.type === 'linear-gradient' || fill.type === 'radial-gradient') {
      const stops = (fill.gradientStops || [])
        .filter((s) => s && typeof s.offset === 'number' && Number.isFinite(s.offset) && typeof s.color === 'string' && s.color.length > 0)
        .map((s) => ({ offset: s.offset, color: s.color }));
      fields.fillStyle = fill.color || '#000000';
      if (stops.length > 0) {
        fields.fillGradient = {
          type: fill.type,
          stops,
          angleDeg: fill.gradientAngleDeg ?? 0,
        };
      }
    }

    if (typeof fill.opacity === 'number' && fill.opacity < 1) {
      fields.fillOpacity = fill.opacity;
    }

    return fields;
  }

  /**
   * Builds stroke fidelity fields.
   */
  private static strokeFields(stroke?: {
    color?: string;
    width?: number;
    dashArray?: number[];
    dashOffset?: number;
    lineCap?: 'butt' | 'round' | 'square';
    lineJoin?: 'miter' | 'round' | 'bevel';
    miterLimit?: number;
    opacity?: number;
  }): {
    strokeStyle?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    strokeDashArray?: number[];
    strokeDashOffset?: number;
    strokeLineJoin?: 'miter' | 'round' | 'bevel';
    strokeMiterLimit?: number;
    lineCap?: 'butt' | 'round' | 'square';
  } {
    if (!stroke || !stroke.color || stroke.width === 0) {
      return { strokeStyle: undefined };
    }

    const fields: {
      strokeStyle?: string;
      strokeWidth?: number;
      strokeOpacity?: number;
      strokeDashArray?: number[];
      strokeDashOffset?: number;
      strokeLineJoin?: 'miter' | 'round' | 'bevel';
      strokeMiterLimit?: number;
      lineCap?: 'butt' | 'round' | 'square';
    } = {
      strokeStyle: stroke.color,
    };

    if (typeof stroke.width === 'number' && Number.isFinite(stroke.width)) {
      fields.strokeWidth = stroke.width;
    }
    if (typeof stroke.opacity === 'number' && stroke.opacity < 1) {
      fields.strokeOpacity = stroke.opacity;
    }
    if (Array.isArray(stroke.dashArray) && stroke.dashArray.length > 0) {
      fields.strokeDashArray = stroke.dashArray.filter((v) => Number.isFinite(v));
    }
    if (typeof stroke.dashOffset === 'number' && Number.isFinite(stroke.dashOffset) && stroke.dashOffset !== 0) {
      fields.strokeDashOffset = stroke.dashOffset;
    }
    if (stroke.lineJoin) fields.strokeLineJoin = stroke.lineJoin;
    if (typeof stroke.miterLimit === 'number' && Number.isFinite(stroke.miterLimit)) {
      fields.strokeMiterLimit = stroke.miterLimit;
    }
    if (stroke.lineCap) fields.lineCap = stroke.lineCap;

    return fields;
  }
}