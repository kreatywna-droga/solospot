/**
 * ProfessionalShortcutsHandler.ts — Sprint S14 Professional Shortcuts System
 *
 * Implements keyboard shortcuts for animation authoring:
 * V (Select), W (Move), E (Rotate), R (Scale), G (Pan), Space (Preview Toggle),
 * Ctrl/Cmd+D (Duplicate), Ctrl/Cmd+Z (Undo), Ctrl/Cmd+Shift+Z (Redo).
 * Integrates with TimelineShortcuts & CommandEngine.
 */

export type ToolMode = 'select' | 'move' | 'rotate' | 'scale' | 'pan';

export interface ShortcutActionCallbacks {
  readonly onSetToolMode: (mode: ToolMode) => void;
  readonly onTogglePreview: () => void;
  readonly onDuplicate: () => void;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
}

export class ProfessionalShortcutsHandler {
  private activeToolMode: ToolMode = 'select';
  private readonly callbacks: ShortcutActionCallbacks;

  constructor(callbacks: ShortcutActionCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Returns currently active authoring tool mode.
   */
  public getActiveToolMode(): ToolMode {
    return this.activeToolMode;
  }

  /**
   * Processes keydown events and triggers corresponding authoring action.
   */
  public handleKeyDown(event: KeyboardEvent): boolean {
    // Ignore input text fields
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return false;
    }

    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    // Ctrl/Cmd + Shift + Z -> Redo
    if (isCtrlOrCmd && event.shiftKey && key === 'z') {
      event.preventDefault();
      this.callbacks.onRedo();
      return true;
    }

    // Ctrl/Cmd + Z -> Undo
    if (isCtrlOrCmd && key === 'z') {
      event.preventDefault();
      this.callbacks.onUndo();
      return true;
    }

    // Ctrl/Cmd + D -> Duplicate
    if (isCtrlOrCmd && key === 'd') {
      event.preventDefault();
      this.callbacks.onDuplicate();
      return true;
    }

    // Space -> Toggle Preview
    if (event.code === 'Space' || key === ' ') {
      event.preventDefault();
      this.callbacks.onTogglePreview();
      return true;
    }

    // Single key tool shortcuts
    switch (key) {
      case 'v':
        this.activeToolMode = 'select';
        this.callbacks.onSetToolMode('select');
        return true;
      case 'w':
        this.activeToolMode = 'move';
        this.callbacks.onSetToolMode('move');
        return true;
      case 'e':
        this.activeToolMode = 'rotate';
        this.callbacks.onSetToolMode('rotate');
        return true;
      case 'r':
        this.activeToolMode = 'scale';
        this.callbacks.onSetToolMode('scale');
        return true;
      case 'g':
        this.activeToolMode = 'pan';
        this.callbacks.onSetToolMode('pan');
        return true;
    }

    return false;
  }
}
