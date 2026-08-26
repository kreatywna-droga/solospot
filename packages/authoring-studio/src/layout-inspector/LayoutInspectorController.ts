/**
 * LayoutInspectorController.ts — Sprint S30 Inspector Orchestration Controller
 *
 * Orchestrates layout field catalog inspection, reading inspector state, validating & applying
 * field changes through commands + HistoryStack.push, and registering fields into PropertyRegistry.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { HistoryStack } from '../../../builder-core/src/HistoryStack';
import type { PropertyFieldDefinition } from '../inspector/registry/types';
import type { PropertyRegistry } from '../inspector/registry/PropertyRegistry';
import type { BreakpointId } from '../responsive/ResponsiveValueModel';
import { LAYOUT_FIELD_DEFINITIONS } from './LayoutFieldCatalog';
import { readLayoutInspectorState, type LayoutInspectorState } from './LayoutInspectorModel';
import { applyLayoutFieldChange } from './LayoutInspectorCommands';

export interface ApplyFieldChangeParams {
  readonly doc: BuilderDocument;
  readonly history: HistoryStack<BuilderDocument>;
  readonly nodeId: string;
  readonly fieldId: string;
  readonly value: unknown;
  readonly breakpointId?: BreakpointId;
}

export interface ApplyFieldChangeResult {
  readonly doc: BuilderDocument;
  readonly history: HistoryStack<BuilderDocument>;
  readonly success: boolean;
}

/**
 * Returns all layout PropertyFieldDefinitions.
 */
export function getLayoutFieldDefinitions(): PropertyFieldDefinition[] {
  return LAYOUT_FIELD_DEFINITIONS;
}

export { readLayoutInspectorState, type LayoutInspectorState };

/**
 * Applies a layout field change: validates value against catalog schema, executes real command,
 * and pushes the new document state into HistoryStack.
 */
export function applyFieldChange(params: ApplyFieldChangeParams): ApplyFieldChangeResult {
  const { doc, history, nodeId, fieldId, value, breakpointId = 'desktop' } = params;

  // 1. Locate definition and validate
  const def = LAYOUT_FIELD_DEFINITIONS.find((f) => f.id === fieldId);
  if (def && def.validation && !def.validation(value)) {
    return { doc, history, success: false };
  }

  // 2. Dispatch command
  const res = applyLayoutFieldChange(doc, nodeId, fieldId, value, breakpointId);
  if (!res) {
    return { doc, history, success: false };
  }

  // 3. Push to HistoryStack
  const nextHistory = history.push(res.doc, res.command.name);

  return {
    doc: res.doc,
    history: nextHistory,
    success: true,
  };
}

/**
 * Undoes one step on HistoryStack<BuilderDocument>.
 */
export function undo(
  history: HistoryStack<BuilderDocument>,
  _doc?: BuilderDocument
): { history: HistoryStack<BuilderDocument>; doc: BuilderDocument } | null {
  const res = history.undo();
  if (!res) {
    return null;
  }
  return { history: res.stack, doc: res.state };
}

/**
 * Redoes one step on HistoryStack<BuilderDocument>.
 */
export function redo(
  history: HistoryStack<BuilderDocument>,
  _doc?: BuilderDocument
): { history: HistoryStack<BuilderDocument>; doc: BuilderDocument } | null {
  const res = history.redo();
  if (!res) {
    return null;
  }
  return { history: res.stack, doc: res.state };
}

export { undo as undoChange, redo as redoChange };

/**
 * Injects all S30 layout field definitions into an existing PropertyRegistry.
 * Returns the number of fields registered.
 */
export function registerLayoutFields(registry: PropertyRegistry): number {
  let count = 0;
  for (const def of LAYOUT_FIELD_DEFINITIONS) {
    registry.registerField(def);
    count++;
  }
  return count;
}