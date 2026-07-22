/**
 * PreviewMessage — C6.1-C
 *
 * Message types exchanged between the Builder UI and the Preview Runtime.
 * These are plain serializable objects — safe for postMessage, WebSocket, etc.
 */

import { BuilderDocument } from './BuilderDocument';

// ---------------------------------------------------------------------------
// Outbound (Builder → Preview Runtime)
// ---------------------------------------------------------------------------

export type PreviewMessageType =
  | 'DOCUMENT_UPDATE'     // full document snapshot
  | 'SECTION_UPDATE'      // single section prop change (optimised partial update)
  | 'SECTION_HIGHLIGHT'   // highlight a section in the preview (hover sync)
  | 'SECTION_SELECT'      // select (scroll to) a section in the preview
  | 'VIEWPORT_CHANGE'     // change simulated viewport width
  | 'THEME_UPDATE'        // only theme changed — avoids full re-render
  | 'RESET'               // clear preview state
  | 'PING';               // health check

export interface PreviewMessageBase {
  readonly messageType: PreviewMessageType;
  readonly correlationId: string;
  readonly timestamp: number;       // Unix ms
}

export interface DocumentUpdateMessage extends PreviewMessageBase {
  readonly messageType: 'DOCUMENT_UPDATE';
  readonly document: BuilderDocument;
  readonly changedSectionIds?: ReadonlyArray<string>;  // hint for partial re-render
}

export interface SectionUpdateMessage extends PreviewMessageBase {
  readonly messageType: 'SECTION_UPDATE';
  readonly pageId: string;
  readonly sectionId: string;
  readonly props: Record<string, unknown>;
}

export interface SectionHighlightMessage extends PreviewMessageBase {
  readonly messageType: 'SECTION_HIGHLIGHT';
  readonly sectionId: string | null;
}

export interface SectionSelectMessage extends PreviewMessageBase {
  readonly messageType: 'SECTION_SELECT';
  readonly sectionId: string;
}

export interface ViewportChangeMessage extends PreviewMessageBase {
  readonly messageType: 'VIEWPORT_CHANGE';
  readonly width: number;
  readonly label: 'MOBILE' | 'TABLET' | 'DESKTOP';
}

export interface ThemeUpdateMessage extends PreviewMessageBase {
  readonly messageType: 'THEME_UPDATE';
  readonly theme: Record<string, unknown>;
}

export interface ResetMessage extends PreviewMessageBase {
  readonly messageType: 'RESET';
}

export interface PingMessage extends PreviewMessageBase {
  readonly messageType: 'PING';
}

export type PreviewMessage =
  | DocumentUpdateMessage
  | SectionUpdateMessage
  | SectionHighlightMessage
  | SectionSelectMessage
  | ViewportChangeMessage
  | ThemeUpdateMessage
  | ResetMessage
  | PingMessage;

// ---------------------------------------------------------------------------
// Inbound (Preview Runtime → Builder)
// ---------------------------------------------------------------------------

export type PreviewAckType = 'RENDERED' | 'ERROR' | 'PONG' | 'READY';

export interface PreviewAck {
  readonly ackType: PreviewAckType;
  readonly correlationId: string;
  readonly timestamp: number;
  readonly renderTimeMs?: number;
  readonly error?: string;
  readonly sectionId?: string;        // which section caused an error
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

function correlationId(): string {
  return `prev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createDocumentUpdate(
  document: BuilderDocument,
  changedSectionIds?: string[]
): DocumentUpdateMessage {
  return {
    messageType: 'DOCUMENT_UPDATE',
    correlationId: correlationId(),
    timestamp: Date.now(),
    document,
    changedSectionIds,
  };
}

export function createSectionUpdate(
  pageId: string,
  sectionId: string,
  props: Record<string, unknown>
): SectionUpdateMessage {
  return {
    messageType: 'SECTION_UPDATE',
    correlationId: correlationId(),
    timestamp: Date.now(),
    pageId,
    sectionId,
    props,
  };
}

export function createSectionHighlight(sectionId: string | null): SectionHighlightMessage {
  return {
    messageType: 'SECTION_HIGHLIGHT',
    correlationId: correlationId(),
    timestamp: Date.now(),
    sectionId,
  };
}

export function createViewportChange(
  width: number,
  label: 'MOBILE' | 'TABLET' | 'DESKTOP'
): ViewportChangeMessage {
  return {
    messageType: 'VIEWPORT_CHANGE',
    correlationId: correlationId(),
    timestamp: Date.now(),
    width,
    label,
  };
}

export function createThemeUpdate(theme: Record<string, unknown>): ThemeUpdateMessage {
  return {
    messageType: 'THEME_UPDATE',
    correlationId: correlationId(),
    timestamp: Date.now(),
    theme,
  };
}
