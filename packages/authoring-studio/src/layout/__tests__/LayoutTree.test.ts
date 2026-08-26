/**
 * LayoutTree.test.ts — Sprint S29
 *
 * Recursive whole-document resolution: page → section → nested children,
 * responsive breakpoint selection and determinism.
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  type BuilderDocument,
  type SectionNode,
} from '../../../../builder-core/src/BuilderDocument';
import { resolveLayout } from '../LayoutTree';

function buildSection(id: string, props: Record<string, unknown>, children: SectionNode[] = []): SectionNode {
  const node = createSectionNode({ id, type: 'section', label: id, order: 0, props });
  if (children.length > 0) {
    node.children = children;
  }
  return node;
}

function createDoc(): BuilderDocument {
  const root = buildSection(
    'root',
    {
      layoutStyle: { direction: 'vertical', gap: 12 },
      layoutConstraints: { width: 400 },
    },
    [
      buildSection('c1', {
        layoutConstraints: { width: 100, height: 80 },
      }),
      buildSection('c2', {
        layoutConstraints: { width: 100, height: 80 },
      }),
      buildSection('hidden-node', {
        display: 'none',
        layoutConstraints: { width: 100, height: 80 },
      }),
    ]
  );

  const base = createBuilderDocument({
    id: 'tree-doc',
    tenantId: 'tenant',
    metadata: { storeName: 'Tree', storeSlug: 'tree', locale: 'en', currency: 'USD' },
  });

  return {
    ...base,
    pages: [
      createBuilderPage({ id: 'p1', name: 'Landing', slug: '/', isHome: true, sections: [root] }),
    ],
  };
}

describe('LayoutTree', () => {
  it('resolves the page container, sections and nested children recursively', () => {
    const resolution = resolveLayout(createDoc(), 1440);

    expect(resolution.breakpointId).toBe('desktop');
    expect(resolution.viewportWidthPx).toBe(1440);
    expect(resolution.pages).toHaveLength(1);

    const page = resolution.pages[0];
    expect(page.name).toBe('Landing');
    expect(page.rect).toEqual({ x: 0, y: 0, width: 1440, height: 900 });

    const root = page.sections[0];
    expect(root.nodeId).toBe('root');
    expect(root.rect).toEqual({ x: 0, y: 0, width: 400, height: 172 });

    expect(root.children).toHaveLength(3);
    expect(root.children[0].rect).toEqual({ x: 0, y: 0, width: 100, height: 80 });
    expect(root.children[1].rect).toEqual({ x: 0, y: 92, width: 100, height: 80 });
  });

  it('resolves nested grandchildren inside their parent container', () => {
    const doc = createDoc();
    const section = buildSection(
      'outer',
      {
        layoutStyle: { direction: 'vertical' },
        layoutConstraints: { width: 200 },
      },
      [
        buildSection('inner', { layoutConstraints: { width: 40, height: 40 } }, [
          buildSection('deep', { layoutConstraints: { width: 20, height: 20 } }),
        ]),
      ]
    );
    const base = createBuilderDocument({
      id: 'tree-doc-2',
      tenantId: 't',
      metadata: { storeName: 'N', storeSlug: 'n', locale: 'en', currency: 'USD' },
    });
    const nestedDoc = { ...base, pages: [createBuilderPage({ id: 'p', name: 'P', slug: '/', sections: [section] })] };

    const resolution = resolveLayout(nestedDoc, 768);
    expect(resolution.breakpointId).toBe('tablet');

    const outer = resolution.pages[0].sections[0];
    const inner = outer.children[0];
    const deep = inner.children[0];
    expect(deep.nodeId).toBe('deep');
    expect(deep.rect).toEqual({ x: 0, y: 0, width: 20, height: 20 });
  });

  it('marks nodes excluded by effective display none with a zero rect', () => {
    const resolution = resolveLayout(createDoc(), 1440);
    const hidden = resolution.pages[0].sections[0].children[2];
    expect(hidden.nodeId).toBe('hidden-node');
    expect(hidden.rect).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    expect(hidden.children).toHaveLength(0);
  });

  it('selects the correct breakpoint per viewport width', () => {
    const doc = createDoc();
    expect(resolveLayout(doc, 1440).breakpointId).toBe('desktop');
    expect(resolveLayout(doc, 1024).breakpointId).toBe('laptop');
    expect(resolveLayout(doc, 768).breakpointId).toBe('tablet');
    expect(resolveLayout(doc, 400).breakpointId).toBe('mobile');
    expect(resolveLayout(doc, 330).breakpointId).toBe('mobile_small');
  });

  it('is deterministic for identical documents and viewports', () => {
    const doc = createDoc();
    const a = resolveLayout(doc, 1440);
    const b = resolveLayout(doc, 1440);
    expect(a).toEqual(b);
  });
});