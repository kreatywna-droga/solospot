'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { toDisplayString } from './WidgetShared';

/**
 * SelectWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Dropdown select widget. Renders a <select> with options from field.options.
 * Pure presentation — no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */
const SelectWidget: React.FC<WidgetProps<string>> = ({ value, onChange, field }) => {
  return (
    <select
      value={toDisplayString(value)}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                 focus:outline-none focus:border-violet-500/50 transition-all"
    >
      <option value="">— Select —</option>
      {(field.options ?? []).map((opt) => (
        <option key={String(opt.value)} value={String(opt.value)}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default React.memo(SelectWidget);

