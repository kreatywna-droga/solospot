'use client'

/**
 * StylePanel — Global Design System & Theme Tokens (SoloSpot Builder 2.0)
 *
 * Manages:
 *   - Global Colors (Primary, Secondary, Background, Text, Accent, Border)
 *   - Global Typography (Heading & Body font families, base size, line heights)
 *   - Global Spacing & Border Radius tokens
 *   - Curated Theme Palettes (One-click presets)
 */

import { useState } from 'react'
import {
  Palette, Type, Sliders, Sparkles, Check,
  RotateCcw, Layers, Layout, Paintbrush,
} from 'lucide-react'
import { useBuilder } from '../state/BuilderProvider'

const FONT_OPTIONS = [
  { label: 'Inter (Domyślny / Modern)', value: 'Inter' },
  { label: 'Outfit (Geometric / Premium)', value: 'Outfit' },
  { label: 'Plus Jakarta Sans (Clean Tech)', value: 'Plus Jakarta Sans' },
  { label: 'Playfair Display (Luksusowy Serif)', value: 'Playfair Display' },
  { label: 'Space Grotesk (Tech / Cyber)', value: 'Space Grotesk' },
  { label: 'Roboto (Klasyczny Sans)', value: 'Roboto' },
  { label: 'Poppins (Przyjazny Sans)', value: 'Poppins' },
]

const THEME_PRESETS = [
  {
    name: 'SoloSpot Violet (Domyślny)',
    primary: '#7c3aed',
    secondary: '#d946ef',
    background: '#090910',
    font: 'Inter',
    radius: '12px',
  },
  {
    name: 'Cyber Neon',
    primary: '#06b6d4',
    secondary: '#3b82f6',
    background: '#050714',
    font: 'Space Grotesk',
    radius: '8px',
  },
  {
    name: 'Luksusowe Złoto (Luxury Gold)',
    primary: '#d97706',
    secondary: '#fbbf24',
    background: '#0a0a0c',
    font: 'Playfair Display',
    radius: '4px',
  },
  {
    name: 'Minimal Noir',
    primary: '#ffffff',
    secondary: '#a1a1aa',
    background: '#000000',
    font: 'Outfit',
    radius: '16px',
  },
  {
    name: 'Szmaragdowy Las (Emerald Wave)',
    primary: '#10b981',
    secondary: '#06b6d4',
    background: '#04100c',
    font: 'Plus Jakarta Sans',
    radius: '10px',
  },
]

