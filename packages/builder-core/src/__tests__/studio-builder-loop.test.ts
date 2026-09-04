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

  it('NS24: root-level drag reorder — dragging C above A yields C,A,B with undo/redo', () => {
    const registry = createBuilderComponentRegistry()
    const channel = createMemoryChannel()

    const mk = (id: string, order: number) =>
      createSectionNode({ id, type: 'content', label: id, props: { title: id }, order })

    const page = createBuilderPage({
      id: 'page_home',
      slug: '/',
      name: 'Home',
      isHome: true,
      sections: [mk('sec_a', 0), mk('sec_b', 1), mk('sec_c', 2)],
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

    // Drag C (index 2) above A (index 0):
    // MOVE_SECTION removes C first → [A,B], then inserts at 0 → [C,A,B]
    ctx = ctx.dispatch({
      type: 'MOVE_SECTION',
      pageId: 'page_home',
      fromIndex: 2,
      toIndex: 0,
    })

    const order1 = ctx.document.pages[0].sections.map(s => s.id)
    expect(order1).toEqual(['sec_c', 'sec_a', 'sec_b'])

    // UNDO restores original order
    ctx = ctx.dispatch({ type: 'UNDO' })
    expect(ctx.document.pages[0].sections.map(s => s.id)).toEqual(['sec_a', 'sec_b', 'sec_c'])

    // REDO restores reordered state
    ctx = ctx.dispatch({ type: 'REDO' })
    expect(ctx.document.pages[0].sections.map(s => s.id)).toEqual(['sec_c', 'sec_a', 'sec_b'])

    // Orders re-normalized 0..n
    expect(ctx.document.pages[0].sections.map(s => s.order)).toEqual([0, 1, 2])
  })

  it('NS24: SET_NODE_STYLES participates in history (resize/style undo-redo)', () => {
    const registry = createBuilderComponentRegistry()
    const channel = createMemoryChannel()

    const heading = createSectionNode({
      id: 'elem_h',
      type: 'heading',
      label: 'Nagłówek',
      props: { text: 'Tytuł', level: 'h2' },
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

    // Resize commit (same command SelectionOverlay dispatches on pointer up)
    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'elem_h',
      styles: { width: '320px', height: '80px' },
    })

    let node: any = ctx.document.pages[0].sections[0]
    expect(node.styles.width).toBe('320px')
    expect(node.styles.height).toBe('80px')

    ctx = ctx.dispatch({ type: 'UNDO' })
    node = ctx.document.pages[0].sections[0]
    expect(node.styles?.width).toBeUndefined()

    ctx = ctx.dispatch({ type: 'REDO' })
    node = ctx.document.pages[0].sections[0]
    expect(node.styles.width).toBe('320px')
  })

  it('NS24: persistence round-trip contract — node styles, responsive, children preserved through save shape', () => {
    const registry = createBuilderComponentRegistry()
    const channel = createMemoryChannel()

    const child = createSectionNode({
      id: 'elem_img',
      type: 'image',
      label: 'Zdjęcie',
      props: { src: 'https://example.com/img.jpg', alt: 'Opis' },
      order: 0,
    })
    const container = {
      ...createSectionNode({
        id: 'cont_main',
        type: 'container',
        label: 'Kontener',
        props: { display: 'flex-col' },
        order: 0,
      }),
      children: [child],
    }
    const page = createBuilderPage({
      id: 'page_home',
      slug: '/',
      name: 'Home',
      isHome: true,
      sections: [container],
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

    // Mutations: style, responsive style, text
    ctx = ctx.dispatch({ type: 'SET_NODE_STYLES', nodeId: 'cont_main', styles: { backgroundColor: '#101020', padding: '24px' } })
    ctx = ctx.dispatch({ type: 'UPDATE_PROPS', pageId: 'page_home', sectionId: 'elem_img', props: { src: 'https://example.com/changed.jpg' } })
    // Mobile style override (same command BuilderShell dispatches in TABLET/MOBILE)
    ctx = ctx.dispatch({ type: 'UPDATE_NODE', nodeId: 'cont_main', updates: { responsive: { mobile: { padding: '8px' } } } })

    // Simulate the API persistence shape (nodeToApiSection from studio page):
    // styles + responsive + children must survive the serialize/deserialize cycle
    const serialized = ctx.document.pages[0].sections.map((s) => ({
      id: s.id,
      type: s.type,
      label: s.label,
      config: s.props,
      styles: s.styles,
      responsive: s.responsive,
      responsiveProps: s.responsiveProps,
      visible: s.visible,
      locked: s.locked,
      order: s.order,
      children: (s.children ?? []).map((c) => ({
        id: c.id, type: c.type, label: c.label, config: c.props, styles: c.styles,
        responsive: c.responsive, visible: c.visible, locked: c.locked, order: c.order,
      })),
    }))

    expect(serialized[0]?.styles?.backgroundColor).toBe('#101020')
    expect(serialized[0]?.responsive?.mobile?.padding).toBe('8px')
    expect(serialized[0]?.children?.[0]?.config?.src).toBe('https://example.com/changed.jpg')
  })
})
