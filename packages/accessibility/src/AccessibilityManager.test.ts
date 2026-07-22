import { describe, it, expect } from 'vitest';
import { AccessibilityManager } from './AccessibilityManager';

describe('AccessibilityManager', () => {
  const manager = new AccessibilityManager();

  it('should set high contrast mode', () => {
    manager.setContext({ highContrast: true });
    expect(manager.getContext().highContrast).toBe(true);
  });

  it('should manage focus stack', () => {
    manager.pushFocus({ id: 'btn-1', elementType: 'button', tabIndex: 0 });
    manager.pushFocus({ id: 'input-1', elementType: 'input', tabIndex: 0 });

    expect(manager.getCurrentFocus()?.id).toBe('input-1');
    expect(manager.popFocus()?.id).toBe('input-1');
    expect(manager.getCurrentFocus()?.id).toBe('btn-1');
  });

  it('should register keyboard shortcuts', () => {
    manager.registerShortcut({ key: 's', modifiers: ['ctrl'], action: 'save', description: 'Save document' });
    const shortcut = manager.getShortcut('s', ['ctrl']);
    expect(shortcut?.action).toBe('save');
  });
});