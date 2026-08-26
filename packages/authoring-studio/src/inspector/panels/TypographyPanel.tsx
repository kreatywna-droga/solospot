'use client';

import * as React from 'react';
import { InspectorPanelFields } from './InspectorPanelFields';
import type { PanelProps } from './panelTypes';

/**
 * TypographyPanel — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Renders typography-related fields (font, size, weight, etc.).
 * Pure presentation — renders exclusively via InspectorPanelFields.
 * No business logic, no switch(type).
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */
export const TypographyPanel: React.FC<PanelProps> = ({
  fields,
  values,
  onChange,
  renderField,
}) => {
  return (
    <div className="typography-panel">
      <InspectorPanelFields
        fields={fields}
        values={values}
        onChange={onChange}
        renderField={renderField}
      />
    </div>
  );
};

export default React.memo(TypographyPanel);
