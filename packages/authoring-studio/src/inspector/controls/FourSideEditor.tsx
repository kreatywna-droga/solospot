'use client';

/**
 * FourSideEditor — canonical padding/margin editor (ONE system).
 * Linked master slider (SmoothSlider, pointerup commit) or per-side editing.
 */

import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { SmoothSlider } from './SmoothSlider';

export type FourSide = { top?: string; right?: string; bottom?: string; left?: string };

export interface FourSideEditorProps {
  label: string;
  value?: FourSide | string;
  onChange: (v: FourSide) => void;
}

export const FourSideEditor: React.FC<FourSideEditorProps> = ({ label, value, onChange }) => {
  const [linked, setLinked] = useState(true);

  const parsed: FourSide =
    value && typeof value === 'object'
      ? value
      : typeof value === 'string'
      ? { top: value, right: value, bottom: value, left: value }
      : {};

  const handleSide = (side: keyof FourSide, v: string) => {
    if (linked) onChange({ top: v, right: v, bottom: v, left: v });
    else onChange({ ...parsed, [side]: v });
  };

  const sides: { key: keyof FourSide; short: string }[] = [
    { key: 'top', short: 'T' },
    { key: 'right', short: 'R' },
    { key: 'bottom', short: 'B' },
    { key: 'left', short: 'L' },
  ];

  const masterVal = parseInt(parsed.top || '0', 10) || 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-slate-400 font-medium">{label}</span>
        <button
          type="button"
          onClick={() => setLinked((v) => !v)}
          className={`px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 transition-colors ${
            linked
              ? 'text-[#D9A86C] bg-[#D9A86C]/20 border border-[#D9A86C]/30'
              : 'text-slate-500 hover:text-white bg-white/5'
          }`}
          title={linked ? 'Rozłącz boki (edytuj każdy osobno)' : 'Połącz wszystkie boki'}
        >
          <Lock className="w-3 h-3" />
          <span className="text-[9px]">{linked ? 'Połączone' : 'Osobno'}</span>
        </button>
      </div>

      {linked ? (
        <div className="flex items-center gap-2 bg-[#18181B] p-2 rounded-lg border border-white/5">
          <div className="flex-1">
            <SmoothSlider
              min={0}
              max={120}
              step={1}
              value={masterVal}
              onChange={(n) => {
                const v = `${n}px`;
                onChange({ top: v, right: v, bottom: v, left: v });
              }}
              unit="px"
            />
          </div>
          <div className="flex items-center">
            <input
              type="number"
              min={0}
              max={999}
              value={masterVal}
              onChange={(e) => {
                const v = `${e.target.value || '0'}px`;
                onChange({ top: v, right: v, bottom: v, left: v });
              }}
              className="w-12 bg-[#18181B] border border-white/10 rounded px-1 py-0.5 text-[11px] text-white text-right focus:outline-none focus:border-[#D9A86C]/60 font-mono"
            />
            <span className="text-[10px] text-slate-500 ml-1">px</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 bg-[#18181B] p-2 rounded-lg border border-white/5">
          {sides.map(({ key, short }) => {
            const sideVal = parseInt(parsed[key] || '0', 10) || 0;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="w-8 text-[10px] font-bold text-slate-400 uppercase">{short}:</span>
                <div className="flex-1">
                  <SmoothSlider
                    min={0}
                    max={120}
                    step={1}
                    value={sideVal}
                    onChange={(n) => handleSide(key, `${n}px`)}
                    unit="px"
                  />
                </div>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={sideVal}
                  onChange={(e) => handleSide(key, `${e.target.value || '0'}px`)}
                  className="w-12 bg-[#18181B] border border-white/10 rounded px-1 py-0.5 text-[11px] text-white text-right focus:outline-none focus:border-[#D9A86C]/60 font-mono"
                />
                <span className="text-[10px] text-slate-500">px</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FourSideEditor;
