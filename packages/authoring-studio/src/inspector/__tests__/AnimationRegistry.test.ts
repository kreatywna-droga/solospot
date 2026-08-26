import { describe, it, expect } from 'vitest';
import { ANIMATION_PROPERTY_FIELDS } from '../registry/animationPropertyFields';

describe('AnimationRegistry (PM35)', () => {
  it('defines all required schema fields for animation configuration', () => {
    const fieldIds = ANIMATION_PROPERTY_FIELDS.map((f) => f.id);
    expect(fieldIds).toContain('animation.trigger.type');
    expect(fieldIds).toContain('animation.trigger.threshold');
    expect(fieldIds).toContain('animation.playback.duration');
    expect(fieldIds).toContain('animation.playback.delay');
    expect(fieldIds).toContain('animation.playback.easing');
    expect(fieldIds).toContain('animation.playback.repeatCount');
    expect(fieldIds).toContain('animation.playback.fillMode');
    expect(fieldIds).toContain('animation.playback.direction');
  });

  it('assigns all fields to category "animation"', () => {
    for (const field of ANIMATION_PROPERTY_FIELDS) {
      expect(field.category).toBe('animation');
    }
  });

  it('provides valid validation callbacks for all registered fields', () => {
    for (const field of ANIMATION_PROPERTY_FIELDS) {
      expect(typeof field.validation).toBe('function');
      const defaultValidation = field.validation(field.defaultValue);
      expect(defaultValidation.valid).toBe(true);
    }
  });

  it('correctly validates trigger types', () => {
    const triggerField = ANIMATION_PROPERTY_FIELDS.find((f) => f.id === 'animation.trigger.type')!;
    expect(triggerField.validation('onLoad').valid).toBe(true);
    expect(triggerField.validation('inView').valid).toBe(true);
    expect(triggerField.validation('hover').valid).toBe(true);
    expect(triggerField.validation('click').valid).toBe(true);
    expect(triggerField.validation('scroll').valid).toBe(true);
    expect(triggerField.validation('unknown').valid).toBe(false);
  });

  it('correctly validates duration and delay bounds', () => {
    const durationField = ANIMATION_PROPERTY_FIELDS.find((f) => f.id === 'animation.playback.duration')!;
    expect(durationField.validation(100).valid).toBe(true);
    expect(durationField.validation(0).valid).toBe(false);
    expect(durationField.validation('abc').valid).toBe(false);

    const delayField = ANIMATION_PROPERTY_FIELDS.find((f) => f.id === 'animation.playback.delay')!;
    expect(delayField.validation(0).valid).toBe(true);
    expect(delayField.validation(-10).valid).toBe(false);
  });
});
