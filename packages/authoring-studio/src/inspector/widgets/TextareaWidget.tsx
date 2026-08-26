'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { inputBaseClass, toDisplayString } from './WidgetShared';

/**
 * TextareaWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Multi-line text input widget. Renders a <textarea>.
 * Pure presentation — no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */
const TextareaWidget: React.FC<WidgetProps<string>> = ({ value, onChange, field }) => {
  return (
    <textarea
      value={toDisplayString(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      rows={3}
      className={`${inputBaseClass} resize-none`}
    />
  );
};

export default React.memo(TextareaWidget);

