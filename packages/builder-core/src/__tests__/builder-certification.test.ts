// builder-certification.test.ts
// C7.8: Builder Pro — certification tests

import { describe, it, expect } from 'vitest';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../BuilderDocument';
import { createCanvasState, reduceCanvasState, CanvasAction } from '../CanvasState';
import { createDragCommand, computeDropTarget, snapDragToGrid } from '../DragEngine';
import { createResizeCommand, constrainResize, applyAspectRatio, snapResizeToGrid } from '../ResizeEngine';
import { createAlignCommand, computeAlignment } from '../LayoutEngine';
import { createInitialSelection, reduceSelection, buildBreadcrumbs, selectParent } from '../SelectionEngine';
import { ResponsiveEngine } from '../ResponsiveEngine';
import { createBuilderUX } from '../BuilderUX';
import { KeyboardShortcutRegistry } from '../KeyboardShortcutRegistry';
import { GridSystem } from '../GridSystem';
import { sectionTree } from '../SectionTree';

(globalThis as any).KeyboardEvent = class KeyboardEvent {
  key: string;
  ctrlKey: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
  constructor(type: string, options?: any) {
    this.key = options?.key || '';
    this.ctrlKey = options?.ctrlKey || false;
    this.preventDefault = () => {};
    this.stopPropagation = () => {};
  }
};

describe('C7.1 Interaction Engine', () => {
  it('should create initial canvas state', () => {
    const state = createCanvasState();
    expect(state.mode).toBe('SELECT');
    expect(state.selectedSectionId).toBeNull();
    expect(state.zoom).toBe(1.0);
  });

  it('should handle SELECT_SECTION action', () => {
    const state = createCanvasState();
    const next = reduceCanvasState(state, {
      type: 'SELECT_SECTION',
      sectionId: 'sec-1',
    });
    expect(next.selectedSectionId).toBe('sec-1');
    expect(next.isPanelOpen).toBe(true);
  });

  it('should handle HOVER_SECTION action', () => {
    const state = createCanvasState();
    const next = reduceCanvasState(state, {
      type: 'HOVER_SECTION',
      sectionId: 'sec-1',
    });
    expect(next.hoveredSectionId).toBe('sec-1');
  });

  it('should handle BEGIN_DRAG action', () => {
    const state = createCanvasState();
    const next = reduceCanvasState(state, {
      type: 'BEGIN_DRAG',
      sectionId: 'sec-1',
      sourcePageId: 'page-1',
      sourceIndex: 0,
    });
    expect(next.mode).toBe('MOVE');
    expect(next.dragState?.isDragging).toBe(true);
  });

  it('should handle SET_VIEWPORT action', () => {
    const state = createCanvasState();
    const next = reduceCanvasState(state, {
      type: 'SET_VIEWPORT',
      viewport: { width: 375, label: 'MOBILE' },
    });
    expect(next.viewport.width).toBe(375);
  });

  it('should handle SET_GRID action', () => {
    const state = createCanvasState();
    const next = reduceCanvasState(state, {
      type: 'SET_GRID',
      grid: { columns: 12, gutter: 20, margin: 24, snapToGrid: true, showGuides: true, showRulers: false },
    });
    expect(next.grid.columns).toBe(12);
    expect(next.grid.gutter).toBe(20);
  });

  it('should handle TOGGLE_LOCK action', () => {
    const state = createCanvasState();
    const next = reduceCanvasState(state, {
      type: 'TOGGLE_LOCK',
      sectionId: 'sec-1',
    });
    expect(next.selection.lockedIds).toContain('sec-1');
  });

  it('should handle SET_BREAKPOINT action', () => {
    const state = createCanvasState();
    const next = reduceCanvasState(state, {
      type: 'SET_BREAKPOINT',
      breakpoint: 'MOBILE',
    });
    expect(next.selection.activeBreakpoint).toBe('MOBILE');
    expect(next.viewport.width).toBe(375);
  });
});

