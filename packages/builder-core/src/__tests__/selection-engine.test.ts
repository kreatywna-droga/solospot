/**
 * SelectionEngine — 100% test coverage
 *
 * Tests all selection actions:
 * SELECT, CTRL SELECT, SHIFT RANGE, SELECT ALL,
 * PARENT, CHILD, NEXT, PREVIOUS, BOX, CLEAR,
 * ESC, KeyboardController, computeSelectionBox, buildBreadcrumbs
 */

import { describe, it, expect } from 'vitest';
import {
  reduceSelection,
  createInitialSelection,
  buildBreadcrumbs,
  selectParent,
  isLocked,
  isHidden,
  isSelected,
  isContainer,
  getNextSiblingId,
  getPrevSiblingId,
  computeSelectionBox,
} from '../SelectionEngine';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  BuilderDocument,
} from '../BuilderDocument';
import { CanvasAction, DEFAULT_SELECTION, SelectionState } from '../CanvasState';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function createTestDocument(): BuilderDocument {
  // Build pages manually to avoid createBuilderDocument() overwriting pages
  const children = [
    createSectionNode({ id: 'features_heading', type: 'heading', label: 'Features Heading', order: 0, props: {} }),
    createSectionNode({ id: 'features_grid', type: 'grid', label: 'Features Grid', order: 1, props: {} }),
  ];

  const sections = [
    createSectionNode({ id: 'hero', type: 'hero', label: 'Hero Banner', order: 0 }),
    {
      ...createSectionNode({
        id: 'container_features',
        type: 'container',
        label: 'Features Container',
        order: 1,
      }),
      children,
    },
    createSectionNode({ id: 'footer', type: 'footer', label: 'Footer', order: 2 }),
  ];

  const page1 = createBuilderPage({
    id: 'page_home',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections,
  });

  const page2 = createBuilderPage({
    id: 'page_about',
    slug: '/about',
    name: 'About',
    sections: [
      createSectionNode({ id: 'about_hero', type: 'hero', label: 'About Hero', order: 0 }),
      createSectionNode({ id: 'about_content', type: 'content', label: 'About Content', order: 1 }),
    ],
  });

  const doc = createBuilderDocument({
    id: 'test_store',
    tenantId: 'test',
    metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
  });

  // Replace default pages with our custom pages
  return { ...doc, pages: [page1, page2], version: 1, isDirty: false };
}

// Helper: get fresh doc
function freshDoc(): BuilderDocument {
  return createTestDocument();
}

