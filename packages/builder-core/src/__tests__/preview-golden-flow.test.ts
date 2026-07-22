/**
 * preview-golden-flow.test.ts — C6.3-G
 *
 * Golden Flow Test for the entire Preview Pipeline.
 *
 * Verifies the full chain:
 *   BuilderDocument
 *       ↓
 *   compile()
 *       ↓
 *   CompiledDocument
 *       ↓
 *   PreviewRuntimeAdapter
 *       ↓
 *   PreviewRuntime
 *       ↓
 *   PreviewPipeline
 *       ↓
 *   TemplateRuntime + ComponentRenderer + ThemeRuntime + AssetResolver
 *       ↓
 *   HTML
 *
 * Also tests Preview resilience: a failing section component must not crash
 * the Builder or the entire preview.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMemoryChannel } from '../PreviewContract';
import {
  createDocumentUpdate,
  createSectionUpdate,
  createViewportChange,
} from '../PreviewMessage';
import { createPreviewRuntimeAdapter } from '../PreviewRuntimeAdapter';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../BuilderDocument';
import { PreviewRuntime } from '../../../theme-runtime/src/PreviewRuntime';
import { PreviewSession } from '../../../theme-runtime/src/PreviewSession';
import { PreviewPipeline } from '../../../theme-runtime/src/PreviewPipeline';
import { TemplateRuntime } from '../../../theme-runtime/src/TemplateRuntime';
import { ThemeRuntime } from '../../../theme-runtime/src/ThemeRuntime';
import { ComponentRenderer } from '../../../component-runtime/src/ComponentRenderer';
import { ComponentRegistry } from '../../../component-runtime/src/ComponentRegistry';
import { ComponentResolver } from '../../../component-runtime/src/ComponentResolver';
import { ComponentManifestLoader } from '../../../component-runtime/src/ComponentManifest';
import { PlatformEventBusImpl } from '../../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../../platform-core/src/logger/Logger';
import { RendererEngine } from '../../../theme-runtime/src/RendererEngine';

function makeRuntime() {
  const logger = new ConsolePlatformLogger();
  const eventBus = new PlatformEventBusImpl(logger);
  logger.setEventBus(eventBus);

  const themeRuntime = new ThemeRuntime({ eventBus, logger });
  const rendererEngine = new RendererEngine({ themeRuntime });
  const templateRuntime = new TemplateRuntime({
    eventBus,
    logger,
    themeRuntime,
    rendererEngine,
    assets: {
      resolve: async () => 'http://localhost/assets/test.png',
    } as any,
  });

  const registry = new ComponentRegistry();
  const resolver = new ComponentResolver(registry);
  const loader = new ComponentManifestLoader();
  const componentRenderer = new ComponentRenderer(resolver);

  registry.register({
    manifest: {
      id: 'Header',
      version: '1.0.0',
      category: 'section',
      displayName: 'Header',
      propsSchema: { title: { type: 'string' } },
      runtime: { loader: async () => ({ default: (props: any) => `<header>${props.title}</header>` }) },
    },
    loadedAt: new Date().toISOString(),
  });

  const pipeline = new PreviewPipeline({
    templateRuntime,
    themeRuntime,
    componentRenderer,
    componentRegistry: registry,
    componentResolver: resolver,
    manifestLoader: loader,
    layoutTemplate: '<html><body><!-- slot:main --></body></html>',
  });

  return {
    runtime: new PreviewRuntime({
      templateRuntime,
      themeRuntime,
      componentRenderer,
      componentRegistry: registry,
      componentResolver: resolver,
      manifestLoader: loader,
      layoutTemplate: '<html><body><!-- slot:main --></body></html>',
      session: {
        document: {
          storeId: 'store_golden',
          tenantId: 'tenant_golden',
          storeName: 'Golden Store',
          storeSlug: 'golden-store',
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
    }),
    eventBus,
    logger,
  };
}

function makeDoc() {
  const doc = createBuilderDocument({
    id: 'store_golden',
    tenantId: 'tenant_golden',
    metadata: {
      storeName: 'Golden Store',
      storeSlug: 'golden-store',
      locale: 'en',
      currency: 'USD',
    },
  });

  doc.pages = [
    createBuilderPage({
      id: 'page_1',
      slug: '',
      name: 'Home',
      sections: [
        createSectionNode({
          id: 'sec_1',
          type: 'Header',
          label: 'Header',
          props: { title: 'Golden Home' },
          order: 0,
        }),
      ],
    }),
  ];

  return doc;
}

describe('Preview Golden Flow C6.3-G', () => {
  it('should render full page from BuilderDocument through PreviewPipeline', async () => {
    const { runtime } = makeRuntime();
    const adapter = createPreviewRuntimeAdapter(runtime);
    const doc = makeDoc();

    const ack = await adapter.handleMessage(createDocumentUpdate(doc));
    expect(ack.ackType).toBe('RENDERED');
    expect(typeof ack.renderTimeMs).toBe('number');
  });

  it('should handle SECTION_UPDATE without crashing preview', async () => {
    const { runtime } = makeRuntime();
    const registry = (runtime as any).pipeline.componentRegistry;
    registry.register({
      manifest: {
        id: 'Header',
        version: '1.0.0',
        category: 'section',
        displayName: 'Header',
        propsSchema: { title: { type: 'string' } },
        runtime: { loader: async () => ({ default: (props: any) => `<header>${props.title}</header>` }) },
      },
      loadedAt: new Date().toISOString(),
    });

    const adapter = createPreviewRuntimeAdapter(runtime);
    const doc = makeDoc();

    const ack = await adapter.handleMessage(createDocumentUpdate(doc));
    expect(ack.ackType).toBe('RENDERED');
    expect(typeof ack.renderTimeMs).toBe('number');

    const updateAck = await adapter.handleMessage(
      createSectionUpdate('page_1', 'sec_1', { title: 'Updated' })
    );
    expect(updateAck.ackType).toBe('RENDERED');
    expect(updateAck.sectionId).toBe('sec_1');
  });

  it('should handle VIEWPORT_CHANGE and re-render', async () => {
    const { runtime } = makeRuntime();
    const adapter = createPreviewRuntimeAdapter(runtime);

    await adapter.handleMessage(createDocumentUpdate(makeDoc()));

    const ack = await adapter.handleMessage({
      messageType: 'VIEWPORT_CHANGE',
      correlationId: 'vp_golden',
      timestamp: Date.now(),
      width: 375,
      label: 'MOBILE',
    });
    expect(ack.ackType).toBe('RENDERED');
  });

  it('should survive component failure and report section error', async () => {
    const { runtime } = makeRuntime();
    const pipeline = (runtime as any).pipeline;

    const badComponent = () => {
      throw new Error('Marketplace component crashed');
    };

    const registry = pipeline.componentRegistry;
    registry.register({
      manifest: {
        id: 'bad-widget',
        version: '1.0.0',
        category: 'widget',
        displayName: 'Bad Widget',
        propsSchema: {},
        runtime: { loader: async () => ({ default: badComponent }) },
      },
      loadedAt: new Date().toISOString(),
    });

    const session = runtime.getSession();
    const updatedSession = {
      ...session,
      document: {
        ...session.document,
        pages: [
          {
            id: 'page_1',
            slug: '',
            name: 'Home',
            sections: [
              {
                id: 'sec_bad',
                type: 'bad-widget',
                label: 'Bad Widget',
                props: {},
                order: 0,
                visible: true,
              },
            ],
          },
        ],
      },
    };

    await expect(
      pipeline.renderSection(updatedSession, 'page_1', 'sec_bad', {}, 'err_golden')
    ).rejects.toThrow('Marketplace component crashed');
  });

  it('should keep Builder responsive after preview section error', async () => {
    const { runtime } = makeRuntime();
    const pipeline = (runtime as any).pipeline;
    const adapter = createPreviewRuntimeAdapter(runtime);

    const badComponent = () => {
      throw new Error('Component boom');
    };

    const registry = pipeline.componentRegistry;
    registry.register({
      manifest: {
        id: 'bad-widget',
        version: '1.0.0',
        category: 'widget',
        displayName: 'Bad Widget',
        propsSchema: {},
        runtime: { loader: async () => ({ default: badComponent }) },
      },
      loadedAt: new Date().toISOString(),
    });

    const session = runtime.getSession();
    const updatedSession = {
      ...session,
      document: {
        ...session.document,
        pages: [
          {
            id: 'page_1',
            slug: '',
            name: 'Home',
            sections: [
              {
                id: 'sec_bad',
                type: 'bad-widget',
                label: 'Bad Widget',
                props: {},
                order: 0,
                visible: true,
              },
            ],
          },
        ],
      },
    };

    (runtime as any).session = updatedSession;

    const failingAck = await adapter.handleMessage({
      messageType: 'SECTION_UPDATE',
      correlationId: 'err_1',
      timestamp: Date.now(),
      pageId: 'page_1',
      sectionId: 'sec_bad',
      props: {},
    });
    expect(failingAck.ackType).toBe('ERROR');
    expect(failingAck.sectionId).toBe('sec_bad');
    expect(failingAck.error).toContain('Component boom');

    const pingAck = await adapter.handleMessage({
      messageType: 'PING',
      correlationId: 'ping_after_error',
      timestamp: Date.now(),
    });
    expect(pingAck.ackType).toBe('PONG');
  });
});

describe('Preview Golden Flow C7.10 — Runtime UX Integration', () => {
  it('should handle SECTION_UPDATE during drag simulation', async () => {
    const { runtime } = makeRuntime();
    const adapter = createPreviewRuntimeAdapter(runtime);
    const doc = makeDoc();

    await adapter.handleMessage(createDocumentUpdate(doc));

    const updateAck = await adapter.handleMessage(
      createSectionUpdate('page_1', 'sec_1', { title: 'Dragged Title' })
    );
    expect(updateAck.ackType).toBe('RENDERED');
    expect(updateAck.sectionId).toBe('sec_1');
  });

  it('should handle SECTION_UPDATE during resize simulation', async () => {
    const { runtime } = makeRuntime();
    const adapter = createPreviewRuntimeAdapter(runtime);
    const doc = makeDoc();

    await adapter.handleMessage(createDocumentUpdate(doc));

    const updateAck = await adapter.handleMessage(
      createSectionUpdate('page_1', 'sec_1', { width: 500, height: 300 })
    );
    expect(updateAck.ackType).toBe('RENDERED');
    expect(updateAck.sectionId).toBe('sec_1');
  });

  it('should handle VIEWPORT_CHANGE for responsive preview', async () => {
    const { runtime } = makeRuntime();
    const adapter = createPreviewRuntimeAdapter(runtime);

    await adapter.handleMessage(createDocumentUpdate(makeDoc()));

    const mobileAck = await adapter.handleMessage({
      messageType: 'VIEWPORT_CHANGE',
      correlationId: 'vp_mobile',
      timestamp: Date.now(),
      width: 375,
      label: 'MOBILE',
    });
    expect(mobileAck.ackType).toBe('RENDERED');

    const desktopAck = await adapter.handleMessage({
      messageType: 'VIEWPORT_CHANGE',
      correlationId: 'vp_desktop',
      timestamp: Date.now(),
      width: 1280,
      label: 'DESKTOP',
    });
    expect(desktopAck.ackType).toBe('RENDERED');
  });

  it('should handle multiple SECTION_UPDATE messages in sequence', async () => {
    const { runtime } = makeRuntime();
    const adapter = createPreviewRuntimeAdapter(runtime);
    const doc = makeDoc();

    await adapter.handleMessage(createDocumentUpdate(doc));

    for (let i = 0; i < 10; i++) {
      const ack = await adapter.handleMessage(
        createSectionUpdate('page_1', 'sec_1', { title: `Update ${i}` })
      );
      expect(ack.ackType).toBe('RENDERED');
    }
  });

  it('should survive rapid SECTION_UPDATE + VIEWPORT_CHANGE interleaving', async () => {
    const { runtime } = makeRuntime();
    const adapter = createPreviewRuntimeAdapter(runtime);
    const doc = makeDoc();

    await adapter.handleMessage(createDocumentUpdate(doc));

    const promises = [
      adapter.handleMessage(createSectionUpdate('page_1', 'sec_1', { title: 'Rapid 1' })),
      adapter.handleMessage({
        messageType: 'VIEWPORT_CHANGE',
        correlationId: 'vp_rapid',
        timestamp: Date.now(),
        width: 768,
        label: 'TABLET',
      }),
      adapter.handleMessage(createSectionUpdate('page_1', 'sec_1', { title: 'Rapid 2' })),
    ];

    const results = await Promise.all(promises);
    expect(results.every(r => r.ackType === 'RENDERED')).toBe(true);
  });
});
