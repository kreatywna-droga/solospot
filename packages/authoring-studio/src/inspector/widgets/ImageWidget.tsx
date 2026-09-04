'use client';

import * as React from 'react';
import type { WidgetProps } from '../registry/types';
import { inputBaseClass, labelClass } from './WidgetShared';

/**
 * ImageWidget — Sprint 7.1 Inspector 2.0 UI Layer
 *
 * Image URL/asset picker widget.
 * Pure presentation — no validation, no business logic.
 *
 * @agent Agent 3 — Supporting Implementation Engineer
 * @status READY FOR INTEGRATION BY AGENT 1
 */

interface ImageShape {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  objectFit?: string;
}

const defaultImage: ImageShape = {
  src: '',
  alt: '',
  width: undefined,
  height: undefined,
  objectFit: 'cover',
};

function parseImage(value: unknown): ImageShape {
  // Flat string value (e.g. props.src = "https://...") — treat as the source URL
  if (typeof value === 'string') {
    return { ...defaultImage, src: value }
  }
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    return {
      src: typeof v.src === 'string' ? v.src : defaultImage.src,
      alt: typeof v.alt === 'string' ? v.alt : defaultImage.alt,
      width: typeof v.width === 'number' ? v.width : defaultImage.width,
      height: typeof v.height === 'number' ? v.height : defaultImage.height,
      objectFit: typeof v.objectFit === 'string' ? v.objectFit : defaultImage.objectFit,
    };
  }
  return defaultImage;
}

const FIT_OPTIONS = [
  { label: 'Cover', value: 'cover' },
  { label: 'Contain', value: 'contain' },
  { label: 'Fill', value: 'fill' },
  { label: 'None', value: 'none' },
  { label: 'Scale-down', value: 'scale-down' },
];

const ImageWidget: React.FC<WidgetProps<ImageShape | string>> = ({ value, onChange }) => {
  const isFlatString = typeof value === 'string'
  const img = parseImage(value)

  // When the document value is a flat string (props.src), write back a flat
  // string so the canvas renderer contract (props.src: string) stays intact.
  const update = (partial: Partial<ImageShape>) => {
    const next: ImageShape = { ...img, ...partial }
    onChange((isFlatString ? next.src : next) as ImageShape)
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      {img.src && (
        <div className="w-full h-20 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
          <img
            src={img.src}
            alt={img.alt || 'Preview'}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* URL */}
      <div>
        <label className={labelClass}>Source URL</label>
        <input
          type="text"
          value={img.src || ''}
          onChange={(e) => update({ src: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className={inputBaseClass}
        />
      </div>

      {/* Alt text */}
      <div>
        <label className={labelClass}>Alt text</label>
        <input
          type="text"
          value={img.alt || ''}
          onChange={(e) => update({ alt: e.target.value })}
          placeholder="Descriptive text"
          className={inputBaseClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Width */}
        <div>
          <label className={labelClass}>Width</label>
          <input
            type="number"
            value={img.width ?? ''}
            min={0}
            max={9999}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              update({ width: Number.isNaN(val) ? undefined : val });
            }}
            placeholder="Auto"
            className={`${inputBaseClass} text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        </div>

        {/* Height */}
        <div>
          <label className={labelClass}>Height</label>
          <input
            type="number"
            value={img.height ?? ''}
            min={0}
            max={9999}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              update({ height: Number.isNaN(val) ? undefined : val });
            }}
            placeholder="Auto"
            className={`${inputBaseClass} text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        </div>
      </div>

      {/* Object fit */}
      <div>
        <label className={labelClass}>Fit</label>
        <select
          value={img.objectFit || 'cover'}
          onChange={(e) => update({ objectFit: e.target.value })}
          className="w-full bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all"
        >
          {FIT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default React.memo(ImageWidget);

