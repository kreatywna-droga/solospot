/**
 * LayoutInspectorModel.test.ts — Sprint S30 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  type BuilderDocument,
} from '../../../../builder-core/src/BuilderDocument';
import { findLayoutNode, readLayoutInspectorState } from '../LayoutInspectorModel';

const createTestDoc = (): BuilderDocument => {
  const container = createSectionNode({
    id: 'box-1',
    type: 'container',
    label: 'Box 1',
    props: {
      width: 800,
      height: 400,
      layoutStyle: { mode: 'auto', gap: 16, direction: 'horizontal' },
    },
  });

  const base = createBuilderDocument({
    id: 'doc-inspect-1',
    tenantId: 'tenant-1',
    metadata: { storeName: 'Store 1', storeSlug: 's1', locale: 'en', currency: 'USD' },
  });

  return {
    ...base,
    pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [container] })],
  };
};

describe('LayoutInspectorModel', () => {
  it('finds node by id recursively', () => {
    const doc = createTestDoc();
    const node = findLayoutNode(doc, 'box-1');
    expect(node).toBeDefined();
    expect(node?.id).toBe('box-1');

    const missing = findLayoutNode(doc, 'non-existent');
    expect(missing).toBeUndefined();
  });

  it('reads layout inspector state including DTOs and fieldValues', () => {
    const doc = createTestDoc();
    const state = readLayoutInspectorState(doc, 'box-1', 'desktop');

    expect(state).toBeDefined();
    expect(state?.style?.gap).toBe(16);
    expect(state?.style?.direction).toBe('horizontal');
    expect(state?.fieldValues['layout.gap']).toBe(16);
    expect(state?.effective.style.gap).toBe(16);
  });
});