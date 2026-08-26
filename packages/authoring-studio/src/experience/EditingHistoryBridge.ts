/**
 * EditingHistoryBridge.ts — Sprint S12 Undo/Redo Integration
 *
 * Connects real-time editing actions to the existing HistoryStack<BuilderDocument>
 * and TimelineHistoryBinding from S6/PM39.
 *
 * DECISION-061: History uses BuilderDocument as Single Source of Truth (SSOT).
 * NO second history engine creation.
 * NO DOM, NO React, NO window.
 */

import { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import { createHistoryStack, HistoryStack } from '../../../builder-core/src/HistoryStack';
import { executeTimelineTransaction, redoTimelineTransaction, undoTimelineTransaction } from '../timeline/TimelineHistoryBinding';

export interface EditingHistoryState {
  readonly historyStack: HistoryStack<BuilderDocument>;
  readonly currentDocument: BuilderDocument;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export function createEditingHistoryState(initialDoc: BuilderDocument): EditingHistoryState {
  const stack = createHistoryStack<BuilderDocument>(100).push(initialDoc, 'Initial Document');
  return {
    historyStack: stack,
    currentDocument: initialDoc,
    canUndo: stack.canUndo,
    canRedo: stack.canRedo,
  };
}

export function commitEditingTransaction(
  state: EditingHistoryState,
  updater: (doc: BuilderDocument) => BuilderDocument,
  transactionLabel: string
): EditingHistoryState {
  const tx = executeTimelineTransaction(
    state.historyStack,
    state.currentDocument,
    updater,
    transactionLabel
  );

  return {
    historyStack: tx.historyStack,
    currentDocument: tx.document,
    canUndo: tx.historyStack.canUndo,
    canRedo: tx.historyStack.canRedo,
  };
}

export function undoEditingTransaction(state: EditingHistoryState): EditingHistoryState {
  const result = undoTimelineTransaction(state.historyStack);
  if (!result) return state;

  return {
    historyStack: result.historyStack,
    currentDocument: result.document,
    canUndo: result.historyStack.canUndo,
    canRedo: result.historyStack.canRedo,
  };
}

export function redoEditingTransaction(state: EditingHistoryState): EditingHistoryState {
  const result = redoTimelineTransaction(state.historyStack);
  if (!result) return state;

  return {
    historyStack: result.historyStack,
    currentDocument: result.document,
    canUndo: result.historyStack.canUndo,
    canRedo: result.historyStack.canRedo,
  };
}
