/**
 * NodeTree & Document Model Unit Tests — Phase 1
 *
 * Mandatory coverage:
 * - create node
 * - get node
 * - get parent
 * - get children
 * - insert node
 * - remove node
 * - move node
 * - duplicate node
 * - update node
 * - lock / hide
 * - integrity: duplicate IDs, cycle prevention, invalid parent, parent deletion
 * - selection traversal: section, child, nested child, Escape traversal to root/clear
 */

import { describe, it, expect } from 'vitest';
import {
  nodeTree,
  createBuilderNode,
  BuilderDocument,
  createBuilderDocument,
  createBuilderPage,
  reduceSelection,
  CanvasAction,
  DEFAULT_SELECTION,
} from '../index';

function createSampleHierarchyDoc(): BuilderDocument {
  const heading = createBuilderNode({
    id: 'heading-1',
    type: 'heading',
    label: 'Heading',
    parentId: 'container-1',
    props: { text: 'Hello World' },
  });

  const text = createBuilderNode({
    id: 'text-1',
    type: 'text',
    label: 'Paragraph',
    parentId: 'container-1',
    props: { text: 'Description content' },
  });

  const button = createBuilderNode({
    id: 'button-1',
    type: 'button',
    label: 'Button',
    parentId: 'container-1',
    props: { text: 'Click me' },
  });

  const innerContainer = createBuilderNode({
    id: 'container-1',
    type: 'container',
    label: 'Container',
    parentId: 'section-1',
    children: [heading, text, button],
  });

  const section = createBuilderNode({
    id: 'section-1',
    type: 'section',
    label: 'Hero Section',
    children: [innerContainer],
  });

  const page = createBuilderPage({
    id: 'page-1',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [section],
  });

  return createBuilderDocument({
    id: 'store-1',
    pages: [page],
  });
}

