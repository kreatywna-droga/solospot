'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { toDisplayBoolean } from './WidgetShared';

/**
 * BooleanWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Toggle/switch widget. Renders a toggle button.
 * Pure presentation — no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */
const BooleanWidget: React.FC<WidgetProps<boolean>> = ({ value, onChange }) => {
  const isOn = toDisplayBoolean(value);

  return (
    <button
      onClick={() => onChange(!isOn)}
      className={`relative w-10 h-5 rounded-full transition-all duration-200 flex-shrink-0 ${
        isOn ? 'bg-violet-500' : 'bg-white/10'
      }`}
      role="switch"
      aria-checked={isOn}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          isOn ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
};

export default React.memo(BooleanWidget);

