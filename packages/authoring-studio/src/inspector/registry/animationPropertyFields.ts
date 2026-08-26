/**
 * animationPropertyFields.ts — PM35 Inspector Animation Property Registry Definitions
 *
 * Single source of truth for all Inspector 2.0 animation fields.
 * Defines property field definitions for Trigger, Playback, Easing, and Timeline configuration.
 *
 * NO Runtime execution, NO PlaybackController, NO DOM, NO requestAnimationFrame.
 */

import type { PropertyFieldDefinition } from './types';

export const ANIMATION_PROPERTY_FIELDS: PropertyFieldDefinition[] = [
  {
    id: 'animation.trigger.type',
    label: 'Trigger Type',
    description: 'Event condition that starts the element animation',
    defaultValue: 'onLoad',
    widget: 'select',
    category: 'animation',
    options: [
      { value: 'onLoad', label: 'On Page Load' },
      { value: 'inView', label: 'In Viewport' },
      { value: 'hover', label: 'On Hover' },
      { value: 'click', label: 'On Click' },
      { value: 'scroll', label: 'On Scroll' },
    ],
    validation: (val) => {
      const valid = ['onLoad', 'inView', 'hover', 'click', 'scroll'].includes(String(val));
      return valid
        ? { valid: true }
        : { valid: false, error: `Invalid trigger type '${val}'` };
    },
  },
  {
    id: 'animation.trigger.threshold',
    label: 'Trigger Threshold',
    description: 'Visibility or scroll threshold (0.0 to 1.0)',
    defaultValue: 0.5,
    widget: 'number',
    category: 'animation',
    min: 0,
    max: 1,
    step: 0.05,
    validation: (val) => {
      const num = Number(val);
      const valid = !isNaN(num) && num >= 0 && num <= 1;
      return valid
        ? { valid: true }
        : { valid: false, error: 'Threshold must be a number between 0.0 and 1.0' };
    },
  },
  {
    id: 'animation.playback.duration',
    label: 'Duration (ms)',
    description: 'Animation clip duration in milliseconds',
    defaultValue: 1000,
    widget: 'number',
    category: 'animation',
    min: 50,
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
    id: 'animation.playback.delay',
    label: 'Delay (ms)',
    description: 'Initial playback delay in milliseconds',
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
    id: 'animation.playback.easing',
    label: 'Easing Curve',
    description: 'Speed curve of the transition effect',
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
  {
    id: 'animation.playback.repeatCount',
    label: 'Repeat Count',
    description: 'Number of times animation should repeat',
    defaultValue: '1',
    widget: 'select',
    category: 'animation',
    options: [
      { value: '1', label: 'Once (1x)' },
      { value: '2', label: 'Twice (2x)' },
      { value: '3', label: 'Three times (3x)' },
      { value: 'infinite', label: 'Infinite Loop' },
    ],
    validation: (val) => {
      const str = String(val);
      const valid = str === 'infinite' || (!isNaN(Number(str)) && Number(str) > 0);
      return valid
        ? { valid: true }
        : { valid: false, error: 'Repeat count must be a positive number or infinite' };
    },
  },
  {
    id: 'animation.playback.fillMode',
    label: 'Fill Mode',
    description: 'Style state before/after animation execution',
    defaultValue: 'forwards',
    widget: 'select',
    category: 'animation',
    options: [
      { value: 'none', label: 'None' },
      { value: 'forwards', label: 'Forwards (Retain end state)' },
      { value: 'backwards', label: 'Backwards (Apply start state)' },
      { value: 'both', label: 'Both' },
    ],
    validation: (val) => {
      const valid = ['none', 'forwards', 'backwards', 'both'].includes(String(val));
      return valid
        ? { valid: true }
        : { valid: false, error: `Invalid fill mode '${val}'` };
    },
  },
  {
    id: 'animation.playback.direction',
    label: 'Playback Direction',
    description: 'Direction sequence of keyframe interpolation',
    defaultValue: 'normal',
    widget: 'select',
    category: 'animation',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'reverse', label: 'Reverse' },
      { value: 'alternate', label: 'Alternate' },
      { value: 'alternate-reverse', label: 'Alternate Reverse' },
    ],
    validation: (val) => {
      const valid = ['normal', 'reverse', 'alternate', 'alternate-reverse'].includes(
        String(val)
      );
      return valid
        ? { valid: true }
        : { valid: false, error: `Invalid direction '${val}'` };
    },
  },
];
