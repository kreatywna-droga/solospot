'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { toDisplayNumber } from './WidgetShared';

/**
 * RangeWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Slider/range input widget. Renders an <input type="range"> with value display.
 * Pure presentation — no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */
const RangeWidget: React.FC<WidgetProps<number>> = ({ value, onChange, field }) => {
  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const step = field.step ?? 1;
  const num = toDisplayNumber(value, min);

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        value={num}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                   [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-violet-500
                   [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <span className="text-xs text-white font-mono w-8 text-right tabular-nums">{num}</span>
    </div>
  );
};

export default React.memo(RangeWidget);

