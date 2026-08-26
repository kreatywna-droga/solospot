/**
 * TransformHistoryBinding.ts — Sprint S22 History Binding Engine
 *
 * Integrates transform and selection operations directly with the single existing
 * HistoryStack<BuilderDocument> from builder-core.
 *
 * ZERO secondary history stack!
 */

import { BuilderDocument, HistoryStack } from '../../../builder-core/src';

export class TransformHistoryBinding {
  /**
   * Pushes updated BuilderDocument state onto the single HistoryStack snapshot stack.
   */
  public static pushTransformState(
    historyStack: HistoryStack<BuilderDocument>,
    document: BuilderDocument,
    actionLabel: string
  ): HistoryStack<BuilderDocument> {
    return historyStack.push(document, actionLabel);
  }

  /**
   * Executes Undo operation on the single HistoryStack.
   */
  public static undo(
    historyStack: HistoryStack<BuilderDocument>
  ): { stack: HistoryStack<BuilderDocument>; state: BuilderDocument } | null {
    return historyStack.undo();
  }

  /**
   * Executes Redo operation on the single HistoryStack.
   */
  public static redo(
    historyStack: HistoryStack<BuilderDocument>
  ): { stack: HistoryStack<BuilderDocument>; state: BuilderDocument } | null {
    return historyStack.redo();
  }
}