describe('C7.2 Smart Selection System', () => {
  it('should create initial selection', () => {
    const selection = createInitialSelection();
    expect(selection.selectedIds).toEqual([]);
    expect(selection.hoveredId).toBeNull();
    expect(selection.breadcrumbs).toEqual([]);
  });

  it('should reduce selection on SELECT_SECTION', () => {
    const doc = createBuilderDocument({
      id: 'doc-1',
      tenantId: 'tenant-1',
      metadata: { storeName: 'Test Store', storeSlug: 'test-store', locale: 'en', currency: 'USD' },
    });
    const page = doc.pages[0];
    const section = createSectionNode({ id: 'sec-1', type: 'hero', label: 'Hero' });
    const docWithSection = {
      ...doc,
      pages: [{ ...page, sections: [section] }],
    };

    const selection = createInitialSelection();
    const next = reduceSelection(selection, docWithSection, {
      type: 'SELECT_SECTION',
      sectionId: 'sec-1',
    });
    expect(next.selectedIds).toEqual(['sec-1']);
    expect(next.breadcrumbs.length).toBeGreaterThan(0);
  });

  it('should toggle additive selection', () => {
    const doc = createBuilderDocument({
      id: 'doc-1',
      tenantId: 'tenant-1',
      metadata: { storeName: 'Test Store', storeSlug: 'test-store', locale: 'en', currency: 'USD' },
    });
    const page = doc.pages[0];
    const section1 = createSectionNode({ id: 'sec-1', type: 'hero', label: 'Hero' });
    const section2 = createSectionNode({ id: 'sec-2', type: 'text', label: 'Text' });
    const docWithPage = { ...doc, pages: [page] };
    const docWithSections = { ...docWithPage, pages: [{ ...page, sections: [section1, section2] }] };

    const selection = createInitialSelection();
    const next1 = reduceSelection(selection, docWithSections, {
      type: 'SELECT_SECTION',
      sectionId: 'sec-1',
    });
    const next2 = reduceSelection(next1, docWithSections, {
      type: 'SELECT_SECTION',
      sectionId: 'sec-2',
      additive: true,
    });
    expect(next2.selectedIds).toEqual(['sec-1', 'sec-2']);
  });

  it('should toggle selection off on second click without additive', () => {
    const doc = createBuilderDocument({
      id: 'doc-1',
      tenantId: 'tenant-1',
      metadata: { storeName: 'Test Store', storeSlug: 'test-store', locale: 'en', currency: 'USD' },
    });
    const page = doc.pages[0];
    const section = createSectionNode({ id: 'sec-1', type: 'hero', label: 'Hero' });
    const docWithPage = { ...doc, pages: [page] };
    const docWithSection = { ...docWithPage, pages: [{ ...page, sections: [section] }] };

    const selection = createInitialSelection();
    const next1 = reduceSelection(selection, docWithSection, {
      type: 'SELECT_SECTION',
      sectionId: 'sec-1',
    });
    const next2 = reduceSelection(next1, docWithSection, {
      type: 'SELECT_SECTION',
      sectionId: 'sec-1',
    });
    expect(next2.selectedIds).toEqual([]);
  });
});

describe('C7.3 Drag & Drop Engine', () => {
  it('should create drag command', () => {
    const doc = createBuilderDocument({
      id: 'doc-1',
      tenantId: 'tenant-1',
      metadata: { storeName: 'Test Store', storeSlug: 'test-store', locale: 'en', currency: 'USD' }
    });
    const page = createBuilderPage({ id: 'page-1', slug: '/', name: 'Home' });
    const section = createSectionNode({ id: 'sec-1', type: 'hero', label: 'Hero' });
    const docWithPage = { ...doc, pages: [page] };
    const docWithSection = { ...docWithPage, pages: [{ ...page, sections: [section] }] };

    const cmd = createDragCommand({
      document: docWithSection,
      draggedIds: ['sec-1'],
      sourcePageId: 'page-1',
      sourceIndex: 0,
      targetPageId: 'page-1',
      targetIndex: 1,
    });
    expect(cmd.type).toBe('MOVE_SECTION');
    if (cmd.type === 'MOVE_SECTION') {
      expect(cmd.fromIndex).toBe(0);
      expect(cmd.toIndex).toBe(1);
    } else {
      expect.fail('Expected cmd.type to be MOVE_SECTION');
    }
  });

  it('should compute drop target', () => {
    const doc = createBuilderDocument({
      id: 'doc-1',
      tenantId: 'tenant-1',
      metadata: { storeName: 'Test Store', storeSlug: 'test-store', locale: 'en', currency: 'USD' }
    });
    const page = createBuilderPage({ id: 'page-1', slug: '/', name: 'Home' });
    const section1 = createSectionNode({ id: 'sec-1', type: 'hero', label: 'Hero' });
    const section2 = createSectionNode({ id: 'sec-2', type: 'text', label: 'Text' });
    const docWithPage = { ...doc, pages: [page] };
    const docWithSections = { ...docWithPage, pages: [{ ...page, sections: [section1, section2] }] };

    const sections = docWithSections.pages[0].sections;
    const heights = new Map([
      ['sec-1', 200],
      ['sec-2', 100],
    ]);

    expect(computeDropTarget(sections, 50, heights)).toBe(0);
    expect(computeDropTarget(sections, 250, heights)).toBe(1);
    expect(computeDropTarget(sections, 400, heights)).toBe(2);
  });
});