describe('Document Model & NodeTree API (Phase 1)', () => {
  describe('Create & Read Operations', () => {
    it('creates a universal BuilderNode with default integrity fields', () => {
      const node = createBuilderNode({
        id: 'node-test',
        type: 'button',
        label: 'Test Button',
        props: { variant: 'primary' },
        styles: { backgroundColor: '#7c3aed' },
      });

      expect(node.id).toBe('node-test');
      expect(node.type).toBe('button');
      expect(node.label).toBe('Test Button');
      expect(node.props.variant).toBe('primary');
      expect(node.styles?.backgroundColor).toBe('#7c3aed');
      expect(node.children).toEqual([]);
      expect(node.visible).toBe(true);
      expect(node.locked).toBe(false);
      expect(node.order).toBe(0);
    });

    it('gets node by ID at any nesting depth', () => {
      const doc = createSampleHierarchyDoc();

      const section = nodeTree.getNode(doc, 'section-1');
      expect(section).not.toBeNull();
      expect(section?.type).toBe('section');

      const container = nodeTree.getNode(doc, 'container-1');
      expect(container).not.toBeNull();
      expect(container?.type).toBe('container');

      const heading = nodeTree.getNode(doc, 'heading-1');
      expect(heading).not.toBeNull();
      expect(heading?.type).toBe('heading');
      expect(heading?.props.text).toBe('Hello World');

      const nonExistent = nodeTree.getNode(doc, 'unknown-id');
      expect(nonExistent).toBeNull();
    });

    it('gets parent of a node', () => {
      const doc = createSampleHierarchyDoc();

      const headingParent = nodeTree.getParent(doc, 'heading-1');
      expect(headingParent).not.toBeNull();
      expect(headingParent?.id).toBe('container-1');

      const containerParent = nodeTree.getParent(doc, 'container-1');
      expect(containerParent).not.toBeNull();
      expect(containerParent?.id).toBe('section-1');

      const sectionParent = nodeTree.getParent(doc, 'section-1');
      expect(sectionParent).toBeNull();
    });

    it('gets children of a node', () => {
      const doc = createSampleHierarchyDoc();

      const containerChildren = nodeTree.getChildren(doc, 'container-1');
      expect(containerChildren.length).toBe(3);
      expect(containerChildren.map(c => c.id)).toEqual(['heading-1', 'text-1', 'button-1']);

      const leafChildren = nodeTree.getChildren(doc, 'heading-1');
      expect(leafChildren).toEqual([]);
    });
  });

  describe('Mutations & Tree Integrity', () => {
    it('inserts a node into root or into a parent container', () => {
      const doc = createSampleHierarchyDoc();

      const newImage = createBuilderNode({
        id: 'image-1',
        type: 'image',
        label: 'Product Image',
        props: { src: 'https://example.com/img.jpg' },
      });

      const updatedDoc = nodeTree.insertNode(doc, 'container-1', newImage, 1);
      const containerChildren = nodeTree.getChildren(updatedDoc, 'container-1');

      expect(containerChildren.length).toBe(4);
      expect(containerChildren[1].id).toBe('image-1');
      expect(containerChildren[1].parentId).toBe('container-1');
      expect(containerChildren[1].order).toBe(1);
    });

    it('prevents inserting duplicate IDs and throws error', () => {
      const doc = createSampleHierarchyDoc();

      const duplicate = createBuilderNode({
        id: 'heading-1',
        type: 'heading',
        label: 'Duplicate Heading',
      });

      expect(() => {
        nodeTree.insertNode(doc, 'container-1', duplicate);
      }).toThrow(/already exists/);
    });

    it('prevents invalid parent and throws error', () => {
      const doc = createSampleHierarchyDoc();

      const orphan = createBuilderNode({
        id: 'orphan-1',
        type: 'text',
      });

      expect(() => {
        nodeTree.insertNode(doc, 'non-existent-parent', orphan, undefined, 'page-1');
      }).toThrow(/Target parent node "non-existent-parent" not found/);
    });

    it('removes a node and all of its descendants safely', () => {
      const doc = createSampleHierarchyDoc();

      const updated = nodeTree.removeNode(doc, 'container-1');
      expect(nodeTree.getNode(updated, 'container-1')).toBeNull();
      expect(nodeTree.getNode(updated, 'heading-1')).toBeNull();
      expect(nodeTree.getNode(updated, 'text-1')).toBeNull();
      expect(nodeTree.getNode(updated, 'button-1')).toBeNull();

      const section = nodeTree.getNode(updated, 'section-1');
      expect(section?.children.length).toBe(0);
    });

    it('moves a node across parents maintaining parent/child integrity', () => {
      const doc = createSampleHierarchyDoc();

      // Add a second section
      const section2 = createBuilderNode({
        id: 'section-2',
        type: 'section',
        label: 'Section 2',
        children: [],
      });
      const docWithSec2 = nodeTree.insertNode(doc, null, section2);

      // Move heading-1 from container-1 to section-2
      const movedDoc = nodeTree.moveNode(docWithSec2, 'heading-1', 'section-2', 0);

      const sec2Children = nodeTree.getChildren(movedDoc, 'section-2');
      expect(sec2Children.length).toBe(1);
      expect(sec2Children[0].id).toBe('heading-1');
      expect(sec2Children[0].parentId).toBe('section-2');

      const oldContainerChildren = nodeTree.getChildren(movedDoc, 'container-1');
      expect(oldContainerChildren.length).toBe(2);
      expect(oldContainerChildren.some(c => c.id === 'heading-1')).toBe(false);
    });

    it('prevents cycle creation (moving node into its own descendant)', () => {
      const doc = createSampleHierarchyDoc();

      expect(() => {
        // Attempt to move section-1 into heading-1
        nodeTree.moveNode(doc, 'section-1', 'heading-1');
      }).toThrow(/descendant/);
    });

    it('duplicates a node deeply with new unique IDs for all children', () => {
      const doc = createSampleHierarchyDoc();

      const { doc: dupDoc, newNode } = nodeTree.duplicateNode(doc, 'container-1');
      expect(newNode).not.toBeNull();
      expect(newNode?.id).not.toBe('container-1');
      expect(newNode?.type).toBe('container');
      expect(newNode?.children.length).toBe(3);

      // Child IDs must be fresh and unique
      const childIds = newNode?.children.map(c => c.id) || [];
      expect(childIds.includes('heading-1')).toBe(false);
      expect(childIds.includes('text-1')).toBe(false);
      expect(childIds.includes('button-1')).toBe(false);

      // Original children must still exist
      expect(nodeTree.getNode(dupDoc, 'heading-1')).not.toBeNull();
    });

    it('updates node props, styles, locked and hidden flags', () => {
      const doc = createSampleHierarchyDoc();

      const doc1 = nodeTree.setNodeProps(doc, 'heading-1', { text: 'Updated Text' });
      expect(nodeTree.getNode(doc1, 'heading-1')?.props.text).toBe('Updated Text');

      const doc2 = nodeTree.setNodeStyles(doc1, 'heading-1', { color: '#ef4444', fontSize: '32px' });
      expect(nodeTree.getNode(doc2, 'heading-1')?.styles?.color).toBe('#ef4444');
      expect(nodeTree.getNode(doc2, 'heading-1')?.styles?.fontSize).toBe('32px');

      const doc3 = nodeTree.setNodeLocked(doc2, 'heading-1', true);
      expect(nodeTree.getNode(doc3, 'heading-1')?.locked).toBe(true);

      const doc4 = nodeTree.setNodeHidden(doc3, 'heading-1', true);
      expect(nodeTree.getNode(doc4, 'heading-1')?.hidden).toBe(true);
      expect(nodeTree.getNode(doc4, 'heading-1')?.visible).toBe(false);
    });
  });

  describe('Hierarchical Selection & Escape Traversal', () => {
    it('selects section -> child container -> nested element', () => {
      const doc = createSampleHierarchyDoc();

      // 1. Select Section
      const sel1 = reduceSelection(DEFAULT_SELECTION, doc, {
        type: 'SELECT_SECTION',
        sectionId: 'section-1',
      });
      expect(sel1.selectedIds).toEqual(['section-1']);
      expect(sel1.primarySelectionId).toBe('section-1');

      // 2. Select Child Container
      const sel2 = reduceSelection(sel1, doc, {
        type: 'SELECT_SECTION',
        sectionId: 'container-1',
      });
      expect(sel2.selectedIds).toEqual(['container-1']);
      expect(sel2.breadcrumbs.length).toBe(3); // page-1 > section-1 > container-1

      // 3. Select Nested Heading
      const sel3 = reduceSelection(sel2, doc, {
        type: 'SELECT_SECTION',
        sectionId: 'heading-1',
      });
      expect(sel3.selectedIds).toEqual(['heading-1']);
      expect(sel3.breadcrumbs.length).toBe(4); // page-1 > section-1 > container-1 > heading-1
    });

    it('Escape walks up the hierarchy: Heading -> Container -> Section -> Root/Clear', () => {
      const doc = createSampleHierarchyDoc();

      // Start at Heading
      let state = reduceSelection(DEFAULT_SELECTION, doc, {
        type: 'SELECT_SECTION',
        sectionId: 'heading-1',
      });
      expect(state.selectedIds).toEqual(['heading-1']);

      // 1st Escape: Heading -> Container
      state = reduceSelection(state, doc, { type: 'SELECT_PARENT' });
      expect(state.selectedIds).toEqual(['container-1']);
      expect(state.primarySelectionId).toBe('container-1');

      // 2nd Escape: Container -> Section
      state = reduceSelection(state, doc, { type: 'SELECT_PARENT' });
      expect(state.selectedIds).toEqual(['section-1']);
      expect(state.primarySelectionId).toBe('section-1');

      // 3rd Escape: Section -> Root (clear selection)
      state = reduceSelection(state, doc, { type: 'SELECT_PARENT' });
      expect(state.selectedIds).toEqual([]);
      expect(state.primarySelectionId).toBeNull();
      expect(state.breadcrumbs).toEqual([]);
    });
  });
});
