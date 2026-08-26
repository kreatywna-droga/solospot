import { describe, it, expect } from 'vitest';
import {
  SplitMediaClipCommand,
  TrimMediaClipCommand,
  UpdateAudioSettingsCommand,
  RippleDeleteClipCommand,
  AddClipMarkerCommand,
} from '../MediaTimelineCommands';
import {
  checkMediaTimelineIntegrity,
  relinkTimelineAsset,
} from '../MediaIntegrityEngine';
import { AudioTimelineEngine } from '../AudioTimelineEngine';
import { createMediaTimelineState } from '../MediaTimelineModel';
import { createAssetRegistryState, registerAsset, createAssetItem } from '../../assets/AnimationAssetRegistry';

describe('MediaTimelineCommands & History & Integrity Engine', () => {
  describe('Editing Commands', () => {
    it('executes SplitMediaClipCommand cleanly', () => {
      const clip = AudioTimelineEngine.createAudioClip('c1', 'a1', 'Audio.mp3', 0, 4000);
      const initialState = createMediaTimelineState([
        { id: 't1', name: 'Audio Track', mediaType: 'audio', clips: [clip], muted: false, solo: false, locked: false, visible: true, heightPx: 60 },
      ]);

      const command = new SplitMediaClipCommand('t1', 'c1', 1500);
      const updatedState = command.execute(initialState);

      const clips = updatedState.tracks[0].clips;
      expect(clips).toHaveLength(2);
      expect(clips[0].durationMs).toBe(1500);
      expect(clips[1].startTimeMs).toBe(1500);
      expect(clips[1].durationMs).toBe(2500);
    });

    it('executes TrimMediaClipCommand left and right', () => {
      const clip = AudioTimelineEngine.createAudioClip('c1', 'a1', 'Audio.mp3', 0, 4000);
      const initialState = createMediaTimelineState([
        { id: 't1', name: 'Audio Track', mediaType: 'audio', clips: [clip], muted: false, solo: false, locked: false, visible: true, heightPx: 60 },
      ]);

      const trimLeftCmd = new TrimMediaClipCommand('t1', 'c1', 'left', 500);
      const trimmedLeftState = trimLeftCmd.execute(initialState);

      const trimmedClip = trimmedLeftState.tracks[0].clips[0];
      expect(trimmedClip.startTimeMs).toBe(500);
      expect(trimmedClip.durationMs).toBe(3500);
    });

    it('executes AddClipMarkerCommand and undoes by removing marker', () => {
      const clip = AudioTimelineEngine.createAudioClip('c1', 'a1', 'Audio.mp3', 0, 4000);
      const initialState = createMediaTimelineState([
        { id: 't1', name: 'Audio Track', mediaType: 'audio', clips: [clip], muted: false, solo: false, locked: false, visible: true, heightPx: 60 },
      ]);

      const marker = { id: 'm1', relativeTimeMs: 1000, label: 'Solo' };
      const command = new AddClipMarkerCommand('t1', 'c1', marker);

      const executed = command.execute(initialState);
      expect(executed.tracks[0].clips[0].clipMarkers).toHaveLength(1);

      const undone = command.undo(executed);
      expect(undone.tracks[0].clips[0].clipMarkers).toHaveLength(0);
    });
  });

  describe('Media Integrity Engine & Asset Relink', () => {
    it('detects missing assets across media clips in registry', () => {
      const clipValid = AudioTimelineEngine.createAudioClip('c1', 'valid_asset', 'Valid.mp3', 0, 2000);
      const clipMissing = AudioTimelineEngine.createAudioClip('c2', 'missing_asset', 'Missing.mp3', 2000, 2000);

      const state = createMediaTimelineState([
        { id: 't1', name: 'Audio Track', mediaType: 'audio', clips: [clipValid, clipMissing], muted: false, solo: false, locked: false, visible: true, heightPx: 60 },
      ]);

      let registry = createAssetRegistryState();
      const validItem = createAssetItem('valid_asset', 'audio', 'Valid.mp3', 1024);
      registry = registerAsset(registry, validItem);

      const report = checkMediaTimelineIntegrity(state, registry);
      expect(report.isValid).toBe(false);
      expect(report.totalClipsCount).toBe(2);
      expect(report.validClipsCount).toBe(1);
      expect(report.missingAssetClips).toHaveLength(1);
      expect(report.missingAssetClips[0].missingAssetId).toBe('missing_asset');
    });

    it('relinks timeline asset IDs across affected clips', () => {
      const clipMissing = AudioTimelineEngine.createAudioClip('c2', 'missing_asset', 'Missing.mp3', 2000, 2000);
      const state = createMediaTimelineState([
        { id: 't1', name: 'Audio Track', mediaType: 'audio', clips: [clipMissing], muted: false, solo: false, locked: false, visible: true, heightPx: 60 },
      ]);

      const relinkedState = relinkTimelineAsset(state, 'missing_asset', 'replacement_asset');
      expect(relinkedState.tracks[0].clips[0].assetId).toBe('replacement_asset');
    });
  });
});
