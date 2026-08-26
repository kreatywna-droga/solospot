'use client';

import * as React from 'react';
import { InspectorPanelFields } from './InspectorPanelFields';
import type { PanelProps } from './panelTypes';

/**
 * AdvancedPanel — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Renders advanced fields (custom CSS, z-index, aria, etc.).
 * Pure presentation — renders exclusively via InspectorPanelFields.
 * No business logic, no switch(type).
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */
export const AdvancedPanel: React.FC<PanelProps> = ({
  fields,
  values,
  onChange,
  renderField,
}) => {
  return (
    <div className="advanced-panel">
      <InspectorPanelFields
        fields={fields}
        values={values}
        onChange={onChange}
        renderField={renderField}
      />
    </div>
  );
};

export default React.memo(AdvancedPanel);
