/**
 * LayoutFieldCatalog.test.ts — Sprint S30 Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { LAYOUT_FIELD_DEFINITIONS } from '../LayoutFieldCatalog';

describe('LayoutFieldCatalog', () => {
  it('exposes a non-empty array of PropertyFieldDefinitions with category layout', () => {
    expect(LAYOUT_FIELD_DEFINITIONS.length).toBeGreaterThanOrEqual(25);
    for (const def of LAYOUT_FIELD_DEFINITIONS) {
      expect(def.id).toMatch(/^layout\./);
      expect(def.category).toBe('layout');
      expect(def.label).toBeDefined();
      expect(def.widget).toBeDefined();
    }
  });

  it('includes responsive flag on appropriate responsive-capable fields', () => {
    const gapDef = LAYOUT_FIELD_DEFINITIONS.find((f) => f.id === 'layout.gap');
    expect(gapDef?.responsive).toBe(true);

    const widthDef = LAYOUT_FIELD_DEFINITIONS.find((f) => f.id === 'layout.width');
    expect(widthDef?.responsive).toBe(true);

    const wrapDef = LAYOUT_FIELD_DEFINITIONS.find((f) => f.id === 'layout.wrap');
    expect(wrapDef?.responsive).toBeUndefined();
  });

  it('validates field values via validation function', () => {
    const gapDef = LAYOUT_FIELD_DEFINITIONS.find((f) => f.id === 'layout.gap');
    expect(gapDef?.validation?.(10)).toBe(true);
    expect(gapDef?.validation?.(-5)).toBe(false);
    expect(gapDef?.validation?.('invalid')).toBe(false);
  });
});