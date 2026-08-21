/**
 * VectorSvgExporter.ts — Sprint G1-35
 *
 * Implements a pure, headless SVG Exporter for the Vector Domain.
 * Recursively traverses a VectorDocumentSnapshot and outputs a valid SVG string.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 *
 * DESIGN NOTES (G1-35):
 * - Nodes inside a ShapeGroupNode carry ABSOLUTE coordinates (see VectorEditingEngine.groupShapes,
 *   which stores children with their original transforms and uses the group transform as the
 *   visual bounding-box origin). VectorRenderingBridge renders group children with their own
 *   absolute transforms and does NOT apply the group transform on top. This exporter mirrors that
 *   contract: the <g> element is an opacity/visibility container and never re-applies the group
 *   transform, avoiding a double-translation of children.
 * - Cycle detection: a circular group reference throws a controlled Error instead of overflowing
 *   the call stack.
 * - Null-safety: corrupted nodes (missing transform / fill / stroke / sides / path data) are
 *   handled gracefully with safe defaults; the exporter never throws on malformed input.
 */

import {
  VectorNode,
  VectorTransform,
  VectorFill
} from './VectorDomainModel';
import { VectorDocumentSnapshot } from './VectorWorkspaceController';
import { VectorGeometry } from './VectorGeometry';

const DEFAULT_TRANSFORM_FALLBACK: VectorTransform = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  rotationDeg: 0,
  scaleX: 1,
  scaleY: 1,
  skewX: 0,
  skewY: 0,
};

export class VectorSvgExporter {
  public static exportToSvgString(snapshot: VectorDocumentSnapshot, width: number = 800, height: number = 600): string {
    const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">`;

    const defs = this.buildDefs(snapshot.nodes);
    const defsString = defs.length > 0 ? `\n  <defs>\n${defs.join('\n')}\n  </defs>` : '';

    const nodesString = snapshot.nodes
      .filter((n) => n.visible)
      .map((n) => this.renderNode(n, '    ', new Set<string>()))
      .join('\n');

    return `${svgHeader}${defsString}\n${nodesString}\n</svg>`;
  }

  private static buildDefs(nodes: ReadonlyArray<VectorNode>): string[] {
    const defs: string[] = [];
    const gradientIds = new Set<string>();

    const traverse = (node: VectorNode, ancestors: Set<string>) => {
      if (!node.visible) return;
      this.extractGradient(node.fill, node.id + '_fill', defs, gradientIds);
      if (node.type === 'group') {
        if (ancestors.has(node.id)) return;
        const nextAncestors = new Set(ancestors);
        nextAncestors.add(node.id);
        node.children.forEach((child) => traverse(child, nextAncestors));
      }
    };

    nodes.forEach((node) => traverse(node, new Set<string>()));
    return defs;
  }

  private static extractGradient(fill: VectorFill | undefined, id: string, defs: string[], gradientIds: Set<string>) {
    if (!fill || (fill.type !== 'linear-gradient' && fill.type !== 'radial-gradient')) return;
    if (gradientIds.has(id)) return;
    gradientIds.add(id);

    const stops = (fill.gradientStops || [])
      .filter((stop) => typeof stop?.offset === 'number' && typeof stop?.color === 'string')
      .map((stop) => `      <stop offset="${stop.offset * 100}%" stop-color="${stop.color}" />`)
      .join('\n');

    if (fill.type === 'linear-gradient') {
      const angle = fill.gradientAngleDeg || 0;
      const rad = (angle - 90) * (Math.PI / 180);
      const x1 = 50 - Math.cos(rad) * 50;
      const y1 = 50 - Math.sin(rad) * 50;
      const x2 = 50 + Math.cos(rad) * 50;
      const y2 = 50 + Math.sin(rad) * 50;

      defs.push(`    <linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">\n${stops}\n    </linearGradient>`);
    } else if (fill.type === 'radial-gradient') {
      defs.push(`    <radialGradient id="${id}">\n${stops}\n    </radialGradient>`);
    }
  }

  private static getFillAttribute(fill: VectorFill | undefined, nodeId: string): string {
    if (!fill || fill.type === 'none') return 'none';
    if (fill.type === 'solid') return fill.color || '#000000';
    if (fill.type === 'linear-gradient' || fill.type === 'radial-gradient') return `url(#${nodeId}_fill)`;
    return 'none';
  }

