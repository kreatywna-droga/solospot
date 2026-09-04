import { describe, it, expect } from 'vitest'
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  compile,
} from '../BuilderDocument'
import { applyCommandToDocument } from '../BuilderCommands'
import { createBuilderComponentRegistry } from '../ComponentRegistry'

describe('SoloSpot Builder 2.0 — Master Suite', () => {
  it('should initialize a complete 2.0 document with default home page and theme tokens', () => {
    const doc = createBuilderDocument({
      id: 'store_test_2',
      metadata: {
        storeName: 'Test Store 2.0',
        storeSlug: 'test-store-2',
        locale: 'pl',
        currency: 'PLN',
      },
      theme: {
        primaryColor: '#7c3aed',
        secondaryColor: '#d946ef',
        font: 'Inter',
        tokens: {
          radius: { sm: '4px', md: '8px', lg: '16px', full: '9999px' },
        },
      },
    })

    expect(doc.pages.length).toBe(1)
    expect(doc.pages[0].isHome).toBe(true)
    expect(doc.theme.tokens?.radius?.lg).toBe('16px')
  })

  it('should handle multi-page lifecycle: ADD_PAGE, DUPLICATE_PAGE, SET_HOME_PAGE, and UPDATE_PAGE_META', () => {
    let doc = createBuilderDocument({ id: 'store_mp' })

    // 1. ADD_PAGE
    doc = applyCommandToDocument(doc, {
      type: 'ADD_PAGE',
      page: {
        id: 'page_about',
        name: 'O nas',
        slug: '/o-nas',
        isHome: false,
        seo: { title: 'O nas - Test Store' },
      },
    })
    expect(doc.pages.length).toBe(2)
    expect(doc.pages[1].name).toBe('O nas')

    // 2. DUPLICATE_PAGE
    doc = applyCommandToDocument(doc, {
      type: 'DUPLICATE_PAGE',
      pageId: 'page_about',
    })
    expect(doc.pages.length).toBe(3)
    expect(doc.pages[2].name).toContain('Kopia')
    expect(doc.pages[2].isHome).toBe(false)

    // 3. SET_HOME_PAGE
    doc = applyCommandToDocument(doc, {
      type: 'SET_HOME_PAGE',
      pageId: 'page_about',
    })
    expect(doc.pages.find(p => p.id === 'page_about')?.isHome).toBe(true)
    expect(doc.pages.find(p => p.id !== 'page_about')?.isHome).toBe(false)

    // 4. UPDATE_PAGE_META
    doc = applyCommandToDocument(doc, {
      type: 'UPDATE_PAGE_META',
      pageId: 'page_about',
      name: 'O naszej firmie',
      slug: '/o-firmie',
    })
    const aboutPage = doc.pages.find(p => p.id === 'page_about')
    expect(aboutPage?.name).toBe('O naszej firmie')
    expect(aboutPage?.slug).toBe('/o-firmie')
  })

  it('should update global design tokens via UPDATE_DESIGN_TOKENS and UPDATE_THEME', () => {
    let doc = createBuilderDocument({ id: 'store_theme' })

    doc = applyCommandToDocument(doc, {
      type: 'UPDATE_THEME',
      theme: {
        primaryColor: '#06b6d4',
        font: 'Space Grotesk',
      },
    })
    expect(doc.theme.primaryColor).toBe('#06b6d4')
    expect(doc.theme.font).toBe('Space Grotesk')

    doc = applyCommandToDocument(doc, {
      type: 'UPDATE_DESIGN_TOKENS',
      tokens: {
        colors: { primary: '#06b6d4', surface: '#0c0c16' },
      },
    })
    expect(doc.theme.tokens?.colors?.surface).toBe('#0c0c16')
  })

  it('should have all 10 standard component categories registered in BuilderComponentRegistry', () => {
    const registry = createBuilderComponentRegistry()
    const all = registry.getAll()

    expect(all.length).toBeGreaterThanOrEqual(15)

    const categories = new Set(all.map(d => d.category))
    expect(categories.has('Navigation')).toBe(true)
    expect(categories.has('Hero')).toBe(true)
    expect(categories.has('Commerce')).toBe(true)
    expect(categories.has('Content')).toBe(true)
    expect(categories.has('Features')).toBe(true)
    expect(categories.has('Media')).toBe(true)
    expect(categories.has('Social Proof')).toBe(true)
    expect(categories.has('Marketing')).toBe(true)
    expect(categories.has('Contact')).toBe(true)
    expect(categories.has('Layout')).toBe(true)
  })

  it('should compile BuilderDocument with multi-page and container sections cleanly', () => {
    let doc = createBuilderDocument({ id: 'store_compile' })
    const homePageId = doc.pages[0].id

    // Add Navbar and Hero
    doc = applyCommandToDocument(doc, {
      type: 'ADD_SECTION',
      pageId: homePageId,
      sectionType: 'navbar',
      defaultProps: { brandName: 'Test Brand' },
      label: 'Nawigacja',
    })
    doc = applyCommandToDocument(doc, {
      type: 'ADD_SECTION',
      pageId: homePageId,
      sectionType: 'hero',
      defaultProps: { title: 'Witaj' },
      label: 'Hero',
    })

    const compiled = compile(doc)
    expect(compiled.storeId).toBe('store_compile')
    expect(compiled.pages.length).toBe(1)
    expect(compiled.pages[0].sections.length).toBe(2)
    expect(compiled.pages[0].sections[0].type).toBe('navbar')
    expect(compiled.pages[0].sections[1].type).toBe('hero')
  })
})
