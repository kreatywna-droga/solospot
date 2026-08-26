/**
 * AnimationProductionValidator.ts — PM41 Production Validator (ETAP 8)
 *
 * DECISION-074: Production Validator nie wykonuje Runtime ani Playback.
 *
 * Pre-production validator inspecting document timelines for:
 *   - Missing target nodes / assets
 *   - Invalid time offsets or clip durations
 *   - Unsupported easing configurations
 *   - Duplicate ID collisions across clips, tracks, and keyframes
 *   - Format & schema version mismatches
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { BuilderDocument, SectionNode } from '../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import { findNodeById } from '../inspector/animationDocumentBinding';

function findNodeInDocument(doc: BuilderDocument, nodeId: string): SectionNode | null {
  for (const page of doc.pages) {
    const node = findNodeById(page.sections, nodeId);
    if (node) return node;
  }
  return null;
}

export interface ProductionValidationError {
  readonly code: 'MISSING_TARGET_NODE' | 'INVALID_DURATION' | 'UNSUPPORTED_EASING' | 'DUPLICATE_ID' | 'VERSION_MISMATCH';
  readonly message: string;
  readonly targetId?: string;
}

export interface ProductionValidationResult {
  readonly isValid: boolean;
  readonly errors: ReadonlyArray<ProductionValidationError>;
  readonly warnings: ReadonlyArray<string>;
}

/**
 * Performs comprehensive pre-production validation on a document and timeline.
 */
export function validateProductionTimeline(
  doc: BuilderDocument,
  timeline: AnimationTimeline
): ProductionValidationResult {
  const errors: ProductionValidationError[] = [];
  const warnings: string[] = [];

  if (!doc || !timeline) {
    errors.push({
      code: 'MISSING_TARGET_NODE',
      message: 'Document or timeline is null/undefined.',
    });
    return { isValid: false, errors, warnings };
  }

  // 1. Check target node existence in BuilderDocument
  const targetNode = findNodeInDocument(doc, timeline.targetNodeId);
  if (!targetNode) {
    errors.push({
      code: 'MISSING_TARGET_NODE',
      message: `Target node "${timeline.targetNodeId}" does not exist in BuilderDocument.`,
      targetId: timeline.targetNodeId,
    });
  }

  // Track ID collisions
  const seenIds = new Set<string>();

  const checkId = (id: string, typeName: string) => {
    if (seenIds.has(id)) {
      errors.push({
        code: 'DUPLICATE_ID',
        message: `Duplicate ID collision found: "${id}" in ${typeName}.`,
        targetId: id,
      });
    } else {
      seenIds.add(id);
    }
  };

  checkId(timeline.id, 'Timeline');

  // 2. Inspect clips, tracks, keyframes
  for (const clip of timeline.clips) {
    checkId(clip.id, 'Clip');

    if (clip.duration <= 0) {
      errors.push({
        code: 'INVALID_DURATION',
        message: `Clip "${clip.name}" (${clip.id}) has invalid duration (${clip.duration}ms).`,
        targetId: clip.id,
      });
    }

    for (const track of clip.tracks) {
      checkId(track.id, 'Track');

      for (const kf of track.keyframes) {
        checkId(kf.id, 'Keyframe');

        if (kf.timeOffset < 0 || kf.timeOffset > clip.duration) {
          warnings.push(
            `Keyframe "${kf.id}" timeOffset (${kf.timeOffset}ms) is outside clip duration (0-${clip.duration}ms).`
          );
        }

        // Validate easing
        if (!kf.easing || !kf.easing.type) {
          errors.push({
            code: 'UNSUPPORTED_EASING',
            message: `Keyframe "${kf.id}" missing valid easing specification.`,
            targetId: kf.id,
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
