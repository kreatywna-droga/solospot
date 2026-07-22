/**
 * SectionTree — C6.1-A / C6.1-B
 *
 * Immutable operations on the SectionNode tree.
 *
 * All operations accept a SectionNode[] and return a NEW SectionNode[]
 * (structural sharing where possible).  This makes HistoryStack snapshots
 * cheap — reference equality is sufficient to detect changes.
 *
 * The tree supports recursive nesting:
 *
 *   Page
 *    ├── HeroSection          (leaf)
 *    ├── TwoColumnLayout      (container)
 *    │    ├── ProductGrid     (child leaf)
 *    │    └── TextBlock       (child leaf)
 *    └── Footer               (leaf)
 */

import { SectionNode } from './BuilderDocument';

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function generateId(prefix = 'sec'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Tree traversal helpers
// ---------------------------------------------------------------------------

/** Find a node anywhere in the tree by id. Returns [node, path] or null. */
export function findNode(
  sections: SectionNode[],
  id: string
): { node: SectionNode; path: number[] } | null {
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].id === id) return { node: sections[i], path: [i] };
    const childResult = findNode(sections[i].children, id);
    if (childResult) return { node: childResult.node, path: [i, ...childResult.path] };
  }
  return null;
}

/** Return a new tree with the node at `id` replaced by the result of `updater`. */
function updateNode(
  sections: SectionNode[],
  id: string,
  updater: (node: SectionNode) => SectionNode
): SectionNode[] {
  return sections.map(node => {
    if (node.id === id) return updater(node);
    if (node.children.length > 0) {
      return { ...node, children: updateNode(node.children, id, updater) };
    }
    return node;
  });
}

/** Remove a node by id from anywhere in the tree. */
function removeNodeFromTree(sections: SectionNode[], id: string): SectionNode[] {
  return sections
    .filter(node => node.id !== id)
    .map(node => ({
      ...node,
      children: node.children.length > 0 ? removeNodeFromTree(node.children, id) : node.children,
    }));
}

