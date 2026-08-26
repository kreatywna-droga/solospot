/**
 * UserSettings.ts — Sprint S2 User Preferences & Settings Model
 *
 * User settings descriptors (theme, active layout, auto-save interval, telemetry preference).
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { ThemeMode } from './ThemeContracts';

export interface UserSettingsModel {
  readonly userId: string;
  readonly themeMode: ThemeMode;
  readonly activePresetId: string;
  readonly autoSaveIntervalMs: number;
  readonly enableTelemetry: boolean;
  readonly keyboardProfileId: string;
}

export const DEFAULT_USER_SETTINGS: UserSettingsModel = {
  userId: 'user-default',
  themeMode: 'dark',
  activePresetId: 'preset-default',
  autoSaveIntervalMs: 60000,
  enableTelemetry: true,
  keyboardProfileId: 'profile-standard',
};

export function updateUserSettings(
  settings: UserSettingsModel,
  updates: Partial<UserSettingsModel>
): UserSettingsModel {
  return {
    ...settings,
    ...updates,
  };
}
