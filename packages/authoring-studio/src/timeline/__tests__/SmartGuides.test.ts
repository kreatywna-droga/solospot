import { describe, it, expect } from 'vitest';
import {
  createSmartGuidesState,
  findSnapCandidates,
  computeSmartGuides,
} from '../TimelineSmartGuides';

describe('SmartGuides (PM40, ETAP 1 & DECISION-063)', () => {
  it('creates default smart guides state as a pure data model (DECISION-063)', () => {
    const state = createSmartGuidesState();
    expect(state.enabled).toBe(true);
    expect(state.activeGuides).toHaveLength(0);
    expect(state.activeSpacings).toHaveLength(0);
  });

  it('finds snap candidates from position list', () => {
    const items = [
      { id: 'kf-1', timeMs: 200, label: 'Keyframe 1' },
      { id: 'clip-1-end', timeMs: 800, label: 'Clip 1 End', type: 'clip_edge' as const },
    ];

    const candidates = findSnapCandidates(items);
    expect(candidates).toHaveLength(2);
    expect(candidates[0].timeMs).toBe(200);
    expect(candidates[1].type).toBe('clip_edge');
  });

  it('computes active guide lines when playhead is within proximity threshold', () => {
    const candidates = [
      { sourceId: 'kf-1', timeMs: 500, label: 'Keyframe at 500ms', type: 'alignment' as const },
      { sourceId: 'kf-2', timeMs: 1200, label: 'Keyframe at 1200ms', type: 'alignment' as const },
    ];

    // Current playhead at 505ms (within 10ms threshold of 500ms candidate)
    const guides = computeSmartGuides(505, candidates, 10);
    expect(guides.activeGuides).toHaveLength(1);
    expect(guides.activeGuides[0].positionMs).toBe(500);
    expect(guides.activeGuides[0].label).toBe('Keyframe at 500ms');

    // Current playhead at 700ms (far from candidate)
    const emptyGuides = computeSmartGuides(700, candidates, 10);
    expect(emptyGuides.activeGuides).toHaveLength(0);
  });
});
