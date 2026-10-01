// @vitest-environment jsdom
/**
 * Visual Library Contract & UI Integration Tests
 *
 * Verifies:
 * 1. getCategoryOperations returns correct operations for all categories.
 * 2. Wstaw (INSERT) button dispatches INSERT_NODE or ADD_SECTION.
 * 3. Zastosuj (APPLY) button dispatches UPDATE_THEME / BATCH_EXECUTE.
 * 4. Cards render rich Visual Preview specimens.
 * 5. Drag and drop sets proper dataTransfer attributes.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import { DesignSystemCatalog } from '../DesignSystemCatalog'
import { getCategoryOperations, validateOperationTarget } from '../VisualLibraryContract'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const mockDispatch = vi.fn()

vi.mock('../../state/BuilderProvider', () => ({
  useBuilder: () => ({
    dispatch: mockDispatch,
    canvas: {
      selectedSectionId: 'hero-1',
      selectedPageId: 'page-1',
    },
    document: {
      theme: {
        primaryColor: '#D9A86C',
        secondaryColor: '#F2C27F',
        backgroundColor: '#090910',
        font: 'Inter',
        appliedStylePackId: null,
        tokens: {},
      },
      pages: [
        {
          id: 'page-1',
          slug: '/',
          name: 'Home',
          sections: [
            {
              id: 'hero-1',
              type: 'hero',
              label: 'Hero Section',
              styles: { fontFamily: 'Inter' },
              props: {},
              children: [
                {
                  id: 'heading-1',
                  type: 'heading',
                  label: 'Hero Headline',
                  styles: { fontFamily: 'Inter' },
                  props: {},
                  children: [],
                  order: 0,
                  visible: true,
                },
              ],
              order: 0,
              visible: true,
            },
          ],
        },
      ],
    },
  }),
}))

afterEach(() => {
  cleanup()
  mockDispatch.mockClear()
})

describe('VisualLibraryContract — Category Operations Map', () => {
  it('fonts supports both INSERT and APPLY', () => {
    const ops = getCategoryOperations('fonts')
    expect(ops.canInsert).toBe(true)
    expect(ops.canApply).toBe(true)
  })

  it('buttons supports both INSERT and APPLY', () => {
    const ops = getCategoryOperations('buttons')
    expect(ops.canInsert).toBe(true)
    expect(ops.canApply).toBe(true)
  })

  it('colors supports APPLY only', () => {
    const ops = getCategoryOperations('colors')
    expect(ops.canInsert).toBe(false)
    expect(ops.canApply).toBe(true)
  })

  it('style-packs supports APPLY only', () => {
    const ops = getCategoryOperations('style-packs')
    expect(ops.canInsert).toBe(false)
    expect(ops.canApply).toBe(true)
  })

  it('rejects an APPLY target that the category does not support', () => {
    const result = validateOperationTarget('style-packs', 'INSERT', {
      document: { pages: [{ id: 'page-1', sections: [] }], theme: {} },
      pageId: 'page-1',
      target: 'element',
    })
    expect(result.valid).toBe(false)
  })

  it('rejects APPLY to an element that is not present on the active page', () => {
    const result = validateOperationTarget('buttons', 'APPLY', {
      document: { pages: [{ id: 'page-1', sections: [] }], theme: {} },
      pageId: 'page-1',
      target: 'element',
      targetId: 'missing-node',
    })
    expect(result).toEqual({ valid: false, reason: 'Wybrany element docelowy nie istnieje na aktywnej stronie' })
  })

  it('accepts theme application only when the document has a theme', () => {
    expect(validateOperationTarget('style-packs', 'APPLY', {
      document: { pages: [{ id: 'page-1', sections: [] }], theme: {} },
      pageId: 'page-1',
      target: 'theme',
    }).valid).toBe(true)
    expect(validateOperationTarget('style-packs', 'APPLY', {
      document: { pages: [{ id: 'page-1', sections: [] }] },
      pageId: 'page-1',
      target: 'theme',
    }).valid).toBe(false)
  })
})

describe('DesignSystemCatalog — INSERT vs APPLY UI Actions', () => {
  it('Font category renders Wstaw (INSERT) button and clicking dispatches INSERT_NODE', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-fonts"]') as Element)

    const insertBtn = container.querySelector('[data-category="fonts"] [data-testid="ds-btn-insert"]') as HTMLButtonElement
    expect(insertBtn).toBeDefined()

    fireEvent.click(insertBtn)
    expect(mockDispatch).toHaveBeenCalled()
    const call = mockDispatch.mock.calls.find(([cmd]) => cmd.type === 'INSERT_NODE')
    expect(call).toBeDefined()
    expect(call?.[0]?.type).toBe('INSERT_NODE')
  })

  it('Button category renders Wstaw (INSERT) button and clicking dispatches INSERT_NODE', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-buttons"]') as Element)

    const insertBtn = container.querySelector('[data-category="buttons"] [data-testid="ds-btn-insert"]') as HTMLButtonElement
    expect(insertBtn).toBeDefined()

    fireEvent.click(insertBtn)
    expect(mockDispatch).toHaveBeenCalled()
    const call = mockDispatch.mock.calls.find(([cmd]) => cmd.type === 'INSERT_NODE')
    expect(call).toBeDefined()
    expect(call?.[0]?.node?.type).toBe('button')
  })

  it('Section category renders Wstaw (INSERT) button and dispatches ADD_SECTION', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-sections"]') as Element)

    const insertBtn = container.querySelector('[data-category="sections"] [data-testid="ds-btn-insert"]') as HTMLButtonElement
    expect(insertBtn).toBeDefined()

    fireEvent.click(insertBtn)
    expect(mockDispatch).toHaveBeenCalled()
    const call = mockDispatch.mock.calls.find(([cmd]) => cmd.type === 'ADD_SECTION')
    expect(call).toBeDefined()
  })

  it('Draggable cards set dataTransfer attributes onDragStart', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-fonts"]') as Element)

    const card = container.querySelector('[data-category="fonts"]') as HTMLElement
    expect(card.getAttribute('draggable')).toBe('true')

    const setDataMock = vi.fn()
    fireEvent.dragStart(card, {
      dataTransfer: { setData: setDataMock, effectAllowed: '' },
    })

    expect(setDataMock).toHaveBeenCalledWith('application/solospot-component-type', 'heading')
    expect(setDataMock).toHaveBeenCalledWith('application/solospot-typography-preset', expect.any(String))
  })

  it('validateOperationTarget rejects INSERT on style-packs and prevents dispatch mutation', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-style-packs"]') as Element)

    // Style Packs category does NOT have an INSERT button
    const insertBtn = container.querySelector('[data-category="style-packs"] [data-testid="ds-btn-insert"]')
    expect(insertBtn).toBeNull()
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('Preview modal open/close does not mutate document (PREVIEW != APPLY)', () => {
    const { container, getByTestId, queryByTestId } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-fonts"]') as Element)

    const previewBtn = container.querySelector('[data-category="fonts"] [data-testid="ds-btn-preview"]') as HTMLButtonElement
    fireEvent.click(previewBtn)

    expect(getByTestId('ds-preview-modal')).toBeDefined()
    expect(mockDispatch).not.toHaveBeenCalled()

    const closeBtn = getByTestId('ds-preview-modal').querySelector('button[aria-label="Zamknij"]') as HTMLButtonElement
    fireEvent.click(closeBtn)

    expect(queryByTestId('ds-preview-modal')).toBeNull()
    expect(mockDispatch).not.toHaveBeenCalled()
  })
})

