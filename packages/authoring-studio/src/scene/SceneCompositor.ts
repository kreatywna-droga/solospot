/**
 * SceneCompositor.ts — Sprint S19 Compositing Engine (ETAP 3)
 *
 * Implements pure headless compositing calculations for:
 * - Inherited & cumulative opacity
 * - Global & layer blend modes
 * - Clipping groups & masks
 * - Group opacity & isolation
 * - Inherited 2D world transform matrices (translation, rotation, scaling, skewing)
 * - Nested transform resolution
 * - Effective layer visibility (parent visibility, solo mode, isolate mode)
 * - Effective lock states
 *
 * Pure math & tree traversal: NO DOM, NO React, NO Canvas API, ZERO 2nd Renderer.
 */

import { BlendMode, Layer, Scene, Transform2D } from './SceneGraphModel';
import { Mask } from '../masks/MaskModel';
import { EffectDescriptor, evaluateCSSFilter, evaluateShadow } from '../effects/EffectModel';

export type Matrix2D = readonly [number, number, number, number, number, number];

export interface CompositedLayerNode {
  readonly layerId: string;
  readonly id?: string;
  readonly name: string;
  readonly type: string;
  readonly parentId?: string;
  readonly depth: number;
  readonly effectiveOpacity: number;
  readonly blendMode: BlendMode;
  readonly effectiveVisibility: boolean;
  readonly effectiveLock: boolean;
  readonly worldMatrix: Matrix2D;
  readonly worldBounds: { x: number; y: number; width: number; height: number };
  readonly isClipped: boolean;
  readonly maskLayerId?: string;
  readonly clipPath?: string;
  readonly masks?: ReadonlyArray<Mask>;
  readonly effects?: ReadonlyArray<EffectDescriptor>;
  readonly evaluatedFilterString?: string;
  readonly evaluatedShadow?: { color: string; blur: number; offsetX: number; offsetY: number; inner?: boolean };
  readonly nodeRefId?: string;
  readonly props?: Record<string, unknown>;
}

export class SceneCompositor {
  /**
   * Identity 2D affine transform matrix [a, b, c, d, e, f]
   */
  public static readonly IDENTITY_MATRIX: Matrix2D = [1, 0, 0, 1, 0, 0];

