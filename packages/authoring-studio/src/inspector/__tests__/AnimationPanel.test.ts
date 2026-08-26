import { describe, it, expect } from 'vitest';
import { ANIMATION_PROPERTY_FIELDS } from '../registry/animationPropertyFields';
import {
  createAnimationPanelAdapterState,
  validateAnimationFieldValue,
} from '../panels/AnimationPanelAdapter';

describe('AnimationPanel (PM35)', () => {
  it('creates adapter state with default property values', () => {
    const state = createAnimationPanelAdapterState();
    expect(state.fields).toBe(ANIMATION_PROPERTY_FIELDS);
    expect(state.values['animation.trigger.type']).toBe('onLoad');
    expect(state.values['animation.trigger.threshold']).toBe(0.5);
    expect(state.values['animation.playback.duration']).toBe(1000);
    expect(state.values['animation.playback.delay']).toBe(0);
    expect(state.values['animation.playback.easing']).toBe('ease-out');
    expect(state.values['animation.playback.repeatCount']).toBe('1');
    expect(state.values['animation.playback.fillMode']).toBe('forwards');
    expect(state.values['animation.playback.direction']).toBe('normal');
  });

  it('merges custom overrides into adapter state correctly', () => {
    const customValues = {
      'animation.trigger.type': 'hover',
      'animation.playback.duration': 1500,
    };
    const state = createAnimationPanelAdapterState(customValues);
    expect(state.values['animation.trigger.type']).toBe('hover');
    expect(state.values['animation.playback.duration']).toBe(1500);
    expect(state.values['animation.playback.delay']).toBe(0); // retains default
  });

  it('validates field values via AnimationPanelAdapter helper', () => {
    expect(validateAnimationFieldValue('animation.trigger.type', 'click')).toEqual({ valid: true });
    expect(validateAnimationFieldValue('animation.trigger.type', 'invalid')).toHaveProperty('valid', false);

    expect(validateAnimationFieldValue('animation.playback.duration', 500)).toEqual({ valid: true });
    expect(validateAnimationFieldValue('animation.playback.duration', -100)).toHaveProperty('valid', false);

    expect(validateAnimationFieldValue('unknown.field', 123)).toEqual({ valid: true });
  });
});
