/**
 * BuilderContext — C6.1-D
 *
 * Root aggregation of all Builder engine state.
 *
 * DESIGN DECISIONS:
 *   1. NOT a global singleton — createBuilderContext() returns a fresh context.
 *      The UI layer (React) decides where to store it (local state, context, etc.)
 *   2. dispatch() is the ONLY mutation path — no direct field mutation.
 *   3. CANVAS commands do NOT create history entries — they are transient UI state.
 *   4. UNDO/REDO are handled here, not in BuilderCommands.
 *   5. Preview sends are automatic after every document-mutating command.
 *
 * Integration:
 *   BuilderContext → dispatch(cmd) → applyCommandToDocument(doc, cmd)
 *                                  → HistoryStack.push(newDoc, label)
 *                                  → PreviewChannel.send(DocumentUpdateMessage)
 */

import { BuilderDocument } from './BuilderDocument';
import { CanvasState, createCanvasState, reduceCanvasState } from './CanvasState';
import { BuilderComponentRegistry } from './ComponentRegistry';
import { HistoryStack, createHistoryStack } from './HistoryStack';
import { PreviewChannel } from './PreviewContract';
import { BuilderCommand, applyCommandToDocument, commandLabel } from './BuilderCommands';
import { createDocumentUpdate, createSectionUpdate } from './PreviewMessage';

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

export interface BuilderContext {
  readonly document: BuilderDocument;
  readonly canvas: CanvasState;
  readonly history: HistoryStack<BuilderDocument>;
  readonly registry: BuilderComponentRegistry;
  readonly preview: PreviewChannel;

  /**
   * Apply a command. Returns the new BuilderContext (immutable update).
   * Automatically:
   *   - Mutates the BuilderDocument (for document commands)
   *   - Pushes to HistoryStack (for document-mutating commands)
   *   - Reduces CanvasState (for CANVAS commands)
   *   - Handles UNDO/REDO
   *   - Sends preview update (async, fire-and-forget)
   */
  dispatch(command: BuilderCommand): BuilderContext;
}

// ---------------------------------------------------------------------------
// Commands that are canvas-only (do NOT touch document or history)
// ---------------------------------------------------------------------------

const CANVAS_ONLY_COMMANDS = new Set<BuilderCommand['type']>(['CANVAS']);
const HISTORY_SKIP_COMMANDS = new Set<BuilderCommand['type']>(['CANVAS', 'MARK_PUBLISHED']);

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createBuilderContext(params: {
  document: BuilderDocument;
  registry: BuilderComponentRegistry;
  preview: PreviewChannel;
  maxHistoryEntries?: number;
}): BuilderContext {
  const initialHistory = createHistoryStack<BuilderDocument>(params.maxHistoryEntries ?? 50)
    .push(params.document, 'Initial document');

  return buildContext(
    params.document,
    createCanvasState({ selectedPageId: params.document.pages[0]?.id ?? null }),
    initialHistory,
    params.registry,
    params.preview
  );
}

function buildContext(
  document: BuilderDocument,
  canvas: CanvasState,
  history: HistoryStack<BuilderDocument>,
  registry: BuilderComponentRegistry,
  preview: PreviewChannel
): BuilderContext {
  return {
    document,
    canvas,
    history,
    registry,
    preview,

    dispatch(command: BuilderCommand): BuilderContext {
      // --- UNDO ---
      if (command.type === 'UNDO') {
        const result = history.undo();
        if (!result) return this;
        sendPreviewUpdate(preview, result.state);
        return buildContext(result.state, canvas, result.stack, registry, preview);
      }

      // --- REDO ---
      if (command.type === 'REDO') {
        const result = history.redo();
        if (!result) return this;
        sendPreviewUpdate(preview, result.state);
        return buildContext(result.state, canvas, result.stack, registry, preview);
      }

      // --- CANVAS only ---
      if (CANVAS_ONLY_COMMANDS.has(command.type)) {
        if (command.type === 'CANVAS') {
          const nextCanvas = reduceCanvasState(canvas, command.action);
          
          // Preview sync for drag/resize/breakpoint
          if (
            command.action.type === 'BEGIN_DRAG' ||
            command.action.type === 'UPDATE_DRAG' ||
            command.action.type === 'BEGIN_RESIZE' ||
            command.action.type === 'UPDATE_RESIZE'
          ) {
            const sectionId = 'sectionId' in command.action ? command.action.sectionId : canvas.dragState?.sectionId
            if (sectionId) {
              const pageId = 'sourcePageId' in command.action ? command.action.sourcePageId : canvas.selectedPageId
              const page = document.pages.find(p => p.id === pageId)
              if (page) {
                const section = page.sections.find(s => s.id === sectionId)
                if (section) {
                  sendSectionUpdate(preview, page.id, sectionId, section.props)
                }
              }
            }
          }
          
          if (command.action.type === 'SET_BREAKPOINT') {
            const pageId = canvas.selectedPageId
            if (pageId) {
              const page = document.pages.find(p => p.id === pageId)
              if (page) {
                for (const section of page.sections) {
                  sendSectionUpdate(preview, pageId, section.id, section.props)
                }
              }
            }
          }
          
          return buildContext(document, nextCanvas, history, registry, preview);
        }
        return this;
      }

      // --- Document mutation ---
      const nextDoc = applyCommandToDocument(document, command);

      // Canvas: auto-select new sections when added
      let nextCanvas = canvas;
      if (
        (command.type === 'ADD_SECTION' || command.type === 'ADD_CHILD_SECTION') &&
        nextDoc !== document
      ) {
        nextCanvas = reduceCanvasState(canvas, {
          type: 'SELECT_SECTION',
          sectionId: null,        // will be updated by UI once it knows the new ID
          pageId: command.pageId,
        });
      }

      if (command.type === 'REMOVE_SECTION') {
        // Deselect if the removed section was selected
        if (canvas.selectedSectionId === command.sectionId) {
          nextCanvas = reduceCanvasState(canvas, { type: 'SELECT_SECTION', sectionId: null });
        }
      }

      // History — only for document-mutating commands
      let nextHistory = history;
      if (!HISTORY_SKIP_COMMANDS.has(command.type) && nextDoc !== document) {
        nextHistory = history.push(nextDoc, commandLabel(command));
      }

      // Preview — fire and forget
      if (nextDoc !== document) {
        sendPreviewUpdate(preview, nextDoc);
      }

      return buildContext(nextDoc, nextCanvas, nextHistory, registry, preview);
    },
  };
}

// ---------------------------------------------------------------------------
// Preview integration helper
// ---------------------------------------------------------------------------

function sendPreviewUpdate(preview: PreviewChannel, doc: BuilderDocument): void {
  if (!preview.isReady) return;
  try {
    preview.send(createDocumentUpdate(doc));
  } catch {
    // Preview errors must never bubble to the builder
  }
}

function sendSectionUpdate(preview: PreviewChannel, pageId: string, sectionId: string, props: Record<string, unknown>): void {
  if (!preview.isReady) return;
  try {
    preview.send(createSectionUpdate(pageId, sectionId, props));
  } catch {
    // Preview errors must never bubble to the builder
  }
}
