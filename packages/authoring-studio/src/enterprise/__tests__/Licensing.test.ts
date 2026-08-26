import { describe, it, expect } from 'vitest';
import { isEntitlementGranted, type LicenseModel } from '../Licensing';

const mockLicense: LicenseModel = {
  licenseId: 'lic-ent-1',
  tenantId: 'tenant-acme',
  tier: 'enterprise',
  issuedAt: 1000,
  maxSeats: 100,
  entitlements: [
    { entitlementId: 'e-1', key: 'custom_code_export', name: 'Custom Export', description: '', isAllowed: true },
    { entitlementId: 'e-2', key: 'unlimited_projects', name: 'Unlimited Projects', description: '', isAllowed: true },
  ],
};

describe('Licensing (PM46, ETAP 3 & DECISION-097)', () => {
  it('evaluates entitlements exclusively on license models (DECISION-097)', () => {
    expect(isEntitlementGranted(mockLicense, 'custom_code_export')).toBe(true);
    expect(isEntitlementGranted(mockLicense, 'unauthorized_feature')).toBe(false);
  });
});
