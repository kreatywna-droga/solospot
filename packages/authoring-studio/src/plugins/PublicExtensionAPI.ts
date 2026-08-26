/**
 * PublicExtensionAPI.ts — PM43 Public Extension API Surface (ETAP 3)
 *
 * DECISION-080: Plugin SDK udostępnia wyłącznie Public Extension API.
 * DECISION-082: Runtime Engine jest niedostępny bezpośrednio dla pluginów.
 *
 * Controlled extension API interface granting capabilities to:
 *   - Timeline (DTO read/write)
 *   - Inspector (property editor registration)
 *   - Assets (registry search/read/write)
 *   - Production (export/import pipeline DTOs)
 *   - Commands (productivity command registration)
 *
 * ABSOLUTELY PROHIBITED TO EXPOSE:
 *   - PlaybackController
 *   - RuntimeBridge
 *   - TriggerEngine
 *   - PreviewRuntime
 *   - AnimationInterpolator
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';

export interface TimelineExtensionAPI {
  readonly inspectTimeline: (doc: BuilderDocument, nodeId: string) => AnimationTimeline | null;
  readonly applyTimeline: (doc: BuilderDocument, nodeId: string, timeline: AnimationTimeline) => BuilderDocument;
}

export interface InspectorExtensionAPI {
  readonly registerPropertyEditor: (fieldKey: string, editorConfig: Record<string, unknown>) => void;
}

export interface AssetsExtensionAPI {
  readonly getAssetById: (assetId: string) => unknown;
  readonly registerAsset: (assetItem: unknown) => void;
}

export interface ProductionExtensionAPI {
  readonly exportTimeline: (timeline: AnimationTimeline) => unknown;
  readonly validateTimeline: (doc: BuilderDocument, timeline: AnimationTimeline) => unknown;
}

export interface CommandsExtensionAPI {
  readonly registerCommand: (commandId: string, handler: (payload: unknown) => void) => void;
}

export interface PublicExtensionAPI {
  readonly apiVersion: string;
  readonly timeline: TimelineExtensionAPI;
  readonly inspector: InspectorExtensionAPI;
  readonly assets: AssetsExtensionAPI;
  readonly production: ProductionExtensionAPI;
  readonly commands: CommandsExtensionAPI;
}

/**
 * Creates the Public Extension API instance for a plugin.
 * Strictly adheres to DECISION-080 and DECISION-082.
 */
export function createPublicExtensionAPI(params: {
  timelineAPI: TimelineExtensionAPI;
  inspectorAPI: InspectorExtensionAPI;
  assetsAPI: AssetsExtensionAPI;
  productionAPI: ProductionExtensionAPI;
  commandsAPI: CommandsExtensionAPI;
  apiVersion?: string;
}): PublicExtensionAPI {
  return {
    apiVersion: params.apiVersion ?? '1.0.0',
    timeline: params.timelineAPI,
    inspector: params.inspectorAPI,
    assets: params.assetsAPI,
    production: params.productionAPI,
    commands: params.commandsAPI,
  };
}
