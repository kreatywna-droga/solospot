/**
 * ExportWorkspaceModel.ts — Sprint S27 Export Workspace Configuration & DTO Models
 *
 * Defines export configurations, format options, resolution presets, FPS selections,
 * duration/range parameters, transparent background settings, quality presets, and export profiles.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

export type ExportFormat = 'mp4' | 'webm' | 'gif' | 'png_sequence' | 'prores' | 'wav';
export type WorkspaceExportFormat = ExportFormat;

export type ResolutionPresetName = '4K' | '1080p' | '720p' | 'Square_1080' | 'Vertical_1080' | 'Custom';

export interface ResolutionDimensions {
  readonly width: number;
  readonly height: number;
}

export type ExportFPS = 24 | 25 | 29.97 | 30 | 60;

export type ExportRangeType = 'full' | 'work_area' | 'custom_range';

export interface ExportRangeConfig {
  readonly type: ExportRangeType;
  readonly startFrame?: number;
  readonly endFrame?: number;
  readonly startTimeMs?: number;
  readonly endTimeMs?: number;
}

export type QualityPresetName = 'draft' | 'standard' | 'high' | 'master';

export interface QualityPresetConfig {
  readonly name: QualityPresetName;
  readonly videoBitrateKbps: number;
  readonly audioBitrateKbps: number;
  readonly crf: number; // Constant Rate Factor (lower = higher quality)
  readonly profile: string;
}

export type ExportPresetTarget = 'instagram' | 'youtube' | 'tiktok' | 'broadcast' | 'web' | 'custom';

export interface ExportPresetConfig {
  readonly id: string;
  readonly name: string;
  readonly target: ExportPresetTarget;
  readonly format: ExportFormat;
  readonly resolutionPreset: ResolutionPresetName;
  readonly customDimensions?: ResolutionDimensions;
  readonly fps: ExportFPS;
  readonly qualityPreset: QualityPresetName;
  readonly transparentBackground: boolean;
}

export interface ExportWorkspaceConfig {
  readonly id: string;
  readonly projectId: string;
  readonly format: ExportFormat;
  readonly resolutionPreset: ResolutionPresetName;
  readonly dimensions: ResolutionDimensions;
  readonly fps: ExportFPS;
  readonly range: ExportRangeConfig;
  readonly transparentBackground: boolean;
  readonly qualityPreset: QualityPresetName;
  readonly qualityConfig: QualityPresetConfig;
  readonly activePresetTarget: ExportPresetTarget;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface ExportConfigValidationReport {
  readonly isValid: boolean;
  readonly errors: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
}

/**
 * Standard Resolution Preset mapping.
 */
export const RESOLUTION_PRESETS: Record<ResolutionPresetName, ResolutionDimensions> = {
  '4K': { width: 3840, height: 2160 },
  '1080p': { width: 1920, height: 1080 },
  '720p': { width: 1280, height: 720 },
  'Square_1080': { width: 1080, height: 1080 },
  'Vertical_1080': { width: 1080, height: 1920 },
  Custom: { width: 1920, height: 1080 },
};

/**
 * Standard Quality Preset configurations.
 */
export const QUALITY_PRESETS: Record<QualityPresetName, QualityPresetConfig> = {
  draft: {
    name: 'draft',
    videoBitrateKbps: 2500,
    audioBitrateKbps: 128,
    crf: 28,
    profile: 'baseline',
  },
  standard: {
    name: 'standard',
    videoBitrateKbps: 8000,
    audioBitrateKbps: 192,
    crf: 23,
    profile: 'main',
  },
  high: {
    name: 'high',
    videoBitrateKbps: 16000,
    audioBitrateKbps: 320,
    crf: 18,
    profile: 'high',
  },
  master: {
    name: 'master',
    videoBitrateKbps: 45000,
    audioBitrateKbps: 320,
    crf: 12,
    profile: 'prores_422_hq',
  },
};

/**
 * Built-in Social / Broadcast / Web Export Presets.
 */
export const BUILTIN_EXPORT_PRESETS: ReadonlyArray<ExportPresetConfig> = [
  {
    id: 'preset-instagram-reels',
    name: 'Instagram Reels / Story',
    target: 'instagram',
    format: 'mp4',
    resolutionPreset: 'Vertical_1080',
    fps: 30,
    qualityPreset: 'standard',
    transparentBackground: false,
  },
  {
    id: 'preset-youtube-4k',
    name: 'YouTube 4K UHD',
    target: 'youtube',
    format: 'mp4',
    resolutionPreset: '4K',
    fps: 60,
    qualityPreset: 'high',
    transparentBackground: false,
  },
  {
    id: 'preset-tiktok-hd',
    name: 'TikTok Video HD',
    target: 'tiktok',
    format: 'mp4',
    resolutionPreset: 'Vertical_1080',
    fps: 30,
    qualityPreset: 'standard',
    transparentBackground: false,
  },
  {
    id: 'preset-broadcast-master',
    name: 'ProRes Broadcast Master',
    target: 'broadcast',
    format: 'prores',
    resolutionPreset: '1080p',
    fps: 25,
    qualityPreset: 'master',
    transparentBackground: false,
  },
  {
    id: 'preset-web-transparent-gif',
    name: 'Web Transparent GIF / Animation',
    target: 'web',
    format: 'gif',
    resolutionPreset: 'Square_1080',
    fps: 24,
    qualityPreset: 'standard',
    transparentBackground: true,
  },
];

