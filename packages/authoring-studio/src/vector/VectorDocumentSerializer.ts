/**
 * VectorDocumentSerializer.ts — Sprint G1-29 Vector Document Persistence & Restoration
 *
 * Serializes VectorDocumentSnapshot into versioned JSON payload DTOs.
 * Restores and validates payloads with geometry normalization and schema safety.
 */

import { VectorNode, ShapeGroupNode } from './VectorDomainModel';
import { VectorDocumentSnapshot } from './VectorWorkspaceController';

export interface VectorDocumentDTO {
  version: number;
  schema: 'vector_document';
  createdAt: number;
  updatedAt: number;
  nodes: VectorNode[];
  selectedIds: string[];
  constraintEdges?: any[];
  metadata?: Record<string, unknown>;
}

export interface VectorDocumentRestoreResult {
  success: boolean;
  snapshot?: VectorDocumentSnapshot;
  error?: string;
  repairedCount?: number;
  skippedNodeCount?: number;
}

export class VectorDocumentSerializer {
  public static readonly CURRENT_VERSION = 1;

  /**
   * Serializes a VectorDocumentSnapshot into a portable JSON string.
   */
  public static serializeVectorDocument(
    snapshot: VectorDocumentSnapshot,
    metadata?: Record<string, unknown>
  ): string {
    const dto: VectorDocumentDTO = {
      version: VectorDocumentSerializer.CURRENT_VERSION,
      schema: 'vector_document',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes: snapshot.nodes as VectorNode[],
      selectedIds: snapshot.selectedIds as string[],
      constraintEdges: (snapshot.constraintEdges || []) as any[],
      metadata,
    };

    return JSON.stringify(dto, null, 2);
  }

  /**
   * Restores and validates a JSON string payload into a VectorDocumentSnapshot.
   */
  public static restoreVectorDocument(jsonString: string): VectorDocumentRestoreResult {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        return { success: false, error: 'Empty or non-string payload' };
      }

      const dto = JSON.parse(jsonString) as Partial<VectorDocumentDTO>;

      if (!dto || typeof dto !== 'object') {
        return { success: false, error: 'Invalid JSON payload structure' };
      }

      if (dto.schema !== 'vector_document') {
        return { success: false, error: `Invalid schema signature: ${String(dto.schema)}` };
      }

      if (typeof dto.version !== 'number' || dto.version < 1) {
        return { success: false, error: `Unsupported schema version: ${String(dto.version)}` };
      }

      if (!Array.isArray(dto.nodes)) {
        return { success: false, error: 'Payload nodes property must be an array' };
      }

      let repairedCount = 0;
      let skippedNodeCount = 0;
      const seenIds = new Set<string>();
      const validatedNodes: VectorNode[] = [];

      for (const rawNode of dto.nodes) {
        const sanitized = VectorDocumentSerializer.sanitizeNode(rawNode, seenIds);
        if (sanitized.node) {
          validatedNodes.push(sanitized.node);
          if (sanitized.repaired) repairedCount++;
        } else {
          skippedNodeCount++;
        }
      }

      const validNodeIds = new Set(validatedNodes.map(n => n.id));
      const rawSelectedIds = Array.isArray(dto.selectedIds) ? dto.selectedIds : [];
      const validatedSelectedIds = rawSelectedIds.filter((id): id is string =>
        typeof id === 'string' && validNodeIds.has(id)
      );

      const snapshot: VectorDocumentSnapshot = {
        nodes: validatedNodes,
        selectedIds: validatedSelectedIds,
        constraintEdges: (dto.constraintEdges || []) as any[],
      };