export function StylePanel() {
  const { document, dispatch } = useBuilder()
  const theme = document.theme
  const tokens = theme.tokens ?? {}

  const [activeSubTab, setActiveSubTab] = useState<'colors' | 'typography' | 'tokens' | 'presets'>('colors')

  const updateColor = (key: 'primaryColor' | 'secondaryColor' | 'backgroundColor', value: string) => {
    dispatch({
      type: 'UPDATE_THEME',
      theme: { [key]: value },
    })
  }

  const updateFont = (fontName: string) => {
    dispatch({
      type: 'UPDATE_THEME',
      theme: { font: fontName },
    })
  }

  const updateRadius = (radiusVal: string) => {
    dispatch({
      type: 'UPDATE_THEME',
      theme: { borderRadius: radiusVal },
    })
  }

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    dispatch({
      type: 'UPDATE_THEME',
      theme: {
        primaryColor: preset.primary,
        secondaryColor: preset.secondary,
        backgroundColor: preset.background,
        font: preset.font,
        borderRadius: preset.radius,
      },
    })
  }

  return (
    <div className="flex flex-col h-full bg-[#06060c] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-violet-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Design System & Styl</h2>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-[#080810]">
        {[
          { id: 'colors', label: 'Kolory', icon: Palette },
          { id: 'typography', label: 'Typografia', icon: Type },
          { id: 'tokens', label: 'Tokeny', icon: Sliders },
          { id: 'presets', label: 'Presety', icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeSubTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* TAB: COLORS */}
        {activeSubTab === 'colors' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Kolor Główny (Primary Brand)</label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={theme.primaryColor || '#7c3aed'}
                  onChange={e => updateColor('primaryColor', e.target.value)}
                  className="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={theme.primaryColor || '#7c3aed'}
                  onChange={e => updateColor('primaryColor', e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Kolor Akcentu (Secondary / Accent)</label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={theme.secondaryColor || '#d946ef'}
                  onChange={e => updateColor('secondaryColor', e.target.value)}
                  className="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={theme.secondaryColor || '#d946ef'}
                  onChange={e => updateColor('secondaryColor', e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Domyślne Tło Strony (Background)</label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={theme.backgroundColor || '#090910'}
                  onChange={e => updateColor('backgroundColor', e.target.value)}
                  className="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={theme.backgroundColor || '#090910'}
                  onChange={e => updateColor('backgroundColor', e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Visual preview swatch */}
            <div className="p-3 rounded-xl border border-white/10 bg-black/40 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Podgląd palety:</span>
              <div className="h-10 rounded-lg flex overflow-hidden border border-white/10 shadow-inner">
                <div className="flex-1 flex items-center justify-center text-[10px] font-bold text-white shadow" style={{ backgroundColor: theme.primaryColor }}>
                  Primary
                </div>
                <div className="flex-1 flex items-center justify-center text-[10px] font-bold text-white shadow" style={{ backgroundColor: theme.secondaryColor }}>
                  Accent
                </div>
                <div className="flex-1 flex items-center justify-center text-[10px] font-mono text-slate-400" style={{ backgroundColor: theme.backgroundColor || '#090910' }}>
                  BG
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: TYPOGRAPHY */}
        {activeSubTab === 'typography' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Główny Krój Pisma (Font Family)</label>
              <select
                value={theme.font || 'Inter'}
                onChange={e => updateFont(e.target.value)}
                className="w-full bg-[#0c0c16] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              >
                {FONT_OPTIONS.map(font => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Typography scale preview */}
            <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Skala typograficzna ({theme.font || 'Inter'}):</span>
              <div className="space-y-2">
                <div className="text-xl font-bold text-white truncate">Nagłówek H1 (Heading 1)</div>
                <div className="text-base font-semibold text-slate-200 truncate">Nagłówek H2 (Heading 2)</div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  Tekst akapitowy: Nowoczesna platforma sklepowa nowej generacji oferująca natywne wsparcie dla visual composera.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DESIGN TOKENS */}
        {activeSubTab === 'tokens' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Zaokrąglenie Rogów (Border Radius)</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Ostre (0px)', val: '0px' },
                  { label: 'Małe (6px)', val: '6px' },
                  { label: 'Średnie (12px)', val: '12px' },
                  { label: 'Pigułka (99px)', val: '99px' },
                ].map(r => (
                  <button
                    key={r.val}
                    onClick={() => updateRadius(r.val)}
                    className={`py-2 px-1 rounded-lg border text-center transition-all ${
                      theme.borderRadius === r.val
                        ? 'border-violet-500 bg-violet-600/20 text-white font-bold'
                        : 'border-white/10 hover:border-white/20 bg-white/5 text-slate-400'
                    }`}
                  >
                    <div className="w-4 h-4 mx-auto mb-1 border border-white/40" style={{ borderRadius: r.val }} />
                    <span className="text-[10px] block truncate">{r.val}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
              <span className="text-[11px] font-bold text-slate-300">Globalne Tokeny CSS:</span>
              <pre className="text-[10px] font-mono text-violet-300 bg-black/60 p-2.5 rounded-lg overflow-x-auto">
{`:root {
  --primary: ${theme.primaryColor || '#7c3aed'};
  --secondary: ${theme.secondaryColor || '#d946ef'};
  --font-sans: "${theme.font || 'Inter'}", sans-serif;
  --radius: ${theme.borderRadius || '8px'};
}`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB: PRESET PALETTES */}
        {activeSubTab === 'presets' && (
          <div className="space-y-2.5">
            {THEME_PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all text-left group"
              >
                <div className="space-y-1">
                  <div className="font-bold text-xs text-white group-hover:text-violet-300 transition-colors">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>Font: {preset.font}</span>
                    <span>•</span>
                    <span>Radius: {preset.radius}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: preset.primary }} />
                  <span className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: preset.secondary }} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
