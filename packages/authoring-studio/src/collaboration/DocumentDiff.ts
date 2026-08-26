/**
 * DocumentDiff.ts — Sprint S7 Collaboration Workspace
 *
 * Provides utilities to compare two versions of a BuilderDocument.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument, SectionNode } from '../../../builder-core/src/BuilderDocument';
import type { DocumentChange } from './ChangeTracker';

export interface DiffReport {
  readonly baseVersion: number;
  readonly headVersion: number;
  readonly changes: ReadonlyArray<DocumentChange>;
}

function extractAllNodesMap(doc: BuilderDocument): Record<string, SectionNode> {
  const map: Record<string, SectionNode> = {};
  const collect = (nodes: readonly SectionNode[]) => {
    for (const node of nodes) {
      map[node.id] = node;
      if (node.children && node.children.length > 0) {
        collect(node.children);
      }
    }
  };
  for (const page of doc.pages) {
    collect(page.sections);
  }
  return map;
}

export function calculateDocumentDiff(
  base: BuilderDocument,
  head: BuilderDocument
): DiffReport {
  const changes: DocumentChange[] = [];

  const baseNodes = extractAllNodesMap(base);
  const headNodes = extractAllNodesMap(head);

  const baseNodeIds = new Set(Object.keys(baseNodes));
  const headNodeIds = new Set(Object.keys(headNodes));

  for (const id of headNodeIds) {
    if (!baseNodeIds.has(id)) {
      changes.push({
        changeId: `diff-${Date.now()}-add-${id}`,
        path: `nodes.${id}`,
        operation: 'add',
        newValue: headNodes[id],
        timestampMs: Date.now(),
      });
    } else {
      if (JSON.stringify(baseNodes[id]) !== JSON.stringify(headNodes[id])) {
        changes.push({
          changeId: `diff-${Date.now()}-update-${id}`,
          path: `nodes.${id}`,
          operation: 'update',
          previousValue: baseNodes[id],
          newValue: headNodes[id],
          timestampMs: Date.now(),
        });
      }
    }
  }

  for (const id of baseNodeIds) {
    if (!headNodeIds.has(id)) {
      changes.push({
        changeId: `diff-${Date.now()}-del-${id}`,
        path: `nodes.${id}`,
        operation: 'delete',
        previousValue: baseNodes[id],
        timestampMs: Date.now(),
      });
    }
  }

  return {
    baseVersion: base.version,
    headVersion: head.version,
    changes,
  };
}
