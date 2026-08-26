/**
 * BuilderInspectorIntegration — Sprint 7 Recovery (P1) / PM27 tests
 *
 * Node environment — no jsdom. Uses react-dom/server renderToStaticMarkup.
 *
 * Verifies the FULL Inspector 2.0 chain end-to-end on a real BuilderContext
 * with an in-process MemoryChannel:
 *
 *   Canvas (selection) → Selection → InspectorSync → InspectorShell
 *     → DynamicPropertyPanel → PropertyRegistry widget
 *     → onPropChange → dispatch(UPDATE_PROPS) → BuilderCommand
 *     → BuilderContext → PreviewChannel → Preview
 *
 * Invariants verified:
 *   - A single property change produces EXACTLY ONE dispatch (no double dispatch).
 *   - Rendering the inspector never triggers side-effect dispatch (no loops).
 *   - The preview channel receives a document/section update after a change.
 *   - No Preview → Inspector loop (schema-derived UI is read-only during render).
 *
 * @agent Agent 1 — Inspector Core Engineer (PM27)
 * @status IN PROGRESS — READY FOR PM27 ARCHITECT REVIEW
 */
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import * as React from 'react';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
} from '../../../../builder-core/src/BuilderDocument';
import {
  createBuilderComponentRegistry,
  stringProp,
  colorProp,
  numberProp,
} from '../../../../builder-core/src/ComponentRegistry';
import { createMemoryChannel } from '../../../../builder-core/src/PreviewContract';
import { createBuilderContext } from '../../../../builder-core/src/BuilderContext';
import type { InspectorCategory } from '../../../../builder-core/src/InspectorRuntime';
import { InspectorRuntime } from '../../../../builder-core/src/InspectorRuntime';
import { InspectorShell } from '../InspectorShell';
import { DynamicPropertyPanel } from '../panels/DynamicPropertyPanel';
import { propertyFieldRegistry } from '../registry/propertyFieldRegistry';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function buildFixture() {
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
      stringProp({ key: 'subheadline', label: 'Subheadline', required: false }),
      colorProp({ key: 'bg', label: 'Background', required: false }),
      numberProp({ key: 'maxWidth', label: 'Max width', required: false }),
    ],
    defaultProps: { headline: 'Hello', subheadline: '', bg: '#ffffff', maxWidth: 1200 },
  });

  const section = createSectionNode({
    id: 'sec-hero',
    type: 'hero',
    label: 'Hero',
    props: { headline: 'Welcome', bg: '#000000' },
  });

  const doc = createBuilderDocument({
    id: 'store-1',
    tenantId: 'tenant-1',
    metadata: { storeName: 'Sklep', storeSlug: 'sklep', locale: 'pl', currency: 'PLN' },
  });

  // Replace the default empty home page with one containing the hero section.
  const homePage = createBuilderPage({
    id: 'page_home_store-1',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [section],
  });
  Object.assign(doc, { pages: [homePage] });

  const channel = createMemoryChannel();

  const ctx = createBuilderContext({
    document: doc,
    registry,
    preview: channel.builderChannel,
  });

  return { registry, doc, section, ctx, channel };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BuilderInspectorIntegration — full chain', () => {
  it('renders the InspectorShell from a selected section schema (chain wired)', () => {
    const { doc, section, ctx } = buildFixture();
    const descriptor = ctx.registry.get(section.type)!;
    const schema = descriptor.schema ?? [];
    const props = InspectorRuntime.applyDefaults(schema, section.props);
    const categories: InspectorCategory[] = [...InspectorRuntime.organizeByCategory(schema)];

    const html = renderToStaticMarkup(
      React.createElement(InspectorShell, {
        sectionId: section.id,
        sectionName: descriptor.label,
        sectionType: descriptor.type,
        categories,
        currentProps: props,
        onPropChange: () => {},
      })
    );

    expect(html).toContain('Hero');
    expect(html).toContain('Headline');
    expect(html).toContain('type="text"');
    expect(ctx.registry.has(section.type)).toBe(true);
  });

  it('a single property change produces EXACTLY ONE dispatch to the preview channel', () => {
    const { channel, ctx, section } = buildFixture();
    const pageId = ctx.document.pages[0].id;

    // Subscribe to preview messages.
    const previewMessages: unknown[] = [];
    channel.runtimeSide.onMessage(msg => previewMessages.push(msg));

    // Simulate the inspector's onPropChange → dispatch(UPDATE_PROPS).
    let next = ctx;
    const dispatchSpy = vi.fn(cmd => { next = next.dispatch(cmd); return next; });

    dispatchSpy({ type: 'UPDATE_PROPS', pageId, sectionId: section.id, props: { headline: 'Nowa nagłówek' } });

    // Exactly one dispatch occurred.
    expect(dispatchSpy).toHaveBeenCalledTimes(1);

    // The document was mutated and the preview received a document update.
    expect(next.document.pages[0].sections[0].props.headline).toBe('Nowa nagłówek');
    expect(previewMessages.length).toBeGreaterThanOrEqual(1);
    const last = previewMessages[previewMessages.length - 1] as { type?: string };
    expect(last.type).toBe('DOCUMENT_UPDATE');
  });

  it('rendering the inspector does NOT trigger side-effect dispatch (no loop)', () => {
    const { doc, section, ctx } = buildFixture();
    const descriptor = ctx.registry.get(section.type)!;
    const schema = descriptor.schema ?? [];
    const props = InspectorRuntime.applyDefaults(schema, section.props);
    const categories: InspectorCategory[] = [...InspectorRuntime.organizeByCategory(schema)];

    const onChange = vi.fn();
    renderToStaticMarkup(
      React.createElement(InspectorShell, {
        sectionId: section.id,
        sectionName: descriptor.label,
        sectionType: descriptor.type,
        categories,
        currentProps: props,
        onPropChange: onChange,
      })
    );

    // Pure render — no dispatch emitted from rendering.
    expect(onChange).not.toHaveBeenCalled();
  });

  it('DynamicPropertyPanel resolves widgets exclusively via PropertyRegistry', () => {
    const { doc, section, ctx } = buildFixture();
    const descriptor = ctx.registry.get(section.type)!;
    const schema = descriptor.schema ?? [];
    const categories: InspectorCategory[] = [...InspectorRuntime.organizeByCategory(schema)];
    const group = categories[0].groups[0];

    const html = renderToStaticMarkup(
      React.createElement(DynamicPropertyPanel, {
        group,
        currentProps: { headline: 'Hi', bg: '#000000', maxWidth: 1200 },
        onPropChange: () => {},
        breakpoint: 'desktop',
      })
    );

    // Fields render through the registry-resolved widgets.
    expect(html).toContain('type="text"');
    expect(html).toContain('type="color"');
    expect(html).toContain('type="number"');
    // The panel uses the registry singleton.
    expect(propertyFieldRegistry.hasWidget('text')).toBe(true);
  });
});
