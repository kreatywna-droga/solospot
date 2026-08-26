'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { inputBaseClass, toDisplayString } from './WidgetShared';

/**
 * ColorWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Color picker widget. Renders a native color input + hex text field.
 * Pure presentation — no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */
const ColorWidget: React.FC<WidgetProps<string>> = ({ value, onChange }) => {
  const colorVal = toDisplayString(value) || '#6366f1';

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={colorVal}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg border border-white/10 cursor-pointer bg-transparent flex-shrink-0"
      />
      <input
        type="text"
        value={colorVal}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBaseClass} font-mono text-xs`}
      />
    </div>
  );
};

export default React.memo(ColorWidget);