  /**
   * Computes 2D affine matrix for local Transform2D (translation, rotation, scale, skew).
   */
  public static createLocalMatrix(t: Transform2D): Matrix2D {
    const rad = (t.rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const skewXRad = (t.skewX * Math.PI) / 180;
    const skewYRad = (t.skewY * Math.PI) / 180;

    const tanSkewX = Math.tan(skewXRad);
    const tanSkewY = Math.tan(skewYRad);

    // Combine scale, skew, and rotation into 2x2 matrix
    let a = cos * t.scaleX + tanSkewY * -sin * t.scaleY;
    let b = sin * t.scaleX + tanSkewY * cos * t.scaleY;
    let c = -sin * t.scaleY + tanSkewX * cos * t.scaleX;
    let d = cos * t.scaleY + tanSkewX * sin * t.scaleX;

    const e = t.x;
    const f = t.y;

    return [a, b, c, d, e, f];
  }

  /**
   * Multiplies two 2D affine matrices: M_res = M1 * M2
   */
  public static multiplyMatrices(m1: Matrix2D, m2: Matrix2D): Matrix2D {
    const [a1, b1, c1, d1, e1, f1] = m1;
    const [a2, b2, c2, d2, e2, f2] = m2;

    return [
      a1 * a2 + c1 * b2,
      b1 * a2 + d1 * b2,
      a1 * c2 + c1 * d2,
      b1 * c2 + d1 * d2,
      a1 * e2 + c1 * f2 + e1,
      b1 * e2 + d1 * f2 + f1,
    ];
  }

  /**
   * Computes cumulative inherited opacity down ancestor chain.
   */
  public static computeInheritedOpacity(scene: Scene, layerId: string): number {
    let current: Layer | undefined = scene.layers[layerId];
    let opacity = 1.0;

    while (current) {
      opacity *= current.opacity;
      if (!current.parentId) break;
      current = scene.layers[current.parentId];
    }

    return Math.max(0, Math.min(1, opacity));
  }

  /**
   * Computes effective visibility considering local visibility, parent visibility,
   * scene solo mode, and scene isolation mode.
   */
  public static computeEffectiveVisibility(scene: Scene, layerId: string): boolean {
    const targetLayer = scene.layers[layerId];
    if (!targetLayer) return false;

    // 1. Check local & ancestor explicit visibility
    let current: Layer | undefined = targetLayer;
    while (current) {
      if (!current.visible) return false;
      if (!current.parentId) break;
      current = scene.layers[current.parentId];
    }

    // 2. Check scene-wide Isolation Mode
    if (scene.isolatedLayerId) {
      const isolatedId = scene.isolatedLayerId;
      const isIsolatedTarget = layerId === isolatedId;

      // Is target an ancestor of isolated target?
      let isAncestorOfIsolated = false;
      let isoNode = scene.layers[isolatedId];
      while (isoNode && isoNode.parentId) {
        if (isoNode.parentId === layerId) {
          isAncestorOfIsolated = true;
          break;
        }
        isoNode = scene.layers[isoNode.parentId];
      }

      // Is target a descendant of isolated target?
      let isDescendantOfIsolated = false;
      let targetNode: Layer | undefined = targetLayer;
      while (targetNode && targetNode.parentId) {
        if (targetNode.parentId === isolatedId) {
          isDescendantOfIsolated = true;
          break;
        }
        targetNode = scene.layers[targetNode.parentId];
      }

      if (!isIsolatedTarget && !isAncestorOfIsolated && !isDescendantOfIsolated) {
        return false;
      }
    }

    // 3. Check scene-wide Solo Mode
    if (scene.soloLayerIds && scene.soloLayerIds.length > 0) {
      const soloSet = new Set(scene.soloLayerIds);

      // Is layer itself soloed?
      if (soloSet.has(layerId)) return true;

      // Is any ancestor soloed?
      let currSoloCheck: Layer | undefined = targetLayer;
      let ancestorSoloed = false;
      while (currSoloCheck && currSoloCheck.parentId) {
        if (soloSet.has(currSoloCheck.parentId)) {
          ancestorSoloed = true;
          break;
        }
        currSoloCheck = scene.layers[currSoloCheck.parentId];
      }

      // Is any descendant soloed? (Group containing soloed layer must be visible)
      let descendantSoloed = false;
      const checkDescendantsSolo = (id: string): boolean => {
        const node = scene.layers[id];
        if (!node) return false;
        if (soloSet.has(id)) return true;
        if (node.childIds) {
          return node.childIds.some(checkDescendantsSolo);
        }
        return false;
      };

      if (targetLayer.type === 'group') {
        descendantSoloed = checkDescendantsSolo(layerId);
      }

      if (!ancestorSoloed && !descendantSoloed) {
        return false;
      }
    }

    return true;
  }

  /**
   * Computes effective lock status (locked if self or any ancestor is locked).
   */
  public static computeEffectiveLock(scene: Scene, layerId: string): boolean {
    let current: Layer | undefined = scene.layers[layerId];
    while (current) {
      if (current.locked) return true;
      if (!current.parentId) break;
      current = scene.layers[current.parentId];
    }
    return false;
  }

  /**
   * Computes 2D world transform matrix accumulated from root down to target layer.
   */
  public static computeWorldMatrix(scene: Scene, layerId: string): Matrix2D {
    const chain: Layer[] = [];
    let current: Layer | undefined = scene.layers[layerId];

    while (current) {
      chain.unshift(current);
      if (!current.parentId) break;
      current = scene.layers[current.parentId];
    }

    let worldMatrix: Matrix2D = this.IDENTITY_MATRIX;
    for (const layer of chain) {
      const localMatrix = this.createLocalMatrix(layer.transform);
      worldMatrix = this.multiplyMatrices(worldMatrix, localMatrix);
    }

    return worldMatrix;
  }

  /**
   * Computes global bounding box coordinates from world transform matrix and dimensions.
   */
  public static computeWorldBounds(scene: Scene, layerId: string): { x: number; y: number; width: number; height: number } {
    const layer = scene.layers[layerId];
    if (!layer) return { x: 0, y: 0, width: 0, height: 0 };

    const matrix = this.computeWorldMatrix(scene, layerId);
    const [a, b, c, d, e, f] = matrix;
    const w = layer.transform.width;
    const h = layer.transform.height;

    // Transform 4 corners
    const p1 = { x: e, y: f };
    const p2 = { x: a * w + e, y: b * w + f };
    const p3 = { x: c * h + e, y: d * h + f };
    const p4 = { x: a * w + c * h + e, y: b * w + d * h + f };

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Resolves active clipping group or mask applied to this layer.
   */
  public static computeClipping(scene: Scene, layerId: string): { isClipped: boolean; maskLayerId?: string; clipPath?: string } {
    for (const key of Object.keys(scene.layers)) {
      const node = scene.layers[key];
      if (node.clippingGroup) {
        if (node.clippingGroup.clippedLayerIds.includes(layerId)) {
          return {
            isClipped: true,
            maskLayerId: node.clippingGroup.maskLayerId,
            clipPath: node.clippingGroup.clipPath,
          };
        }
      }
    }
    return { isClipped: false };
  }

  /**
   * Builds fully evaluated CompositedLayerNode for a specific layer.
   */
  public static compositedNode(scene: Scene, layerId: string, depth: number = 0): CompositedLayerNode | null {
    const layer = scene.layers[layerId];
    if (!layer) return null;

    const effectiveOpacity = this.computeInheritedOpacity(scene, layerId);
    const effectiveVisibility = this.computeEffectiveVisibility(scene, layerId);
    const effectiveLock = this.computeEffectiveLock(scene, layerId);
    const worldMatrix = this.computeWorldMatrix(scene, layerId);
    const worldBounds = this.computeWorldBounds(scene, layerId);
    const clipping = this.computeClipping(scene, layerId);

    const masks = layer.maskStack ?? [];
    const effects = layer.effectStack ?? [];
    const filterString = evaluateCSSFilter(effects);
    const shadow = evaluateShadow(effects);

    return {
      layerId: layer.id,
      id: layer.id,
      name: layer.name,
      type: layer.type,
      parentId: layer.parentId,
      depth,
      effectiveOpacity,
      blendMode: layer.blendMode,
      effectiveVisibility,
      effectiveLock,
      worldMatrix,
      worldBounds,
      isClipped: clipping.isClipped,
      maskLayerId: clipping.maskLayerId,
      clipPath: clipping.clipPath,
      masks,
      effects,
      evaluatedFilterString: filterString !== 'none' ? filterString : undefined,
      evaluatedShadow: shadow,
      nodeRefId: layer.nodeRefId,
      props: layer.props,
    };
  }

  /**
   * Traverses the entire scene in z-order (bottom-to-top) and returns composited nodes.
   */
  public static traverseCompositedScene(scene: Scene): CompositedLayerNode[] {
    const result: CompositedLayerNode[] = [];

    const traverse = (layerId: string, depth: number) => {
      const node = this.compositedNode(scene, layerId, depth);
      if (!node) return;

      result.push(node);

      const layer = scene.layers[layerId];
      if (layer && layer.childIds && layer.childIds.length > 0) {
        for (const childId of layer.childIds) {
          traverse(childId, depth + 1);
        }
      }
    };

    for (const rootId of scene.rootLayerIds) {
      traverse(rootId, 0);
    }

    return result;
  }
}
