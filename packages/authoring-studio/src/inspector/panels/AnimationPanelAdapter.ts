/**
 * AnimationPanelAdapter.ts — PM35 Inspector Animation Panel Adapter
 *
 * Adapts Inspector 2.0 property fields to Animation Panel presentation.
 * Pure editing adapter — NO PlaybackController, NO RuntimeScheduler, NO requestAnimationFrame.
 */

import { ANIMATION_PROPERTY_FIELDS } from '../registry/animationPropertyFields';
import type { PropertyFieldDefinition } from '../registry/types';

export interface AnimationPanelAdapterState {
  fields: PropertyFieldDefinition[];
  values: Record<string, unknown>;
}

export function createAnimationPanelAdapterState(
  values: Record<string, unknown> = {}
): AnimationPanelAdapterState {
  const mergedValues: Record<string, unknown> = {};

  for (const field of ANIMATION_PROPERTY_FIELDS) {
    mergedValues[field.id] = values[field.id] ?? field.defaultValue;
  }

  return {
    fields: ANIMATION_PROPERTY_FIELDS,
    values: mergedValues,
  };
}

export function validateAnimationFieldValue(
  fieldId: string,
  value: unknown
): { valid: boolean; error?: string } {
  const field = ANIMATION_PROPERTY_FIELDS.find((f) => f.id === fieldId);
  if (!field) return { valid: true };
  const res = field.validation(value);
  return res.valid ? { valid: true } : { valid: false, error: res.error };
}
