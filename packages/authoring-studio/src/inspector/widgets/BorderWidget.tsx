'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { inputBaseClass, labelClass } from './WidgetShared';

/**
 * BorderWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Border editor widget for style/width/color.
 * Pure presentation — no validation, no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

const STYLE_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
  { label: 'Dotted', value: 'dotted' },
];

interface BorderShape {
  borderStyle?: string;
  borderWidth?: { value: number; unit: string };
  borderColor?: string;
}

const defaultBorder: BorderShape = {
  borderStyle: '',
  borderWidth: { value: 1, unit: 'px' },
  borderColor: '#000000',
};

function parseBorder(value: unknown): BorderShape {
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    return {
      borderStyle: typeof v.borderStyle === 'string' ? v.borderStyle : defaultBorder.borderStyle,
      borderWidth: v.borderWidth && typeof v.borderWidth === 'object'
        ? { value: typeof (v.borderWidth as Record<string, unknown>).value === 'number' ? (v.borderWidth as Record<string, unknown>).value as number : 1, unit: 'px' }
        : defaultBorder.borderWidth,
      borderColor: typeof v.borderColor === 'string' ? v.borderColor : defaultBorder.borderColor,
    };
  }
  return defaultBorder;
}

const BorderWidget: React.FC<WidgetProps<BorderShape>> = ({ value, onChange }) => {
const border = parseBorder(value);
  const bw: { value: number; unit: string } = border.borderWidth ?? defaultBorder.borderWidth!;

  return (
    <div className="space-y-3">
      {/* Style */}
      <div>
        <label className={labelClass}>Style</label>
        <select
          value={border.borderStyle ?? ''}
          onChange={(e) => onChange({ ...border, borderStyle: e.target.value })}
          className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
        >
          {STYLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Width */}
      <div>
        <label className={labelClass}>Width</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={bw.value}
            min={0}
            max={100}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!Number.isNaN(val)) {
                onChange({ ...border, borderWidth: { value: Math.max(0, Math.min(100, val)), unit: 'px' } });
              }
            }}
            className={`${inputBaseClass} w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
          <span className="text-xs text-slate-500">{bw.unit}</span>
        </div>
      </div>

      {/* Color */}
      <div>
        <label className={labelClass}>Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={border.borderColor || '#000000'}
            onChange={(e) => onChange({ ...border, borderColor: e.target.value })}
            className="w-9 h-9 rounded-lg border border-white/10 cursor-pointer bg-transparent flex-shrink-0"
          />
          <input
            type="text"
            value={border.borderColor || ''}
            onChange={(e) => onChange({ ...border, borderColor: e.target.value })}
            className={`${inputBaseClass} font-mono text-xs`}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(BorderWidget);

