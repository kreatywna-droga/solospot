/**
 * PreviewRuntimeAdapter — C6.1-C / C6.3-F
 *
 * The ONE place in builder-core that imports from runtime-core.
 * All other builder-core files must NOT import runtime-core.
 *
 * This adapter:
 *   1. Subscribes to the runtimeSide of a MemoryChannel
 *   2. On DOCUMENT_UPDATE: delegates to PreviewRuntime
 *   3. Sends back a PreviewAck (RENDERED or ERROR)
 *
 * C6.3-F architectural principle:
 *   Adapter knows ONLY about PreviewRuntime.
 *   It does NOT know about TemplateRuntime, ComponentRuntime,
 *   ThemeRuntime, AssetResolver, or PreviewPipeline.
 *   All runtime internals are encapsulated behind PreviewRuntime.
 *
 * NOTE: runtime-core import is intentionally dynamic-style via a factory
 * parameter so that builder-core package itself remains free of a hard
 * compile-time dep on runtime-core. Consumers wire them together at the
 * app level.
 */

import { CompiledDocument } from './BuilderDocument';
import { PreviewMessage, PreviewAck } from './PreviewMessage';
import { PreviewRuntime, PreviewRuntimeResult } from '../../theme-runtime/src/PreviewRuntime';

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------

export interface PreviewRenderer {
  render(compiled: CompiledDocument): Promise<{ html: string; renderTimeMs: number }>;
}

export interface PreviewRuntimeAdapter {
  handleMessage(message: PreviewMessage): Promise<PreviewAck>;
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createPreviewRuntimeAdapter(
  runtime: PreviewRuntime,
  onRender?: (html: string) => void
): PreviewRuntimeAdapter {
  let destroyed = false;

  return {
    async handleMessage(message) {
      if (destroyed) {
        return {
          ackType: 'ERROR',
          correlationId: message.correlationId,
          timestamp: Date.now(),
          error: 'Adapter destroyed',
        };
      }

      if (message.messageType === 'PING') {
        return {
          ackType: 'PONG',
          correlationId: message.correlationId,
          timestamp: Date.now(),
        };
      }

      if (message.messageType === 'DOCUMENT_UPDATE') {
        const start = Date.now();
        try {
          const { compile } = await import('./BuilderDocument');
          const compiled = compile(message.document) as CompiledDocument;

          runtime.updateSession({
            document: {
              storeId: compiled.storeId,
              tenantId: compiled.tenantId,
              storeName: compiled.storeName,
              storeSlug: compiled.storeSlug,
              publicationStatus: compiled.publicationStatus,
              branding: compiled.branding,
              pages: compiled.pages.map((page) => ({
                id: page.id,
                slug: page.slug,
                name: page.name,
                sections: page.sections.map((section) => ({
                  id: section.id,
                  type: section.type,
                  label: section.label,
                  props: section.props,
                  order: section.order,
                  visible: section.visible,
                })),
              })),
              locale: compiled.locale,
              currency: compiled.currency,
            },
          });

          const result = await runtime.renderPage(message.correlationId);
          onRender?.(result.html);

          return {
            ackType: 'RENDERED',
            correlationId: message.correlationId,
            timestamp: Date.now(),
            renderTimeMs: result.renderTimeMs,
          };
        } catch (err) {
          return {
            ackType: 'ERROR',
            correlationId: message.correlationId,
            timestamp: Date.now(),
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }

      if (message.messageType === 'SECTION_UPDATE') {
        try {
          const result = await runtime.renderSection(
            message.pageId,
            message.sectionId,
            message.props,
            message.correlationId
          );
          onRender?.(result.html);

          return {
            ackType: 'RENDERED',
            correlationId: message.correlationId,
            timestamp: Date.now(),
            renderTimeMs: result.renderTimeMs,
            sectionId: message.sectionId,
          };
        } catch (err) {
          return {
            ackType: 'ERROR',
            correlationId: message.correlationId,
            timestamp: Date.now(),
            error: err instanceof Error ? err.message : String(err),
            sectionId: message.sectionId,
          };
        }
      }

      if (message.messageType === 'VIEWPORT_CHANGE') {
        runtime.updateSession({
          viewport: {
            width: message.width,
            label: message.label,
          },
        });

        try {
          const result = await runtime.renderPage(message.correlationId);
          onRender?.(result.html);

          return {
            ackType: 'RENDERED',
            correlationId: message.correlationId,
            timestamp: Date.now(),
            renderTimeMs: result.renderTimeMs,
          };
        } catch (err) {
          return {
            ackType: 'ERROR',
            correlationId: message.correlationId,
            timestamp: Date.now(),
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }

      return {
        ackType: 'RENDERED',
        correlationId: message.correlationId,
        timestamp: Date.now(),
        renderTimeMs: 0,
      };
    },

    destroy() {
      destroyed = true;
    },
  };
}
