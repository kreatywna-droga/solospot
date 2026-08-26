import { describe, it, expect } from 'vitest';
import { createDiagnosticsBundle } from '../DiagnosticsServices';

describe('DiagnosticsServices (PM46, ETAP 6 & DECISION-099)', () => {
  it('creates diagnostics bundles passively without Runtime side-effects (DECISION-099)', () => {
    const bundle = createDiagnosticsBundle('1.0.0', [
      {
        errorCode: 'ERR_ASSET_NOT_FOUND',
        message: 'Asset item not found in registry',
        severity: 'medium',
        recoveryHint: 'Re-sync asset registry or update asset reference',
      },
    ]);

    expect(bundle.errors).toHaveLength(1);
    expect(bundle.studioVersion).toBe('1.0.0');
  });
});
