/**
 * timelinePropertyFields.ts — PM36 Timeline Property Registry (ETAP 5)
 *
 * Field registry for Timeline editing: Clip, Track, Keyframe, Duration, Delay,
 * Offset, Easing. Pure field definitions — no Runtime logic.
 * These follow the same PropertyFieldDefinition contract as the Inspector registry.
 *
 * NO DOM, NO window, NO requestAnimationFrame, NO setTimeout/setInterval.
 */

import type { PropertyFieldDefinition } from '../inspector/registry/types';

export const TIMELINE_PROPERTY_FIELDS: PropertyFieldDefinition[] = [
  {
    id: 'timeline.clip.name',
    label: 'Clip Name',
    description: 'Display name of the animation clip',
    defaultValue: 'New Clip',
    widget: 'text',
    category: 'animation',
    validation: (val) => {
      const s = String(val ?? '');
      return s.length > 0
        ? { valid: true }
        : { valid: false, error: 'Clip name cannot be empty' };
    },
  },
  {
    id: 'timeline.clip.duration',
    label: 'Clip Duration (ms)',
    description: 'Duration of the clip in milliseconds',
    defaultValue: 1000,
    widget: 'number',
    category: 'animation',
    min: 1,
    max: 60000,
    step: 50,
    unit: 'ms',
    validation: (val) => {
      const num = Number(val);
      const valid = !isNaN(num) && num > 0;
      return valid
        ? { valid: true }
        : { valid: false, error: 'Duration must be a positive number' };
    },
  },
  {
    id: 'timeline.clip.delay',
    label: 'Clip Delay (ms)',
    description: 'Delay before the clip starts, in milliseconds',
    defaultValue: 0,
    widget: 'number',
    category: 'animation',
    min: 0,
    max: 30000,
    step: 50,
    unit: 'ms',
    validation: (val) => {
      const num = Number(val);
      const valid = !isNaN(num) && num >= 0;
      return valid
        ? { valid: true }
        : { valid: false, error: 'Delay must be non-negative' };
    },
  },
  {
    id: 'timeline.track.propertyKey',
    label: 'Track Property',
    description: 'CSS/animation property animated by this track',
    defaultValue: 'opacity',
    widget: 'text',
    category: 'animation',
    validation: (val) => {
      const s = String(val ?? '');
      return s.length > 0
        ? { valid: true }
        : { valid: false, error: 'Property key cannot be empty' };
    },
  },
  {
    id: 'timeline.keyframe.timeOffset',
    label: 'Keyframe Offset (ms)',
    description: 'Time offset of the keyframe in milliseconds',
    defaultValue: 0,
    widget: 'number',
    category: 'animation',
    min: 0,
    max: 60000,
    step: 50,
    unit: 'ms',
    validation: (val) => {
      const num = Number(val);
      const valid = !isNaN(num) && num >= 0;
      return valid
        ? { valid: true }
        : { valid: false, error: 'Offset must be non-negative' };
    },
  },
  {
    id: 'timeline.keyframe.value',
    label: 'Keyframe Value',
    description: 'Animated value at this keyframe',
    defaultValue: 0,
    widget: 'number',
    category: 'animation',
    validation: (val) => {
      const num = Number(val);
      const valid = !isNaN(num);
      return valid
        ? { valid: true }
        : { valid: false, error: 'Value must be a number' };
    },
  },
  {
    id: 'timeline.keyframe.easing',
    label: 'Keyframe Easing',
    description: 'Easing curve applied to this keyframe',
    defaultValue: 'ease-out',
    widget: 'select',
    category: 'animation',
    options: [
      { value: 'linear', label: 'Linear' },
      { value: 'ease-in', label: 'Ease In' },
      { value: 'ease-out', label: 'Ease Out' },
      { value: 'cubic-bezier', label: 'Cubic Bezier' },
      { value: 'spring', label: 'Spring' },
    ],
    validation: (val) => {
      const valid = ['linear', 'ease-in', 'ease-out', 'cubic-bezier', 'spring'].includes(
        String(val)
      );
      return valid
        ? { valid: true }
        : { valid: false, error: `Invalid easing type '${val}'` };
    },
  },
];

export function getTimelineField(fieldId: string): PropertyFieldDefinition | undefined {
  return TIMELINE_PROPERTY_FIELDS.find((f) => f.id === fieldId);
}

export function validateTimelineField(
  fieldId: string,
  value: unknown
): { valid: boolean; error?: string } {
  const field = getTimelineField(fieldId);
  if (!field) return { valid: true };
  const res = field.validation(value);
  return res.valid ? { valid: true } : { valid: false, error: res.error };
}
