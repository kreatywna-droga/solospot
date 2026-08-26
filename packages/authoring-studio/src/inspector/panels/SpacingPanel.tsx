'use client';

import * as React from 'react';
import { InspectorPanelFields } from './InspectorPanelFields';
import type { PanelProps } from './panelTypes';

/**
 * SpacingPanel — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Renders spacing-related fields (padding, margin, gap).
 * Pure presentation — renders exclusively via InspectorPanelFields.
 * No business logic, no switch(type).
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */
export const SpacingPanel: React.FC<PanelProps> = ({
  fields,
  values,
  onChange,
  renderField,
}) => {
  return (
    <div className="spacing-panel">
      <InspectorPanelFields
        fields={fields}
        values={values}
        onChange={onChange}
        renderField={renderField}
      />
    </div>
  );
};

export default React.memo(SpacingPanel);
