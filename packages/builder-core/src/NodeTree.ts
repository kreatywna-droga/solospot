/**
 * NodeTree — C17.1 Phase 1
 *
 * Universal, immutable, high-integrity hierarchical tree operations
 * for BuilderDocument and BuilderNode (Page -> Section -> Container -> Elements).
 */

import { BuilderDocument, BuilderNode, BuilderPage, NodeStyles } from './BuilderDocument';

// ---------------------------------------------------------------------------
// ID & UUID helper
// ---------------------------------------------------------------------------

export function generateNodeId(type = 'node'): string {
  const cleanType = type.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleanType}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Traversal & Search Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively search a list of nodes for an ID.
 * Returns the node, its parent node (if any), and array path of indices.
 */
export function findNodeInTree(
  nodes: BuilderNode[],
  id: string,
  parent: BuilderNode | null = null
): { node: BuilderNode; parent: BuilderNode | null; path: number[] } | null {
  for (let i = 0; i < nodes.length; i++) {
    const current = nodes[i];
    if (current.id === id) {
      return { node: current, parent, path: [i] };
    }
    if (current.children && current.children.length > 0) {
      const found = findNodeInTree(current.children, id, current);
      if (found) {
        return { node: found.node, parent: found.parent, path: [i, ...found.path] };
      }
    }
  }
  return null;
}

/**
 * Checks if candidateDescendantId is a descendant of ancestorNode.
 * Essential for cycle prevention when moving nodes.
 */
export function isDescendant(ancestorNode: BuilderNode, candidateDescendantId: string): boolean {
  if (ancestorNode.id === candidateDescendantId) return true;
  if (!ancestorNode.children || ancestorNode.children.length === 0) return false;
  return ancestorNode.children.some(child => isDescendant(child, candidateDescendantId));
}

/**
 * Recursively check if an ID exists anywhere in the document.
 */
export function hasNodeId(doc: BuilderDocument, id: string): boolean {
  for (const page of doc.pages) {
    if (findNodeInTree(page.sections, id)) {
      return true;
    }
  }
  return false;
}

/**
 * Re-indexes sibling orders sequentially (0-based contiguous).
 */
export function normalizeOrder(nodes: BuilderNode[]): BuilderNode[] {
  return nodes.map((n, i) => (n.order === i ? n : { ...n, order: i }));
}

// ---------------------------------------------------------------------------
// Core NodeTree Query API
// ---------------------------------------------------------------------------

export function findNode(
  doc: BuilderDocument,
  id: string
): { node: BuilderNode; parent: BuilderNode | null; page: BuilderPage; path: number[] } | null {
  for (const page of doc.pages) {
    const result = findNodeInTree(page.sections, id);
    if (result) {
      return { node: result.node, parent: result.parent, page, path: result.path };
    }
  }
  return null;
}

export const findNodeInDocument = findNode;

export function getNode(doc: BuilderDocument, id: string): BuilderNode | null {
  const found = findNode(doc, id);
  return found ? found.node : null;
}

export function getParent(doc: BuilderDocument, id: string): BuilderNode | null {
  const found = findNode(doc, id);
  return found ? found.parent : null;
}

export function getChildren(doc: BuilderDocument, id: string): BuilderNode[] {
  const node = getNode(doc, id);
  return node ? [...node.children] : [];
}

// ---------------------------------------------------------------------------
// Node Tree Mutation API (Immutable & Exception Safe)
// ---------------------------------------------------------------------------

/**
 * Deep clone a node and its children, assigning new unique IDs.
 */
export function cloneNodeWithNewIds(node: BuilderNode, parentId?: string | null): BuilderNode {
  const newId = generateNodeId(node.type);
  const clonedChildren = (node.children || []).map(child => cloneNodeWithNewIds(child, newId));

  return {
    ...node,
    id: newId,
    label: `${node.label || node.type} (Kopia)`,
    parentId: parentId !== undefined ? parentId : node.parentId,
    props: JSON.parse(JSON.stringify(node.props || {})),
    styles: node.styles ? JSON.parse(JSON.stringify(node.styles)) : undefined,
    responsive: node.responsive ? JSON.parse(JSON.stringify(node.responsive)) : undefined,
    metadata: node.metadata ? JSON.parse(JSON.stringify(node.metadata)) : undefined,
    children: clonedChildren,
  };
}

