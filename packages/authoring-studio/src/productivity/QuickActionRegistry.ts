/**
 * QuickActionRegistry.ts — Sprint S6 Contextual Quick Actions
 *
 * Suggests quick actions based on the current selection in the BuilderDocument SSOT.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { StudioCommand } from './CommandEngine';

export interface QuickActionContext {
  readonly document: BuilderDocument;
  readonly selectedNodeIds: ReadonlyArray<string>;
}

export interface QuickActionProvider {
  readonly providerId: string;
  readonly getActions: (ctx: QuickActionContext) => ReadonlyArray<StudioCommand>;
}

export interface QuickActionRegistryState {
  readonly providers: ReadonlyArray<QuickActionProvider>;
}

export function createQuickActionRegistry(): QuickActionRegistryState {
  return { providers: [] };
}

export function registerQuickActionProvider(
  state: QuickActionRegistryState,
  provider: QuickActionProvider
): QuickActionRegistryState {
  return {
    ...state,
    providers: [...state.providers, provider],
  };
}

export function getQuickActionsForContext(
  state: QuickActionRegistryState,
  context: QuickActionContext
): ReadonlyArray<StudioCommand> {
  const actions: StudioCommand[] = [];
  const seenIds = new Set<string>();

  for (const provider of state.providers) {
    const providerActions = provider.getActions(context);
    for (const action of providerActions) {
      if (!seenIds.has(action.id)) {
        seenIds.add(action.id);
        actions.push(action);
      }
    }
  }

  return actions;
}
