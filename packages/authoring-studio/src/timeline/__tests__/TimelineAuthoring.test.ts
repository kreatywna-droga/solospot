import { describe, it, expect } from 'vitest';
import { TimelineAuthoringExtensions } from '../TimelineAuthoringExtensions';
import type { Track } from '../../../../builder-core/src/animation/AnimationTypes';

describe('TimelineAuthoringExtensions (S14 ETAP 4)', () => {
  const mockTrack: Track = {
    id: 'tr_1',
    propertyKey: 'positionX',
    keyframes: [
      { id: 'kf_1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
      { id: 'kf_2', timeOffset: 500, value: 100, easing: { type: 'linear' } },
      { id: 'kf_3', timeOffset: 1000, value: 200, easing: { type: 'linear' } },
    ],
  };

  it('adds and removes timeline markers', () => {
    let markers = TimelineAuthoringExtensions.addMarker([], 250, 'Intro');
    expect(markers.length).toBe(1);
    expect(markers[0].label).toBe('Intro');
    expect(markers[0].timeMs).toBe(250);

    markers = TimelineAuthoringExtensions.removeMarker(markers, markers[0].id);
    expect(markers.length).toBe(0);
  });

  it('applies ripple editing to shift keyframes downstream', () => {
    const rippled = TimelineAuthoringExtensions.applyRippleEdit(mockTrack, 500, 200);
    expect(rippled.keyframes[0].timeOffset).toBe(0);
    expect(rippled.keyframes[1].timeOffset).toBe(700);
    expect(rippled.keyframes[2].timeOffset).toBe(1200);
  });

  it('copies and pastes keyframes DTO into track at target time', () => {
    const clipboard = TimelineAuthoringExtensions.copyKeyframes(mockTrack, ['kf_2', 'kf_3']);
    expect(clipboard.keyframes.length).toBe(2);

    const pasted = TimelineAuthoringExtensions.pasteKeyframes(mockTrack, clipboard, 2000);
    expect(pasted.keyframes.length).toBe(5);
    expect(pasted.keyframes[3].timeOffset).toBe(2000);
    expect(pasted.keyframes[4].timeOffset).toBe(2500);
  });
});
