// BuilderUX.ts
// C7.7: Builder Pro — UX layer

import { KeyboardShortcutRegistry, Shortcut } from './KeyboardShortcutRegistry';
import { BuilderDocument } from './BuilderDocument';
import { CanvasState, CanvasAction, reduceCanvasState } from './CanvasState';

export interface BuilderUXState {
  readonly clipboard: ReadonlyArray<BuilderDocument>;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export function createBuilderUX(): {
  readonly registry: KeyboardShortcutRegistry;
  readonly reduce: (state: CanvasState, action: CanvasAction) => CanvasState;
} {
  const registry = new KeyboardShortcutRegistry();

  registry.register({
    key: 'z',
    modifiers: { ctrl: true },
    action: () => {},
    description: 'Undo',
  });

  registry.register({
    key: 'z',
    modifiers: { ctrl: true, shift: true },
    action: () => {},
    description: 'Redo',
  });

  registry.register({
    key: 'c',
    modifiers: { ctrl: true },
    action: () => {},
    description: 'Copy',
  });

  registry.register({
    key: 'v',
    modifiers: { ctrl: true },
    action: () => {},
    description: 'Paste',
  });

  registry.register({
    key: 'd',
    modifiers: { ctrl: true },
    action: () => {},
    description: 'Duplicate',
  });

  registry.register({
    key: 'a',
    modifiers: { ctrl: true },
    action: () => {},
    description: 'Select All',
  });

  registry.register({
    key: 'Delete',
    action: () => {},
    description: 'Delete selected',
  });

  registry.register({
    key: 'Backspace',
    action: () => {},
    description: 'Delete selected',
  });

  registry.register({
    key: 'Escape',
    action: () => {},
    description: 'Deselect',
  });

  return {
    registry,
    reduce: reduceCanvasState,
  };
}
