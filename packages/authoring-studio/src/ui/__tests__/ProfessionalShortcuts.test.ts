import { describe, it, expect, vi } from 'vitest';
import { ProfessionalShortcutsHandler } from '../ProfessionalShortcutsHandler';

describe('ProfessionalShortcutsHandler (S14 ETAP 7)', () => {
  it('handles tool mode shortcuts (V, W, E, R, G)', () => {
    const onSetToolMode = vi.fn();
    const handler = new ProfessionalShortcutsHandler({
      onSetToolMode,
      onTogglePreview: vi.fn(),
      onDuplicate: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
    });

    handler.handleKeyDown({ key: 'w', code: 'KeyW', target: document.body } as unknown as KeyboardEvent);
    expect(onSetToolMode).toHaveBeenCalledWith('move');
    expect(handler.getActiveToolMode()).toBe('move');

    handler.handleKeyDown({ key: 'e', code: 'KeyE', target: document.body } as unknown as KeyboardEvent);
    expect(onSetToolMode).toHaveBeenCalledWith('rotate');
    expect(handler.getActiveToolMode()).toBe('rotate');

    handler.handleKeyDown({ key: 'r', code: 'KeyR', target: document.body } as unknown as KeyboardEvent);
    expect(onSetToolMode).toHaveBeenCalledWith('scale');
    expect(handler.getActiveToolMode()).toBe('scale');
  });

  it('handles Space, Ctrl+D, Ctrl+Z, Ctrl+Shift+Z shortcuts', () => {
    const onTogglePreview = vi.fn();
    const onDuplicate = vi.fn();
    const onUndo = vi.fn();
    const onRedo = vi.fn();

    const handler = new ProfessionalShortcutsHandler({
      onSetToolMode: vi.fn(),
      onTogglePreview,
      onDuplicate,
      onUndo,
      onRedo,
    });

    const preventDefault = vi.fn();

    handler.handleKeyDown({ code: 'Space', key: ' ', preventDefault, target: document.body } as unknown as KeyboardEvent);
    expect(onTogglePreview).toHaveBeenCalledTimes(1);

    handler.handleKeyDown({ ctrlKey: true, key: 'd', preventDefault, target: document.body } as unknown as KeyboardEvent);
    expect(onDuplicate).toHaveBeenCalledTimes(1);

    handler.handleKeyDown({ ctrlKey: true, key: 'z', preventDefault, target: document.body } as unknown as KeyboardEvent);
    expect(onUndo).toHaveBeenCalledTimes(1);

    handler.handleKeyDown({ ctrlKey: true, shiftKey: true, key: 'z', preventDefault, target: document.body } as unknown as KeyboardEvent);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });
});