describe('C7.4 Resize Engine', () => {
  it('should constrain resize within bounds', () => {
    const result = constrainResize(50, 50, { width: 100, height: 100 }, { width: 500, height: 500 });
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
  });

  it('should apply aspect ratio', () => {
    const result = applyAspectRatio(200, 100, 2, 'e');
    expect(result.width).toBe(200);
    expect(result.height).toBe(100);
  });

  it('should snap resize to grid', () => {
    const grid = new GridSystem({ columns: 12, gutter: 16, margin: 24, snapToGrid: true, showGuides: false, showRulers: false });
    const result = snapResizeToGrid(123, 87, grid);
    expect(result.width).toBe(128);
    expect(result.height).toBe(80);
  });
});

describe('C7.5 Layout Engine', () => {
  it('should align sections left', () => {
    const sections = [
      { x: 50, y: 0, width: 100, height: 100 },
      { x: 200, y: 0, width: 100, height: 100 },
    ];
    const result = computeAlignment(sections, 'LEFT');
    expect(result[0].x).toBe(0);
    expect(result[1].x).toBe(0);
  });

  it('should distribute sections horizontally', () => {
    const sections = [
      { x: 0, y: 0, width: 20, height: 100 },
      { x: 0, y: 0, width: 20, height: 100 },
    ];
    const result = computeAlignment(sections, 'DISTRIBUTE_HORIZONTAL');
    expect(result[0].x).toBe(0);
    expect(result[1].x).toBeGreaterThan(0);
  });

  it('should equalize height', () => {
    const sections = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 0, y: 0, width: 100, height: 200 },
    ];
    const result = computeAlignment(sections, 'EQUAL_HEIGHT');
    expect(result[0].height).toBe(200);
    expect(result[1].height).toBe(200);
  });
});

describe('C7.6 Responsive Engine', () => {
  it('should set and get breakpoint', () => {
    const engine = new ResponsiveEngine();
    engine.setBreakpoint('MOBILE');
    expect(engine.getActiveBreakpoint()).toBe('MOBILE');
  });

  it('should return effective props with breakpoint override', () => {
    const engine = new ResponsiveEngine();
    engine.setBreakpoint('MOBILE');
    const effective = engine.getEffectiveProps('sec-1', { fontSize: 16, color: '#000' }, {
      'sec-1': { fontSize: { mobile: 14 } },
    });
    expect(effective.fontSize).toBe(14);
    expect(effective.color).toBe('#000');
  });

  it('should not override props without breakpoint value', () => {
    const engine = new ResponsiveEngine();
    engine.setBreakpoint('TABLET');
    const effective = engine.getEffectiveProps('sec-1', { fontSize: 16, color: '#000' }, {
      'sec-1': { fontSize: { mobile: 14 } },
    });
    expect(effective.fontSize).toBe(16);
    expect(effective.color).toBe('#000');
  });
});

describe('C7.7 Builder UX', () => {
  it('should create builder UX with keyboard shortcuts', () => {
    const { registry } = createBuilderUX();
    const shortcuts = registry.getRegisteredShortcuts();
    expect(shortcuts.length).toBeGreaterThan(0);
    expect(shortcuts.some(s => s.key === 'z' && s.modifiers?.ctrl)).toBe(true);
  });

  it('should handle keyboard shortcut', () => {
    const { registry } = createBuilderUX();
    let called = false;
    registry.register({
      key: 'x',
      modifiers: { ctrl: true },
      action: () => { called = true; },
      description: 'Test',
    });
    registry.handleKeyDown(new KeyboardEvent('keydown', { key: 'x', ctrlKey: true }));
    expect(called).toBe(true);
  });

  it('should not trigger shortcut without modifiers', () => {
    const { registry } = createBuilderUX();
    let called = false;
    registry.register({
      key: 'x',
      modifiers: { ctrl: true },
      action: () => { called = true; },
      description: 'Test',
    });
    registry.handleKeyDown(new KeyboardEvent('keydown', { key: 'x' }));
    expect(called).toBe(false);
  });
});

describe('C7.8 Performance', () => {
  it('should compute drop target in < 1ms for 100 sections', () => {
    const sections = Array.from({ length: 100 }, (_, i) =>
      createSectionNode({ id: `sec-${i}`, type: 'text', label: `Section ${i}` })
    );
    const heights = new Map(sections.map(s => [s.id, 100]));

    const start = performance.now();
    computeDropTarget(sections, 5000, heights);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1);
  });

  it('should constrain resize in < 0.1ms', () => {
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      constrainResize(200, 200, { width: 100, height: 100 }, { width: 2000, height: 2000 });
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
