/**
 * PropertyRegistry — Sprint 7 Recovery (P1) tests
 *
 * Node environment — no jsdom. Verifies the PropertyRegistry is the
 * single source of truth for field definitions and widget bindings.
 *
 * @agent Agent 1 — Inspector Core Engineer (Sprint 7 Recovery)
 * @status IN PROGRESS — READY FOR PM26 REVIEW
 */
import { describe, it, expect } from 'vitest';
import { createPropertyFieldRegistry } from '../createPropertyFieldRegistry';
import { propertyFieldRegistry } from '../propertyFieldRegistry';
import type { PropertyFieldDefinition, WidgetComponent, WidgetType } from '../types';

function makeField(id: string, overrides: Partial<PropertyFieldDefinition> = {}): PropertyFieldDefinition {
  return {
    id,
    label: `Label ${id}`,
    description: '',
    defaultValue: undefined,
    validation: () => ({ valid: true }),
    widget: 'text',
    category: 'layout',
    ...overrides,
  };
}

const noopWidget: WidgetComponent = () => null;

describe('PropertyRegistry (factory)', () => {
  it('registers and retrieves a field by id', () => {
    const reg = createPropertyFieldRegistry();
    reg.registerField(makeField('a'));
    expect(reg.hasField('a')).toBe(true);
    expect(reg.getField('a')?.label).toBe('Label a');
  });

  it('returns undefined for unknown field id', () => {
    const reg = createPropertyFieldRegistry();
    expect(reg.getField('missing')).toBeUndefined();
    expect(reg.hasField('missing')).toBe(false);
  });

  it('unregisters a field', () => {
    const reg = createPropertyFieldRegistry();
    reg.registerField(makeField('a'));
    expect(reg.unregisterField('a')).toBe(true);
    expect(reg.hasField('a')).toBe(false);
    expect(reg.unregisterField('a')).toBe(false);
  });

  it('lists all fields', () => {
    const reg = createPropertyFieldRegistry();
    reg.registerField(makeField('a'));
    reg.registerField(makeField('b'));
    expect(reg.getAllFields().map(f => f.id).sort()).toEqual(['a', 'b']);
  });

  it('filters fields by category', () => {
    const reg = createPropertyFieldRegistry();
    reg.registerField(makeField('a', { category: 'layout' }));
    reg.registerField(makeField('b', { category: 'typography' }));
    reg.registerField(makeField('c', { category: 'layout' }));
    const layout = reg.getFieldsByCategory('layout');
    expect(layout.map(f => f.id).sort()).toEqual(['a', 'c']);
  });

  it('throws when registering a field without an id', () => {
    const reg = createPropertyFieldRegistry();
    expect(() => reg.registerField(makeField('') as PropertyFieldDefinition)).toThrow();
  });

  it('registers and retrieves a widget by type', () => {
    const reg = createPropertyFieldRegistry();
    reg.registerWidget('text', noopWidget);
    expect(reg.hasWidget('text')).toBe(true);
    expect(reg.getWidget('text')).toBe(noopWidget);
  });

  it('returns undefined for unknown widget type', () => {
    const reg = createPropertyFieldRegistry();
    expect(reg.getWidget('color')).toBeUndefined();
  });

  it('unregisters a widget', () => {
    const reg = createPropertyFieldRegistry();
    reg.registerWidget('text', noopWidget);
    expect(reg.unregisterWidget('text')).toBe(true);
    expect(reg.hasWidget('text')).toBe(false);
  });

  it('clears all fields and widgets', () => {
    const reg = createPropertyFieldRegistry();
    reg.registerField(makeField('a'));
    reg.registerWidget('text', noopWidget);
    reg.clear();
    expect(reg.getAllFields()).toHaveLength(0);
    expect(reg.hasWidget('text')).toBe(false);
  });
});

describe('propertyFieldRegistry (singleton)', () => {
  it('registers all 14 Agent 3 widgets as single source of truth', () => {
    const expected: WidgetType[] = [
      'text', 'textarea', 'number', 'range', 'color', 'select',
      'boolean', 'radio', 'spacing', 'border', 'shadow',
      'typography', 'link', 'image',
    ];
    for (const type of expected) {
      expect(propertyFieldRegistry.hasWidget(type), `missing widget: ${type}`).toBe(true);
    }
  });

  it('resolves a widget for a bound type', () => {
    const widget = propertyFieldRegistry.getWidget('text');
    expect(widget).toBeDefined();
  });
});