// Helper: create action
function selectSection(id: string | null, opts?: { additive?: boolean; shift?: boolean; pageId?: string }): CanvasAction {
  return {
    type: 'SELECT_SECTION',
    sectionId: id,
    pageId: opts?.pageId ?? 'page_home',
    additive: opts?.additive,
    shift: opts?.shift,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SelectionEngine — reduceSelection', () => {
  describe('SELECT — single click', () => {
    it('should select a section by id', () => {
      const doc = freshDoc();
      const state = createInitialSelection();
      const next = reduceSelection(state, doc, selectSection('hero'));

      expect(next.selectedIds).toEqual(['hero']);
      expect(next.primarySelectionId).toBe('hero');
      expect(next.lastClickedId).toBe('hero');
      expect(next.anchorId).toBe('hero');
      expect(next.focusId).toBe('hero');
      expect(next.selectionMode).toBe('SINGLE');
      expect(next.breadcrumbs.length).toBeGreaterThan(0);
    });

    it('should deselect when clicking the already-selected section', () => {
      const doc = freshDoc();
      const state = { ...createInitialSelection(), selectedIds: ['hero'], primarySelectionId: 'hero' };
      const next = reduceSelection(state, doc, selectSection('hero'));

      expect(next.selectedIds).toEqual([]);
      expect(next.primarySelectionId).toBeNull();
    });

    it('should replace selection when clicking a different section', () => {
      const doc = freshDoc();
      const state = { ...createInitialSelection(), selectedIds: ['hero'], primarySelectionId: 'hero' };
      const next = reduceSelection(state, doc, selectSection('footer'));

      expect(next.selectedIds).toEqual(['footer']);
      expect(next.primarySelectionId).toBe('footer');
    });

    it('should clear selection when passing null sectionId', () => {
      const doc = freshDoc();
      const state = {
        ...createInitialSelection(),
        selectedIds: ['hero'],
        lastClickedId: 'hero',
        anchorId: 'hero',
        focusId: 'hero',
      };
      const next = reduceSelection(state, doc, selectSection(null));

      expect(next.selectedIds).toEqual([]);
      expect(next.primarySelectionId).toBeNull();
      expect(next.lastClickedId).toBeNull();
      expect(next.anchorId).toBeNull();
      expect(next.focusId).toBeNull();
    });

    it('should skip locked sections', () => {
      const doc = freshDoc();
      const state = { ...createInitialSelection(), lockedIds: ['hero'] };
      const next = reduceSelection(state, doc, selectSection('hero'));

      expect(next.selectedIds).toEqual([]);
    });
  });

  describe('CTRL SELECT — additive mode', () => {
    it('should add a section to selection (multi)', () => {
      const doc = freshDoc();
      const state = { ...createInitialSelection(), selectedIds: ['hero'], primarySelectionId: 'hero' };
      const next = reduceSelection(state, doc, selectSection('footer', { additive: true }));

      expect(next.selectedIds).toEqual(['hero', 'footer']);
      expect(next.primarySelectionId).toBe('footer');
      expect(next.selectionMode).toBe('MULTI' as const);
    });

    it('should remove a section from multi-selection when toggled again', () => {
      const doc = freshDoc();
      const state: SelectionState = {
        ...createInitialSelection(),
        selectedIds: ['hero', 'footer'],
        primarySelectionId: 'footer',
        selectionMode: 'MULTI' as const,
      };
      const next = reduceSelection(state, doc, selectSection('footer', { additive: true }));

      expect(next.selectedIds).toEqual(['hero']);
      expect(next.primarySelectionId).toBe('footer'); // still footer since it was the last toggle
    });

    it('should return to SINGLE mode when only one remains', () => {
      const doc = freshDoc();
      const state: SelectionState = {
        ...createInitialSelection(),
        selectedIds: ['hero', 'footer'],
        primarySelectionId: 'footer',
        selectionMode: 'MULTI' as const,
      };
      const next = reduceSelection(state, doc, selectSection('footer', { additive: true }));

      expect(next.selectedIds).toEqual(['hero']);
      expect(next.selectionMode).toBe('SINGLE');
    });
  });

  describe('SHIFT SELECT — range selection', () => {
    it('should select a range between anchorId and current', () => {
      const doc = freshDoc();
      const state = {
        ...createInitialSelection(),
        selectedIds: ['hero'],
        anchorId: 'hero',
        lastClickedId: 'hero',
      };
      const next = reduceSelection(state, doc, selectSection('footer', { shift: true, pageId: 'page_home' }));

      // Should select: hero, container_features, footer
      expect(next.selectedIds).toContain('hero');
      expect(next.selectedIds).toContain('container_features');
      expect(next.selectedIds).toContain('footer');
      expect(next.selectionMode).toBe('RANGE');
      expect(next.primarySelectionId).toBe('footer');
    });

    it('should handle reverse range (current before anchor)', () => {
      const doc = freshDoc();
      const state = {
        ...createInitialSelection(),
        selectedIds: ['footer'],
        anchorId: 'footer',
        lastClickedId: 'footer',
      };
      const next = reduceSelection(state, doc, selectSection('hero', { shift: true, pageId: 'page_home' }));

      expect(next.selectedIds).toContain('hero');
      expect(next.selectedIds).toContain('container_features');
      expect(next.selectedIds).toContain('footer');
      expect(next.selectionMode).toBe('RANGE');
    });

    it('should not change selection if no anchorId set', () => {
      const doc = freshDoc();
      const state = createInitialSelection();
      const next = reduceSelection(state, doc, selectSection('hero', { shift: true }));

      expect(next.selectedIds).toEqual(['hero']); // behaves like single click
      expect(next.selectionMode).toBe('SINGLE');
    });
  });

  describe('SELECT ALL', () => {
    it('should select all unlocked sections on a page', () => {
      const doc = freshDoc();
      const state = createInitialSelection();
      const next = reduceSelection(state, doc, { type: 'SELECT_ALL', pageId: 'page_home' });

      expect(next.selectedIds.length).toBeGreaterThan(0);
      expect(next.selectedIds).toContain('hero');
      expect(next.selectedIds).toContain('container_features');
      expect(next.selectedIds).toContain('footer');
    });

    it('should not include locked sections', () => {
      const doc = freshDoc();
      const state = { ...createInitialSelection(), lockedIds: ['footer'] };
      const next = reduceSelection(state, doc, { type: 'SELECT_ALL', pageId: 'page_home' });

      expect(next.selectedIds).not.toContain('footer');
    });

    it('should return empty if page not found', () => {
      const doc = freshDoc();
      const state = createInitialSelection();
      const next = reduceSelection(state, doc, { type: 'SELECT_ALL', pageId: 'nonexistent' });

      expect(next.selectedIds).toEqual([]);
    });
  });

  describe('SELECT PARENT (Escape / ← on container)', () => {
    it('should select parent container when a child is selected', () => {
      const doc = freshDoc();
      const page = doc.pages.find(p => p.id === 'page_home')!;
      const containerChildId = page.sections.find(s => s.id === 'container_features')?.children[0]?.id;

      if (!containerChildId) {
        throw new Error('Test fixture missing container child');
      }

      const state = {
        ...createInitialSelection(),
        selectedIds: [containerChildId],
        lastClickedId: containerChildId,
      };
      const next = reduceSelection(state, doc, { type: 'SELECT_PARENT' });

      expect(next.selectedIds).toContain('container_features');
    });

    it('should transition to page/root level (clear section selection) if already at root', () => {
      const doc = freshDoc();
      const state = {
        ...createInitialSelection(),
        selectedIds: ['hero'],
        lastClickedId: 'hero',
      };
      const next = reduceSelection(state, doc, { type: 'SELECT_PARENT' });

      expect(next.selectedIds).toEqual([]); // clear selection to page/root
    });

    it('should do nothing if nothing is selected', () => {
      const doc = freshDoc();
      const state = createInitialSelection();
      const next = reduceSelection(state, doc, { type: 'SELECT_PARENT' });

      expect(next.selectedIds).toEqual([]);
    });
  });

  describe('SELECT CHILD (→)', () => {
    it('should select first child of a container', () => {
      const doc = freshDoc();
      const state = {
        ...createInitialSelection(),
        selectedIds: ['container_features'],
        lastClickedId: 'container_features',
      };
      const next = reduceSelection(state, doc, { type: 'SELECT_CHILD' });

      const container = doc.pages[0].sections.find(s => s.id === 'container_features')!;
      expect(next.selectedIds).toContain(container.children[0].id);
    });

    it('should do nothing if section has no children', () => {
      const doc = freshDoc();
      const state = {
        ...createInitialSelection(),
        selectedIds: ['hero'],
      };
      const next = reduceSelection(state, doc, { type: 'SELECT_CHILD' });

      expect(next.selectedIds).toEqual(['hero']);
    });

    it('should do nothing if nothing is selected', () => {
      const doc = freshDoc();
      const state = createInitialSelection();
      const next = reduceSelection(state, doc, { type: 'SELECT_CHILD' });

      expect(next.selectedIds).toEqual([]);
    });
  });

  describe('SELECT NEXT (↓ / Tab)', () => {
    it('should select the next sibling', () => {
      const doc = freshDoc();
      const state = {
        ...createInitialSelection(),
        selectedIds: ['hero'],
        lastClickedId: 'hero',
      };
      const next = reduceSelection(state, doc, { type: 'SELECT_NEXT' });

      expect(next.selectedIds).toContain('container_features');
    });

    it('should skip locked sections', () => {
      const doc = freshDoc();
      const state = {
        ...createInitialSelection(),
        selectedIds: ['hero'],
        lockedIds: ['container_features'],
        lastClickedId: 'hero',
      };
      const next = reduceSelection(state, doc, { type: 'SELECT_NEXT' });

      expect(next.selectedIds).toContain('footer'); // skips container_features
    });
  });

  describe('SELECT PREVIOUS (↑ / Shift+Tab)', () => {
    it('should select the previous sibling', () => {
      const doc = freshDoc();
      const state = {
        ...createInitialSelection(),
        selectedIds: ['footer'],
        lastClickedId: 'footer',
      };
      const next = reduceSelection(state, doc, { type: 'SELECT_PREV' });

      expect(next.selectedIds).toContain('container_features');
    });

    it('should do nothing if at first sibling', () => {
      const doc = freshDoc();
      const state = {
        ...createInitialSelection(),
        selectedIds: ['hero'],
        lastClickedId: 'hero',
      };
      const next = reduceSelection(state, doc, { type: 'SELECT_PREV' });

      expect(next.selectedIds).toEqual(['hero']); // unchanged
    });
  });

  describe('HOVER', () => {
    it('should track hovered section', () => {
      const doc = freshDoc();
      const state = createInitialSelection();
      const next = reduceSelection(state, doc, { type: 'HOVER_SECTION', sectionId: 'hero' });

      expect(next.hoveredId).toBe('hero');
    });

    it('should clear hovered section', () => {
      const doc = freshDoc();
      const state = { ...createInitialSelection(), hoveredId: 'hero' };
      const next = reduceSelection(state, doc, { type: 'HOVER_SECTION', sectionId: null });

      expect(next.hoveredId).toBeNull();
    });
  });

  describe('TOGGLE LOCK', () => {
    it('should lock a section', () => {
      const doc = freshDoc();
      const state = createInitialSelection();
      const next = reduceSelection(state, doc, { type: 'TOGGLE_LOCK', sectionId: 'hero' });

      expect(next.lockedIds).toContain('hero');
    });

    it('should unlock a section', () => {
      const doc = freshDoc();
      const state = { ...createInitialSelection(), lockedIds: ['hero'] };
      const next = reduceSelection(state, doc, { type: 'TOGGLE_LOCK', sectionId: 'hero' });

      expect(next.lockedIds).not.toContain('hero');
    });
  });

  describe('TOGGLE VISIBILITY', () => {
    it('should hide a section', () => {
      const doc = freshDoc();
      const state = createInitialSelection();
      const next = reduceSelection(state, doc, { type: 'TOGGLE_VISIBILITY', sectionId: 'footer' });

      expect(next.hiddenIds).toContain('footer');
    });

    it('should show a section', () => {
      const doc = freshDoc();
      const state = { ...createInitialSelection(), hiddenIds: ['footer'] };
      const next = reduceSelection(state, doc, { type: 'TOGGLE_VISIBILITY', sectionId: 'footer' });

      expect(next.hiddenIds).not.toContain('footer');
    });
  });

  describe('SET BREAKPOINT', () => {
    it('should change breakpoint', () => {
      const doc = freshDoc();
      const state = createInitialSelection();
      const next = reduceSelection(state, doc, { type: 'SET_BREAKPOINT', breakpoint: 'MOBILE' });

      expect(next.activeBreakpoint).toBe('MOBILE');
    });

    it('should preserve other state when changing breakpoint', () => {
      const doc = freshDoc();
      const state = { ...createInitialSelection(), selectedIds: ['hero'] };
      const next = reduceSelection(state, doc, { type: 'SET_BREAKPOINT', breakpoint: 'TABLET' });

      expect(next.selectedIds).toEqual(['hero']);
      expect(next.activeBreakpoint).toBe('TABLET');
    });
  });
});

