'use client';

import * as React from 'react';
import { InspectorPanelFields } from './InspectorPanelFields';
import type { PanelProps } from './panelTypes';

/**
 * LayoutPanel — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Renders layout-related fields (display, flex, grid, position, size).
 * Pure presentation — renders exclusively via InspectorPanelFields.
 * No business logic, no switch(type).
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */
export const LayoutPanel: React.FC<PanelProps> = ({
  fields,
  values,
  onChange,
  renderField,
}) => {
  return (
    <div className="layout-panel">
      <InspectorPanelFields
        fields={fields}
        values={values}
        onChange={onChange}
        renderField={renderField}
      />
    </div>
  );
};

export default React.memo(LayoutPanel);
