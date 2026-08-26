/**
 * ProjectSettings.ts — Sprint S5 Project Settings Model (ETAP 1)
 *
 * Per-project configuration: autosave interval, locale, export defaults.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface ProjectSettings {
  readonly projectId: string;
  readonly autosaveIntervalMs: number;
  readonly maxAutosaveSnapshots: number;
  readonly locale: string;
  readonly currency: string;
  readonly defaultExportFormat: 'json' | 'zip' | 'cdn';
  readonly enableCrashRecovery: boolean;
}

export const DEFAULT_PROJECT_SETTINGS: Omit<ProjectSettings, 'projectId'> = {
  autosaveIntervalMs: 60_000,
  maxAutosaveSnapshots: 10,
  locale: 'en',
  currency: 'USD',
  defaultExportFormat: 'json',
  enableCrashRecovery: true,
};

export function createProjectSettings(projectId: string, overrides?: Partial<ProjectSettings>): ProjectSettings {
  return {
    ...DEFAULT_PROJECT_SETTINGS,
    ...overrides,
    projectId,
  };
}
