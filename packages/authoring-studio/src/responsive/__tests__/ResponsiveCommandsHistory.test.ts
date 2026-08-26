/**
 * ResponsiveCommandsHistory.test.ts — Sprint S28
 *
 * Integration tests verifying HistoryStack<BuilderDocument> compatibility
 * for undoing and redoing per-breakpoint node property overrides.
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
  SetBreakpointOverrideCommand,
  RemoveBreakpointOverrideCommand,
} from '../ResponsiveCommands';
import { resolveEffectiveNodeProperty } from '../ResponsiveOverrideEngine';

const createSampleDocument = (): BuilderDocument => {
  const doc = createBuilderDocument({
    id: 'doc-resp-1',
    tenantId: 'tenant-1',
    metadata: { storeName: 'Test Responsive Store', storeSlug: 'test', locale: 'en', currency: 'USD' },
  });

  const section = createSectionNode({
    id: 'hero-box',
    type: 'section',
    label: 'Hero Box',
    order: 1,
    props: {
      width: 1200,
      fontSize: 32,
    },
  });

  const page = createBuilderPage({
    id: 'page-1',
    name: 'Home',
    slug: '/',
    isHome: true,
    sections: [section],
  });

  return {
    ...doc,
    pages: [page],
  };
};

function getHeroNode(doc: BuilderDocument): SectionNode {
  return doc.pages[0].sections[0] as SectionNode;
}

describe('ResponsiveCommands & History Stack Integration', () => {
  it('executes, pushes to HistoryStack<BuilderDocument>, undoes, and redoes SetBreakpointOverrideCommand', () => {
    let doc = createSampleDocument();
    let history: HistoryStack<BuilderDocument> = createHistoryStack<BuilderDocument>(50);

    // Initial state pushed to history stack
    history = history.push(doc, 'Initial Document');
    expect(history.canUndo).toBe(false);

    const heroInitial = getHeroNode(doc);
    expect(resolveEffectiveNodeProperty(heroInitial, 'fontSize', 'desktop')).toBe(32);
    expect(resolveEffectiveNodeProperty(heroInitial, 'fontSize', 'mobile')).toBe(32);

    // 1. Execute Command and push updated document state to HistoryStack
    const setCmd = new SetBreakpointOverrideCommand('hero-box', 'mobile', { fontSize: 18 });
    doc = setCmd.execute(doc);
    history = history.push(doc, setCmd.name);

    expect(history.canUndo).toBe(true);
    const heroAfterExec = getHeroNode(doc);
    expect(resolveEffectiveNodeProperty(heroAfterExec, 'fontSize', 'desktop')).toBe(32);
    expect(resolveEffectiveNodeProperty(heroAfterExec, 'fontSize', 'mobile')).toBe(18);

    // 2. Undo step via HistoryStack
    const undoRes = history.undo();
    expect(undoRes).not.toBeNull();
    history = undoRes!.stack;
    doc = undoRes!.state;

    const heroAfterUndo = getHeroNode(doc);
    expect(resolveEffectiveNodeProperty(heroAfterUndo, 'fontSize', 'mobile')).toBe(32);

    // 3. Redo step via HistoryStack
    const redoRes = history.redo();
    expect(redoRes).not.toBeNull();
    history = redoRes!.stack;
    doc = redoRes!.state;

    const heroAfterRedo = getHeroNode(doc);
    expect(resolveEffectiveNodeProperty(heroAfterRedo, 'fontSize', 'mobile')).toBe(18);
  });

  it('executes, pushes to HistoryStack<BuilderDocument>, undoes, and redoes RemoveBreakpointOverrideCommand', () => {
    let doc = createSampleDocument();
    let history: HistoryStack<BuilderDocument> = createHistoryStack<BuilderDocument>(50);
    history = history.push(doc, 'Initial Document');

    // Setup initial override
    const setupCmd = new SetBreakpointOverrideCommand('hero-box', 'tablet', { width: 768 });
    doc = setupCmd.execute(doc);
    history = history.push(doc, setupCmd.name);
    expect(resolveEffectiveNodeProperty(getHeroNode(doc), 'width', 'tablet')).toBe(768);

    // 1. Remove override & push state to HistoryStack
    const removeCmd = new RemoveBreakpointOverrideCommand('hero-box', 'tablet');
    doc = removeCmd.execute(doc);
    history = history.push(doc, removeCmd.name);
    expect(resolveEffectiveNodeProperty(getHeroNode(doc), 'width', 'tablet')).toBe(1200); // base fallback

    // 2. Undo remove override via HistoryStack
    const undoRes = history.undo();
    expect(undoRes).not.toBeNull();
    history = undoRes!.stack;
    doc = undoRes!.state;
    expect(resolveEffectiveNodeProperty(getHeroNode(doc), 'width', 'tablet')).toBe(768);

    // 3. Redo remove override via HistoryStack
    const redoRes = history.redo();
    expect(redoRes).not.toBeNull();
    history = redoRes!.stack;
    doc = redoRes!.state;
    expect(resolveEffectiveNodeProperty(getHeroNode(doc), 'width', 'tablet')).toBe(1200);
  });
});