/** Recompute .order for a sibling list (0-based, contiguous). */
function reorder(sections: SectionNode[]): SectionNode[] {
  return sections.map((s, i) => (s.order === i ? s : { ...s, order: i }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SectionTreeOps {
  /**
   * Insert a new leaf section at `atIndex` in the root list (or at end).
   * Returns updated sections + the new section's id.
   */
  insertSection(
    sections: SectionNode[],
    type: string,
    defaultProps: Record<string, unknown>,
    atIndex?: number,
    label?: string
  ): { sections: SectionNode[]; newId: string };

  /**
   * Insert a new child into an existing container node.
   */
  insertChild(
    sections: SectionNode[],
    parentId: string,
    type: string,
    defaultProps: Record<string, unknown>,
    atIndex?: number,
    label?: string
  ): { sections: SectionNode[]; newId: string };

  /** Remove a node (and its children) by id from anywhere in the tree. */
  removeNode(sections: SectionNode[], id: string): SectionNode[];

  /**
   * Move a sibling-level section from `fromIndex` to `toIndex`.
   * For nested moves, use moveNodeToParent.
   */
  moveSection(sections: SectionNode[], fromIndex: number, toIndex: number): SectionNode[];

  /**
   * Move a node (anywhere in tree) to a new parent + index.
   * If parentId is null, target is root level.
   */
  moveNodeToParent(
    sections: SectionNode[],
    nodeId: string,
    parentId: string | null,
    toIndex: number
  ): SectionNode[];

  /** Merge partial props into an existing node. */
  updateProps(
    sections: SectionNode[],
    id: string,
    props: Record<string, unknown>
  ): SectionNode[];

  /** Replace all props on a node. */
  replaceProps(
    sections: SectionNode[],
    id: string,
    props: Record<string, unknown>
  ): SectionNode[];

  /** Toggle node.visible */
  toggleVisibility(sections: SectionNode[], id: string): SectionNode[];

  /** Toggle node.locked */
  toggleLock(sections: SectionNode[], id: string): SectionNode[];

  /** Deep-clone a node (and its children) with fresh IDs, insert after source. */
  duplicateNode(
    sections: SectionNode[],
    id: string
  ): { sections: SectionNode[]; newId: string };

  /** Reorder root-level sections by providing the desired array of IDs. */
  reorderByIds(sections: SectionNode[], orderedIds: readonly string[]): SectionNode[];
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

function deepCloneWithNewIds(node: SectionNode): SectionNode {
  const newId = generateId(node.type);
  return {
    ...node,
    id: newId,
    children: node.children.map(deepCloneWithNewIds),
  };
}

export const sectionTree: SectionTreeOps = {
  insertSection(sections, type, defaultProps, atIndex, label) {
    const newId = generateId(type);
    const newNode: SectionNode = {
      id: newId,
      type,
      label: label ?? type,
      props: { ...defaultProps },
      children: [],
      visible: true,
      locked: false,
      order: 0,
    };
    const insertAt = atIndex !== undefined
      ? Math.max(0, Math.min(atIndex, sections.length))
      : sections.length;
    const next = [
      ...sections.slice(0, insertAt),
      newNode,
      ...sections.slice(insertAt),
    ];
    return { sections: reorder(next), newId };
  },

  insertChild(sections, parentId, type, defaultProps, atIndex, label) {
    const newId = generateId(type);
    const updated = updateNode(sections, parentId, parent => {
      const newChild: SectionNode = {
        id: newId,
        type,
        label: label ?? type,
        props: { ...defaultProps },
        children: [],
        visible: true,
        locked: false,
        order: 0,
      };
      const insertAt = atIndex !== undefined
        ? Math.max(0, Math.min(atIndex, parent.children.length))
        : parent.children.length;
      const newChildren = [
        ...parent.children.slice(0, insertAt),
        newChild,
        ...parent.children.slice(insertAt),
      ];
      return { ...parent, children: reorder(newChildren) };
    });
    return { sections: updated, newId };
  },

  removeNode(sections, id) {
    return reorder(removeNodeFromTree(sections, id));
  },

  moveSection(sections, fromIndex, toIndex) {
    if (fromIndex === toIndex) return sections;
    const clamped = Math.max(0, Math.min(toIndex, sections.length - 1));
    const next = [...sections];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(clamped, 0, moved);
    return reorder(next);
  },

  moveNodeToParent(sections, nodeId, parentId, toIndex) {
    const found = findNode(sections, nodeId);
    if (!found) return sections;

    // Remove node from current location
    const nodeToMove = found.node;
    let withoutNode = removeNodeFromTree(sections, nodeId);

    if (parentId === null) {
      // Insert at root level
      const insertAt = Math.max(0, Math.min(toIndex, withoutNode.length));
      withoutNode = [
        ...withoutNode.slice(0, insertAt),
        { ...nodeToMove, order: toIndex },
        ...withoutNode.slice(insertAt),
      ];
      return reorder(withoutNode);
    }

    // Insert into parent's children
    return updateNode(withoutNode, parentId, parent => {
      const insertAt = Math.max(0, Math.min(toIndex, parent.children.length));
      const newChildren = [
        ...parent.children.slice(0, insertAt),
        { ...nodeToMove, order: toIndex },
        ...parent.children.slice(insertAt),
      ];
      return { ...parent, children: reorder(newChildren) };
    });
  },

  updateProps(sections, id, props) {
    return updateNode(sections, id, node => ({
      ...node,
      props: { ...node.props, ...props },
    }));
  },

  replaceProps(sections, id, props) {
    return updateNode(sections, id, node => ({ ...node, props }));
  },

  toggleVisibility(sections, id) {
    return updateNode(sections, id, node => ({ ...node, visible: !node.visible }));
  },

  toggleLock(sections, id) {
    return updateNode(sections, id, node => ({ ...node, locked: !node.locked }));
  },

  duplicateNode(sections, id) {
    const found = findNode(sections, id);
    if (!found) return { sections, newId: '' };

    const clone = deepCloneWithNewIds(found.node);

    // Insert clone immediately after original at root level (simplified)
    // For nested duplications, the caller should use insertChild directly
    const insertIdx = found.path[0] + 1;
    const next = [
      ...sections.slice(0, insertIdx),
      clone,
      ...sections.slice(insertIdx),
    ];
    return { sections: reorder(next), newId: clone.id };
  },

  reorderByIds(sections, orderedIds: readonly string[]) {
    const byId = new Map(sections.map(s => [s.id, s]));
    const reordered: SectionNode[] = [];
    for (const id of orderedIds) {
      const node = byId.get(id);
      if (node) reordered.push(node);
    }
    // append any sections not in orderedIds at the end
    for (const node of sections) {
      if (!orderedIds.includes(node.id)) reordered.push(node);
    }
    return reorder(reordered);
  },
};
