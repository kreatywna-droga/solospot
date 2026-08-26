/**
 * ComponentController.ts — Sprint S32 Component Subsystem Orchestration Controller
 *
 * Provides a unified controller for applying presets, setting variants, managing slot children,
 * pushing immutable document updates to HistoryStack, and resolving effective component props.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { BuilderDocument, SectionNode } from '../../../builder-core/src/BuilderDocument';
import type { HistoryStack } from '../../../builder-core/src/HistoryStack';
import { ComponentPresetRegistry } from './ComponentPresetRegistry';
import {
  resolveComponentVariant,
  type ResolvedComponentProps,
} from './ComponentVariantEngine';
import {
  ApplyComponentPresetCommand,
  SetComponentVariantCommand,
  InsertSlotNodeCommand,
  RemoveSlotNodeCommand,
  type ComponentCommandResult,
} from './ComponentCommands';

export interface ComponentControllerResult {
  readonly success: boolean;
  readonly doc: BuilderDocument;
  readonly history: HistoryStack<BuilderDocument>;
  readonly error?: string;
}

export class ComponentController {
  constructor(private readonly registry: ComponentPresetRegistry = new ComponentPresetRegistry()) {}

  public getRegistry(): ComponentPresetRegistry {
    return this.registry;
  }

  public getResolvedProps(node: SectionNode): ResolvedComponentProps | undefined {
    return resolveComponentVariant(node, this.registry);
  }

  public applyPreset(params: {
    doc: BuilderDocument;
    history: HistoryStack<BuilderDocument>;
    nodeId: string;
    presetId: string;
    variantId?: string;
  }): ComponentControllerResult {
    const cmd = new ApplyComponentPresetCommand(params.nodeId, params.presetId, params.variantId, this.registry);
    const res = cmd.execute(params.doc);
    if (!res.success) {
      return { success: false, doc: params.doc, history: params.history, error: res.error };
    }

    const nextHistory = params.history.push(res.doc, res.commandName);
    return { success: true, doc: res.doc, history: nextHistory };
  }

  public setVariant(params: {
    doc: BuilderDocument;
    history: HistoryStack<BuilderDocument>;
    nodeId: string;
    variantId: string;
  }): ComponentControllerResult {
    const cmd = new SetComponentVariantCommand(params.nodeId, params.variantId, this.registry);
    const res = cmd.execute(params.doc);
    if (!res.success) {
      return { success: false, doc: params.doc, history: params.history, error: res.error };
    }

    const nextHistory = params.history.push(res.doc, res.commandName);
    return { success: true, doc: res.doc, history: nextHistory };
  }

  public insertSlotChild(params: {
    doc: BuilderDocument;
    history: HistoryStack<BuilderDocument>;
    parentNodeId: string;
    slotName: string;
    child: { id: string; type: string; label?: string; props?: Record<string, unknown> };
  }): ComponentControllerResult {
    const cmd = new InsertSlotNodeCommand(params.parentNodeId, params.slotName, params.child, this.registry);
    const res = cmd.execute(params.doc);
    if (!res.success) {
      return { success: false, doc: params.doc, history: params.history, error: res.error };
    }

    const nextHistory = params.history.push(res.doc, res.commandName);
    return { success: true, doc: res.doc, history: nextHistory };
  }

  public removeSlotChild(params: {
    doc: BuilderDocument;
    history: HistoryStack<BuilderDocument>;
    parentNodeId: string;
    childNodeId: string;
  }): ComponentControllerResult {
    const cmd = new RemoveSlotNodeCommand(params.parentNodeId, params.childNodeId, this.registry);
    const res = cmd.execute(params.doc);
    if (!res.success) {
      return { success: false, doc: params.doc, history: params.history, error: res.error };
    }

    const nextHistory = params.history.push(res.doc, res.commandName);
    return { success: true, doc: res.doc, history: nextHistory };
  }
}