/**
 * Resolves resolution dimensions for preset or custom dimensions.
 */
export function resolveResolutionDimensions(
  preset: ResolutionPresetName,
  customDimensions?: ResolutionDimensions
): ResolutionDimensions {
  if (preset === 'Custom' && customDimensions) {
    return {
      width: Math.max(1, Math.round(customDimensions.width)),
      height: Math.max(1, Math.round(customDimensions.height)),
    };
  }
  return RESOLUTION_PRESETS[preset] ?? RESOLUTION_PRESETS['1080p'];
}

/**
 * Resolves quality config for a quality preset name.
 */
export function resolveQualityPresetConfig(name: QualityPresetName): QualityPresetConfig {
  return QUALITY_PRESETS[name] ?? QUALITY_PRESETS['standard'];
}

/**
 * Creates a default or customized ExportWorkspaceConfig DTO.
 */
export function createExportWorkspaceConfig(
  projectId: string,
  overrides?: Partial<ExportWorkspaceConfig>
): ExportWorkspaceConfig {
  const now = Date.now();
  const format: ExportFormat = overrides?.format ?? 'mp4';
  const resolutionPreset: ResolutionPresetName = overrides?.resolutionPreset ?? '1080p';
  const dimensions = overrides?.dimensions ?? resolveResolutionDimensions(resolutionPreset, overrides?.dimensions);
  const fps: ExportFPS = overrides?.fps ?? 30;
  const range: ExportRangeConfig = overrides?.range ?? { type: 'full' };
  const transparentBackground = overrides?.transparentBackground ?? (format === 'png_sequence' || format === 'gif');
  const qualityPreset: QualityPresetName = overrides?.qualityPreset ?? 'standard';
  const qualityConfig = overrides?.qualityConfig ?? resolveQualityPresetConfig(qualityPreset);
  const activePresetTarget: ExportPresetTarget = overrides?.activePresetTarget ?? 'web';

  return {
    id: overrides?.id ?? `exp-cfg-${projectId}-${now}`,
    projectId,
    format,
    resolutionPreset,
    dimensions,
    fps,
    range,
    transparentBackground,
    qualityPreset,
    qualityConfig,
    activePresetTarget,
    createdAt: overrides?.createdAt ?? now,
    updatedAt: now,
  };
}

/**
 * Applies a target ExportPresetConfig to an existing ExportWorkspaceConfig.
 */
export function applyExportPresetToWorkspace(
  workspaceConfig: ExportWorkspaceConfig,
  preset: ExportPresetConfig
): ExportWorkspaceConfig {
  const dimensions = resolveResolutionDimensions(preset.resolutionPreset, preset.customDimensions);
  const qualityConfig = resolveQualityPresetConfig(preset.qualityPreset);

  return {
    ...workspaceConfig,
    format: preset.format,
    resolutionPreset: preset.resolutionPreset,
    dimensions,
    fps: preset.fps,
    qualityPreset: preset.qualityPreset,
    qualityConfig,
    transparentBackground: preset.transparentBackground,
    activePresetTarget: preset.target,
    updatedAt: Date.now(),
  };
}

/**
 * Validates an ExportWorkspaceConfig DTO.
 */
export function validateExportWorkspaceConfig(
  config: ExportWorkspaceConfig | null | undefined
): ExportConfigValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config) {
    return {
      isValid: false,
      errors: ['Export workspace config is null or undefined.'],
      warnings: [],
    };
  }

  if (!config.projectId || config.projectId.trim().length === 0) {
    errors.push('Config missing valid projectId.');
  }

  if (!config.dimensions || config.dimensions.width <= 0 || config.dimensions.height <= 0) {
    errors.push(`Invalid dimensions (${config.dimensions?.width}x${config.dimensions?.height}). Width and height must be > 0.`);
  } else {
    if (config.dimensions.width % 2 !== 0 || config.dimensions.height % 2 !== 0) {
      warnings.push(`Dimensions (${config.dimensions.width}x${config.dimensions.height}) have odd pixel values. Even dimensions recommended for H.264/MP4 encoding.`);
    }
  }

  const validFpsList: ReadonlyArray<number> = [24, 25, 29.97, 30, 60];
  if (!validFpsList.includes(config.fps)) {
    errors.push(`Invalid FPS standard "${config.fps}". Must be 24, 25, 29.97, 30, or 60.`);
  }

  if (config.transparentBackground && (config.format === 'mp4' || config.format === 'prores')) {
    warnings.push(`Format "${config.format}" may not natively preserve background alpha transparency. Consider WebM or PNG sequence for full alpha export.`);
  }

  if (config.range.type === 'custom_range') {
    if (config.range.startFrame !== undefined && config.range.endFrame !== undefined) {
      if (config.range.startFrame > config.range.endFrame) {
        errors.push(`Invalid frame range: startFrame (${config.range.startFrame}) > endFrame (${config.range.endFrame}).`);
      }
    }
    if (config.range.startTimeMs !== undefined && config.range.endTimeMs !== undefined) {
      if (config.range.startTimeMs > config.range.endTimeMs) {
        errors.push(`Invalid time range: startTimeMs (${config.range.startTimeMs}) > endTimeMs (${config.range.endTimeMs}).`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
