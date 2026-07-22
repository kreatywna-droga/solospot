/**
 * preview-contract.test.ts — C6.1-E
 *
 * Tests:
 *   - createMemoryChannel send/receive
 *   - onAck subscription / unsubscription
 *   - destroy() prevents further sends
 *   - Message factory helpers
 *   - PreviewRuntimeAdapter.handleMessage (PING, DOCUMENT_UPDATE, SECTION_UPDATE)
 */

import { describe, it, expect, vi } from 'vitest';
import { createMemoryChannel } from '../PreviewContract';
import {
  createDocumentUpdate,
  createSectionHighlight,
  createViewportChange,
  createSectionUpdate,
} from '../PreviewMessage';
import { createPreviewRuntimeAdapter, PreviewRuntimeAdapter } from '../PreviewRuntimeAdapter';
import { createBuilderDocument } from '../BuilderDocument';
import { PreviewRuntime } from '../../../theme-runtime/src/PreviewRuntime';
import { PreviewSession } from '../../../theme-runtime/src/PreviewSession';
import { TemplateRuntime } from '../../../theme-runtime/src/TemplateRuntime';
import { ThemeRuntime } from '../../../theme-runtime/src/ThemeRuntime';
import { ComponentRenderer } from '../../../component-runtime/src/ComponentRenderer';
import { ComponentRegistry } from '../../../component-runtime/src/ComponentRegistry';
import { ComponentResolver } from '../../../component-runtime/src/ComponentResolver';
import { ComponentManifestLoader } from '../../../component-runtime/src/ComponentManifest';
import { PlatformEventBusImpl } from '../../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../../platform-core/src/logger/Logger';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

function makeDoc() {
  return createBuilderDocument({
    id: 'store_preview_test',
    tenantId: 'tenant_test',
    metadata: {
      storeName: 'Preview Store',
      storeSlug: 'preview-store',
      locale: 'en',
      currency: 'USD',
    },
  });
}

// ---------------------------------------------------------------------------
// Memory channel — send / receive
// ---------------------------------------------------------------------------

