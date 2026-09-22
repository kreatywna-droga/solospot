/**
 * Section actions anchoring (PHASE 10–13, 22).
 *
 * "Zapisz Experience" + "Dodaj sekcję" render as ONE group pinned to the BOTTOM
 * EDGE of the section it belongs to and centered within it. The group is shown
  * for the selected section (selected takes priority over hover) so at most
 * one dock is shown; when nothing is selected the hovered section wins.
 * Every section type (hero included) behaves identically.
 */
import { describe, it, expect } from 'vitest'
import { shouldShowSectionActions } from '../SectionActionDock'

describe('shouldShowSectionActions', () => {
  it('shows the group for the selected section', () => {
    expect(shouldShowSectionActions('sec-1', 'sec-1', null)).toBe(true)
  })

  it('shows the group for the hovered section when nothing is selected', () => {
    expect(shouldShowSectionActions('sec-2', null, 'sec-2')).toBe(true)
  })

  it('shows the group when the section is both selected and hovered', () => {
    expect(shouldShowSectionActions('sec-1', 'sec-1', 'sec-1')).toBe(true)
  })

  it('hides the group when neither selected nor hovered', () => {
    expect(shouldShowSectionActions('sec-3', null, null)).toBe(false)
  })

          
  it('hides the group for sections other than the selected one', () => {
    expect(shouldShowSectionActions('sec-2', 'sec-1', null)).toBe(false)
    expect(shouldShowSectionActions('sec-2', 'sec-1', 'sec-3')).toBe(false)
  })

  it('selected section takes priority over a hovered section (at most one dock)', () => {
    // sec-1 selected, sec-2 hovered → only sec-1 renders the dock (count === 1)
    expect(shouldShowSectionActions('sec-1', 'sec-1', 'sec-2')).toBe(true)
    expect(shouldShowSectionActions('sec-2', 'sec-1', 'sec-2')).toBe(false)
    expect(shouldShowSectionActions('sec-3', 'sec-1', 'sec-2')).toBe(false)
  })

  it('applies to every section type (id-based, hero or not)', () => {
    // The predicate is purely id-based, so hero / content / gallery sections
    // all behave identically.
    for (const id of ['sec-hero-init', 'sec-gallery', 'sec-cta']) {
      expect(shouldShowSectionActions(id, id, null)).toBe(true)
    }
  })
})
