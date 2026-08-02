/**
 * Overlay Engine Tests — C16.4
 *
 * Tests for:
 *   - SelectionEngine (core selection logic)
 *   - OverlayController (overlay state computation)
 *   - OverlayRect (coordinate transforms)
 *
 * Architecture:
 *   Pure logic — NO DOM, NO React. Tests run in Node.
 */

import { describe, it, expect } from 'vitest'
import {
  createInitialSelection,
  reduceSelection,
  buildBreadcrumbs,
  selectParent,
  isLocked,
  isHidden,
  isSelected,
  isContainer,
  getNextSiblingId,
  getPrevSiblingId,
  computeSelectionBox,
} from '../SelectionEngine'
import type { SelectionState, BuilderDocument, CanvasAction } from '../index'
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../BuilderDocument'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestDoc(): BuilderDocument {
  const doc = createBuilderDocument({
    id: 'test-store',
    tenantId: 'test-tenant',
    metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
  })

  // Add sections to home page  
  const homePage = doc.pages[0]
  homePage.sections = [
    createSectionNode({ id: 'sec_1', type: 'navbar', label: 'Navbar', order: 0 }),
    createSectionNode({ id: 'sec_2', type: 'hero', label: 'Hero Banner', order: 1 }),
    createSectionNode({ id: 'sec_3', type: 'container', label: 'Container', order: 2 }),
    createSectionNode({ id: 'sec_4', type: 'footer', label: 'Footer', order: 3 }),
  ]

  // Add children to container
  homePage.sections[2].children = [
    createSectionNode({ id: 'sec_3_1', type: 'content', label: 'Left Column', order: 0 }),
    createSectionNode({ id: 'sec_3_2', type: 'content', label: 'Right Column', order: 1 }),
  ]

  // Lock footer
  homePage.sections[3].locked = true

  // Add more pages
  doc.pages.push(
    createBuilderPage({ id: 'page_shop', slug: '/shop', name: 'Shop' }),
    createBuilderPage({ id: 'page_about', slug: '/about', name: 'About' }),
  )

  return { ...doc }
}

