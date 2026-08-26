/**
 * TimelineHistoryBinding.ts — PM39 Timeline History & Undo/Redo Binding (ETAP 6)
 *
 * DECISION-061: Undo/Redo wykorzystuje istniejący mechanizm historii BuilderDocument.
 *
 * Integrates timeline authoring actions directly into the BuilderDocument HistoryStack.
 * Every timeline modification is committed as a single transaction snapshot.
 *
 * NO DOM, NO React, NO custom history engine creation.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { HistoryStack } from '../../../builder-core/src/HistoryStack';

export interface TimelineTransactionResult {
  readonly historyStack: HistoryStack<BuilderDocument>;
  readonly document: BuilderDocument;
  readonly transactionLabel: string;
}

/**
 * Executes a timeline mutation function as a single transaction in the HistoryStack.
 */
export function executeTimelineTransaction(
  historyStack: HistoryStack<BuilderDocument>,
  currentDoc: BuilderDocument,
  updater: (doc: BuilderDocument) => BuilderDocument,
  transactionLabel: string
): TimelineTransactionResult {
  const updatedDoc = updater(currentDoc);
  const nextStack = historyStack.push(updatedDoc, transactionLabel);

  return {
    historyStack: nextStack,
    document: updatedDoc,
    transactionLabel,
  };
}

/**
 * Undoes the latest timeline transaction.
 */
export function undoTimelineTransaction(
  historyStack: HistoryStack<BuilderDocument>
): { historyStack: HistoryStack<BuilderDocument>; document: BuilderDocument } | null {
  const result = historyStack.undo();
  if (!result) return null;

  return {
    historyStack: result.stack,
    document: result.state,
  };
}

/**
 * Redoes the next timeline transaction.
 */
export function redoTimelineTransaction(
  historyStack: HistoryStack<BuilderDocument>
): { historyStack: HistoryStack<BuilderDocument>; document: BuilderDocument } | null {
  const result = historyStack.redo();
  if (!result) return null;

  return {
    historyStack: result.stack,
    document: result.state,
  };
}
