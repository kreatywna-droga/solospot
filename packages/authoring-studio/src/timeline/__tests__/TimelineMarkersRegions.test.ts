/**
 * TimelineMarkersRegions.test.ts — Sprint S24 Markers & Loop Regions Vitest Suite
 * Node environment — no jsdom required.
 */

import { describe, expect, it } from 'vitest';
import { INITIAL_MARKERS_REGIONS_STATE } from '../TimelineMarkersRegionsModel';
import { TimelineMarkersRegionsController } from '../TimelineMarkersRegionsController';

describe('S24 — TimelineMarkersRegions', () => {
  it('adds, moves, locks, and removes timeline markers', () => {
    const m1 = TimelineMarkersRegionsController.createMarker({
      id: 'm-1',
      timeMs: 200,
      label: 'Intro Start',
      color: '#EC4899',
    });

    const s1 = TimelineMarkersRegionsController.addMarker(INITIAL_MARKERS_REGIONS_STATE, m1);
    expect(s1.markers.length).toBe(1);
    expect(s1.markers[0].label).toBe('Intro Start');

    const s2 = TimelineMarkersRegionsController.moveMarker(s1, 'm-1', 250);
    expect(s2.markers[0].timeMs).toBe(250);

    const sLocked = TimelineMarkersRegionsController.toggleLockMarker(s2, 'm-1');
    expect(sLocked.markers[0].locked).toBe(true);

    // Attempting to move locked marker should preserve timeMs
    const sMovedLocked = TimelineMarkersRegionsController.moveMarker(sLocked, 'm-1', 400);
    expect(sMovedLocked.markers[0].timeMs).toBe(250);

    const sRemoved = TimelineMarkersRegionsController.removeMarker(sMovedLocked, 'm-1');
    expect(sRemoved.markers.length).toBe(0);
  });

  it('configures and toggles loop regions', () => {
    const s1 = TimelineMarkersRegionsController.setLoopRegion(
      INITIAL_MARKERS_REGIONS_STATE,
      100,
      800,
      true
    );

    expect(s1.loopRegion.enabled).toBe(true);
    expect(s1.loopRegion.startTimeMs).toBe(100);
    expect(s1.loopRegion.endTimeMs).toBe(800);

    const sToggled = TimelineMarkersRegionsController.toggleLoopRegion(s1);
    expect(sToggled.loopRegion.enabled).toBe(false);
  });
});
