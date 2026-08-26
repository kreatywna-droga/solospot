'use client';

import * as React from 'react';
import type { TextNode, TextStyle, TextAlignment, FontWeight } from '../../../text/TextDomainModel';
import { TextEditingEngine } from '../../../text/TextEditingEngine';

export interface TextInspectorPanelProps {
  readonly selectedNode: TextNode | null;
  readonly onChange?: (updatedNode: TextNode) => void;
}

const COMMON_FONTS = [
  'Inter', 'Roboto', 'Outfit', 'Playfair Display', 'Poppins', 'Montserrat', 'Open Sans', 'Lato'
];

const TYPOGRAPHY_PRESETS: { name: string; style: Partial<TextStyle> }[] = [
  { name: 'Display Title', style: { fontSize: 48, fontWeight: '700', lineHeight: 1.1, letterSpacing: -1 } },
  { name: 'Heading 1', style: { fontSize: 32, fontWeight: '700', lineHeight: 1.2, letterSpacing: -0.5 } },
  { name: 'Heading 2', style: { fontSize: 24, fontWeight: '600', lineHeight: 1.3, letterSpacing: 0 } },
  { name: 'Subheading', style: { fontSize: 18, fontWeight: '500', lineHeight: 1.4, letterSpacing: 0.2 } },
  { name: 'Body', style: { fontSize: 16, fontWeight: '400', lineHeight: 1.5, letterSpacing: 0 } },
  { name: 'Caption', style: { fontSize: 12, fontWeight: '400', lineHeight: 1.4, letterSpacing: 0.5 } },
];

export const TextInspectorPanel: React.FC<TextInspectorPanelProps> = ({
  selectedNode,
  onChange,
}) => {
  if (!selectedNode) {
    return (
      <div className="text-inspector-panel p-4 text-xs text-slate-500 italic select-none" data-testid="text-inspector-empty">
        No text node selected
      </div>
    );
  }

  const { style } = selectedNode;

  const handleStyleChange = (delta: Partial<TextStyle>) => {
    if (onChange && selectedNode) {
      onChange(TextEditingEngine.updateStyle(selectedNode, delta));
    }
  };

  return (
    <div className="text-inspector-panel flex flex-col gap-4 p-3 bg-slate-900 text-slate-100 text-xs rounded border border-slate-800 select-none" data-testid="text-inspector-panel">
      <div className="font-bold text-slate-300 border-b border-slate-800 pb-1">
        Typography Inspector
      </div>

      {/* Typography Presets */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Presets</label>
        <div className="grid grid-cols-2 gap-1">
          {TYPOGRAPHY_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleStyleChange(preset.style)}
              className="px-2 py-1 bg-slate-800 hover:bg-violet-900/60 border border-slate-700 rounded text-left text-[11px] font-medium text-slate-200 transition-colors"
              data-testid={`preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Font Family & Weight */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Font Family</label>
        <select
          value={style.fontFamily}
          onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-violet-500"
          data-testid="font-family-select"
        >
          {COMMON_FONTS.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      {/* Font Size & Line Height */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Size (px)</label>
          <input
            type="number"
            min={1}
            max={200}
            value={style.fontSize}
            onChange={(e) => handleStyleChange({ fontSize: Math.max(1, Number(e.target.value)) })}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-violet-500"
            data-testid="font-size-input"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Line Height</label>
          <input
            type="number"
            step={0.1}
            min={0.5}
            max={3.0}
            value={style.lineHeight}
            onChange={(e) => handleStyleChange({ lineHeight: Number(e.target.value) })}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-violet-500"
            data-testid="line-height-input"
          />
        </div>
      </div>

      {/* Letter Spacing & Color */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Spacing</label>
          <input
            type="number"
            step={0.5}
            value={style.letterSpacing}
            onChange={(e) => handleStyleChange({ letterSpacing: Number(e.target.value) })}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-violet-500"
            data-testid="letter-spacing-input"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Fill Color</label>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={style.fill.startsWith('#') ? style.fill : '#000000'}
              onChange={(e) => handleStyleChange({ fill: e.target.value })}
              className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
              data-testid="text-color-picker"
            />
            <input
              type="text"
              value={style.fill}
              onChange={(e) => handleStyleChange({ fill: e.target.value })}
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-violet-500"
              data-testid="text-color-input"
            />
          </div>
        </div>
      </div>

      {/* Alignment Controls */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Alignment</label>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
          {(['left', 'center', 'right', 'justify'] as TextAlignment[]).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => handleStyleChange({ align })}
              className={`flex-1 py-1 rounded text-[11px] capitalize font-bold transition-colors ${
                style.align === align ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
              data-testid={`align-${align}`}
            >
              {align[0].toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TextInspectorPanel;
