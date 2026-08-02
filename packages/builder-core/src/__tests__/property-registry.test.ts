/**
 * PropertyRegistry — Unit Tests
 *
 * Tests the PropertyFieldRegistry:
 *   - register / get / has / unregister
 *   - chaining
 *   - fallback renderer
 *   - error on invalid type
 *   - entries listing
 */

import { describe, it, expect, vi } from 'vitest'
import { createPropertyFieldRegistry } from '../PropertyRegistry'
import type { FieldRenderer, FieldRendererProps } from '../PropertyRegistry'

// ---------------------------------------------------------------------------
// Mock renderers
// ---------------------------------------------------------------------------

function MockStringField(_props: FieldRendererProps) {
  return null
}

function MockNumberField(_props: FieldRendererProps) {
  return null
}

function MockBooleanField(_props: FieldRendererProps) {
  return null
}

function MockFallback(_props: FieldRendererProps) {
  return null
}

function MockCustomField(_props: FieldRendererProps) {
  return null
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PropertyFieldRegistry', () => {
  it('registers and retrieves a renderer', () => {
    const registry = createPropertyFieldRegistry()
    registry.register('string', MockStringField)
    expect(registry.get('string')).toBe(MockStringField)
  })

  it('returns undefined for unregistered type', () => {
    const registry = createPropertyFieldRegistry()
    expect(registry.get('nonexistent')).toBeUndefined()
  })

  it('checks existence with has()', () => {
    const registry = createPropertyFieldRegistry()
    registry.register('string', MockStringField)
    expect(registry.has('string')).toBe(true)
    expect(registry.has('number')).toBe(false)
  })

  it('unregisters a renderer', () => {
    const registry = createPropertyFieldRegistry()
    registry.register('string', MockStringField)
    expect(registry.unregister('string')).toBe(true)
    expect(registry.get('string')).toBeUndefined()
  })

  it('returns false when unregistering unknown type', () => {
    const registry = createPropertyFieldRegistry()
    expect(registry.unregister('ghost')).toBe(false)
  })

  it('supports method chaining on register()', () => {
    const registry = createPropertyFieldRegistry()
    registry
      .register('string', MockStringField)
      .register('number', MockNumberField)
      .register('boolean', MockBooleanField)

    expect(registry.get('string')).toBe(MockStringField)
    expect(registry.get('number')).toBe(MockNumberField)
    expect(registry.get('boolean')).toBe(MockBooleanField)
  })

  it('returns all registered entries', () => {
    const registry = createPropertyFieldRegistry()
    registry.register('string', MockStringField)
    registry.register('boolean', MockBooleanField)

    const entries = registry.entries()
    expect(entries).toHaveLength(2)
    expect(entries).toContainEqual(['string', MockStringField])
    expect(entries).toContainEqual(['boolean', MockBooleanField])
  })

  it('overwrites existing registration silently', () => {
    const registry = createPropertyFieldRegistry()
    registry.register('string', MockStringField)
    registry.register('string', MockNumberField)
    expect(registry.get('string')).toBe(MockNumberField)
  })

  it('throws on invalid type (empty string)', () => {
    const registry = createPropertyFieldRegistry()
    expect(() => registry.register('', MockStringField)).toThrow()
  })

  it('throws on non-string type', () => {
    const registry = createPropertyFieldRegistry()
    expect(() => registry.register(null as unknown as string, MockStringField)).toThrow()
  })

  it('returns fallback renderer for unregistered types', () => {
    const registry = createPropertyFieldRegistry()
    registry.setFallback(MockFallback)

    expect(registry.get('unknown-type')).toBe(MockFallback)
    expect(registry.get('also-unknown')).toBe(MockFallback)
  })

  it('returns undefined for unregistered type after fallback removed', () => {
    const registry = createPropertyFieldRegistry()
    registry.setFallback(MockFallback)
    registry.setFallback(null)
    expect(registry.get('unknown')).toBeUndefined()
  })

  it('getFallback() returns current fallback', () => {
    const registry = createPropertyFieldRegistry()
    expect(registry.getFallback()).toBeNull()
    registry.setFallback(MockFallback)
    expect(registry.getFallback()).toBe(MockFallback)
  })

  it('fallback does not override explicitly registered renderer', () => {
    const registry = createPropertyFieldRegistry()
    registry.register('custom', MockCustomField)
    registry.setFallback(MockFallback)

    expect(registry.get('custom')).toBe(MockCustomField)
    expect(registry.get('custom')).not.toBe(MockFallback)
  })
})

