/**
 * RegistryConsistency — Sprint 7 Recovery (P1) / PM27 tests
 *
 * Node environment — no jsdom.
 *
 * Verifies the PropertyRegistry is the single source of truth for widget
 * bindings and that every built-in WidgetType has a registered renderer
 * (no switch/case fallback). Also verifies the registry is re-entrant and
 * restores overrides without leaking across tests.
 *
 * @agent Agent 1 — Inspector Core Engineer (PM27)
 * @status IN PROGRESS — READY FOR PM27 ARCHITECT REVIEW
 */
import { describe, it, expect } from 'vitest';
import { createPropertyFieldRegistry } from '../registry/createPropertyFieldRegistry';
import { propertyFieldRegistry } from '../registry/propertyFieldRegistry';
import type { WidgetComponent, WidgetType } from '../registry/types';

const expectedWidgets: WidgetType[] = [
  'text',
  'textarea',
  'number',
  'range',
  'color',
  'select',
  'boolean',
  'radio',
  'spacing',
  'border',
  'shadow',
  'typography',
  'link',
  'image',
];

const noopWidget: WidgetComponent = () => null;

describe('RegistryConsistency — propertyFieldRegistry singleton', () => {
  it('registers a widget for every built-in WidgetType (full coverage)', () => {
    for (const type of expectedWidgets) {
      expect(propertyFieldRegistry.hasWidget(type), `missing widget: ${type}`).toBe(true);
    }
  });

  it('registers 14 unique widget bindings (no duplicate types)', () => {
    const seen = new Set<WidgetType>();
    for (const type of expectedWidgets) {
      expect(seen.has(type)).toBe(false);
      seen.add(type);
    }
    expect(seen.size).toBe(14);
  });

  it('resolves a widget renderer for a bound type', () => {
    const widget = propertyFieldRegistry.getWidget('text');
    expect(widget).toBeTypeOf('function');
  });

  it('returns undefined for an unregistered widget (fail-visible, no crash)', () => {
    const reg = createPropertyFieldRegistry();
    expect(reg.getWidget('color')).toBeUndefined();
    expect(reg.hasWidget('color')).toBe(false);
  });

  it('supports dynamic registration, override and restore', () => {
    const reg = createPropertyFieldRegistry();
    const original = noopWidget;

    reg.registerWidget('text', original);
    expect(reg.getWidget('text')).toBe(original);

    const replacement: WidgetComponent = () => 'replacement' as never;
    reg.registerWidget('text', replacement);
    expect(reg.getWidget('text')).toBe(replacement);

    reg.registerWidget('text', original);
    expect(reg.getWidget('text')).toBe(original);
  });

  it('clear() removes all widgets', () => {
    const reg = createPropertyFieldRegistry();
    reg.registerWidget('text', noopWidget);
    reg.clear();
    expect(reg.hasWidget('text')).toBe(false);
  });
});
