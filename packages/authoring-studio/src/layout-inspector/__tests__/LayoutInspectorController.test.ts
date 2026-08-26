/**
 * LayoutInspectorController.test.ts — Sprint S30 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  type BuilderDocument,
} from '../../../../builder-core/src/BuilderDocument';
import { createHistoryStack, type HistoryStack } from '../../../../builder-core/src/HistoryStack';
import { createPropertyFieldRegistry } from '../../inspector/registry/PropertyRegistry';
import {
  getLayoutFieldDefinitions,
  applyFieldChange,
  undo,
  redo,
  registerLayoutFields,
} from '../LayoutInspectorController';

const createDoc = (): BuilderDocument => {
  const node = createSectionNode({
    id: 'box-1',
    type: 'container',
    label: 'Box 1',
    props: {},
  });

  const base = createBuilderDocument({
    id: 'doc-ctrl-1',
    tenantId: 't1',
    metadata: { storeName: 'S', storeSlug: 's', locale: 'en', currency: 'USD' },
  });

  return {
    ...base,
    pages: [createBuilderPage({ id: 'p1', name: 'Home', slug: '/', sections: [node] })],
  };
};

describe('LayoutInspectorController', () => {
  it('returns field definitions and registers them into PropertyRegistry', () => {
    const defs = getLayoutFieldDefinitions();
    expect(defs.length).toBeGreaterThan(0);

    const registry = createPropertyFieldRegistry();
    const registeredCount = registerLayoutFields(registry);
    expect(registeredCount).toBe(defs.length);

    const layoutCategoryFields = registry.getFieldsByCategory('layout');
    expect(layoutCategoryFields.length).toBe(defs.length);
  });

  it('applies valid field change and pushes to HistoryStack, rejecting invalid values', () => {
    let doc = createDoc();
    let history: HistoryStack<BuilderDocument> = createHistoryStack<BuilderDocument>(50);
    history = history.push(doc, 'Initial');

    // 1. Invalid value -> rejected
    const invalidRes = applyFieldChange({ doc, history, nodeId: 'box-1', fieldId: 'layout.gap', value: -10 });
    expect(invalidRes.success).toBe(false);

    // 2. Valid value -> applied and pushed to history
    const validRes = applyFieldChange({ doc, history, nodeId: 'box-1', fieldId: 'layout.gap', value: 12 });
    expect(validRes.success).toBe(true);
    doc = validRes.doc;
    history = validRes.history;

    expect(history.canUndo).toBe(true);

    // 3. Undo
    const undoRes = undo(history);
    expect(undoRes).not.toBeNull();
    history = undoRes!.history;
    doc = undoRes!.doc;

    // 4. Redo
    const redoRes = redo(history);
    expect(redoRes).not.toBeNull();
  });
});