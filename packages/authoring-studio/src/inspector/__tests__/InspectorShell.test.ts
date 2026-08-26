/**
 * InspectorShell — Sprint 7 Recovery (P1) tests
 *
 * Node environment — no jsdom. Uses react-dom/server renderToStaticMarkup.
 *
 * Verifies InspectorShell renders the new Inspector 2.0 layout:
 *   - section header + type
 *   - breakpoint switcher + indicator
 *   - category accordions delegating to DynamicPropertyPanel
 *   - is a pure presentation component (onPropChange NOT invoked during render)
 *
 * @agent Agent 1 — Inspector Core Engineer (Sprint 7 Recovery)
 * @status IN PROGRESS — READY FOR PM26 REVIEW
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import * as React from 'react';
import type { InspectorCategory } from '../../../../builder-core/src/InspectorRuntime';
import { InspectorShell } from '../InspectorShell';

function makeCategory(id: string, label: string): InspectorCategory {
  return {
    id,
    label,
    groups: [
      {
        id: `${id}-group`,
        label: `${label} group`,
        fields: [
          {
            key: 'headline',
            label: 'Headline',
            type: 'string',
            defaultValue: '',
            required: false,
          },
        ],
      },
    ],
  };
}

const noop = () => {};

describe('InspectorShell', () => {
  it('renders section name and type', () => {
    const html = renderToStaticMarkup(
      React.createElement(InspectorShell, {
        sectionId: 'sec-1',
        sectionName: 'Hero',
        sectionType: 'hero',
        categories: [],
        currentProps: {},
        onPropChange: noop,
      })
    );
    expect(html).toContain('Hero');
    expect(html).toContain('hero');
  });

  it('renders breakpoint switcher and indicator', () => {
    const html = renderToStaticMarkup(
      React.createElement(InspectorShell, {
        sectionId: 'sec-1',
        sectionName: 'Hero',
        sectionType: 'hero',
        categories: [],
        currentProps: {},
        onPropChange: noop,
      })
    );
    expect(html).toContain('data-testid="breakpoint-switcher"');
    expect(html).toContain('data-testid="breakpoint-indicator"');
  });

  it('renders category accordions and delegates fields to DynamicPropertyPanel', () => {
    const html = renderToStaticMarkup(
      React.createElement(InspectorShell, {
        sectionId: 'sec-1',
        sectionName: 'Hero',
        sectionType: 'hero',
        categories: [makeCategory('layout', 'Layout')],
        currentProps: { headline: 'Hello' },
        onPropChange: noop,
      })
    );
    expect(html).toContain('Layout');
    expect(html).toContain('Headline');
    // DynamicPropertyPanel renders a text input (registry-resolved widget).
    expect(html).toContain('type="text"');
  });

  it('does not invoke onPropChange during render (pure presentation)', () => {
    const onChange = vi.fn();
    renderToStaticMarkup(
      React.createElement(InspectorShell, {
        sectionId: 'sec-1',
        sectionName: 'Hero',
        sectionType: 'hero',
        categories: [makeCategory('layout', 'Layout')],
        currentProps: { headline: 'Hello' },
        onPropChange: onChange,
      })
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders empty state when no categories provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(InspectorShell, {
        sectionId: 'sec-1',
        sectionName: 'Hero',
        sectionType: 'hero',
        categories: [],
        currentProps: {},
        onPropChange: noop,
      })
    );
    expect(html).toContain('inspector-shell');
  });
});
