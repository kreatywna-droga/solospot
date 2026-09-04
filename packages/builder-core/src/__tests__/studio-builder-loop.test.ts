/**
 * Studio Builder Full Loop Regression Test — Night Shift 22
 *
 * Verifies that the complete visual builder workflow operates coherently:
 *   SELECT → INSPECT → EDIT → MUTATE → ADD/MOVE/DELETE → PREVIEW/LIVE
 */
import { describe, it, expect } from 'vitest'
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
} from '../BuilderDocument'
import {
  createBuilderComponentRegistry,
  STANDARD_COMPONENT_DESCRIPTORS,
} from '../ComponentRegistry'
import { createBuilderContext } from '../BuilderContext'
import { createMemoryChannel } from '../PreviewContract'
import { InspectorRuntime } from '../InspectorRuntime'

describe('Studio Builder Full Lifecycle Loop', () => {
  it('pre-populates standard components in registry', () => {
    const registry = createBuilderComponentRegistry()
    const all = registry.getAll()
    expect(all.length).toBeGreaterThanOrEqual(12)
    expect(registry.has('navbar')).toBe(true)
    expect(registry.has('hero')).toBe(true)
    expect(registry.has('product-grid')).toBe(true)
    expect(registry.has('category-grid')).toBe(true)
    expect(registry.has('gallery')).toBe(true)
    expect(registry.has('testimonials')).toBe(true)
    expect(registry.has('newsletter')).toBe(true)
    expect(registry.has('footer')).toBe(true)
  })

  it('executes SELECT -> INSPECT -> EDIT -> MUTATE -> MOVE -> REMOVE workflow', () => {
    const registry = createBuilderComponentRegistry()
    const channel = createMemoryChannel()

    const nav = createSectionNode({
      id: 'sec_nav',
      type: 'navbar',
      label: 'Nawigacja',
      props: { style: 'transparent', sticky: true },
      order: 0,
    })

    const hero = createSectionNode({
      id: 'sec_hero',
      type: 'hero',
      label: 'Hero',
      props: { title: 'Tytuł oryginalny' },
      order: 1,
    })

    const page = createBuilderPage({
      id: 'page_home',
      slug: '/',
      name: 'Home',
      isHome: true,
      sections: [nav, hero],
    })

    const doc = createBuilderDocument({
      id: 'store_test',
      metadata: { storeName: 'Test Store', storeSlug: 'test', locale: 'pl', currency: 'PLN' },
      pages: [page],
    })

    let ctx = createBuilderContext({
      document: doc,
      registry,
      preview: channel.builderChannel,
    })

    // 1. SELECT HERO SECTION
    ctx = ctx.dispatch({
      type: 'CANVAS',
      action: { type: 'SELECT_SECTION', sectionId: 'sec_hero', pageId: 'page_home' },
    })
    expect(ctx.canvas.selectedSectionId).toBe('sec_hero')

    // 2. INSPECT (load schema and organize categories)
    const descriptor = ctx.registry.get('hero')!
    expect(descriptor).toBeDefined()
    const categories = InspectorRuntime.organizeByCategory(descriptor.schema)
    expect(categories.length).toBeGreaterThan(0)

    // 3. EDIT / MUTATE PROPS
    ctx = ctx.dispatch({
      type: 'UPDATE_PROPS',
      pageId: 'page_home',
      sectionId: 'sec_hero',
      props: { title: 'Zmieniony tytuł hero', subtitle: 'Nowy podtytuł' },
    })

    const updatedHero = ctx.document.pages[0].sections.find(s => s.id === 'sec_hero')!
    expect(updatedHero.props.title).toBe('Zmieniony tytuł hero')
    expect(updatedHero.props.subtitle).toBe('Nowy podtytuł')

    // 4. ADD NEW SECTION
    ctx = ctx.dispatch({
      type: 'ADD_SECTION',
      pageId: 'page_home',
      sectionType: 'product-grid',
      label: 'Siatka produktów',
      defaultProps: { title: 'Polecane produkty', count: 8 },
    })
    expect(ctx.document.pages[0].sections.length).toBe(3)
    const productGrid = ctx.document.pages[0].sections[2]
    expect(productGrid.type).toBe('product-grid')

    // 5. MOVE SECTION
    ctx = ctx.dispatch({
      type: 'MOVE_SECTION',
      pageId: 'page_home',
      fromIndex: 2,
      toIndex: 1,
    })
    expect(ctx.document.pages[0].sections[1].type).toBe('product-grid')
    expect(ctx.document.pages[0].sections[2].type).toBe('hero')

    // 6. DUPLICATE SECTION
    ctx = ctx.dispatch({
      type: 'DUPLICATE_SECTION',
      pageId: 'page_home',
      sectionId: 'sec_hero',
    })
    expect(ctx.document.pages[0].sections.length).toBe(4)

    // 7. RESPONSIVE VIEWPORT TOGGLE
    ctx = ctx.dispatch({
      type: 'CANVAS',
      action: { type: 'SET_VIEWPORT', viewport: { label: 'MOBILE', width: 375 } },
    })
    expect(ctx.canvas.viewport.label).toBe('MOBILE')
    expect(ctx.canvas.viewport.width).toBe(375)

    // 8. TOGGLE PREVIEW MODE
    ctx = ctx.dispatch({
      type: 'CANVAS',
      action: { type: 'SET_MODE', mode: 'PREVIEW' },
    })
    expect(ctx.canvas.mode).toBe('PREVIEW')

    // 9. REMOVE SECTION
    ctx = ctx.dispatch({
      type: 'REMOVE_SECTION',
      pageId: 'page_home',
      sectionId: 'sec_nav',
    })
    expect(ctx.document.pages[0].sections.length).toBe(3)
    expect(ctx.document.pages[0].sections.some(s => s.id === 'sec_nav')).toBe(false)
  })

  it('NS23: inline text edit path — UPDATE_PROPS commits to document and participates in history', () => {
    const registry = createBuilderComponentRegistry()
    const channel = createMemoryChannel()

    const heading = createSectionNode({
      id: 'elem_heading',
      type: 'heading',
      label: 'Nagłówek',
      props: { text: 'Oryginalny tekst', level: 'h2' },
      order: 0,
    })
    const page = createBuilderPage({
      id: 'page_home',
      slug: '/',
      name: 'Home',
      isHome: true,
      sections: [heading],
    })
    const doc = createBuilderDocument({
      id: 'store_test',
      metadata: { storeName: 'Test Store', storeSlug: 'test', locale: 'pl', currency: 'PLN' },
      pages: [page],
    })

    let ctx = createBuilderContext({
      document: doc,
      registry,
      preview: channel.builderChannel,
    })

    // Simulate the inline-edit commit (same command InlineEditableText dispatches on blur)
    ctx = ctx.dispatch({
      type: 'UPDATE_PROPS',
      pageId: 'page_home',
      sectionId: 'elem_heading',
      props: { text: 'Nowy tekst nagłówka' },
    })

    const node = ctx.document.pages[0].sections[0]
    expect(node.props.text).toBe('Nowy tekst nagłówka')

    // UNDO restores original text (inline edits are part of history)
    ctx = ctx.dispatch({ type: 'UNDO' })
    expect(ctx.document.pages[0].sections[0].props.text).toBe('Oryginalny tekst')

    // REDO restores the edit
    ctx = ctx.dispatch({ type: 'REDO' })
    expect(ctx.document.pages[0].sections[0].props.text).toBe('Nowy tekst nagłówka')
  })

  it('NS23: responsive prop isolation — tablet/mobile overrides never overwrite desktop base', () => {
    const registry = createBuilderComponentRegistry()
    const channel = createMemoryChannel()

    const nav = createSectionNode({
      id: 'sec_nav',
      type: 'navbar',
      label: 'Nawigacja',
      props: { style: 'transparent', sticky: true },
      order: 0,
    })
    const page = createBuilderPage({
      id: 'page_home',
      slug: '/',
      name: 'Home',
      isHome: true,
      sections: [nav],
    })
    const doc = createBuilderDocument({
      id: 'store_test',
      metadata: { storeName: 'Test Store', storeSlug: 'test', locale: 'pl', currency: 'PLN' },
      pages: [page],
    })

    let ctx = createBuilderContext({
      document: doc,
      registry,
      preview: channel.builderChannel,
    })

    // Desktop base value
    expect(ctx.document.pages[0].sections[0].props.sticky).toBe(true)

    // TABLET override — different value
    ctx = ctx.dispatch({
      type: 'SET_SECTION_RESPONSIVE_PROP',
      pageId: 'page_home',
      sectionId: 'sec_nav',
      propName: 'sticky',
      value: false,
      breakpoint: 'tablet',
    })

    // MOBILE override — yet another value
    ctx = ctx.dispatch({
      type: 'SET_SECTION_RESPONSIVE_PROP',
      pageId: 'page_home',
      sectionId: 'sec_nav',
      propName: 'sticky',
      value: true,
      breakpoint: 'mobile',
    })

    const node = ctx.document.pages[0].sections[0]
    // Desktop base intact
    expect(node.props.sticky).toBe(true)
    // Tablet override stored separately
    expect(node.responsiveProps?.sticky?.tablet).toBe(false)
    // Mobile override stored separately
    expect(node.responsiveProps?.sticky?.mobile).toBe(true)
  })
})
