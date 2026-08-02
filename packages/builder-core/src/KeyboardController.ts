/**
 * KeyboardController — C16.4
 *
 * Pure-logic keyboard shortcut handler for the Studio.
 *
 * Maps keyboard events → CanvasAction commands.
 * No React, no DOM dependency — pure function.
 *
 * Usage:
 *   const action = KeyboardController.handleKeyDown(event, document, canvas)
 *   if (action) dispatch({ type: 'CANVAS', action })
 */

import { CanvasAction, CanvasState, ViewportLabel } from './CanvasState';
import { BuilderDocument, SectionNode } from './BuilderDocument';
import { findNode } from './SectionTree';

// ---------------------------------------------------------------------------
// Keyboard mapping table
// ---------------------------------------------------------------------------

export interface KeyBinding {
  readonly key: string;
  readonly ctrl?: boolean;
  readonly shift?: boolean;
  readonly meta?: boolean;   // for Mac Cmd key
  readonly alt?: boolean;
  readonly action: (doc: BuilderDocument, canvas: CanvasState) => CanvasAction;
}

// ---------------------------------------------------------------------------
// KeyboardController
// ---------------------------------------------------------------------------

export class KeyboardController {
  /**
   * Process a keyboard event and produce a CanvasAction (or null if unhandled).
   * Pure function — no side effects.
   */
  static handleKeyDown(
    e: { key: string; ctrlKey: boolean; shiftKey: boolean; metaKey: boolean; altKey: boolean; preventDefault: () => void },
    document: BuilderDocument,
    canvas: CanvasState
  ): CanvasAction | null {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
    const ctrl = isMac ? e.metaKey : e.ctrlKey;  // Cmd on Mac = Ctrl
    const meta = e.metaKey;

    // --- Tab navigation ---
    if (e.key === 'Tab' && !ctrl && !meta) {
      e.preventDefault();
      if (e.shiftKey) {
        return { type: 'SELECT_PREV' };
      }
      return { type: 'SELECT_NEXT' };
    }

    // --- Arrow key navigation ---
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      return { type: 'SELECT_PREV' };
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      return { type: 'SELECT_NEXT' };
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      return { type: 'SELECT_CHILD' };
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      // If container: select parent, otherwise deselect
      const selectedId = canvas.selection.selectedIds[0];
      if (selectedId) {
        const found = findNode(document.pages.flatMap(p => p.sections), selectedId);
        if (found && found.node.children.length > 0) {
          return { type: 'SELECT_PARENT' };
        }
      }
      return { type: 'SELECT_SECTION', sectionId: null };
    }

    // --- Escape ---
    if (e.key === 'Escape' && !ctrl && !meta) {
      e.preventDefault();
      if (canvas.selection.selectedIds.length > 0) {
        // Try to go to parent first
        const selectedId = canvas.selection.selectedIds[0];
        if (selectedId) {
          for (const page of document.pages) {
            const found = findNode(page.sections, selectedId);
            if (found && found.path.length > 0) {
              return { type: 'SELECT_PARENT' };
            }
          }
        }
        // Otherwise deselect
        return { type: 'SELECT_SECTION', sectionId: null };
      }
      return { type: 'SELECT_SECTION', sectionId: null };
    }

    // --- Delete / Backspace ---
    if ((e.key === 'Delete' || e.key === 'Backspace') && !ctrl && !meta && !e.shiftKey) {
      e.preventDefault();
      // This should trigger REMOVE_SECTION — handled by BuilderContext dispatch
      // Return null and let the UI layer handle it via a different path
      return null; // delegated to document command
    }

    // --- Ctrl+A (Select All) ---
    if (ctrl && !e.shiftKey && e.key === 'a') {
      e.preventDefault();
      const currentPageId = canvas.selectedPageId ?? document.pages[0]?.id;
      if (currentPageId) {
        return { type: 'SELECT_ALL', pageId: currentPageId };
      }
      return null;
    }

    // --- Ctrl+C (Copy) ---
    if (ctrl && e.key === 'c' && !e.shiftKey) {
      e.preventDefault();
      // Handled by UI layer for clipboard
      return null;
    }

    // --- Ctrl+V (Paste) ---
    if (ctrl && e.key === 'v' && !e.shiftKey) {
      e.preventDefault();
      return null;
    }

    // --- Ctrl+X (Cut) ---
    if (ctrl && e.key === 'x' && !e.shiftKey) {
      e.preventDefault();
      return null;
    }

    // --- Ctrl+D (Duplicate) ---
    if (ctrl && e.key === 'd' && !e.shiftKey) {
      e.preventDefault();
      return null; // handled as BuilderCommand
    }

    // --- Ctrl+Z (Undo) ---
    if (ctrl && !e.shiftKey && e.key === 'z') {
      e.preventDefault();
      return null; // handled by BuilderContext (UNDO command)
    }

    // --- Ctrl+Shift+Z (Redo) ---
    if (ctrl && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      return null; // handled by BuilderContext (REDO command)
    }

    // --- Ctrl+S (Save) ---
    if (ctrl && e.key === 's' && !e.shiftKey) {
      e.preventDefault();
      return null; // handled by UI layer (onSave callback)
    }

    // --- Ctrl+1-5 (Tab switching) ---
    if (ctrl && !e.shiftKey && ['1','2','3','4','5'].includes(e.key)) {
      e.preventDefault();
      return null; // handled by UI layer (tab state)
    }

    // --- Viewport shortcuts ---
    if (ctrl && e.shiftKey && e.key === 'm') {
      e.preventDefault();
      return { type: 'SET_VIEWPORT', viewport: { width: 375, label: 'MOBILE' } };
    }

    if (ctrl && e.shiftKey && e.key === 't') {
      e.preventDefault();
      return { type: 'SET_VIEWPORT', viewport: { width: 768, label: 'TABLET' } };
    }

    if (ctrl && e.shiftKey && e.key === 'd') {
      e.preventDefault();
      return { type: 'SET_VIEWPORT', viewport: { width: 1280, label: 'DESKTOP' } };
    }

    // --- Enter (inline edit / confirm) ---
    if (e.key === 'Enter' && !ctrl && !meta && !e.shiftKey) {
      e.preventDefault();
      return null; // inline edit — handled by UI
    }

    return null;
  }

  /**
   * Get a description of the keyboard shortcut for display in tooltips.
   */
  static getShortcutLabel(key: string, ctrl = false, shift = false, alt = false): string {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
    const parts: string[] = [];
    if (isMac) {
      if (ctrl) parts.push('⌘');
    } else {
      if (ctrl) parts.push('Ctrl');
    }
    if (shift) parts.push('Shift');
    if (alt) parts.push('Alt');
    parts.push(key.length === 1 ? key.toUpperCase() : key);
    return parts.join('+');
  }
}

