import { describe, it, expect } from 'vitest';
import {
  createQuickActionRegistry,
  registerQuickActionProvider,
  getQuickActionsForContext,
  type QuickActionProvider,
  type QuickActionContext,
} from '../QuickActionRegistry';
import { createBuilderDocument } from '../../../../builder-core/src/BuilderDocument';

describe('QuickActionRegistry (Sprint S6)', () => {
  it('retrieves distinct quick actions from multiple providers', () => {
    let state = createQuickActionRegistry();

    const providerA: QuickActionProvider = {
      providerId: 'prov-a',
      getActions: () => [
        { id: 'act-1', label: 'Action 1', isEnabled: () => true },
        { id: 'act-2', label: 'Action 2', isEnabled: () => true },
      ],
    };

    const providerB: QuickActionProvider = {
      providerId: 'prov-b',
      getActions: () => [
        { id: 'act-2', label: 'Action 2 Duplicate', isEnabled: () => true }, // duplicate ID
        { id: 'act-3', label: 'Action 3', isEnabled: () => true },
      ],
    };

    state = registerQuickActionProvider(state, providerA);
    state = registerQuickActionProvider(state, providerB);

    const doc = createBuilderDocument({ id: 'd1', tenantId: 't1' });
    const ctx: QuickActionContext = { document: doc, selectedNodeIds: [] };

    const actions = getQuickActionsForContext(state, ctx);
    expect(actions).toHaveLength(3); // act-1, act-2, act-3 (act-2 is deduplicated by ID)
  });
});
