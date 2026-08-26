/**
 * OutputManager.ts — Sprint S27 Output Management, Naming Templates & Versioning
 *
 * Manages export output metadata, artifact checksum validation, token-based filename templates,
 * versioning counters (v1, v2, v3...), and output history logging.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { ExportWorkspaceConfig } from './ExportWorkspaceModel';

export interface OutputArtifactMetadata {
  readonly artifactId: string;
  readonly projectId: string;
  readonly filename: string;
  readonly format: string;
  readonly version: number; // e.g. 1, 2, 3
  readonly versionLabel: string; // e.g. "v1", "v2"
  readonly checksum: string;
  readonly sizeBytes: number;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly totalFrames: number;
  readonly durationMs: number;
  readonly generatedAt: number;
  readonly filePath?: string;
  readonly downloadUrl?: string;
}

export interface OutputValidationReport {
  readonly isValid: boolean;
  readonly errors: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
}

export interface NamingTemplateTokens {
  readonly project_name: string;
  readonly preset: string;
  readonly resolution: string; // e.g. "1080p", "3840x2160"
  readonly fps: number | string;
  readonly date: string; // e.g. "2026-08-09"
  readonly time: string; // e.g. "16-48-00"
  readonly version: string; // e.g. "v1"
  readonly format: string; // e.g. "mp4"
}

export const DEFAULT_NAMING_TEMPLATE = '{project_name}_{preset}_{resolution}_{version}.{format}';

/**
 * Validates output artifact metadata according to S27 rules.
 */
export function validateOutputArtifact(artifact: OutputArtifactMetadata | null | undefined): OutputValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!artifact) {
    return {
      isValid: false,
      errors: ['Output artifact metadata is null or undefined.'],
      warnings: [],
    };
  }

  if (!artifact.artifactId || artifact.artifactId.trim().length === 0) {
    errors.push('Artifact missing valid ID.');
  }

  if (!artifact.projectId || artifact.projectId.trim().length === 0) {
    errors.push('Artifact missing valid projectId.');
  }

  if (!artifact.checksum || artifact.checksum.trim().length === 0) {
    errors.push('Artifact missing cryptographic/integrity checksum.');
  }

  if (artifact.sizeBytes <= 0) {
    errors.push(`Artifact sizeBytes (${artifact.sizeBytes}) must be > 0.`);
  }

  if (artifact.width <= 0 || artifact.height <= 0) {
    errors.push(`Artifact dimensions (${artifact.width}x${artifact.height}) must be > 0.`);
  }

  if (artifact.durationMs <= 0) {
    warnings.push(`Artifact durationMs (${artifact.durationMs}ms) is 0 or negative.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Renders a filename from a template pattern and tokens.
 */
export function renderNamingTemplate(
  template: string = DEFAULT_NAMING_TEMPLATE,
  tokens: Partial<NamingTemplateTokens>
): string {
  const now = new Date();
  const dateStr = tokens.date ?? now.toISOString().split('T')[0];
  const timeStr = tokens.time ?? now.toTimeString().split(' ')[0].replace(/:/g, '-');

  const resolvedTokens: NamingTemplateTokens = {
    project_name: sanitizeFilenameToken(tokens.project_name ?? 'Untitled_Project'),
    preset: sanitizeFilenameToken(tokens.preset ?? 'standard'),
    resolution: sanitizeFilenameToken(tokens.resolution ?? '1080p'),
    fps: tokens.fps ?? 30,
    date: dateStr,
    time: timeStr,
    version: tokens.version ?? 'v1',
    format: (tokens.format ?? 'mp4').toLowerCase().replace(/^\./, ''),
  };

  let result = template;
  result = result.replace(/\{project_name\}/g, resolvedTokens.project_name);
  result = result.replace(/\{preset\}/g, resolvedTokens.preset);
  result = result.replace(/\{resolution\}/g, resolvedTokens.resolution);
  result = result.replace(/\{fps\}/g, String(resolvedTokens.fps));
  result = result.replace(/\{date\}/g, resolvedTokens.date);
  result = result.replace(/\{time\}/g, resolvedTokens.time);
  result = result.replace(/\{version\}/g, resolvedTokens.version);
  result = result.replace(/\{format\}/g, resolvedTokens.format);

  return result;
}

/**
 * Sanitizes text to be safe for OS file names.
 */
function sanitizeFilenameToken(val: string): string {
  return val.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
}

/**
 * Manages output history logs and automatic version numbering for projects.
 */
export class OutputManager {
  private history: OutputArtifactMetadata[];
  private projectVersions: Map<string, number>;

  constructor(initialHistory: ReadonlyArray<OutputArtifactMetadata> = []) {
    this.history = [...initialHistory];
    this.projectVersions = new Map();

    // Populate existing versions
    for (const item of initialHistory) {
      const current = this.projectVersions.get(item.projectId) ?? 0;
      if (item.version > current) {
        this.projectVersions.set(item.projectId, item.version);
      }
    }
  }

  /**
   * Gets next version number for a project.
   */
  public getNextVersion(projectId: string): { versionNumber: number; versionLabel: string } {
    const current = this.projectVersions.get(projectId) ?? 0;
    const next = current + 1;
    return {
      versionNumber: next,
      versionLabel: `v${next}`,
    };
  }

  /**
   * Registers a newly completed export artifact into history.
   */
  public registerOutputArtifact(
    projectId: string,
    projectName: string,
    exportConfig: ExportWorkspaceConfig,
    sizeBytes: number,
    totalFrames: number,
    durationMs: number,
    checksum?: string,
    template: string = DEFAULT_NAMING_TEMPLATE
  ): OutputArtifactMetadata {
    const { versionNumber, versionLabel } = this.getNextVersion(projectId);

    const resolutionStr = `${exportConfig.dimensions.width}x${exportConfig.dimensions.height}`;
    const filename = renderNamingTemplate(template, {
      project_name: projectName,
      preset: exportConfig.activePresetTarget,
      resolution: exportConfig.resolutionPreset === 'Custom' ? resolutionStr : exportConfig.resolutionPreset,
      fps: exportConfig.fps,
      version: versionLabel,
      format: exportConfig.format,
    });

    const now = Date.now();
    const artifactId = `art-${projectId}-${versionLabel}-${now}`;
    const computedChecksum = checksum ?? `chk-${projectId}-${versionNumber}-${now}`;

    const metadata: OutputArtifactMetadata = {
      artifactId,
      projectId,
      filename,
      format: exportConfig.format,
      version: versionNumber,
      versionLabel,
      checksum: computedChecksum,
      sizeBytes,
      width: exportConfig.dimensions.width,
      height: exportConfig.dimensions.height,
      fps: exportConfig.fps,
      totalFrames,
      durationMs,
      generatedAt: now,
      filePath: `/exports/${projectId}/${filename}`,
    };

    const validation = validateOutputArtifact(metadata);
    if (!validation.isValid) {
      throw new Error(`Output artifact validation failed: ${validation.errors.join('; ')}`);
    }

    this.projectVersions.set(projectId, versionNumber);
    this.history = [metadata, ...this.history];

    return metadata;
  }

  /**
   * Returns entire history or filtered by project ID.
   */
  public getOutputHistory(projectId?: string): ReadonlyArray<OutputArtifactMetadata> {
    if (projectId) {
      return this.history.filter((item) => item.projectId === projectId);
    }
    return this.history;
  }

  /**
   * Clears output history for a project or completely.
   */
  public clearHistory(projectId?: string): void {
    if (projectId) {
      this.history = this.history.filter((item) => item.projectId !== projectId);
    } else {
      this.history = [];
      this.projectVersions.clear();
    }
  }
}