describe('createMemoryChannel', () => {
  it('delivers messages from builder to runtime side', () => {
    const { builderChannel, runtimeSide } = createMemoryChannel();
    const received: unknown[] = [];
    runtimeSide.onMessage(msg => received.push(msg));

    const msg = createDocumentUpdate(makeDoc());
    builderChannel.send(msg);

    expect(received).toHaveLength(1);
    expect((received[0] as typeof msg).messageType).toBe('DOCUMENT_UPDATE');
  });

  it('delivers acks from runtime to builder', () => {
    const { builderChannel, runtimeSide } = createMemoryChannel();
    const acks: unknown[] = [];
    builderChannel.onAck(ack => acks.push(ack));

    runtimeSide.sendAck({
      ackType: 'RENDERED',
      correlationId: 'test_123',
      timestamp: Date.now(),
      renderTimeMs: 42,
    });

    expect(acks).toHaveLength(1);
    expect((acks[0] as { ackType: string }).ackType).toBe('RENDERED');
  });

  it('onAck returns unsubscribe function', () => {
    const { builderChannel, runtimeSide } = createMemoryChannel();
    const acks: unknown[] = [];
    const unsub = builderChannel.onAck(ack => acks.push(ack));
    unsub();

    runtimeSide.sendAck({ ackType: 'RENDERED', correlationId: 'x', timestamp: Date.now() });
    expect(acks).toHaveLength(0);
  });

  it('destroy() stops message delivery', () => {
    const { builderChannel, runtimeSide } = createMemoryChannel();
    const received: unknown[] = [];
    runtimeSide.onMessage(msg => received.push(msg));

    builderChannel.destroy();
    builderChannel.send(createDocumentUpdate(makeDoc()));

    expect(received).toHaveLength(0);
    expect(builderChannel.isReady).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Message factory helpers
// ---------------------------------------------------------------------------

describe('PreviewMessage factories', () => {
  it('createDocumentUpdate has correct shape', () => {
    const doc = makeDoc();
    const msg = createDocumentUpdate(doc, ['sec_1']);
    expect(msg.messageType).toBe('DOCUMENT_UPDATE');
    expect(msg.document).toBe(doc);
    expect(msg.changedSectionIds).toEqual(['sec_1']);
    expect(typeof msg.correlationId).toBe('string');
    expect(typeof msg.timestamp).toBe('number');
  });

  it('createSectionHighlight has correct shape', () => {
    const msg = createSectionHighlight('sec_hero');
    expect(msg.messageType).toBe('SECTION_HIGHLIGHT');
    expect(msg.sectionId).toBe('sec_hero');
  });

  it('createSectionHighlight with null sectionId', () => {
    const msg = createSectionHighlight(null);
    expect(msg.sectionId).toBeNull();
  });

  it('createViewportChange has correct shape', () => {
    const msg = createViewportChange(768, 'TABLET');
    expect(msg.messageType).toBe('VIEWPORT_CHANGE');
    expect(msg.width).toBe(768);
    expect(msg.label).toBe('TABLET');
  });

  it('createSectionUpdate has correct shape', () => {
    const msg = createSectionUpdate('page_1', 'sec_hero', { title: 'New' });
    expect(msg.messageType).toBe('SECTION_UPDATE');
    expect(msg.pageId).toBe('page_1');
    expect(msg.sectionId).toBe('sec_hero');
    expect(msg.props).toEqual({ title: 'New' });
  });
});

// ---------------------------------------------------------------------------
// PreviewRuntimeAdapter
// ---------------------------------------------------------------------------

describe('PreviewRuntimeAdapter', () => {
  function makePreviewRuntime(html = '<div>preview</div>'): PreviewRuntime {
    const logger = new ConsolePlatformLogger();
    const eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);
    const themeRuntime = new ThemeRuntime({ eventBus, logger });
    const templateRuntime = new TemplateRuntime({
      eventBus,
      logger,
      themeRuntime,
      rendererEngine: {} as any,
      assets: {} as any,
    });
    const registry = new ComponentRegistry();
    const resolver = new ComponentResolver(registry);
    const loader = new ComponentManifestLoader();
    const renderer = new ComponentRenderer(resolver);

    const runtime = new PreviewRuntime({
      templateRuntime,
      themeRuntime,
      componentRenderer: renderer,
      componentRegistry: registry,
      componentResolver: resolver,
      manifestLoader: loader,
      layoutTemplate: '<html><body><!-- slot:main --></body></html>',
      session: {
        document: {
          storeId: 'store_preview_test',
          tenantId: 'tenant_test',
          storeName: 'Preview Store',
          storeSlug: 'preview-store',
          publicationStatus: 'DRAFT',
          branding: {
            primaryColor: '#000000',
            secondaryColor: '#000000',
            font: 'system-ui',
          },
          pages: [],
          locale: 'en',
          currency: 'USD',
        },
      },
    });

    (runtime as any).pipeline = {
      renderPage: async () => ({ html, renderTimeMs: 5 }),
      renderSection: async () => ({ html, renderTimeMs: 5 }),
    };

    return runtime;
  }

  it('responds to PING with PONG', async () => {
    const adapter = createPreviewRuntimeAdapter(makePreviewRuntime());
    const ack = await adapter.handleMessage({
      messageType: 'PING',
      correlationId: 'ping_1',
      timestamp: Date.now(),
    });
    expect(ack.ackType).toBe('PONG');
    expect(ack.correlationId).toBe('ping_1');
  });

  it('calls runtime on DOCUMENT_UPDATE and returns RENDERED ack', async () => {
    const runtime = makePreviewRuntime();
    const adapter = createPreviewRuntimeAdapter(runtime);
    const doc = makeDoc();
    const msg = createDocumentUpdate(doc);

    const ack = await adapter.handleMessage(msg);
    expect(ack.ackType).toBe('RENDERED');
    expect(typeof ack.renderTimeMs).toBe('number');
  });

  it('returns ERROR ack when runtime throws', async () => {
    const runtime = makePreviewRuntime();
    (runtime as any).pipeline = {
      renderPage: async () => {
        throw new Error('render failed');
      },
      renderSection: async () => ({ html: '', renderTimeMs: 0 }),
    };
    const adapter = createPreviewRuntimeAdapter(runtime);
    const ack = await adapter.handleMessage(createDocumentUpdate(makeDoc()));
    expect(ack.ackType).toBe('ERROR');
    expect(ack.error).toContain('render failed');
  });

  it('calls onRender callback with HTML', async () => {
    const onRender = vi.fn();
    const adapter = createPreviewRuntimeAdapter(makePreviewRuntime('<h1>Hello</h1>'), onRender);
    await adapter.handleMessage(createDocumentUpdate(makeDoc()));
    expect(onRender).toHaveBeenCalledWith('<h1>Hello</h1>');
  });

  it('returns ERROR after destroy()', async () => {
    const adapter = createPreviewRuntimeAdapter(makePreviewRuntime());
    adapter.destroy();
    const ack = await adapter.handleMessage(createDocumentUpdate(makeDoc()));
    expect(ack.ackType).toBe('ERROR');
    expect(ack.error).toContain('destroyed');
  });

  it('handles SECTION_UPDATE by delegating to runtime', async () => {
    const runtime = makePreviewRuntime();
    const adapter = createPreviewRuntimeAdapter(runtime);
    const ack = await adapter.handleMessage({
      messageType: 'SECTION_UPDATE',
      correlationId: 'upd_1',
      timestamp: Date.now(),
      pageId: 'p1',
      sectionId: 'sec_1',
      props: { title: 'New' },
    });
    expect(ack.ackType).toBe('RENDERED');
    expect(ack.sectionId).toBe('sec_1');
  });

  it('handles VIEWPORT_CHANGE by updating session and re-rendering', async () => {
    const runtime = makePreviewRuntime();
    const adapter = createPreviewRuntimeAdapter(runtime);
    const ack = await adapter.handleMessage({
      messageType: 'VIEWPORT_CHANGE',
      correlationId: 'vp_1',
      timestamp: Date.now(),
      width: 768,
      label: 'TABLET',
    });
    expect(ack.ackType).toBe('RENDERED');
  });

  it('survives section render failure and reports section error without crashing', async () => {
    const runtime = makePreviewRuntime();
    (runtime as any).pipeline = {
      renderPage: async () => ({ html: '<html></html>', renderTimeMs: 1 }),
      renderSection: async () => {
        throw new Error('Component boom');
      },
    };
    const adapter = createPreviewRuntimeAdapter(runtime);
    const ack = await adapter.handleMessage({
      messageType: 'SECTION_UPDATE',
      correlationId: 'err_1',
      timestamp: Date.now(),
      pageId: 'p1',
      sectionId: 'sec_bad',
      props: { title: 'New' },
    });
    expect(ack.ackType).toBe('ERROR');
    expect(ack.sectionId).toBe('sec_bad');
    expect(ack.error).toContain('Component boom');
  });
});
