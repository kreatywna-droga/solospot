import { describe, it, expect } from 'vitest';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';
import { applyAnimationToNode, inspectNodeAnimation } from '../../inspector/animationDocumentBinding';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';
import { toTimelinePanelViewModel } from '../TimelinePanelAdapter';
import { EMPTY_TIMELINE_SELECTION } from '../TimelineSelection';
import { addClip, addKeyframe, moveKeyframe, resizeClip } from '../timelineDocumentBinding';
import { validateTimelineField } from '../timelinePropertyFields';

function buildDoc() {
  const doc = createBuilderDocument({
    id: 'store-1',
    tenantId: 'tenant-1',
    metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
  });
  const page = createBuilderPage({
    id: 'page-home',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [createSectionNode({ id: 'sec-1', type: 'hero', label: 'Hero', order: 0 })],
  });
  return { ...doc, pages: [page] };
}

const baseTimeline: AnimationTimeline = {
  id: 'timeline-sec-1',
  targetNodeId: 'sec-1',
  trigger: { type: 'onLoad' },
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

describe('TimelineIntegration (PM36, DECISION-046/047/048)', () => {
  it('renders a panel from BuilderDocument SSOT without mutating the doc', () => {
    const doc = buildDoc();
    const seeded = applyAnimationToNode(doc, 'sec-1', baseTimeline);
    const timeline = inspectNodeAnimation(seeded, 'sec-1')!;

    const vm = toTimelinePanelViewModel('sec-1', timeline);
    expect(vm.timeline.clipCount).toBe(1);
    expect(vm.timeline.clips[0].name).toBe('Fade In');
    expect(vm.viewport.pixelsPerMs).toBeGreaterThan(0);
    expect(vm.grid.ticks.length).toBeGreaterThan(0);

    // Original doc unchanged (SSOT immutability)
    expect(doc.version).toBe(1);
    expect(inspectNodeAnimation(doc, 'sec-1')).toBeNull();
  });

  it('applies a keyframe edit back to BuilderDocument and re-inspects it', () => {
    const doc = buildDoc();
    const seeded = applyAnimationToNode(doc, 'sec-1', baseTimeline);

    let edited = moveKeyframe(seeded, 'sec-1', 'clip-1', 'track-1', 'kf-2', 700);
    edited = setInfo(edited);

    const timeline = inspectNodeAnimation(edited, 'sec-1')!;
const kf = timeline.clips[0].tracks[0].keyframes.find(
      (k: { id: string; timeOffset: number }) => k.id === 'kf-2'
    )!;
    expect(kf.timeOffset).toBe(700);
  });

  it('adds a clip and keyframe through the declarative binding API', () => {
    const doc = buildDoc();
    const seeded = applyAnimationToNode(doc, 'sec-1', baseTimeline);

    let edited = addClip(seeded, 'sec-1', {
      id: 'clip-2',
      name: 'Slide',
      duration: 500,
      delay: 0,
      tracks: [],
    });
    edited = addKeyframe(edited, 'sec-1', 'clip-2', 'T', {
      id: 'kf-x',
      timeOffset: 100,
      value: 1,
      easing: { type: 'linear' },
    });

    const timeline = inspectNodeAnimation(edited, 'sec-1')!;
    expect(timeline.clips).toHaveLength(2);
  });

  it('resizes a clip and validates timeline property fields', () => {
    const doc = buildDoc();
    const seeded = applyAnimationToNode(doc, 'sec-1', baseTimeline);
    const edited = resizeClip(seeded, 'sec-1', 'clip-1', 1200);
    const timeline = inspectNodeAnimation(edited, 'sec-1')!;
    expect(timeline.clips[0].duration).toBe(1200);

    expect(validateTimelineField('timeline.clip.duration', 900).valid).toBe(true);
    expect(validateTimelineField('timeline.clip.duration', -5).valid).toBe(false);
    expect(validateTimelineField('timeline.keyframe.easing', 'spring').valid).toBe(true);
    expect(validateTimelineField('timeline.keyframe.easing', 'bounce').valid).toBe(false);
  });

  it('exposes a selection state fully independent of runtime', () => {
    expect(EMPTY_TIMELINE_SELECTION.selectedClipId).toBeNull();
    expect(EMPTY_TIMELINE_SELECTION.selectedTrackId).toBeNull();
    expect(EMPTY_TIMELINE_SELECTION.selectedKeyframeId).toBeNull();
  });
});

// Helper to keep the integration test self-contained (no-op for clarity).
function setInfo<D>(doc: D): D {
  return doc;
}
