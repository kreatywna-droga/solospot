/**
 * Panel position engine — workspace bounds & clamping (PHASE 3–6, 22).
 *
 * Bounds model the Builder workspace (<main data-builder-workspace>):
 * panels must stay fully inside them with a 16px margin, keep their
 * anchoring to the source element, and shrink via maxHeight + internal
 * scroll instead of leaving the workspace.
 */
import { describe, it, expect } from 'vitest'
import {
  computePanelPosition,
  getWorkspaceBounds,
  type WorkspaceBounds,
  type ElementRect,
} from '../usePanelPosition'

const MARGIN = 16
const PANEL_W = 320

function bounds(left: number, top: number, right: number, bottom: number): WorkspaceBounds {
  return { left, top, right, bottom, width: right - left, height: bottom - top }
}

function rect(x: number, y: number, width: number, height: number): ElementRect {
  return { x, y, width, height }
}

/** Panel is fully inside bounds (using maxHeight as the worst-case height). */
function expectInsideWorkspace(
  pos: { x: number; y: number; maxHeight: number },
  b: WorkspaceBounds
) {
  expect(pos.x).toBeGreaterThanOrEqual(b.left + MARGIN)
  expect(pos.x + PANEL_W).toBeLessThanOrEqual(b.right - MARGIN)
  expect(pos.y).toBeGreaterThanOrEqual(b.top + MARGIN)
  expect(pos.y + pos.maxHeight).toBeLessThanOrEqual(b.bottom - MARGIN)
  expect(pos.maxHeight).toBeLessThanOrEqual(b.height - MARGIN * 2)
}

describe('computePanelPosition — anchoring', () => {
  const ws = bounds(0, 0, 1600, 900)

  it('prefers the right side of the element when space allows', () => {
    const pos = computePanelPosition(rect(400, 300, 200, 100), ws)
    expect(pos.placement).toBe('right')
    expect(pos.x).toBe(600 + 12) // element right edge + gap
    expect(pos.y).toBe(300) // aligned with element top
    expectInsideWorkspace(pos, ws)
  })

  it('opens on the left when the right side does not fit', () => {
    const pos = computePanelPosition(rect(1200, 300, 200, 100), ws)
    expect(pos.placement).toBe('left')
    expect(pos.x).toBe(1200 - PANEL_W - 12)
    expectInsideWorkspace(pos, ws)
  })

  it('keeps the full panel height when vertical room allows', () => {
    const pos = computePanelPosition(rect(400, 100, 200, 100), ws)
    expect(pos.placement).toBe('right')
    expect(pos.maxHeight).toBe(900 - MARGIN - 100)
    expectInsideWorkspace(pos, ws)
  })
})

describe('computePanelPosition — horizontal clamp (PHASE 5)', () => {
  it('clamps to the right workspace edge when neither side fits', () => {
    const ws = bounds(0, 0, 600, 900)
    const pos = computePanelPosition(rect(250, 300, 100, 100), ws)
    expect(pos.placement).toBe('right')
    expect(pos.x + PANEL_W).toBeLessThanOrEqual(ws.right - MARGIN)
    expectInsideWorkspace(pos, ws)
  })

  it('clamps to the left workspace edge', () => {
    const ws = bounds(0, 0, 600, 900)
    const pos = computePanelPosition(rect(140, 300, 400, 100), ws)
    expect(pos.placement).toBe('left')
    expect(pos.x).toBeGreaterThanOrEqual(ws.left + MARGIN)
    expectInsideWorkspace(pos, ws)
  })

  it('respects a workspace offset by sidebars (left/top origin)', () => {
    const ws = bounds(320, 100, 1600, 900)
    const pos = computePanelPosition(rect(340, 300, 700, 100), ws)
    expectInsideWorkspace(pos, ws)
  })
})

describe('computePanelPosition — vertical clamp (PHASE 6)', () => {
  const ws = bounds(0, 0, 1600, 900)

  it('flips above the element when bottom room is too small', () => {
    const pos = computePanelPosition(rect(400, 800, 200, 80), ws)
    expect(pos.placement).toBe('above')
    expect(pos.y).toBeGreaterThanOrEqual(ws.top + MARGIN)
    expectInsideWorkspace(pos, ws)
  })

  it('never lets the panel bottom cross the workspace bottom edge', () => {
    const pos = computePanelPosition(rect(400, 700, 200, 100), ws)
    expect(pos.y + pos.maxHeight).toBeLessThanOrEqual(ws.bottom - MARGIN)
    expectInsideWorkspace(pos, ws)
  })

  it('keeps a usable minimum height even in cramped vertical space', () => {
    const pos = computePanelPosition(rect(400, 100, 200, 700), ws)
    expect(pos.maxHeight).toBeGreaterThanOrEqual(200)
    expectInsideWorkspace(pos, ws)
  })

  it('caps maxHeight to workspace height minus margins', () => {
    const pos = computePanelPosition(rect(400, 40, 200, 100), ws)
    expect(pos.maxHeight).toBeLessThanOrEqual(ws.height - MARGIN * 2)
    expectInsideWorkspace(pos, ws)
  })
})

describe('computePanelPosition — degenerate workspaces', () => {
  it('stays finite and inside when the workspace is narrower than the panel', () => {
    const ws = bounds(0, 0, 280, 400)
    const pos = computePanelPosition(rect(50, 100, 100, 50), ws)
    expect(Number.isFinite(pos.x)).toBe(true)
    expect(Number.isFinite(pos.y)).toBe(true)
    expect(pos.x).toBeGreaterThanOrEqual(ws.left + MARGIN)
    expect(pos.y).toBeGreaterThanOrEqual(ws.top + MARGIN)
  })

  it('handles elements partially outside the workspace', () => {
    const ws = bounds(0, 0, 1600, 900)
    const pos = computePanelPosition(rect(1550, 850, 200, 200), ws)
    expectInsideWorkspace(pos, ws)
  })
})

describe('getWorkspaceBounds', () => {
  it('falls back to an empty rect when no DOM is available', () => {
    // Node environment: no window/document → zeroed viewport fallback
    const b = getWorkspaceBounds()
    expect(b.width).toBeGreaterThanOrEqual(0)
    expect(b.height).toBeGreaterThanOrEqual(0)
  })
})
