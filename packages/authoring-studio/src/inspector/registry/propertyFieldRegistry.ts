/**
 * propertyFieldRegistry — Sprint 7 Recovery (P1)
 *
 * Default singleton instance of PropertyRegistry.
 * Single source of truth for field definitions and widget bindings.
 *
 * Registers the 14 widgets prepared by Agent 3 (Sprint 7.1 UI layer).
 * This is the ONLY place where widgets are bound to the registry.
 *
 * @agent Agent 1 — Inspector Core Engineer (Sprint 7 Recovery)
 * @status IN PROGRESS — READY FOR PM26 FINAL VERIFICATION
 */

import { createPropertyFieldRegistry } from './createPropertyFieldRegistry';
import type { PropertyRegistry } from './PropertyRegistry';
import type { WidgetComponent, WidgetType } from './types';

// Agent 3 widgets — pure presentation components implementing WidgetComponent.
import TextWidget from '../widgets/TextWidget';
import TextareaWidget from '../widgets/TextareaWidget';
import NumberWidget from '../widgets/NumberWidget';
import RangeWidget from '../widgets/RangeWidget';
import ColorWidget from '../widgets/ColorWidget';
import SelectWidget from '../widgets/SelectWidget';
import BooleanWidget from '../widgets/BooleanWidget';
import RadioWidget from '../widgets/RadioWidget';
import SpacingWidget from '../widgets/SpacingWidget';
import BorderWidget from '../widgets/BorderWidget';
import ShadowWidget from '../widgets/ShadowWidget';
import TypographyWidget from '../widgets/TypographyWidget';
import LinkWidget from '../widgets/LinkWidget';
import ImageWidget from '../widgets/ImageWidget';

import { ANIMATION_PROPERTY_FIELDS } from './animationPropertyFields';

/**
 * Create the singleton registry with all 14 widgets and animation fields registered.
 */
function createRegistry(): PropertyRegistry {
  const registry = createPropertyFieldRegistry();

  for (const field of ANIMATION_PROPERTY_FIELDS) {
    registry.registerField(field);
  }

const widgetBindings: ReadonlyArray<[WidgetType, WidgetComponent]> = [
    // Cast to WidgetComponent: the registry stores polymorphic widgets
    // typed as WidgetProps<unknown>. Each widget's narrower generic is
    // resolved at render time based on the field definition.
    ['text', TextWidget as WidgetComponent],
    ['textarea', TextareaWidget as WidgetComponent],
    ['number', NumberWidget as WidgetComponent],
    ['range', RangeWidget as WidgetComponent],
    ['color', ColorWidget as WidgetComponent],
    ['select', SelectWidget as WidgetComponent],
    ['boolean', BooleanWidget as WidgetComponent],
    ['radio', RadioWidget as WidgetComponent],
    ['spacing', SpacingWidget as WidgetComponent],
    ['border', BorderWidget as WidgetComponent],
    ['shadow', ShadowWidget as WidgetComponent],
    ['typography', TypographyWidget as WidgetComponent],
    ['link', LinkWidget as WidgetComponent],
    ['image', ImageWidget as WidgetComponent],
  ];

  for (const [type, widget] of widgetBindings) {
    registry.registerWidget(type, widget);
  }

  return registry;
}

export const propertyFieldRegistry: PropertyRegistry = createRegistry();
