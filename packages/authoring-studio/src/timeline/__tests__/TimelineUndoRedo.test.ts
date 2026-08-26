import { describe, it, expect } from 'vitest';
import {
  executeTimelineTransaction,
  undoTimelineTransaction,
  redoTimelineTransaction,
} from '../TimelineHistoryBinding';
import { createHistoryStack, type HistoryStack } from '../../../../builder-core/src/HistoryStack';
import { createBuilderDocument, createBuilderPage, createSectionNode, type BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import { applyAnimationToNode, inspectNodeAnimation } from '../../inspector/animationDocumentBinding';
import { moveKeyframe } from '../timelineDocumentBinding';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

function buildDoc() {
  const doc = createBuilderDocument({
    id: 'store-undo',
    tenantId: 'tenant-undo',
    metadata: { storeName: 'Undo Test', storeSlug: 'undo', locale: 'en', currency: 'USD' },
  });
  const page = createBuilderPage({
    id: 'page-undo',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [createSectionNode({ id: 'sec-undo-node', type: 'hero', label: 'Hero', order: 0 })],
  });
  return { ...doc, pages: [page] };
}

const mockTimeline: AnimationTimeline = {
  id: 'tl-undo-node',
  targetNodeId: 'sec-undo-node',
  trigger: { type: 'onLoad' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-1',
      name: 'Fade',
      duration: 1000,
      delay: 0,
      tracks: [
        {
          id: 'track-1',
          propertyKey: 'opacity',
          keyframes: [
            { id: 'kf-1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
            { id: 'kf-2', timeOffset: 500, value: 1, easing: { type: 'linear' } },
          ],
        },
      ],
    },
  ],
};

describe('TimelineUndoRedo Integration (PM39, ETAP 6 & DECISION-061)', () => {
  it('integrates timeline operations with BuilderDocument HistoryStack (DECISION-061)', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-undo-node', mockTimeline);

    let stack: HistoryStack<BuilderDocument> = createHistoryStack<BuilderDocument>(50);
    stack = stack.push(doc, 'Initial document seeded');

    // Perform timeline move transaction
    const tx = executeTimelineTransaction(
      stack,
      doc,
      (d) => moveKeyframe(d, 'sec-undo-node', 'clip-1', 'track-1', 'kf-2', 700),
      'Move keyframe kf-2 to 700ms'
    );

    stack = tx.historyStack;
    let currentDoc = tx.document;

    const timelineAfterMove = inspectNodeAnimation(currentDoc, 'sec-undo-node')!;
    expect(timelineAfterMove.clips[0].tracks[0].keyframes[1].timeOffset).toBe(700);

    // Undo transaction
    const undoRes = undoTimelineTransaction(stack);
    expect(undoRes).not.toBeNull();

    if (undoRes) {
      stack = undoRes.historyStack;
      currentDoc = undoRes.document;
    }

    const timelineAfterUndo = inspectNodeAnimation(currentDoc, 'sec-undo-node')!;
    expect(timelineAfterUndo.clips[0].tracks[0].keyframes[1].timeOffset).toBe(500);

    // Redo transaction
    const redoRes = redoTimelineTransaction(stack);
    expect(redoRes).not.toBeNull();

    if (redoRes) {
      stack = redoRes.historyStack;
      currentDoc = redoRes.document;
    }

    const timelineAfterRedo = inspectNodeAnimation(currentDoc, 'sec-undo-node')!;
    expect(timelineAfterRedo.clips[0].tracks[0].keyframes[1].timeOffset).toBe(700);
  });
});
