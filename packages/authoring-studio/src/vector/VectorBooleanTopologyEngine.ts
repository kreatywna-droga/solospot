/**
 * VectorBooleanTopologyEngine.ts — Sprint G1-43 Boolean Topology Engine (Night Shift Level 5)
 *
 * Advanced Boolean Topology Operations System for Authoring Studio.
 * Computes Union, Difference, Intersection, and Exclusion path topologies across multiple shapes.
 *
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorNode, PathNode, createPathNode } from './VectorDomainModel';
import { VectorBooleanEngine, BooleanOperation } from './VectorBooleanEngine';

export type BooleanTopologyType = 'union' | 'difference' | 'intersection' | 'exclusion';

export interface BooleanTopologyResult {
  readonly success: boolean;
  readonly resultNode?: VectorNode;
  readonly affectedSourceIds: ReadonlyArray<string>;
  readonly errors: ReadonlyArray<string>;
}

export class VectorBooleanTopologyEngine {
  /**
   * Validates target shapes for boolean operations.
   */
  public static validateShapesForTopology(shapes: ReadonlyArray<VectorNode>): boolean {
    if (!Array.isArray(shapes) || shapes.length < 2) return false;
    return shapes.every(s => s && typeof s === 'object' && s.id && s.transform && !s.locked);
  }

  /**
   * Executes a boolean topology operation across a list of vector shapes.
   */
  public static executeBooleanTopology(
    shapes: ReadonlyArray<VectorNode>,
    operation: BooleanTopologyType
  ): BooleanTopologyResult {
    if (!VectorBooleanTopologyEngine.validateShapesForTopology(shapes)) {
      return {
        success: false,
        affectedSourceIds: [],
        errors: ['Boolean topology requires at least 2 valid, unlocked shapes.'],
      };
    }

    try {
      const sourceIds = shapes.map(s => s.id);
      let combinedPath: PathNode | undefined = undefined;

      // Sequentially compose shapes using underlying VectorBooleanEngine
      for (let i = 0; i < shapes.length - 1; i++) {
        const shapeA: VectorNode = combinedPath || shapes[i];
        const shapeB: VectorNode = shapes[i + 1];

        let op: BooleanOperation = 'union';
        if (operation === 'difference') op = 'subtract';
        else if (operation === 'intersection') op = 'intersect';
        else if (operation === 'exclusion') op = 'exclude';
        else if (operation === 'union') op = 'union';
        else op = operation as BooleanOperation;

        combinedPath = VectorBooleanEngine.performOperation(op, shapeA, shapeB);
      }

      if (!combinedPath) {
        return {
          success: false,
          affectedSourceIds: sourceIds,
          errors: ['Failed to compute boolean topology path.'],
        };
      }

      // Assign new topology ID
      const topologyId = `path_topo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const resultNode: PathNode = {
        ...combinedPath,
        id: topologyId,
        name: `Path Topology (${operation})`,
      };

      return {
        success: true,
        resultNode,
        affectedSourceIds: sourceIds,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        affectedSourceIds: shapes.map(s => s.id),
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}
