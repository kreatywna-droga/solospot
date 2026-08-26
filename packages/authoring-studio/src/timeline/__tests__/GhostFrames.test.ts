import { describe, it, expect } from 'vitest';
import {
  createGhostFramesState,
  createGhostFrames,
  clearGhostFrames,
} from '../TimelineGhostFrames';

describe('GhostFrames (PM40, ETAP 4 & DECISION-066)', () => {
  it('creates default ghost frames state (DECISION-066)', () => {
    const state = createGhostFramesState();
    expect(state.activeGhosts).toHaveLength(0);
    expect(state.isDragging).toBe(false);
  });

  it('generates ghost frame metadata for keyframes during drag gesture', () => {
    const items = [
      { keyframeId: 'kf-1', trackId: 'tr-1', clipId: 'clip-1', timeMs: 200 },
      { keyframeId: 'kf-2', trackId: 'tr-1', clipId: 'clip-1', timeMs: 500 },
    ];

    const state = createGhostFrames(items, 150, 0.6);

    expect(state.isDragging).toBe(true);
    expect(state.activeGhosts).toHaveLength(2);
    expect(state.activeGhosts[0].previewTimeMs).toBe(350); // 200 + 150
    expect(state.activeGhosts[1].previewTimeMs).toBe(650); // 500 + 150
    expect(state.activeGhosts[0].opacity).toBe(0.6);
  });

  it('clears ghost frames state', () => {
    const items = [{ keyframeId: 'kf-1', trackId: 'tr-1', clipId: 'clip-1', timeMs: 200 }];
    let state = createGhostFrames(items, 100);
    expect(state.activeGhosts).toHaveLength(1);

    state = clearGhostFrames();
    expect(state.activeGhosts).toHaveLength(0);
    expect(state.isDragging).toBe(false);
  });
});
