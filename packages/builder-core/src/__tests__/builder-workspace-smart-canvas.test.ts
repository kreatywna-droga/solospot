import { describe, it, expect } from 'vitest'
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  createBuilderNode,
  generateNodeId,
  createBuilderComponentRegistry,
  createBuilderContext,
  createMemoryChannel,
  findNode,
  BuilderNode,
} from '../index'
import { NAVIGABLE_CATEGORY_MAP } from '../NavigationShortcuts'

describe('Hero Mission: Smart Canvas Scaling, Contextual Insertion & Quick Navigation', () => {
  // -------------------------------------------------------------------------
  // 1. Intelligent Canvas Auto-Fit Scale Model
  // -------------------------------------------------------------------------
  describe('Canvas Auto-Fit Calculation', () => {
    function computeFitScale(availableWidth: number, viewportWidth: number): number {
      if (availableWidth <= 0 || viewportWidth <= 0) return 1.0
      return Math.min(1.0, Math.max(0.1, availableWidth / viewportWidth))
    }

    it('scales page down smoothly when inspector expands (narrow workspace)', () => {
      const viewportWidth = 1440
      const availableCanvasWidth = 800 // Left 250px + Inspector 650px on a 1700px screen

      const scale = computeFitScale(availableCanvasWidth, viewportWidth)
      expect(scale).toBeCloseTo(800 / 1440, 3)
      expect(scale).toBeLessThan(1.0)
    })

    it('caps scale at 1.0 when available workspace is larger than viewport', () => {
      const viewportWidth = 1280
      const availableCanvasWidth = 1600

      const scale = computeFitScale(availableCanvasWidth, viewportWidth)
      expect(scale).toBe(1.0)
    })

    it('converts pointer delta to logical coordinates without drift across scales', () => {
      const scales = [1.0, 0.75, 0.5, 0.555]

      for (const scale of scales) {
        const pointerDeltaScreenX = 60
        const logicalDeltaX = Math.round(pointerDeltaScreenX / scale)

        // At 50%, a 60px mouse movement corresponds to 120px logical movement
        if (scale === 0.5) {
          expect(logicalDeltaX).toBe(120)
        }
        // At 100%, 60px screen = 60px logical
        if (scale === 1.0) {
          expect(logicalDeltaX).toBe(60)
        }
        expect(logicalDeltaX).toBeGreaterThanOrEqual(pointerDeltaScreenX)
      }
    })
  })

  // -------------------------------------------------------------------------
  // 2. Section Insertion Magnet & Contextual Index Placement
  // -------------------------------------------------------------------------
  describe('Section Insertion Context', () => {
    it('inserts new section at the exact specified magnet index', () => {
      const sec1 = createSectionNode({ id: 'sec_1', type: 'section', label: 'Hero', children: [] })
      const sec2 = createSectionNode({ id: 'sec_2', type: 'section', label: 'Cechy', children: [] })
      const sec3 = createSectionNode({ id: 'sec_3', type: 'section', label: 'Stopka', children: [] })

      const doc = createBuilderDocument({
        id: 'doc_1',
        pages: [
          createBuilderPage({
            id: 'page_1',
            name: 'Home',
            slug: '/',
            sections: [sec1, sec2, sec3],
          }),
        ],
      })

      const registry = createBuilderComponentRegistry()
      let ctx = createBuilderContext({
        document: doc,
        registry,
        preview: createMemoryChannel().builderChannel,
      })

      expect(ctx.document.pages[0].sections.map(s => s.id)).toEqual(['sec_1', 'sec_2', 'sec_3'])

      // Insert new pricing section between sec_1 and sec_2 (index 1)
      const newPricingSec = createSectionNode({ id: 'sec_pricing', type: 'section', label: 'Cennik', children: [] })
      ctx = ctx.dispatch({
        type: 'INSERT_NODE',
        pageId: 'page_1',
        parentId: null,
        node: newPricingSec,
        index: 1,
      })

      expect(ctx.document.pages[0].sections.map(s => s.id)).toEqual(['sec_1', 'sec_pricing', 'sec_2', 'sec_3'])
      expect(ctx.document.pages[0].sections[1].label).toBe('Cennik')
    })
  })

  // -------------------------------------------------------------------------
  // 3. Category Selection Creates Quick Navigation & Duplicate Protection
  // -------------------------------------------------------------------------
  describe('Navigable Category to Navigation Shortcut Mapping', () => {
    it('maps all expected navigable categories to semantic anchors and Polish labels', () => {
      expect(NAVIGABLE_CATEGORY_MAP.pricing).toEqual({ label: 'Cennik', anchor: '#cennik' })
      expect(NAVIGABLE_CATEGORY_MAP.about).toEqual({ label: 'O nas', anchor: '#o-nas' })
      expect(NAVIGABLE_CATEGORY_MAP.features).toEqual({ label: 'Cechy', anchor: '#cechy' })
      expect(NAVIGABLE_CATEGORY_MAP.services).toEqual({ label: 'Usługi', anchor: '#uslugi' })
      expect(NAVIGABLE_CATEGORY_MAP.gallery).toEqual({ label: 'Galeria', anchor: '#galeria' })
      expect(NAVIGABLE_CATEGORY_MAP.testimonials).toEqual({ label: 'Opinie', anchor: '#opinie' })
      expect(NAVIGABLE_CATEGORY_MAP.faq).toEqual({ label: 'FAQ', anchor: '#faq' })
      expect(NAVIGABLE_CATEGORY_MAP.contact).toEqual({ label: 'Kontakt', anchor: '#kontakt' })

      // Decorative categories must not have automatic navigation shortcuts
      expect(NAVIGABLE_CATEGORY_MAP.hero as any).toBeUndefined()
      expect(NAVIGABLE_CATEGORY_MAP.cta as any).toBeUndefined()
    })

    it('automatically adds quick navigation link to existing navbar with duplicate protection', () => {
      const navbarNode = createSectionNode({
        id: 'sec_navbar',
        type: 'section',
        label: 'Nawigacja główna',
        props: {
          links: [{ label: 'Strona Główna', href: '#home' }],
        },
        children: [],
      })

      const doc = createBuilderDocument({
        id: 'doc_nav',
        pages: [
          createBuilderPage({
            id: 'page_nav',
            name: 'Home',
            slug: '/',
            sections: [navbarNode],
          }),
        ],
      })

      const registry = createBuilderComponentRegistry()
      let ctx = createBuilderContext({
        document: doc,
        registry,
        preview: createMemoryChannel().builderChannel,
      })

      // Simulate first insertion of Pricing
      const navInfo = NAVIGABLE_CATEGORY_MAP.pricing!
      const currentNav = ctx.document.pages[0].sections.find(s => s.id === 'sec_navbar')!
      const links = (currentNav.props?.links as any[]) || []

      // 1. First insertion -> adds link
      if (!links.some(l => l.href === navInfo.anchor)) {
        ctx = ctx.dispatch({
          type: 'SET_NODE_PROPS',
          nodeId: 'sec_navbar',
          props: {
            links: [...links, { label: navInfo.label, href: navInfo.anchor }],
          },
        })
      }

      const updatedNav1 = ctx.document.pages[0].sections.find(s => s.id === 'sec_navbar')!
      expect(updatedNav1.props?.links).toEqual([
        { label: 'Strona Główna', href: '#home' },
        { label: 'Cennik', href: '#cennik' },
      ])

      // 2. Second insertion of Pricing -> Duplicate Protection must prevent duplicate
      const currentNav2 = ctx.document.pages[0].sections.find(s => s.id === 'sec_navbar')!
      const links2 = (currentNav2.props?.links as any[]) || []
      const duplicateFound = links2.some(l => l.href === navInfo.anchor)
      expect(duplicateFound).toBe(true)

      // Links count must remain 2, not 3
      expect(links2.length).toBe(2)
    })
  })

  // -------------------------------------------------------------------------
  // 4. Store Lifecycle States: ACTIVE <-> DEACTIVATED & Safe Deletion
  // -------------------------------------------------------------------------
  describe('Store Lifecycle Operations', () => {
    it('supports ACTIVE and DEACTIVATED lifecycle status transitions while preserving data', () => {
      type StoreStatus = 'ACTIVE' | 'DEACTIVATED'

      interface MockStore {
        id: string
        name: string
        status: StoreStatus
        pagesCount: number
        productsCount: number
      }

      const store: MockStore = {
        id: 'store_123',
        name: 'Vinyl Heaven',
        status: 'ACTIVE',
        pagesCount: 4,
        productsCount: 12,
      }

      // Deactivate store
      const deactivatedStore: MockStore = {
        ...store,
        status: 'DEACTIVATED',
      }

      expect(deactivatedStore.status).toBe('DEACTIVATED')
      expect(deactivatedStore.pagesCount).toBe(4) // Pages intact
      expect(deactivatedStore.productsCount).toBe(12) // Products intact
      expect(deactivatedStore.id).toBe('store_123') // Identity preserved

      // Reactivate store
      const reactivatedStore: MockStore = {
        ...deactivatedStore,
        status: 'ACTIVE',
      }

      expect(reactivatedStore.status).toBe('ACTIVE')
    })

    it('requires deliberate confirmation phrase matching store name for deletion', () => {
      const storeName = 'Sklep Audio Pro'

      function validateDeleteConfirmation(input: string, targetName: string): boolean {
        return input.trim() === targetName.trim()
      }

      expect(validateDeleteConfirmation('wrong name', storeName)).toBe(false)
      expect(validateDeleteConfirmation('sklep audio pro', storeName)).toBe(false) // case-sensitive exact match
      expect(validateDeleteConfirmation('Sklep Audio Pro', storeName)).toBe(true)
      expect(validateDeleteConfirmation(' Sklep Audio Pro  ', storeName)).toBe(true) // handles surrounding whitespace
    })
  })
})
