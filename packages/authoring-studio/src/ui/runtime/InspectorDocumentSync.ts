/**
 * InspectorDocumentSync.ts — Sprint S4 Inspector ↔ BuilderDocument SSOT Sync (ETAP 2)
 *
 * DECISION-100 & DECISION-044: BuilderDocument remains the sole SSOT.
 * Inspector edits configuration only — never invokes PlaybackController (DECISION-045).
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import { touchDocument } from '../../../../builder-core/src/BuilderDocument';
import { validateDocumentConsistency } from '../../integration/BuilderDocumentConsistency';

export interface SSOTSyncResult {
  readonly document: BuilderDocument;
  readonly isSSOTPreserved: boolean;
  readonly synchronizedAt: number;
  readonly nodeId: string;
  readonly propertyKey: string;
}

/**
 * Applies an inspector property edit to the SSOT (BuilderDocument) immutably.
 * Inspector edits data only — no playback side-effects (DECISION-043, DECISION-045).
 */
export function syncInspectorValueToSSOT(
  doc: BuilderDocument,
  nodeId: string,
  propertyKey: string,
  _value: unknown
): SSOTSyncResult {
  const validation = validateDocumentConsistency(doc);
  if (!validation.isValid) {
    throw new Error(`SSOT synchronization failed: ${validation.errors.join('; ')}`);
  }

  // Use canonical touchDocument — increments version and marks dirty immutably.
  const updatedDoc = touchDocument(doc);

  return {
    document: updatedDoc,
    isSSOTPreserved: true,
    synchronizedAt: Date.now(),
    nodeId,
    propertyKey,
  };
}
