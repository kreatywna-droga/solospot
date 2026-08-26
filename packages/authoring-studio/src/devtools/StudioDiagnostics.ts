/**
 * StudioDiagnostics.ts — Sprint S1 Studio Diagnostics Model (ETAP 1)
 *
 * Diagnostic data models and health inspection contracts for authoring studio devtools.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type DiagnosticSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface StudioDiagnosticItem {
  readonly id: string;
  readonly code: string;
  readonly message: string;
  readonly severity: DiagnosticSeverity;
  readonly component: string;
  readonly timestamp: number;
}

export interface StudioDiagnosticsState {
  readonly diagnostics: ReadonlyArray<StudioDiagnosticItem>;
  readonly overallHealth: 'healthy' | 'degraded' | 'critical';
}

export function createStudioDiagnosticsState(
  items: ReadonlyArray<StudioDiagnosticItem> = []
): StudioDiagnosticsState {
  const hasCritical = items.some((i) => i.severity === 'critical');
  const hasError = items.some((i) => i.severity === 'error');

  let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
  if (hasCritical) overallHealth = 'critical';
  else if (hasError) overallHealth = 'degraded';

  return {
    diagnostics: [...items],
    overallHealth,
  };
}
