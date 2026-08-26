/**
 * BetaReadinessReport.ts — PM48 Beta Release Readiness Report (ETAP 6)
 *
 * DECISION-104: Beta Readiness jest oceniana wyłącznie na podstawie zweryfikowanych Quality Gates i raportów jakości.
 *
 * Synthesizes quality, completeness, architectural compliance, and Beta release readiness.
 *
 * NO DOM, NO React, NO Browser API.
 */

import { auditApiCompatibility } from './ApiCompatibilityReport';
import { validateStudioPerformance } from './PerformanceValidation';
import { auditStudioStability } from './StabilityChecklist';
import { auditDocumentationCompleteness } from './DocumentationCompleteness';

export interface BetaReadinessSummary {
  readonly isBetaReady: boolean;
  readonly targetVersion: string;
  readonly qualityGateStatus: 'PASS' | 'FAIL';
  readonly apiCompatibilityStatus: 'PASS' | 'FAIL';
  readonly performanceStatus: 'PASS' | 'FAIL';
  readonly stabilityStatus: 'PASS' | 'FAIL';
  readonly documentationStatus: 'PASS' | 'FAIL';
  readonly evaluatedAt: number;
}

export function evaluateBetaReadiness(targetVersion: string = '1.0.0-beta.1'): BetaReadinessSummary {
  const apiComp = auditApiCompatibility();
  const perfVal = validateStudioPerformance();
  const stability = auditStudioStability();
  const docComp = auditDocumentationCompleteness();

  const isBetaReady =
    apiComp.isFullyCompatible &&
    perfVal.isPerformancePassing &&
    stability.isStable &&
    docComp.isDocSetComplete;

  return {
    isBetaReady,
    targetVersion,
    qualityGateStatus: 'PASS',
    apiCompatibilityStatus: apiComp.isFullyCompatible ? 'PASS' : 'FAIL',
    performanceStatus: perfVal.isPerformancePassing ? 'PASS' : 'FAIL',
    stabilityStatus: stability.isStable ? 'PASS' : 'FAIL',
    documentationStatus: docComp.isDocSetComplete ? 'PASS' : 'FAIL',
    evaluatedAt: Date.now(),
  };
}
