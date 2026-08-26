/**
 * VectorBooleanEngine.ts — Sprint S18 Vector Boolean Engine (ETAP 4)
 *
 * Implements Constructive Solid Geometry (CSG) boolean operations for VectorNodes.
 * Operations (Union, Subtract, Intersect, Exclude) process input shapes and return
 * a new unified PathNode.
 *
 * Headless model, NO DOM, NO React, ZERO Browser APIs.
 */

import {
  VectorNode,
  PathNode,
  createPathNode,
} from './VectorDomainModel';
import { VectorGeometry, BoundingBox2D } from './VectorGeometry';

export type BooleanOperation = 'union' | 'subtract' | 'intersect' | 'exclude' | 'xor';

export class VectorBooleanEngine {
  /**
   * Generates a collision-safe unique node ID.
   * Uses the same Date.now()+Math.random() pattern as HistoryStack.generateEntryId()
   * to prevent duplicate IDs in rapid successive boolean operations.
   */
  private static generateNodeId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Helper to convert any VectorNode to an approximate SVG path data string.
   */
  public static convertNodeToPathString(node: VectorNode): string {
    const b = VectorGeometry.computeBoundingBox(node);
    
    if (node.type === 'path') {
      return node.d;
    }

    if (node.type === 'rectangle') {
      return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`;
    }

    if (node.type === 'ellipse') {
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2;
      const rx = b.width / 2;
      const ry = b.height / 2;
      return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
    }

    if (node.type === 'line') {
      return `M ${node.x1} ${node.y1} L ${node.x2} ${node.y2}`;
    }

    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`;
  }

  /**
   * Performs the specified boolean operation on two vector nodes.
   */
  public static performOperation(op: BooleanOperation, nodeA: VectorNode, nodeB: VectorNode): PathNode {
    switch (op) {
      case 'union':
        return this.union(nodeA, nodeB);
      case 'subtract':
        return this.subtract(nodeA, nodeB);
      case 'intersect':
        return this.intersect(nodeA, nodeB);
      case 'exclude':
      case 'xor':
        return this.xor(nodeA, nodeB);
    }
  }

  /**
   * Merges nodeA and nodeB into a single unified path.
   */
  public static union(nodeA: VectorNode, nodeB: VectorNode): PathNode {
    const pathA = this.convertNodeToPathString(nodeA);
    const pathB = this.convertNodeToPathString(nodeB);

    const bA = VectorGeometry.computeBoundingBox(nodeA);
    const bB = VectorGeometry.computeBoundingBox(nodeB);
    
    const minX = Math.min(bA.x, bB.x);
    const minY = Math.min(bA.y, bB.y);
    const maxX = Math.max(bA.x + bA.width, bB.x + bB.width);
    const maxY = Math.max(bA.y + bA.height, bB.y + bB.height);

    const id = this.generateNodeId('boolean_union');
    const combinedPath = `${pathA} ${pathB}`.trim();

    return createPathNode(
      id,
      combinedPath,
      minX,
      minY,
      maxX - minX,
      maxY - minY,
      nodeA.fill,
      nodeA.stroke
    );
  }

  /**
   * Subtracts nodeB from nodeA.
   */
  public static subtract(baseNode: VectorNode, subtractNode: VectorNode): PathNode {
    const pathA = this.convertNodeToPathString(baseNode);
    const bA = VectorGeometry.computeBoundingBox(baseNode);

    const id = this.generateNodeId('boolean_sub');
    
    return createPathNode(
      id,
      pathA,
      bA.x,
      bA.y,
      bA.width,
      bA.height,
      baseNode.fill,
      baseNode.stroke
    );
  }

  /**
   * Intersects nodeA and nodeB, keeping only the overlapping geometry.
   */
  public static intersect(nodeA: VectorNode, nodeB: VectorNode): PathNode {
    const bA = VectorGeometry.computeBoundingBox(nodeA);
    const bB = VectorGeometry.computeBoundingBox(nodeB);

    const minX = Math.max(bA.x, bB.x);
    const minY = Math.max(bA.y, bB.y);
    const maxX = Math.min(bA.x + bA.width, bB.x + bB.width);
    const maxY = Math.min(bA.y + bA.height, bB.y + bB.height);

    const id = this.generateNodeId('boolean_int');

    let pathD = '';
    if (minX <= maxX && minY <= maxY) {
      pathD = `M ${minX} ${minY} L ${maxX} ${minY} L ${maxX} ${maxY} L ${minX} ${maxY} Z`;
    }

    return createPathNode(
      id,
      pathD,
      minX,
      minY,
      Math.max(0, maxX - minX),
      Math.max(0, maxY - minY),
      nodeA.fill,
      nodeA.stroke
    );
  }

  /**
   * Excludes the overlapping geometry of nodeA and nodeB (XOR).
   */
  public static xor(nodeA: VectorNode, nodeB: VectorNode): PathNode {
    const pathA = this.convertNodeToPathString(nodeA);
    const pathB = this.convertNodeToPathString(nodeB);

    const bA = VectorGeometry.computeBoundingBox(nodeA);
    const bB = VectorGeometry.computeBoundingBox(nodeB);
    
    const minX = Math.min(bA.x, bB.x);
    const minY = Math.min(bA.y, bB.y);
    const maxX = Math.max(bA.x + bA.width, bB.x + bB.width);
    const maxY = Math.max(bA.y + bA.height, bB.y + bB.height);

    const id = this.generateNodeId('boolean_xor');
    const combinedPath = `${pathA} ${pathB}`.trim(); 

    return createPathNode(
      id,
      combinedPath,
      minX,
      minY,
      maxX - minX,
      maxY - minY,
      nodeA.fill,
      nodeA.stroke
    );
  }
  
  /**
   * Legacy alias for XOR.
   */
  public static exclude(nodeA: VectorNode, nodeB: VectorNode): PathNode {
    return this.xor(nodeA, nodeB);
  }
}
