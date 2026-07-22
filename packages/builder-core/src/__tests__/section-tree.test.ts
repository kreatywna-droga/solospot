/**
 * section-tree.test.ts — C6.1-E
 *
 * Tests for SectionTree operations:
 *   - insertSection (root level)
 *   - insertChild (into container)
 *   - removeNode
 *   - moveSection (root level)
 *   - moveNodeToParent (cross-level)
 *   - updateProps / replaceProps
 *   - toggleVisibility / toggleLock
 *   - duplicateNode
 *   - reorderByIds
 *   - findNode
 */

import { describe, it, expect } from 'vitest';
import { sectionTree, findNode } from '../SectionTree';
import { SectionNode } from '../BuilderDocument';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLeaf(id: string, type: string, order = 0): SectionNode {
  return {
    id,
    type,
    label: type,
    props: {},
    children: [],
    visible: true,
    locked: false,
    order,
  };
}

function makeContainer(id: string, children: SectionNode[], order = 0): SectionNode {
  return {
    id,
    type: 'container',
    label: 'Container',
    props: {},
    children,
    visible: true,
    locked: false,
    order,
  };
}

// ---------------------------------------------------------------------------
// insertSection
// ---------------------------------------------------------------------------

describe('sectionTree.insertSection', () => {
  it('appends a new section to empty list', () => {
    const { sections, newId } = sectionTree.insertSection([], 'hero', { title: 'Hello' });
    expect(sections).toHaveLength(1);
    expect(sections[0].type).toBe('hero');
    expect(sections[0].props).toEqual({ title: 'Hello' });
    expect(sections[0].id).toBe(newId);
    expect(sections[0].order).toBe(0);
  });

  it('inserts at given index', () => {
    const initial = [makeLeaf('a', 'hero', 0), makeLeaf('b', 'footer', 1)];
    const { sections, newId } = sectionTree.insertSection(initial, 'banner', {}, 1);
    expect(sections).toHaveLength(3);
    expect(sections[0].id).toBe('a');
    expect(sections[1].id).toBe(newId);
    expect(sections[2].id).toBe('b');
    // orders should be recomputed
    expect(sections.map(s => s.order)).toEqual([0, 1, 2]);
  });

  it('clamps negative atIndex to 0', () => {
    const initial = [makeLeaf('a', 'hero')];
    const { sections } = sectionTree.insertSection(initial, 'footer', {}, -5);
    expect(sections[0].type).toBe('footer');
  });
});

// ---------------------------------------------------------------------------
// insertChild
// ---------------------------------------------------------------------------

describe('sectionTree.insertChild', () => {
  it('adds a child to a container node', () => {
    const container = makeContainer('c1', []);
    const { sections, newId } = sectionTree.insertChild([container], 'c1', 'text', { body: 'Hi' });
    expect(sections).toHaveLength(1);
    expect(sections[0].children).toHaveLength(1);
    expect(sections[0].children[0].id).toBe(newId);
    expect(sections[0].children[0].type).toBe('text');
    expect(sections[0].children[0].props).toEqual({ body: 'Hi' });
  });

  it('does nothing if parentId not found', () => {
    const nodes = [makeLeaf('a', 'hero')];
    const { sections } = sectionTree.insertChild(nodes, 'nonexistent', 'text', {});
    expect(sections).toHaveLength(1);
    expect(sections[0].children).toHaveLength(0);
  });

  it('supports nested containers', () => {
    const inner = makeContainer('inner', []);
    const outer = makeContainer('outer', [inner]);
    const { sections, newId } = sectionTree.insertChild([outer], 'inner', 'image', {});
    expect(sections[0].children[0].children).toHaveLength(1);
    expect(sections[0].children[0].children[0].id).toBe(newId);
  });
});

// ---------------------------------------------------------------------------
// removeNode
// ---------------------------------------------------------------------------

