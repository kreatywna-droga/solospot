'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { toDisplayString } from './WidgetShared';

/**
 * RadioWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Radio button group widget. Renders radio inputs for each option.
 * Pure presentation — no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */
const RadioWidget: React.FC<WidgetProps<unknown>> = ({ value, onChange, field }) => {
  const options = field.options ?? [];
  const current = toDisplayString(value);

  return (
    <div className="space-y-1.5">
      {options.map((opt) => {
        const optValue = toDisplayString(opt.value);
        const isSelected = current === optValue;
        return (
          <label
            key={optValue}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
              isSelected
                ? 'bg-violet-500/10 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10'
            }`}
          >
            <input
              type="radio"
              name={`radio-${field.id}`}
              value={optValue}
              checked={isSelected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span
              className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${
                isSelected
                  ? 'border-violet-400 bg-violet-400'
                  : 'border-slate-500 bg-transparent'
              }`}
            />
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
};

export default React.memo(RadioWidget);

