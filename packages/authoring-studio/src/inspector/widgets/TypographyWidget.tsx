'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { inputBaseClass, labelClass } from './WidgetShared';

/**
 * TypographyWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Typography editor widget for font-family, size, weight, line-height, etc.
 * Pure presentation — no validation, no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

interface TypographyShape {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: string;
  textTransform?: string;
}

const defaultTypography: TypographyShape = {
  fontFamily: '',
  fontSize: 16,
  fontWeight: '400',
  lineHeight: 1.5,
  letterSpacing: 0,
  textAlign: 'left',
  textTransform: 'none',
};

function parseTypography(value: unknown): TypographyShape {
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    return {
      fontFamily: typeof v.fontFamily === 'string' ? v.fontFamily : defaultTypography.fontFamily,
      fontSize: typeof v.fontSize === 'number' ? v.fontSize : defaultTypography.fontSize,
      fontWeight: typeof v.fontWeight === 'string' ? v.fontWeight : defaultTypography.fontWeight,
      lineHeight: typeof v.lineHeight === 'number' ? v.lineHeight : defaultTypography.lineHeight,
      letterSpacing: typeof v.letterSpacing === 'number' ? v.letterSpacing : defaultTypography.letterSpacing,
      textAlign: typeof v.textAlign === 'string' ? v.textAlign : defaultTypography.textAlign,
      textTransform: typeof v.textTransform === 'string' ? v.textTransform : defaultTypography.textTransform,
    };
  }
  return defaultTypography;
}

const WEIGHT_OPTIONS = [
  { label: 'Thin (100)', value: '100' },
  { label: 'Light (300)', value: '300' },
  { label: 'Regular (400)', value: '400' },
  { label: 'Medium (500)', value: '500' },
  { label: 'Semi Bold (600)', value: '600' },
  { label: 'Bold (700)', value: '700' },
  { label: 'Black (900)', value: '900' },
];

const ALIGN_OPTIONS = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
  { label: 'Justify', value: 'justify' },
];

const TRANSFORM_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Uppercase', value: 'uppercase' },
  { label: 'Lowercase', value: 'lowercase' },
  { label: 'Capitalize', value: 'capitalize' },
];

const TypographyWidget: React.FC<WidgetProps<TypographyShape>> = ({ value, onChange }) => {
  const typo = parseTypography(value);

  const update = (partial: Partial<TypographyShape>) => onChange({ ...typo, ...partial });

  return (
    <div className="space-y-3">
      {/* Font Family */}
      <div>
        <label className={labelClass}>Font family</label>
        <input
          type="text"
          value={typo.fontFamily || ''}
          onChange={(e) => update({ fontFamily: e.target.value })}
          placeholder="Inter, sans-serif"
          className={inputBaseClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Font Size */}
        <div>
          <label className={labelClass}>Size</label>
          <input
            type="number"
            value={typo.fontSize ?? 16}
            min={8}
            max={200}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!Number.isNaN(val) && val >= 8 && val <= 200) update({ fontSize: val });
            }}
            className={`${inputBaseClass} text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        </div>

        {/* Font Weight */}
        <div>
          <label className={labelClass}>Weight</label>
          <select
            value={typo.fontWeight || '400'}
            onChange={(e) => update({ fontWeight: e.target.value })}
            className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
          >
            {WEIGHT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Line Height */}
        <div>
          <label className={labelClass}>Line height</label>
          <input
            type="number"
            value={typo.lineHeight ?? 1.5}
            min={0.5}
            max={4}
            step={0.1}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!Number.isNaN(val)) update({ lineHeight: Math.max(0.5, Math.min(4, val)) });
            }}
            className={`${inputBaseClass} text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        </div>

        {/* Letter Spacing */}
        <div>
          <label className={labelClass}>Letter spacing</label>
          <input
            type="number"
            value={typo.letterSpacing ?? 0}
            min={-10}
            max={20}
            step={0.5}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!Number.isNaN(val)) update({ letterSpacing: Math.max(-10, Math.min(20, val)) });
            }}
            className={`${inputBaseClass} text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Text Align */}
        <div>
          <label className={labelClass}>Align</label>
          <select
            value={typo.textAlign || 'left'}
            onChange={(e) => update({ textAlign: e.target.value })}
            className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
          >
            {ALIGN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Text Transform */}
        <div>
          <label className={labelClass}>Transform</label>
          <select
            value={typo.textTransform || 'none'}
            onChange={(e) => update({ textTransform: e.target.value })}
            className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
          >
            {TRANSFORM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TypographyWidget);

