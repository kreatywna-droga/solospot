/**
 * ComponentSlotComposition.ts — Sprint S32 Component Slot Composition & Validation Engine
 *
 * Enforces slot composition rules (allowed node types, min/max children limits) for child nodes
 * assigned to component slots.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { SectionNode } from '../../../builder-core/src/BuilderDocument';
import type { ComponentSlotDefinition } from './ComponentPresetModel';
import { ComponentPresetRegistry } from './ComponentPresetRegistry';

export interface SlotValidationResult {
  readonly valid: boolean;
  readonly reason?: string;
  readonly slotDefinition?: ComponentSlotDefinition;
}

export function getSlotChildren(parent: SectionNode, slotName: string): SectionNode[] {
  if (!parent.children) return [];
  return parent.children.filter((child) => child.props?.slotName === slotName);
}

export function validateSlotChildInsertion(
  parent: SectionNode,
  slotName: string,
  childNodeType: string,
  registry: ComponentPresetRegistry = new ComponentPresetRegistry()
): SlotValidationResult {
  const componentId = parent.props?.componentId as string;
  if (!componentId) {
    return { valid: true }; // Free-form parent node, no slot restrictions
  }

  const preset = registry.getPreset(componentId);
  if (!preset) {
    return { valid: true };
  }

  const slotDef = preset.slots.find((s) => s.name === slotName);
  if (!slotDef) {
    return { valid: false, reason: `Slot '${slotName}' does not exist on component preset '${componentId}'` };
  }

  // Check allowed node types
  if (slotDef.allowedTypes.length > 0 && !slotDef.allowedTypes.includes(childNodeType)) {
    return {
      valid: false,
      reason: `Node type '${childNodeType}' is not allowed in slot '${slotName}'. Allowed types: [${slotDef.allowedTypes.join(', ')}]`,
      slotDefinition: slotDef,
    };
  }

  // Check max children constraint
  const currentSlotChildren = getSlotChildren(parent, slotName);
  if (slotDef.maxChildren !== undefined && currentSlotChildren.length >= slotDef.maxChildren) {
    return {
      valid: false,
      reason: `Slot '${slotName}' max child count limit (${slotDef.maxChildren}) reached`,
      slotDefinition: slotDef,
    };
  }

  return { valid: true, slotDefinition: slotDef };
}

export function validateSlotChildRemoval(
  parent: SectionNode,
  slotName: string,
  registry: ComponentPresetRegistry = new ComponentPresetRegistry()
): SlotValidationResult {
  const componentId = parent.props?.componentId as string;
  if (!componentId) {
    return { valid: true };
  }

  const preset = registry.getPreset(componentId);
  if (!preset) {
    return { valid: true };
  }

  const slotDef = preset.slots.find((s) => s.name === slotName);
  if (!slotDef) {
    return { valid: true };
  }

  const currentSlotChildren = getSlotChildren(parent, slotName);
  if (slotDef.minChildren !== undefined && currentSlotChildren.length <= slotDef.minChildren) {
    return {
      valid: false,
      reason: `Cannot remove child from slot '${slotName}': minimum child count (${slotDef.minChildren}) required`,
      slotDefinition: slotDef,
    };
  }

  return { valid: true, slotDefinition: slotDef };
}
