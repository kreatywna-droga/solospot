/**
 * KeyboardProfiles.ts — Sprint S2 Keyboard Profiles & Shortcuts (Preferences)
 *
 * Keyboard profile definitions and custom key binding profiles.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface KeyBinding {
  readonly commandId: string;
  readonly keyCombo: string; // e.g. "Ctrl+S", "Space"
}

export interface KeyboardProfile {
  readonly profileId: string;
  readonly name: string;
  readonly description: string;
  readonly bindings: ReadonlyArray<KeyBinding>;
}

export const STANDARD_KEYBOARD_PROFILE: KeyboardProfile = {
  profileId: 'profile-standard',
  name: 'Standard Studio Profile',
  description: 'Default keyboard shortcuts profile for Web Factor Authoring Studio',
  bindings: [
    { commandId: 'cmd.timeline.play', keyCombo: 'Space' },
    { commandId: 'cmd.timeline.addKeyframe', keyCombo: 'K' },
    { commandId: 'cmd.project.save', keyCombo: 'Ctrl+S' },
  ],
};
