'use client';

/**
 * ColorControl — professional solid-colour control (ONE system, no preset swatch grid).
 *
 * Row: visual swatch (opens native picker) + exact HEX/rgba text field.
 * Used for every real CSS `color` property (text, background solid, border…).
 * Gradient-capable surfaces use GradientControl for background images instead.
 */

import React, { useMemo } from 'react';
import { inputCls } from './inputStyles';

export interface ColorControlProps {
  value?: string;
  onChange: (v: string) => void;
  /** Compact layout for toolbars (smaller swatch, shorter field) */
  compact?: boolean;
  placeholder?: string;
  title?: string;
}

/** Normalize an arbitrary colour string to #rrggbb for input[type=color]. */
export function toHexForPicker(value: string | undefined): string {
  if (!value || value === 'transparent') return '#ffffff';
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{8}$/.test(value)) return `#${value.slice(1, 7)}`;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  const rgba = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgba) {
    const h = (n: string) => Math.min(255, Math.max(0, parseInt(n, 10))).toString(16).padStart(2, '0');
    return `#${h(rgba[1])}${h(rgba[2])}${h(rgba[3])}`;
  }
  return '#ffffff';
}

export const ColorControl: React.FC<ColorControlProps> = ({
  value,
  onChange,
  compact = false,
  placeholder = '#ffffff, transparent, rgba(…)',
  title,
}) => {
  const hexVal = useMemo(() => toHexForPicker(value), [value]);
  const swatchSize = compact ? 'w-5 h-5 rounded-md' : 'w-7 h-7 rounded-lg';

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-1.5'} w-full`}>
      <div
        className={`${swatchSize} border border-white/20 flex-shrink-0 cursor-pointer relative overflow-hidden shadow-inner`}
        style={{ background: value || 'transparent' }}
        title={title || 'Kliknij, aby otworzyć próbnik kolorów'}
      >
        <input
          type="color"
          value={hexVal}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          aria-label={title || 'Próbnik kolorów'}
        />
      </div>
      {!compact && (
        <input
          type="text"
          value={value || ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} font-mono text-xs`}
          aria-label="Dokładna wartość koloru (HEX)"
        />
      )}
    </div>
  );
};

export default ColorControl;
