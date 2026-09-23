'use client';

import type { ComponentDescriptor } from '../../../packages/builder-core/src/ComponentRegistry';
import { createBuilderNode, generateNodeId, findNode } from '../../../packages/builder-core/src';
import type { BuilderNode, BuilderDocument, BuilderPage } from '../../../packages/builder-core/src/BuilderDocument';

export interface InsertionContext {
  document: BuilderDocument;
  pageId: string;
  selectedNodeId?: string | null;
  targetParentId?: string | null;
  targetIndex?: number;
}

export interface InsertionResult {
  success: boolean;
  nodeId?: string;
  error?: string;
}

function getRootSectionId(found: { node: BuilderNode; parent: BuilderNode | null; page: BuilderPage; path: number[] }, document: BuilderDocument): string {
  let curr = found;
  while (curr && curr.parent) {
    const next = findNode(document, curr.parent.id);
    if (!next || !next.parent) return curr.parent.id;
    curr = next;
  }
  return curr.node.id;
}

export function insertComponent(
  descriptor: ComponentDescriptor,
  context: InsertionContext,
  dispatch: (command: any) => void
): InsertionResult {
  const { document, pageId, selectedNodeId, targetParentId, targetIndex } = context;
  const newNodeId = generateNodeId(descriptor.type);
  
  const newNode: BuilderNode = createBuilderNode({
    id: newNodeId,
    type: descriptor.type,
    label: descriptor.label,
    props: { ...descriptor.defaultProps },
    styles: descriptor.defaultStyles,
    children: [],
  });

  const selectedId = selectedNodeId;
  const found = selectedId ? findNode(document, selectedId) : null;
  const activePage = document.pages.find(p => p.id === pageId);

  if (!activePage) {
    return { success: false, error: 'Target page not found' };
  }

  // Rule 1: A Section is always a top-level page block
  if (descriptor.type === 'section') {
    let insertIdx = activePage.sections.length;
    if (found) {
      const rootSectionId = getRootSectionId(found, document);
      const rootIdx = activePage.sections.findIndex(s => s.id === rootSectionId);
      if (rootIdx >= 0) insertIdx = rootIdx + 1;
    }

    dispatch({
      type: 'INSERT_NODE',
      parentId: null,
      node: newNode,
      index: insertIdx,
      pageId,
    });
  } else if (targetParentId) {
    // Explicit target parent (e.g., from empty container UI)
    dispatch({
      type: 'INSERT_NODE',
      parentId: targetParentId,
      node: { ...newNode, parentId: targetParentId },
      index: targetIndex ?? 0,
      pageId,
    });
  } else if (found) {
    // Rule 2: If a Container or Section is selected, insert inside it
    if (found.node.type === 'container' || found.node.type === 'section') {
      dispatch({
        type: 'INSERT_NODE',
        parentId: found.node.id,
        node: { ...newNode, parentId: found.node.id },
        index: found.node.children.length,
        pageId,
      });
    } else {
      // Rule 3: If an atomic component is selected, insert as sibling immediately after it
      const parentId = found.parent ? found.parent.id : null;
      const siblings = found.parent ? found.parent.children : (found.page?.sections ?? []);
      const siblingIdx = siblings.findIndex(s => s.id === found.node.id);
      dispatch({
        type: 'INSERT_NODE',
        parentId,
        node: { ...newNode, parentId },
        index: siblingIdx >= 0 ? siblingIdx + 1 : undefined,
        pageId,
      });
    }
  } else {
    // Rule 4: Nothing selected — insert into last section or wrap in new section
    if (activePage && activePage.sections.length > 0) {
      const lastSection = activePage.sections[activePage.sections.length - 1];
      const targetParent = (lastSection.children && lastSection.children.length > 0 && lastSection.children[lastSection.children.length - 1].type === 'container')
        ? lastSection.children[lastSection.children.length - 1]
        : lastSection;

      dispatch({
        type: 'INSERT_NODE',
        parentId: targetParent.id,
        node: { ...newNode, parentId: targetParent.id },
        index: targetParent.children.length,
        pageId,
      });
    } else {
      // Empty page: create standard Section wrapper with the new node as child
      const wrapperSection = createBuilderNode({
        id: generateNodeId('section'),
        type: 'section',
        label: 'Sekcja',
        props: { padding: 'md', background: '#0a0a14' },
        children: [{ ...newNode, parentId: null }],
      });
      newNode.parentId = wrapperSection.id;
      wrapperSection.children = [newNode];
      dispatch({
        type: 'INSERT_NODE',
        parentId: null,
        node: wrapperSection,
        pageId,
      });
    }
  }

  // Immediately select the newly created node
  dispatch({
    type: 'CANVAS',
    action: { type: 'SELECT_SECTION', sectionId: newNodeId, pageId },
  });

  return { success: true, nodeId: newNodeId };
}

export function insertComponentByType(
  componentType: string,
  context: InsertionContext,
  dispatch: (command: any) => void,
  registry: { get: (type: string) => ComponentDescriptor | undefined }
): InsertionResult {
  const descriptor = registry.get(componentType);
  if (!descriptor) {
    return { success: false, error: `Component type "${componentType}" not found in registry` };
  }
  return insertComponent(descriptor, context, dispatch);
}