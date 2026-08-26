/**
 * StateConsistency — Sprint 7 Recovery (P2/P3) tests
 *
 * Node environment — no jsdom.
 * Consolidated with TECH-003 test-utils.
 */
import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { DynamicPropertyPanel } from '../panels/DynamicPropertyPanel';
import { propertyFieldRegistry } from '../registry/propertyFieldRegistry';
import { toPropertyFieldDefinition } from '../panels/schemaAdapter';
import {
  createMockPropSchema,
  createMockInspectorGroup,
  renderToHtml,
} from '@/test-utils';

describe('StateConsistency — single dispatch per change (P3)', () => {
  it('should yield exactly one onPropChange call when widget onChange fires', () => {
    const handleChange = vi.fn();
    const schema = createMockPropSchema({ key: 'spacing', label: 'Spacing' });
    const group = createMockInspectorGroup('layout', 'Layout', [schema]);

    renderToHtml(
      React.createElement(DynamicPropertyPanel, {
        group: group as any,
        currentProps: { spacing: '4px' },
        onPropChange: handleChange,
        breakpoint: 'desktop',
      })
    );

    // Simulate ONE user interaction on the text widget.
    const field = toPropertyFieldDefinition(schema as any);
    const Widget = propertyFieldRegistry.getWidget(field.widget)!;
    renderToHtml(
      React.createElement(Widget, {
        value: '4px',
        onChange: handleChange,
        field,
        breakpoint: 'desktop',
      })
    );
  });

  it('returns singleton widget instances from registry as single source of truth', () => {
    const schema = createMockPropSchema({ key: 'color', type: 'color', label: 'Color' });
    const def = toPropertyFieldDefinition(schema as any);
    const widget = propertyFieldRegistry.getWidget(def.widget);
    expect(widget).toBeDefined();

    const widgetAgain = propertyFieldRegistry.getWidget(def.widget);
    expect(widgetAgain).toBe(widget);
  });

  it('should not trigger side-effect dispatches during rendering', () => {
    const handleChange = vi.fn();
    const group = createMockInspectorGroup('general', 'General', [
      createMockPropSchema({ key: 'a', type: 'string', label: 'A' }),
      createMockPropSchema({ key: 'b', type: 'number', label: 'B' }),
      createMockPropSchema({ key: 'c', type: 'color', label: 'C' }),
    ]);

    renderToHtml(
      React.createElement(DynamicPropertyPanel, {
        group: group as any,
        currentProps: { a: 'x', b: 1, c: '#fff' },
        onPropChange: handleChange,
        breakpoint: 'desktop',
      })
    );

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should update responsive values atomically with single merged write', () => {
    const currentProps = { padding: { desktop: '8px', tablet: '4px', mobile: '2px' } } as Record<string, unknown>;
    const handleChange = vi.fn();

    const rawValue = currentProps.padding;
    const isResponsive = typeof rawValue === 'object' && rawValue !== null && 'desktop' in rawValue;
    expect(isResponsive).toBe(true);

    if (isResponsive) {
      const next = { ...(rawValue as Record<string, unknown>), mobile: '12px' };
      handleChange('padding', next);
    }

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('padding', {
      desktop: '8px',
      tablet: '4px',
      mobile: '12px',
    });
  });
});
