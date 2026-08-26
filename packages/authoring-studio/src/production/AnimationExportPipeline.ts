/**
 * AnimationExportPipeline.ts — PM41 Animation Export Pipeline (ETAP 1)
 *
 * DECISION-069: Export Pipeline operuje wyłącznie na DTO.
 *
 * Provides pure DTO serialization, export manifest generation, and export validation.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API.
 */

import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';

export interface AnimationExportManifest {
  readonly formatVersion: string;
  readonly exportedAt: string;
  readonly exporter: string;
  readonly timelineId: string;
  readonly targetNodeId: string;
  readonly clipCount: number;
  readonly totalDurationMs: number;
}

export interface AnimationExportData {
  readonly manifest: AnimationExportManifest;
  readonly timeline: AnimationTimeline;
}

export interface ExportValidationReport {
  readonly isValid: boolean;
  readonly errors: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
}

/**
 * Validates an AnimationTimeline DTO before exporting.
 */
export function validateExportTimeline(timeline: AnimationTimeline | null): ExportValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!timeline) {
    errors.push('Timeline is null or undefined.');
    return { isValid: false, errors, warnings };
  }

  if (!timeline.id || timeline.id.trim().length === 0) {
    errors.push('Timeline missing valid ID.');
  }

  if (!timeline.targetNodeId || timeline.targetNodeId.trim().length === 0) {
    errors.push('Timeline missing targetNodeId.');
  }

  if (!timeline.clips || timeline.clips.length === 0) {
    warnings.push('Timeline contains zero animation clips.');
  } else {
    for (const clip of timeline.clips) {
      if (clip.duration <= 0) {
        errors.push(`Clip "${clip.id}" has invalid duration (${clip.duration}ms).`);
      }
      if (clip.tracks.length === 0) {
        warnings.push(`Clip "${clip.name}" (${clip.id}) has no animation tracks.`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Creates an export package containing manifest metadata and serializable AnimationTimeline DTO.
 */
export function exportAnimationTimeline(
  timeline: AnimationTimeline,
  exporterName: string = 'AuthoringStudioExporter'
): AnimationExportData {
  const validation = validateExportTimeline(timeline);
  if (!validation.isValid) {
    throw new Error(`Export validation failed: ${validation.errors.join('; ')}`);
  }

  let totalDurationMs = 0;
  for (const clip of timeline.clips) {
    const end = clip.delay + clip.duration;
    if (end > totalDurationMs) {
      totalDurationMs = end;
    }
  }

  const manifest: AnimationExportManifest = {
    formatVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    exporter: exporterName,
    timelineId: timeline.id,
    targetNodeId: timeline.targetNodeId,
    clipCount: timeline.clips.length,
    totalDurationMs,
  };

  return {
    manifest,
    timeline: JSON.parse(JSON.stringify(timeline)),
  };
}

/**
 * Serializes export data to JSON string format.
 */
export function serializeExportDataToJSON(exportData: AnimationExportData): string {
  return JSON.stringify(exportData, null, 2);
}
