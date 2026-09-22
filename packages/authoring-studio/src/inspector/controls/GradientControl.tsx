'use client';

/**
 * GradientControl — professional Linear Gradient editor.
 *
 * - Live preview strip (canonical CSS output)
 * - Angle: SmoothSlider (pointerup commit) + exact degree input (blur/Enter commit)
 * - Stops: ≥2, each with colour (ColorControl compact) + position % + remove
 * - Add stop
 * - Emits a valid CSS linear-gradient(...) string via onChange
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import {
  buildLinearGradient,
  parseLinearGradientOrDefault,
  type LinearGradientValue,
  type GradientStop,
} from './gradient';
import { SmoothSlider } from './SmoothSlider';
import { ColorControl } from './ColorControl';
import { inputCls } from './inputStyles';

export interface GradientControlProps {
  /** Current CSS value (linear-gradient(...) string); parsed or defaulted */
  value?: string;
  /** Commits the full CSS gradient string to BuilderDocument */
  onChange: (css: string) => void;
  /** Optional live DOM preview during slider drag (no re-render) */
  onLivePreview?: (css: string) => void;
  /** Show a clear button (removes gradient → onChange('')) */
  allowClear?: boolean;
}

export const GradientControl: React.FC<GradientControlProps> = ({
  value,
  onChange,
  onLivePreview,
  allowClear = true,
}) => {
  const gradient = useMemo(() => parseLinearGradientOrDefault(value), [value]);
  const [angleDraft, setAngleDraft] = useState(String(gradient.angle));

  useEffect(() => {
    setAngleDraft(String(gradient.angle));
  }, [gradient.angle]);

  const emit = useCallback(
    (next: LinearGradientValue) => {
      const css = buildLinearGradient(next);
      onChange(css);
      return css;
    },
    [onChange],
  );

  const preview = useCallback(
    (next: LinearGradientValue) => {
      onLivePreview?.(buildLinearGradient(next));
    },
    [onLivePreview],
  );

  const handleAngleChange = (deg: number) => {
    const angle = ((Math.round(deg) % 360) + 360) % 360;
    setAngleDraft(String(angle));
    emit({ ...gradient, angle });
  };

  const handleAngleLivePreview = (deg: number) => {
    const angle = ((Math.round(deg) % 360) + 360) % 360;
    setAngleDraft(String(angle));
    preview({ ...gradient, angle });
  };

  const handleAngleDraftCommit = () => {
    const n = parseInt(angleDraft, 10);
    if (Number.isNaN(n)) {
      setAngleDraft(String(gradient.angle));
      return;
    }
    handleAngleChange(n);
  };

  const updateStop = (index: number, patch: Partial<GradientStop>, commit: boolean) => {
    const stops = gradient.stops.map((s, i) => (i === index ? { ...s, ...patch } : s));
    const next = { ...gradient, stops };
    if (commit) emit(next);
    else preview(next);
  };

  const addStop = () => {
    const stops = [...gradient.stops];
    const mid = stops.length >= 2
      ? Math.round((stops[stops.length - 1].position + stops[0].position) / 2)
      : 50;
    stops.push({ color: '#ffffff', position: Math.min(100, Math.max(0, mid)) });
    emit({ ...gradient, stops });
  };

  const removeStop = (index: number) => {
    if (gradient.stops.length <= 2) return;
    emit({ ...gradient, stops: gradient.stops.filter((_, i) => i !== index) });
  };

  const cssPreview = useMemo(() => buildLinearGradient(gradient), [gradient]);

  return (
    <div className="space-y-2 w-full" data-testid="gradient-control">
      {/* Live preview strip */}
      <div
        className="w-full h-7 rounded-lg border border-white/15 shadow-inner"
        style={{ background: cssPreview }}
        title={cssPreview}
        data-testid="gradient-preview"
      />

      {/* Angle */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500 font-medium">Kąt</span>
          <div className="flex items-center gap-1 bg-[#18181B] border border-white/10 rounded px-1.5 py-0.5">
            <input
              type="number"
              min={0}
              max={360}
              value={angleDraft}
              onChange={(e) => setAngleDraft(e.target.value)}
              onBlur={handleAngleDraftCommit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAngleDraftCommit();
                }
              }}
              className="w-10 bg-transparent text-right font-mono text-white text-[11px] focus:outline-none"
              aria-label="Kąt gradientu (stopnie)"
            />
            <span className="text-[10px] text-slate-400">°</span>
          </div>
        </div>
        <SmoothSlider
          min={0}
          max={360}
          step={1}
          value={gradient.angle}
          onChange={handleAngleChange}
          onLivePreview={handleAngleLivePreview}
          unit="°"
        />
      </div>

      {/* Stops */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Przystanki (stops)</span>
          <button
            type="button"
            onClick={addStop}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#D9A86C]/15 text-[#F2C27F] border border-[#D9A86C]/30 hover:bg-[#D9A86C]/30 transition-colors"
            data-testid="gradient-add-stop"
          >
            <Plus className="w-3 h-3" />
            Dodaj
          </button>
        </div>

        {gradient.stops.map((stop, i) => (
          <div key={i} className="flex items-center gap-1.5" data-testid={`gradient-stop-${i}`}>
            <ColorControl compact value={stop.color} onChange={(c) => updateStop(i, { color: c }, true)} title={`Kolor stopu ${i + 1}`} />
            <input
              type="number"
              min={0}
              max={100}
              value={stop.position}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                if (!Number.isNaN(n)) updateStop(i, { position: Math.min(100, Math.max(0, n)) }, true);
              }}
              className={`${inputCls} w-14 font-mono text-right text-[11px]`}
              aria-label={`Pozycja stopu ${i + 1} (%)`}
            />
            <span className="text-[10px] text-slate-500">%</span>
            <div className="flex-1 min-w-0">
              <SmoothSlider
                min={0}
                max={100}
                step={1}
                value={stop.position}
                onChange={(n) => updateStop(i, { position: n }, true)}
                onLivePreview={(n) => updateStop(i, { position: n }, false)}
                unit="%"
              />
            </div>
            <button
              type="button"
              onClick={() => removeStop(i)}
              disabled={gradient.stops.length <= 2}
              className="p-0.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:hover:text-slate-500 disabled:hover:bg-transparent transition-colors flex-shrink-0"
              title="Usuń przystanek"
              data-testid={`gradient-remove-stop-${i}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {allowClear && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="w-full py-1 rounded text-[10px] font-semibold text-slate-400 hover:text-red-300 hover:bg-red-500/10 border border-white/5 transition-colors"
          data-testid="gradient-clear"
        >
          Usuń gradient
        </button>
      )}
    </div>
  );
};

export default GradientControl;
