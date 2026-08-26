/**
 * CommandHistoryIntegration.ts — Sprint S4 Command & Undo/Redo Integration (ETAP 5)
 *
 * Connects Command Palette, Keyboard Shortcuts, and the PM39 Timeline Undo/Redo
 * transaction mechanism via BuilderDocument SSOT (DECISION-061).
 *
 * NO DOM, NO React, NO Browser API.
 */

import {
  executeTimelineTransaction,
  undoTimelineTransaction,
  redoTimelineTransaction,
  type TimelineTransactionResult,
} from '../../timeline/TimelineHistoryBinding';
import type { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import type { HistoryStack } from '../../../../builder-core/src/HistoryStack';

export interface CommandHistoryControllerState {
  readonly historyStack: HistoryStack<BuilderDocument>;
  readonly currentDocument: BuilderDocument;
}

export function executeCommandWithUndo(
  state: CommandHistoryControllerState,
  updater: (doc: BuilderDocument) => BuilderDocument,
  description: string
): CommandHistoryControllerState {
  const result: TimelineTransactionResult = executeTimelineTransaction(
    state.historyStack,
    state.currentDocument,
    updater,
    description
  );

  return {
    historyStack: result.historyStack,
    currentDocument: result.document,
  };
}

export function undoLastCommand(
  state: CommandHistoryControllerState
): CommandHistoryControllerState | null {
  const result = undoTimelineTransaction(state.historyStack);
  if (!result) return null;

  return {
    historyStack: result.historyStack,
    currentDocument: result.document,
  };
}

export function redoLastCommand(
  state: CommandHistoryControllerState
): CommandHistoryControllerState | null {
  const result = redoTimelineTransaction(state.historyStack);
  if (!result) return null;

  return {
    historyStack: result.historyStack,
    currentDocument: result.document,
  };
}
