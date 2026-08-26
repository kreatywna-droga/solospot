/**
 * LayoutInspectorCommands.ts — Sprint S30 Inspector Field Dispatcher
 *
 * Dispatches Inspector field changes to the REAL S29 and S28 command instances
 * (SetLayoutStyleCommand, SetLayoutConstraintCommand, SetBreakpointOverrideCommand).
 * Returns new BuilderDocument snapshot and command instance for HistoryStack.push(doc, cmd.name).
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import {
  SetLayoutStyleCommand,
  SetLayoutConstraintCommand,
  type LayoutCommand,
} from '../layout/LayoutCommands';
import {
  SetBreakpointOverrideCommand,
  type ResponsiveCommand,
} from '../responsive/ResponsiveCommands';
import type { BreakpointId } from '../responsive/ResponsiveValueModel';
import { routeFieldChange } from './LayoutFieldRouter';

export interface ApplyFieldResult {
  readonly doc: BuilderDocument;
  readonly command: LayoutCommand | ResponsiveCommand;
}

/**
 * Applies a field change for a node in BuilderDocument.
 * If breakpointId !== 'desktop' and the field is responsive, dispatches S28 SetBreakpointOverrideCommand.
 * Otherwise dispatches S29 SetLayoutStyleCommand or SetLayoutConstraintCommand.
 */
export function applyLayoutFieldChange(
  doc: BuilderDocument,
  nodeId: string,
  fieldId: string,
  value: unknown,
  breakpointId: BreakpointId = 'desktop'
): ApplyFieldResult | undefined {
  const route = routeFieldChange(fieldId);
  if (!route) {
    return undefined;
  }

  // Non-desktop breakpoint with responsive override capability -> S28 command
  if (breakpointId !== 'desktop' && route.responsive) {
    let overrideValue = value;
    if (route.responsive.breakpointKey === 'flexDirection') {
      overrideValue = value === 'vertical' ? 'column' : 'row';
    }

    const command = new SetBreakpointOverrideCommand(nodeId, breakpointId, {
      [route.responsive.breakpointKey]: overrideValue,
    });
    const nextDoc = command.execute(doc);
    return { doc: nextDoc, command };
  }

  // Desktop or static DTO property -> S29 command
  if (route.kind === 'style') {
    const stylePartial = { [route.key]: value };
    const command = new SetLayoutStyleCommand(nodeId, stylePartial);
    const nextDoc = command.execute(doc);
    return { doc: nextDoc, command };
  }

  if (route.kind === 'constraint') {
    const constraintPartial = { [route.key]: value };
    const command = new SetLayoutConstraintCommand(nodeId, constraintPartial);
    const nextDoc = command.execute(doc);
    return { doc: nextDoc, command };
  }

  if (route.kind === 'sizing') {
    const constraintPartial = { sizing: { [route.key]: value } };
    const command = new SetLayoutConstraintCommand(nodeId, constraintPartial);
    const nextDoc = command.execute(doc);
    return { doc: nextDoc, command };
  }

  return undefined;
}