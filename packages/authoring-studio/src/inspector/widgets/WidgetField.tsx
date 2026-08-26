'use client';

import * as React from 'react';
import type { PropertyFieldDefinition } from '../registry/types';
import { labelClass, inlineLabelClass, descriptionClass } from './WidgetShared';

/**
 * WidgetField — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Presentation-only wrapper that renders the field label, description, and
 * required indicator around a widget. No business logic — controlled entirely
 * through the `field` definition supplied by Agent 1's Registry.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

export interface WidgetFieldProps {
  /** Property field definition from the Registry (Agent 1). */
  field: PropertyFieldDefinition;
  /** The widget's rendered control. */
  children: React.ReactNode;
  /** When true, renders label inline with the control (e.g. toggles). */
  inline?: boolean;
}

export const WidgetField: React.FC<WidgetFieldProps> = ({ field, children, inline }) => {
  const className = inline ? inlineLabelClass : labelClass;

  return (
    <div className="inspector-widget-field">
<label className={className}>
        {field.label}
      </label>
      <div className={inline ? 'flex items-center justify-between gap-2' : undefined}>
        {children}
      </div>
      {field.description && (
        <p className={descriptionClass}>{field.description}</p>
      )}
    </div>
  );
};
