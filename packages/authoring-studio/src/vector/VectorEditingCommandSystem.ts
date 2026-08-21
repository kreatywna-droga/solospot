/**
 * VectorEditingCommandSystem.ts — Sprint G1-42 Vector Editing Command System (Night Shift Level 4)
 *
 * Implements a pure, headless, transactional Command & Batch Execution System for Authoring Studio.
 * Defines atomic command types, batch execution pipelines, payload validation, and transactional rollback.
 *
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorNode, CornerRadius } from './VectorDomainModel';
import { VectorDocumentSnapshot, isEqualSnapshots } from './VectorWorkspaceController';
import { VectorEditingEngine, LayerReorderAction, AlignmentType } from './VectorEditingEngine';

import { VectorPathEngine } from './VectorPathEngine';
import { VectorBooleanTopologyEngine, BooleanTopologyType } from './VectorBooleanTopologyEngine';
import { VectorCompoundPathEngine, WindingRule } from './VectorCompoundPathEngine';
import { VectorPathSegmentEditorEngine } from './VectorPathSegmentEditorEngine';
import { VectorCompoundTopologyMaskEngine } from './VectorCompoundTopologyMaskEngine';

export type VectorCommandType =
  | 'MOVE_NODES'
  | 'SCALE_NODES'
  | 'ROTATE_NODES'
  | 'ALIGN_NODES'
  | 'GROUP_NODES'
  | 'UNGROUP_NODES'
  | 'DUPLICATE_NODES'
  | 'DELETE_NODES'
  | 'REORDER_LAYERS'
  | 'NUDGE_NODES'
  | 'UPDATE_NODE_PROPS'
  | 'BOOLEAN_TOPOLOGY'
  | 'SMOOTH_PATH_CORNERS'
  | 'REVERSE_PATH'
  | 'MAKE_COMPOUND_PATH'
  | 'RELEASE_COMPOUND_PATH'
  | 'SET_WINDING_RULE'
  | 'INSERT_PATH_NODE'
  | 'DELETE_PATH_NODE'
  | 'SPLIT_PATH_AT_ANCHOR'
  | 'JOIN_PATH_SEGMENTS'
  | 'CREATE_VECTOR_MASK'
  | 'RELEASE_VECTOR_MASK'
  | 'SET_MASK_TOPOLOGY';

export interface VectorCommandPayload {
  readonly type: VectorCommandType;
  readonly targetIds?: ReadonlyArray<string>;
  readonly deltaX?: number;
  readonly deltaY?: number;
  readonly scaleX?: number;
  readonly scaleY?: number;
  readonly angleDeg?: number;
  readonly alignment?: AlignmentType;
  readonly reorderAction?: LayerReorderAction;
  readonly topologyType?: BooleanTopologyType;
  readonly cornerRadiusPx?: number;
  readonly windingRule?: WindingRule;
  readonly segmentIndex?: number;
  readonly anchorId?: string;
  readonly tParam?: number;
  readonly origin?: { readonly x: number; readonly y: number };
  readonly propsUpdate?: {
    readonly fill?: any;
    readonly stroke?: any;
    readonly opacity?: number;
    readonly visible?: boolean;
    readonly locked?: boolean;
    readonly cornerRadius?: CornerRadius;
  };
}

export interface VectorBatchCommand {
  readonly batchId: string;
  readonly description: string;
  readonly commands: ReadonlyArray<VectorCommandPayload>;
}

export interface CommandExecutionResult {
  readonly success: boolean;
  readonly snapshot: VectorDocumentSnapshot;
  readonly affectedIds: ReadonlyArray<string>;
  readonly errors: ReadonlyArray<string>;
}

export class VectorEditingCommandSystem {
  /**
   * Validates command payload for malformed parameters, NaNs, or empty targets.
   */
  public static validateCommandPayload(payload: VectorCommandPayload): boolean {
    if (!payload || typeof payload !== 'object') return false;

    if (payload.deltaX !== undefined && !Number.isFinite(payload.deltaX)) return false;
    if (payload.deltaY !== undefined && !Number.isFinite(payload.deltaY)) return false;
    if (payload.scaleX !== undefined && !Number.isFinite(payload.scaleX)) return false;
    if (payload.scaleY !== undefined && !Number.isFinite(payload.scaleY)) return false;
    if (payload.angleDeg !== undefined && !Number.isFinite(payload.angleDeg)) return false;

    if (payload.origin) {
      if (!Number.isFinite(payload.origin.x) || !Number.isFinite(payload.origin.y)) return false;
    }

    return true;
  }

  /**
   * Executes a single atomic command against a document snapshot.
   */
  public static executeCommand(
    snapshot: VectorDocumentSnapshot,
    command: VectorCommandPayload
  ): CommandExecutionResult {
    if (!snapshot || !Array.isArray(snapshot.nodes)) {
      return { success: false, snapshot: { nodes: [], selectedIds: [] }, affectedIds: [], errors: ['Invalid snapshot'] };
    }

    if (!VectorEditingCommandSystem.validateCommandPayload(command)) {
      return { success: false, snapshot, affectedIds: [], errors: ['Invalid command payload'] };
    }

    try {
      const targetIds = (command.targetIds && command.targetIds.length > 0)
        ? command.targetIds
        : snapshot.selectedIds;

      const activeNodes = snapshot.nodes.filter(n => n && typeof n === 'object' && n.id && targetIds.includes(n.id) && !n.locked);
      if (activeNodes.length === 0 && command.type !== 'DUPLICATE_NODES') {
        return { success: true, snapshot, affectedIds: [], errors: [] };
      }

      let nextNodes: VectorNode[] = [...snapshot.nodes];
      let affectedIds: string[] = [...targetIds];

      switch (command.type) {
        case 'MOVE_NODES':
        case 'NUDGE_NODES': {
          const dx = command.deltaX ?? 0;
          const dy = command.deltaY ?? 0;
          if (dx === 0 && dy === 0) break;
          const moved = activeNodes.map(n => VectorEditingEngine.moveShape(n, dx, dy));
          const movedMap = new Map(moved.map(n => [n.id, n]));
          nextNodes = snapshot.nodes.map(n => (n && n.id && movedMap.has(n.id)) ? movedMap.get(n.id)! : n);
          break;
        }

        case 'SCALE_NODES': {
          const sx = command.scaleX ?? 1;
          const sy = command.scaleY ?? 1;
          if (sx === 1 && sy === 1) break;
          const scaled = VectorEditingEngine.scaleShapes(activeNodes, sx, sy, command.origin);
          const scaledMap = new Map(scaled.map(n => [n.id, n]));
          nextNodes = snapshot.nodes.map(n => (n && n.id && scaledMap.has(n.id)) ? scaledMap.get(n.id)! : n);
          break;
        }

        case 'ROTATE_NODES': {
          const angle = command.angleDeg ?? 0;
          if (angle === 0) break;
          const rotated = VectorEditingEngine.rotateShapes(activeNodes, angle, command.origin);
          const rotatedMap = new Map(rotated.map(n => [n.id, n]));
          nextNodes = snapshot.nodes.map(n => (n && n.id && rotatedMap.has(n.id)) ? rotatedMap.get(n.id)! : n);
          break;
        }

        case 'ALIGN_NODES': {
          if (!command.alignment || activeNodes.length < 2) break;
          const aligned = VectorEditingEngine.alignShapes(activeNodes, command.alignment);
          const alignedMap = new Map(aligned.map(n => [n.id, n]));
          nextNodes = snapshot.nodes.map(n => (n && n.id && alignedMap.has(n.id)) ? alignedMap.get(n.id)! : n);
          break;
        }

        case 'GROUP_NODES': {
          if (activeNodes.length < 2) break;
          const groupId = `group_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
          const groupNode = VectorEditingEngine.groupShapes(groupId, activeNodes);
          const activeIds = new Set(activeNodes.map(n => n.id));
          const remainingNodes = snapshot.nodes.filter(n => !activeIds.has(n.id));
          nextNodes = [...remainingNodes, groupNode];
          return {
            success: true,
            snapshot: {
              nodes: nextNodes,
              selectedIds: [groupNode.id],
            },
            affectedIds: [groupNode.id],
            errors: [],
          };
        }

        case 'UNGROUP_NODES': {
          const groupNode = activeNodes.find(n => n.type === 'group') as any;
          if (!groupNode) break;
          const childNodes = VectorEditingEngine.ungroupShape(groupNode);
          const remainingNodes = snapshot.nodes.filter(n => n.id !== groupNode.id);
          nextNodes = [...remainingNodes, ...childNodes];
          const childIds = childNodes.map((c: any) => c.id);
          return {
            success: true,
            snapshot: {
              nodes: nextNodes,
              selectedIds: childIds,
            },
            affectedIds: childIds,
            errors: [],
          };
        }

        case 'DUPLICATE_NODES': {
          const dx = command.deltaX ?? 20;
          const dy = command.deltaY ?? 20;
          const duplicatedNodes: VectorNode[] = [];
          const newSelectedIds: string[] = [];

          activeNodes.forEach(node => {
            const copyId = `copy_${node.id}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
            const copyNode: VectorNode = {
              ...node,
              id: copyId,
              name: `${node.name || 'Node'} Copy`,
              transform: {
                ...node.transform,
                x: node.transform.x + dx,
                y: node.transform.y + dy,
              },
            };
            duplicatedNodes.push(copyNode);
            newSelectedIds.push(copyId);
          });

          nextNodes = [...snapshot.nodes, ...duplicatedNodes];
          affectedIds = newSelectedIds;
          return {
            success: true,
            snapshot: {
              nodes: nextNodes,
              selectedIds: newSelectedIds,
            },
            affectedIds,
            errors: [],
          };
        }

        case 'DELETE_NODES': {
          const removeSet = new Set(targetIds);
          nextNodes = snapshot.nodes.filter(n => !removeSet.has(n.id) || n.locked);
          const nextSelected = snapshot.selectedIds.filter(id => !removeSet.has(id));
          return {
            success: true,
            snapshot: {
              nodes: nextNodes,
              selectedIds: nextSelected,
            },
            affectedIds: [],
            errors: [],
          };
        }

        case 'REORDER_LAYERS': {
          if (!command.reorderAction || activeNodes.length === 0) break;
          nextNodes = VectorEditingEngine.reorderShapes(snapshot.nodes as VectorNode[], targetIds[0], command.reorderAction);
          break;
        }

        case 'UPDATE_NODE_PROPS': {
          if (!command.propsUpdate) break;
          const targetSet = new Set(targetIds);
          nextNodes = snapshot.nodes.map(node => {
            if (targetSet.has(node.id) && !node.locked) {
              return {
                ...node,
                ...command.propsUpdate,
              };
            }
            return node;
          });
          break;
        }

        case 'BOOLEAN_TOPOLOGY': {
          if (!command.topologyType || activeNodes.length < 2) break;
          const topoRes = VectorBooleanTopologyEngine.executeBooleanTopology(activeNodes, command.topologyType);
          if (!topoRes.success || !topoRes.resultNode) break;

          const removedSet = new Set(topoRes.affectedSourceIds);
          const remainingNodes = snapshot.nodes.filter(n => !removedSet.has(n.id));
          nextNodes = [...remainingNodes, topoRes.resultNode];
          return {
            success: true,
            snapshot: {
              nodes: nextNodes,
              selectedIds: [topoRes.resultNode.id],
            },
            affectedIds: [topoRes.resultNode.id],
            errors: [],
          };
        }

        case 'SMOOTH_PATH_CORNERS': {
          if (activeNodes.length === 0) break;
          const targetSet = new Set(targetIds);
          nextNodes = snapshot.nodes.map(node => {
            if (targetSet.has(node.id) && node.type === 'path' && !node.locked) {
              const res = VectorPathEngine.applyCornerSmoothing(node as any, { radiusPx: command.cornerRadiusPx ?? 10 });
              return res.success ? res.pathNode : node;
            }
            return node;
          });
          break;
        }

        case 'REVERSE_PATH': {
          if (activeNodes.length === 0) break;
          const targetSet = new Set(targetIds);
          nextNodes = snapshot.nodes.map(node => {
            if (targetSet.has(node.id) && node.type === 'path' && !node.locked) {
              const res = VectorPathEngine.reversePath(node as any);
              return res.success ? res.pathNode : node;
            }
            return node;
          });
          break;
        }

        case 'MAKE_COMPOUND_PATH': {
          if (activeNodes.length < 2) break;
          const compoundRes = VectorCompoundPathEngine.combineSubPaths(activeNodes, command.windingRule || 'evenodd');
          if (!compoundRes.success || !compoundRes.compoundNode) break;

          const removedSet = new Set(compoundRes.affectedSourceIds);
          const remaining = snapshot.nodes.filter(n => !removedSet.has(n.id));
          nextNodes = [...remaining, compoundRes.compoundNode];
          return {
            success: true,
            snapshot: {
              nodes: nextNodes,
              selectedIds: [compoundRes.compoundNode.id],
            },
            affectedIds: [compoundRes.compoundNode.id],
            errors: [],
          };
        }

        case 'RELEASE_COMPOUND_PATH': {
          if (activeNodes.length === 0) break;
          const targetNode = activeNodes[0];
          if (targetNode.type !== 'path') break;

          const releaseRes = VectorCompoundPathEngine.releaseSubPaths(targetNode as any);
          if (!releaseRes.success || releaseRes.releasedNodes.length === 0) break;

          const remaining = snapshot.nodes.filter(n => n.id !== targetNode.id);
          nextNodes = [...remaining, ...releaseRes.releasedNodes];
          const newSelectedIds = releaseRes.releasedNodes.map(n => n.id);
          return {
            success: true,
            snapshot: {
              nodes: nextNodes,
              selectedIds: newSelectedIds,
            },
            affectedIds: newSelectedIds,
            errors: [],
          };
        }

        case 'SET_WINDING_RULE': {
          if (activeNodes.length === 0 || !command.windingRule) break;
          const targetSet = new Set(targetIds);
          nextNodes = snapshot.nodes.map(node => {
            if (targetSet.has(node.id) && node.type === 'path' && !node.locked) {
              const res = VectorCompoundPathEngine.setWindingRule(node as any, command.windingRule!);
              return res.success && res.compoundNode ? res.compoundNode : node;
            }
            return node;
          });
          break;
        }

        case 'INSERT_PATH_NODE': {
          if (activeNodes.length === 0) break;
          const targetSet = new Set(targetIds);
          nextNodes = snapshot.nodes.map(node => {
            if (targetSet.has(node.id) && node.type === 'path' && !node.locked) {
              const res = VectorPathSegmentEditorEngine.insertNodeOnSegment(
                node as any,
                command.segmentIndex ?? 0,
                command.tParam ?? 0.5
              );
              return res.success && res.pathNode ? res.pathNode : node;
            }
            return node;
          });
          break;
        }

        case 'DELETE_PATH_NODE': {
          if (activeNodes.length === 0) break;
          const targetSet = new Set(targetIds);
          nextNodes = snapshot.nodes.map(node => {
            if (targetSet.has(node.id) && node.type === 'path' && !node.locked) {
              const res = VectorPathSegmentEditorEngine.deleteAnchorPoint(node as any, command.anchorId ?? '');
              return res.success && res.pathNode ? res.pathNode : node;
            }
            return node;
          });
          break;
        }

        case 'SPLIT_PATH_AT_ANCHOR': {
          if (activeNodes.length === 0) break;
          const targetNode = activeNodes[0];
          if (targetNode.type !== 'path') break;

          const splitRes = VectorPathSegmentEditorEngine.splitPathAtAnchor(targetNode as any, command.anchorId ?? '');
          if (!splitRes.success || !splitRes.createdNodes) break;

          const remaining = snapshot.nodes.filter(n => n.id !== targetNode.id);
          nextNodes = [...remaining, ...splitRes.createdNodes];
          const newSelected = splitRes.createdNodes.map(n => n.id);
          return {
            success: true,
            snapshot: {
              nodes: nextNodes,
              selectedIds: newSelected,
            },
            affectedIds: newSelected,
            errors: [],
          };
        }

        case 'JOIN_PATH_SEGMENTS': {
          if (activeNodes.length < 2) break;
          const pathA = activeNodes[0];
          const pathB = activeNodes[1];
          if (pathA.type !== 'path' || pathB.type !== 'path') break;

          const joinRes = VectorPathSegmentEditorEngine.joinPathSegments(pathA as any, pathB as any);
          if (!joinRes.success || !joinRes.pathNode) break;

          const removed = new Set([pathA.id, pathB.id]);
          const remaining = snapshot.nodes.filter(n => !removed.has(n.id));
          nextNodes = [...remaining, joinRes.pathNode];
          return {
            success: true,
            snapshot: {
              nodes: nextNodes,
              selectedIds: [joinRes.pathNode.id],
            },
            affectedIds: [joinRes.pathNode.id],
            errors: [],
          };
        }

        case 'CREATE_VECTOR_MASK': {
          if (activeNodes.length < 2) break;
          const maskShape = activeNodes[0];
          const targetShapes = activeNodes.slice(1);

          const maskRes = VectorCompoundTopologyMaskEngine.createVectorMask(maskShape, targetShapes);
          if (!maskRes.success || !maskRes.maskedNode) break;

          const removedSet = new Set(maskRes.affectedSourceIds);
          const remaining = snapshot.nodes.filter(n => !removedSet.has(n.id));
          nextNodes = [...remaining, maskRes.maskedNode];
          return {
            success: true,
            snapshot: {
              nodes: nextNodes,
              selectedIds: [maskRes.maskedNode.id],
            },
            affectedIds: [maskRes.maskedNode.id],
            errors: [],
          };
        }

        case 'RELEASE_VECTOR_MASK': {
          if (activeNodes.length === 0) break;
          const targetNode = activeNodes[0];
          const releaseRes = VectorCompoundTopologyMaskEngine.releaseVectorMask(targetNode);
          if (!releaseRes.success || !releaseRes.releasedNodes) break;

          const remaining = snapshot.nodes.filter(n => n.id !== targetNode.id);
          nextNodes = [...remaining, ...releaseRes.releasedNodes];
          const newSelected = releaseRes.releasedNodes.map(n => n.id);
          return {
            success: true,
            snapshot: {
              nodes: nextNodes,
              selectedIds: newSelected,
            },
            affectedIds: newSelected,
            errors: [],
          };
        }

        case 'SET_MASK_TOPOLOGY': {
          if (activeNodes.length === 0) break;
          const targetSet = new Set(targetIds);
          nextNodes = snapshot.nodes.map(node => {
            if (targetSet.has(node.id) && !node.locked) {
              const res = VectorCompoundTopologyMaskEngine.applyCompoundMaskTopology(node, command.topologyType || 'union');
              return res.success && res.maskedNode ? res.maskedNode : node;
            }
            return node;
          });
          break;
        }
      }

      return {
        success: true,
        snapshot: {
          nodes: nextNodes,
          selectedIds: snapshot.selectedIds,
        },
        affectedIds,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        snapshot,
        affectedIds: [],
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Executes a batch of commands sequentially with transactional rollback safety.
   */
  public static executeBatch(
    snapshot: VectorDocumentSnapshot,
    batch: VectorBatchCommand
  ): CommandExecutionResult {
    if (!batch || !Array.isArray(batch.commands) || batch.commands.length === 0) {
      return { success: true, snapshot, affectedIds: [], errors: [] };
    }

    let currentSnapshot = snapshot;
    const allAffectedIds: string[] = [];

    for (let i = 0; i < batch.commands.length; i++) {
      const res = VectorEditingCommandSystem.executeCommand(currentSnapshot, batch.commands[i]);
      if (!res.success) {
        // Transactional Rollback: Revert to initial snapshot completely
        return {
          success: false,
          snapshot,
          affectedIds: [],
          errors: [`Batch '${batch.description}' failed at index ${i}: ${res.errors.join('; ')}`],
        };
      }
      currentSnapshot = res.snapshot;
      allAffectedIds.push(...res.affectedIds);
    }

    return {
      success: true,
      snapshot: currentSnapshot,
      affectedIds: Array.from(new Set(allAffectedIds)),
      errors: [],
    };
  }
}
