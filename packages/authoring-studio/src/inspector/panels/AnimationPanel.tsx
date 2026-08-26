'use client';

import * as React from 'react';
import { InspectorPanelFields } from './InspectorPanelFields';
import { WidgetField } from '../widgets/WidgetField';
import type { PanelProps } from './panelTypes';
import type { PropertyFieldDefinition } from '../registry/types';
import { ANIMATION_PROPERTY_FIELDS } from '../registry/animationPropertyFields';
import { propertyFieldRegistry } from '../registry/propertyFieldRegistry';

/**
 * AnimationPanel — Inspector 2.0 Animation Panel (PM35)
 *
 * Renders animation configuration fields (trigger, duration, delay, easing, repeat, fillMode, direction).
 * Pure presentation & editing layer — NO PlaybackController, NO RuntimeScheduler, NO requestAnimationFrame,
 * NO Trigger Engine, NO Runtime Bridge (DECISION-042/043/044/045).
 *
 * Widget resolution is delegated exclusively to the existing `propertyFieldRegistry` (consistent with
 * `DynamicPropertyPanel`). The panel is a pure editing surface — it only maps field definitions to the
 * registry's widgets and forwards changes up via `onChange`.
 */
export const AnimationPanel: React.FC<PanelProps> = ({
  fields = ANIMATION_PROPERTY_FIELDS,
  values,
  onChange,
  renderField,
  breakpoint = 'desktop',
}) => {
  const activeFields = fields && fields.length > 0 ? fields : ANIMATION_PROPERTY_FIELDS;

  /**
   * Default renderField resolves the widget component via the Property Registry.
   * A caller-supplied renderField (e.g. from InspectorShellAdapter) takes precedence.
   */
  const resolveField = renderField
    ? renderField
    : (field: PropertyFieldDefinition, value: unknown, onValChange: (val: unknown) => void) => {
        const Widget = propertyFieldRegistry.getWidget(field.widget);
        if (!Widget) {
          return (
            <span className="text-[11px] text-slate-600 italic">
              Unsupported field type: {field.widget}
            </span>
          );
        }
        return (
          <WidgetField field={field}>
            <Widget
              value={value}
              onChange={onValChange}
              field={field}
              breakpoint={breakpoint}
            />
          </WidgetField>
        );
      };

  return (
    <div className="animation-panel" data-testid="inspector-animation-panel">
      <InspectorPanelFields
        fields={activeFields}
        values={values}
        onChange={onChange}
        renderField={resolveField}
      />
    </div>
  );
};

export default React.memo(AnimationPanel);
