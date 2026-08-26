/**
 * MergeStrategy.ts — Sprint S7 Collaboration Workspace
 *
 * Logic to automatically merge changes or detect conflicts without DOM APIs.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument, SectionNode } from '../../../builder-core/src/BuilderDocument';
import { touchDocument } from '../../../builder-core/src/BuilderDocument';
import { calculateDocumentDiff } from './DocumentDiff';
import { createConflictState, registerConflict, type ConflictState } from './ConflictMetadata';

export type MergeStrategyType = 'theirs' | 'ours' | 'manual';

export interface MergeResult {
  readonly mergedDocument: BuilderDocument;
  readonly conflictState: ConflictState;
}

function removeNodeFromDocument(doc: BuilderDocument, nodeId: string): BuilderDocument {
  const filterNodes = (nodes: SectionNode[]): SectionNode[] =>
    nodes
      .filter((n) => n.id !== nodeId)
      .map((n) => ({
        ...n,
        children: n.children ? filterNodes(n.children) : [],
      }));

  return {
    ...doc,
    pages: doc.pages.map((p) => ({
      ...p,
      sections: filterNodes(p.sections),
    })),
  };
}

function upsertNodeInDocument(doc: BuilderDocument, node: SectionNode): BuilderDocument {
  let found = false;
  const updateNodes = (nodes: SectionNode[]): SectionNode[] =>
    nodes.map((n) => {
      if (n.id === node.id) {
        found = true;
        return node;
      }
      return {
        ...n,
        children: n.children ? updateNodes(n.children) : [],
      };
    });

  const updatedPages = doc.pages.map((p) => ({
    ...p,
    sections: updateNodes(p.sections),
  }));

  if (!found && updatedPages.length > 0) {
    updatedPages[0] = {
      ...updatedPages[0],
      sections: [...updatedPages[0].sections, node],
    };
  }

  return {
    ...doc,
    pages: updatedPages,
  };
}

export function performMerge(
  base: BuilderDocument,
  local: BuilderDocument,
  remote: BuilderDocument,
  strategy: MergeStrategyType
): MergeResult {
  let conflictState = createConflictState();
  
  let mergedDoc: BuilderDocument = {
    ...local,
    pages: local.pages.map((p) => ({
      ...p,
      sections: [...p.sections],
    })),
  };
  
  const remoteDiff = calculateDocumentDiff(base, remote);
  const localDiff = calculateDocumentDiff(base, local);
  
  const localChangedPaths = new Set(localDiff.changes.map((c) => c.path));

  for (const change of remoteDiff.changes) {
    const isConflict = localChangedPaths.has(change.path);
    const nodeId = change.path.split('.')[1];
    
    if (isConflict) {
      if (strategy === 'manual') {
        const localChange = localDiff.changes.find(c => c.path === change.path);
        conflictState = registerConflict(
          conflictState,
          change.path,
          change.previousValue,
          localChange?.newValue,
          change.newValue
        );
      } else if (strategy === 'theirs') {
        if (change.operation === 'delete') {
          mergedDoc = removeNodeFromDocument(mergedDoc, nodeId);
        } else if (change.newValue) {
          mergedDoc = upsertNodeInDocument(mergedDoc, change.newValue as any);
        }
      }
    } else {
      if (change.operation === 'delete') {
        mergedDoc = removeNodeFromDocument(mergedDoc, nodeId);
      } else if (change.newValue) {
        mergedDoc = upsertNodeInDocument(mergedDoc, change.newValue as any);
      }
    }
  }

  return {
    mergedDocument: touchDocument(mergedDoc),
    conflictState,
  };
}
