'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { inputBaseClass, labelClass } from './WidgetShared';

/**
 * ShadowWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Box-shadow editor widget for offset/blur/spread/color.
 * Pure presentation — no validation, no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

interface ShadowShape {
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  spread?: number;
  color?: string;
  inset?: boolean;
}

const defaultShadow: ShadowShape = {
  offsetX: 0,
  offsetY: 4,
  blur: 6,
  spread: 0,
  color: '#00000040',
  inset: false,
};

function parseShadow(value: unknown): ShadowShape {
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    return {
      offsetX: typeof v.offsetX === 'number' ? v.offsetX : defaultShadow.offsetX,
      offsetY: typeof v.offsetY === 'number' ? v.offsetY : defaultShadow.offsetY,
      blur: typeof v.blur === 'number' ? v.blur : defaultShadow.blur,
      spread: typeof v.spread === 'number' ? v.spread : defaultShadow.spread,
      color: typeof v.color === 'string' ? v.color : defaultShadow.color,
      inset: typeof v.inset === 'boolean' ? v.inset : defaultShadow.inset,
    };
  }
  return defaultShadow;
}

const ShadowWidget: React.FC<WidgetProps<ShadowShape>> = ({ value, onChange }) => {
  const shadow = parseShadow(value);

  const update = (partial: Partial<ShadowShape>) => onChange({ ...shadow, ...partial });

  const fields = [
    { key: 'offsetX' as const, label: 'X', min: -200, max: 200 },
    { key: 'offsetY' as const, label: 'Y', min: -200, max: 200 },
    { key: 'blur' as const, label: 'Blur', min: 0, max: 200 },
    { key: 'spread' as const, label: 'Spread', min: -100, max: 100 },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1 block">
              {f.label}
            </label>
            <input
              type="number"
              value={shadow[f.key] ?? 0}
              min={f.min}
              max={f.max}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!Number.isNaN(val)) update({ [f.key]: Math.max(f.min, Math.min(f.max, val)) });
              }}
              className={`${inputBaseClass} text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            />
          </div>
        ))}
      </div>

      {/* Color */}
      <div>
        <label className={labelClass}>Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={shadow.color || '#000000'}
            onChange={(e) => update({ color: e.target.value })}
            className="w-9 h-9 rounded-lg border border-white/10 cursor-pointer bg-transparent flex-shrink-0"
          />
          <input
            type="text"
            value={shadow.color || ''}
            onChange={(e) => update({ color: e.target.value })}
            className={`${inputBaseClass} font-mono text-xs`}
          />
        </div>
      </div>

      {/* Inset toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <button
          onClick={() => update({ inset: !shadow.inset })}
          className={`relative w-10 h-5 rounded-full transition-all duration-200 flex-shrink-0 ${
            shadow.inset ? 'bg-violet-500' : 'bg-white/10'
          }`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            shadow.inset ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </button>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Inset</span>
      </label>
    </div>
  );
};

export default React.memo(ShadowWidget);

