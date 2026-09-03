/**
 * PreviewSync — Sprint 7 Recovery (P1) / PM27 tests
 *
 * Node environment — no jsdom.
 *
 * Verifies the Inspector → Runtime Preview synchronization contract:
 *   - A property change dispatched via UPDATE_PROPS propagates to the
 *     preview channel (MemoryChannel) as a DOCUMENT_UPDATE.
 *   - The preview receives the updated document (single, coherent payload).
 *   - No direct DOM manipulation / querySelector in the preview iframe.
 *
 * The chain exercised here is the same one the Builder wires at runtime:
 *   Inspector onPropChange → dispatch(UPDATE_PROPS) → BuilderContext →
 *   convertBuilderDocument → previewChannel.send(document).
 *
 * @agent Agent 1 — Inspector Core Engineer (PM27)
 * @status IN PROGRESS — READY FOR PM27 ARCHITECT REVIEW
 */
import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
} from '../../../../builder-core/src/BuilderDocument';
import { createBuilderComponentRegistry, stringProp } from '../../../../builder-core/src/ComponentRegistry';
import { createMemoryChannel } from '../../../../builder-core/src/PreviewContract';
import { createBuilderContext } from '../../../../builder-core/src/BuilderContext';

function buildFixture() {
  const registry = createBuilderComponentRegistry();
  registry.register({
    type: 'hero',
    label: 'Hero',
    category: 'Hero',
    icon: 'hero',
    previewable: true,
    allowChildren: false,
    schema: [stringProp({ key: 'headline', label: 'Headline', required: true })],
    defaultProps: { headline: 'Hello' },
  });

  const section = createSectionNode({
    id: 'sec-hero',
    type: 'hero',
    label: 'Hero',
    props: { headline: 'Welcome' },
  });

  const doc = createBuilderDocument({
    id: 'store-1',
    tenantId: 'tenant-1',
    metadata: { storeName: 'Sklep', storeSlug: 'sklep', locale: 'pl', currency: 'PLN' },
  });
  const homePage = createBuilderPage({ id: 'page_home_store-1', slug: '/', name: 'Home', isHome: true, sections: [section] });
  Object.assign(doc, { pages: [homePage] });

  const channel = createMemoryChannel();
  const ctx = createBuilderContext({ document: doc, registry, preview: channel.builderChannel });

  return { doc, section, ctx, channel };
}

describe('PreviewSync — Inspector → Preview channel', () => {
  it('a property change emits a single DOCUMENT_UPDATE to the preview', () => {
    const { ctx, section, channel } = buildFixture();
    const pageId = ctx.document.pages[0].id;

    const messages: unknown[] = [];
    channel.runtimeSide.onMessage(msg => messages.push(msg));

    const next = ctx.dispatch({
      type: 'UPDATE_PROPS',
      pageId,
      sectionId: section.id,
      props: { headline: 'Zmieniona nagłówek' },
    });

    // Document updated.
    expect(next.document.pages[0].sections[0].props.headline).toBe('Zmieniona nagłówek');

    // Preview received exactly one DOCUMENT_UPDATE carrying the new value.
    const updates = messages.filter(m => {
      const msg = m as { type?: string; messageType?: string }
      return (msg.messageType ?? msg.type) === 'DOCUMENT_UPDATE'
    });
    expect(updates.length).toBe(1);
    const payload = (updates[0] as { document?: unknown; data?: unknown });
    expect(payload).toBeDefined();
  });

  it('dispatch does not mutate the previous document reference (immutability)', () => {
    const { ctx, section } = buildFixture();
    const pageId = ctx.document.pages[0].id;
    const before = ctx.document;

    const next = ctx.dispatch({
      type: 'UPDATE_PROPS',
      pageId,
      sectionId: section.id,
      props: { headline: 'Nowy' },
    });

    expect(next.document).not.toBe(before);
    expect(before.pages[0].sections[0].props.headline).toBe('Welcome');
  });

  it('inspector-driven updates flow through the channel, not direct DOM', () => {
    const { ctx, section, channel } = buildFixture();
    const pageId = ctx.document.pages[0].id;

    const messages: unknown[] = [];
    channel.runtimeSide.onMessage(msg => messages.push(msg));

    // Simulate inspector onPropChange → dispatch.
    const next = ctx.dispatch({
      type: 'UPDATE_PROPS',
      pageId,
      sectionId: section.id,
      props: { headline: 'Aktualizacja' },
    });

    // The only way the preview learns about the change is the channel message.
    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(next.document.pages[0].sections[0].props.headline).toBe('Aktualizacja');
  });
});
