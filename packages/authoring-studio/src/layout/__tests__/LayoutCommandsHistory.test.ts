/**
 * LayoutCommandsHistory.test.ts — Sprint S29
 *
 * Verifies layout commands integrate with the REAL createHistoryStack<BuilderDocument>
 * (push → execute → undo → redo), following the S28 command pattern. S29 introduces
 * NO second history stack.
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  type BuilderDocument,
  type SectionNode,
} from '../../../../builder-core/src/BuilderDocument';
import { createHistoryStack, type HistoryStack } from '../../../../builder-core/src/HistoryStack';
import {
  SetLayoutStyleCommand,
  SetLayoutConstraintCommand,
  RemoveLayoutConstraintCommand,
  readLayoutStyle,
  readLayoutConstraints,
} from '../LayoutCommands';

function createDoc(): BuilderDocument {
  const section = createSectionNode({
    id: 'box',
    type: 'section',
    label: 'Box',
    order: 0,
    props: { width: 300, height: 120 },
  });
  const base = createBuilderDocument({
    id: 'cmd-doc',
    tenantId: 't',
    metadata: { storeName: 'Cmd', storeSlug: 'cmd', locale: 'en', currency: 'USD' },
  });
  return {
    ...base,
    pages: [createBuilderPage({ id: 'p', name: 'P', slug: '/', sections: [section] })],
  };
}

function getBox(doc: BuilderDocument): SectionNode {
  return doc.pages[0].sections[0] as SectionNode;
}

describe('LayoutCommands & History Integration', () => {
  it('setStyle → push → undo → redo round-trips through HistoryStack', () => {
    let doc = createDoc();
    let history: HistoryStack<BuilderDocument> = createHistoryStack<BuilderDocument>(50);
    history = history.push(doc, 'Initial');

    const cmd = new SetLayoutStyleCommand('box', { direction: 'horizontal', gap: 8 });
    doc = cmd.execute(doc);
    history = history.push(doc, cmd.name);

    expect(readLayoutStyle(getBox(doc))?.direction).toBe('horizontal');
    expect(readLayoutStyle(getBox(doc))?.gap).toBe(8);
    expect(history.canUndo).toBe(true);

    // Undo → style command reverted
    const undoRes = history.undo();
    expect(undoRes).not.toBeNull();
    history = undoRes!.stack;
    doc = undoRes!.state;
    expect(readLayoutStyle(getBox(doc))).toBeUndefined();

    // Redo → style restored
    const redoRes = history.redo();
    expect(redoRes).not.toBeNull();
    history = redoRes!.stack;
    doc = redoRes!.state;
    expect(readLayoutStyle(getBox(doc))?.gap).toBe(8);
  });

  it('setConstraint → push → undo → redo round-trips through HistoryStack', () => {
    let doc = createDoc();
    let history: HistoryStack<BuilderDocument> = createHistoryStack<BuilderDocument>(50);
    history = history.push(doc, 'Initial');

    const cmd = new SetLayoutConstraintCommand('box', { minWidth: 160, aspectRatio: 2 });
    doc = cmd.execute(doc);
    history = history.push(doc, cmd.name);

    expect(readLayoutConstraints(getBox(doc))?.minWidth).toBe(160);

    const undoRes = history.undo();
    expect(undoRes).not.toBeNull();
    history = undoRes!.stack;
    doc = undoRes!.state;
    expect(readLayoutConstraints(getBox(doc))).toBeUndefined();

    const redoRes = history.redo();
    expect(redoRes).not.toBeNull();
    history = redoRes!.stack;
    doc = redoRes!.state;
    expect(readLayoutConstraints(getBox(doc))?.aspectRatio).toBe(2);
  });

  it('removeConstraint → push → undo → redo round-trips through HistoryStack', () => {
    let doc = createDoc();
    let history: HistoryStack<BuilderDocument> = createHistoryStack<BuilderDocument>(50);

    const setup = new SetLayoutConstraintCommand('box', { minWidth: 120 });
    doc = setup.execute(doc);
    history = history.push(doc, setup.name);
    expect(readLayoutConstraints(getBox(doc))?.minWidth).toBe(120);

    const remove = new RemoveLayoutConstraintCommand('box', 'minWidth');
    doc = remove.execute(doc);
    history = history.push(doc, remove.name);
    expect(readLayoutConstraints(getBox(doc))?.minWidth).toBeUndefined();

    // Undo the removal → minWidth restored (120)
    const undoRes = history.undo();
    expect(undoRes).not.toBeNull();
    history = undoRes!.stack;
    doc = undoRes!.state;
    expect(readLayoutConstraints(getBox(doc))?.minWidth).toBe(120);

    // Redo the removal → minWidth gone again
    const redoRes = history.redo();
    expect(redoRes).not.toBeNull();
    history = redoRes!.stack;
    doc = redoRes!.state;
    expect(readLayoutConstraints(getBox(doc))?.minWidth).toBeUndefined();
  });

  it('never removes the sizing structural key', () => {
    let doc = createDoc();
    const setup = new SetLayoutConstraintCommand('box', { sizing: { width: 'fill' } });
    doc = setup.execute(doc);
    const before = readLayoutConstraints(getBox(doc))!;

    // 'sizing' is not in the removable key set, but a safe remove of another key keeps it
    const remove = new RemoveLayoutConstraintCommand('box', 'minWidth');
    doc = remove.execute(doc);
    const after = readLayoutConstraints(getBox(doc))!;
    expect(before.sizing.width).toBe('fill');
    expect(after.sizing.width).toBe('fill');
  });
});