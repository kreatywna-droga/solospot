'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { inputBaseClass, toDisplayString } from './WidgetShared';

/**
 * TextWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Single-line text input widget. Renders an <input type="text">.
 * Pure presentation — no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */
const TextWidget: React.FC<WidgetProps<string>> = ({ value, onChange, field }) => {
  return (
    <input
      type="text"
      value={toDisplayString(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={inputBaseClass}
    />
  );
};

export default React.memo(TextWidget);

