/**
 * AssetPipelineIntegration.ts — Sprint S4 Asset Pipeline Connection (ETAP 4)
 *
 * Connects Asset Browser & Search UI components to PM41 AnimationExportPipeline DTO.
 *
 * NO DOM, NO React, NO Browser API.
 */

import {
  exportAnimationTimeline,
  serializeExportDataToJSON,
  type AnimationExportData,
} from '../../production/AnimationExportPipeline';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

export interface AssetPipelineExportResult {
  readonly exportData: AnimationExportData;
  readonly assetPackageJson: string;
  readonly exportedAt: number;
}

export function exportAssetPackageFromUI(
  timeline: AnimationTimeline,
  exporterName: string = 'AssetBrowserPanel'
): AssetPipelineExportResult {
  const exportData = exportAnimationTimeline(timeline, exporterName);
  const assetPackageJson = serializeExportDataToJSON(exportData);

  return {
    exportData,
    assetPackageJson,
    exportedAt: Date.now(),
  };
}
