'use client';

import * as React from 'react';
import { InspectorPanelFields } from './InspectorPanelFields';
import type { PanelProps } from './panelTypes';

/**
 * BorderPanel — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Renders border-related fields (style, width, color, radius).
 * Pure presentation — renders exclusively via InspectorPanelFields.
 * No business logic, no switch(type).
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */
export const BorderPanel: React.FC<PanelProps> = ({
  fields,
  values,
  onChange,
  renderField,
}) => {
  return (
    <div className="border-panel">
      <InspectorPanelFields
        fields={fields}
        values={values}
        onChange={onChange}
        renderField={renderField}
      />
    </div>
  );
};

export default React.memo(BorderPanel);
