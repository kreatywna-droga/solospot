/**
 * Phase 1 Integration Tests
 *
 * Covers:
 * - Canvas Selection -> State & Breadcrumbs sync
 * - Layers Selection -> Canvas Selection synchronization
 * - Toolbar Actions -> Document Model mutations (Duplicate, Delete, Lock, Hide)
 * - History Integration -> Undo / Redo for node commands
 * - Persistence -> Complete JSON serialization & round-trip verification
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderContext,
  createBuilderNode,
  createBuilderDocument,
  createBuilderPage,
  createMemoryChannel,
  createBuilderComponentRegistry,
  BuilderDocument,
  nodeTree,
  findNode,
  reduceSelection,
  DEFAULT_SELECTION,
} from '../index';

function createHierarchyContext() {
  const heading = createBuilderNode({
    id: 'heading-1',
    type: 'heading',
    label: 'Heading Element',
    parentId: 'container-1',
    props: { text: 'Title' },
    styles: { color: '#ffffff' },
  });

  const button = createBuilderNode({
    id: 'button-1',
    type: 'button',
    label: 'Action Button',
    parentId: 'container-1',
    props: { text: 'Click Here' },
  });

  const container = createBuilderNode({
    id: 'container-1',
    type: 'container',
    label: 'Inner Container',
    parentId: 'section-1',
    children: [heading, button],
  });

  const section = createBuilderNode({
    id: 'section-1',
    type: 'section',
    label: 'Main Section',
    children: [container],
  });

  const page = createBuilderPage({
    id: 'page-1',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [section],
  });

  const doc = createBuilderDocument({
    id: 'store-integration',
    pages: [page],
  });

  const registry = createBuilderComponentRegistry();
  const preview = createMemoryChannel().builderChannel;

  return createBuilderContext({
    document: doc,
    registry,
    preview,
  });
}

describe('Phase 1 Integration Tests: Canvas, Selection & Document Model', () => {
  it('Canvas -> Selection: Selecting nested element updates canvas state & breadcrumbs', () => {
    let ctx = createHierarchyContext();

    // Select nested heading
    ctx = ctx.dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: 'heading-1', pageId: 'page-1' },
    });

    expect(ctx.canvas.selectedSectionId).toBe('heading-1');
    expect(ctx.canvas.selection.selectedIds).toEqual(['heading-1']);
    expect(ctx.canvas.selection.primarySelectionId).toBe('heading-1');

    // Breadcrumbs should trace page-1 > section-1 > container-1 > heading-1
    const breadcrumbIds = ctx.canvas.selection.breadcrumbs.map(b => b.id);
    expect(breadcrumbIds).toEqual(['page-1', 'section-1', 'container-1', 'heading-1']);

    // Inspector node resolution via findNode
    const found = findNode(ctx.document, ctx.canvas.selectedSectionId!);
    expect(found).not.toBeNull();
    expect(found?.node.id).toBe('heading-1');
    expect(found?.node.type).toBe('heading');
    expect(found?.node.props.text).toBe('Title');
  });

  it('Layers -> Canvas: Selecting a node in layers synchronizes with canvas state', () => {
    let ctx = createHierarchyContext();

    // Select container from layer tree
    ctx = ctx.dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: 'container-1', pageId: 'page-1' },
    });

    expect(ctx.canvas.selectedSectionId).toBe('container-1');
    expect(ctx.canvas.selection.selectedIds).toEqual(['container-1']);

    // Select child button from layer tree
    ctx = ctx.dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: 'button-1', pageId: 'page-1' },
    });

    expect(ctx.canvas.selectedSectionId).toBe('button-1');
    expect(ctx.canvas.selection.selectedIds).toEqual(['button-1']);
  });

  it('Toolbar -> Document: Duplicate duplicates node, updates IDs and auto-selects duplicate', () => {
    let ctx = createHierarchyContext();

    ctx = ctx.dispatch({
      type: 'DUPLICATE_NODE',
      nodeId: 'heading-1',
    });

    // Check that parent container now has 3 children (heading, duplicate heading, button)
    const container = nodeTree.getNode(ctx.document, 'container-1');
    expect(container?.children.length).toBe(3);

    const newHeading = container?.children.find(c => c.id !== 'heading-1' && c.type === 'heading');
    expect(newHeading).toBeDefined();
    expect(newHeading?.props.text).toBe('Title');

    // Auto-selected on duplicate
    expect(ctx.canvas.selectedSectionId).toBe(newHeading?.id);
  });

  it('Toolbar -> Document: Delete removes node and clears selection', () => {
    let ctx = createHierarchyContext();

    // Select heading
    ctx = ctx.dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: 'heading-1' },
    });
    expect(ctx.canvas.selectedSectionId).toBe('heading-1');

    // Delete node
    ctx = ctx.dispatch({
      type: 'REMOVE_NODE',
      nodeId: 'heading-1',
    });

    expect(nodeTree.getNode(ctx.document, 'heading-1')).toBeNull();
    // Selection must be cleared
    expect(ctx.canvas.selectedSectionId).toBeNull();
  });

  it('Lock & Hide: Updates document node flags accurately', () => {
    let ctx = createHierarchyContext();

    // Lock
    ctx = ctx.dispatch({
      type: 'SET_NODE_LOCKED',
      nodeId: 'button-1',
      locked: true,
    });
    expect(nodeTree.getNode(ctx.document, 'button-1')?.locked).toBe(true);

    // Hide
    ctx = ctx.dispatch({
      type: 'SET_NODE_HIDDEN',
      nodeId: 'button-1',
      hidden: true,
    });
    expect(nodeTree.getNode(ctx.document, 'button-1')?.hidden).toBe(true);
    expect(nodeTree.getNode(ctx.document, 'button-1')?.visible).toBe(false);
  });

  it('History: Undo and Redo restore exact node tree states', () => {
    let ctx = createHierarchyContext();

    // 1. Insert a new child node
    const newText = createBuilderNode({
      id: 'subtext-1',
      type: 'text',
      label: 'Subtext',
      props: { text: 'Initial' },
    });

    ctx = ctx.dispatch({
      type: 'INSERT_NODE',
      parentId: 'container-1',
      node: newText,
      pageId: 'page-1',
    });

    expect(nodeTree.getNode(ctx.document, 'subtext-1')).not.toBeNull();
    expect(ctx.history.canUndo).toBe(true);

    // 2. Undo
    ctx = ctx.dispatch({ type: 'UNDO' });
    expect(nodeTree.getNode(ctx.document, 'subtext-1')).toBeNull();
    expect(ctx.history.canRedo).toBe(true);

    // 3. Redo
    ctx = ctx.dispatch({ type: 'REDO' });
    expect(nodeTree.getNode(ctx.document, 'subtext-1')).not.toBeNull();
  });

  it('Persistence: JSON serialization and deserialization retains tree hierarchy perfectly', () => {
    const ctx = createHierarchyContext();

    const serialized = JSON.stringify(ctx.document);
    const deserialized: BuilderDocument = JSON.parse(serialized);

    expect(deserialized.id).toBe(ctx.document.id);
    expect(deserialized.pages.length).toBe(1);

    const section = deserialized.pages[0].sections[0];
    expect(section.id).toBe('section-1');
    expect(section.children.length).toBe(1);

    const container = section.children[0];
    expect(container.id).toBe('container-1');
    expect(container.parentId).toBe('section-1');
    expect(container.children.length).toBe(2);

    const heading = container.children[0];
    expect(heading.id).toBe('heading-1');
    expect(heading.parentId).toBe('container-1');
    expect(heading.props.text).toBe('Title');
    expect(heading.styles?.color).toBe('#ffffff');
    expect(heading.visible).toBe(true);
    expect(heading.locked).toBe(false);
  });
});
