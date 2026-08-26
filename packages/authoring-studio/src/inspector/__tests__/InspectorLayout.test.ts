/**
 * InspectorLayout — Sprint 7.1 UI Layer tests
 *
 * Node environment — no jsdom. Uses react-dom/server renderToStaticMarkup.
 * Verifies panels are pure presentation and delegate to InspectorPanelFields.
 *
 * NOTE: This is a .ts file (per Sprint 7.1 convention), so JSX is written
 * using React.createElement to remain valid TypeScript.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import * as React from 'react';
import type { PropertyFieldDefinition } from '../registry/types';
import type { InspectorCategory } from '../../../../builder-core/src/InspectorRuntime';

import { InspectorPanelFields } from '../panels/InspectorPanelFields';
import { InspectorPanelFieldsProps } from '../panels/InspectorPanelFields';
import { AppearancePanel } from '../panels/AppearancePanel';
import { LayoutPanel } from '../panels/LayoutPanel';
import { TypographyPanel } from '../panels/TypographyPanel';
import { SpacingPanel } from '../panels/SpacingPanel';
import { BorderPanel } from '../panels/BorderPanel';
import { ShadowPanel } from '../panels/ShadowPanel';
import { AnimationPanel } from '../panels/AnimationPanel';
import { AdvancedPanel } from '../panels/AdvancedPanel';
import { InspectorShell } from '../InspectorShell';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeField(id: string, overrides: Partial<PropertyFieldDefinition> = {}): PropertyFieldDefinition {
  return {
    id,
    label: `Label ${id}`,
    description: `Desc ${id}`,
    defaultValue: undefined,
    validation: () => ({ valid: true }),
    widget: 'text',
    category: 'layout',
    ...overrides,
  };
}

function renderField(field: PropertyFieldDefinition, value: unknown, onChange: (v: unknown) => void) {
  return React.createElement(
    'div',
    { 'data-field-id': field.id },
    React.createElement('span', { 'data-value': String(value ?? '') }, field.label)
  );
}

const renderFieldFn = vi.fn(renderField);

// ---------------------------------------------------------------------------
// InspectorPanelFields
// ---------------------------------------------------------------------------

describe('InspectorPanelFields', () => {
  it('renders a field per definition with default value fallback', () => {
    const fields = [
      makeField('a', { defaultValue: 'default-a' }),
      makeField('b'),
    ];
    const html = renderToStaticMarkup(
      React.createElement(InspectorPanelFields, {
        fields,
        values: { a: 'actual-a' },
        onChange: noop(),
        renderField: renderFieldFn,
      })
    );
    expect(html).toContain('data-field-id="a"');
    expect(html).toContain('data-field-id="b"');
    expect(html).toContain('data-value="actual-a"');
  });
});

function noop() {
  return () => {};
}

// ---------------------------------------------------------------------------
// Panels render via InspectorPanelFields
// ---------------------------------------------------------------------------

interface PanelPropsShape {
  fields: PropertyFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  breakpoint: 'desktop' | 'tablet' | 'mobile';
  renderField: (field: PropertyFieldDefinition, value: unknown, onChange: (v: unknown) => void) => React.ReactNode;
}

function makePanelProps(fields: PropertyFieldDefinition[]): PanelPropsShape {
  return {
    fields,
    values: {},
    onChange: vi.fn(),
    breakpoint: 'desktop',
    renderField: renderFieldFn,
  };
}

describe('Inspector Panels', () => {
  it('AppearancePanel renders its fields', () => {
    const html = renderToStaticMarkup(
      React.createElement(AppearancePanel, makePanelProps([makeField('bg')]))
    );
    expect(html).toContain('data-field-id="bg"');
    expect(html).toContain('appearance-panel');
  });

  it('LayoutPanel renders its fields', () => {
    const html = renderToStaticMarkup(
      React.createElement(LayoutPanel, makePanelProps([makeField('display')]))
    );
    expect(html).toContain('data-field-id="display"');
    expect(html).toContain('layout-panel');
  });

  it('TypographyPanel renders its fields', () => {
    const html = renderToStaticMarkup(
      React.createElement(TypographyPanel, makePanelProps([makeField('font')]))
    );
    expect(html).toContain('data-field-id="font"');
    expect(html).toContain('typography-panel');
  });

  it('SpacingPanel renders its fields', () => {
    const html = renderToStaticMarkup(
      React.createElement(SpacingPanel, makePanelProps([makeField('padding')]))
    );
    expect(html).toContain('data-field-id="padding"');
  });

  it('BorderPanel renders its fields', () => {
    const html = renderToStaticMarkup(
      React.createElement(BorderPanel, makePanelProps([makeField('border')]))
    );
    expect(html).toContain('data-field-id="border"');
  });

  it('ShadowPanel renders its fields', () => {
    const html = renderToStaticMarkup(
      React.createElement(ShadowPanel, makePanelProps([makeField('shadow')]))
    );
    expect(html).toContain('data-field-id="shadow"');
  });

  it('AnimationPanel renders its fields', () => {
    const html = renderToStaticMarkup(
      React.createElement(AnimationPanel, makePanelProps([makeField('transition')]))
    );
    expect(html).toContain('data-field-id="transition"');
  });

  it('AdvancedPanel renders its fields', () => {
    const html = renderToStaticMarkup(
      React.createElement(AdvancedPanel, makePanelProps([makeField('zindex')]))
    );
    expect(html).toContain('data-field-id="zindex"');
  });
});

// ---------------------------------------------------------------------------
// InspectorShell (breakpoint UI integration)
// ---------------------------------------------------------------------------

describe('InspectorShell', () => {
  const categories: InspectorCategory[] = [
    {
      id: 'layout',
      label: 'Layout',
      groups: [{ id: 'layout', label: 'Layout', fields: [] }],
    },
  ];

  it('renders section name, type, and breakpoint switcher', () => {
    const html = renderToStaticMarkup(
      React.createElement(InspectorShell, {
        sectionId: 's1',
        sectionName: 'Hero',
        sectionType: 'hero',
        categories,
        currentProps: {},
        onPropChange: noop(),
      })
    );
    expect(html).toContain('Hero');
    expect(html).toContain('Type: hero');
    expect(html).toContain('data-testid="breakpoint-switcher"');
    expect(html).toContain('data-testid="breakpoint-indicator"');
  });
});

