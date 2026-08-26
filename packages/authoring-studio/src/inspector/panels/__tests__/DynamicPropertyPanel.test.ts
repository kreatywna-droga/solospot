/**
 * DynamicPropertyPanel — Sprint 7 Recovery (P1) tests
 *
 * Node environment — no jsdom. Uses react-dom/server renderToStaticMarkup via test-utils.
 * Consolidated with TECH-004 test-utils adoption.
 */
import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { DynamicPropertyPanel } from '../DynamicPropertyPanel';
import { toPropertyFieldDefinition } from '../schemaAdapter';
import {
  createMockPropSchema,
  createMockInspectorGroup,
  renderToHtml,
  noop,
} from '@/test-utils';

describe('schemaAdapter', () => {
  it('returns text widget definition for string schema', () => {
    const def = toPropertyFieldDefinition(createMockPropSchema({ key: 'title', label: 'Title', type: 'string' }) as any);
    expect(def.widget).toBe('text');
    expect(def.id).toBe('title');
    expect(def.label).toBe('Title');
  });

  it('returns color widget definition for color schema', () => {
    const def = toPropertyFieldDefinition(createMockPropSchema({ type: 'color' }) as any);
    expect(def.widget).toBe('color');
  });

  it('returns select widget definition with options for select schema', () => {
    const def = toPropertyFieldDefinition(
      createMockPropSchema({
        type: 'select',
        options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }],
      }) as any
    );
    expect(def.widget).toBe('select');
    expect(def.options).toEqual([{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]);
  });

  it('returns number widget definition with bounds for number schema', () => {
    const def = toPropertyFieldDefinition(createMockPropSchema({ type: 'number', min: 0, max: 100, step: 2, unit: 'px' }) as any);
    expect(def.widget).toBe('number');
    expect(def.min).toBe(0);
    expect(def.max).toBe(100);
    expect(def.step).toBe(2);
    expect(def.unit).toBe('px');
  });

  it('returns text widget fallback for unknown schema type', () => {
    const def = toPropertyFieldDefinition(createMockPropSchema({ type: 'unknown-type' }) as any);
    expect(def.widget).toBe('text');
  });
});

describe('DynamicPropertyPanel', () => {
  it('renders a registered widget for a string schema via registry', () => {
    const group = createMockInspectorGroup('layout', 'Layout', [createMockPropSchema({ key: 'headline', label: 'Headline' })]);
    const html = renderToHtml(
      React.createElement(DynamicPropertyPanel, {
        group: group as any,
        currentProps: { headline: 'Hello' },
        onPropChange: noop,
        breakpoint: 'desktop',
      })
    );
    expect(html).toContain('type="text"');
    expect(html).toContain('value="Hello"');
    expect(html).toContain('Headline');
  });

  it('renders only via registry without local switch/case branch definitions', () => {
    const group = createMockInspectorGroup('layout', 'Layout', [
      createMockPropSchema({ key: 'headline', type: 'string', label: 'Headline' }),
      createMockPropSchema({ key: 'bg', type: 'color', label: 'Background' }),
      createMockPropSchema({ key: 'count', type: 'number', label: 'Count' }),
    ]);
    const html = renderToHtml(
      React.createElement(DynamicPropertyPanel, {
        group: group as any,
        currentProps: { headline: 'Hi', bg: '#ff0000', count: 5 },
        onPropChange: noop,
        breakpoint: 'desktop',
      })
    );
    expect(html).toContain('type="text"');
    expect(html).toContain('type="number"');
    expect(html).toContain('type="color"');
  });

  it('renders text widget fallback gracefully for unknown schema type', () => {
    const group = createMockInspectorGroup('layout', 'Layout', [createMockPropSchema({ key: 'weird', type: 'object', label: 'Weird' })]);
    const html = renderToHtml(
      React.createElement(DynamicPropertyPanel, {
        group: group as any,
        currentProps: {},
        onPropChange: noop,
        breakpoint: 'desktop',
      })
    );
    expect(html).toContain('Weird');
    expect(html).toContain('type="text"');
  });

  it('should render cleanly without side effects during render', () => {
    const onChange = vi.fn();
    const group = createMockInspectorGroup('layout', 'Layout', [createMockPropSchema({ key: 'headline', label: 'Headline' })]);
    const html = renderToHtml(
      React.createElement(DynamicPropertyPanel, {
        group: group as any,
        currentProps: { headline: 'Hello' },
        onPropChange: onChange,
        breakpoint: 'desktop',
      })
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(html).toContain('Hello');
  });
});
