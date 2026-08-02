/**
 * InspectorRuntime — Unit Tests
 *
 * Tests the pure InspectorRuntime engine:
 *   - Validation (required, min/max, length, color format, options)
 *   - Category organization from schema.group
 *   - Default values application
 *   - Property command creation
 */

import { describe, it, expect } from 'vitest'
import { InspectorRuntime } from '../InspectorRuntime'
import type { PropSchema } from '../ComponentRegistry'
import type { BuilderCommand } from '../BuilderCommands'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeField(overrides: Partial<PropSchema> & { key: string; label: string; type: PropSchema['type'] }): PropSchema {
  return overrides as PropSchema
}

// ---------------------------------------------------------------------------
// Validation Tests
// ---------------------------------------------------------------------------

describe('InspectorRuntime.validateValue', () => {
  it('returns invalid for required empty string', () => {
    const schema = makeField({ key: 'title', label: 'Title', type: 'string', required: true })
    const result = InspectorRuntime.validateValue(schema, '')
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe('REQUIRED')
  })

  it('returns invalid for required undefined', () => {
    const schema = makeField({ key: 'title', label: 'Title', type: 'string', required: true })
    const result = InspectorRuntime.validateValue(schema, undefined)
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe('REQUIRED')
  })

  it('validates number min', () => {
    const schema = makeField({ key: 'count', label: 'Count', type: 'number', required: true, min: 5 })
    const result = InspectorRuntime.validateValue(schema, 2)
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe('MIN_VALUE')
  })

  it('validates number max', () => {
    const schema = makeField({ key: 'count', label: 'Count', type: 'number', required: true, max: 10 })
    const result = InspectorRuntime.validateValue(schema, 15)
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe('MAX_VALUE')
  })

  it('passes valid number', () => {
    const schema = makeField({ key: 'count', label: 'Count', type: 'number', required: true, min: 0, max: 100 })
    const result = InspectorRuntime.validateValue(schema, 50)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('validates string maxLength', () => {
    const schema = makeField({ key: 'name', label: 'Name', type: 'string', maxLength: 10 } as any)
    const result = InspectorRuntime.validateValue(schema, 'more than ten!!')
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe('MAX_LENGTH')
  })

  it('validates color format', () => {
    const schema = makeField({ key: 'color', label: 'Color', type: 'color' })
    const invalid = InspectorRuntime.validateValue(schema, 'not-a-color')
    expect(invalid.valid).toBe(false)
    expect(invalid.errors[0].code).toBe('INVALID_FORMAT')

    const valid = InspectorRuntime.validateValue(schema, '#7c3aed')
    expect(valid.valid).toBe(true)
  })

  it('validates select options', () => {
    const schema = makeField({
      key: 'align',
      label: 'Align',
      type: 'select',
      options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }],
    } as any)
    const result = InspectorRuntime.validateValue(schema, 'right')
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe('INVALID_OPTION')
  })

  it('passes valid select value', () => {
    const schema = makeField({
      key: 'align',
      label: 'Align',
      type: 'select',
      options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }],
    } as any)
    const result = InspectorRuntime.validateValue(schema, 'left')
    expect(result.valid).toBe(true)
  })

  it('passes optional empty value', () => {
    const schema = makeField({ key: 'desc', label: 'Desc', type: 'string', required: false })
    expect(InspectorRuntime.validateValue(schema, '').valid).toBe(true)
    expect(InspectorRuntime.validateValue(schema, undefined).valid).toBe(true)
    expect(InspectorRuntime.validateValue(schema, null).valid).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Category Organization Tests
// ---------------------------------------------------------------------------

describe('InspectorRuntime.organizeByCategory', () => {
  it('organizes fields by group', () => {
    const schema: PropSchema[] = [
      makeField({ key: 'title', label: 'Title', type: 'string', group: 'content' }),
      makeField({ key: 'padding', label: 'Padding', type: 'number', group: 'spacing' }),
      makeField({ key: 'fontSize', label: 'Font Size', type: 'number', group: 'typography' }),
    ]

    const categories = InspectorRuntime.organizeByCategory(schema)
    expect(categories).toHaveLength(3)
    expect(categories[0].label).toBe('Treść')       // content
    expect(categories[1].label).toBe('Odstępy')      // spacing
    expect(categories[2].label).toBe('Typografia')   // typography
  })

  it('puts ungrouped fields into General', () => {
    const schema: PropSchema[] = [
      makeField({ key: 'title', label: 'Title', type: 'string' }),
    ]

    const categories = InspectorRuntime.organizeByCategory(schema)
    expect(categories).toHaveLength(1)
    expect(categories[0].label).toBe('Ogólne')
    expect(categories[0].groups[0].fields).toHaveLength(1)
  })

  it('follows defined category order', () => {
    const schema: PropSchema[] = [
      makeField({ key: 'a', label: 'A', type: 'string', group: 'advanced' }),
      makeField({ key: 'b', label: 'B', type: 'string', group: 'content' }),
      makeField({ key: 'c', label: 'C', type: 'string', group: 'typography' }),
    ]

    const categories = InspectorRuntime.organizeByCategory(schema)
    const order = categories.map(c => c.id)
    expect(order).toEqual(['content', 'typography', 'advanced'])
  })
})

// ---------------------------------------------------------------------------
// Default Values Tests
// ---------------------------------------------------------------------------

describe('InspectorRuntime.applyDefaults', () => {
  it('fills missing defaults', () => {
    const schema: PropSchema[] = [
      makeField({ key: 'title', label: 'Title', type: 'string', defaultValue: 'Default Title' } as any),
      makeField({ key: 'count', label: 'Count', type: 'number', defaultValue: 0 } as any),
    ]

    const result = InspectorRuntime.applyDefaults(schema, {})
    expect(result.title).toBe('Default Title')
    expect(result.count).toBe(0)
  })

  it('does not override existing values', () => {
    const schema: PropSchema[] = [
      makeField({ key: 'title', label: 'Title', type: 'string', defaultValue: 'Default' } as any),
    ]

    const result = InspectorRuntime.applyDefaults(schema, { title: 'Existing' })
    expect(result.title).toBe('Existing')
  })
})

// ---------------------------------------------------------------------------
// Property Command Tests
// ---------------------------------------------------------------------------

describe('InspectorRuntime.createPropertyCommand', () => {
  it('creates UPDATE_PROPS command for valid value', () => {
    const schema = makeField({ key: 'title', label: 'Title', type: 'string' })
    const cmd = InspectorRuntime.createPropertyCommand('page1', 'sec1', schema, 'Hello')

    expect(cmd).not.toBeNull()
    expect(cmd!.type).toBe('UPDATE_PROPS')
    if (cmd && cmd.type === 'UPDATE_PROPS') {
      expect(cmd.pageId).toBe('page1')
      expect(cmd.sectionId).toBe('sec1')
      expect(cmd.props).toEqual({ title: 'Hello' })
    }
  })

  it('returns null for invalid value', () => {
    const schema = makeField({ key: 'color', label: 'Color', type: 'color', required: true })
    const cmd = InspectorRuntime.createPropertyCommand('page1', 'sec1', schema, 'bad-color')
    expect(cmd).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Category Label Tests
// ---------------------------------------------------------------------------

describe('InspectorRuntime.categoryLabel', () => {
  it('returns Polish labels for known categories', () => {
    expect(InspectorRuntime.categoryLabel('content')).toBe('Treść')
    expect(InspectorRuntime.categoryLabel('layout')).toBe('Układ')
    expect(InspectorRuntime.categoryLabel('spacing')).toBe('Odstępy')
    expect(InspectorRuntime.categoryLabel('typography')).toBe('Typografia')
    expect(InspectorRuntime.categoryLabel('background')).toBe('Tło')
    expect(InspectorRuntime.categoryLabel('border')).toBe('Obramowanie')
    expect(InspectorRuntime.categoryLabel('shadow')).toBe('Cień')
    expect(InspectorRuntime.categoryLabel('effects')).toBe('Efekty')
    expect(InspectorRuntime.categoryLabel('animation')).toBe('Animacja')
    expect(InspectorRuntime.categoryLabel('responsive')).toBe('Responsywność')
    expect(InspectorRuntime.categoryLabel('seo')).toBe('SEO')
    expect(InspectorRuntime.categoryLabel('accessibility')).toBe('Dostępność')
    expect(InspectorRuntime.categoryLabel('advanced')).toBe('Zaawansowane')
  })

  it('capitalizes unknown category IDs', () => {
    expect(InspectorRuntime.categoryLabel('custom')).toBe('CSS')
    expect(InspectorRuntime.categoryLabel('my-section')).toBe('My-section')
  })
})

