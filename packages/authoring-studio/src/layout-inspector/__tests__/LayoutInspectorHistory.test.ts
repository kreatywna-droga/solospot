/**
 * LayoutInspectorHistory.test.ts — Sprint S30
 *
 * Verifies the S30 controller consistently uses the EXISTING
 * createHistoryStack<BuilderDocument> — no S30-owned history ingest, no redo
 * future corruption, and responsive + DTO operations preserve undoability.
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  type BuilderDocument,
} from '../../../../builder-core/src/BuilderDocument';
import { createHistoryStack, type HistoryStack } from '../../../../builder-core/src/HistoryStack';
import { applyFieldChange, undoChange, redoChange } from '../LayoutInspectorController';
import { readLayoutStyle } from '../../layout/LayoutCommands';
import { getNodeResponsiveOverrides } from '../../responsive/ResponsiveOverrideEngine';

function buildDoc(): { doc: BuilderDocument; history: HistoryStack<BuilderDocument> } {
  const section = createSectionNode({ id: 'box', type: 'container', label: 'Box', order: 0, props: {} });
  const base = createBuilderDocument({
    id: 'hist-doc',
    tenantId: 't',
    metadata: { storeName: 'Hist', storeSlug: 'hist', locale: 'en', currency: 'USD' },
  });
  const doc: BuilderDocument = {
    ...base,
    pages: [createBuilderPage({ id: 'p', name: 'P', slug: '/', sections: [section] })],
  };
  return { doc, history: createHistoryStack<BuilderDocument>(50) };
}

describe('S30 Layout Inspector History', () => {
  it('base + responsive changes are all undoable through the real stack', () => {
    let { doc, history } = buildDoc();
    history = history.push(doc, 'Initial');

    const base = applyFieldChange({ doc, history, nodeId: 'box', fieldId: 'gap', value: 10 });
    doc = base.doc;
    history = base.history;

    const mobile = applyFieldChange({ doc, history, nodeId: 'box', fieldId: 'gap', value: 2, breakpointId: 'mobile' });
    doc = mobile.doc;
    history = mobile.history;

    expect(readLayoutStyle(doc.pages[0].sections[0])?.gap).toBe(10);
    expect(getNodeResponsiveOverrides(doc.pages[0].sections[0]).mobile?.gap).toBe(2);
    expect(history.canUndo).toBe(true);

    // undo responsive override only
    const u1 = undoChange(history, doc);
    history = u1!.history;
    doc = u1!.doc;
    expect(readLayoutStyle(doc.pages[0].sections[0])?.gap).toBe(10);
    expect(getNodeResponsiveOverrides(doc.pages[0].sections[0]).mobile).toBeUndefined();

    // undo base DTO write
    const u2 = undoChange(history, doc);
    history = u2!.history;
    doc = u2!.doc;
    expect(readLayoutStyle(doc.pages[0].sections[0])).toBeUndefined();

    // redo both
    const r1 = redoChange(history, doc);
    history = r1!.history;
    doc = r1!.doc;
    expect(readLayoutStyle(doc.pages[0].sections[0])?.gap).toBe(10);

    const r2 = redoChange(history, doc);
    history = r2!.history;
    doc = r2!.doc;
    expect(getNodeResponsiveOverrides(doc.pages[0].sections[0]).mobile?.gap).toBe(2);
  });

  it('redo future is discarded when a new change is applied after undo', () => {
    let { doc, history } = buildDoc();
    history = history.push(doc, 'Initial');

    const first = applyFieldChange({ doc, history, nodeId: 'box', fieldId: 'gap', value: 5 });
    doc = first.doc;
    history = first.history;

    const undone = undoChange(history, doc);
    history = undone!.history;
    doc = undone!.doc;
    expect(history.canRedo).toBe(true);

    // apply a NEW change → discards redo future (standard editor behaviour)
    const fresh = applyFieldChange({ doc, history, nodeId: 'box', fieldId: 'gap', value: 9 });
    doc = fresh.doc;
    history = fresh.history;
    expect(history.canRedo).toBe(false);
    expect(readLayoutStyle(doc.pages[0].sections[0])?.gap).toBe(9);
  });

  it('undo returns null at the beginning of history', () => {
    const { doc, history } = buildDoc();
    const result = undoChange(history, doc);
    expect(result).toBeNull();
  });

  it('SSOT integrity is preserved across undo/redo', () => {
    let { doc, history } = buildDoc();
    history = history.push(doc, 'Initial');

    const first = applyFieldChange({ doc, history, nodeId: 'box', fieldId: 'sizingWidth', value: 'fill' });
    doc = first.doc;
    history = first.history;
    const versionAfterWrite = doc.version;

    const undone = undoChange(history, doc);
    doc = undone!.doc;
    history = undone!.history;
    expect(doc.version).toBe(1);
    expect(doc.isDirty).toBe(false);

    const redone = redoChange(history, doc);
    doc = redone!.doc;
    history = redone!.history;
    expect(doc.version).toBe(versionAfterWrite);
    expect(doc.isDirty).toBe(true);
    expect(doc.id).toBe('hist-doc');
    expect(doc.pages).toHaveLength(1);
  });
});