import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveUserExperience,
  getUserExperiences,
  deleteUserExperience,
  duplicateUserExperience,
  getExperienceById,
  clearExperienceStorageForTesting,
} from '../ExperienceCatalog'
import { validateExperienceItem } from '../ExperienceCompatibility'
import { createBuilderNode } from '../../../../packages/builder-core/src'

describe('SoloSpot User-Saved Experience Lifecycle v2.0', () => {
  beforeEach(() => {
    clearExperienceStorageForTesting()
  })

  it('saves a custom experience created by user and persists to storage', () => {
    const customNode = createBuilderNode({
      id: 'custom-hero-1',
      type: 'section',
      label: 'My Custom Dark Hero',
      props: {
        headline: 'Next-Gen AI Platform',
        badge: 'NEW RELEASE',
      },
      styles: {
        backgroundColor: '#09090b',
        paddingTop: '80px',
        paddingBottom: '80px',
      },
      children: [],
    })

    const saved = saveUserExperience({
      title: 'Dark Neo-Brutalist Hero',
      description: 'Ultra dark futuristic hero section with custom badges',
      category: 'hero',
      nodes: [customNode],
      tags: ['dark', 'futuristic', 'custom'],
      mood: 'futuristic',
      motion: 'subtle',
      industry: 'technology',
    })

    expect(saved.id.startsWith('usr-exp-')).toBe(true)
    expect(saved.title).toBe('Dark Neo-Brutalist Hero')
    expect(saved.author).toBe('Użytkownik')
    expect(saved.category).toBe('hero')
    expect(saved.nodes?.length).toBe(1)

    // Verify it is retrievable via getUserExperiences
    const userExps = getUserExperiences()
    expect(userExps.length).toBe(1)
    expect(userExps[0].id).toBe(saved.id)

    // Verify it passes full schema validation
    expect(validateExperienceItem(saved)).toBe(true)
  })

  it('retrieves user-saved experience by ID from catalog', () => {
    const saved = saveUserExperience({
      title: 'Newsletter Box',
      description: 'Minimal email capture',
      category: 'interactive',
      nodes: [
        createBuilderNode({
          id: 'nl-1',
          type: 'container',
          label: 'Newsletter',
          props: {},
          children: [],
        }),
      ],
      tags: ['newsletter', 'lead'],
      mood: 'minimal',
      motion: 'static',
      industry: 'general',
    })

    const fetched = getExperienceById(saved.id)
    expect(fetched).toBeDefined()
    expect(fetched?.title).toBe('Newsletter Box')
  })

  it('duplicates an existing user-saved experience', () => {
    const original = saveUserExperience({
      title: 'Interactive 3D Carousel',
      description: '3D rotating cards',
      category: 'motion-3d',
      nodes: [
        createBuilderNode({
          id: 'card-1',
          type: 'section',
          label: 'Card',
          props: {},
          children: [],
        }),
      ],
      tags: ['3d', 'carousel'],
      mood: 'bold',
      motion: 'cinematic',
      industry: 'creative',
    })

    const duplicated = duplicateUserExperience(original.id)
    expect(duplicated).toBeDefined()
    expect(duplicated?.id).not.toBe(original.id)
    expect(duplicated?.title).toContain('Interactive 3D Carousel (Kopia)')

    const userExps = getUserExperiences()
    expect(userExps.length).toBe(2)
  })

  it('deletes a user-saved experience', () => {
    const saved1 = saveUserExperience({
      title: 'Exp 1',
      description: 'Test 1',
      category: 'section',
      nodes: [createBuilderNode({ id: 's1', type: 'section', label: 'S1', props: {}, children: [] })],
      tags: [],
      mood: 'corporate',
      motion: 'static',
      industry: 'general',
    })

    const saved2 = saveUserExperience({
      title: 'Exp 2',
      description: 'Test 2',
      category: 'section',
      nodes: [createBuilderNode({ id: 's2', type: 'section', label: 'S2', props: {}, children: [] })],
      tags: [],
      mood: 'corporate',
      motion: 'static',
      industry: 'general',
    })

    expect(getUserExperiences().length).toBe(2)

    const deleteSuccess = deleteUserExperience(saved1.id)
    expect(deleteSuccess).toBe(true)

    const remaining = getUserExperiences()
    expect(remaining.length).toBe(1)
    expect(remaining[0].id).toBe(saved2.id)
  })
})
