/**
 * TransformResolver.ts — Sprint S10 Scene Composition
 *
 * Computes 2D/3D affine matrix transformations across element hierarchies.
 * Pure matrix math. NO DOM dependencies.
 */

import { Matrix3D, IDENTITY_MATRIX_3D } from './RenderFrame';
import { RenderGraph, getAncestors } from './RenderGraph';

export class TransformResolver {
  public static multiplyMatrices(a: Matrix3D, b: Matrix3D): Matrix3D {
    const out = new Array<number>(16);

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        out[i * 4 + j] =
          a[i * 4 + 0] * b[0 * 4 + j] +
          a[i * 4 + 1] * b[1 * 4 + j] +
          a[i * 4 + 2] * b[2 * 4 + j] +
          a[i * 4 + 3] * b[3 * 4 + j];
      }
    }

    return out as unknown as Matrix3D;
  }

  public static createTranslationMatrix(tx: number, ty: number, tz = 0): Matrix3D {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      tx, ty, tz, 1,
    ];
  }

  public static createScaleMatrix(sx: number, sy: number, sz = 1): Matrix3D {
    return [
      sx, 0, 0, 0,
      0, sy, 0, 0,
      0, 0, sz, 0,
      0, 0, 0, 1,
    ];
  }

  public static createRotationZMatrix(rad: number): Matrix3D {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return [
      cos, sin, 0, 0,
      -sin, cos, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  }

  public static resolveTransformMatrix(
    nodeId: string,
    graph: RenderGraph,
    computedPropsMap: Map<string, Record<string, unknown>>
  ): Matrix3D {
    const node = graph.nodes.get(nodeId);
    if (!node) return IDENTITY_MATRIX_3D;

    const ancestors = getAncestors(graph, nodeId).reverse(); // Root to parent order
    let cumulative = IDENTITY_MATRIX_3D;

    for (const ancestor of ancestors) {
      const localMat = TransformResolver.getNodeLocalMatrix(ancestor.id, graph, computedPropsMap);
      cumulative = TransformResolver.multiplyMatrices(cumulative, localMat);
    }

    const selfMat = TransformResolver.getNodeLocalMatrix(nodeId, graph, computedPropsMap);
    return TransformResolver.multiplyMatrices(cumulative, selfMat);
  }

  private static getNodeLocalMatrix(
    nodeId: string,
    graph: RenderGraph,
    computedPropsMap: Map<string, Record<string, unknown>>
  ): Matrix3D {
    const node = graph.nodes.get(nodeId);
    if (!node) return IDENTITY_MATRIX_3D;

    const computed = computedPropsMap.get(nodeId) ?? {};
    const raw = node.rawProps;

    const x = typeof computed.x === 'number' ? computed.x : (typeof raw.x === 'number' ? raw.x : 0);
    const y = typeof computed.y === 'number' ? computed.y : (typeof raw.y === 'number' ? raw.y : 0);
    const scaleX = typeof computed.scaleX === 'number' ? computed.scaleX : (typeof raw.scaleX === 'number' ? raw.scaleX : 1);
    const scaleY = typeof computed.scaleY === 'number' ? computed.scaleY : (typeof raw.scaleY === 'number' ? raw.scaleY : 1);
    const rotationDeg = typeof computed.rotation === 'number' ? computed.rotation : (typeof raw.rotation === 'number' ? raw.rotation : 0);

    let mat = IDENTITY_MATRIX_3D;

    if (x !== 0 || y !== 0) {
      mat = TransformResolver.multiplyMatrices(mat, TransformResolver.createTranslationMatrix(x, y));
    }
    if (rotationDeg !== 0) {
      const rad = (rotationDeg * Math.PI) / 180;
      mat = TransformResolver.multiplyMatrices(mat, TransformResolver.createRotationZMatrix(rad));
    }
    if (scaleX !== 1 || scaleY !== 1) {
      mat = TransformResolver.multiplyMatrices(mat, TransformResolver.createScaleMatrix(scaleX, scaleY));
    }

    return mat;
  }
}
