/**
 * AnimationDocumentBinding.test.ts — PM35 ETAP 3/4 BuilderDocument Binding
 *
 * Verifies the single source of truth (SSOT) binding between BuilderDocument
 * nodes and builder-core AnimationTimeline domain structures.
 *
 * DECISION-044 — BuilderDocument is the SSOT; Inspector reads/edits config data ONLY.
 * DECISION-045 — BuilderDocument is the Single Source of Truth for animation data.
 *
 * Pure Node environment (vitest) — no jsdom, no DOM, no window.
 */

import { describe, it, expect } from 'vitest';
import type { BuilderDocument, SectionNode } from '../../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';
import {
  findNodeById,
  updateNodeById,
  inspectNodeAnimation,
  animationTimelineToInspectorValues,
  inspectorValuesToAnimationTimeline,
  applyAnimationToNode,
} from '../animationDocumentBinding';

function createNestedDocument(): BuilderDocument {
  const child: SectionNode = {
    id: 'sec-child',
    type: 'card',
    label: 'Card',
    order: 0,
    visible: true,
    locked: false,
    children: [],
    props: { content: 'Hi' },
  };
  return {
    id: 'store-binding',
    tenantId: 'tenant-binding',
    version: 1,
    createdAt: 1000,
    updatedAt: 1000,
    isDirty: false,
    metadata: { storeName: 'Binding Store', storeSlug: 'binding', locale: 'en', currency: 'USD' },
    theme: { primaryColor: '#000', secondaryColor: '#fff', font: 'Inter' },
    pages: [
      {
        id: 'page-home',
        slug: '/',
        name: 'Home',
        isHome: true,
        seo: {},
        sections: [
          {
            id: 'sec-parent',
            type: 'grid',
            label: 'Grid',
            order: 0,
            visible: true,
            locked: false,
            children: [child],
            props: {},
          },
        ],
      },
    ],
  };
}

function createTimeline(nodeId: string): AnimationTimeline {
  return {
    id: `timeline-${nodeId}`,
    targetNodeId: nodeId,
    trigger: { type: 'hover', threshold: 0.5, targetElementId: nodeId },
    playback: { repeatCount: 2, loop: false, fillMode: 'forwards', direction: 'normal' },
    clips: [
      {
        id: `clip-${nodeId}`,
        name: 'Scale',
        duration: 600,
        delay: 0,
        tracks: [
          {
            id: `track-${nodeId}-scale`,
            propertyKey: 'transform.scale',
            keyframes: [
              { id: `kf-${nodeId}-0`, timeOffset: 0, value: 1, easing: { type: 'ease-out' } },
              { id: `kf-${nodeId}-1`, timeOffset: 600, value: 1.2, easing: { type: 'ease-in' } },
            ],
          },
        ],
      },
    ],
  };
}

describe('AnimationDocumentBinding (PM35)', () => {
  it('finds a node by id recursively (incl. nested children)', () => {
    const doc = createNestedDocument();
    expect(findNodeById(doc.pages[0].sections, 'sec-parent')?.id).toBe('sec-parent');
    expect(findNodeById(doc.pages[0].sections, 'sec-child')?.id).toBe('sec-child');
    expect(findNodeById(doc.pages[0].sections, 'missing')).toBeNull();
  });

  it('updates a node immutably without mutating the original', () => {
    const doc = createNestedDocument();
    const updated = updateNodeById(doc.pages[0].sections, 'sec-child', (node) => ({
      ...node,
      props: { ...node.props, updated: true },
    }));

    // Original untouched.
    expect(doc.pages[0].sections[0].children[0].props.updated).toBeUndefined();
    // Updated node has the change.
    expect(updated[0].children[0].props.updated).toBe(true);
  });

  it('applies and inspects an animation timeline on a nested node (SSOT)', () => {
    const doc = createNestedDocument();
    const timeline = createTimeline('sec-child');

    const applied = applyAnimationToNode(doc, 'sec-child', timeline);
    const inspected = inspectNodeAnimation(applied, 'sec-child');

    expect(inspected).not.toBeNull();
    expect(inspected?.targetNodeId).toBe('sec-child');
    expect(inspected?.trigger.type).toBe('hover');
    expect(inspected?.clips[0].tracks[0].propertyKey).toBe('transform.scale');
    // Stored under animationTimeline in node.props (DECISION-044).
    expect(applied.pages[0].sections[0].children[0].props.animationTimeline).toEqual(timeline);
  });

  it('bumps version and marks dirty on applyAnimationToNode', () => {
    const doc = createNestedDocument();
    const applied = applyAnimationToNode(doc, 'sec-child', createTimeline('sec-child'));
    expect(applied.version).toBe(doc.version + 1);
    expect(applied.updatedAt).toBeGreaterThanOrEqual(doc.updatedAt);
  });

  it('maps timeline domain object to flat inspector values', () => {
    const timeline = createTimeline('sec-child');
    const values = animationTimelineToInspectorValues(timeline);

    expect(values['animation.trigger.type']).toBe('hover');
    expect(values['animation.playback.duration']).toBe(600);
    expect(values['animation.playback.delay']).toBe(0);
    expect(values['animation.playback.easing']).toBe('ease-out');
    expect(values['animation.playback.repeatCount']).toBe('2');
    expect(values['animation.playback.fillMode']).toBe('forwards');
    expect(values['animation.playback.direction']).toBe('normal');
  });

  it('reconstructs a timeline from flat inspector values', () => {
    const timeline = createTimeline('sec-child');
    const values = animationTimelineToInspectorValues(timeline);
    const reconstructed = inspectorValuesToAnimationTimeline('sec-child', values);

    expect(reconstructed.targetNodeId).toBe('sec-child');
    expect(reconstructed.trigger.type).toBe('hover');
    expect(reconstructed.playback.repeatCount).toBe(2);
    expect(reconstructed.clips[0].duration).toBe(600);
    expect(reconstructed.clips[0].tracks[0].keyframes[0].value).toBe(0);
  });

  it('round-trips timeline through document via inspector values (DECISION-044/045)', () => {
    const doc = createNestedDocument();
    const timeline = createTimeline('sec-child');

    const applied = applyAnimationToNode(doc, 'sec-child', timeline);
    const inspected = inspectNodeAnimation(applied, 'sec-child')!;

    // Domain → inspector values → domain.
    const values = animationTimelineToInspectorValues(inspected);
    const reconstructed = inspectorValuesToAnimationTimeline('sec-child', values);
    const roundtripDoc = applyAnimationToNode(applied, 'sec-child', reconstructed);
    const final = inspectNodeAnimation(roundtripDoc, 'sec-child');

    expect(final?.trigger.type).toBe('hover');
    expect(final?.clips[0].duration).toBe(600);
    expect(final?.playback.fillMode).toBe('forwards');
  });
});
