/**
 * Licensing.ts — PM46 Licensing & Entitlement Models (ETAP 3)
 *
 * DECISION-097: Licensing operuje wyłącznie na modelach licencji, uprawnień i mapowaniach możliwości.
 *
 * License models, subscription tiers, entitlement definitions, and capability mappings.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface EntitlementDefinition {
  readonly entitlementId: string;
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly isAllowed: boolean;
}

export interface LicenseModel {
  readonly licenseId: string;
  readonly tenantId: string;
  readonly tier: SubscriptionTier;
  readonly issuedAt: number;
  readonly expiresAt?: number;
  readonly maxSeats: number;
  readonly entitlements: ReadonlyArray<EntitlementDefinition>;
}

export function isEntitlementGranted(license: LicenseModel, entitlementKey: string): boolean {
  if (license.expiresAt && Date.now() > license.expiresAt) {
    return false;
  }
  const ent = license.entitlements.find((e) => e.key === entitlementKey);
  return ent ? ent.isAllowed : false;
}
