/**
 * DiagnosticsServices.ts — PM46 Enterprise Diagnostics (ETAP 6)
 *
 * DECISION-099: Health, Diagnostics i Configuration są pasywnymi usługami platformowymi, bez logiki wykonywania Runtime.
 *
 * Diagnostics bundles, error catalogs, warning catalogs, and recovery hints.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface ErrorCatalogEntry {
  readonly errorCode: string;
  readonly message: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly recoveryHint: string;
}

export interface DiagnosticsBundle {
  readonly bundleId: string;
  readonly timestamp: number;
  readonly studioVersion: string;
  readonly errors: ReadonlyArray<ErrorCatalogEntry>;
  readonly systemInfo: Record<string, unknown>;
}

export function createDiagnosticsBundle(
  studioVersion: string = '1.0.0',
  errors: ReadonlyArray<ErrorCatalogEntry> = []
): DiagnosticsBundle {
  return {
    bundleId: `diag-bundle-${Date.now()}`,
    timestamp: Date.now(),
    studioVersion,
    errors: [...errors],
    systemInfo: { nodeEnv: process.env.NODE_ENV ?? 'development' },
  };
}
