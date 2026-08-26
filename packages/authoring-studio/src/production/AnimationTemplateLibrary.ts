/**
 * AnimationTemplateLibrary.ts — PM41 Animation Template Library (ETAP 4)
 *
 * DECISION-072: Template Library przechowuje wyłącznie definicje danych.
 *
 * Provides reusable multi-clip animation templates, metadata indexing, validation, and preview descriptors.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API.
 */

import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';

export interface TemplatePreviewMetadata {
  readonly thumbnailRatio: string;
  readonly recommendedNodeType: string;
  readonly sampleDurationMs: number;
}

export interface AnimationTemplate {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly author: string;
  readonly version: string;
  readonly preview: TemplatePreviewMetadata;
  readonly templateTimeline: AnimationTimeline;
}

export interface TemplateValidationReport {
  readonly isValid: boolean;
  readonly errors: ReadonlyArray<string>;
}

export interface TemplateLibraryState {
  readonly templates: ReadonlyArray<AnimationTemplate>;
}

export const INITIAL_TEMPLATE_LIBRARY_STATE: TemplateLibraryState = {
  templates: [],
};

export function createTemplateLibraryState(
  initialTemplates: ReadonlyArray<AnimationTemplate> = []
): TemplateLibraryState {
  return {
    templates: [...initialTemplates],
  };
}

/**
 * Validates an AnimationTemplate definition.
 */
export function validateAnimationTemplate(template: AnimationTemplate | null): TemplateValidationReport {
  const errors: string[] = [];

  if (!template) {
    errors.push('Template is null or undefined.');
    return { isValid: false, errors };
  }

  if (!template.id || template.id.trim().length === 0) {
    errors.push('Template missing valid ID.');
  }

  if (!template.title || template.title.trim().length === 0) {
    errors.push('Template missing title.');
  }

  if (!template.templateTimeline) {
    errors.push('Template missing timeline definition.');
  } else if (!template.templateTimeline.clips || template.templateTimeline.clips.length === 0) {
    errors.push('Template timeline contains no clips.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Registers a new reusable animation template immutably.
 */
export function registerTemplate(
  state: TemplateLibraryState,
  template: AnimationTemplate
): TemplateLibraryState {
  const report = validateAnimationTemplate(template);
  if (!report.isValid) {
    throw new Error(`Template validation failed: ${report.errors.join('; ')}`);
  }

  const filtered = state.templates.filter((t) => t.id !== template.id);
  return {
    templates: [...filtered, template],
  };
}

/**
 * Instantiates an AnimationTimeline from a template for a target node ID.
 */
export function instantiateTemplateTimeline(
  template: AnimationTemplate,
  targetNodeId: string
): AnimationTimeline {
  const baseTimeline = template.templateTimeline;
  return {
    ...baseTimeline,
    id: `tl-tmpl-${template.id}-${Date.now()}`,
    targetNodeId,
    clips: baseTimeline.clips.map((clip) => ({
      ...clip,
      id: `clip-tmpl-${clip.id}-${Math.floor(Math.random() * 1000)}`,
      tracks: clip.tracks.map((track) => ({
        ...track,
        id: `tr-tmpl-${track.id}-${Math.floor(Math.random() * 1000)}`,
        keyframes: track.keyframes.map((kf) => ({
          ...kf,
          id: `kf-tmpl-${kf.id}-${Math.floor(Math.random() * 1000)}`,
        })),
      })),
    })),
  };
}
