/**
 * AutonomousWebsiteBuilder.ts — End-to-End Autonomous Experience Website Builder Pipeline
 *
 * Master coordinator connecting:
 * Brief → Build Intent → Multi-Page Blueprint → Page Narrative & Experience Allocation
 * → BuilderDocument Synthesis → Visual Critic Analysis → Verified Self-Repair Proposals.
 *
 * All operations execute through safe, atomic, reversible BuilderCommands.
 */

import type { BuilderDocument } from '../../../packages/builder-core/src';
import { createBuildIntent, validateBuildIntent, type BuildIntent } from './BuildIntent';
import {
  buildMultiPageWebsiteBlueprint,
  validateMultiPageBlueprint,
  type MultiPageWebsiteBlueprint,
} from './MultiPageBlueprintEngine';
import {
  generateMultiPageDocument,
  type GenerationResult,
  type DocumentGeneratorOptions,
} from './MultiPageDocumentGenerator';
import {
  analyzeDocumentVisualQuality,
  type VisualCriticReport,
  type VisualCriticOptions,
} from './VisualCritic';

export type PipelinePhase =
  | 'idle'
  | 'intent_analysis'
  | 'blueprint_planning'
  | 'narrative_choreography'
  | 'experience_selection'
  | 'document_synthesis'
  | 'visual_critic'
  | 'complete'
  | 'error';

export interface PipelineProgressEvent {
  phase: PipelinePhase;
  progressPercent: number;
  message: string;
  timestamp: string;
}

export interface AutonomousBuildOptions extends DocumentGeneratorOptions {
  criticOptions?: VisualCriticOptions;
  onProgress?: (event: PipelineProgressEvent) => void;
}

export interface AutonomousBuildOutput {
  success: boolean;
  intent: BuildIntent;
  blueprint: MultiPageWebsiteBlueprint;
  document: BuilderDocument;
  criticReport: VisualCriticReport;
  stats: {
    pagesCount: number;
    sectionsCount: number;
    experiencesCount: number;
    findingsCount: number;
    repairProposalsCount: number;
    durationMs: number;
  };
  error?: string;
}

/**
 * Runs the complete autonomous build pipeline from user brief to verified BuilderDocument.
 */
export async function runAutonomousExperienceWebsiteBuilder(
  brief: string,
  initialDocument?: BuilderDocument,
  options: AutonomousBuildOptions = {}
): Promise<AutonomousBuildOutput> {
  const startTime = Date.now();
  const emit = (phase: PipelinePhase, percent: number, msg: string) => {
    if (options.onProgress) {
      options.onProgress({
        phase,
        progressPercent: percent,
        message: msg,
        timestamp: new Date().toISOString(),
      });
    }
  };

  emit('intent_analysis', 10, 'Analizowanie briefu, celów biznesowych i intencji wizualnej...');
  const intent = createBuildIntent(brief);
  const intentValidation = validateBuildIntent(intent);

  if (!intentValidation.valid) {
    const errorMsg = `Błąd walidacji Build Intent: ${intentValidation.errors.join('; ')}`;
    emit('error', 10, errorMsg);
    throw new Error(errorMsg);
  }

  emit('blueprint_planning', 30, `Tworzenie wielostronicowego Blueprintu dla marki ${intent.brand.name}...`);
  const blueprint = buildMultiPageWebsiteBlueprint(intent);
  const bpValidation = validateMultiPageBlueprint(blueprint);

  if (!bpValidation.valid) {
    const errorMsg = `Błąd walidacji Blueprint: ${bpValidation.errors.join('; ')}`;
    emit('error', 30, errorMsg);
    throw new Error(errorMsg);
  }

  emit('experience_selection', 55, `Dobieranie interaktywnych doświadczeń i choreografii narracyjnej...`);

  emit('document_synthesis', 75, `Generowanie struktury BuilderDocument (${blueprint.pages.length} stron)...`);
  const docResult: GenerationResult = generateMultiPageDocument(blueprint, initialDocument, {
    allowOverwrite: options.allowOverwrite ?? true,
  });

  if (!docResult.success) {
    const errorMsg = docResult.error || 'Nie udało się wygenerować dokumentu BuilderDocument.';
    emit('error', 75, errorMsg);
    throw new Error(errorMsg);
  }

  emit('visual_critic', 90, 'Uruchamianie analizy jakościowej Visual Critic...');
  const criticReport = analyzeDocumentVisualQuality(docResult.document, options.criticOptions);

  const totalExperiences = blueprint.pages.reduce(
    (acc, p) => acc + p.sections.filter((s) => !!s.experienceId).length,
    0
  );

  const durationMs = Date.now() - startTime;
  emit('complete', 100, `Witryna wygenerowana pomyślnie w ${durationMs}ms (${docResult.pagesCreated} stron, ${docResult.sectionsCreated} sekcji, ${criticReport.findings.length} findings).`);

  return {
    success: true,
    intent,
    blueprint,
    document: docResult.document,
    criticReport,
    stats: {
      pagesCount: docResult.pagesCreated,
      sectionsCount: docResult.sectionsCreated,
      experiencesCount: totalExperiences,
      findingsCount: criticReport.findings.length,
      repairProposalsCount: criticReport.summary.repairableCount,
      durationMs,
    },
  };
}