/**
 * Inserts a new node into the document tree.
 * If parentId is null, inserts into root level of targetPage (as section).
 * Otherwise, inserts into the children[] array of parent node.
 */
export function insertNode(
  doc: BuilderDocument,
  parentId: string | null,
  nodeToInsert: BuilderNode,
  index?: number,
  targetPageId?: string
): BuilderDocument {
  // Integrity check 1: duplicate ID prevention
  if (hasNodeId(doc, nodeToInsert.id)) {
    throw new Error(`Integrity Violation: Node with ID "${nodeToInsert.id}" already exists in BuilderDocument`);
  }

  if (parentId) {
    const parentNode = findNode(doc, parentId);
    if (!parentNode) {
      throw new Error(`Integrity Violation: Target parent node "${parentId}" not found`);
    }
  }

  const effectivePageId = targetPageId || (parentId ? findNode(doc, parentId)?.page.id : doc.pages[0]?.id);
  if (!effectivePageId) {
    throw new Error('Integrity Violation: Target page could not be resolved for insertNode');
  }

  const newPages = doc.pages.map(page => {
    if (page.id !== effectivePageId) return page;

    if (!parentId) {
      // Insert at root of page
      const currentSections = [...page.sections];
      const insertIdx = index !== undefined ? Math.max(0, Math.min(index, currentSections.length)) : currentSections.length;
      const formattedNode: BuilderNode = {
        ...nodeToInsert,
        parentId: null,
        children: nodeToInsert.children || [],
        order: insertIdx,
      };
      currentSections.splice(insertIdx, 0, formattedNode);
      return {
        ...page,
        sections: normalizeOrder(currentSections),
      };
    }

    // Insert as child of an existing node
    function insertRecursive(nodes: BuilderNode[]): BuilderNode[] {
      return nodes.map(item => {
        if (item.id === parentId) {
          const currentChildren = [...(item.children || [])];
          const insertIdx = index !== undefined ? Math.max(0, Math.min(index, currentChildren.length)) : currentChildren.length;
          const formattedNode: BuilderNode = {
            ...nodeToInsert,
            parentId: item.id,
            children: nodeToInsert.children || [],
            order: insertIdx,
          };
          currentChildren.splice(insertIdx, 0, formattedNode);
          return {
            ...item,
            children: normalizeOrder(currentChildren),
          };
        }

        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: insertRecursive(item.children),
          };
        }
        return item;
      });
    }

    return {
      ...page,
      sections: insertRecursive(page.sections),
    };
  });

  return {
    ...doc,
    pages: newPages,
  };
}

/**
 * Removes a node and all of its descendants from the document tree.
 */
export function removeNode(doc: BuilderDocument, id: string): BuilderDocument {
  const found = findNode(doc, id);
  if (!found) return doc; // No-op if node does not exist

  function filterRecursive(nodes: BuilderNode[]): BuilderNode[] {
    const filtered = nodes.filter(n => n.id !== id);
    return normalizeOrder(
      filtered.map(n => ({
        ...n,
        children: n.children && n.children.length > 0 ? filterRecursive(n.children) : [],
      }))
    );
  }

  return {
    ...doc,
    pages: doc.pages.map(page => ({
      ...page,
      sections: filterRecursive(page.sections),
    })),
  };
}

/**
 * Moves a node to a new parent and/or new index with cycle prevention.
 */
