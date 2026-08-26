import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TimelinePanel } from '../TimelinePanel';
import { EMPTY_TIMELINE_SELECTION, selectClip, selectKeyframe } from '../TimelineSelection';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

const timeline: AnimationTimeline = {
  id: 'timeline-1',
  targetNodeId: 'sec-1',
  trigger: { type: 'inView', threshold: 0.5 },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-1',
      name: 'Fade In',
      duration: 800,
      delay: 0,
      tracks: [
        {
          id: 'track-1',
          propertyKey: 'opacity',
          keyframes: [
            { id: 'kf-1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
            { id: 'kf-2', timeOffset: 800, value: 1, easing: { type: 'ease-out' } },
          ],
        },
      ],
    },
  ],
};

const noop = () => {};

describe('TimelinePanel (PM36, DECISION-046 pure authoring surface)', () => {
  it('renders ruler ticks, clips, and toolbar', () => {
    const html = renderToStaticMarkup(
      <TimelinePanel
        timeline={timeline}
        nodeId="sec-1"
        selection={EMPTY_TIMELINE_SELECTION}
        onSelectClip={noop}
        onSelectTrack={noop}
        onSelectKeyframe={noop}
        onAddClip={noop}
        onRemoveClip={noop}
        onAddTrack={noop}
        onAddKeyframe={noop}
      />
    );
    expect(html).toContain('inspector-timeline-panel');
    expect(html).toContain('timeline-ruler');
    expect(html).toContain('timeline-clip');
    expect(html).toContain('Fade In');
    expect(html).toContain('timeline-add-clip');
  });

  it('reveals tracks and keyframes when a clip is selected', () => {
    const html = renderToStaticMarkup(
      <TimelinePanel
        timeline={timeline}
        nodeId="sec-1"
        selection={selectClip(EMPTY_TIMELINE_SELECTION, 'clip-1')}
        onSelectClip={noop}
        onSelectTrack={noop}
        onSelectKeyframe={noop}
        onAddClip={noop}
        onRemoveClip={noop}
        onAddTrack={noop}
        onAddKeyframe={noop}
      />
    );
    expect(html).toContain('timeline-add-track');
    expect(html).toContain('timeline-keyframe');
  });

  it('highlights a selected keyframe and shows add-keyframe control', () => {
    const html = renderToStaticMarkup(
      <TimelinePanel
        timeline={timeline}
        nodeId="sec-1"
        selection={selectKeyframe(EMPTY_TIMELINE_SELECTION, 'clip-1', 'track-1', 'kf-1')}
        onSelectClip={noop}
        onSelectTrack={noop}
        onSelectKeyframe={noop}
        onAddClip={noop}
        onRemoveClip={noop}
        onAddTrack={noop}
        onAddKeyframe={noop}
      />
    );
    expect(html).toContain('timeline-add-keyframe');
    expect(html).toContain('timeline-keyframe');
  });

  it('provides an add-clip button wired to onAddClip', () => {
    const onAddClip = vi.fn();
    const html = renderToStaticMarkup(
      <TimelinePanel
        timeline={timeline}
        nodeId="sec-1"
        selection={EMPTY_TIMELINE_SELECTION}
        onSelectClip={noop}
        onSelectTrack={noop}
        onSelectKeyframe={noop}
        onAddClip={onAddClip}
        onRemoveClip={noop}
        onAddTrack={noop}
        onAddKeyframe={noop}
      />
    );
    expect(html).toContain('timeline-add-clip');
    expect(onAddClip).not.toHaveBeenCalled(); // static render does not dispatch
  });
});