function sel(s: Partial<SelectionState> = {}): SelectionState {
  return { ...createInitialSelection(), ...s }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SelectionEngine', () => {
  describe('createInitialSelection', () => {
    it('creates an empty selection with defaults', () => {
      const s = createInitialSelection()
      expect(s.selectedIds).toEqual([])
      expect(s.hoveredId).toBeNull()
      expect(s.activeBreakpoint).toBe('DESKTOP')
      expect(s.lockedIds).toEqual([])
      expect(s.hiddenIds).toEqual([])
      expect(s.breadcrumbs).toEqual([])
    })
  })

  describe('reduceSelection', () => {
    it('selects a section', () => {
      const doc = createTestDoc()
      const initial = createInitialSelection()
      const action: CanvasAction = { type: 'SELECT_SECTION', sectionId: 'sec_1', pageId: 'page_home' }
      const next = reduceSelection(initial, doc, action)
      expect(next.selectedIds).toEqual(['sec_1'])
    })

    it('deselects by passing null', () => {
      const doc = createTestDoc()
      const selectAction: CanvasAction = { type: 'SELECT_SECTION', sectionId: 'sec_1', pageId: 'page_home' }
      const deselectAction: CanvasAction = { type: 'SELECT_SECTION', sectionId: null }
      const withSelect = reduceSelection(createInitialSelection(), doc, selectAction)
      const withDeselect = reduceSelection(withSelect, doc, deselectAction)
      expect(withDeselect.selectedIds).toEqual([])
    })

    it('handles multiple selection with additive', () => {
      const doc = createTestDoc()
      const initial = createInitialSelection()
      const first: CanvasAction = { type: 'SELECT_SECTION', sectionId: 'sec_1', pageId: 'page_home', additive: true }
      const s1 = reduceSelection(initial, doc, first)
      expect(s1.selectedIds).toEqual(['sec_1'])

      const second: CanvasAction = { type: 'SELECT_SECTION', sectionId: 'sec_2', pageId: 'page_home', additive: true }
      const s2 = reduceSelection(s1, doc, second)
      expect(s2.selectedIds).toContain('sec_1')
      expect(s2.selectedIds).toContain('sec_2')
    })

    it('hovers a section', () => {
      const doc = createTestDoc()
      const hoverAction: CanvasAction = { type: 'HOVER_SECTION', sectionId: 'sec_1' }
      const hovered = reduceSelection(createInitialSelection(), doc, hoverAction)
      expect(hovered.hoveredId).toBe('sec_1')
    })

    it('unhover on null', () => {
      const doc = createTestDoc()
      const hoverAction: CanvasAction = { type: 'HOVER_SECTION', sectionId: 'sec_1' }
      const unhoverAction: CanvasAction = { type: 'HOVER_SECTION', sectionId: null }
      const s1 = reduceSelection(createInitialSelection(), doc, hoverAction)
      const s2 = reduceSelection(s1, doc, unhoverAction)
      expect(s2.hoveredId).toBeNull()
    })

    it('toggles lock', () => {
      const doc = createTestDoc()
      const initial = createInitialSelection()
      const lock: CanvasAction = { type: 'TOGGLE_LOCK', sectionId: 'sec_1' }
      const locked = reduceSelection(initial, doc, lock)
      expect(locked.lockedIds).toContain('sec_1')
      const unlocked = reduceSelection(locked, doc, lock)
      expect(unlocked.lockedIds).not.toContain('sec_1')
    })

    it('toggles visibility', () => {
      const doc = createTestDoc()
      const initial = createInitialSelection()
      const hide: CanvasAction = { type: 'TOGGLE_VISIBILITY', sectionId: 'sec_1' }
      const hidden = reduceSelection(initial, doc, hide)
      expect(hidden.hiddenIds).toContain('sec_1')
      const shown = reduceSelection(hidden, doc, hide)
      expect(shown.hiddenIds).not.toContain('sec_1')
    })

    it('sets breakpoint', () => {
      const doc = createTestDoc()
      const initial = createInitialSelection()
      const bp: CanvasAction = { type: 'SET_BREAKPOINT', breakpoint: 'MOBILE' }
      const mobile = reduceSelection(initial, doc, bp)
      expect(mobile.activeBreakpoint).toBe('MOBILE')
    })
  })

  describe('buildBreadcrumbs', () => {
    it('builds breadcrumbs for root-level sections', () => {
      const doc = createTestDoc()
      const crumbs = buildBreadcrumbs(doc, 'sec_1')
      expect(crumbs.length).toBeGreaterThanOrEqual(1)
      expect(crumbs[crumbs.length - 1].id).toBe('sec_1')
      expect(crumbs[crumbs.length - 1].label).toBe('Navbar')
    })

    it('builds breadcrumbs for nested sections', () => {
      const doc = createTestDoc()
      const crumbs = buildBreadcrumbs(doc, 'sec_3_1')
      expect(crumbs.length).toBeGreaterThanOrEqual(2)
      // Last two should be Container → Left Column
      const labels = crumbs.map(c => c.label)
      expect(labels).toContain('Container')
      expect(labels).toContain('Left Column')
    })

    it('returns empty array for non-existent section', () => {
      const doc = createTestDoc()
      const crumbs = buildBreadcrumbs(doc, 'non_existent')
      expect(crumbs).toEqual([])
    })
  })

  describe('selectParent', () => {
    it('selects parent from a child section', () => {
      const doc = createTestDoc()
      const initial = createInitialSelection()
      const selectChild: CanvasAction = { type: 'SELECT_SECTION', sectionId: 'sec_3_1', pageId: 'page_home' }
      const childState = reduceSelection(initial, doc, selectChild)
      const parentState = selectParent(childState, doc)
      expect(parentState.selectedIds).toContain('sec_3')
    })

    it('stays at root for root-level sections', () => {
      const doc = createTestDoc()
      const initial = createInitialSelection()
      const selectRoot: CanvasAction = { type: 'SELECT_SECTION', sectionId: 'sec_1', pageId: 'page_home' }
      const rootState = reduceSelection(initial, doc, selectRoot)
      const parentState = selectParent(rootState, doc)
      expect(parentState.selectedIds).toEqual(rootState.selectedIds)
    })
  })

  describe('isLocked / isHidden / isSelected', () => {
    it('isLocked checks lockedIds', () => {
      const state = sel({ lockedIds: ['sec_1'] })
      expect(isLocked(state, 'sec_1')).toBe(true)
      expect(isLocked(state, 'sec_2')).toBe(false)
    })

    it('isHidden checks hiddenIds', () => {
      const state = sel({ hiddenIds: ['sec_1'] })
      expect(isHidden(state, 'sec_1')).toBe(true)
      expect(isHidden(state, 'sec_2')).toBe(false)
    })

    it('isSelected checks selectedIds', () => {
      const state = sel({ selectedIds: ['sec_1'] })
      expect(isSelected(state, 'sec_1')).toBe(true)
      expect(isSelected(state, 'sec_2')).toBe(false)
    })
  })

  describe('isContainer', () => {
    it('returns true when section has children', () => {
      const doc = createTestDoc()
      expect(isContainer(doc.pages[0].sections, 'sec_3')).toBe(true)
    })

    it('returns false for leaf sections', () => {
      const doc = createTestDoc()
      expect(isContainer(doc.pages[0].sections, 'sec_1')).toBe(false)
    })
  })

  describe('getNextSiblingId / getPrevSiblingId', () => {
    it('gets next sibling', () => {
      const doc = createTestDoc()
      const pages = doc.pages[0].sections
      expect(getNextSiblingId(pages, 'sec_1', [])).toBe('sec_2')
      expect(getNextSiblingId(pages, 'sec_4', [])).toBeNull() // last
    })

    it('gets previous sibling', () => {
      const doc = createTestDoc()
      const pages = doc.pages[0].sections
      expect(getPrevSiblingId(pages, 'sec_2', [])).toBe('sec_1')
      expect(getPrevSiblingId(pages, 'sec_1', [])).toBeNull() // first
    })
  })

  describe('computeSelectionBox', () => {
    it('computes selection box from start and current positions', () => {
      const box = computeSelectionBox(
        { x: 100, y: 50 },
        { x: 500, y: 350 }
      )
      expect(box.rect).toEqual({
        x: 100,
        y: 50,
        width: 400,
        height: 300,
      })
      expect(box.isDragging).toBe(true)
    })

    it('returns no drag for very small movements', () => {
      const box = computeSelectionBox(
        { x: 100, y: 50 },
        { x: 102, y: 52 }
      )
      expect(box.isDragging).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// Integration: SelectionEngine + BuilderDocument
// ---------------------------------------------------------------------------

describe('SelectionEngine Integration', () => {
  it('can select and deselect across pages', () => {
    const doc = createTestDoc()
    let state = createInitialSelection()

    // Select home page hero
    const selectHero: CanvasAction = { type: 'SELECT_SECTION', sectionId: 'sec_2', pageId: 'page_home' }
    state = reduceSelection(state, doc, selectHero)
    expect(state.selectedIds).toEqual(['sec_2'])

    // Deselect
    const deselect: CanvasAction = { type: 'SELECT_SECTION', sectionId: null }
    state = reduceSelection(state, doc, deselect)
    expect(state.selectedIds).toEqual([])
  })

  it('can multi-select and navigate', () => {
    const doc = createTestDoc()
    let state = createInitialSelection()

    const s1: CanvasAction = { type: 'SELECT_SECTION', sectionId: 'sec_1', pageId: 'page_home', additive: true }
    const s2: CanvasAction = { type: 'SELECT_SECTION', sectionId: 'sec_2', pageId: 'page_home', additive: true }

    state = reduceSelection(state, doc, s1)
    state = reduceSelection(state, doc, s2)

    expect(state.selectedIds).toHaveLength(2)
    expect(state.selectedIds).toContain('sec_1')
    expect(state.selectedIds).toContain('sec_2')
    expect(state.selectionMode).toBe('MULTI')
  })
})