export function moveNode(
  doc: BuilderDocument,
  id: string,
  targetParentId: string | null,
  targetIndex?: number
): BuilderDocument {
  const found = findNode(doc, id);
  if (!found) {
    throw new Error(`Cannot move: Node with ID "${id}" does not exist`);
  }

  const nodeToMove = found.node;

  // Integrity check: cycle prevention
  if (targetParentId !== null) {
    if (targetParentId === id) {
      throw new Error(`Cycle Prevention: Cannot move node "${id}" inside itself`);
    }
    if (isDescendant(nodeToMove, targetParentId)) {
      throw new Error(`Cycle Prevention: Cannot move node "${id}" into its own descendant "${targetParentId}"`);
    }
  }

  // Remove node first
  const docWithoutNode = removeNode(doc, id);

  // Insert node at new location
  const updatedNode: BuilderNode = {
    ...nodeToMove,
    parentId: targetParentId,
  };

  return insertNode(docWithoutNode, targetParentId, updatedNode, targetIndex, found.page.id);
}

/**
 * Duplicates a node (and all its children) with new unique IDs and inserts it right after the source node.
 */
export function duplicateNode(
  doc: BuilderDocument,
  id: string
): { doc: BuilderDocument; newId: string; newNode: BuilderNode } {
  const found = findNode(doc, id);
  if (!found) {
    throw new Error(`Cannot duplicate: Node with ID "${id}" does not exist`);
  }

  const cloned = cloneNodeWithNewIds(found.node, found.parent ? found.parent.id : null);
  const siblings = found.parent ? found.parent.children : found.page.sections;
  const sourceIndex = siblings.findIndex(s => s.id === id);
  const targetIndex = sourceIndex >= 0 ? sourceIndex + 1 : undefined;

  const newDoc = insertNode(
    doc,
    found.parent ? found.parent.id : null,
    cloned,
    targetIndex,
    found.page.id
  );

  return {
    doc: newDoc,
    newId: cloned.id,
    newNode: cloned,
  };
}

/**
 * Updates a node's properties, styles, or metadata.
 */
export function updateNode(
  doc: BuilderDocument,
  id: string,
  updates: Partial<BuilderNode>
): BuilderDocument {
  function updateRecursive(nodes: BuilderNode[]): BuilderNode[] {
    return nodes.map(n => {
      if (n.id === id) {
        return {
          ...n,
          ...updates,
          id: n.id, // ID must remain immutable
          children: updates.children !== undefined ? updates.children : n.children,
        };
      }
      if (n.children && n.children.length > 0) {
        return {
          ...n,
          children: updateRecursive(n.children),
        };
      }
      return n;
    });
  }

  return {
    ...doc,
    pages: doc.pages.map(page => ({
      ...page,
      sections: updateRecursive(page.sections),
    })),
  };
}

export function setNodeProps(
  doc: BuilderDocument,
  id: string,
  props: Record<string, unknown>
): BuilderDocument {
  const found = findNode(doc, id);
  if (!found) return doc;
  return updateNode(doc, id, {
    props: {
      ...found.node.props,
      ...props,
    },
  });
}

export function setNodeStyles(
  doc: BuilderDocument,
  id: string,
  styles: Partial<NodeStyles>
): BuilderDocument {
  const found = findNode(doc, id);
  if (!found) return doc;
  return updateNode(doc, id, {
    styles: {
      ...(found.node.styles || {}),
      ...styles,
    },
  });
}

export function setNodeLocked(
  doc: BuilderDocument,
  id: string,
  locked: boolean
): BuilderDocument {
  return updateNode(doc, id, { locked });
}

export function setNodeHidden(
  doc: BuilderDocument,
  id: string,
  hidden: boolean
): BuilderDocument {
  return updateNode(doc, id, {
    visible: !hidden,
    hidden,
  });
}

export const nodeTree = {
  getNode,
  getParent,
  getChildren,
  insertNode,
  removeNode,
  moveNode,
  duplicateNode,
  updateNode,
  setNodeProps,
  setNodeStyles,
  setNodeLocked,
  setNodeHidden,
  findNode,
  findNodeInDocument,
  findNodeInTree,
};
