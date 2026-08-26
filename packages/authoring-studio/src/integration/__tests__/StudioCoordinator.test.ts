import { describe, it, expect } from 'vitest';
import { coordinateStudioModules } from '../StudioIntegrationCoordinator';
import { createBuilderDocument } from '../../../../builder-core/src/BuilderDocument';

function buildDoc() {
  return createBuilderDocument({
    id: 'store-coord',
    tenantId: 'tenant-coord',
    metadata: { storeName: 'Coord Test', storeSlug: 'coord', locale: 'en', currency: 'USD' },
  });
}

describe('StudioCoordinator (PM47, ETAP 1 & DECISION-101)', () => {
  it('coordinates all PM29-PM46 modules via public APIs (DECISION-101)', () => {
    const doc = buildDoc();
    const result = coordinateStudioModules(doc, 'user-admin-1');

    expect(result.status).toBe('coordinated');
    expect(result.context.registeredModules).toHaveLength(9);
    expect(result.context.activeDocument.id).toBe('store-coord');
  });
});
