// @vitest-environment jsdom
/**
 * DesignSystemCatalog Apply button regression (Gate v3.0).
 *
 * Verifies that clicking Apply for non-Style-Pack categories
 * actually calls dispatch with a real UPDATE_THEME command.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import { DesignSystem } from '../../../../../packages/design-system/src/index'
import { DesignSystemCatalog } from '../DesignSystemCatalog'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const mockDispatch = vi.fn()

vi.mock('../../state/BuilderProvider', () => ({
  useBuilder: () => ({
    dispatch: mockDispatch,
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
                  styles: { fontFamily: '__SENTINEL__' },
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

describe('DesignSystemCatalog — Apply button regression', () => {
  it('Style Pack Apply dispatches UPDATE_THEME + node-level SET_NODE_STYLES', () => {
    const { container } = render(<DesignSystemCatalog />)
    const applyBtn = container.querySelector('[data-category="style-packs"] [data-testid="ds-btn-apply"]') as HTMLButtonElement
    fireEvent.click(applyBtn)
    expect(mockDispatch).toHaveBeenCalled()
    const cmd = mockDispatch.mock.calls[0][0]
    expect(cmd.type).toBe('UPDATE_THEME')
    expect(cmd.theme.appliedStylePackId).toBeTruthy()
    expect(cmd.theme.primaryColor).toBeDefined()
    // FONT PERSISTENCE: node-level fontFamily is also written so the canvas reflects it.
    const nodeCmds = mockDispatch.mock.calls.map((c) => c[0]).filter((c) => c.type === 'SET_NODE_STYLES')
    expect(nodeCmds.length).toBeGreaterThan(0)
    expect(nodeCmds.some((c: any) => c.styles.fontFamily)).toBe(true)
  })

  it('Typography Apply dispatches UPDATE_THEME + node SET_NODE_STYLES', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-typography"]') as Element)
    const applyBtn = container.querySelector('[data-category="typography"] [data-testid="ds-btn-apply"]') as HTMLButtonElement
    fireEvent.click(applyBtn)
    expect(mockDispatch).toHaveBeenCalled()
    const cmd = mockDispatch.mock.calls[0][0]
    expect(cmd.type).toBe('UPDATE_THEME')
    expect(cmd.theme.font).toBeDefined()
    const nodeCmds = mockDispatch.mock.calls.map((c) => c[0]).filter((c) => c.type === 'SET_NODE_STYLES')
    expect(nodeCmds.length).toBeGreaterThan(0)
  })

  it('Font Apply dispatches UPDATE_THEME + node SET_NODE_STYLES', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-fonts"]') as Element)
    const applyBtn = container.querySelector('[data-category="fonts"] [data-testid="ds-btn-apply"]') as HTMLButtonElement
    fireEvent.click(applyBtn)
    expect(mockDispatch).toHaveBeenCalled()
    const cmd = mockDispatch.mock.calls[0][0]
    expect(cmd.type).toBe('UPDATE_THEME')
    expect(cmd.theme.font).toBeDefined()
    const nodeCmds = mockDispatch.mock.calls.map((c) => c[0]).filter((c) => c.type === 'SET_NODE_STYLES')
    expect(nodeCmds.length).toBeGreaterThan(0)
  })

  it('Color Palette Apply dispatches UPDATE_THEME', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-colors"]') as Element)
    const applyBtn = container.querySelector('[data-category="colors"] [data-testid="ds-btn-apply"]') as HTMLButtonElement
    fireEvent.click(applyBtn)
    expect(mockDispatch).toHaveBeenCalledTimes(1)
    const cmd = mockDispatch.mock.calls[0][0]
    expect(cmd.type).toBe('UPDATE_THEME')
    expect(cmd.theme.primaryColor).toBeDefined()
  })

  it('Button Apply dispatches UPDATE_THEME', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-buttons"]') as Element)
    const applyBtn = container.querySelector('[data-category="buttons"] [data-testid="ds-btn-apply"]') as HTMLButtonElement
    fireEvent.click(applyBtn)
    expect(mockDispatch).toHaveBeenCalledTimes(1)
    const cmd = mockDispatch.mock.calls[0][0]
    expect(cmd.type).toBe('UPDATE_THEME')
  })

  it('Card Apply dispatches UPDATE_THEME', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-cards"]') as Element)
    const applyBtn = container.querySelector('[data-category="cards"] [data-testid="ds-btn-apply"]') as HTMLButtonElement
    fireEvent.click(applyBtn)
    expect(mockDispatch).toHaveBeenCalledTimes(1)
    const cmd = mockDispatch.mock.calls[0][0]
    expect(cmd.type).toBe('UPDATE_THEME')
  })

  it('Background Apply dispatches UPDATE_THEME', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-backgrounds"]') as Element)
    const applyBtn = container.querySelector('[data-category="backgrounds"] [data-testid="ds-btn-apply"]') as HTMLButtonElement
    fireEvent.click(applyBtn)
    expect(mockDispatch).toHaveBeenCalledTimes(1)
    const cmd = mockDispatch.mock.calls[0][0]
    expect(cmd.type).toBe('UPDATE_THEME')
  })

  it('Radius Apply dispatches UPDATE_THEME', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-radius"]') as Element)
    const applyBtn = container.querySelector('[data-category="radius"] [data-testid="ds-btn-apply"]') as HTMLButtonElement
    fireEvent.click(applyBtn)
    expect(mockDispatch).toHaveBeenCalledTimes(1)
    const cmd = mockDispatch.mock.calls[0][0]
    expect(cmd.type).toBe('UPDATE_THEME')
  })

  it('Shadow Apply dispatches UPDATE_THEME', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-shadows"]') as Element)
    const applyBtn = container.querySelector('[data-category="shadows"] [data-testid="ds-btn-apply"]') as HTMLButtonElement
    fireEvent.click(applyBtn)
    expect(mockDispatch).toHaveBeenCalledTimes(1)
    const cmd = mockDispatch.mock.calls[0][0]
    expect(cmd.type).toBe('UPDATE_THEME')
  })

  it('Spacing Apply dispatches UPDATE_THEME', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-spacing"]') as Element)
    const applyBtn = container.querySelector('[data-category="spacing"] [data-testid="ds-btn-apply"]') as HTMLButtonElement
    fireEvent.click(applyBtn)
    expect(mockDispatch).toHaveBeenCalledTimes(1)
    const cmd = mockDispatch.mock.calls[0][0]
    expect(cmd.type).toBe('UPDATE_THEME')
  })

  it('Industry Preset Apply dispatches UPDATE_THEME', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-industry-presets"]') as Element)
    const applyBtn = container.querySelector('[data-category="industry-presets"] [data-testid="ds-btn-apply"]') as HTMLButtonElement
    fireEvent.click(applyBtn)
    expect(mockDispatch).toHaveBeenCalled()
    const cmd = mockDispatch.mock.calls[0][0]
    expect(cmd.type).toBe('UPDATE_THEME')
  })

  it('Design Combination Apply dispatches UPDATE_THEME', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-cat-design-combinations"]') as Element)
    const applyBtn = container.querySelector('[data-category="design-combinations"] [data-testid="ds-btn-apply"]') as HTMLButtonElement
    fireEvent.click(applyBtn)
    expect(mockDispatch).toHaveBeenCalled()
    const cmd = mockDispatch.mock.calls[0][0]
    expect(cmd.type).toBe('UPDATE_THEME')
  })
})