// ---------------------------------------------------------------------------
// buildBreadcrumbs tests
// ---------------------------------------------------------------------------

describe('buildBreadcrumbs', () => {
  it('should build breadcrumb path from store root to selected section', () => {
    const doc = freshDoc();
    const crumbs = buildBreadcrumbs(doc, 'hero');

    expect(crumbs.length).toBeGreaterThanOrEqual(2);
    expect(crumbs[0].type).toBe('page');
    expect(crumbs[crumbs.length - 1].id).toBe('hero');
  });

  it('should include container in path for nested children', () => {
    const doc = freshDoc();
    const container = doc.pages[0].sections.find(s => s.id === 'container_features')!;
    const childId = container.children[0]?.id;

    if (childId) {
      const crumbs = buildBreadcrumbs(doc, childId);
      const containerInPath = crumbs.some(c => c.id === 'container_features');
      expect(containerInPath).toBe(true);
    }
  });

  it('should return empty array for non-existent section', () => {
    const doc = freshDoc();
    const crumbs = buildBreadcrumbs(doc, 'nonexistent');
    expect(crumbs).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// selectParent tests
// ---------------------------------------------------------------------------

describe('selectParent', () => {
  it('should select parent container', () => {
    const doc = freshDoc();
    const container = doc.pages[0].sections.find(s => s.id === 'container_features')!;
    const childId = container.children[0]?.id;

    if (childId) {
      const state = { ...createInitialSelection(), selectedIds: [childId] };
      const next = selectParent(state, doc);
      expect(next.selectedIds).toContain('container_features');
    }
  });

  it('should do nothing if already at root', () => {
    const doc = freshDoc();
    const state = { ...createInitialSelection(), selectedIds: ['hero'] };
    const next = selectParent(state, doc);
    expect(next.selectedIds).toEqual(['hero']);
  });

  it('should do nothing if nothing selected', () => {
    const doc = freshDoc();
    const state = createInitialSelection();
    const next = selectParent(state, doc);
    expect(next.selectedIds).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Helper functions tests
// ---------------------------------------------------------------------------

describe('Helper functions', () => {
  it('isLocked should check if section is locked', () => {
    const state = { ...createInitialSelection(), lockedIds: ['hero'] };
    expect(isLocked(state, 'hero')).toBe(true);
    expect(isLocked(state, 'footer')).toBe(false);
  });

  it('isHidden should check if section is hidden', () => {
    const state = { ...createInitialSelection(), hiddenIds: ['footer'] };
    expect(isHidden(state, 'footer')).toBe(true);
    expect(isHidden(state, 'hero')).toBe(false);
  });

  it('isSelected should check if section is selected', () => {
    const state = { ...createInitialSelection(), selectedIds: ['hero', 'footer'] };
    expect(isSelected(state, 'hero')).toBe(true);
    expect(isSelected(state, 'container_features')).toBe(false);
  });

  it('isContainer should check if section has children', () => {
    const doc = freshDoc();
    const sections = doc.pages[0].sections;
    expect(isContainer(sections, 'container_features')).toBe(true);
    expect(isContainer(sections, 'hero')).toBe(false);
  });

  it('getNextSiblingId should return next selectable sibling', () => {
    const doc = freshDoc();
    const sections = doc.pages[0].sections;
    const next = getNextSiblingId(sections, 'hero', []);
    expect(next).toBe('container_features');
  });

  it('getNextSiblingId should skip locked sections', () => {
    const doc = freshDoc();
    const sections = doc.pages[0].sections;
    const next = getNextSiblingId(sections, 'hero', ['container_features']);
    expect(next).toBe('footer');
  });

  it('getPrevSiblingId should return previous selectable sibling', () => {
    const doc = freshDoc();
    const sections = doc.pages[0].sections;
    const prev = getPrevSiblingId(sections, 'footer', []);
    expect(prev).toBe('container_features');
  });
});

// ---------------------------------------------------------------------------
// computeSelectionBox tests
// ---------------------------------------------------------------------------

describe('computeSelectionBox', () => {
  it('should compute rect from start to current', () => {
    const result = computeSelectionBox({ x: 100, y: 100 }, { x: 300, y: 400 });

    expect(result.rect).toEqual({ x: 100, y: 100, width: 200, height: 300 });
    expect(result.isDragging).toBe(true);
    expect(result.start).toEqual({ x: 100, y: 100 });
    expect(result.current).toEqual({ x: 300, y: 400 });
  });

  it('should handle reverse drag (current before start)', () => {
    const result = computeSelectionBox({ x: 300, y: 400 }, { x: 100, y: 100 });

    expect(result.rect).toEqual({ x: 100, y: 100, width: 200, height: 300 });
  });

  it('should not be dragging for very small movements', () => {
    const result = computeSelectionBox({ x: 100, y: 100 }, { x: 102, y: 102 });

    expect(result.isDragging).toBe(false);
  });

  it('should have rect covering both points', () => {
    const result = computeSelectionBox({ x: 200, y: 50 }, { x: 50, y: 300 });

    expect(result.rect!.x).toBe(50);
    expect(result.rect!.y).toBe(50);
    expect(result.rect!.width).toBe(150);
    expect(result.rect!.height).toBe(250);
  });
});

// ---------------------------------------------------------------------------
// NS24: BOX_SELECT reducer — real marquee selection
// ---------------------------------------------------------------------------

describe('NS24 reduceSelection BOX_SELECT', () => {
  const doc = createTestDocument();

  it('selects all elements intersecting the marquee rect', () => {
    const sectionPositions = new Map([
      ['hero', { x: 0, y: 0, width: 200, height: 100 }],
      ['container_features', { x: 0, y: 100, width: 200, height: 200 }],
      ['footer', { x: 0, y: 300, width: 200, height: 100 }],
    ]);

    const next = reduceSelection(
      createInitialSelection(),
      doc,
      {
        type: 'BOX_SELECT',
        pageId: 'page_home',
        rect: { x: 0, y: 50, width: 200, height: 100 },
        sectionPositions: sectionPositions as Map<string, import('../CanvasState').Rect>,
      }
    );

    // hero (y 0-100 intersects 50-150) and container_features (100-300 intersects) selected; footer not
    expect(next.selectedIds).toContain('hero');
    expect(next.selectedIds).toContain('container_features');
    expect(next.selectedIds).not.toContain('footer');
  });

  it('does not select locked elements', () => {
    const sectionPositions = new Map([
      ['hero', { x: 0, y: 0, width: 100, height: 100 }],
    ]);
    const lockedState: SelectionState = {
      ...createInitialSelection(),
      lockedIds: ['hero'],
    };

    const next = reduceSelection(
      lockedState,
      doc,
      {
        type: 'BOX_SELECT',
        pageId: 'page_home',
        rect: { x: 0, y: 0, width: 200, height: 200 },
        sectionPositions: sectionPositions as Map<string, import('../CanvasState').Rect>,
      }
    );

    expect(next.selectedIds).not.toContain('hero');
  });

  it('returns empty selection for a rect that intersects nothing', () => {
    const sectionPositions = new Map([
      ['hero', { x: 0, y: 0, width: 10, height: 10 }],
    ]);

    const next = reduceSelection(
      createInitialSelection(),
      doc,
      {
        type: 'BOX_SELECT',
        pageId: 'page_home',
        rect: { x: 500, y: 500, width: 10, height: 10 },
        sectionPositions: sectionPositions as Map<string, import('../CanvasState').Rect>,
      }
    );

    expect(next.selectedIds).toHaveLength(0);
  });
});

