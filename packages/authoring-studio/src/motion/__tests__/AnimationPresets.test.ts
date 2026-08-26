import { describe, expect, it } from 'vitest';
import { MotionPresetBridge } from '../MotionPresetBridge';

describe('MotionPresetBridge Integration (S13 ETAP 5)', () => {
  it('generates immutable AnimationTimeline DTOs for built-in motion presets', () => {
    const fadeInTimeline = MotionPresetBridge.createPresetTimeline('fade-in', {
      targetNodeId: 'hero_box',
      durationMs: 800,
    });

    expect(fadeInTimeline.targetNodeId).toBe('hero_box');
    expect(fadeInTimeline.clips[0].duration).toBe(800);
    expect(fadeInTimeline.clips[0].tracks[0].property).toBe('opacity');

    const bounceInTimeline = MotionPresetBridge.createPresetTimeline('bounce-in', {
      targetNodeId: 'card_node',
      durationMs: 1200,
    });
    expect(bounceInTimeline.clips[0].tracks[0].property).toBe('scaleX');
  });

  it('connects to PM41 AnimationPresetLibrary definitions', () => {
    const pm41Presets = MotionPresetBridge.getPM41PresetDefinitions();
    expect(pm41Presets.length).toBeGreaterThan(0);
  });
});
