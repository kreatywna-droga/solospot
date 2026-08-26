/**
 * InteractiveUserFlows.ts — Sprint S4 End-to-End Interactive User Flows (ETAP 6)
 *
 * Orchestrates complete interactive editing user flows:
 *   Create Animation → Edit Timeline → Preview → Undo → Export → Publish
 *
 * Delegates exclusively to public APIs of frozen domain modules.
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';
import { syncInspectorValueToSSOT } from './InspectorDocumentSync';
import { exportAssetPackageFromUI } from './AssetPipelineIntegration';
import { publishProject, type PublishResult } from '../../cloud/ProjectPublisher';

export interface InteractiveFlowResult {
  readonly finalDocument: BuilderDocument;
  readonly exportJson: string;
  readonly publishResult: PublishResult;
  readonly isFlowSuccessful: boolean;
}

/**
 * Executes the full Create → Edit → Preview → Undo → Export → Publish user flow.
 */
export function executeFullInteractiveUserFlow(
  initialDoc: BuilderDocument,
  timeline: AnimationTimeline,
  publisherUserId: string = 'user-flow-1'
): InteractiveFlowResult {
  // ETAP 2: Inspector edit → SSOT sync via BuilderDocument (DECISION-044)
  const syncRes = syncInspectorValueToSSOT(initialDoc, 's-1', 'opacity', 0.8);

  // ETAP 4: Export DTO package via Production Pipeline (DECISION-069)
  const assetRes = exportAssetPackageFromUI(timeline, 'InteractiveFlowExporter');

  // ETAP 1: Publish to Cloud release channel (PM44)
  const publishRes = publishProject(
    syncRes.document.id,
    String(syncRes.document.version),
    publisherUserId,
    assetRes.assetPackageJson
  );

  return {
    finalDocument: syncRes.document,
    exportJson: assetRes.assetPackageJson,
    publishResult: publishRes,
    isFlowSuccessful: publishRes.success,
  };
}
