// KeyboardShortcutRegistry.ts
// C7: Builder Pro — keyboard shortcuts

export interface Shortcut {
  readonly key: string;
  readonly modifiers?: {
    readonly ctrl?: boolean;
    readonly shift?: boolean;
    readonly alt?: boolean;
    readonly meta?: boolean;
  };
  readonly action: () => void;
  readonly description: string;
}

export class KeyboardShortcutRegistry {
  private readonly shortcuts = new Map<string, Shortcut>();

  public register(shortcut: Shortcut): void {
    const key = this.buildKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  public unregister(key: string): void {
    this.shortcuts.delete(key);
  }

  public handleKeyDown(event: KeyboardEvent): void {
    const key = this.buildKeyFromEvent(event);
    const shortcut = this.shortcuts.get(key);
    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
    }
  }

  public getRegisteredShortcuts(): ReadonlyArray<Shortcut> {
    return Array.from(this.shortcuts.values());
  }

  private buildKey(shortcut: Shortcut): string {
    const parts: string[] = [];
    if (shortcut.modifiers?.ctrl) parts.push('ctrl');
    if (shortcut.modifiers?.shift) parts.push('shift');
    if (shortcut.modifiers?.alt) parts.push('alt');
    if (shortcut.modifiers?.meta) parts.push('meta');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  private buildKeyFromEvent(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }
}
