/**
 * InteractiveEditCommands.ts — Sprint S12 Interactive Editing Commands
 *
 * Provides pure immutable command functions for modifying node properties
 * (position, scale, rotation, opacity, visibility) and timeline keyframes on BuilderDocument.
 *
 * BuilderDocument remains the Single Source of Truth (SSOT).
 * NO DOM, NO React, NO window.
 */

import { AnimationTimeline, Keyframe } from '../../../builder-core/src/animation/AnimationTypes';
import { BuilderDocument, SectionNode } from '../../../builder-core/src/BuilderDocument';

export function updateNodeProps(
  doc: BuilderDocument,
  nodeId: string,
  propsToUpdate: Record<string, unknown>
): BuilderDocument {
  let modified = false;

  function updateNode(node: SectionNode): SectionNode {
    if (node.id === nodeId) {
      modified = true;
      return {
        ...node,
        props: {
          ...node.props,
          ...propsToUpdate,
        },
      };
    }

    if (node.children && node.children.length > 0) {
      const updatedChildren = node.children.map(updateNode);
      return {
        ...node,
        children: updatedChildren,
      };
    }

    return node;
  }

  const updatedPages = doc.pages.map((page) => ({
    ...page,
    sections: page.sections.map(updateNode),
  }));

  if (!modified) {
    return doc;
  }

  return {
    ...doc,
    pages: updatedPages,
  };
}

export function updateNodePosition(
  doc: BuilderDocument,
  nodeId: string,
  x: number,
  y: number
): BuilderDocument {
  return updateNodeProps(doc, nodeId, { x, y });
}

export function updateNodeScale(
  doc: BuilderDocument,
  nodeId: string,
  width: number,
  height: number
): BuilderDocument {
  return updateNodeProps(doc, nodeId, { width, height });
}

export function updateNodeRotation(
  doc: BuilderDocument,
  nodeId: string,
  rotationDeg: number
): BuilderDocument {
  return updateNodeProps(doc, nodeId, { rotation: rotationDeg, rotate: rotationDeg });
}

export function updateNodeOpacity(
  doc: BuilderDocument,
  nodeId: string,
  opacity: number
): BuilderDocument {
  const clamped = Math.max(0, Math.min(1, opacity));
  return updateNodeProps(doc, nodeId, { opacity: clamped });
}

export function updateNodeVisibility(
  doc: BuilderDocument,
  nodeId: string,
  visible: boolean
): BuilderDocument {
  let modified = false;

  function updateNode(node: SectionNode): SectionNode {
    if (node.id === nodeId) {
      modified = true;
      return {
        ...node,
        visible,
      };
    }

    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: node.children.map(updateNode),
      };
    }

    return node;
  }

  const updatedPages = doc.pages.map((page) => ({
    ...page,
    sections: page.sections.map(updateNode),
  }));

  if (!modified) return doc;

  return {
    ...doc,
    pages: updatedPages,
  };
}

export function updateKeyframeInTimeline(
  timeline: AnimationTimeline,
  clipId: string,
  trackId: string,
  keyframe: Keyframe
): AnimationTimeline {
  return {
    ...timeline,
    clips: timeline.clips.map((clip) => {
      if (clip.id !== clipId) return clip;
      return {
        ...clip,
        tracks: clip.tracks.map((track) => {
          if (track.id !== trackId) return track;
          const existingIndex = track.keyframes.findIndex((k) => k.id === keyframe.id);
          let nextKeyframes: Keyframe[];
          if (existingIndex >= 0) {
            nextKeyframes = [...track.keyframes];
            nextKeyframes[existingIndex] = keyframe;
          } else {
            nextKeyframes = [...track.keyframes, keyframe];
          }
          nextKeyframes.sort((a, b) => a.timeOffset - b.timeOffset);
          return {
            ...track,
            keyframes: nextKeyframes,
          };
        }),
      };
    }),
  };
}
