/**
 * SectionActionDock target resolution (PHASE 10–13, 22).
 *
 * The dock renders "Zapisz Experience" + "Dodaj sekcję" as ONE group anchored
 * to the workspace (centered, 24px above the bottom edge). The actions target
 * the selected section; the hovered section is used only when nothing is
 * selected — so the actions never disappear while a section is selected.
 */
import { describe, it, expect } from 'vitest'
import { resolveDockTarget } from '../SectionActionDock'

const SECTIONS = ['sec-1', 'sec-2', 'sec-3']

describe('resolveDockTarget', () => {
  it('selected section wins over hovered', () => {
    expect(resolveDockTarget('sec-2', 'sec-3', SECTIONS)).toEqual({ id: 'sec-2', index: 1 })
  })

  it('falls back to hovered section when nothing is selected', () => {
    expect(resolveDockTarget(null, 'sec-3', SECTIONS)).toEqual({ id: 'sec-3', index: 2 })
  })

  it('returns null when neither selected nor hovered', () => {
    expect(resolveDockTarget(null, null, SECTIONS)).toBeNull()
  })

  it('returns null when the id is not a section (e.g. inner element selected)', () => {
    expect(resolveDockTarget('el-99', null, SECTIONS)).toBeNull()
    expect(resolveDockTarget(null, 'el-99', SECTIONS)).toBeNull()
  })

  it('returns null for an empty section list', () => {
    expect(resolveDockTarget('sec-1', null, [])).toBeNull()
  })
})
