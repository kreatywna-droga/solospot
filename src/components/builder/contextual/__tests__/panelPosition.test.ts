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
  getViewportBounds,
  intersectBounds,
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

describe('intersectBounds — workspace ∩ viewport (PHASE 3–5)', () => {
  const viewport = bounds(0, 0, 1920, 1080)

  it('returns the workspace unchanged when it is fully inside the viewport', () => {
    const ws = bounds(320, 56, 1600, 1040)
    expect(intersectBounds(ws, viewport)).toEqual(ws)
  })

  it('clips a workspace that overflows the right/bottom viewport edges', () => {
    // Real-world case observed in the production Builder: the workspace <main>
    // extended to x=1952 / y=1128, i.e. beyond a 1920x1080 viewport.
    const ws = bounds(648, 144, 1952, 1128)
    const effective = intersectBounds(ws, viewport)
    expect(effective).not.toBeNull()
    expect(effective!.right).toBe(1920)
    expect(effective!.bottom).toBe(1080)
    expect(effective!.width).toBe(1272)
    expect(effective!.height).toBe(936)
  })

  it('clips a workspace shifted past the left/top viewport edges', () => {
    const ws = bounds(-200, -50, 1000, 900)
    const effective = intersectBounds(ws, viewport)
    expect(effective!.left).toBe(0)
    expect(effective!.top).toBe(0)
  })

  it('returns null when the rects do not overlap at all', () => {
    expect(intersectBounds(bounds(2000, 0, 2400, 500), viewport)).toBeNull()
    expect(intersectBounds(bounds(0, 1200, 500, 1500), viewport)).toBeNull()
  })

  it('keeps the clamped panel on screen for an overflowing workspace', () => {
    // Panel anchored to an element near the overflowing right edge
    const ws = bounds(648, 144, 1952, 1128)
    const effective = intersectBounds(ws, viewport)!
    const pos = computePanelPosition(rect(1000, 300, 604, 200), effective)
    // 1920 - 320 - 16 = 1584 → panel right edge 1904 <= 1920
    expect(pos.x).toBeLessThanOrEqual(1584)
    expect(pos.x + PANEL_W).toBeLessThanOrEqual(viewport.right - MARGIN)
    expect(pos.y + pos.maxHeight).toBeLessThanOrEqual(viewport.bottom - MARGIN)
    expectInsideWorkspace(pos, effective)
  })
})

describe('getViewportBounds', () => {
  it('is zeroed outside a browser environment', () => {
    const v = getViewportBounds()
    expect(v.left).toBe(0)
    expect(v.top).toBe(0)
    expect(v.width).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// Mini Inspector AI panel (360px) — anchor + collision edge cases
// ---------------------------------------------------------------------------

describe('computePanelPosition — Mini Inspector AI (panelWidth 360)', () => {
  const AI_W = 360
  const opts = { panelWidth: AI_W, panelMinHeight: 220, gap: 12, viewportMargin: 16 }

  function expectInside(pos: { x: number; y: number; maxHeight: number }, b: WorkspaceBounds) {
    expect(pos.x).toBeGreaterThanOrEqual(b.left + MARGIN)
    expect(pos.x + AI_W).toBeLessThanOrEqual(b.right - MARGIN)
    expect(pos.y).toBeGreaterThanOrEqual(b.top + MARGIN)
    expect(pos.y + pos.maxHeight).toBeLessThanOrEqual(b.bottom - MARGIN)
  }

  it('anchors RIGHT of a large mid-canvas node when space allows', () => {
    const ws = bounds(200, 56, 1600, 1040)
    const pos = computePanelPosition(rect(400, 200, 500, 300), ws, opts)
    expect(pos.placement).toBe('right')
    expect(pos.x).toBe(900 + 12)
    expect(pos.y).toBe(200)
    expectInside(pos, ws)
  })

  it('flips LEFT when the right side cannot fit a 360px panel', () => {
    // Element near right edge of a 700px workspace → right space ≪ 360
    const ws = bounds(0, 0, 700, 900)
    const pos = computePanelPosition(rect(400, 200, 200, 150), ws, opts)
    expect(pos.placement).toBe('left')
    expect(pos.x + AI_W).toBeLessThanOrEqual(400 - 12 + 0.5)
    expectInside(pos, ws)
  })

  it('clamps RIGHT when neither side fits fully (shared engine prefers side clamp)', () => {
    // Narrow workspace: element spans almost full width → no horizontal room.
    // Existing computePanelPosition contract (also used by ContextualSettingsPanel):
    // when neither side fully fits, clamp to the larger horizontal side — not below.
    const ws = bounds(0, 0, 420, 900)
    const pos = computePanelPosition(rect(20, 100, 380, 80), ws, opts)
    expect(pos.placement).toBe('right')
    expect(pos.x + AI_W).toBeLessThanOrEqual(ws.right - MARGIN)
    expectInside(pos, ws)
  })

  it('falls ABOVE when the element sits near the workspace bottom', () => {
    const ws = bounds(0, 0, 1600, 500)
    const pos = computePanelPosition(rect(400, 400, 300, 80), ws, opts)
    expect(pos.placement).toBe('above')
    expect(pos.y + opts.panelMinHeight).toBeLessThanOrEqual(400 - 12 + 0.5)
    expectInside(pos, ws)
  })

  it('clamps fully inside the workspace for a node flush against the left edge', () => {
    const ws = bounds(320, 100, 1920, 1080)
    const pos = computePanelPosition(rect(320, 400, 120, 60), ws, opts)
    expect(pos.x).toBeGreaterThanOrEqual(ws.left + MARGIN)
    expectInside(pos, ws)
  })

  it('stays finite when the workspace is smaller than the AI panel', () => {
    const ws = bounds(0, 0, 300, 300)
    const pos = computePanelPosition(rect(50, 80, 100, 60), ws, opts)
    expect(Number.isFinite(pos.x)).toBe(true)
    expect(Number.isFinite(pos.y)).toBe(true)
    expect(pos.x).toBeGreaterThanOrEqual(ws.left + MARGIN)
    expect(pos.y).toBeGreaterThanOrEqual(ws.top + MARGIN)
  })
})
