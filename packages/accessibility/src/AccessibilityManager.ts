import { AccessibilityContext, FocusTarget, KeyboardShortcut } from './AccessibilityDomain';

export class AccessibilityManager {
  private context: AccessibilityContext = {
    highContrast: false,
    reducedMotion: false,
    fontSize: 'normal',
    screenReader: false
  };
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private focusStack: FocusTarget[] = [];

  setContext(updates: Partial<AccessibilityContext>): void {
    this.context = { ...this.context, ...updates };
  }

  getContext(): AccessibilityContext {
    return this.context;
  }

  registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  getShortcut(key: string, modifiers: string[]): KeyboardShortcut | undefined {
    return this.shortcuts.get(this.getShortcutKey({ key, modifiers }));
  }

  private getShortcutKey(shortcut: { key: string; modifiers: string[] }): string {
    return `${shortcut.modifiers.join('+')}+${shortcut.key}`.toLowerCase();
  }

  pushFocus(target: FocusTarget): void {
    this.focusStack.push(target);
  }

  popFocus(): FocusTarget | undefined {
    return this.focusStack.pop();
  }

  getCurrentFocus(): FocusTarget | undefined {
    return this.focusStack[this.focusStack.length - 1];
  }
}