describe('sectionTree.removeNode', () => {
  it('removes a root-level node', () => {
    const nodes = [makeLeaf('a', 'hero', 0), makeLeaf('b', 'footer', 1)];
    const result = sectionTree.removeNode(nodes, 'a');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
    expect(result[0].order).toBe(0); // reordered
  });

  it('removes a nested node', () => {
    const child = makeLeaf('child', 'text');
    const container = makeContainer('c', [child]);
    const result = sectionTree.removeNode([container], 'child');
    expect(result[0].children).toHaveLength(0);
  });

  it('does nothing if id not found', () => {
    const nodes = [makeLeaf('a', 'hero')];
    const result = sectionTree.removeNode(nodes, 'z');
    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// moveSection
// ---------------------------------------------------------------------------

describe('sectionTree.moveSection', () => {
  it('moves forward', () => {
    const nodes = [makeLeaf('a', 'a', 0), makeLeaf('b', 'b', 1), makeLeaf('c', 'c', 2)];
    const result = sectionTree.moveSection(nodes, 0, 2);
    expect(result.map(n => n.id)).toEqual(['b', 'c', 'a']);
    expect(result.map(n => n.order)).toEqual([0, 1, 2]);
  });

  it('moves backward', () => {
    const nodes = [makeLeaf('a', 'a', 0), makeLeaf('b', 'b', 1), makeLeaf('c', 'c', 2)];
    const result = sectionTree.moveSection(nodes, 2, 0);
    expect(result.map(n => n.id)).toEqual(['c', 'a', 'b']);
  });

  it('no-op when same index', () => {
    const nodes = [makeLeaf('a', 'a', 0), makeLeaf('b', 'b', 1)];
    const result = sectionTree.moveSection(nodes, 1, 1);
    expect(result.map(n => n.id)).toEqual(['a', 'b']);
  });
});

// ---------------------------------------------------------------------------
// updateProps / replaceProps
// ---------------------------------------------------------------------------

describe('sectionTree.updateProps', () => {
  it('merges new props into existing', () => {
    const nodes = [makeLeaf('a', 'hero')];
    nodes[0] = { ...nodes[0], props: { title: 'Old', color: '#fff' } };
    const result = sectionTree.updateProps(nodes, 'a', { title: 'New' });
    expect(result[0].props).toEqual({ title: 'New', color: '#fff' });
  });

  it('updates nested node props', () => {
    const child = { ...makeLeaf('child', 'text'), props: { body: 'original' } };
    const container = makeContainer('c', [child]);
    const result = sectionTree.updateProps([container], 'child', { body: 'updated' });
    expect(result[0].children[0].props).toEqual({ body: 'updated' });
  });
});

describe('sectionTree.replaceProps', () => {
  it('replaces all props', () => {
    const nodes = [{ ...makeLeaf('a', 'hero'), props: { title: 'Old', x: 1 } }];
    const result = sectionTree.replaceProps(nodes, 'a', { title: 'New' });
    expect(result[0].props).toEqual({ title: 'New' });
    expect((result[0].props as Record<string, unknown>).x).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// toggleVisibility / toggleLock
// ---------------------------------------------------------------------------

describe('sectionTree.toggleVisibility', () => {
  it('toggles visible on root node', () => {
    const nodes = [makeLeaf('a', 'hero')];
    expect(nodes[0].visible).toBe(true);
    const r1 = sectionTree.toggleVisibility(nodes, 'a');
    expect(r1[0].visible).toBe(false);
    const r2 = sectionTree.toggleVisibility(r1, 'a');
    expect(r2[0].visible).toBe(true);
  });
});

describe('sectionTree.toggleLock', () => {
  it('toggles locked on root node', () => {
    const nodes = [makeLeaf('a', 'hero')];
    expect(nodes[0].locked).toBe(false);
    const r1 = sectionTree.toggleLock(nodes, 'a');
    expect(r1[0].locked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// duplicateNode
// ---------------------------------------------------------------------------

describe('sectionTree.duplicateNode', () => {
  it('creates a copy after the original', () => {
    const nodes = [makeLeaf('a', 'hero', 0), makeLeaf('b', 'footer', 1)];
    const { sections, newId } = sectionTree.duplicateNode(nodes, 'a');
    expect(sections).toHaveLength(3);
    expect(sections[0].id).toBe('a');
    expect(sections[1].id).toBe(newId);
    expect(sections[1].type).toBe('hero');
    expect(sections[2].id).toBe('b');
  });

  it('duplicate has a different id', () => {
    const nodes = [makeLeaf('orig', 'hero')];
    const { newId } = sectionTree.duplicateNode(nodes, 'orig');
    expect(newId).not.toBe('orig');
    expect(newId).toBeTruthy();
  });

  it('returns same sections if id not found', () => {
    const nodes = [makeLeaf('a', 'hero')];
    const { sections, newId } = sectionTree.duplicateNode(nodes, 'z');
    expect(sections).toHaveLength(1);
    expect(newId).toBe('');
  });
});

// ---------------------------------------------------------------------------
// reorderByIds
// ---------------------------------------------------------------------------

describe('sectionTree.reorderByIds', () => {
  it('reorders by provided ids', () => {
    const nodes = [makeLeaf('a', 'a', 0), makeLeaf('b', 'b', 1), makeLeaf('c', 'c', 2)];
    const result = sectionTree.reorderByIds(nodes, ['c', 'a', 'b']);
    expect(result.map(n => n.id)).toEqual(['c', 'a', 'b']);
    expect(result.map(n => n.order)).toEqual([0, 1, 2]);
  });

  it('appends nodes not mentioned in orderedIds at end', () => {
    const nodes = [makeLeaf('a', 'a', 0), makeLeaf('b', 'b', 1)];
    const result = sectionTree.reorderByIds(nodes, ['b']);
    expect(result[0].id).toBe('b');
    expect(result[1].id).toBe('a');
  });
});

// ---------------------------------------------------------------------------
// findNode
// ---------------------------------------------------------------------------

describe('findNode', () => {
  it('finds a root node', () => {
    const nodes = [makeLeaf('a', 'hero'), makeLeaf('b', 'footer')];
    const result = findNode(nodes, 'b');
    expect(result).not.toBeNull();
    expect(result!.node.id).toBe('b');
    expect(result!.path).toEqual([1]);
  });

  it('finds a nested node', () => {
    const child = makeLeaf('child', 'text');
    const container = makeContainer('c', [child]);
    const result = findNode([container], 'child');
    expect(result).not.toBeNull();
    expect(result!.node.id).toBe('child');
    expect(result!.path).toEqual([0, 0]);
  });

  it('returns null for missing id', () => {
    const nodes = [makeLeaf('a', 'hero')];
    expect(findNode(nodes, 'z')).toBeNull();
  });
});
