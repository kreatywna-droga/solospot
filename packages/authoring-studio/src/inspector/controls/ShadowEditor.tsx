'use client';

/**
 * ShadowEditor — canonical box-shadow editor (ONE system).
 * X/Y/Blur/Spread/Opacity via SmoothSlider (pointerup single commit) + colour swatch.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SmoothSlider } from './SmoothSlider';
import { ColorControl } from './ColorControl';
import { parseBoxShadow, buildBoxShadow, type BoxShadowValue } from './boxShadow';

export interface ShadowEditorProps {
  value?: string;
  onChange: (v: string) => void;
  onLivePreview?: (v: string) => void;
}

export const ShadowEditor: React.FC<ShadowEditorProps> = ({ value, onChange, onLivePreview }) => {
  const shadow = useMemo(() => parseBoxShadow(value), [value]);
  const [local, setLocal] = useState<BoxShadowValue>(shadow);
  useEffect(() => {
    setLocal(shadow);
  }, [value]);

  const apply = useCallback(
    (next: BoxShadowValue, commit: boolean) => {
      setLocal(next);
      const css = buildBoxShadow(next);
      if (commit) onChange(css);
      else onLivePreview?.(css);
    },
    [onChange, onLivePreview],
  );

  const live = useCallback(
    (patch: Partial<BoxShadowValue>) => apply({ ...local, ...patch }, false),
    [apply, local],
  );
  const commit = useCallback(
    (patch: Partial<BoxShadowValue>) => apply({ ...local, ...patch }, true),
    [apply, local],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">Shadow</span>
        <button
          type="button"
          onClick={() => commit({ enabled: !local.enabled })}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
            local.enabled ? 'bg-[#D9A86C] text-white' : 'bg-white/5 text-slate-500 hover:text-white'
          }`}
        >
          {local.enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      {local.enabled && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { key: 'x' as const, label: 'X', min: -50, max: 50 },
                { key: 'y' as const, label: 'Y', min: -50, max: 50 },
                { key: 'blur' as const, label: 'Blur', min: 0, max: 100 },
                { key: 'spread' as const, label: 'Spread', min: -50, max: 50 },
              ]
            ).map(({ key, label, min, max }) => (
              <div key={key}>
                <label className="text-[10px] text-slate-500">{label}</label>
                <SmoothSlider
                  min={min}
                  max={max}
                  step={1}
                  value={local[key]}
                  onChange={(n) => commit({ [key]: n })}
                  onLivePreview={(n) => live({ [key]: n })}
                  unit="px"
                />
                <div className="text-[10px] text-slate-400 text-right font-mono">{local[key]}px</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-[110px] flex-shrink-0">
              <ColorControl compact value={local.color} onChange={(c) => commit({ color: c })} title="Kolor cienia" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-slate-500">Opacity</label>
              <SmoothSlider
                min={0}
                max={1}
                step={0.01}
                value={local.opacity}
                onChange={(n) => commit({ opacity: n })}
                onLivePreview={(n) => live({ opacity: n })}
                unit=""
              />
            </div>
            <div className="text-[10px] text-slate-400 font-mono w-10 text-right">
              {Math.round(local.opacity * 100)}%
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShadowEditor;
