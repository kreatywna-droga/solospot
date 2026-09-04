'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { inputBaseClass, toDisplayNumber } from './WidgetShared';

/**
 * NumberWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Numeric input widget. Renders an <input type="number">.
 * When the field declares a bounded range (min & max), an additional slider
 * is rendered under the input — both controls write the SAME document value.
 * Pure presentation — no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */
const NumberWidget: React.FC<WidgetProps<number | undefined>> = ({ value, onChange, field }) => {
  const num = toDisplayNumber(value);
  const hasRange = field.min !== undefined && field.max !== undefined;

  return (
    <div className="relative">
      <input
        type="number"
        value={num}
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === '' ? undefined : parseFloat(raw));
        }}
        className={`${inputBaseClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />
      {field.unit && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
          {field.unit}
        </span>
      )}
      {hasRange && (
        <input
          type="range"
          value={Number.isFinite(num) ? Math.min(field.max!, Math.max(field.min!, num)) : field.min!}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="mt-1.5 w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                     [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-violet-500
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
        />
      )}
    </div>
  );
};

export default React.memo(NumberWidget);

