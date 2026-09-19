import { describe, it, expect, beforeEach } from 'vitest'
import {
  getAllExperiences,
  getExperienceById,
  getExperiencesByCategory,
  filterExperiences,
  toggleFavoriteExperience,
  isFavoriteExperience,
  trackRecentExperience,
  getRecentExperienceIds,
  getFavoriteExperienceIds,
  clearExperienceStorageForTesting,
} from '../ExperienceCatalog'
import { validateExperienceItem } from '../ExperienceCompatibility'

describe('SoloSpot Experience Catalog v2.0', () => {
  beforeEach(() => {
    clearExperienceStorageForTesting()
  })

  it('contains at least 250 total authentic experiences (surpassing target of 145)', () => {
    const all = getAllExperiences()
    expect(all.length).toBeGreaterThanOrEqual(250)
  })

  it('exceeds all required category inventory thresholds', () => {
    const all = getAllExperiences()
    const websites = all.filter(e => e.type === 'website' || e.category === 'website')
    const heroes = all.filter(e => e.type === 'hero' || e.category === 'hero')
    const sections = all.filter(e => e.type === 'section')
    const interactive = all.filter(e => e.type === 'interactive' || e.category === 'interactive')
    const backgrounds = all.filter(e => e.type === 'background' || e.category === 'background')
    const effects = all.filter(e => e.type === 'effect' || e.category === 'effect')
    const motion = all.filter(e => e.type === 'motion' || e.category === 'motion-3d')

    // Thresholds from spec: Websites >= 12, Heroes >= 20, Sections >= 50, Interactive >= 20, Backgrounds >= 20, Effects >= 15, Motion >= 8
    expect(websites.length).toBeGreaterThanOrEqual(12)
    expect(heroes.length).toBeGreaterThanOrEqual(20)
    expect(sections.length).toBeGreaterThanOrEqual(50)
    expect(interactive.length).toBeGreaterThanOrEqual(20)
    expect(backgrounds.length).toBeGreaterThanOrEqual(20)
    expect(effects.length).toBeGreaterThanOrEqual(15)
    expect(motion.length).toBeGreaterThanOrEqual(8)
  })

  it('ensures all experiences have unique IDs and conform strictly to schema v2.0.0', () => {
    const all = getAllExperiences()
    const ids = new Set<string>()

    for (const exp of all) {
      expect(ids.has(exp.id)).toBe(false)
      ids.add(exp.id)

      expect(validateExperienceItem(exp)).toBe(true)
      expect(exp.schemaVersion).toBe('2.0.0')
      expect(exp.name.length).toBeGreaterThan(0)
      expect(exp.description.length).toBeGreaterThan(0)
      expect(Array.isArray(exp.tags)).toBe(true)
      expect(typeof exp.createNode).toBe('function')
    }
  })

  it('retrieves an experience by id correctly', () => {
    const all = getAllExperiences()
    const first = all[0]
    const fetched = getExperienceById(first.id)
    expect(fetched).toBeDefined()
    expect(fetched?.id).toBe(first.id)
    expect(fetched?.title).toBe(first.title)
  })

  it('filters experiences by search query, mood, motion, and industry', () => {
    // Search query
    const searchResults = filterExperiences({ query: 'cyber' })
    expect(searchResults.length).toBeGreaterThan(0)

    // Filter by mood
    const luxuryResults = filterExperiences({ mood: 'luxury' })
    expect(luxuryResults.length).toBeGreaterThan(0)
    expect(luxuryResults.every(e => e.mood === 'luxury')).toBe(true)

    // Filter by motion
    const subtleMotion = filterExperiences({ motion: 'subtle' })
    expect(subtleMotion.length).toBeGreaterThan(0)
    expect(subtleMotion.every(e => e.motionLevel === 'subtle' || e.motion === 'subtle')).toBe(true)

    // Filter by category
    const backgrounds = filterExperiences({ category: 'background' })
    expect(backgrounds.length).toBeGreaterThanOrEqual(20)
    expect(backgrounds.every(e => e.category === 'background')).toBe(true)
  })

  it('handles favorites toggle and persistence', () => {
    const testId = 'exp-hero-mesh-dark'
    expect(isFavoriteExperience(testId)).toBe(false)

    toggleFavoriteExperience(testId)
    expect(isFavoriteExperience(testId)).toBe(true)
    expect(getFavoriteExperienceIds()).toContain(testId)

    toggleFavoriteExperience(testId)
    expect(isFavoriteExperience(testId)).toBe(false)
    expect(getFavoriteExperienceIds()).not.toContain(testId)
  })

  it('tracks recently used experiences in order', () => {
    trackRecentExperience('exp-1')
    trackRecentExperience('exp-2')
    trackRecentExperience('exp-3')

    const recents = getRecentExperienceIds()
    expect(recents[0]).toBe('exp-3')
    expect(recents[1]).toBe('exp-2')
    expect(recents[2]).toBe('exp-1')
  })
})