      return {
        success: true,
        snapshot,
        repairedCount,
        skippedNodeCount,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON parse failure',
      };
    }
  }

  /**
   * Recursively sanitizes node DTOs, deduplicating IDs and normalizing geometry.
   */
  private static sanitizeNode(
    raw: any,
    seenIds: Set<string>
  ): { node: VectorNode | null; repaired: boolean } {
    if (!raw || typeof raw !== 'object' || typeof raw.type !== 'string') {
      return { node: null, repaired: true };
    }

    let repaired = false;

    // ID Sanitization & Deduplication
    let id = typeof raw.id === 'string' && raw.id.trim().length > 0 ? raw.id.trim() : null;
    if (!id || seenIds.has(id)) {
      id = `node_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      repaired = true;
    }
    seenIds.add(id);

    // Transform Normalization
    const rawT = raw.transform || {};
    const x = typeof rawT.x === 'number' && Number.isFinite(rawT.x) ? rawT.x : 0;
    const y = typeof rawT.y === 'number' && Number.isFinite(rawT.y) ? rawT.y : 0;
    const width = typeof rawT.width === 'number' && Number.isFinite(rawT.width) ? Math.max(0, rawT.width) : 100;
    const height = typeof rawT.height === 'number' && Number.isFinite(rawT.height) ? Math.max(0, rawT.height) : 100;
    const rotationDeg = typeof rawT.rotationDeg === 'number' && Number.isFinite(rawT.rotationDeg) ? rawT.rotationDeg : (typeof rawT.rotation === 'number' && Number.isFinite(rawT.rotation) ? rawT.rotation : 0);
    const scaleX = typeof rawT.scaleX === 'number' && Number.isFinite(rawT.scaleX) ? rawT.scaleX : 1;
    const scaleY = typeof rawT.scaleY === 'number' && Number.isFinite(rawT.scaleY) ? rawT.scaleY : 1;
    const skewX = typeof rawT.skewX === 'number' && Number.isFinite(rawT.skewX) ? rawT.skewX : 0;
    const skewY = typeof rawT.skewY === 'number' && Number.isFinite(rawT.skewY) ? rawT.skewY : 0;

    if (rawT.x !== x || rawT.y !== y || rawT.width !== width || rawT.height !== height) {
      repaired = true;
    }

    const transform = { x, y, width, height, rotationDeg, scaleX, scaleY, skewX, skewY };

    // Fill & Stroke Fallbacks
    const fill = raw.fill && typeof raw.fill === 'object' ? raw.fill : { color: '#3b82f6' };
    const stroke = raw.stroke && typeof raw.stroke === 'object' ? raw.stroke : { color: '#1e293b', width: 1 };
    const visible = typeof raw.visible === 'boolean' ? raw.visible : true;
    const locked = typeof raw.locked === 'boolean' ? raw.locked : false;
    const opacity = typeof raw.opacity === 'number' && Number.isFinite(raw.opacity) ? Math.max(0, Math.min(1, raw.opacity)) : 1;

    let constraints = undefined;
    if (raw.constraints && typeof raw.constraints === 'object') {
      const { horizontal, vertical } = raw.constraints;
      const validH = ['MIN', 'MAX', 'CENTER', 'STRETCH', 'SCALE'].includes(horizontal) ? horizontal : 'MIN';
      const validV = ['MIN', 'MAX', 'CENTER', 'STRETCH', 'SCALE'].includes(vertical) ? vertical : 'MIN';
      constraints = { horizontal: validH, vertical: validV };
    }

    if (raw.type === 'group') {
      const children: VectorNode[] = [];
      if (Array.isArray(raw.children)) {
        for (const child of raw.children) {
          const childSanitized = VectorDocumentSerializer.sanitizeNode(child, seenIds);
          if (childSanitized.node) {
            children.push(childSanitized.node);
            if (childSanitized.repaired) repaired = true;
          }
        }
      }
      const groupNode: ShapeGroupNode = {
        id,
        type: 'group',
        name: raw.name || 'Group',
        visible,
        locked,
        opacity,
        transform,
        fill,
        stroke,
        children,
        constraints,
        ...(raw.isMask !== undefined ? { isMask: raw.isMask } : {}),
        ...(raw.clipPathId !== undefined ? { clipPathId: raw.clipPathId } : {}),
        ...(raw.isMaskGroup !== undefined ? { isMaskGroup: raw.isMaskGroup } : {}),
      };
      return { node: groupNode, repaired };
    }

    const node: VectorNode = {
      ...raw,
      id,
      transform,
      fill,
      stroke,
      visible,
      opacity,
      constraints,
      ...(raw.isMask !== undefined ? { isMask: raw.isMask } : {}),
      ...(raw.clipPathId !== undefined ? { clipPathId: raw.clipPathId } : {}),
      ...(raw.isMaskGroup !== undefined ? { isMaskGroup: raw.isMaskGroup } : {}),
    };

    return { node, repaired };
  }
}
