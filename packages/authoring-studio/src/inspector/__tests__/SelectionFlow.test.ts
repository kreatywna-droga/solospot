/**
 * SelectionFlow — Sprint 7 Recovery (P1) / PM27 tests
 *
 * Node environment — no jsdom. Uses react-dom/server renderToStaticMarkup.
 *
 * Verifies the Canvas → Selection → InspectorSync → InspectorShell flow:
 *   - Selecting a section resolves its schema + props into the inspector.
 *   - Deselecting clears the inspector (empty state).
 *   - The registry is the provider of the component schema consumed by the
 *     inspector (single source of truth).
 *
 * We exercise the pure building blocks (InspectorRuntime.organizeByCategory +
 * InspectorShell) since InspectorSync is a thin React controller that reads
 * selection from the BuilderProvider. The contract tested here is the
 * schema→inspector projection used by InspectorSync.
 *
 * @agent Agent 1 — Inspector Core Engineer (PM27)
 * @status IN PROGRESS — READY FOR PM27 ARCHITECT REVIEW
 */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import * as React from 'react';
import { createBuilderComponentRegistry, stringProp, colorProp, numberProp } from '../../../../builder-core/src/ComponentRegistry';
import type { InspectorCategory } from '../../../../builder-core/src/InspectorRuntime';
import { InspectorRuntime } from '../../../../builder-core/src/InspectorRuntime';
import { InspectorShell } from '../InspectorShell';

function buildRegistry() {
  const registry = createBuilderComponentRegistry();
  registry.register({
    type: 'hero',
    label: 'Hero',
    category: 'Hero',
    icon: 'hero',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'headline', label: 'Headline', required: true }),
      colorProp({ key: 'bg', label: 'Background', required: false }),
      numberProp({ key: 'maxWidth', label: 'Max width', required: false }),
    ],
    defaultProps: { headline: 'Hello', bg: '#ffffff', maxWidth: 1200 },
  });
  return registry;
}

const noop = () => {};

describe('SelectionFlow — schema projection into inspector', () => {
  it('a selected section resolves its schema and renders it in the inspector', () => {
    const registry = buildRegistry();
    const descriptor = registry.get('hero')!;
    const schema = descriptor.schema ?? [];
    const props = InspectorRuntime.applyDefaults(schema, { headline: 'Welcome' });
    const categories: InspectorCategory[] = [...InspectorRuntime.organizeByCategory(schema)];

    const html = renderToStaticMarkup(
      React.createElement(InspectorShell, {
        sectionId: 'sec-1',
        sectionName: descriptor.label,
        sectionType: descriptor.type,
        categories,
        currentProps: props,
        onPropChange: noop,
      })
    );

    expect(html).toContain('Hero');
    expect(html).toContain('Headline');
    expect(html).toContain('Background');
    expect(html).toContain('Max width');
  });

  it('deselecting clears the inspector to an empty state (no fields)', () => {
    const html = renderToStaticMarkup(
      React.createElement(InspectorShell, {
        sectionId: 'sec-1',
        sectionName: '',
        sectionType: '',
        categories: [],
        currentProps: {},
        onPropChange: noop,
      })
    );
    // Empty categories → only the shell container renders, no fields.
    expect(html).toContain('inspector-shell');
    expect(html).not.toContain('type="text"');
  });

  it('the component registry is the single source of schema for selection', () => {
    const registry = buildRegistry();
    expect(registry.has('hero')).toBe(true);
    expect(registry.get('hero')!.schema.length).toBe(3);
    // Unknown type → no schema, inspector renders empty.
    expect(registry.get('missing')).toBeUndefined();
  });

  it('selection flow preserves the schema group categories', () => {
    const registry = buildRegistry();
    const schema = registry.get('hero')!.schema;
    // All fields have no explicit group → land in "general".
    const categories = InspectorRuntime.organizeByCategory(schema);
    expect(categories.length).toBe(1);
    expect(categories[0].id).toBe('general');
    expect(categories[0].groups[0].fields.length).toBe(3);
  });
});
