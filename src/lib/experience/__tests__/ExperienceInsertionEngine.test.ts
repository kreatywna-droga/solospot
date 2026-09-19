import { describe, it, expect, beforeAll } from 'vitest'
import { insertExperienceIntoDocument, previewInsertion } from '../ExperienceInsertionEngine'
import { getExperienceById, getAllExperiences } from '../ExperienceCatalog'
import type { ExperienceItem } from '../ExperienceTypes'
import {
  BuilderDocument,
  createBuilderDocument,
  createBuilderNode,
} from '../../../../packages/builder-core/src/BuilderDocument'

function createSampleDocument(): BuilderDocument {
  const doc = createBuilderDocument({
    id: 'test-store',
    metadata: {
      storeName: 'Test Store',
      storeSlug: 'test-store',
      locale: 'pl',
      currency: 'PLN',
    },
  })
  const page = doc.pages[0]

  const sec1 = createBuilderNode({
    id: 'section-1',
    type: 'section',
    label: 'Section 1',
    props: { title: 'First Section' },
    children: [],
  })

  const sec2 = createBuilderNode({
    id: 'section-2',
    type: 'section',
    label: 'Section 2',
    props: { title: 'Second Section' },
    children: [],
  })

  page.sections = [sec1, sec2]
  return doc
}

describe('SoloSpot Experience Insertion Engine v2.0', () => {
  let testExperience: ExperienceItem

  beforeAll(() => {
    const all = getAllExperiences()
    testExperience = all.find(e => e.category === 'section') || all[0]
  })

  it('inserts experience with mode "add" at the end of the page', () => {
    const doc = createSampleDocument()
    const initialCount = doc.pages[0].sections.length

    const result = insertExperienceIntoDocument(doc, testExperience, {
      mode: 'add',
      pageId: doc.pages[0].id,
    })

    expect(result.success).toBe(true)
    const expNodesCount = testExperience.nodes?.length ?? 1
    expect(result.insertedNodeIds.length).toBe(expNodesCount)
    expect(result.document.pages[0].sections.length).toBe(initialCount + expNodesCount)

    // The inserted section is at the end
    const lastSection = result.document.pages[0].sections[result.document.pages[0].sections.length - 1]
    expect(result.insertedNodeIds).toContain(lastSection.id)
  })

  it('inserts experience with mode "above" before the target section', () => {
    const doc = createSampleDocument()
    const targetId = 'section-2'

    const result = insertExperienceIntoDocument(doc, testExperience, {
      mode: 'above',
      targetSectionId: targetId,
      pageId: doc.pages[0].id,
    })

    expect(result.success).toBe(true)
    const sections = result.document.pages[0].sections
    const targetIdx = sections.findIndex(s => s.id === targetId)
    const insertedIdx = sections.findIndex(s => s.id === result.primarySelectedId)

    expect(insertedIdx).toBe(targetIdx - 1)
  })

  it('inserts experience with mode "below" after the target section', () => {
    const doc = createSampleDocument()
    const targetId = 'section-1'

    const result = insertExperienceIntoDocument(doc, testExperience, {
      mode: 'below',
      targetSectionId: targetId,
      pageId: doc.pages[0].id,
    })

    expect(result.success).toBe(true)
    const sections = result.document.pages[0].sections
    const targetIdx = sections.findIndex(s => s.id === targetId)
    const insertedIdx = sections.findIndex(s => s.id === result.primarySelectedId)

    expect(insertedIdx).toBe(targetIdx + 1)
  })

  it('replaces target section with mode "replace"', () => {
    const doc = createSampleDocument()
    const targetId = 'section-2'

    const result = insertExperienceIntoDocument(doc, testExperience, {
      mode: 'replace',
      targetSectionId: targetId,
      pageId: doc.pages[0].id,
    })

    expect(result.success).toBe(true)
    const sections = result.document.pages[0].sections
    expect(sections.some(s => s.id === targetId)).toBe(false)
    expect(sections.some(s => s.id === result.primarySelectedId)).toBe(true)
  })

  it('creates a new page with mode "page"', () => {
    const doc = createSampleDocument()
    const initialPageCount = doc.pages.length

    const result = insertExperienceIntoDocument(doc, testExperience, {
      mode: 'page',
      newPageTitle: 'Nowa Strona Experience',
      newPageSlug: 'experience-page',
    })

    expect(result.success).toBe(true)
    expect(result.document.pages.length).toBe(initialPageCount + 1)

    const newPage = result.document.pages[result.document.pages.length - 1]
    expect(newPage.slug).toBe('experience-page')
    expect(newPage.sections.length).toBe(testExperience.nodes?.length ?? 1)
  })

  it('generates brand new unique IDs and does not mutate catalog templates', () => {
    const originalTemplateNodes = JSON.parse(JSON.stringify(testExperience.nodes || []))
    const doc = createSampleDocument()

    const result1 = insertExperienceIntoDocument(doc, testExperience, { mode: 'add' })
    const result2 = insertExperienceIntoDocument(result1.document, testExperience, { mode: 'add' })

    // No IDs match the original template IDs
    const templateIds = originalTemplateNodes.map((n: { id: string }) => n.id)
    expect(result1.insertedNodeIds.some(id => templateIds.includes(id))).toBe(false)
    expect(result2.insertedNodeIds.some(id => templateIds.includes(id))).toBe(false)

    // Insertion 1 and Insertion 2 have distinct IDs
    const overlap = result1.insertedNodeIds.filter(id => result2.insertedNodeIds.includes(id))
    expect(overlap.length).toBe(0)

    // Original template nodes were never mutated
    expect(testExperience.nodes || []).toEqual(originalTemplateNodes)
  })

  it('previews insertion impact safely without altering source document', () => {
    const doc = createSampleDocument()
    const preview = previewInsertion(doc, testExperience, 'add')

    expect(preview.mode).toBe('add')
    expect(preview.impact.nodesAdded).toBe(testExperience.nodes?.length ?? 1)
    expect(preview.impact.targetPageTitle).toBe(doc.pages[0].name)
  })
})
