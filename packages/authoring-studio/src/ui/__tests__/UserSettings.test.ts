import { describe, it, expect } from 'vitest';
import { DEFAULT_USER_SETTINGS, updateUserSettings } from '../UserSettings';
import { STANDARD_KEYBOARD_PROFILE } from '../KeyboardProfiles';
import { serializeWorkspaceLayout, deserializeWorkspaceLayout } from '../LayoutPersistence';
import { createWorkspaceLayoutModel } from '../WorkspaceLayout';

describe('UserSettings & Layout Persistence (Sprint S2, ETAP 4)', () => {
  it('updates user settings immutably', () => {
    const updated = updateUserSettings(DEFAULT_USER_SETTINGS, { themeMode: 'light' });
    expect(updated.themeMode).toBe('light');
    expect(updated.userId).toBe('user-default');
  });

  it('provides standard keyboard profile', () => {
    expect(STANDARD_KEYBOARD_PROFILE.profileId).toBe('profile-standard');
    expect(STANDARD_KEYBOARD_PROFILE.bindings.length).toBeGreaterThan(0);
  });

  it('serializes and deserializes workspace layout payloads', () => {
    const layout = createWorkspaceLayoutModel('preset-default');
    const serialized = serializeWorkspaceLayout('user-1', layout);
    expect(serialized).toContain('preset-default');

    const deserialized = deserializeWorkspaceLayout(serialized);
    expect(deserialized.activePresetId).toBe('preset-default');
  });
});