  private static getStyleAttributes(node: VectorNode): string {
    const attrs: string[] = [];

    const fillStr = this.getFillAttribute(node.fill, node.id);
    attrs.push(`fill="${fillStr}"`);
    if (node.fill?.opacity !== undefined && node.fill.opacity < 1) {
      attrs.push(`fill-opacity="${node.fill.opacity}"`);
    }

    if (node.stroke && node.stroke.width > 0 && node.stroke.color !== 'none') {
      attrs.push(`stroke="${node.stroke.color}"`);
      attrs.push(`stroke-width="${node.stroke.width}"`);

      if (node.stroke.opacity !== undefined && node.stroke.opacity < 1) {
        attrs.push(`stroke-opacity="${node.stroke.opacity}"`);
      }
      if (node.stroke.lineCap) attrs.push(`stroke-linecap="${node.stroke.lineCap}"`);
      if (node.stroke.lineJoin) attrs.push(`stroke-linejoin="${node.stroke.lineJoin}"`);
      if (node.stroke.miterLimit !== undefined) attrs.push(`stroke-miterlimit="${node.stroke.miterLimit}"`);
      if (node.stroke.dashArray && node.stroke.dashArray.length > 0) {
        attrs.push(`stroke-dasharray="${node.stroke.dashArray.join(',')}"`);
      }
      if (node.stroke.dashOffset !== undefined) {
        attrs.push(`stroke-dashoffset="${node.stroke.dashOffset}"`);
      }
    }

    if (node.opacity !== undefined && node.opacity < 1) {
      attrs.push(`opacity="${node.opacity}"`);
    }

    return attrs.join(' ');
  }

  private static getTransformAttribute(transform: VectorTransform | undefined): string {
    const t = transform || DEFAULT_TRANSFORM_FALLBACK;
    const transforms: string[] = [];

    if (t.x !== 0 || t.y !== 0) {
      transforms.push(`translate(${t.x}, ${t.y})`);
    }

    const cx = t.width / 2;
    const cy = t.height / 2;

    if (t.rotationDeg !== 0) {
      transforms.push(`rotate(${t.rotationDeg} ${cx} ${cy})`);
    }

    if (t.scaleX !== 1 || t.scaleY !== 1) {
      transforms.push(`scale(${t.scaleX}, ${t.scaleY})`);
    }

    if (t.skewX !== 0) {
      transforms.push(`skewX(${t.skewX})`);
    }
    if (t.skewY !== 0) {
      transforms.push(`skewY(${t.skewY})`);
    }

    return transforms.length > 0 ? `transform="${transforms.join(' ')}"` : '';
  }

  private static renderNode(node: VectorNode, indent: string, ancestors: Set<string>): string {
    if (!node.visible) return '';

    if (node.type === 'group') {
      if (ancestors.has(node.id)) {
        throw new Error(`VectorSvgExporter: circular group reference detected at node "${node.id}"`);
      }

      const nextAncestors = new Set(ancestors);
      nextAncestors.add(node.id);

      const groupAttrs = [
        node.id ? `id="${node.id}"` : '',
        node.opacity !== undefined && node.opacity < 1 ? `opacity="${node.opacity}"` : '',
      ]
        .filter(Boolean)
        .join(' ');

      const childrenStr = node.children
        .filter((c) => c.visible)
        .map((c) => this.renderNode(c, indent + '  ', nextAncestors))
        .join('\n');

      const open = groupAttrs ? `<g ${groupAttrs}>` : '<g>';
      return `${indent}${open}\n${childrenStr}\n${indent}</g>`;
    }

    const style = this.getStyleAttributes(node);
    const transform = this.getTransformAttribute(node.transform);
    const idAttr = node.id ? `id="${node.id}"` : '';
    const baseAttrs = `${idAttr} ${style} ${transform}`.trim();

    const t = node.transform || DEFAULT_TRANSFORM_FALLBACK;

    switch (node.type) {
      case 'rectangle': {
        const r = node.cornerRadius;
        let rx = 0;
        let ry = 0;
        if (typeof r === 'number') {
          rx = r;
          ry = r;
        } else if (Array.isArray(r) && r.length > 0) {
          rx = r[0];
          ry = r[0];
        }

        let rectAttrs = `x="0" y="0" width="${t.width}" height="${t.height}"`;
        if (rx > 0) rectAttrs += ` rx="${rx}" ry="${ry}"`;

        return `${indent}<rect ${baseAttrs} ${rectAttrs} />`;
      }

      case 'ellipse': {
        const cx = t.width / 2;
        const cy = t.height / 2;

        return `${indent}<ellipse ${baseAttrs} cx="${cx}" cy="${cy}" rx="${cx}" ry="${cy}" />`;
      }

      case 'polygon': {
        const sides = typeof node.sides === 'number' && node.sides >= 3 ? node.sides : 3;
        const pts = VectorGeometry.polygonGeometry(sides, t.width / 2, {
          x: t.width / 2,
          y: t.height / 2,
        }, node.starRatio);

        const pointsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');
        return `${indent}<polygon ${baseAttrs} points="${pointsStr}" />`;
      }

      case 'line': {
        const rx1 = (node.x1 || 0) - t.x;
        const ry1 = (node.y1 || 0) - t.y;
        const rx2 = (node.x2 || 0) - t.x;
        const ry2 = (node.y2 || 0) - t.y;
        return `${indent}<line ${baseAttrs} x1="${rx1}" y1="${ry1}" x2="${rx2}" y2="${ry2}" />`;
      }

      case 'path': {
        const fillRuleAttr = node.fillRule ? ` fill-rule="${node.fillRule}"` : '';
        return `${indent}<path ${baseAttrs}${fillRuleAttr} d="${node.d || ''}" />`;
      }

      default:
        return '';
    }
  }
}