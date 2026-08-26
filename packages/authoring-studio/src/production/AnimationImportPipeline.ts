/**
 * AnimationImportPipeline.ts — PM41 Animation Import Pipeline (ETAP 2)
 *
 * DECISION-070: Import Pipeline nigdy nie modyfikuje BuilderDocument bez walidacji.
 *
 * Provides safe animation importing, format validation, version compatibility checks,
 * and immutable binding to BuilderDocument SSOT.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import { applyAnimationToNode } from '../inspector/animationDocumentBinding';
import type { AnimationExportData, ExportValidationReport } from './AnimationExportPipeline';
import { validateExportTimeline } from './AnimationExportPipeline';

export interface ImportValidationReport extends ExportValidationReport {
  readonly isCompatibleVersion: boolean;
  readonly formatVersion: string;
}

export interface ImportResult {
  readonly updatedDoc: BuilderDocument;
  readonly importedTimeline: AnimationTimeline;
  readonly report: ImportValidationReport;
}

/**
 * Validates imported JSON string or AnimationExportData structure.
 */
export function validateImportData(rawInput: unknown): ImportValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  let parsedData: AnimationExportData | null = null;

  if (typeof rawInput === 'string') {
    try {
      parsedData = JSON.parse(rawInput) as AnimationExportData;
    } catch {
      errors.push('Invalid JSON payload format.');
      return {
        isValid: false,
        isCompatibleVersion: false,
        formatVersion: 'unknown',
        errors,
        warnings,
      };
    }
  } else if (rawInput !== null && typeof rawInput === 'object') {
    parsedData = rawInput as AnimationExportData;
  }

  if (!parsedData || !parsedData.manifest || !parsedData.timeline) {
    errors.push('Import data missing required manifest or timeline properties.');
    return {
      isValid: false,
      isCompatibleVersion: false,
      formatVersion: 'unknown',
      errors,
      warnings,
    };
  }

  const formatVersion = parsedData.manifest.formatVersion ?? '1.0.0';
  const majorVersion = parseInt(formatVersion.split('.')[0], 10);
  const isCompatibleVersion = majorVersion === 1;

  if (!isCompatibleVersion) {
    errors.push(`Incompatible format version "${formatVersion}". Major version 1 expected.`);
  }

  const baseReport = validateExportTimeline(parsedData.timeline);
  errors.push(...baseReport.errors);
  warnings.push(...baseReport.warnings);

  return {
    isValid: errors.length === 0,
    isCompatibleVersion,
    formatVersion,
    errors,
    warnings,
  };
}

/**
 * Safely imports an animation timeline into BuilderDocument SSOT for a target node ID.
 * DECISION-070: Performs full validation prior to document mutation.
 */
export function importAnimationToNode(
  doc: BuilderDocument,
  targetNodeId: string,
  rawInput: unknown
): ImportResult {
  const report = validateImportData(rawInput);
  if (!report.isValid) {
    throw new Error(`Import validation failed: ${report.errors.join('; ')}`);
  }

  const data: AnimationExportData = typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput;

  // Re-bind imported timeline to current target node ID
  const importedTimeline: AnimationTimeline = {
    ...data.timeline,
    targetNodeId,
    id: `tl-imported-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  };

  const updatedDoc = applyAnimationToNode(doc, targetNodeId, importedTimeline);

  return {
    updatedDoc,
    importedTimeline,
    report,
  };
}
